#pragma enable-decimals
# @version 0.4.3

"""
@title Uniform Future - Linear Payout Distribution
@author Sam Reeves
@notice Tradeable future with uniform (constant rate) payout distribution
@dev Thin contract with no external math dependencies - just division
"""

# State variables
current_owner: public(address)
initial_value: public(uint256)
start_time: public(uint256)
lifetime: public(uint256)
expired: public(bool)
factory: public(immutable(address))
locked: public(bool)

# Tracking state for uniform distribution
last_t: public(uint256)
last_cache: public(decimal)

@deploy
@payable
def __init__(_lifetime: uint256, _owner: address, _factory: address):
    """
    @notice Initialize uniform future
    @param _lifetime Duration in seconds
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
    
    # UNIFORM DISTRIBUTION: constant payout rate
    # Weight is simply elapsed time / total lifetime
    weight: decimal = 0.0
    new_proportion: decimal = 0.0
    
    # Handle expiration case
    if t_current >= self.lifetime:
        remaining: uint256 = self.lifetime - self.last_t
        weight = convert(remaining, decimal) / convert(self.lifetime, decimal)
        new_proportion = 1.0
    else:
        # Calculate elapsed time since last transfer
        elapsed: uint256 = t_current - self.last_t
        weight = convert(elapsed, decimal) / convert(self.lifetime, decimal)
        
        # Cache current proportion
        new_proportion = convert(t_current, decimal) / convert(self.lifetime, decimal)
    
    # Calculate payment
    payment: uint256 = convert(convert(self.initial_value, decimal) * weight, uint256)
    
    # Update state
    self.last_t = t_current
    self.last_cache = new_proportion
    
    # Send payment and transfer ownership
    raw_call(self.current_owner, b"", value=payment)
    self.current_owner = new_owner

@external
@view
def get_current_state() -> (uint256, decimal, uint8):
    """
    @notice Get current state for valuation
    @return Tuple of (last_t, last_cache, distribution_type)
    """
    return (self.last_t, self.last_cache, 0)

@external
@view
def get_distribution_params() -> (uint256, uint256, decimal):
    """
    @notice Get distribution parameters
    @return Tuple of (mean, stddev, lambda_param) - all zeros for uniform
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
    """Return distribution type (0 = Uniform)"""
    return 0
