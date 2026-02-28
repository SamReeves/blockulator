#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

# Lookup table for calculating 2^x using digit-by-digit multiplication
# Row i contains 2^(d * 10^(-i)) for d = 0..9
# This uses the same method as e^x, pi^x, tau^x

TAB: constant(decimal[10][11]) = [
    [1.0000000000, 2.0000000000, 4.0000000000, 8.0000000000, 16.0000000000, 32.0000000000, 64.0000000000, 128.0000000000, 256.0000000000, 512.0000000000],
    [1.0000000000, 1.0717734625, 1.1486983550, 1.2311444133, 1.3195079108, 1.4142135624, 1.5157165665, 1.6245047927, 1.7411011266, 1.8660659831],
    [1.0000000000, 1.0069555501, 1.0139594798, 1.0210121257, 1.0281138267, 1.0352649238, 1.0424657608, 1.0497166836, 1.0570180406, 1.0643701825],
    [1.0000000000, 1.0006933875, 1.0013872557, 1.0020816051, 1.0027764359, 1.0034717485, 1.0041675432, 1.0048638204, 1.0055605804, 1.0062578235],
    [1.0000000000, 1.0000693171, 1.0001386390, 1.0002079658, 1.0002772973, 1.0003466337, 1.0004159748, 1.0004853208, 1.0005546715, 1.0006240271],
    [1.0000000000, 1.0000069315, 1.0000138630, 1.0000207946, 1.0000277263, 1.0000346580, 1.0000415897, 1.0000485215, 1.0000554533, 1.0000623852],
    [1.0000000000, 1.0000006931, 1.0000013863, 1.0000020794, 1.0000027726, 1.0000034657, 1.0000041589, 1.0000048520, 1.0000055452, 1.0000062383],
    [1.0000000000, 1.0000000693, 1.0000001386, 1.0000002079, 1.0000002773, 1.0000003466, 1.0000004159, 1.0000004852, 1.0000005545, 1.0000006238],
    [1.0000000000, 1.0000000069, 1.0000000139, 1.0000000208, 1.0000000277, 1.0000000347, 1.0000000416, 1.0000000485, 1.0000000555, 1.0000000624],
    [1.0000000000, 1.0000000007, 1.0000000014, 1.0000000021, 1.0000000028, 1.0000000035, 1.0000000042, 1.0000000049, 1.0000000055, 1.0000000062],
    [1.0000000000, 1.0000000001, 1.0000000001, 1.0000000002, 1.0000000003, 1.0000000003, 1.0000000004, 1.0000000005, 1.0000000006, 1.0000000006]
]

# Base 2 constant
BASE2: constant(decimal) = 2.0

# Maximum exponent: 2^133 ~ 1.08e40 fits in Vyper decimal (max ~1.87e40)
MAX_POW2: constant(uint256) = 133

@external
@pure
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate 2^x (FREE - no gas cost)
    @param x The exponent (must be in range [0, 133))
    @return The result of 2^x
    """
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 133.0, "The power limit is 132.999999999"
    return self._pow2_to_the(x)

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get the base value (2)
    @return The constant 2.0
    """
    return BASE2

@internal
@pure
def _pow2_to_the(_x: decimal) -> decimal:
    """
    @notice Internal function to calculate 2^x using range reduction
    @dev 2^x = 2^floor(x) * 2^frac(x)
    @param _x The exponent
    @return The result of 2^x
    """
    x: decimal = _x
    
    # Extract integer and fractional parts
    n: uint256 = convert(x, uint256)
    frac: decimal = x - convert(n, decimal)
    
    # Compute 2^n via repeated multiplication
    int_result: decimal = 1.0
    n_work: uint256 = n
    for _: uint256 in range(MAX_POW2):
        if n_work == 0:
            break
        int_result *= 2.0
        n_work -= 1
    
    # Compute 2^frac via TAB (frac is in [0, 1))
    # Multiply by 10 to extract each fractional digit
    frac_result: decimal = 1.0
    frac_work: decimal = frac * 10.0
    
    # Process fractional digits: TAB[1] is tenths, TAB[2] is hundredths, etc.
    for i: uint256 in range(1, 11):
        if frac_work == 0.0:
            break
        d: uint256 = convert(frac_work, uint256)
        frac_result *= TAB[i][d]
        frac_work -= convert(d, decimal)
        frac_work *= 10.0
    
    return int_result * frac_result
