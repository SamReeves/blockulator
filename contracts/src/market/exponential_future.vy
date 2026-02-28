#pragma enable-decimals
# @version 0.4.3

"""
@title Exponential Future - Exponential Decay/Growth Distribution
@author Sam Reeves
@notice Tradeable future with exponential payout distribution (early or late weighted)
@dev Thin contract that calls external exp calculator for e^x calculations
"""

# Interface for exp calculator
interface IExp:
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

# State variables
current_owner: public(address)
initial_value: public(uint256)
start_time: public(uint256)
lifetime: public(uint256)
expired: public(bool)
factory: public(immutable(address))
locked: public(bool)
is_growth: public(bool)  # True for growth (type 3), False for decay (type 2)

# Distribution parameters
lambda_param: public(decimal)  # λ = 3 / lifetime

# Tracking state
last_t: public(uint256)
last_cache: public(decimal)

# External calculator
exp_calculator: public(IExp)

@deploy
@payable
def __init__(_lifetime: uint256, _is_growth: bool, _owner: address, _factory: address, _exp_calc: address):
    """
    @notice Initialize exponential future
    @param _lifetime Duration in seconds
    @param _is_growth True for exponential growth (type 3), False for decay (type 2)
    @param _owner The address that will own this future
    @param _factory The factory contract address
    @param _exp_calc Address of exp calculator contract
    """
    assert _lifetime >= 60, "Lifetime must be at least 60 seconds"
    assert msg.value > 0, "Must send ETH to deploy"
    assert _owner != empty(address), "Owner cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"
    assert _exp_calc != empty(address), "Exp calculator cannot be zero address"

    factory = _factory
    self.start_time = block.timestamp
    self.lifetime = _lifetime
    self.current_owner = _owner
    self.initial_value = msg.value
    self.is_growth = _is_growth
    self.last_t = 0
    self.expired = False
    self.locked = False
    
    # Initialize calculator
    self.exp_calculator = IExp(_exp_calc)
    
    # Initialize distribution parameters
    self.lambda_param = 3.0 / convert(_lifetime, decimal)
    
    # Initialize cache based on type
    if _is_growth:
        # Growth: CDF starts at 0
        self.last_cache = 0.0
    else:
        # Decay: exp starts at e^0 = 1
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
    
    # Calculate weight based on distribution type
    weight: decimal = 0.0
    new_cache: decimal = 0.0
    
    if self.is_growth:
        # EXPONENTIAL GROWTH: Back-loaded payouts
        weight, new_cache = self._exp_growth_weight(self.last_t, t_current)
    else:
        # EXPONENTIAL DECAY: Front-loaded payouts
        weight, new_cache = self._exp_decay_weight(self.last_t, t_current)
    
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
def _exp_decay_weight(t_last: uint256, t_current: uint256) -> (decimal, decimal):
    """
    @notice Calculate Exponential Decay weight
    @return Tuple of (weight, new_exp_cache)
    """
    # Calculate e^(-λt) using reciprocal: e^(-x) = 1 / e^x
    exp_current: decimal = self._exp_minus(t_current)
    
    # Weight is the probability mass between last and current
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
    exp_current: decimal = self._exp_minus(t_current)
    cdf_current: decimal = 1.0 - exp_current
    
    # Weight is the CDF difference (normalized by remaining mass)
    remaining_mass: decimal = 1.0 - self.last_cache
    
    weight: decimal = 0.0
    if remaining_mass > 0.0:
        weight = (cdf_current - self.last_cache) / remaining_mass
    
    return (weight, cdf_current)

@internal
@view
def _exp_minus(t: uint256) -> decimal:
    """
    @notice Calculate e^(-λt) using reciprocal: e^(-x) = 1 / e^x
    @param t Time value
    @return e^(-λt)
    """
    # Calculate exponent: λt (positive value)
    exponent: decimal = self.lambda_param * convert(t, decimal)
    
    # Handle underflow: if exponent >= 10, return ~0
    if exponent >= 10.0:
        return 0.0
    
    # Clamp to valid range
    if exponent < 0.0:
        exponent = 0.0
    
    # Calculate e^x using external calculator
    exp_pos: decimal = staticcall self.exp_calculator.calculate(exponent)
    
    # Return reciprocal: e^(-x) = 1 / e^x
    if exp_pos > 0.0:
        return 1.0 / exp_pos
    else:
        return 0.0

@external
@view
def get_current_state() -> (uint256, decimal, uint8):
    """
    @notice Get current state for valuation
    @return Tuple of (last_t, last_cache, distribution_type)
    """
    dist_type: uint8 = 3 if self.is_growth else 2
    return (self.last_t, self.last_cache, dist_type)

@external
@view
def get_distribution_params() -> (uint256, uint256, decimal):
    """
    @notice Get distribution parameters
    @return Tuple of (mean, stddev, lambda_param) - only lambda_param used for exponential
    """
    return (0, 0, self.lambda_param)

@external
@view
def get_balance() -> uint256:
    """Get current contract balance"""
    return self.balance

@external
@view
def distribution_type() -> uint8:
    """Return distribution type (2 = Exp Decay, 3 = Exp Growth)"""
    if self.is_growth:
        return 3
    else:
        return 2
