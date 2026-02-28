#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

"""
@title Binomial Coefficient Calculator
@notice Calculate C(n,k) = n! / (k! * (n-k)!) - "n choose k"
@dev Uses external factorial calculator via staticcall
"""

# Interface for factorial calculator
interface IFactorial:
    def calculate(n: uint256) -> uint256: pure

# External calculator
factorial_calculator: public(IFactorial)

@deploy
def __init__(_factorial_calc: address):
    """
    @notice Initialize binomial coefficient calculator
    @param _factorial_calc Address of factorial calculator contract
    """
    assert _factorial_calc != empty(address), "Factorial calculator cannot be zero address"
    self.factorial_calculator = IFactorial(_factorial_calc)

@external
@view
def calculate(n: uint256, k: uint256) -> uint256:
    """
    @notice Calculate binomial coefficient C(n,k) = n! / (k! * (n-k)!)
    @param n Total items (must be <= 20)
    @param k Items to choose (must be <= n)
    @return Binomial coefficient C(n,k)
    """
    assert k <= n, "k must be <= n"
    assert n <= 20, "n must be <= 20 (factorial overflow beyond 20)"
    
    # Optimize: C(n,k) = C(n, n-k), so use the smaller k
    k_use: uint256 = k
    if k_use > n - k_use:
        k_use = n - k_use
    
    # Calculate using factorials
    n_fact: uint256 = staticcall self.factorial_calculator.calculate(n)
    k_fact: uint256 = staticcall self.factorial_calculator.calculate(k_use)
    nk_fact: uint256 = staticcall self.factorial_calculator.calculate(n - k_use)
    
    return n_fact // (k_fact * nk_fact)

@external
@view
def permutations(n: uint256, k: uint256) -> uint256:
    """
    @notice Calculate permutations P(n,k) = n! / (n-k)!
    @param n Total items (must be <= 20)
    @param k Items to arrange (must be <= n)
    @return Permutations P(n,k)
    """
    assert k <= n, "k must be <= n"
    assert n <= 20, "n must be <= 20"
    
    n_fact: uint256 = staticcall self.factorial_calculator.calculate(n)
    nk_fact: uint256 = staticcall self.factorial_calculator.calculate(n - k)
    
    return n_fact // nk_fact

@external
@pure
def get_constant() -> uint256:
    """
    @notice Get a reference constant (1 choose 1 = 1)
    @return The constant 1
    """
    return 1
