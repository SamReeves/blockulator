# @version ^0.4.0
#pragma enable-decimals

"""
@title Gaussian Currency Future
@author Sam Reeves
@license MIT
@notice Simple Gaussian future using Lin 1990 approximation with high-precision tables
"""

# High-precision e^x lookup table from tools/e.vy
# Rows: ones, tenths, hundredths, thousandths, etc.
E_TAB: constant(decimal[10][11]) = [
    [1.0, 2.7182818285, 7.3890560989, 20.0855369232, 54.5981500331, 148.4131591026, 403.4287934927, 1096.6331584285, 2980.9579870417, 8103.0839275754],
    [1.0, 1.1051709181, 1.2214027582, 1.3498588076, 1.4918246976, 1.6487212707, 1.8221188004, 2.0137527075, 2.2255409285, 2.4596031112],
    [1.0, 1.0100501671, 1.02020134, 1.030454534, 1.0408107742, 1.0512710964, 1.0618365465, 1.0725081813, 1.0832870677, 1.0941742837],
    [1.0, 1.0010005002, 1.0020020013, 1.0030045045, 1.0040080107, 1.0050125209, 1.0060180361, 1.0070245573, 1.0080320855, 1.0090406218],
    [1.0, 1.000100005, 1.00020002, 1.000300045, 1.00040008, 1.000500125, 1.00060018, 1.0007002451, 1.0008003201, 1.0009004051],
    [1.0, 1.00001, 1.0000200002, 1.0000300005, 1.0000400008, 1.0000500013, 1.0000600018, 1.0000700025, 1.0000800032, 1.0000900041],
    [1.0, 1.000001, 1.000002, 1.000003, 1.000004, 1.000005, 1.000006, 1.000007, 1.000008, 1.000009],
    [1.0, 1.0000001, 1.0000002, 1.0000003, 1.0000004, 1.0000005, 1.0000006, 1.0000007, 1.0000008, 1.0000009],
    [1.0, 1.00000001, 1.00000002, 1.00000003, 1.00000004, 1.00000005, 1.00000006, 1.00000007, 1.00000008, 1.00000009],
    [1.0, 1.000000001, 1.000000002, 1.000000003, 1.000000004, 1.000000005, 1.000000006, 1.000000007, 1.000000008, 1.000000009],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0000000001, 1.0000000001, 1.0000000001, 1.0000000001]
]

# State variables with better namespace
current_owner: public(address)
initial_value: public(uint256)
start_time: public(uint256)
lifetime: public(uint256)
mean: public(uint256)
stddev: public(uint256)
last_t: public(uint256)
last_z: public(decimal)
last_tail: public(decimal)
expired: public(bool)

@deploy
@payable
def __init__(_lifetime: uint256):
    """
    @notice Initialize the contract with lifetime in seconds
    @param _lifetime Duration of the future in seconds (minimum 60 = 1 minute)
    """
    assert _lifetime >= 60, "Lifetime must be at least 60 seconds (1 minute)"
    assert msg.value > 0, "Must send ETH to deploy"

    self.start_time = block.timestamp
    self.lifetime = _lifetime
    self.current_owner = msg.sender
    self.initial_value = msg.value
    
    # Mean at midpoint, stddev from uniform distribution
    # sqrt(12) ≈ 3.464101615
    self.mean = _lifetime // 2
    self.stddev = convert(convert(_lifetime, decimal) / 3.464101615, uint256)
    
    # Initialize with extreme values (start at left tail)
    self.last_t = 0
    self.last_z = 2.5
    self.last_tail = 1.0
    self.expired = False

@external
@payable
def __default__():
    """
    @notice Default function rejects ETH except from owner
    """
    assert msg.value == 0, "No ETH should be sent to this function"
    assert msg.sender == self.current_owner, "Only owner can call this"

@internal
@pure
def _z_score(t: uint256, mu: uint256, sigma: uint256) -> decimal:
    """
    @notice Calculate z-score (standard deviations from mean)
    @param t Time elapsed
    @param mu Mean time
    @param sigma Standard deviation
    @return Absolute value of z-score
    """
    if t > mu:
        return convert(t - mu, decimal) / convert(sigma, decimal)
    else:
        return convert(mu - t, decimal) / convert(sigma, decimal)

