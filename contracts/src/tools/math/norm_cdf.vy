#pragma enable-decimals
# @version 0.4.3
# @author L1Ca$h

# Normal (Gaussian) Cumulative Distribution Function
# Φ(x) = P(X ≤ x) for X ~ N(μ, σ²)
# Uses the formula: Φ(x) = 0.5 * [1 + erf((x - μ) / (σ * √2))]
# Composes existing erf calculation inline (Abramowitz-Stegun approximation)

# Constants for erf approximation (Abramowitz-Stegun formula 7.1.26)
P: constant(decimal) = 0.3275911000
A1: constant(decimal) = 0.2548295920
A2: constant(decimal) = -0.2844967360
A3: constant(decimal) = 1.4214137410
A4: constant(decimal) = -1.4531520270
A5: constant(decimal) = 1.0614054290

# Mathematical constants
SQRT_2: constant(decimal) = 1.4142135624  # √2
INV_SQRT_2: constant(decimal) = 0.7071067812  # 1/√2

# Lookup table for e^(-x^2)
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
def calculate(x: decimal, mu: decimal = 0.0, sigma: decimal = 1.0) -> decimal:
    """
    @notice Calculate CDF of normal distribution N(μ, σ²) (FREE - no gas cost)
    @param x The value to evaluate
    @param mu Mean (default 0.0 for standard normal)
    @param sigma Standard deviation (default 1.0 for standard normal)
    @return P(X ≤ x) for X ~ N(μ, σ²)
    """
    assert sigma > 0.0, "Standard deviation must be positive"
    
    # Standardize: z = (x - μ) / σ
    z: decimal = (x - mu) / sigma
    
    # Φ(x) = 0.5 * [1 + erf(z / √2)]
    z_normalized: decimal = z * INV_SQRT_2
    erf_val: decimal = self._erf(z_normalized)
    
    return 0.5 * (1.0 + erf_val)

@external
@pure
def standard_cdf(z: decimal) -> decimal:
    """
    @notice Calculate CDF of standard normal N(0, 1) (FREE - no gas cost)
    @param z The standardized value
    @return P(Z ≤ z) for Z ~ N(0, 1)
    """
    z_normalized: decimal = z * INV_SQRT_2
    erf_val: decimal = self._erf(z_normalized)
    return 0.5 * (1.0 + erf_val)

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get √2 constant
    @return The constant √2 = 1.4142135624
    """
    return SQRT_2

@internal
@pure
def _erf(x: decimal) -> decimal:
    """
    @notice Calculate erf(x) using Abramowitz-Stegun approximation
    @dev Inlined from erf.vy for composition
    @param x The input value
    @return The result of erf(x)
    """
    if x == 0.0:
        return 0.0
    
    # Handle negative values: erf(-x) = -erf(x)
    sign: decimal = 1.0
    abs_x: decimal = x
    if x < 0.0:
        sign = -1.0
        abs_x = -x
    
    # For |x| >= 5, erf(x) ≈ ±1
    if abs_x >= 5.0:
        return sign
    
    # Abramowitz-Stegun approximation
    t: decimal = 1.0 / (1.0 + P * abs_x)
    t2: decimal = t * t
    t3: decimal = t2 * t
    t4: decimal = t3 * t
    t5: decimal = t4 * t
    
    poly: decimal = A1 * t + A2 * t2 + A3 * t3 + A4 * t4 + A5 * t5
    
    # Get e^(-x^2) from lookup table
    exp_neg_x_sq: decimal = self._exp_neg_square(abs_x)
    
    # erf(x) = 1 - poly * e^(-x^2)
    result: decimal = 1.0 - poly * exp_neg_x_sq
    
    return sign * result

@internal
@pure
def _exp_neg_square(x: decimal) -> decimal:
    """
    @notice Calculate e^(-x^2) using lookup table with linear interpolation
    @param x The input value (must be >= 0)
    @return The result of e^(-x^2)
    """
    # Table covers [0, 3.5] in steps of 0.1
    if x >= 3.5:
        return 0.0
    
    # Find position in table
    pos: decimal = x * 10.0  # Convert to table index scale
    idx: uint256 = convert(pos, uint256)
    
    # If exact index or at end, return table value
    if idx >= 35:
        return EXP_NEG_X_SQ[35]
    
    # Linear interpolation between table values
    frac: decimal = pos - convert(idx, decimal)
    val_low: decimal = EXP_NEG_X_SQ[idx]
    val_high: decimal = EXP_NEG_X_SQ[idx + 1]
    
    return val_low + frac * (val_high - val_low)
