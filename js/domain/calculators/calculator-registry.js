/**
 * Calculator Registry
 * Domain layer - Calculator-specific UI and flow configuration
 * 
 * This is the single source of truth for calculator configuration.
 * Contains: UI schemas, input/result formatting, method names, hints, and display options.
 * 
 * Contract addresses and ABIs are defined in contract-registry.js but accessed
 * through the getCalculatorContractInfo() helper below.
 */

export const CALCULATOR_REGISTRY = [
    // Constants
    {
        id: 'pi-calculator',
        name: 'Pi',
        symbol: 'π',
        btnLabel: 'π',
        tier: 'primary',
        emoji: '🥧',
        description: 'Get the mathematical constant π (pi) ≈ 3.14159... on-chain with high precision!',
        className: 'PiCalculator',
        category: 'constants',
        input: null,
        result: {
            label: 'π =',
            examples: null,
            hint: 'Click the button to retrieve π from the blockchain'
        },
        info: {
            description: '<p><strong>π (pi)</strong> is the ratio of a circle\'s circumference to its diameter, approximately 3.14159...</p>',
            features: [
                'Fundamental constant in geometry and trigonometry',
                'Appears in Euler\'s formula: e^(iπ) + 1 = 0',
                'Used in circular motion, waves, and oscillations',
                'Essential for engineering and physics calculations'
            ],
            notes: [
                '💡 <strong>Fun fact:</strong> π is irrational and transcendental',
                '🔒 <strong>On-chain value:</strong> Stored with 10 decimal places of precision.'
            ]
        },
        calculate: {
            noInput: true,
            method: 'get_constant'
        },
        onAfterInit: {
            method: 'get_constant',
            storesValue: true
        }
    },
    {
        id: 'e-calculator',
        name: 'E (Euler)',
        symbol: 'e',
        btnLabel: 'e',
        tier: 'primary',
        emoji: '📊',
        description: 'Get Euler\'s number e ≈ 2.71828... on-chain with high precision!',
        className: 'ECalculator',
        category: 'constants',
        input: null,
        result: {
            label: 'e =',
            examples: null,
            hint: 'Click the button to retrieve e from the blockchain'
        },
        info: {
            description: '<p><strong>e</strong> is Euler\'s number, the base of natural logarithms, approximately 2.71828...</p>',
            features: [
                'Base of the natural exponential function e^x',
                'Appears in compound interest: A = P * e^(rt)',
                'Essential for calculus and differential equations',
                'Fundamental constant in mathematics'
            ],
            notes: [
                '💡 <strong>Fun fact:</strong> e is the limit of (1 + 1/n)^n as n approaches infinity',
                '🔒 <strong>On-chain value:</strong> Stored with 10 decimal places of precision.'
            ]
        },
        calculate: {
            noInput: true,
            method: 'get_constant'
        },
        onAfterInit: {
            method: 'get_constant',
            storesValue: true
        }
    },
    {
        id: 'tau-calculator',
        name: 'Tau',
        symbol: 'τ',
        btnLabel: 'τ',
        tier: 'secondary',
        emoji: '⭕',
        description: 'Get the mathematical constant τ (tau) = 2π ≈ 6.28318... on-chain with high precision!',
        className: 'TauCalculator',
        category: 'constants',
        input: null,
        result: {
            label: 'τ =',
            examples: null,
            hint: 'Click the button to retrieve τ from the blockchain'
        },
        info: {
            description: '<p><strong>τ (tau)</strong> equals 2π and represents one complete turn around a circle, approximately 6.28318...</p>',
            features: [
                'More intuitive than π for circular calculations',
                'One full rotation = τ radians (vs 2π radians)',
                'Simplifies many formulas in trigonometry',
                'Gaining popularity in mathematics education'
            ],
            notes: [
                '💡 <strong>Tau Day:</strong> Celebrated on June 28th (6/28)',
                '🔒 <strong>On-chain value:</strong> Stored with 10 decimal places of precision.'
            ]
        },
        calculate: {
            noInput: true,
            method: 'get_constant'
        },
        onAfterInit: {
            method: 'get_constant',
            storesValue: true
        }
    },
    
    // Trigonometry
    {
        id: 'sin-calculator',
        name: 'Sine',
        symbol: 'sin(x)',
        btnLabel: 'sin',
        tier: 'primary',
        emoji: '〰️',
        description: 'Calculate sin(x) on-chain! Sine is a fundamental trigonometric function that returns the y-coordinate of a point on the unit circle.',
        className: 'SinCalculator',
        category: 'trig',
        input: {
            label: 'Angle (radians)',
            placeholder: 'Enter angle in radians (e.g., 1.5708)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Common values: 0 = 0, π/2 ≈ 1.5708 = 1, π ≈ 3.1416 = 0'
        },
        result: {
            label: 'sin(x) =',
            examples: null,
            hint: 'Enter an angle in radians and click Calculate to see the result'
        },
        info: {
            description: '<p><strong>sin(x)</strong> is one of the fundamental trigonometric functions.</p>',
            features: [
                'Returns values in range [-1, 1]',
                'sin(0) = 0, sin(π/2) = 1, sin(π) = 0',
                'Used in circular motion, waves, and oscillations',
                'Essential for 3D graphics and physics simulations'
            ],
            notes: [
                '💡 <strong>Tip:</strong> π ≈ 3.14159, so π/2 ≈ 1.5708, π ≈ 3.1416, 2π ≈ 6.2832',
                '🔒 <strong>On-chain calculation:</strong> Uses a lookup table with linear interpolation for ~10 decimal place accuracy.'
            ]
        },
        calculate: {}
    },
    {
        id: 'cos-calculator',
        name: 'Cosine',
        symbol: 'cos(x)',
        btnLabel: 'cos',
        tier: 'primary',
        emoji: '〰️',
        description: 'Calculate cos(x) on-chain! Cosine is a fundamental trigonometric function that returns the x-coordinate of a point on the unit circle.',
        className: 'CosCalculator',
        category: 'trig',
        input: {
            label: 'Angle (radians)',
            placeholder: 'Enter angle in radians (e.g., 1.5708)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Common values: 0 = 1, π/2 ≈ 1.5708 = 0, π ≈ 3.1416 = -1'
        },
        result: {
            label: 'cos(x) =',
            examples: null,
            hint: 'Enter an angle in radians and click Calculate to see the result'
        },
        info: {
            description: '<p><strong>cos(x)</strong> is one of the fundamental trigonometric functions.</p>',
            features: [
                'Returns values in range [-1, 1]',
                'cos(0) = 1, cos(π/2) = 0, cos(π) = -1',
                'Used in circular motion, waves, and oscillations',
                'Essential for 3D graphics and physics simulations'
            ],
            notes: [
                '💡 <strong>Tip:</strong> π ≈ 3.14159, so π/2 ≈ 1.5708, π ≈ 3.1416, 2π ≈ 6.2832',
                '🔒 <strong>On-chain calculation:</strong> Uses a lookup table with linear interpolation for ~10 decimal place accuracy.'
            ]
        },
        calculate: {}
    },
    {
        id: 'atan',
        name: 'Arctangent',
        symbol: 'atan(x)',
        btnLabel: 'tan⁻¹',
        tier: 'secondary',
        emoji: '↩️',
        description: 'Calculate atan(x) on-chain! Arctangent is the inverse tangent function.',
        className: 'AtanCalculator',
        category: 'trig',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 1)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Range: [-100, 100]'
        },
        result: {
            label: 'atan(x) =',
            examples: ['atan(0) = 0', 'atan(1) = π/4 ≈ 0.785', 'atan(∞) → π/2']
        },
        info: {
            description: '<p><strong>atan(x)</strong> is the arctangent or inverse tangent function.</p>',
            features: [
                'Returns angle in radians: (-π/2, π/2)',
                'Used to find angles from coordinates',
                'Essential for 2D/3D rotations',
                'Common in computer graphics and robotics'
            ],
            notes: [
                '💡 <strong>Tip:</strong> For full circle angles, use atan2(y, x) which handles all quadrants',
                '🔒 <strong>On-chain calculation:</strong> Uses Taylor series approximations for accuracy.'
            ]
        },
        calculate: {
            min: -100,
            max: 100
        }
    },
    
    // Powers & Roots
    {
        id: 'sqrt-calculator',
        name: 'Square Root',
        symbol: '√x',
        btnLabel: '√',
        tier: 'primary',
        emoji: '√',
        description: 'Calculate √x on-chain! The square root is fundamental for distance calculations, geometry, and physics.',
        className: 'SqrtCalculator',
        category: 'powers',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 16)',
            min: 0,
            max: null,
            step: 0.1,
            hint: 'Range: [0, ∞)'
        },
        result: {
            label: '√x =',
            examples: ['sqrt(4) = 2', 'sqrt(16) = 4', 'sqrt(2) ≈ 1.414']
        },
        info: {
            description: '<p><strong>sqrt(x)</strong> returns the square root - the number that when multiplied by itself equals x.</p>',
            features: [
                'Only defined for non-negative numbers',
                'Used in distance formulas (Pythagorean theorem)',
                'Essential for standard deviation calculations',
                'Common in physics for quadratic relationships'
            ],
            notes: [
                '💡 <strong>Math Tip:</strong> sqrt(a*b) = sqrt(a) * sqrt(b)',
                '🔒 <strong>On-chain calculation:</strong> Uses Newton\'s method for fast convergence.'
            ]
        },
        calculate: {
            min: 0,
            max: Infinity
        }
    },
    {
        id: 'pow2-calculator',
        name: 'Power of 2',
        symbol: '2^x',
        btnLabel: '2ˣ',
        tier: 'secondary',
        emoji: '²',
        description: 'Calculate 2^x on-chain! Powers of 2 are fundamental in computer science and binary systems.',
        className: 'Pow2Calculator',
        category: 'powers',
        input: {
            label: 'Exponent (x)',
            placeholder: 'Enter exponent (e.g., 10)',
            min: 0,
            max: 133,
            step: 0.1,
            hint: 'Range: [0, 133)'
        },
        result: {
            label: '2^x =',
            examples: ['2^0 = 1', '2^10 = 1024', '2^20 ≈ 1M', '2^32 ≈ 4.3B', '2^64 ≈ 1.8e19']
        },
        info: {
            description: '<p><strong>2^x</strong> calculates powers of 2, fundamental to binary computing.</p>',
            features: [
                'Binary system foundation (bits, bytes, memory)',
                'Exponential growth patterns',
                'Computer addressing and data structures',
                'Powers of 2 appear everywhere in CS'
            ],
            notes: [
                '💡 <strong>CS Fact:</strong> 2^10 = 1024 ≈ 1K, 2^20 ≈ 1M, 2^30 ≈ 1G, 2^64 = 18.4 quintillion',
                '🔒 <strong>On-chain calculation:</strong> Range reduction splits integer/fractional parts, supports up to 2^133.'
            ]
        },
        calculate: {
            min: 0,
            max: 133
        }
    },
    {
        id: 'pow10-calculator',
        name: 'Power of 10',
        symbol: '10^x',
        btnLabel: '10ˣ',
        tier: 'secondary',
        emoji: '¹⁰',
        description: 'Calculate 10^x on-chain! Powers of 10 are essential for scientific notation and decimal systems.',
        className: 'Pow10Calculator',
        category: 'powers',
        input: {
            label: 'Exponent (x)',
            placeholder: 'Enter exponent (e.g., 3)',
            min: -10,
            max: 50,
            step: 0.1,
            hint: 'Range: [-10, 50]'
        },
        result: {
            label: '10^x =',
            examples: ['10^0 = 1', '10^3 = 1000', '10^-2 = 0.01']
        },
        info: {
            description: '<p><strong>10^x</strong> calculates powers of 10, foundation of our decimal system.</p>',
            features: [
                'Scientific notation: express large/small numbers',
                'Orders of magnitude comparisons',
                'Decimal system and place values',
                'Used in engineering and science calculations'
            ],
            notes: [
                '💡 <strong>Sci Notation:</strong> 3.5 × 10^8 represents 350,000,000',
                '🔒 <strong>On-chain calculation:</strong> Optimized for decimal powers with high precision.'
            ]
        },
        calculate: {
            min: -10,
            max: 50
        }
    },
    {
        id: 'exp',
        name: 'Exponential',
        symbol: 'e^x',
        btnLabel: 'eˣ',
        tier: 'primary',
        emoji: '📈',
        description: 'Calculate e^x on-chain! The exponential function is fundamental to growth and decay processes.',
        className: 'ExpCalculator',
        category: 'powers',
        input: {
            label: 'Exponent (x)',
            placeholder: 'Enter exponent (e.g., 2)',
            min: 0,
            max: 9.999,
            step: 0.1,
            hint: 'Range: [0, 10)'
        },
        result: {
            label: 'e^x =',
            examples: ['e^0 = 1', 'e^1 ≈ 2.718', 'e^2 ≈ 7.389']
        },
        info: {
            description: '<p><strong>e^x</strong> is the exponential function with base e ≈ 2.718</p>',
            features: [
                'Compound interest and population growth',
                'Probability distributions (normal, Poisson)',
                'The derivative of e^x is e^x',
                'Essential for differential equations'
            ],
            notes: []
        },
        calculate: {
            min: 0,
            max: 10
        }
    },
    
    // Logarithms
    {
        id: 'ln-calculator',
        name: 'Natural Log',
        symbol: 'ln(x)',
        btnLabel: 'ln',
        tier: 'primary',
        emoji: '📊',
        description: 'Calculate ln(x) on-chain! The natural logarithm is the inverse of the exponential function.',
        className: 'LnCalculator',
        category: 'logarithms',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 10)',
            min: 0.000001,
            max: 22026.465,
            step: 0.1,
            hint: 'Range: (0, e^10] ≈ (0, 22026.5]'
        },
        result: {
            label: 'ln(x) =',
            examples: ['ln(1) = 0', 'ln(e) ≈ ln(2.718) = 1', 'ln(e²) ≈ ln(7.389) = 2', 'ln(10) ≈ 2.303', 'ln(100) ≈ 4.605']
        },
        info: {
            description: '<p><strong>The natural logarithm</strong> is the logarithm to base <em>e</em> ≈ 2.718281828...</p>',
            features: [
                '<strong>Inverse of e^x:</strong> If e^y = x, then ln(x) = y',
                '<strong>Compound Growth:</strong> Calculate doubling time and growth rates',
                '<strong>Information Theory:</strong> Natural measure of information entropy',
                '<strong>Calculus:</strong> ln(x) has the simplest derivative: d/dx[ln(x)] = 1/x',
                '<strong>Probability:</strong> Log-likelihood in statistical inference'
            ],
            notes: [
                '💡 <strong>Fun fact:</strong> ln(x) is called "natural" because e appears naturally in many mathematical contexts!',
                '🔒 <strong>On-chain calculation:</strong> Uses digit-by-digit extraction for high accuracy (~10 decimal places).'
            ]
        },
        calculate: {
            min: 0.000001,
            max: 22026.465
        },
        onAfterInit: {
            method: 'get_constant',
            storesValue: true,
            note: 'Loads constant value from contract (e)'
        }
    },
    {
        id: 'log2-calculator',
        name: 'Log Base 2',
        symbol: 'log₂(x)',
        btnLabel: 'log₂',
        tier: 'secondary',
        emoji: '📊',
        description: 'Calculate log₂(x) on-chain! Base-2 logarithm is essential for computer science and information theory.',
        className: 'Log2Calculator',
        category: 'logarithms',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 8)',
            min: 0.000001,
            max: null,
            step: 0.1,
            hint: 'Range: (0, ∞)'
        },
        result: {
            label: 'log₂(x) =',
            examples: ['log₂(2) = 1', 'log₂(8) = 3', 'log₂(1024) = 10']
        },
        info: {
            description: '<p><strong>log₂(x)</strong> is the base-2 logarithm, answering "2 to what power equals x?"</p>',
            features: [
                'Fundamental in computer science and binary systems',
                'Measures information in bits (Shannon entropy)',
                'Used in algorithm complexity analysis',
                'Essential for digital signal processing'
            ],
            notes: [
                '💡 <strong>CS Tip:</strong> log₂(n) tells you how many bits needed to represent n values',
                '🔒 <strong>On-chain calculation:</strong> Uses natural log conversion: log₂(x) = ln(x) / ln(2).'
            ]
        },
        calculate: {
            min: 0.000001,
            max: Infinity
        }
    },
    {
        id: 'log10-calculator',
        name: 'Log Base 10',
        symbol: 'log₁₀(x)',
        btnLabel: 'log',
        tier: 'primary',
        emoji: '📊',
        description: 'Calculate log₁₀(x) on-chain! Base-10 logarithm is the common logarithm used in science and engineering.',
        className: 'Log10Calculator',
        category: 'logarithms',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 100)',
            min: 0.000001,
            max: null,
            step: 0.1,
            hint: 'Range: (0, ∞)'
        },
        result: {
            label: 'log₁₀(x) =',
            examples: ['log₁₀(10) = 1', 'log₁₀(100) = 2', 'log₁₀(1000) = 3']
        },
        info: {
            description: '<p><strong>log₁₀(x)</strong> is the base-10 (common) logarithm, answering "10 to what power equals x?"</p>',
            features: [
                'Standard logarithm in science and engineering',
                'Used in pH, decibels, and Richter scale',
                'Simplifies calculations with powers of 10',
                'Essential for scientific notation'
            ],
            notes: [
                '💡 <strong>Science Tip:</strong> pH = -log₁₀([H⁺]), decibels use 10*log₁₀(P₁/P₀)',
                '🔒 <strong>On-chain calculation:</strong> Uses natural log conversion: log₁₀(x) = ln(x) / ln(10).'
            ]
        },
        calculate: {
            min: 0.000001,
            max: Infinity
        }
    },
    
    // Special Functions
    {
        id: 'erf-calculator',
        name: 'Error Function',
        symbol: 'erf(x)',
        btnLabel: 'erf',
        tier: 'secondary',
        emoji: '∫',
        description: 'Calculate erf(x) on-chain! The error function is essential for probability, statistics, and the normal distribution.',
        className: 'ErfCalculator',
        category: 'special',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 1)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Range: (-∞, ∞)'
        },
        result: {
            label: 'erf(x) =',
            examples: ['erf(0) = 0', 'erf(1) ≈ 0.843', 'erf(∞) → 1']
        },
        info: {
            description: '<p><strong>erf(x)</strong> is the error function, integral to probability and statistics.</p>',
            features: [
                'Related to normal distribution CDF',
                'Returns values in range (-1, 1)',
                'Used in probability calculations',
                'Essential for statistics and data science'
            ],
            notes: [
                '💡 <strong>Stats Tip:</strong> Normal CDF can be expressed using erf',
                '🔒 <strong>On-chain calculation:</strong> Uses polynomial approximations for accuracy.'
            ]
        },
        calculate: {}
    },
    
    // Combinatorics
    {
        id: 'factorial',
        name: 'Factorial',
        symbol: 'n!',
        btnLabel: 'n!',
        tier: 'primary',
        emoji: '🎲',
        description: 'Calculate n! on-chain! Factorial is essential for combinatorics, probability, and permutations.',
        className: 'FactorialCalculator',
        category: 'combinatorics',
        input: {
            label: 'Integer (n)',
            placeholder: 'Enter integer (e.g., 5)',
            min: 0,
            max: 20,
            step: 1,
            hint: 'Range: [0, 20] integers only'
        },
        result: {
            label: 'n! =',
            examples: ['0! = 1', '5! = 120', '10! = 3,628,800']
        },
        info: {
            description: '<p><strong>n!</strong> (n factorial) is the product of all positive integers less than or equal to n.</p>',
            features: [
                '<strong>Combinatorics:</strong> Count permutations and arrangements',
                '<strong>Probability:</strong> Calculate binomial coefficients',
                '<strong>Series:</strong> Taylor series and power series expansions',
                '<strong>Special case:</strong> 0! = 1 by convention'
            ],
            notes: [
                '💡 <strong>Growth:</strong> Factorials grow extremely fast! 20! ≈ 2.4 × 10^18',
                '🔒 <strong>On-chain calculation:</strong> Optimized iterative multiplication with overflow protection.'
            ]
        },
        calculate: {
            min: 0,
            max: 21,
            integerCheck: true,
            message: 'Factorial requires an integer value'
        }
    },
    {
        id: 'ln-factorial',
        name: 'Ln Factorial',
        symbol: 'ln(n!)',
        btnLabel: 'ln(n!)',
        tier: 'secondary',
        emoji: '📐',
        description: 'Calculate ln(n!) on-chain! Log factorial is useful for large factorials that would overflow.',
        className: 'LnFactorialCalculator',
        category: 'combinatorics',
        input: {
            label: 'Integer (n)',
            placeholder: 'Enter integer (e.g., 50)',
            min: 0,
            max: 1000,
            step: 1,
            hint: 'Range: [0, 1000] integers only'
        },
        result: {
            label: 'ln(n!) =',
            examples: ['ln(0!) = 0', 'ln(5!) ≈ 4.787', 'ln(100!) ≈ 363.739']
        },
        info: {
            description: '<p><strong>ln(n!)</strong> calculates the natural logarithm of n factorial, useful for large factorials that would overflow.</p>',
            features: [
                '<strong>Large Numbers:</strong> Compute factorials beyond standard limits',
                '<strong>Statistics:</strong> Used in log-likelihood calculations',
                '<strong>Stirling Approximation:</strong> Validates factorial approximations',
                '<strong>Numerical Stability:</strong> Avoid overflow in probability calculations'
            ],
            notes: [
                '💡 <strong>Practical:</strong> ln(n!) grows as n*ln(n), much slower than n!',
                '🔒 <strong>On-chain calculation:</strong> Uses Stirling\'s approximation for efficiency.'
            ]
        },
        calculate: {
            min: 0,
            max: 1001,
            integerCheck: true,
            message: 'Factorial requires an integer value'
        }
    },
    
    // Statistics
    {
        id: 'zscore',
        name: 'Z-Score',
        symbol: 'z',
        btnLabel: 'z-score',
        tier: 'secondary',
        emoji: '📏',
        description: 'Calculate z-score (standardized distance from mean) on-chain! Essential for statistics and normal distributions.',
        className: 'ZScoreCalculator',
        category: 'statistics',
        input: {
            label: 'Value (t)',
            placeholder: 'Enter value (e.g., 105)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'The value to evaluate'
        },
        additionalInputs: [
            {
                label: 'Mean (μ)',
                placeholder: 'Enter mean (e.g., 100)',
                name: 'mu',
                min: null,
                max: null,
                step: 0.1,
                hint: 'Center of the distribution'
            },
            {
                label: 'Std Dev (σ)',
                placeholder: 'Enter std dev (e.g., 15)',
                name: 'sigma',
                min: 0.000001,
                max: null,
                step: 0.1,
                hint: 'Standard deviation (must be positive)'
            }
        ],
        result: {
            title: '📏 Z-Score',
            label: 'z =',
            examples: ['z(105, 100, 15) ≈ 0.333', 'z(115, 100, 15) = 1.0', 'z(130, 100, 15) = 2.0'],
            hint: 'Number of standard deviations from the mean'
        },
        info: {
            description: '<p><strong>Z-Score</strong> measures how many standard deviations a value is from the mean. Formula: z = (x - μ) / σ</p>',
            features: [
                'Standardizes values for comparison across distributions',
                'Essential for hypothesis testing and confidence intervals',
                'Used with normal distribution tables and CDF',
                'Absolute value version always returns positive values'
            ],
            notes: [
                '💡 <strong>Stats Tip:</strong> z ≈ 1.96 corresponds to 95% confidence interval',
                '🔒 <strong>On-chain calculation:</strong> Pure arithmetic with no dependencies, minimal gas cost.'
            ]
        },
        calculate: {
            min: null,
            max: null
        }
    },
    {
        id: 'gaussian-tail',
        name: 'Gaussian Tail',
        symbol: 'Tail(z)',
        btnLabel: 'Tail',
        tier: 'secondary',
        emoji: '📉',
        description: 'Calculate Gaussian tail probability on-chain! Uses Lin 1990 approximation for standard normal distribution tails.',
        className: 'GaussianTailCalculator',
        category: 'statistics',
        input: {
            label: 'Z-Score (z)',
            placeholder: 'Enter z-score (e.g., 1.96)',
            min: 0,
            max: 8.999,
            step: 0.1,
            hint: 'Z-score must be non-negative (0 to 9)'
        },
        result: {
            title: '📉 Tail Probability',
            label: 'P(Z > z) =',
            examples: ['Tail(0) = 0.5', 'Tail(1.96) ≈ 0.025 (2.5%)', 'Tail(2.58) ≈ 0.005 (0.5%)'],
            hint: 'Probability that a standard normal variable is > z standard deviations from mean'
        },
        info: {
            description: '<p><strong>Gaussian Tail Probability</strong> calculates the probability mass in the tail of a standard normal distribution using the Lin 1990 approximation.</p>',
            features: [
                'Fast computation using Lin 1990 formula',
                'Used in futures contracts for Gaussian payouts',
                'Complements normal CDF: P(Z > z) = 1 - Φ(z)',
                'Essential for risk calculations and statistical bounds'
            ],
            notes: [
                '💡 <strong>Stats Tip:</strong> For 95% confidence interval, z ≈ 1.96 gives tail ≈ 0.025',
                '🔒 <strong>On-chain calculation:</strong> Uses Lin 1990 y-constant formula with external exp calculator.'
            ]
        },
        calculate: {
            min: 0,
            max: 8.999
        }
    },
    {
        id: 'norm-cdf',
        name: 'Normal CDF',
        symbol: 'Φ(x)',
        btnLabel: 'Φ',
        tier: 'primary',
        emoji: '📊',
        description: 'Calculate Φ(x) on-chain! The normal CDF is fundamental to statistics and hypothesis testing.',
        className: 'NormCdfCalculator',
        category: 'statistics',
        input: {
            label: 'Z-Score (x)',
            placeholder: 'Enter z-score (e.g., 1.96)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Standard normal: mean=0, std=1'
        },
        result: {
            title: '📊 Probability',
            label: 'Φ(x) =',
            examples: ['Φ(0) = 0.5 (50%)', 'Φ(1.96) ≈ 0.975 (97.5%)', 'Φ(-1.96) ≈ 0.025 (2.5%)'],
            hint: 'Probability that a standard normal variable is ≤ x'
        },
        info: {
            description: '<p><strong>Φ(x)</strong> is the cumulative distribution function (CDF) of the standard normal distribution.</p>',
            features: [
                'Returns probability: P(Z ≤ x)',
                'Used in hypothesis testing and confidence intervals',
                'Z-scores measure standard deviations from mean',
                'Essential for statistical analysis'
            ],
            notes: [
                '💡 <strong>Stats Tip:</strong> 95% of values fall within ±1.96 standard deviations',
                '🔒 <strong>On-chain calculation:</strong> Uses error function for high accuracy.'
            ]
        },
        calculate: {
            formatResult: 'custom'
        }
    },
    
    // Hyperbolic
    {
        id: 'sinh',
        name: 'Sinh',
        symbol: 'sinh(x)',
        btnLabel: 'sinh',
        tier: 'secondary',
        emoji: '📈',
        description: 'Calculate sinh(x) on-chain! Hyperbolic sine is used in hyperbolic geometry and physics.',
        className: 'SinhCalculator',
        category: 'hyperbolic',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 2)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Range: [-10, 10]'
        },
        result: {
            label: 'sinh(x) =',
            examples: ['sinh(0) = 0', 'sinh(1) ≈ 1.175', 'sinh(2) ≈ 3.627']
        },
        info: {
            description: '<p><strong>sinh(x)</strong> is the hyperbolic sine function.</p>',
            features: [
                'Defined as: sinh(x) = (e^x - e^(-x)) / 2',
                'Used in calculus and hyperbolic geometry',
                'Models catenary curves (hanging chains)',
                'Essential for special relativity calculations'
            ],
            notes: [
                '💡 <strong>Note:</strong> Range is restricted to [-10, 10] to prevent overflow',
                '🔒 <strong>On-chain calculation:</strong> Uses exponential approximations for accuracy.'
            ]
        },
        calculate: {
            min: -10,
            max: 10
        }
    },
    {
        id: 'cosh',
        name: 'Cosh',
        symbol: 'cosh(x)',
        btnLabel: 'cosh',
        tier: 'secondary',
        emoji: '📈',
        description: 'Calculate cosh(x) on-chain! Hyperbolic cosine models catenary curves and appears in physics.',
        className: 'CoshCalculator',
        category: 'hyperbolic',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 2)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Range: [-10, 10]'
        },
        result: {
            label: 'cosh(x) =',
            examples: ['cosh(0) = 1', 'cosh(1) ≈ 1.543', 'cosh(2) ≈ 3.762']
        },
        info: {
            description: '<p><strong>cosh(x)</strong> is the hyperbolic cosine function.</p>',
            features: [
                'Defined as: cosh(x) = (e^x + e^(-x)) / 2',
                'Always greater than or equal to 1',
                'Models catenary curves (hanging cables)',
                'Used in physics and engineering'
            ],
            notes: [
                '💡 <strong>Note:</strong> Range is restricted to [-10, 10] to prevent overflow',
                '🔒 <strong>On-chain calculation:</strong> Uses exponential approximations for accuracy.'
            ]
        },
        calculate: {
            min: -10,
            max: 10
        }
    },
    {
        id: 'tanh-calculator',
        name: 'Tanh',
        symbol: 'tanh(x)',
        btnLabel: 'tanh',
        tier: 'secondary',
        emoji: '📈',
        description: 'Calculate tanh(x) on-chain! The hyperbolic tangent is crucial for neural networks and activation functions.',
        className: 'TanhCalculator',
        category: 'hyperbolic',
        input: {
            label: 'Input (x)',
            placeholder: 'Enter value (e.g., 2)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Range: [-10, 10]'
        },
        result: {
            label: 'tanh(x) =',
            examples: ['tanh(0) = 0', 'tanh(1) ≈ 0.762', 'tanh(∞) → 1']
        },
        info: {
            description: '<p><strong>tanh(x)</strong> is the hyperbolic tangent function, widely used as an activation function in neural networks.</p>',
            features: [
                'Returns values in range (-1, 1)',
                'Defined as: tanh(x) = sinh(x) / cosh(x)',
                'Smooth, differentiable, and zero-centered',
                'Popular in machine learning and AI'
            ],
            notes: [
                '💡 <strong>ML Tip:</strong> tanh is preferred over sigmoid in hidden layers because it\'s zero-centered',
                '🔒 <strong>On-chain calculation:</strong> Uses efficient approximations for neural network applications.'
            ]
        },
        calculate: {
            min: -10,
            max: 10
        }
    },
    
    // Binomial Coefficient
    {
        id: 'binomial-coeff',
        name: 'Binomial Coefficient',
        symbol: 'C(n,k)',
        btnLabel: 'nCr',
        tier: 'secondary',
        emoji: '🎲',
        description: 'Calculate C(n,k) = n!/(k!(n-k)!) on-chain! Essential for combinatorics, probability, and counting problems.',
        className: 'BinomialCoeffCalculator',
        category: 'combinatorics',
        input: {
            label: 'Total Items (n)',
            placeholder: 'Enter n (e.g., 10)',
            min: 0,
            max: 20,
            step: 1,
            hint: 'Range: [0, 20] integers only'
        },
        additionalInputs: [
            {
                label: 'Items to Choose (k)',
                placeholder: 'Enter k (e.g., 5)',
                name: 'k',
                min: 0,
                max: 20,
                step: 1,
                hint: 'k must be ≤ n'
            }
        ],
        result: {
            title: '🎲 Binomial Coefficient',
            label: 'C(n,k) =',
            examples: ['C(5,2) = 10', 'C(10,5) = 252', 'C(20,10) = 184,756'],
            hint: 'Number of ways to choose k items from n'
        },
        info: {
            description: '<p><strong>C(n,k)</strong> calculates "n choose k" - the number of ways to select k items from n items without regard to order.</p>',
            features: [
                'Essential for probability calculations',
                'Pascal\'s triangle values',
                'Used in polynomial expansions',
                'Lottery and combination counting'
            ],
            notes: [
                '💡 <strong>Fun Fact:</strong> C(n,k) = C(n, n-k) - choosing k items is same as choosing which n-k to exclude',
                '🔒 <strong>On-chain calculation:</strong> Uses external factorial calculator via staticcall.'
            ]
        },
        calculate: {
            min: 0,
            max: 21,
            integerCheck: true,
            message: 'Binomial coefficient requires integer values for n and k'
        }
    },
    
    // Normal PDF
    {
        id: 'norm-pdf',
        name: 'Normal PDF',
        symbol: 'φ(z)',
        btnLabel: 'φ',
        tier: 'secondary',
        emoji: '🔔',
        description: 'Calculate φ(z) on-chain! The normal probability density function describes the bell curve shape.',
        className: 'NormPdfCalculator',
        category: 'statistics',
        input: {
            label: 'Z-Score (z)',
            placeholder: 'Enter z-score (e.g., 0)',
            min: null,
            max: null,
            step: 0.1,
            hint: 'Standard normal: mean=0, std=1'
        },
        result: {
            title: '🔔 Probability Density',
            label: 'φ(z) =',
            examples: ['φ(0) ≈ 0.399', 'φ(1) ≈ 0.242', 'φ(2) ≈ 0.054'],
            hint: 'Height of the bell curve at z standard deviations'
        },
        info: {
            description: '<p><strong>φ(z)</strong> is the probability density function of the standard normal distribution, defining the famous bell curve shape.</p>',
            features: [
                'Maximum at z=0 (mean): φ(0) ≈ 0.399',
                'Symmetric around zero',
                'Used with CDF to calculate probabilities',
                'Essential for hypothesis testing'
            ],
            notes: [
                '💡 <strong>Stats Tip:</strong> The area under φ from -∞ to ∞ equals 1',
                '🔒 <strong>On-chain calculation:</strong> Uses external exp calculator for e^(-z²/2).'
            ]
        },
        calculate: {
            formatResult: 'custom'
        }
    },
    
    // GCD
    {
        id: 'gcd',
        name: 'GCD / LCM',
        symbol: 'GCD(a,b)',
        btnLabel: 'gcd',
        tier: 'secondary',
        emoji: '🔢',
        description: 'Calculate Greatest Common Divisor and Least Common Multiple on-chain! Fundamental for number theory and fraction simplification.',
        className: 'GcdCalculator',
        category: 'number-theory',
        input: {
            label: 'First Number (a)',
            placeholder: 'Enter a (e.g., 12)',
            min: 0,
            max: null,
            step: 1,
            hint: 'Positive integer'
        },
        additionalInputs: [
            {
                label: 'Second Number (b)',
                placeholder: 'Enter b (e.g., 8)',
                name: 'b',
                min: 0,
                max: null,
                step: 1,
                hint: 'Positive integer'
            }
        ],
        result: {
            title: '🔢 GCD & LCM',
            label: 'GCD(a,b) =',
            examples: ['GCD(12,8) = 4', 'GCD(100,75) = 25', 'LCM(4,6) = 12'],
            hint: 'Greatest common divisor and least common multiple'
        },
        info: {
            description: '<p><strong>GCD</strong> finds the largest number that divides both a and b. <strong>LCM</strong> finds the smallest number divisible by both.</p>',
            features: [
                'Simplifying fractions: a/b = (a/GCD)/(b/GCD)',
                'Finding common denominators using LCM',
                'Euclidean algorithm - extremely efficient',
                'Used in cryptography and modular arithmetic'
            ],
            notes: [
                '💡 <strong>Number Theory:</strong> LCM(a,b) × GCD(a,b) = a × b',
                '🔒 <strong>On-chain calculation:</strong> Pure arithmetic, minimal gas cost.'
            ]
        },
        calculate: {
            min: 0,
            integerCheck: true,
            message: 'GCD requires positive integer values'
        }
    }
];

