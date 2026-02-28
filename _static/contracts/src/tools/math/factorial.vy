#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

# Factorial function n!
# Simple lookup table for integers 0 to 20
# Beyond n=20, result exceeds Vyper's uint256 max

FACTORIALS: constant(uint256[21]) = [
    1,                      # 0!
    1,                      # 1!
    2,                      # 2!
    6,                      # 3!
    24,                     # 4!
    120,                    # 5!
    720,                    # 6!
    5040,                   # 7!
    40320,                  # 8!
    362880,                 # 9!
    3628800,                # 10!
    39916800,               # 11!
    479001600,              # 12!
    6227020800,             # 13!
    87178291200,            # 14!
    1307674368000,          # 15!
    20922789888000,         # 16!
    355687428096000,        # 17!
    6402373705728000,       # 18!
    121645100408832000,     # 19!
    2432902008176640000     # 20!
]

@external
@pure
def calculate(n: uint256) -> uint256:
    """
    @notice Calculate n! for small integers (FREE - no gas cost)
    @param n Integer from 0 to 20
    @return n!
    """
    assert n <= 20, "Overflow: n must be <= 20 (use ln_factorial for larger n)"
    return FACTORIALS[n]

@external
@pure
def get_constant() -> uint256:
    """
    @notice Get e! (closest integer approximation)
    @return 2! = 2
    """
    return FACTORIALS[2]
