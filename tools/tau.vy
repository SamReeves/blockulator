s_owner: address

event Lookup:
    sender: address
    x: decimal
    y: decimal

# Lookup table for calculating τ^x using digit-by-digit multiplication
# Row i contains τ^(d * 10^(-i)) for d = 0..9
# Accurate to ~10 decimal places
TAB: constant(decimal[10][11]) = [
    [1.0, 6.2831853072, 39.4784176044, 248.0502134424, 1558.545456544, 9792.629913129, 61528.9083888195, 386597.5331554293, 2429063.940114066, 15262258.858724454],
    [1.0, 1.2017606702, 1.4442287084, 1.7356172606, 2.0857965623, 2.5066282746, 3.0123672753, 3.6201445156, 4.3505472993, 5.2283166382],
    [1.0, 1.0185486997, 1.0374414537, 1.0566846436, 1.0762847698, 1.0962484528, 1.1165824361, 1.1372935884, 1.1583889057, 1.1798755136],
    [1.0, 1.001839567, 1.003682518, 1.0055288592, 1.0073785969, 1.0092317374, 1.0110882868, 1.0129482514, 1.0148116376, 1.0166784516],
    [1.0, 1.0001838046, 1.000367643, 1.0005515151, 1.0007354211, 1.0009193609, 1.0011033345, 1.0012873419, 1.0014713831, 1.0016554581],
    [1.0, 1.0000183793, 1.0000367587, 1.0000551381, 1.0000735176, 1.000091897, 1.0001102765, 1.000128656, 1.0001470356, 1.0001654152],
    [1.0, 1.0000018379, 1.0000036759, 1.0000055138, 1.0000073518, 1.0000091897, 1.0000110277, 1.0000128656, 1.0000147036, 1.0000165416],
    [1.0, 1.0000001838, 1.0000003676, 1.0000005514, 1.0000007352, 1.000000919, 1.0000011028, 1.0000012866, 1.0000014704, 1.0000016542],
    [1.0, 1.0000000184, 1.0000000368, 1.0000000551, 1.0000000735, 1.0000000919, 1.0000001103, 1.0000001287, 1.0000001471, 1.0000001655],
    [1.0, 1.0000000018, 1.0000000037, 1.0000000055, 1.0000000074, 1.0000000092, 1.000000011, 1.0000000129, 1.0000000147, 1.0000000166],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
]

# Tau (τ) - the ratio of circle's circumference to radius (2π)
TAU: constant(decimal) = 6.2831853072

@external
def __init__():
    """
    @notice Initialize the tau calculator with the deployer as owner
    """
    self.s_owner = msg.sender

@external
@view
def calculate(x: decimal) -> decimal:
    """
    @notice Calculate τ^x (FREE - no gas cost for external view calls)
    @param x The exponent (must be in range [0, 10))
    @return The result of τ^x
    @dev This is a view function and costs no gas when called externally
    """
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"
    return self._tau_to_the(x)

@external
def ask(x: decimal) -> decimal:
    """
    @notice Calculate τ^x with event logging (costs gas, but logs the lookup)
    @param x The exponent (must be in range [0, 10))
    @return The result of τ^x
    @dev Only non-owners can call this. Use calculate() for free view access.
    """
    assert msg.sender != self.s_owner, "The owner cannot call this function."
    assert x >= 0.0, "Negative powers are not supported."
    assert x < 10.0, "The power limit is 9.999999999"

    y: decimal = self._tau_to_the(x)
    log Lookup(msg.sender, x, y)
    return y

@external
@view
def get_constant() -> decimal:
    """
    @notice Get the value of τ (≈ 6.28318...)
    @return The constant τ
    """
    return TAU

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
def _tau_to_the(_x: decimal) -> decimal:
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