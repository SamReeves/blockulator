#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

"""
@title Normal (Gaussian) Probability Density Function
@notice Calculate φ(z) = (1/√(2π)) * e^(-z²/2)
@dev Uses external exp calculator via staticcall
"""

# Interface for exp calculator
interface IExp:
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

# Constants
INV_SQRT_2PI: constant(decimal) = 0.3989422804  # 1 / √(2π)
SQRT_2PI: constant(decimal) = 2.5066282746  # √(2π)

# External calculator
exp_calculator: public(IExp)

@deploy
def __init__(_exp_calc: address):
    """
    @notice Initialize normal PDF calculator
    @param _exp_calc Address of exp calculator contract
    """
    assert _exp_calc != empty(address), "Exp calculator cannot be zero address"
    self.exp_calculator = IExp(_exp_calc)

@external
@view
def calculate(z: decimal) -> decimal:
    """
    @notice Calculate standard normal PDF: φ(z) = (1/√(2π)) * e^(-z²/2)
    @param z The z-score (standard deviations from mean)
    @return Probability density at z
    """
    # Calculate z^2/2
    exponent: decimal = z * z / 2.0
    assert exponent < 10.0, "z too large (z^2 must be < 20)"
    
    # Use 1/e^(z²/2) since exp.vy only handles non-negative inputs
    exp_val: decimal = staticcall self.exp_calculator.calculate(exponent)
    
    return INV_SQRT_2PI / exp_val

@external
@view
def calculate_general(x: decimal, mu: decimal, sigma: decimal) -> decimal:
    """
    @notice Calculate general normal PDF: f(x;μ,σ) = (1/(σ√(2π))) * e^(-(x-μ)²/(2σ²))
    @param x The value to evaluate
    @param mu Mean (center of distribution)
    @param sigma Standard deviation (spread)
    @return Probability density at x
    """
    assert sigma > 0.0, "Standard deviation must be positive"
    
    # Calculate z-score
    z: decimal = (x - mu) / sigma
    
    # Calculate z^2/2
    exponent: decimal = z * z / 2.0
    assert exponent < 10.0, "Value too far from mean"
    
    # Use 1/e^(z²/2)
    exp_val: decimal = staticcall self.exp_calculator.calculate(exponent)
    
    return (INV_SQRT_2PI / sigma) / exp_val

@external
@pure
def get_constant() -> decimal:
    """
    @notice Get the normalization constant 1/√(2π)
    @return The constant ≈ 0.3989422804
    """
    return INV_SQRT_2PI