// Category metadata — math symbols instead of emojis
export const CATEGORIES = {
    constants: { name: 'Constants', icon: 'const', order: 1 },
    trig: { name: 'Trig', icon: 'sin', order: 2 },
    powers: { name: 'Powers', icon: 'xⁿ', order: 3 },
    logarithms: { name: 'Log', icon: 'log', order: 4 },
    combinatorics: { name: 'n!', icon: 'n!', order: 5 },
    statistics: { name: 'Stat', icon: 'Φ', order: 6 },
    hyperbolic: { name: 'Hyp', icon: 'hyp', order: 7 },
    special: { name: 'Special', icon: '∫', order: 8 },
    'number-theory': { name: 'Num', icon: 'gcd', order: 9 }
};

// Helper functions
export function getCalculatorById(id) {
    return CALCULATOR_REGISTRY.find(calc => calc.id === id);
}

export function getCalculatorsByCategory(category) {
    return CALCULATOR_REGISTRY.filter(calc => calc.category === category);
}

export function getAllCategories() {
    const categories = {};
    CALCULATOR_REGISTRY.forEach(calc => {
        if (!categories[calc.category]) {
            categories[calc.category] = [];
        }
        categories[calc.category].push(calc);
    });
    return categories;
}

/**
 * Get combined calculator info (UI config + contract metadata)
 * This is the preferred way to get calculator info as it combines both registries
 * Uses lazy imports to avoid circular dependency issues
 * @param {string} id - Calculator ID
 * @returns {Promise<Object|null>} Combined calculator info or null if not found
 */
export async function getCalculatorContractInfo(id) {
    const calcConfig = getCalculatorById(id);
    if (!calcConfig) return null;
    
    // Lazy import to avoid circular dependencies
    const { getContractMetadata, hasContract } = await import('../../infrastructure/config/contract-registry.js');
    const { getCurrentNetwork } = await import('../../infrastructure/config/network.js');
    
    if (!hasContract(id)) return null;
    
    const contractMeta = getContractMetadata(id);
    
    return {
        ...calcConfig,
        contractAddress: contractMeta.contractAddress,
        abiFile: contractMeta.abi,
        sourceFile: contractMeta.source
    };
}

/**
 * Check if a calculator exists in the UI registry
 * @param {string} id - Calculator ID
 * @returns {boolean}
 */
export function isCalculator(id) {
    return !!getCalculatorById(id);
}
