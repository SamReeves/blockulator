s_owner: address

event Lookup:
    sender: address
    x: decimal
    y: decimal

# Lookup table for calculating e^x using digit-by-digit multiplication
# Row i contains e^(d * 10^(-i)) for d = 0..9
# Accurate to ~10 decimal places
TAB: constant(decimal[10][11]) = [[1.0, 2.7182818285, 7.3890560989, 20.0855369232, 54.5981500331, 148.4131591026, 403.4287934927, 1096.6331584285, 2980.9579870417, 8103.0839275754],
    [1.0, 1.1051709181, 1.2214027582, 1.3498588076, 1.4918246976, 1.6487212707, 1.8221188004, 2.0137527075, 2.2255409285, 2.4596031112],
    [1.0, 1.0100501671, 1.02020134, 1.030454534, 1.0408107742, 1.0512710964, 1.0618365465, 1.0725081813, 1.0832870677, 1.0941742837],
    [1.0, 1.0010005002, 1.0020020013, 1.0030045045, 1.0040080107, 1.0050125209, 1.0060180361, 1.0070245573, 1.0080320855, 1.0090406218],
    [1.0, 1.000100005, 1.00020002, 1.000300045, 1.00040008, 1.000500125, 1.00060018, 1.0007002451, 1.0008003201, 1.0009004051],
    [1.0, 1.00001, 1.0000200002, 1.0000300005, 1.0000400008, 1.0000500013, 1.0000600018, 1.0000700025, 1.0000800032, 1.0000900041],
    [1.0, 1.000001, 1.000002, 1.000003, 1.000004, 1.000005, 1.000006, 1.000007, 1.000008, 1.000009],
    [1.0, 1.0000001, 1.0000002, 1.0000003, 1.0000004, 1.0000005, 1.0000006, 1.0000007, 1.0000008, 1.0000009],
    [1.0, 1.00000001, 1.00000002, 1.00000003, 1.00000004, 1.00000005, 1.00000006, 1.00000007, 1.00000008, 1.00000009],
    [1.0, 1.000000001, 1.000000002, 1.000000003, 1.000000004, 1.000000005, 1.000000006, 1.000000007, 1.000000008, 1.000000009],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0000000001, 1.0000000001, 1.0000000001, 1.0000000001]]

# Euler's number (e) - base of natural logarithms
E: constant(decimal) = 2.7182818285

@external
def __init__():
    """
    @notice Initialize the exponential calculator with the deployer as owner
    """
    self.s_owner = msg.sender

@external
@view
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate e^x (FREE - no gas cost for external view calls)
    @param x The exponent (must be in range [0, 10))
    @return The result of e^x
    @dev This is a view function and costs no gas when called externally
    """
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"
    return self._e_to_the(x)

@external
def ask(x: decimal) -> decimal:
    """
    @notice Calculate e^x with event logging (costs gas, but logs the lookup)
    @param x The exponent (must be in range [0, 10))
    @return The result of e^x
    @dev Only non-owners can call this. Use calculate() for free view access.
    """
    assert msg.sender != self.s_owner, "The owner cannot call this function."
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"

    y: decimal = self._e_to_the(x)
    log Lookup(msg.sender, x, y)
    return y

@external
@view
def get_constant() -> decimal:
    """
    @notice Get Euler's number (e ≈ 2.71828...)
    @return The constant e
    """
    return E

@external
def change_owner(new_owner: address):
    assert msg.sender == self.s_owner, "Only the owner can change the owner."
    assert new_owner != empty(address), "The new owner cannot be the zero address."
    assert new_owner != self.s_owner, "The new owner cannot be the same as the old owner."
    self.s_owner = new_owner

@external
def unalive():
    assert msg.sender == self.s_owner, "Only the owner can unalive the contract."
    selfdestruct(self.s_owner)

@external
@view
def get_owner() -> address:
    return self.s_owner

@internal
@pure
def _e_to_the(_x: decimal) -> decimal:
    x: decimal = _x
    y: decimal = 1.0
    for i in range(11):
        if x != 0.0:
            d: uint256 = convert(x, uint256)
            y *= TAB[i][d]
            x -= convert(d, decimal)
            x *= 10.0
        else:
            break
    return y