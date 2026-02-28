# @version 0.4.3
#pragma enable-decimals

"""
@title Math Tools Caller Test Contract
@author Sam Reeves
@notice Test contract to verify cross-contract calls to pure math functions
@dev This contract demonstrates that gas estimation now works correctly
"""

# ========================================
# INTERFACES
# ========================================

interface ILn:
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

interface IExp:
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

interface ISqrt:
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

interface IFactorial:
    def calculate(n: uint256) -> uint256: pure
    def get_constant() -> uint256: pure

interface INormCDF:
    def calculate(x: decimal, mu: decimal, sigma: decimal) -> decimal: pure
    def standard_cdf(z: decimal) -> decimal: pure
    def get_constant() -> decimal: pure

# ========================================
# STATE VARIABLES
# ========================================

ln_calculator: public(ILn)
exp_calculator: public(IExp)
sqrt_calculator: public(ISqrt)
factorial_calculator: public(IFactorial)
norm_cdf_calculator: public(INormCDF)

owner: public(address)

# ========================================
# DEPLOYMENT
# ========================================

@deploy
def __init__(
    _ln: address,
    _exp: address,
    _sqrt: address,
    _factorial: address,
    _norm_cdf: address
):
    """
    @notice Initialize with addresses of math tool contracts
    @dev All addresses should point to deployed pure math contracts
    """
    self.ln_calculator = ILn(_ln)
    self.exp_calculator = IExp(_exp)
    self.sqrt_calculator = ISqrt(_sqrt)
    self.factorial_calculator = IFactorial(_factorial)
    self.norm_cdf_calculator = INormCDF(_norm_cdf)
    self.owner = msg.sender

# ========================================
# TEST FUNCTIONS
# ========================================

@external
@view
def test_ln_calculation(x: decimal) -> decimal:
    """
    @notice Test ln(x) calculation via external call
    @dev Gas estimation should work perfectly with @pure
    @param x Input value
    @return ln(x)
    """
    return staticcall self.ln_calculator.calculate(x)

@external
@view
def test_exp_calculation(x: decimal) -> decimal:
    """
    @notice Test e^x calculation via external call
    @param x Input value
    @return e^x
    """
    return staticcall self.exp_calculator.calculate(x)

@external
@view
def test_sqrt_calculation(x: decimal) -> decimal:
    """
    @notice Test sqrt(x) calculation via external call
    @param x Input value
    @return sqrt(x)
    """
    return staticcall self.sqrt_calculator.calculate(x)

@external
@view
def test_factorial_calculation(n: uint256) -> uint256:
    """
    @notice Test n! calculation via external call
    @param n Input value (0-20)
    @return n!
    """
    return staticcall self.factorial_calculator.calculate(n)

@external
@view
def test_norm_cdf_calculation(z: decimal) -> decimal:
    """
    @notice Test standard normal CDF via external call
    @param z Input z-score
    @return Φ(z)
    """
    return staticcall self.norm_cdf_calculator.standard_cdf(z)

# ========================================
# COMPLEX TESTS
# ========================================

@external
@view
def test_log_ratio(x: decimal, y: decimal) -> decimal:
    """
    @notice Calculate ln(x) - ln(y) = ln(x/y)
    @dev Tests multiple calls in one function
    @param x Numerator
    @param y Denominator
    @return ln(x/y)
    """
    ln_x: decimal = staticcall self.ln_calculator.calculate(x)
    ln_y: decimal = staticcall self.ln_calculator.calculate(y)
    return ln_x - ln_y

@external
@view
def test_compound_growth(rate: decimal, time: decimal) -> decimal:
    """
    @notice Calculate e^(rate * time) for compound growth
    @dev Tests multiplication then exponential
    @param rate Growth rate
    @param time Time period
    @return Growth multiplier
    """
    exponent: decimal = rate * time
    return staticcall self.exp_calculator.calculate(exponent)

@external
@view
def test_geometric_mean(x: decimal, y: decimal) -> decimal:
    """
    @notice Calculate sqrt(x * y) - geometric mean
    @dev Tests complex calculation with sqrt
    @param x First value
    @param y Second value
    @return Geometric mean
    """
    product: decimal = x * y
    return staticcall self.sqrt_calculator.calculate(product)

@external
@view
def test_black_scholes_component(S: decimal, K: decimal, sigma: decimal, T: decimal) -> decimal:
    """
    @notice Calculate d1 component of Black-Scholes formula
    @dev d1 = [ln(S/K) + 0.5*sigma^2*T] / (sigma*sqrt(T))
    @param S Current stock price
    @param K Strike price
    @param sigma Volatility
    @param T Time to expiration
    @return d1 value
    """
    # ln(S/K)
    ln_s: decimal = staticcall self.ln_calculator.calculate(S)
    ln_k: decimal = staticcall self.ln_calculator.calculate(K)
    ln_ratio: decimal = ln_s - ln_k
    
    # 0.5 * sigma^2 * T
    sigma_squared: decimal = sigma * sigma
    half_var_time: decimal = 0.5 * sigma_squared * T
    
    # sigma * sqrt(T)
    sqrt_t: decimal = staticcall self.sqrt_calculator.calculate(T)
    sigma_sqrt_t: decimal = sigma * sqrt_t
    
    # d1
    numerator: decimal = ln_ratio + half_var_time
    return numerator / sigma_sqrt_t

@external
@view
def test_probability_calculation(z: decimal) -> decimal:
    """
    @notice Calculate P(Z <= z) for standard normal
    @dev Uses norm_cdf external call
    @param z Z-score
    @return Probability
    """
    return staticcall self.norm_cdf_calculator.standard_cdf(z)

# ========================================
# CONSTANTS ACCESS
# ========================================

@external
@view
def get_all_constants() -> (decimal, decimal, decimal, uint256, decimal):
    """
    @notice Get all mathematical constants from calculators
    @return Tuple of (e, e, sqrt(2), 2!, sqrt(2))
    """
    e_from_ln: decimal = staticcall self.ln_calculator.get_constant()
    e_from_exp: decimal = staticcall self.exp_calculator.get_constant()
    sqrt_2: decimal = staticcall self.sqrt_calculator.get_constant()
    two_factorial: uint256 = staticcall self.factorial_calculator.get_constant()
    sqrt_2_from_norm: decimal = staticcall self.norm_cdf_calculator.get_constant()
    
    return (e_from_ln, e_from_exp, sqrt_2, two_factorial, sqrt_2_from_norm)

# ========================================
# GAS ESTIMATION TEST
# ========================================

@external
@view
def test_gas_estimation_heavy() -> (decimal, decimal, decimal, decimal):
    """
    @notice Heavy gas test - multiple external calls
    @dev This function would have FAILED with @view, but works with @pure
    @return Tuple of results
    """
    result1: decimal = staticcall self.ln_calculator.calculate(2.7182818285)
    result2: decimal = staticcall self.exp_calculator.calculate(1.0)
    result3: decimal = staticcall self.sqrt_calculator.calculate(2.0)
    result4: decimal = staticcall self.norm_cdf_calculator.standard_cdf(0.0)
    
    return (result1, result2, result3, result4)

