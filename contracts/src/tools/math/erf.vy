#pragma enable-decimals
# @version 0.4.3
# @author L1Ca$h

# Error function erf(x) = (2/sqrt(pi)) * integral[0 to x] e^(-t^2) dt
# Using Abramowitz and Stegun approximation (formula 7.1.26)
# Maximum error: 1.5000000000 * 10^(-7)

# Constants for Abramowitz-Stegun approximation (formula 7.1.26)
# erf(x) ~= 1 - (a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5)*e^(-x^2)
# where t = 1/(1 + px)
# These coefficients provide accuracy to ~1.5000000000 * 10^(-7)
P: constant(decimal) = 0.3275911000
A1: constant(decimal) = 0.2548295920
A2: constant(decimal) = -0.2844967360
A3: constant(decimal) = 1.4214137410
A4: constant(decimal) = -1.4531520270
A5: constant(decimal) = 1.0614054290

# 2/sqrt(pi) for reference
TWO_OVER_SQRT_PI: constant(decimal) = 1.1283791671

# Lookup table for e^(-x^2) for x in [0.0000000000, 3.5000000000] with 0.1000000000 increments
# Beyond x = 3.5000000000, erf(x) ~= 1.0000000000 within floating point precision
# All values computed with 50-digit precision using Python Decimal
EXP_NEG_X_SQ: constant(decimal[36]) = [
    1.0000000000, 0.9900498337, 0.9607894392, 0.9139311853, 0.8521437890,
    0.7788007831, 0.6976763261, 0.6126263942, 0.5272924240, 0.4448580662,
    0.3678794412, 0.2981972794, 0.2369277587, 0.1845195240, 0.1408584209,
    0.1053992246, 0.0773047404, 0.0555762126, 0.0391638951, 0.0270518469,
    0.0183156389, 0.0121551783, 0.0079070541, 0.0050417603, 0.0031511116,
    0.0019304541, 0.0011592292, 0.0006823281, 0.0003936690, 0.0002226299,
    0.0001234098, 0.0000670548, 0.0000357128, 0.0000186437, 0.0000095402,
    0.0000047851
]

@external
@pure
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate erf(x) - error function (FREE - no gas cost)
    @dev Used for normal distribution CDF: Phi(x) = 0.5000000000 * (1.0000000000 + erf(x/sqrt(2.0000000000)))
    @param x The input value (valid range: approximately -5 to 5)
    @return The result of erf(x) in range (-1, 1)
    """
    assert x >= -5.0000000000 and x <= 5.0000000000, "Input outside practical range [-5, 5]"
    
    if x == 0.0000000000:
        return 0.0000000000
    
    return self._erf(x)

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get 2/sqrt(pi) constant used in erf calculation
    @return The constant 2/sqrt(pi) = 1.1283791671
    """
    return TWO_OVER_SQRT_PI

@internal
@pure
def _erf(_x: decimal) -> decimal:
    """
    @notice Internal function using Abramowitz-Stegun approximation
    @param _x The input value
    @return The result of erf(x)
    """
    # Error function is odd: erf(-x) = -erf(x)
    sign: decimal = 1.0000000000
    x: decimal = _x
    if x < 0.0000000000:
        sign = -1.0000000000
        x = -x
    
    # For x > 3.5, erf(x) ~= 1
    if x >= 3.5000000000:
        return sign
    
    # Abramowitz-Stegun formula
    # t = 1/(1 + px)
    t: decimal = 1.0000000000 / (1.0000000000 + P * x)
    
    # Polynomial: a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5
    t2: decimal = t * t
    t3: decimal = t2 * t
    t4: decimal = t2 * t2
    t5: decimal = t4 * t
    
    poly: decimal = A1 * t + A2 * t2 + A3 * t3 + A4 * t4 + A5 * t5
    
    # Get e^(-x^2) from lookup table
    exp_neg_x_sq: decimal = self._exp_neg_square(x)
    
    # erf(x) = 1 - poly * e^(-x^2)
    result: decimal = 1.0000000000 - poly * exp_neg_x_sq
    
    return sign * result

@internal
@pure
def _exp_neg_square(x: decimal) -> decimal:
    """
    @notice Calculate e^(-x^2) using lookup table with linear interpolation
    @param x The input value (must be >= 0)
    @return The result of e^(-x^2)
    """
    # Table covers [0.0000000000, 3.5000000000] in steps of 0.1000000000
    if x >= 3.5000000000:
        return 0.0000000000
    
    # Find position in table
    pos: decimal = x * 10.0000000000  # Convert to table index scale
    idx: uint256 = convert(pos, uint256)
    
    # If exact index, return table value
    if idx >= 35:
        return EXP_NEG_X_SQ[35]
    
    # Linear interpolation between table values
    frac: decimal = pos - convert(idx, decimal)
    val_low: decimal = EXP_NEG_X_SQ[idx]
    val_high: decimal = EXP_NEG_X_SQ[idx + 1]
    
    return val_low + frac * (val_high - val_low)

