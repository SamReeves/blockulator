# @version ^0.4.0
"""
@title Gaussian Currency Future
@author Sam Reeves
@license MIT
"""

#pragma enable-decimals

# External calculator interfaces
interface SqrtCalculator:
    def calculate(x: decimal) -> decimal: view

interface ErfCalculator:
    def calculate(x: decimal) -> decimal: view

# Calculator contract addresses (set to your deployed addresses)
SQRT_CALC: constant(address) = empty(address)  # TODO: Set after deployment
ERF_CALC: constant(address) = empty(address)   # TODO: Set after deployment

owner: address
value: uint256
start: uint256
epoch: uint256

mu: uint256
sigma: uint256

t: uint256
left: decimal

@deploy
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
    # mu = epoch / 2
    # sigma = epoch / sqrt(12) (standard deviation of uniform distribution)
    self.mu = _epoch / 2
    
    # Calculate sigma = epoch / sqrt(12)
    # sqrt(12) = 3.464101615
    self.sigma = convert((convert(_epoch, decimal) / 3.464101615), uint256)

    # DATA FROM THE PREVIOUS ACTIVITY
    self.t = 0
    self.left = 0.0  # Start at left tail (CDF at t=0)

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
    Calculate the z-score for a given time.
    z = (t - mu) / sigma
    """
    if t >= mu:
        return convert(t - mu, decimal) / convert(sigma, decimal)
    else:
        return convert(mu - t, decimal) / convert(sigma, decimal) * -1.0

@internal
@view
def normal_cdf(z: decimal) -> decimal:
    """
    Calculate the cumulative distribution function of standard normal.
    Uses the error function: Phi(z) = 0.5 * (1 + erf(z/sqrt(2)))
    """
    if ERF_CALC == empty(address):
        # Fallback to approximation if ERF calculator not set
        return self.lin_approximation_cdf(z)
    
    # Calculate z/sqrt(2)
    z_normalized: decimal = z / 1.4142135624
    
    # Clamp z to valid range for erf calculator
    if z_normalized > 5.0:
        z_normalized = 5.0
    elif z_normalized < -5.0:
        z_normalized = -5.0
    
    # Call erf calculator
    erf_result: decimal = staticcall ErfCalculator(ERF_CALC).calculate(z_normalized)
    
    # Phi(z) = 0.5 * (1 + erf(z/sqrt(2)))
    return 0.5 * (1.0 + erf_result)

@internal
@pure
def lin_approximation_cdf(z: decimal) -> decimal:
    """
    Fallback: Lin 1990 approximation for normal CDF
    Used if ERF calculator is not available
    """
    # Handle absolute value for symmetric calculation
    sign: decimal = 1.0
    abs_z: decimal = z
    if z < 0.0:
        sign = -1.0
        abs_z = -z
    
    # Clamp to reasonable range
    if abs_z >= 9.0:
        if sign > 0.0:
            return 1.0
        else:
            return 0.0
    
    # Lin approximation: y = 4.2*pi * z / (9 - z)
    y: decimal = 13.194689145 * abs_z / (9.0 - abs_z)
    
    # Approximate e^y using Taylor series (since we don't have e^x)
    exp_y: decimal = 1.0 + y + (y * y / 2.0) + (y * y * y / 6.0)
    
    # tail = 1 - 1/(1 + e^y)
    tail: decimal = 1.0 - 1.0 / (1.0 + exp_y)
    
    # Convert tail to CDF
    if sign > 0.0:
        return tail
    else:
        return 1.0 - tail

@internal
@pure
def weight(cdf_left: decimal, cdf_right: decimal) -> decimal:
    """
    Calculate the weight (area under curve) between two CDF values.
    This represents the probability mass between two time points.
    """
    # Weight is simply the difference in CDF values
    # This works because CDF is monotonically increasing
    if cdf_right > cdf_left:
        return cdf_right - cdf_left
    else:
        return 0.0

@internal
@pure
def payment(v: uint256, w: decimal) -> uint256:
    """
    Calculate payment as value * weight
    """
    return convert(convert(v, decimal) * w, uint256)

@external
@payable
def give(new: address):
    """
    Transfer ownership to a new address.
    Calculates payment based on time-weighted holding period.
    The payment is proportional to the area under the normal curve
    during the holding period.
    """
    assert msg.sender == self.owner, "Only the owner can make calls."
    assert new != empty(address), "New owner cannot be the zero address."
    assert msg.value == 0, "No Eth should be sent to this function."
    assert new != self.owner, "New owner cannot be the same as the old owner."

    # IF CONTRACT IS EXPIRED, SEND REMAINING BALANCE TO OWNER AND SELFDESTRUCT
    if block.timestamp >= self.start + self.epoch:
        raw_call(self.owner, b"", value=self.balance)
        selfdestruct(self.owner)

    # Calculate time elapsed
    t_elapsed: uint256 = block.timestamp - self.start
    
    # Calculate z-scores for both time points
    z_left: decimal = self.z_score(self.t, self.mu, self.sigma)
    z_right: decimal = self.z_score(t_elapsed, self.mu, self.sigma)
    
    # Get CDF values (area under curve up to each time point)
    cdf_left: decimal = self.left if self.t > 0 else self.normal_cdf(z_left)
    cdf_right: decimal = self.normal_cdf(z_right)
    
    # Calculate weight (probability mass in holding period)
    w: decimal = self.weight(cdf_left, cdf_right)

    # Calculate payment
    pmt: uint256 = self.payment(self.value, w)

    # Update state
    self.t = t_elapsed
    self.left = cdf_right
    
    # Send payment and transfer ownership
    raw_call(self.owner, b"", value=pmt)
        self.owner = new
