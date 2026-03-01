/**
 * Constants Category
 * Mathematical constants (π, e, τ)
 */

export const constantsCalculators = [
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
    }
];
