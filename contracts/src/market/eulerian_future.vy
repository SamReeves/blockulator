# @version ^0.4.0
#pragma enable-decimals

"""
@title Eulerian Future - Multi-Distribution Time-Based Future
@author Sam Reeves
@license MIT
@notice Tradeable future supporting 6 distribution types: Uniform, Gaussian, Exponential, Linear
@dev All distributions use the same high-precision E_TAB table for calculations
"""

# High-precision e^x lookup table from tools/e.vy
# Used for all distributions: e^x for Gaussian, 1/e^x for exponential decay/growth
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

# State variables
current_owner: public(address)
initial_value: public(uint256)
start_time: public(uint256)
lifetime: public(uint256)
expired: public(bool)
factory: public(immutable(address))  # Factory that deployed this future
locked: public(bool)  # True when listed on marketplace, prevents direct transfers

# Distribution type: 0=Uniform, 1=Gaussian, 2=ExpDecay, 3=ExpGrowth, 4=LinearDecay, 5=LinearGrowth
distribution_type: public(uint8)

# Distribution-specific parameters
mean: public(uint256)              # Gaussian only
stddev: public(uint256)            # Gaussian only
lambda_param: public(decimal)      # Exponential Decay/Growth (λ = 3/lifetime)

# Tracking state (interpretation depends on distribution_type)
last_t: public(uint256)            # Last transfer time (all types)
last_cache: public(decimal)        # Distribution-specific cache value

@deploy
@payable
def __init__(_lifetime: uint256, _distribution_type: uint8, _owner: address, _factory: address):
    """
    @notice Initialize Eulerian future with distribution type
    @param _lifetime Duration in seconds (minimum 60 = 1 minute)
    @param _distribution_type 0=Uniform, 1=Gaussian, 2=ExpDecay, 3=ExpGrowth, 4=LinearDecay, 5=LinearGrowth
    @param _owner The address that will own this future
    @param _factory The factory contract address (for marketplace locking)
    """
    assert _lifetime >= 60, "Lifetime must be at least 60 seconds (1 minute)"
    assert msg.value > 0, "Must send ETH to deploy"
    assert _distribution_type <= 5, "Invalid distribution type (must be 0-5)"
    assert _owner != empty(address), "Owner cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"

    factory = _factory
    self.start_time = block.timestamp
    self.lifetime = _lifetime
    self.current_owner = _owner
    self.initial_value = msg.value
    self.distribution_type = _distribution_type
    self.last_t = 0
    self.expired = False
    self.locked = False
    
    # Initialize distribution-specific parameters
    if _distribution_type == 0:
        # UNIFORM: No special parameters
        self.mean = 0
        self.stddev = 0
        self.lambda_param = 0.0
        self.last_cache = 0.0  # Proportion elapsed
        
    elif _distribution_type == 1:
        # GAUSSIAN: Mean at midpoint, stddev from uniform distribution
        # sqrt(12) ≈ 3.464101615
        self.mean = _lifetime // 2
        self.stddev = convert(convert(_lifetime, decimal) / 3.464101615, uint256)
        self.lambda_param = 0.0
        self.last_cache = 1.0  # Start at left tail
        
    elif _distribution_type == 2:
        # EXPONENTIAL DECAY: lambda = 3/lifetime (95% decay by end)
        self.mean = 0
        self.stddev = 0
        self.lambda_param = 3.0 / convert(_lifetime, decimal)
        self.last_cache = 1.0  # e^0 = 1
        
    elif _distribution_type == 3:
        # EXPONENTIAL GROWTH: same lambda as decay
        self.mean = 0
        self.stddev = 0
        self.lambda_param = 3.0 / convert(_lifetime, decimal)
        self.last_cache = 0.0  # CDF at t=0 is 0
        
    elif _distribution_type == 4:
        # LINEAR DECAY: Triangular distribution with peak at start
        # Payout decreases linearly: high at t=0, zero at t=lifetime
        self.mean = 0
        self.stddev = 0
        self.lambda_param = 0.0
        self.last_cache = 0.0  # Proportion elapsed
        
    else:
        # LINEAR GROWTH (type 5): Triangular distribution with peak at end
        # Payout increases linearly: low at t=0, high at t=lifetime
        self.mean = 0
        self.stddev = 0
        self.lambda_param = 0.0
        self.last_cache = 0.0  # Proportion elapsed

