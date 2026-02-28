#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

"""
@title Gaussian Tail Probability Calculator
@notice Calculates Gaussian tail probabilities using Lin 1990 approximation
@dev Thin calculator that calls exp.vy externally - used for Gaussian futures
"""

# Interface for exp calculator
interface IExp:
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

# Constants
LIN_CONSTANT: constant(decimal) = 13.194689145  # 4.2 * π for Lin 1990 formula

# External calculator
exp_calculator: public(IExp)

@deploy
def __init__(_exp_calc: address):
    """
    @notice Initialize gaussian_tail calculator
    @param _exp_calc Address of exp calculator contract
    """
    assert _exp_calc != empty(address), "Exp calculator cannot be zero address"
    self.exp_calculator = IExp(_exp_calc)

@external
@view
def calculate(z: decimal) -> decimal:
    """
    @notice Calculate Gaussian tail probability using Lin 1990 approximation
    @dev Computes P(Z > |z|) for standard normal distribution
    @param z The z-score (standard deviations from mean)
    @return Tail probability in range [0, 1]
    """
    assert z >= 0.0, "Z-score must be non-negative (use absolute value)"
    assert z < 9.0, "Z-score too large (>= 9)"
    
    if z == 0.0:
        return 0.5
    
    # Lin 1990 formula: y = 13.194689145 * z / (9 - z)
    y: decimal = LIN_CONSTANT * z / (9.0 - z)
    
    # Calculate e^y using external calculator
    exp_y: decimal = staticcall self.exp_calculator.calculate(y)
    
    # Tail probability: 1 - 1/(1 + e^y)
    return 1.0 - 1.0 / (1.0 + exp_y)

@external
@pure
def z_score(t: decimal, mu: decimal, sigma: decimal) -> decimal:
    """
    @notice Calculate z-score (standardized distance from mean)
    @param t The time or value to evaluate
    @param mu The mean (center)
    @param sigma The standard deviation (spread)
    @return Z-score (number of standard deviations from mean)
    """
    assert sigma > 0.0, "Standard deviation must be positive"
    
    if t > mu:
        return (t - mu) / sigma
    else:
        return (mu - t) / sigma

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get the Lin 1990 constant (4.2 * π)
    @return The constant ≈ 13.194689145
    """
    return LIN_CONSTANT

