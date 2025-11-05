s_owner: address

event Lookup:
    sender: address
    x: decimal
    y: decimal

# Lookup table for calculating π^x using digit-by-digit multiplication
# Row i contains π^(d * 10^(-i)) for d = 0..9
# Accurate to ~10 decimal places
TAB: constant(decimal[10][11]) = [
    [1.0, 3.1415926536, 9.8696044011, 31.0062766803, 97.409091034, 306.0196847853, 961.3891935753, 3020.2932277768, 9488.5310160706, 29809.0993334462],
    [1.0, 1.1212823532, 1.2572741157, 1.4097592791, 1.5807382019, 1.7724538509, 1.9874212249, 2.228460348, 2.498733263, 2.8017855133],
    [1.0, 1.0115130699, 1.0231586906, 1.0349383881, 1.0468537062, 1.0589062061, 1.0710974672, 1.0834290873, 1.0959026821, 1.1085198863],
    [1.0, 1.0011453853, 1.0022920826, 1.0034400932, 1.0045894188, 1.0057400608, 1.0068920207, 1.0080453001, 1.0091999004, 1.0103558232],
    [1.0, 1.0001144795, 1.0002289722, 1.0003434779, 1.0004579968, 1.0005725288, 1.0006870739, 1.0008016321, 1.0009162034, 1.0010307878],
    [1.0, 1.0000114462, 1.0000228925, 1.000034339, 1.0000457856, 1.0000572324, 1.0000686793, 1.0000801264, 1.0000915736, 1.000103021],
    [1.0, 1.0000011446, 1.0000022892, 1.0000034339, 1.0000045785, 1.0000057232, 1.0000068679, 1.0000080126, 1.0000091573, 1.000010302],
    [1.0, 1.0000001145, 1.0000002289, 1.0000003434, 1.0000004579, 1.0000005723, 1.0000006868, 1.0000008013, 1.0000009157, 1.0000010302],
    [1.0, 1.0000000114, 1.0000000229, 1.0000000343, 1.0000000458, 1.0000000572, 1.0000000687, 1.0000000801, 1.0000000916, 1.000000103],
    [1.0, 1.0000000011, 1.0000000023, 1.0000000034, 1.0000000046, 1.0000000057, 1.0000000069, 1.000000008, 1.0000000092, 1.0000000103],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
]

# Pi (π) - the ratio of circle's circumference to diameter
PI: constant(decimal) = 3.1415926536

@external
def __init__():
    """
    @notice Initialize the pi calculator with the deployer as owner
    """
    self.s_owner = msg.sender

@external
@view
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate π^x (FREE - no gas cost for external view calls)
    @param x The exponent (must be in range [0, 10))
    @return The result of π^x
    @dev This is a view function and costs no gas when called externally
    """
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"
    return self._pi_to_the(x)

@external
def ask(x: decimal) -> decimal:
    """
    @notice Calculate π^x with event logging (costs gas, but logs the lookup)
    @param x The exponent (must be in range [0, 10))
    @return The result of π^x
    @dev Only non-owners can call this. Use calculate() for free view access.
    """
    assert msg.sender != self.s_owner, "The owner cannot call this function."
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"

    y: decimal = self._pi_to_the(x)
    log Lookup(msg.sender, x, y)
    return y

@external
@view
def get_constant() -> decimal:
    """
    @notice Get the value of π (≈ 3.14159...)
    @return The constant π
    """
    return PI

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
def _pi_to_the(_x: decimal) -> decimal:
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