@external
@payable
def __default__():
    """
    @notice Default function rejects ETH except from owner
    """
    assert msg.value == 0, "No ETH should be sent to this function"
    assert msg.sender == self.current_owner, "Only owner can call this"

@external
def lock():
    """
    @notice Lock future (prevents direct transfers while listed on marketplace)
    @dev Only callable by factory
    """
    assert msg.sender == factory, "Only factory can lock"
    self.locked = True

@external
def unlock():
    """
    @notice Unlock future (allows direct transfers after delisting or sale)
    @dev Only callable by factory
    """
    assert msg.sender == factory, "Only factory can unlock"
    self.locked = False

@external
@payable
def transfer(new_owner: address):
    """
    @notice Transfer ownership and pay out accumulated value
    @param new_owner Address of the new owner
    """
    assert msg.sender == self.current_owner or msg.sender == factory, "Only owner or factory can transfer"
    assert new_owner != empty(address), "New owner cannot be zero address"
    assert msg.value == 0, "No ETH should be sent with transfer"
    assert new_owner != self.current_owner, "New owner must be different"
    assert not self.expired, "Contract has expired"
    if msg.sender != factory:
        assert not self.locked, "Future is locked (listed on marketplace)"
    
    # Check if contract has expired
    if block.timestamp >= self.start_time + self.lifetime:
        # Send all remaining balance to owner and mark as expired
        raw_call(self.current_owner, b"", value=self.balance)
        self.expired = True
        return
    
    # Calculate elapsed time
    t_current: uint256 = block.timestamp - self.start_time
    
    # Calculate weight and new cache based on distribution type
    weight: decimal = 0.0
    new_cache: decimal = 0.0
    
    if self.distribution_type == 0:
        # UNIFORM
        weight, new_cache = self._uniform_weight(self.last_t, t_current)
    elif self.distribution_type == 1:
        # GAUSSIAN
        weight, new_cache = self._gaussian_weight(self.last_t, t_current)
    elif self.distribution_type == 2:
        # EXPONENTIAL DECAY
        weight, new_cache = self._exp_decay_weight(self.last_t, t_current)
    elif self.distribution_type == 3:
        # EXPONENTIAL GROWTH
        weight, new_cache = self._exp_growth_weight(self.last_t, t_current)
    elif self.distribution_type == 4:
        # LINEAR DECAY
        weight, new_cache = self._linear_decay_weight(self.last_t, t_current)
    else:
        # LINEAR GROWTH (type 5)
        weight, new_cache = self._linear_growth_weight(self.last_t, t_current)
    
    # Calculate payment
    payment: uint256 = convert(convert(self.initial_value, decimal) * weight, uint256)
    
    # Update state
    self.last_t = t_current
    self.last_cache = new_cache
    
    # Send payment and transfer ownership
    raw_call(self.current_owner, b"", value=payment)
    self.current_owner = new_owner

# ============================================================================
# WEIGHT CALCULATION FUNCTIONS
# ============================================================================

