/**
 * Distribution CDF Calculator
 * Computes cumulative distribution function values for all 6 distribution types.
 *
 * These must match the on-chain Vyper contracts (eulerian_future.vy)
 * so the chart preview is faithful to the actual payout curve.
 */

/**
 * Lin 1990 Gaussian tail approximation — mirrors the Vyper _tail / _y_constant helpers.
 * @param {number} z  Non-negative z-score  |t − μ| / σ
 * @returns {number}  tail probability  (≈ Φ(z) for large z, 0.5 at z = 0)
 */
function gaussianTail(z) {
    if (z <= 0) return 0.5;
    if (z >= 9) return 1.0;
    const y = 13.194689145 * z / (9.0 - z);
    const expY = Math.exp(y);
    return 1.0 - 1.0 / (1.0 + expY);
}

/**
 * Compute CDF value for a given time and distribution type
 * @param {number} t - Current time in seconds
 * @param {number} lifetime - Total lifetime in seconds
 * @param {number} distributionType - Distribution type (0-5)
 * @returns {number} CDF value between 0 and 1
 */
export function computeCdfValue(t, lifetime, distributionType) {
    if (t <= 0) return 0;
    if (t >= lifetime) return 1;

    if (distributionType === 0) {
        // UNIFORM: Constant rate → Linear payout
        return t / lifetime;

    } else if (distributionType === 1) {
        // GAUSSIAN: Uses Lin 1990 tail approximation (same as on-chain)
        const mean = lifetime / 2;
        const stddev = lifetime / 3.464101615;
        const z = Math.abs(t - mean) / stddev;
        const tail = gaussianTail(z);
        // CDF: before mean → 1 - tail; after mean → tail
        return t <= mean ? (1.0 - tail) : tail;

    } else if (distributionType === 2) {
        // EXPONENTIAL DECAY: Front-loaded payouts
        const lambda = 3 / lifetime;
        return 1.0 - Math.exp(-lambda * t);

    } else if (distributionType === 3) {
        // EXPONENTIAL GROWTH: Back-loaded payouts
        const lambda = 3 / lifetime;
        return (Math.exp(lambda * t) - 1) / (Math.exp(lambda * lifetime) - 1);

    } else if (distributionType === 4) {
        // LINEAR DECAY: Accelerating accumulation  CDF = 2r − r²
        const r = t / lifetime;
        return 2 * r - r * r;

    } else if (distributionType === 5) {
        // LINEAR GROWTH: Decelerating accumulation  CDF = r²
        const r = t / lifetime;
        return r * r;
    }

    return t / lifetime;
}