@internal
@pure
def _e_power(x: decimal) -> decimal:
    """
    @notice Calculate e^x using high-precision lookup table
    @param x The exponent (must be in [0, 10))
    @return e^x
    """
    y: decimal = 1.0
    x_work: decimal = x
    
    # Clamp x to valid range [0, 10)
    if x_work < 0.0:
        x_work = 0.0
    if x_work >= 10.0:
        x_work = 9.9999999999
    
    # Process each decimal digit using table multiplication
    for i: uint256 in range(11):
        if x_work != 0.0:
            digit: uint256 = convert(x_work, uint256)
            y *= E_TAB[i][digit]
            x_work -= convert(digit, decimal)
            x_work *= 10.0
        else:
            break
    
    return y

@internal
@pure
def _y_constant(z: decimal) -> decimal:
    """
    @notice Lin 1990 y-constant calculation
    @dev Uses 4.2 * pi ≈ 13.194689145
    @param z The z-score
    @return The y constant
    """
    return 13.194689145 * z / (9.0 - z)

@internal
@pure
def _tail(exp_y: decimal) -> decimal:
    """
    @notice Lin 1990 tail probability calculation
    @param exp_y The value e^y
    @return Tail probability
    """
    return 1.0 - 1.0 / (1.0 + exp_y)

@internal
@pure
def _weight(left: decimal, right: decimal, phase: uint8) -> decimal:
    """
    @notice Calculate weight (area under curve) between two times
    @param left Left tail probability
    @param right Right tail probability  
    @param phase 0: both before mean, 1: left before/right after, 2: both after
    @return Weight (probability mass)
    """
    if phase == 0:
        # Both times before mean
        return left - right
    elif phase == 1:
        # Left before mean, right after mean
        return left - (1.0 - right)
    else:
        # Both times after mean
        return (1.0 - left) - (1.0 - right)

@external
@payable
def transfer(new_owner: address):
    """
    @notice Transfer ownership and claim accumulated value
    @param new_owner Address of the new owner
    """
    assert msg.sender == self.current_owner, "Only owner can transfer"
    assert new_owner != empty(address), "New owner cannot be zero address"
    assert msg.value == 0, "No ETH should be sent with transfer"
    assert new_owner != self.current_owner, "New owner must be different"
    assert not self.expired, "Contract has expired"
    
    # Check if contract has expired
    if block.timestamp >= self.start_time + self.lifetime:
        # Send all remaining balance to owner and mark as expired
        raw_call(self.current_owner, b"", value=self.balance)
        self.expired = True
        return
    
    # Calculate elapsed time
    t_current: uint256 = block.timestamp - self.start_time
    
    # Determine which phase we're in
    phase: uint8 = 0
    if self.last_t > self.mean:
        phase += 1
    if t_current > self.mean:
        phase += 1
    
    # Calculate current position on distribution
    z_current: decimal = self._z_score(t_current, self.mean, self.stddev)
    y_current: decimal = self._y_constant(z_current)
    exp_y_current: decimal = self._e_power(y_current)
    tail_current: decimal = self._tail(exp_y_current)
    
    # Calculate weight (probability mass between last and current time)
    weight: decimal = self._weight(self.last_tail, tail_current, phase)
    
    # Calculate payment
    payment: uint256 = convert(convert(self.initial_value, decimal) * weight, uint256)
    
    # Update state
    self.last_t = t_current
    self.last_z = z_current
    self.last_tail = tail_current
    
    # Send payment and transfer ownership
    raw_call(self.current_owner, b"", value=payment)
    self.current_owner = new_owner

@external
@view
def get_current_state() -> (uint256, decimal, decimal):
    """
    @notice Get current contract state
    @return Tuple of (time_elapsed, z_score, tail_probability)
    """
    return (self.last_t, self.last_z, self.last_tail)

@external
@view
def time_remaining() -> uint256:
    """
    @notice Get time remaining until expiration
    @return Seconds remaining (0 if expired)
    """
    end_time: uint256 = self.start_time + self.lifetime
    if block.timestamp >= end_time:
        return 0
    return end_time - block.timestamp

@external
@view
def get_balance() -> uint256:
    """
    @notice Get current contract balance
    @return Balance in wei
    """
    return self.balance
