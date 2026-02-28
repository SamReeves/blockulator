#pragma enable-decimals
# @version 0.4.3

"""
@title Gaussian Future - Bell Curve Distribution
@author Sam Reeves
@notice Tradeable future with Gaussian (normal) payout distribution
@dev Thin contract that calls external gaussian_tail calculator for Lin 1990 approximation
"""

# Interface for gaussian_tail calculator
interface IGaussianTail:
    def calculate(z: decimal) -> decimal: view
    def z_score(t: decimal, mu: decimal, sigma: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

# State variables
current_owner: public(address)
initial_value: public(uint256)
start_time: public(uint256)
lifetime: public(uint256)
expired: public(bool)
factory: public(immutable(address))
locked: public(bool)

# Distribution parameters
mean: public(uint256)
stddev: public(uint256)

# Tracking state
last_t: public(uint256)
last_cache: public(decimal)  # Cached tail value

# External calculator
gaussian_tail_calculator: public(IGaussianTail)

@deploy
@payable
def __init__(_lifetime: uint256, _owner: address, _factory: address, _gaussian_calc: address):
    """
    @notice Initialize Gaussian future
    @param _lifetime Duration in seconds
    @param _owner The address that will own this future
    @param _factory The factory contract address
    @param _gaussian_calc Address of gaussian_tail calculator contract
    """
    assert _lifetime >= 60, "Lifetime must be at least 60 seconds"
    assert msg.value > 0, "Must send ETH to deploy"
    assert _owner != empty(address), "Owner cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"
    assert _gaussian_calc != empty(address), "Gaussian calculator cannot be zero address"

    factory = _factory
    self.start_time = block.timestamp
    self.lifetime = _lifetime
    self.current_owner = _owner
    self.initial_value = msg.value
    self.last_t = 0
    self.expired = False
    self.locked = False
    
    # Initialize calculator
    self.gaussian_tail_calculator = IGaussianTail(_gaussian_calc)
    
    # Initialize Gaussian parameters
    # Mean at midpoint, stddev from uniform distribution
    # sqrt(12) ≈ 3.464101615
    self.mean = _lifetime // 2
    self.stddev = convert(convert(_lifetime, decimal) / 3.464101615, uint256)
    
    # Start at left tail (t=0)
    self.last_cache = 1.0

@external
@payable
def __default__():
    """Reject ETH except from owner"""
    assert msg.value == 0, "No ETH should be sent"
    assert msg.sender == self.current_owner, "Only owner can call"

@external
def lock():
    """Lock future (prevents transfers while listed)"""
    assert msg.sender == factory, "Only factory can lock"
    self.locked = True

@external
def unlock():
    """Unlock future (allows transfers after delisting)"""
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
    
    # Calculate Gaussian weight
    weight: decimal = 0.0
    new_cache: decimal = 0.0
    
    weight, new_cache = self._gaussian_weight(self.last_t, t_current)
    
    # Calculate payment
    payment: uint256 = convert(convert(self.initial_value, decimal) * weight, uint256)
    
    # Update state
    self.last_t = t_current
    self.last_cache = new_cache
    
    # Send payment and transfer ownership
    raw_call(self.current_owner, b"", value=payment)
    self.current_owner = new_owner

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
    
    # Calculate current position on distribution using external calculator
    z_current: decimal = staticcall self.gaussian_tail_calculator.z_score(
        convert(t_current, decimal),
        convert(self.mean, decimal),
        convert(self.stddev, decimal)
    )
    
    tail_current: decimal = staticcall self.gaussian_tail_calculator.calculate(z_current)
    
    # Calculate weight (probability mass between last and current time)
    weight: decimal = self._weight_phase(self.last_cache, tail_current, phase)
    
    return (weight, tail_current)

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

@external
@view
def get_current_state() -> (uint256, decimal, uint8):
    """
    @notice Get current state for valuation
    @return Tuple of (last_t, last_cache, distribution_type)
    """
    return (self.last_t, self.last_cache, 1)

@external
@view
def get_distribution_params() -> (uint256, uint256, decimal):
    """
    @notice Get distribution parameters
    @return Tuple of (mean, stddev, lambda_param) - lambda_param is 0 for Gaussian
    """
    return (self.mean, self.stddev, 0.0)

@external
@view
def get_balance() -> uint256:
    """Get current contract balance"""
    return self.balance

@external
@view
def distribution_type() -> uint8:
    """Return distribution type (1 = Gaussian)"""
    return 1