@internal
@view
def _uniform_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Uniform weight (linear distribution)
    @return Tuple of (weight, new_proportion_cache)
    """
    # Handle expiration case
    if t_current >= self.lifetime:
        remaining: uint256 = self.lifetime - t_last
        weight: decimal = convert(remaining, decimal) / convert(self.lifetime, decimal)
        return (weight, 1.0)
    
    # Calculate elapsed time since last transfer
    elapsed: uint256 = t_current - t_last
    weight: decimal = convert(elapsed, decimal) / convert(self.lifetime, decimal)
    
    # Cache current proportion
    proportion: decimal = convert(t_current, decimal) / convert(self.lifetime, decimal)
    
    return (weight, proportion)

@internal
@view
def _gaussian_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Gaussian weight between two times
    @return Tuple of (weight, new_tail_cache)
    """
    # Determine phase
    phase: uint8 = 0
    if t_last > self.mean:
        phase += 1
    if t_current > self.mean:
        phase += 1
    
    # Calculate current position on distribution
    z_current: decimal = self._z_score(t_current, self.mean, self.stddev)
    y_current: decimal = self._y_constant(z_current)
    exp_y_current: decimal = self._e_power(y_current)
    tail_current: decimal = self._tail(exp_y_current)
    
    # Calculate weight (probability mass between last and current time)
    weight: decimal = self._weight_phase(self.last_cache, tail_current, phase)
    
    return (weight, tail_current)

@internal
@view
def _exp_decay_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Exponential Decay weight
    @return Tuple of (weight, new_exp_cache)
    """
    # Calculate e^(-λt) for current time using reciprocal: e^(-x) = 1/e^x
    exp_current: decimal = self._exp_minus(self.lambda_param, t_current)
    
    # Weight is the probability mass between last and current
    # Normalized: (exp_last - exp_current) / exp_last
    exp_last: decimal = self.last_cache
    
    weight: decimal = 0.0
    if exp_last > 0.0:
        weight = (exp_last - exp_current) / exp_last
    
    return (weight, exp_current)

@internal
@view
def _exp_growth_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Exponential Growth weight
    @return Tuple of (weight, new_cdf_cache)
    """
    # Calculate CDF at current time: F(t) = 1 - e^(-λt)
    exp_current: decimal = self._exp_minus(self.lambda_param, t_current)
    cdf_current: decimal = 1.0 - exp_current
    
    # Weight is the CDF difference (normalized by remaining mass)
    remaining_mass: decimal = 1.0 - self.last_cache
    
    weight: decimal = 0.0
    if remaining_mass > 0.0:
        weight = (cdf_current - self.last_cache) / remaining_mass
    
    return (weight, cdf_current)

@internal
@view
def _linear_decay_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Linear Decay weight (triangular distribution)
    @return Tuple of (weight, new_proportion_cache)
    @dev Payout probability is proportional to remaining time: P(t) = (T - t) / T
         Total area under curve from 0 to T is T/2
         Weight = integral from t_last to t_current divided by remaining area
    """
    # Handle expiration case
    if t_current >= self.lifetime:
        # Pay out all remaining weight
        # Remaining area = (T - t_last)^2 / (2T)
        remaining_time: uint256 = self.lifetime - t_last
        weight: decimal = convert(remaining_time, decimal) * convert(remaining_time, decimal) / (2.0 * convert(self.lifetime, decimal) * convert(self.lifetime, decimal))
        return (weight, 1.0)
    
    # Calculate area from t_last to t_current
    # Area = (t_current - t_last) * (2T - t_last - t_current) / (2T)
    elapsed: uint256 = t_current - t_last
    sum_times: uint256 = t_last + t_current
    
    # Numerator: elapsed * (2*lifetime - sum_times)
    numerator: decimal = convert(elapsed, decimal) * convert(2 * self.lifetime - sum_times, decimal)
    
    # Denominator: 2 * lifetime^2 (total area under curve from 0 to lifetime)
    denominator: decimal = 2.0 * convert(self.lifetime, decimal) * convert(self.lifetime, decimal)
    
    weight: decimal = numerator / denominator
    
    # Cache current proportion
    proportion: decimal = convert(t_current, decimal) / convert(self.lifetime, decimal)
    
    return (weight, proportion)

@internal
@view
def _linear_growth_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Linear Growth weight (triangular distribution)
    @return Tuple of (weight, new_proportion_cache)
    @dev Payout probability is proportional to elapsed time: P(t) = t / T
         Total area under curve from 0 to T is T/2
         Weight = integral from t_last to t_current divided by total area
    """
    # Handle expiration case
    if t_current >= self.lifetime:
        # Pay out all remaining weight
        # Remaining area = (T^2 - t_last^2) / (2T^2)
        weight: decimal = (convert(self.lifetime, decimal) * convert(self.lifetime, decimal) - convert(t_last, decimal) * convert(t_last, decimal)) / (2.0 * convert(self.lifetime, decimal) * convert(self.lifetime, decimal))
        return (weight, 1.0)
    
    # Calculate area from t_last to t_current
    # Area = (t_current^2 - t_last^2) / (2T^2)
    t_current_sq: decimal = convert(t_current, decimal) * convert(t_current, decimal)
    t_last_sq: decimal = convert(t_last, decimal) * convert(t_last, decimal)
    
    # Numerator: t_current^2 - t_last^2
    numerator: decimal = t_current_sq - t_last_sq
    
    # Denominator: 2 * lifetime^2 (total area under curve from 0 to lifetime)
    denominator: decimal = 2.0 * convert(self.lifetime, decimal) * convert(self.lifetime, decimal)
    
    weight: decimal = numerator / denominator
    
    # Cache current proportion
    proportion: decimal = convert(t_current, decimal) / convert(self.lifetime, decimal)
    
    return (weight, proportion)

