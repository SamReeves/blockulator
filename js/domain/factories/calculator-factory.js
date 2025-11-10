/**
 * Calculator Factory
 * Domain layer - Dynamic loading and instantiation of calculator modules
 * Eliminates manual registration and enables lazy loading
 */

// Map of calculator names to their module loaders
const CALCULATOR_MODULES = {
    'exp': () => import('../calculators/exp-calculator.js').then(m => m.ExpCalculator),
    'factorial': () => import('../calculators/factorial-calculator.js').then(m => m.FactorialCalculator),
    'norm-cdf': () => import('../calculators/norm-cdf-calculator.js').then(m => m.NormCdfCalculator),
    'ln-factorial': () => import('../calculators/ln-factorial-calculator.js').then(m => m.LnFactorialCalculator),
    'atan': () => import('../calculators/atan-calculator.js').then(m => m.AtanCalculator),
    'sinh': () => import('../calculators/sinh-calculator.js').then(m => m.SinhCalculator),
    'cosh': () => import('../calculators/cosh-calculator.js').then(m => m.CoshCalculator),
    'e-calculator': () => import('../calculators/e-calculator.js').then(m => m.ECalculator),
    'pi-calculator': () => import('../calculators/pi-calculator.js').then(m => m.PiCalculator),
    'tau-calculator': () => import('../calculators/tau-calculator.js').then(m => m.TauCalculator),
    'sin-calculator': () => import('../calculators/sin-calculator.js').then(m => m.SinCalculator),
    'cos-calculator': () => import('../calculators/cos-calculator.js').then(m => m.CosCalculator),
    'tanh-calculator': () => import('../calculators/tanh-calculator.js').then(m => m.TanhCalculator),
    'pow10-calculator': () => import('../calculators/pow10-calculator.js').then(m => m.Pow10Calculator),
    'pow2-calculator': () => import('../calculators/pow2-calculator.js').then(m => m.Pow2Calculator),
    'ln-calculator': () => import('../calculators/ln-calculator.js').then(m => m.LnCalculator),
    'log2-calculator': () => import('../calculators/log2-calculator.js').then(m => m.Log2Calculator),
    'log10-calculator': () => import('../calculators/log10-calculator.js').then(m => m.Log10Calculator),
    'sqrt-calculator': () => import('../calculators/sqrt-calculator.js').then(m => m.SqrtCalculator),
    'erf-calculator': () => import('../calculators/erf-calculator.js').then(m => m.ErfCalculator)
};

/**
 * CalculatorFactory - Factory for creating calculator instances
 * Uses dynamic imports for code splitting and lazy loading
 */
export class CalculatorFactory {
    /**
     * Create and initialize a calculator instance
     * @param {string} calculatorName - Calculator identifier (e.g., 'exp')
     * @param {HTMLElement} container - DOM container for the calculator
     * @param {Web3Provider} web3Provider - Web3 provider instance
     * @returns {Promise<Calculator>} Initialized calculator instance
     * 
     * @example
     * const calc = await CalculatorFactory.create('exp', container, web3Provider);
     */
    static async create(calculatorName, container, web3Provider) {
        const loader = CALCULATOR_MODULES[calculatorName];
        
        if (!loader) {
            throw new Error(`Unknown calculator: ${calculatorName}. Available calculators: ${this.getAvailableCalculators().join(', ')}`);
        }
        
        try {
            // Dynamically import the calculator module
            const CalculatorClass = await loader();
            
            // Instantiate the calculator
            const calculator = new CalculatorClass();
            
            // Initialize with container and web3 provider
            await calculator.init(container, web3Provider);
            
            return calculator;
        } catch (error) {
            console.error(`Failed to load calculator '${calculatorName}':`, error);
            throw new Error(`Failed to load calculator '${calculatorName}': ${error.message}`);
        }
    }
    
    /**
     * Get list of all available calculators
     * @returns {Array<string>} Array of calculator identifiers
     */
    static getAvailableCalculators() {
        return Object.keys(CALCULATOR_MODULES);
    }
    
    /**
     * Check if a calculator exists
     * @param {string} calculatorName - Calculator identifier
     * @returns {boolean} True if calculator exists
     */
    static has(calculatorName) {
        return calculatorName in CALCULATOR_MODULES;
    }
    
    /**
     * Preload a calculator module (without instantiating)
     * Useful for warming up the cache
     * @param {string} calculatorName - Calculator identifier
     * @returns {Promise<Function>} Calculator class constructor
     */
    static async preload(calculatorName) {
        const loader = CALCULATOR_MODULES[calculatorName];
        if (!loader) {
            throw new Error(`Unknown calculator: ${calculatorName}`);
        }
        return await loader();
    }
    
    /**
     * Preload all calculator modules
     * @returns {Promise<void>}
     */
    static async preloadAll() {
        const promises = Object.values(CALCULATOR_MODULES).map(loader => loader());
        await Promise.all(promises);
    }
}


