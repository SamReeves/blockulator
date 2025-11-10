#pragma enable-decimals
# @version 0.4.3
# @author L1Ca$h

# Natural log of factorial: ln(n!)
# Lookup table for n = 0 to 20
# For larger n, factorial overflows uint256 anyway

LN_FACTORIALS: constant(decimal[21]) = [
    0.0000000000,  # ln(0!)
    0.0000000000,  # ln(1!)
    0.6931471806,  # ln(2!)
    1.7917594692,  # ln(3!)
    3.1780538303,  # ln(4!)
    4.7874917428,  # ln(5!)
    6.5792512120,  # ln(6!)
    8.5251613611,  # ln(7!)
    10.6046029027,  # ln(8!)
    12.8018274801,  # ln(9!)
    15.1044125731,  # ln(10!)
    17.5023078459,  # ln(11!)
    19.9872144957,  # ln(12!)
    22.5521638531,  # ln(13!)
    25.1912211827,  # ln(14!)
    27.8992713838,  # ln(15!)
    30.6718601061,  # ln(16!)
    33.5050734501,  # ln(17!)
    36.3954452080,  # ln(18!)
    39.3398841872,  # ln(19!)
    42.3356164608   # ln(20!)
]

# ln(2) for reference
LN_2: constant(decimal) = 0.6931471806

@external
@view
def calculate(n: uint256) -> decimal:
    """
    @notice Calculate ln(n!) (FREE - no gas cost)
    @param n Integer from 0 to 20
    @return ln(n!)
    """
    assert n <= 20, "n must be <= 20 (factorial overflow beyond 20)"
    return LN_FACTORIALS[n]

@external
@view
def get_constant() -> decimal:
    """
    @notice Get ln(2) constant
    @return The constant ln(2) = 0.6931471806
    """
    return LN_2

