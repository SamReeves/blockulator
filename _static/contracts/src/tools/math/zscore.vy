#pragma enable-decimals
# @version 0.4.3
# @author Sam Reeves

"""
@title Z-Score Calculator
@notice Calculate standardized distance from mean (z-score)
@dev Pure arithmetic calculator with no dependencies - z = (x - μ) / σ
"""

@external
@pure
def calculate(t: decimal, mu: decimal, sigma: decimal) -> decimal:
    """
    @notice Calculate z-score (standard deviations from mean)
    @param t The value to evaluate
    @param mu The mean (center of distribution)
    @param sigma The standard deviation (spread)
    @return Z-score: (t - μ) / σ (number of standard deviations from mean)
    """
    assert sigma > 0.0, "Standard deviation must be positive"
    
    if t > mu:
        return (t - mu) / sigma
    else:
        return (mu - t) / sigma

@external
@pure
def z_score_signed(t: decimal, mu: decimal, sigma: decimal) -> decimal:
    """
    @notice Calculate signed z-score (preserves direction)
    @param t The value to evaluate
    @param mu The mean
    @param sigma The standard deviation
    @return Signed z-score: (t - μ) / σ
    """
    assert sigma > 0.0, "Standard deviation must be positive"
    return (t - mu) / sigma

