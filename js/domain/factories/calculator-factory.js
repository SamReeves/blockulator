/**
 * Calculator Factory
 * Domain layer - Creates calculator instances from config
 * Uses the registry for configuration-driven instantiation
 */

import { Calculator } from '../models/calculator.js';
import { CALCULATOR_REGISTRY } from '../calculators/calculator-registry.js';

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
        // Find calculator config in registry
        const config = CALCULATOR_REGISTRY.find(c => c.id === calculatorName);
        
        if (!config) {
            throw new Error(`Unknown calculator: ${calculatorName}. Available calculators: ${this.getAvailableCalculators().join(', ')}`);
        }
        
        try {
            // Instantiate calculator with config
            const calculator = new Calculator(config);
            
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
        return CALCULATOR_REGISTRY.map(c => c.id);
    }
    
    /**
     * Check if a calculator exists
     * @param {string} calculatorName - Calculator identifier
     * @returns {boolean} True if calculator exists
     */
    static has(calculatorName) {
        return CALCULATOR_REGISTRY.some(c => c.id === calculatorName);
    }
}


