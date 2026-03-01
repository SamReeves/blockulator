/**
 * Distribution CDF Calculator
 * Computes cumulative distribution function values for all 7 distribution types
 */

/**
 * Compute CDF value for a given time and distribution type
 * @param {number} t - Current time in seconds
 * @param {number} lifetime - Total lifetime in seconds
 * @param {number} distributionType - Distribution type (0-6)
 * @returns {number} CDF value between 0 and 1
 */
export function computeCdfValue(t, lifetime, distributionType) {
    let value = 1.0;

    if (distributionType === 0) {
        // UNIFORM: Constant rate → Linear payout
        value = (t / lifetime);

    } else if (distributionType === 1) {
        // GAUSSIAN: Bell curve - cumulative payout via error function
        const mean = lifetime / 2;
        const stddev = lifetime / 3.464101615;
        const z = (t - mean) / stddev;
        // Approximate CDF using tanh approximation
        value = 0.5 * (1 + Math.tanh(z / Math.sqrt(2)));

    } else if (distributionType === 2) {
        // EXPONENTIAL DECAY: Front-loaded payouts
        // CDF: F(t) = 1 - e^(-λt)
        const lambda = 3 / lifetime;
        value = 1.0 - Math.exp(-lambda * t);

    } else if (distributionType === 3) {
        // EXPONENTIAL GROWTH: Back-loaded payouts
        // CDF: F(t) = (e^(λt) - 1) / (e^(λT) - 1) where λ = 3/T
        const lambda = 3 / lifetime;
        value = (Math.exp(lambda * t) - 1) / (Math.exp(lambda * lifetime) - 1);

    } else if (distributionType === 4) {
        // LINEAR DECAY: Accelerating accumulation
        // CDF: F(t) = 2t/T - (t/T)^2
        const ratio = t / lifetime;
        value = 2 * ratio - ratio * ratio;

    } else if (distributionType === 5) {
        // INVERTED GAUSSIAN: U-shaped curve
        const mean = lifetime / 2;
        if (t < mean) {
            // First half: fast start, decelerating
            value = 0.5 * (1.0 - Math.exp(-6 * t / lifetime));
        } else {
            // Second half: slow start, accelerating
            const secondHalfRatio = (t - mean) / (lifetime / 2);
            value = 0.5 + 0.5 * Math.exp(3 * (secondHalfRatio - 1));
        }

    } else if (distributionType === 6) {
        // LINEAR GROWTH: Decelerating accumulation
        // CDF: F(t) = (t/T)^2
        const ratio = t / lifetime;
        value = ratio * ratio;
    }

    return value;
}