# ============================================================================
# HELPER FUNCTIONS - SHARED E_TAB CALCULATIONS
# ============================================================================

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
@view
def _exp_minus(lambda_param: decimal, t: uint256) -> decimal:
    """
    @notice Calculate e^(-λt) using reciprocal: e^(-x) = 1 / e^x
    @param lambda_param The decay/growth rate λ
    @param t Time value
    @return e^(-λt)
    """
    # Calculate exponent: λt (positive value)
    exponent: decimal = lambda_param * convert(t, decimal)
    
    # Handle underflow: if exponent >= 10, return ~0
    if exponent >= 10.0:
        return 0.0
    
    # Clamp to valid range
    if exponent < 0.0:
        exponent = 0.0
    
    # Calculate e^x using table
    exp_pos: decimal = self._e_power(exponent)
    
    # Return reciprocal: e^(-x) = 1 / e^x
    if exp_pos > 0.0:
        return 1.0 / exp_pos
    else:
        return 0.0

# ============================================================================
# HELPER FUNCTIONS - GAUSSIAN SPECIFIC
# ============================================================================

@internal
@pure
def _z_score(t: uint256, mu: uint256, sigma: uint256) -> decimal:
    """
    @notice Calculate z-score (standard deviations from mean)
    """
    if t > mu:
        return convert(t - mu, decimal) / convert(sigma, decimal)
    else:
        return convert(mu - t, decimal) / convert(sigma, decimal)

@internal
@pure
def _y_constant(z: decimal) -> decimal:
    """
    @notice Lin 1990 y-constant calculation
    @dev Uses 4.2 * pi ≈ 13.194689145
    """
    return 13.194689145 * z / (9.0 - z)

@internal
@pure
def _tail(exp_y: decimal) -> decimal:
    """
    @notice Lin 1990 tail probability calculation
    """
    return 1.0 - 1.0 / (1.0 + exp_y)

@internal
@pure
def _weight_phase(left: decimal, right: decimal, phase: uint8) -> decimal:
    """
    @notice Calculate Gaussian weight between two times based on phase
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

# ============================================================================
# VIEW FUNCTIONS (For marketplace valuation)
# ============================================================================

@external
@view
def get_current_state() -> (uint256, decimal, uint8):
    """
    @notice Get current contract state
    @return Tuple of (last_t, last_cache, distribution_type)
    """
    return (self.last_t, self.last_cache, self.distribution_type)

@external
@view
def get_distribution_params() -> (uint256, uint256, decimal):
    """
    @notice Get distribution parameters
    @return Tuple of (mean, stddev, lambda_param)
    @dev Only relevant fields are non-zero based on distribution_type
    """
    return (self.mean, self.stddev, self.lambda_param)

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

