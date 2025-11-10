/**
 * Module Manifest
 * Maps module names to their import paths
 * Enables dynamic loading without hardcoding in multiple places
 */

export const MODULE_MANIFEST = {
    // Games
    'pissing-contest': {
        path: '../domain/games/pissing-contest.js',
        export: 'PissingContest',
        category: 'game'
    },
    'pay-it-forward': {
        path: '../domain/games/pay-it-forward.js',
        export: 'PayItForward',
        category: 'game'
    },
    'pay-it-backward': {
        path: '../domain/games/pay-it-backward.js',
        export: 'PayItBackward',
        category: 'game'
    },
    'message-board': {
        path: '../domain/games/message-board.js',
        export: 'MessageBoard',
        category: 'game'
    },
    'king-of-the-hill': {
        path: '../domain/games/king-of-the-hill.js',
        export: 'KingOfTheHill',
        category: 'game'
    },
    'last-call': {
        path: '../domain/games/last-call.js',
        export: 'LastCall',
        category: 'game'
    },
    'time-to-make-the-donuts': {
        path: '../domain/games/time-to-make-the-donuts.js',
        export: 'TimeToMakeTheDonuts',
        category: 'game'
    },
    'dice-gods': {
        path: '../domain/games/dice-gods.js',
        export: 'DiceGods',
        category: 'game'
    },
    'satan-moloch-baal': {
        path: '../domain/games/satan-moloch-baal.js',
        export: 'SatanMolochBaal',
        category: 'game'
    },
    
    // Calculators (individual)
    'pi-calculator': {
        path: '../domain/calculators/pi-calculator.js',
        export: 'PiCalculator',
        category: 'calculator'
    },
    'e-calculator': {
        path: '../domain/calculators/e-calculator.js',
        export: 'ECalculator',
        category: 'calculator'
    },
    'tau-calculator': {
        path: '../domain/calculators/tau-calculator.js',
        export: 'TauCalculator',
        category: 'calculator'
    },
    'sin-calculator': {
        path: '../domain/calculators/sin-calculator.js',
        export: 'SinCalculator',
        category: 'calculator'
    },
    'cos-calculator': {
        path: '../domain/calculators/cos-calculator.js',
        export: 'CosCalculator',
        category: 'calculator'
    },
    'tanh-calculator': {
        path: '../domain/calculators/tanh-calculator.js',
        export: 'TanhCalculator',
        category: 'calculator'
    },
    'sqrt-calculator': {
        path: '../domain/calculators/sqrt-calculator.js',
        export: 'SqrtCalculator',
        category: 'calculator'
    },
    'ln-calculator': {
        path: '../domain/calculators/ln-calculator.js',
        export: 'LnCalculator',
        category: 'calculator'
    },
    'log2-calculator': {
        path: '../domain/calculators/log2-calculator.js',
        export: 'Log2Calculator',
        category: 'calculator'
    },
    'log10-calculator': {
        path: '../domain/calculators/log10-calculator.js',
        export: 'Log10Calculator',
        category: 'calculator'
    },
    'pow2-calculator': {
        path: '../domain/calculators/pow2-calculator.js',
        export: 'Pow2Calculator',
        category: 'calculator'
    },
    'pow10-calculator': {
        path: '../domain/calculators/pow10-calculator.js',
        export: 'Pow10Calculator',
        category: 'calculator'
    },
    'erf-calculator': {
        path: '../domain/calculators/erf-calculator.js',
        export: 'ErfCalculator',
        category: 'calculator'
    },
    
    // Tools (unified)
    'scientific-calculator': {
        path: '../tools/scientific-calculator.js',
        export: 'ScientificCalculator',
        category: 'tool'
    }
};

