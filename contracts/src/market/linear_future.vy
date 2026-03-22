#pragma enable-decimals
# @version 0.4.3

"""
@title Linear Future - Triangular Payout Distribution
@author Sam Reeves
@notice Tradeable future with linear growth or decay payout distribution
@dev Thin contract supporting both growth (type 5) and decay (type 4) with no external dependencies
"""

# State variables
current_owner: public(address)
initial_value: public(uint256)
start_time: public(uint256)
lifetime: public(uint256)
expired: public(bool)
factory: public(immutable(address))
locked: public(bool)
is_growth: public(bool)  # True for growth (type 5), False for decay (type 4)

# Tracking state
last_t: public(uint256)
last_cache: public(decimal)

@deploy
@payable
def __init__(_lifetime: uint256, _is_growth: bool, _owner: address, _factory: address):
    """
    @notice Initialize linear future
    @param _lifetime Duration in seconds
    @param _is_growth True for linear growth (type 5), False for linear decay (type 4)
    @param _owner The address that will own this future
    @param _factory The factory contract address
    """
    assert _lifetime >= 60, "Lifetime must be at least 60 seconds"
    assert msg.value > 0, "Must send ETH to deploy"
    assert _owner != empty(address), "Owner cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"

    factory = _factory
    self.start_time = block.timestamp
    self.lifetime = _lifetime
    self.current_owner = _owner
    self.initial_value = msg.value
    self.is_growth = _is_growth
    self.last_t = 0
    self.expired = False
    self.locked = False
    self.last_cache = 0.0

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
    
    # Calculate weight based on distribution type
    weight: decimal = 0.0
    new_cache: decimal = 0.0
    
    if self.is_growth:
        # LINEAR GROWTH: Payout increases linearly (type 5)
        # CDF: F(t) = (t/T)^2
        weight, new_cache = self._linear_growth_weight(self.last_t, t_current)
    else:
        # LINEAR DECAY: Payout decreases linearly (type 4)
        # CDF: F(t) = 2t/T - (t/T)^2
        weight, new_cache = self._linear_decay_weight(self.last_t, t_current)
    
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
def _linear_growth_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Linear Growth weight
    @dev CDF of P(t) = t/T → F(t) = (t/T)^2
    """
    # Handle expiration case
    if t_current >= self.lifetime:
        # Remaining area from t_last to end
        remaining_mass: decimal = (convert(self.lifetime, decimal) * convert(self.lifetime, decimal) - convert(t_last, decimal) * convert(t_last, decimal)) / (convert(self.lifetime, decimal) * convert(self.lifetime, decimal))
        return (remaining_mass, 1.0)
    
    # Calculate CDF values
    ratio_current: decimal = convert(t_current, decimal) / convert(self.lifetime, decimal)
    cdf_current: decimal = ratio_current * ratio_current
    
    # Weight is change in CDF
    weight: decimal = cdf_current - self.last_cache
    
    return (weight, cdf_current)

@internal
@view
def _linear_decay_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Linear Decay weight
    @dev P(t) = (T - t) / T → CDF: F(t) = 2t/T - (t/T)^2
    """
    # Handle expiration case
    if t_current >= self.lifetime:
        # Pay out all remaining weight
        remaining_time: uint256 = self.lifetime - t_last
        weight: decimal = convert(remaining_time, decimal) * convert(remaining_time, decimal) / (2.0 * convert(self.lifetime, decimal) * convert(self.lifetime, decimal))
        return (weight, 1.0)
    
    # Calculate area from t_last to t_current
    elapsed: uint256 = t_current - t_last
    sum_times: uint256 = t_last + t_current
    
    # Numerator: elapsed * (2*lifetime - sum_times)
    numerator: decimal = convert(elapsed, decimal) * convert(2 * self.lifetime - sum_times, decimal)
    
    # Denominator: 2 * lifetime^2
    denominator: decimal = 2.0 * convert(self.lifetime, decimal) * convert(self.lifetime, decimal)
    
    weight: decimal = numerator / denominator
    
    # Cache current proportion
    proportion: decimal = convert(t_current, decimal) / convert(self.lifetime, decimal)
    
    return (weight, proportion)

@external
@view
def get_current_state() -> (uint256, decimal, uint8):
    """
    @notice Get current state for valuation
    @return Tuple of (last_t, last_cache, distribution_type)
    """
    dist_type: uint8 = 5 if self.is_growth else 4
    return (self.last_t, self.last_cache, dist_type)

@external
@view
def get_distribution_params() -> (uint256, uint256, decimal):
    """
    @notice Get distribution parameters
    @return Tuple of (mean, stddev, lambda_param) - all zeros for linear
    """
    return (0, 0, 0.0)

@external
@view
def get_balance() -> uint256:
    """Get current contract balance"""
    return self.balance

@external
@view
def distribution_type() -> uint8:
    """Return distribution type (4 = Linear Decay, 5 = Linear Growth)"""
    if self.is_growth:
        return 5
    else:
        return 4
