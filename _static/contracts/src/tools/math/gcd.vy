# @version 0.4.3
# @author Sam Reeves

"""
@title Greatest Common Divisor and Least Common Multiple
@notice Calculate GCD and LCM using Euclidean algorithm
@dev Pure arithmetic, no dependencies, minimal gas cost
"""

@external
@pure
def calculate(a: uint256, b: uint256) -> uint256:
    """
    @notice Calculate greatest common divisor using Euclidean algorithm
    @param a First number
    @param b Second number
    @return GCD(a, b)
    """
    # Handle edge cases
    if a == 0:
        return b
    if b == 0:
        return a
    
    # Euclidean algorithm
    x: uint256 = a
    y: uint256 = b
    for _: uint256 in range(256):
        if y == 0:
            break
        temp: uint256 = y
        y = x % y
        x = temp
    
    return x

@external
@pure
def lcm(a: uint256, b: uint256) -> uint256:
    """
    @notice Calculate least common multiple: LCM(a,b) = (a * b) / GCD(a,b)
    @param a First number
    @param b Second number
    @return LCM(a, b)
    """
    # Handle edge cases
    if a == 0 or b == 0:
        return 0
    
    # Calculate GCD first
    gcd_val: uint256 = self._gcd(a, b)
    
    # LCM = (a * b) / GCD
    # Rearrange to avoid overflow: LCM = a * (b // GCD)
    return a * (b // gcd_val)

@internal
@pure
def _gcd(a: uint256, b: uint256) -> uint256:
    """
    @notice Internal GCD calculation
    @param a First number
    @param b Second number
    @return GCD(a, b)
    """
    if a == 0:
        return b
    if b == 0:
        return a
    
    x: uint256 = a
    y: uint256 = b
    for _: uint256 in range(256):
        if y == 0:
            break
        temp: uint256 = y
        y = x % y
        x = temp
    
    return x

@external
@pure
def get_constant() -> uint256:
    """
    @notice Get a reference constant (GCD(1,1) = 1)
    @return The constant 1
    """
    return 1
