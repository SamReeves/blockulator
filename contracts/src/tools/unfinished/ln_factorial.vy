# @version 0.4.3
# @author Sam Reeves
# PSEUDOCODE - NOT IMPLEMENTED YET

# Natural log of factorial: ln(n!)
# Uses Stirling's approximation for large n
# For small n, use lookup table of exact values

# PSEUDOCODE:
# LN_FACTORIALS: constant(decimal[21]) = [
#     0.0,                  # ln(0!) = ln(1) = 0
#     0.0,                  # ln(1!) = 0
#     0.6931471806,         # ln(2!)
#     1.7917594692,         # ln(3!)
#     3.1780538303,         # ln(4!)
#     4.7874917428,         # ln(5!)
#     6.5792512120,         # ln(6!)
#     8.5251613611,         # ln(7!)
#     10.6046029027,        # ln(8!)
#     12.8018274801,        # ln(9!)
#     15.1044125731,        # ln(10!)
#     # ... up to ln(20!)
# ]
#
# PI: constant(decimal) = 3.1415926536
# E: constant(decimal) = 2.7182818285
#
# @external
# @view
# def calculate(n: uint256) -> decimal:
#     """
#     @notice Calculate ln(n!) 
#     @param n Integer
#     @return ln(n!)
#     """
#     # If n <= 20:
#     #     return LN_FACTORIALS[n]
#     # 
#     # Else use Stirling's approximation:
#     # ln(n!) ≈ n*ln(n) - n + 0.5*ln(2πn)
#     # 
#     # n_dec = convert(n, decimal)
#     # term1 = n_dec * ln.calculate(n_dec)
#     # term2 = n_dec
#     # term3 = 0.5 * ln.calculate(2.0 * PI * n_dec)
#     # return term1 - term2 + term3
#     pass

