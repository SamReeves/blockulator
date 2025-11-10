/**
 * Calculator Registry
 * Single source of truth for all mathematical tools
 */

export const CALCULATOR_REGISTRY = [
    // Constants
    {
        id: 'pi-calculator',
        name: 'Pi',
        symbol: 'π',
        emoji: '🥧',
        description: 'Calculate π^x on-chain',
        className: 'PiCalculator',
        category: 'constants'
    },
    {
        id: 'e-calculator',
        name: 'E (Euler)',
        symbol: 'e',
        emoji: '📊',
        description: 'Calculate e^x (legacy)',
        className: 'ECalculator',
        category: 'constants'
    },
    {
        id: 'tau-calculator',
        name: 'Tau',
        symbol: 'τ',
        emoji: '⭕',
        description: 'Calculate τ^x (2π)',
        className: 'TauCalculator',
        category: 'constants'
    },
    
    // Trigonometry
    {
        id: 'sin-calculator',
        name: 'Sine',
        symbol: 'sin(x)',
        emoji: '〰️',
        description: 'Calculate sine',
        className: 'SinCalculator',
        category: 'trig'
    },
    {
        id: 'cos-calculator',
        name: 'Cosine',
        symbol: 'cos(x)',
        emoji: '〰️',
        description: 'Calculate cosine',
        className: 'CosCalculator',
        category: 'trig'
    },
    {
        id: 'atan',
        name: 'Arctangent',
        symbol: 'atan(x)',
        emoji: '↩️',
        description: 'Calculate arctangent',
        className: 'AtanCalculator',
        category: 'trig'
    },
    
    // Powers & Roots
    {
        id: 'sqrt-calculator',
        name: 'Square Root',
        symbol: '√x',
        emoji: '√',
        description: 'Calculate square root',
        className: 'SqrtCalculator',
        category: 'powers'
    },
    {
        id: 'pow2-calculator',
        name: 'Power of 2',
        symbol: '2^x',
        emoji: '²',
        description: 'Calculate 2^x',
        className: 'Pow2Calculator',
        category: 'powers'
    },
    {
        id: 'pow10-calculator',
        name: 'Power of 10',
        symbol: '10^x',
        emoji: '¹⁰',
        description: 'Calculate 10^x',
        className: 'Pow10Calculator',
        category: 'powers'
    },
    {
        id: 'exp',
        name: 'Exponential',
        symbol: 'e^x',
        emoji: '📈',
        description: 'Calculate e^x',
        className: 'ExpCalculator',
        category: 'powers'
    },
    
    // Logarithms
    {
        id: 'ln-calculator',
        name: 'Natural Log',
        symbol: 'ln(x)',
        emoji: '📊',
        description: 'Calculate natural logarithm',
        className: 'LnCalculator',
        category: 'logarithms'
    },
    {
        id: 'log2-calculator',
        name: 'Log Base 2',
        symbol: 'log₂(x)',
        emoji: '📊',
        description: 'Calculate base-2 logarithm',
        className: 'Log2Calculator',
        category: 'logarithms'
    },
    {
        id: 'log10-calculator',
        name: 'Log Base 10',
        symbol: 'log₁₀(x)',
        emoji: '📊',
        description: 'Calculate base-10 logarithm',
        className: 'Log10Calculator',
        category: 'logarithms'
    },
    
    // Special Functions
    {
        id: 'erf-calculator',
        name: 'Error Function',
        symbol: 'erf(x)',
        emoji: '∫',
        description: 'Calculate error function',
        className: 'ErfCalculator',
        category: 'special'
    },
    
    // Combinatorics
    {
        id: 'factorial',
        name: 'Factorial',
        symbol: 'n!',
        emoji: '🎲',
        description: 'Calculate factorial n!',
        className: 'FactorialCalculator',
        category: 'combinatorics'
    },
    {
        id: 'ln-factorial',
        name: 'Ln Factorial',
        symbol: 'ln(n!)',
        emoji: '📐',
        description: 'Log factorial',
        className: 'LnFactorialCalculator',
        category: 'combinatorics'
    },
    
    // Statistics
    {
        id: 'norm-cdf',
        name: 'Normal CDF',
        symbol: 'Φ(x)',
        emoji: '📊',
        description: 'Normal distribution CDF',
        className: 'NormCdfCalculator',
        category: 'statistics'
    },
    
    // Hyperbolic
    {
        id: 'sinh',
        name: 'Sinh',
        symbol: 'sinh(x)',
        emoji: '📈',
        description: 'Hyperbolic sine',
        className: 'SinhCalculator',
        category: 'hyperbolic'
    },
    {
        id: 'cosh',
        name: 'Cosh',
        symbol: 'cosh(x)',
        emoji: '📈',
        description: 'Hyperbolic cosine',
        className: 'CoshCalculator',
        category: 'hyperbolic'
    },
    {
        id: 'tanh-calculator',
        name: 'Tanh',
        symbol: 'tanh(x)',
        emoji: '📈',
        description: 'Hyperbolic tangent',
        className: 'TanhCalculator',
        category: 'hyperbolic'
    }
];

// Category metadata
export const CATEGORIES = {
    constants: { name: 'Constants', icon: '🔢', order: 1 },
    trig: { name: 'Trigonometry', icon: '📐', order: 2 },
    powers: { name: 'Powers & Roots', icon: '²', order: 3 },
    logarithms: { name: 'Logarithms', icon: '📊', order: 4 },
    combinatorics: { name: 'Combinatorics', icon: '🎲', order: 5 },
    statistics: { name: 'Statistics', icon: '📈', order: 6 },
    hyperbolic: { name: 'Hyperbolic', icon: '〰️', order: 7 },
    special: { name: 'Special Functions', icon: '∫', order: 8 }
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
