#pragma enable-decimals
# @version 0.4.3
# @author L1Ca$h

# General exponential function e^x
# Lookup table for calculating e^x using digit-by-digit multiplication
# Row i contains e^(d * 10^(-i)) for d = 0..9
# Identical to constants/e.vy but placed in math/ for semantic consistency

TAB: constant(decimal[10][11]) = [
    [1.0000000000, 2.7182818285, 7.3890560989, 20.0855369232, 54.5981500331, 148.4131591026, 403.4287934927, 1096.6331584285, 2980.9579870417, 8103.0839275754],
    [1.0000000000, 1.1051709181, 1.2214027582, 1.3498588076, 1.4918246976, 1.6487212707, 1.8221188004, 2.0137527075, 2.2255409285, 2.4596031112],
    [1.0000000000, 1.0100501671, 1.0202013400, 1.0304545340, 1.0408107742, 1.0512710964, 1.0618365465, 1.0725081813, 1.0832870677, 1.0941742837],
    [1.0000000000, 1.0010005002, 1.0020020013, 1.0030045045, 1.0040080107, 1.0050125209, 1.0060180361, 1.0070245573, 1.0080320855, 1.0090406218],
    [1.0000000000, 1.0001000050, 1.0002000200, 1.0003000450, 1.0004000800, 1.0005001250, 1.0006001800, 1.0007002451, 1.0008003201, 1.0009004051],
    [1.0000000000, 1.0000100001, 1.0000200002, 1.0000300005, 1.0000400008, 1.0000500013, 1.0000600018, 1.0000700025, 1.0000800032, 1.0000900041],
    [1.0000000000, 1.0000010000, 1.0000020000, 1.0000030000, 1.0000040000, 1.0000050000, 1.0000060000, 1.0000070000, 1.0000080000, 1.0000090000],
    [1.0000000000, 1.0000001000, 1.0000002000, 1.0000003000, 1.0000004000, 1.0000005000, 1.0000006000, 1.0000007000, 1.0000008000, 1.0000009000],
    [1.0000000000, 1.0000000100, 1.0000000200, 1.0000000300, 1.0000000400, 1.0000000500, 1.0000000600, 1.0000000700, 1.0000000800, 1.0000000900],
    [1.0000000000, 1.0000000010, 1.0000000020, 1.0000000030, 1.0000000040, 1.0000000050, 1.0000000060, 1.0000000070, 1.0000000080, 1.0000000090],
    [1.0000000000, 1.0000000001, 1.0000000002, 1.0000000003, 1.0000000004, 1.0000000005, 1.0000000006, 1.0000000007, 1.0000000008, 1.0000000009]
]

# Euler's number
E: constant(decimal) = 2.7182818285

@external
@pure
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate e^x (FREE - no gas cost)
    @param x The exponent (must be in range [0, 10))
    @return The result of e^x
    """
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"
    return self._exp(x)

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get Euler's number (e)
    @return The constant e = 2.718281828
    """
    return E

@internal
@pure
def _exp(_x: decimal) -> decimal:
    """
    @notice Internal function to calculate e^x using digit-by-digit method
    @param _x The exponent
    @return The result of e^x
    """
    x: decimal = _x
    y: decimal = 1.0
    for i: uint256 in range(11):
        if x != 0.0:
            d: uint256 = convert(x, uint256)
            y *= TAB[i][d]
            x -= convert(d, decimal)
            x *= 10.0
        else:
            break
    return y
