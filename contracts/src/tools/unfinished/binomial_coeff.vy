# @version 0.4.3
# @author L1Ca$h
# PSEUDOCODE - NOT IMPLEMENTED YET

# Binomial coefficient: C(n,k) = n! / (k! * (n-k)!)
# Also written as "n choose k"
# Uses factorial contract for small values
# Uses ln_factorial for large values to avoid overflow

# PSEUDOCODE:
# @external
# @view
# def calculate(n: uint256, k: uint256) -> uint256:
#     """
#     @notice Calculate C(n,k) = n! / (k! * (n-k)!)
#     @param n Total items
#     @param k Items to choose
#     @return Binomial coefficient
#     """
#     # assert k <= n, "k must be <= n"
#     # 
#     # # Optimize: C(n,k) = C(n, n-k)
#     # if k > n - k:
#     #     k = n - k
#     #
#     # # For small n, use direct factorial calculation
#     # if n <= 20:
#     #     n_fact = factorial.calculate(n)
#     #     k_fact = factorial.calculate(k)
#     #     nk_fact = factorial.calculate(n - k)
#     #     return n_fact / (k_fact * nk_fact)
#     #
#     # # For large n, use logarithms to avoid overflow
#     # # C(n,k) = exp(ln(n!) - ln(k!) - ln((n-k)!))
#     # ln_result = ln_factorial.calculate(n)
#     # ln_result -= ln_factorial.calculate(k)
#     # ln_result -= ln_factorial.calculate(n - k)
#     # return convert(exp.calculate(ln_result), uint256)
#     pass
#
# @external
# @view
# def permutations(n: uint256, k: uint256) -> uint256:
#     """P(n,k) = n! / (n-k)!"""
#     # assert k <= n
#     # if n <= 20:
#     #     return factorial.calculate(n) / factorial.calculate(n - k)
#     # # Use ln method for large n
#     pass

