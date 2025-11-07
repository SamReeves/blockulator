# @version ^0.3.7
"""
@title Gaussian Currency Future
@author Sam Reeves
@license MIT
"""

owner: address
value: uint256
start: uint256
epoch: uint256

mu: uint256
sigma: uint256

t: uint256
z: decimal
left: decimal

@external
@payable
def __init__(_epoch: uint256):
    """
    Initialize the contract with the epoch in seconds.
    Throw errors if the epoch is too short or no Eth is sent.
    """
    assert _epoch > 60 * 60 * 24, "Lifetime must be at least 86400 seconds."
    assert msg.value > 0, "Deployment must be given Eth in Wei."

    # DATA FROM DEPLOYMENT MESSAGE
    self.start = block.timestamp
    self.epoch = _epoch
    self.owner = msg.sender
    self.value = msg.value

    # CONSTANTS MEAN AND STANDARD DEVIATION
    # MAGIC NUMBER IS SQUARE ROOT OF 12
    self.mu = _epoch / 2
    self.sigma = convert((convert(
        _epoch, decimal) / 3.464101615), uint256)

    # DATA FROM THE PREVIOUS ACTIVITY
    self.t = 0
    self.z = 2.5
    self.left = 1.0

@external
@payable
def __default__():
    """
    Returns an error if Eth is sent to the contract or the 
    message comes from the wrong owner.
    """

    assert msg.value == 0, "No Eth should be sent to this function."
    assert msg.sender == self.owner, "Only the owner can make calls."

@internal
@pure
def z_score(t: uint256, mu: uint256, sigma: uint256) -> decimal:
    """
    Take a time and return the z-score.
    """

    z: decimal = 0.0
    # AVOIDING NEGATIVE VALUES, WHICH BREAK THE MATH
    if t > mu:
        z = convert(t - mu, decimal) / convert(sigma, decimal)
    else:
        z = convert(mu - t, decimal) / convert(sigma, decimal)
    return z

@internal
@pure
def e_power(x: decimal) -> decimal:
    """
    List whole, tenth, and hundredth powers of e.
    Compute the non-integer power of e.
    """

    # PRECOMPUTED POWERS OF E
    ones: decimal[10] = [1.0, 2.7182818285, 7.3890560989,
        20.0855369232, 54.5981500331, 148.4131591026, 
        403.4287934927, 1096.6331584285, 2980.9579870417, 
        8103.0839275754]

    tenths: decimal[10] = [1.0, 1.105, 1.221, 1.35,
        1.492, 1.649, 1.822, 2.014, 2.226, 2.46]

    hundredths: decimal[10] = [1.0, 1.01, 1.02, 1.03,
        1.041, 1.051, 1.062, 1.073, 1.083, 1.094]

    # SEPARATE INTEGER AND FRACTIONAL PARTS
    r: int256 = floor(x)
    f10: int256 = floor(x * 10.0 - convert(r * 10, decimal))
    f100: int256 = floor(x * 100.0 - convert(r * 100, decimal) - convert(f10 * 10, decimal))

    # COMPUTE NON-INTEGER POWER OF E BY PRODUCT RULE OF EXPONENTS
    ans: decimal = hundredths[f100] * tenths[f10] * ones[r]
    return ans

@internal
@pure
def y(z: decimal) -> decimal:
    """
    Take a z-score and return the a constant.
    First part of calculating a PDF.
    Credit: Lin 1990 "Pocket Calculator Approximation of
        the Normal Distribution"
    """
    # MAGIC NUMBER IS 4.2 * PI
    return 13.194689145 * z / (9.0 - z)

@internal
@pure
def tail(_exp: decimal) -> decimal:
    """
    Takes e^y and returns the tail.
    Second part of calculating a PDF.
    Credit: Lin 1990 "Pocket Calculator Approximation of
        the Normal Distribution"
    """

    return 1.0 - 1.0 / (1.0 + _exp)

@internal
@pure
def weight(left: decimal, right: decimal,
                      phase: uint8) -> decimal:
    """
    Take a left and right tail and a phase to calculate a weight.
    Return the area under the curve for the relevant times.
    """
    weight: decimal = 0.0

    # PHASE 0: T1 AND T2 ARE BOTH BEFORE MU
    if phase == 0:
        weight = left - right

    # PHASE 1: T1 IS BEFORE MU AND T2 IS AFTER MU
    elif phase == 1:
        weight = left - (1.0 - right)

    # PHASE 2: T1 AND T2 ARE BOTH AFTER MU
    else:
        weight = (1.0 - left) - (1.0 - right)

    return weight

@internal
@pure
def payment(v: uint256, w: decimal) -> uint256:
    """
    Take a value and weight and calculate a payment.
    """
    return convert((convert(v, decimal) * w), uint256)

@external
@payable
def give(new: address):
    """
    Receives a call from the current owner with a new owner address.
    Calculates and sends a payment.
    Changes the owner or selfdestructs.
    """
    assert msg.sender == self.owner, "Only the owner can makes calls."
    assert new != empty(address), "New owner cannot be the zero address."
    assert msg.value == 0, "No Eth should be sent to this function."
    assert new != self.owner, "New owner cannot be the same as the old owner."

    # IF CONTRACT IS EXPIRED, SEND REMAINING BALANCE TO OWNER
    # AND SELFDESTRUCT
    if block.timestamp > self.start + self.epoch:
        send(self.owner, self.balance)
        selfdestruct(self.owner)

    else:
    # LEFT SIDE MATH
        t1: uint256 = self.t
        mu: uint256 = self.mu
        sigma: uint256 = self.sigma
        z1: decimal = self.z
        tail1: decimal = self.left
        phase: uint8 = 0
        if t1 > mu:
            phase += 1
        
    # RIGHT SIDE MATH
        t2: uint256 = block.timestamp - self.start
        if t2 > mu:
            phase += 1
        z2: decimal = self.z_score(t2, mu, sigma)
        tail2: decimal = self.tail(self.e_power(self.y(z2)))
        weight: decimal = self.weight(tail1, tail2, phase)

        payment: uint256 = self.payment(self.value, weight)

    # UPDATE STATE, SEND PAYMENT
        self.t = t2
        self.z = z2
        self.left = tail2
        send(self.owner, payment)
        self.owner = new