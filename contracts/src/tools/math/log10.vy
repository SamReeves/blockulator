#pragma enable-decimals
# @version 0.4.0
# @author L1Ca$h

# Lookup table for calculating log10(x) using digit-by-digit extraction
# Row i contains 10^(d * 10^(-i)) for d = 0..9
# Same table structure as 10^x, but used inversely

TAB: constant(decimal[10][11]) = [
    [1.0000000000, 10.0000000000, 100.0000000000, 1000.0000000000, 10000.0000000000, 100000.0000000000, 1000000.0000000000, 10000000.0000000000, 100000000.0000000000, 1000000000.0000000000],
    [1.0000000000, 1.2589254118, 1.5848931925, 1.9952623150, 2.5118864315, 3.1622776602, 3.9810717055, 5.0118723363, 6.3095734448, 7.9432823472],
    [1.0000000000, 1.0232929923, 1.0471285481, 1.0715193052, 1.0964781961, 1.1220184543, 1.1481536215, 1.1748975549, 1.2022644346, 1.2302687708],
    [1.0000000000, 1.0023052381, 1.0046157903, 1.0069316689, 1.0092528861, 1.0115794543, 1.0139113857, 1.0162486929, 1.0185913881, 1.0209394837],
    [1.0000000000, 1.0002302850, 1.0004606231, 1.0006910142, 1.0009214583, 1.0011519555, 1.0013825058, 1.0016131092, 1.0018437657, 1.0020744753],
    [1.0000000000, 1.0000230261, 1.0000460528, 1.0000690799, 1.0000921076, 1.0001151359, 1.0001381646, 1.0001611939, 1.0001842238, 1.0002072541],
    [1.0000000000, 1.0000023026, 1.0000046052, 1.0000069078, 1.0000092104, 1.0000115130, 1.0000138156, 1.0000161182, 1.0000184209, 1.0000207235],
    [1.0000000000, 1.0000002303, 1.0000004605, 1.0000006908, 1.0000009210, 1.0000011513, 1.0000013816, 1.0000016118, 1.0000018421, 1.0000020723],
    [1.0000000000, 1.0000000230, 1.0000000461, 1.0000000691, 1.0000000921, 1.0000001151, 1.0000001382, 1.0000001612, 1.0000001842, 1.0000002072],
    [1.0000000000, 1.0000000023, 1.0000000046, 1.0000000069, 1.0000000092, 1.0000000115, 1.0000000138, 1.0000000161, 1.0000000184, 1.0000000207],
    [1.0000000000, 1.0000000002, 1.0000000005, 1.0000000007, 1.0000000009, 1.0000000012, 1.0000000014, 1.0000000016, 1.0000000018, 1.0000000021]
]

# Base 10 constant
BASE10: constant(decimal) = 10.0

@external
@view
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate log10(x) - common logarithm (FREE - no gas cost)
    @param x The input value (must be in range (0, 10^10])
    @return The result of log10(x)
    """
    assert x > 0.0, "Logarithm undefined for x <= 0"
    assert x <= 10000000000.0, "Input exceeds maximum (10^10)"
    return self._log10(x)

@external
@view
def get_constant() -> decimal:
    """
    @notice Get the base value (10)
    @return The constant 10.0
    """
    return BASE10

@internal
@pure
def _log10(_x: decimal) -> decimal:
    """
    @notice Internal function to calculate log10(x) using digit-by-digit extraction
    @param _x The input value
    @return The result of log10(x)
    """
    x: decimal = _x
    
    # Step 1: Normalize x to [1, 10) and track integer exponent
    int_exp: int256 = 0
    
    # Handle x >= 10
    for _: uint256 in range(20):  # Support up to 10^20
        if x >= BASE10:
            x /= BASE10
            int_exp += 1
        else:
            break
    
    # Handle x < 1
    for _: uint256 in range(20):  # Support down to 10^-20
        if x < 1.0:
            x *= BASE10
            int_exp -= 1
        else:
            break
    
    # Step 2: Extract fractional part digit by digit
    # Now x is in [1, 10), so log10(x) is in [0, 1)
    result: decimal = 0.0
    scale: decimal = 1.0
    
    for i: uint256 in range(11):
        # Try digits from 9 down to 0 to find largest that fits
        for d: uint256 in range(10):
            digit: uint256 = 9 - d  # Count down from 9 to 0
            if x >= TAB[i][digit]:
                x /= TAB[i][digit]
                result += convert(digit, decimal) * scale
                break
        scale /= 10.0
    
    # Add integer exponent
    return convert(int_exp, decimal) + result

