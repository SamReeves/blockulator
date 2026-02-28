#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

# Lookup table for sqrt initial estimates
# Row 0: sqrt(d) for d = 0..9
# Row 1: sqrt(1.d) for d = 0..9 (i.e., sqrt(1.0000000000) to sqrt(1.9000000000))
# Row 2: sqrt(1.0d) for d = 0..9 (i.e., sqrt(1.0000000000) to sqrt(1.0900000000))
# Row 3: sqrt(1.00d) for d = 0..9 (i.e., sqrt(1.0000000000) to sqrt(1.0090000000))
# Row 4: sqrt(1.000d) for d = 0..9 (i.e., sqrt(1.0000000000) to sqrt(1.0009000000))
# All values computed with 50-digit precision using Python Decimal
SQRT_TAB: constant(decimal[10][5]) = [
    [0.0000000000, 1.0000000000, 1.4142135624, 1.7320508076, 2.0000000000, 2.2360679775, 2.4494897428, 2.6457513111, 2.8284271247, 3.0000000000],
    [1.0000000000, 1.0488088482, 1.0954451150, 1.1401754251, 1.1832159566, 1.2247448714, 1.2649110641, 1.3038404810, 1.3416407865, 1.3784048752],
    [1.0000000000, 1.0049875621, 1.0099504938, 1.0148891565, 1.0198039027, 1.0246950766, 1.0295630141, 1.0344080433, 1.0392304845, 1.0440306509],
    [1.0000000000, 1.0004998751, 1.0009995005, 1.0014988767, 1.0019980040, 1.0024968828, 1.0029955134, 1.0034938963, 1.0039920318, 1.0044899203],
    [1.0000000000, 1.0000499988, 1.0000999950, 1.0001499888, 1.0001999800, 1.0002499688, 1.0002999550, 1.0003499388, 1.0003999200, 1.0004498988]
]

SQRT_2: constant(decimal) = 1.4142135624
SQRT_10: constant(decimal) = 3.1622776602

@external
@pure
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate sqrt(x) - square root (FREE - no gas cost)
    @param x The input value (must be >= 0)
    @return The result of sqrt(x)
    """
    assert x >= 0.0000000000, "Square root undefined for negative numbers"
    
    if x == 0.0000000000:
        return 0.0000000000
    
    return self._sqrt(x)

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get sqrt(2)
    @return The constant sqrt(2) = 1.4142135624
    """
    return SQRT_2

@internal
@pure
def _sqrt(_x: decimal) -> decimal:
    """
    @notice Internal function to calculate sqrt(x) using Newton-Raphson
    @param _x The input value
    @return The result of sqrt(x)
    """
    x: decimal = _x
    
    # Normalize to [1, 10) and track scaling
    scale_factor: decimal = 1.0000000000
    
    # Handle large numbers: divide by 100, multiply result by 10
    for _: uint256 in range(50):
        if x >= 10.0000000000:
            x /= 100.0000000000
            scale_factor *= 10.0000000000
        else:
            break
    
    # Check if number is too large
    assert x < 10.0000000000, "Input number too large for sqrt calculation"
    
    # Handle small numbers: multiply by 100, divide result by 10
    for _: uint256 in range(50):
        if x < 1.0000000000:
            x *= 100.0000000000
            scale_factor /= 10.0000000000
        else:
            break
    
    # Check if number is too small (but not zero, which is handled earlier)
    assert x >= 1.0000000000, "Input number too small for sqrt calculation"
    
    # Now x is in [1, 10), get initial estimate from lookup table
    int_part: uint256 = convert(x, uint256)
    assert int_part <= 9, "Normalization failed: value out of range"
    estimate: decimal = SQRT_TAB[0][int_part]
    
    # Refine with fractional parts
    x_work: decimal = x - convert(int_part, decimal)  # Get fractional part
    for i: uint256 in range(1, 5):
        x_work *= 10.0000000000
        frac_digit: uint256 = convert(x_work, uint256)
        assert frac_digit <= 9, "Invalid fractional digit in sqrt calculation"
        estimate *= SQRT_TAB[i][frac_digit]
        x_work -= convert(frac_digit, decimal)  # Remove the digit we just extracted
    
    # Newton-Raphson iterations: x_new = (x_old + n/x_old) / 2
    # 3 iterations gives us ~10 decimal places of accuracy
    # Perform iterations on normalized x to avoid overflow
    for _: uint256 in range(3):
        assert estimate > 0.0000000000, "Estimate became zero during iteration"
        estimate = (estimate + x / estimate) / 2.0000000000
    
    return estimate * scale_factor

