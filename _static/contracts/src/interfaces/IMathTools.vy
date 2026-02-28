# @version 0.4.3
#pragma enable-decimals

"""
@title Math Tools Interfaces
@author Sam Reeves
@notice Standard interfaces for calling pure mathematical tool contracts
@dev All functions are @pure - no state access, deterministic gas estimation
"""

# ========================================
# STANDARD MATH TOOLS
# ========================================

interface IExp:
    """Natural exponential: e^x"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns e

interface ILn:
    """Natural logarithm: ln(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns e

interface ISqrt:
    """Square root: √x"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns √2

interface IErf:
    """Error function: erf(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 2/√π

interface IFactorial:
    """Factorial: n! (uint256 input/output)"""
    def calculate(n: uint256) -> uint256: pure
    def get_constant() -> uint256: pure  # Returns 2! = 2

interface ILnFactorial:
    """Log factorial: ln(n!) (uint256 input, decimal output)"""
    def calculate(n: uint256) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns ln(2)

interface IBinomialCoeff:
    """Binomial coefficient: C(n,k) = n! / (k! * (n-k)!)"""
    def calculate(n: uint256, k: uint256) -> uint256: view
    def permutations(n: uint256, k: uint256) -> uint256: view
    def get_constant() -> uint256: pure  # Returns 1

interface INormCDF:
    """Normal CDF: Φ(x; μ, σ)"""
    def calculate(x: decimal, mu: decimal, sigma: decimal) -> decimal: pure
    def standard_cdf(z: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns √2

interface IGaussianTail:
    """Gaussian tail probability using Lin 1990 approximation"""
    def calculate(z: decimal) -> decimal: view
    def z_score(t: decimal, mu: decimal, sigma: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 4.2π ≈ 13.195

interface IZScore:
    """Z-score calculator: standardized distance from mean"""
    def calculate(t: decimal, mu: decimal, sigma: decimal) -> decimal: pure
    def z_score_signed(t: decimal, mu: decimal, sigma: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 1.0

interface INormPdf:
    """Normal probability density function: φ(z)"""
    def calculate(z: decimal) -> decimal: view
    def calculate_general(x: decimal, mu: decimal, sigma: decimal) -> decimal: view
    def get_constant() -> decimal: pure  # Returns 1/√(2π)

# ========================================
# POWER FUNCTIONS
# ========================================

interface IPow2:
    """Binary exponential: 2^x"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 2

interface IPow10:
    """Decimal exponential: 10^x"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 10

# ========================================
# LOGARITHM FUNCTIONS
# ========================================

interface ILog2:
    """Binary logarithm: log₂(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 2

interface ILog10:
    """Common logarithm: log₁₀(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns 10

# ========================================
# TRIGONOMETRIC FUNCTIONS
# ========================================

interface ISin:
    """Sine: sin(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns sin(π/2) = 1

interface ICos:
    """Cosine: cos(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns cos(0) = 1

interface IAtan:
    """Arctangent: atan(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns π/4

interface ITanh:
    """Hyperbolic tangent: tanh(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns tanh(0) = 0

interface ISinh:
    """Hyperbolic sine: sinh(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns sinh(1)

interface ICosh:
    """Hyperbolic cosine: cosh(x)"""
    def calculate(x: decimal) -> decimal: pure
    def get_constant() -> decimal: pure  # Returns cosh(0) = 1

# ========================================
# NUMBER THEORY
# ========================================

interface IGCD:
    """Greatest common divisor and least common multiple"""
    def calculate(a: uint256, b: uint256) -> uint256: pure  # GCD
    def lcm(a: uint256, b: uint256) -> uint256: pure  # LCM
    def get_constant() -> uint256: pure  # Returns 1

# ========================================
# MATHEMATICAL CONSTANTS
# ========================================

interface IConstantE:
    """Euler's number: e"""
    def calculate(x: decimal) -> decimal: pure  # Returns e^x
    def get_constant() -> decimal: pure  # Returns e

interface IConstantPi:
    """Pi: π"""
    def calculate(x: decimal) -> decimal: pure  # Returns π^x
    def get_constant() -> decimal: pure  # Returns π

interface IConstantTau:
    """Tau: τ = 2π"""
    def calculate(x: decimal) -> decimal: pure  # Returns τ^x
    def get_constant() -> decimal: pure  # Returns τ

# ========================================
# USAGE EXAMPLES
# ========================================

"""
Example 1: Using ln calculator in a contract

interface ILn:
    def calculate(x: decimal) -> decimal: pure

ln_calculator: public(ILn)

@deploy
def __init__(ln_addr: address):
    self.ln_calculator = ILn(ln_addr)

@external
@view
def calculate_log_ratio(x: decimal, y: decimal) -> decimal:
    # Gas estimation works perfectly with @pure!
    ln_x: decimal = staticcall self.ln_calculator.calculate(x)
    ln_y: decimal = staticcall self.ln_calculator.calculate(y)
    return ln_x - ln_y
"""

"""
Example 2: Using multiple math tools

interface IExp:
    def calculate(x: decimal) -> decimal: pure

interface INormCDF:
    def standard_cdf(z: decimal) -> decimal: pure

exp_calculator: public(IExp)
norm_cdf_calculator: public(INormCDF)

@deploy
def __init__(exp_addr: address, norm_cdf_addr: address):
    self.exp_calculator = IExp(exp_addr)
    self.norm_cdf_calculator = INormCDF(norm_cdf_addr)

@external
@view
def complex_calculation(x: decimal) -> decimal:
    exp_result: decimal = staticcall self.exp_calculator.calculate(x)
    cdf_result: decimal = staticcall self.norm_cdf_calculator.standard_cdf(x)
    return exp_result * cdf_result
"""

