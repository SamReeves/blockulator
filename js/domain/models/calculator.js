/**
 * Calculator Base Class
 * Domain layer - abstract base for on-chain calculators
 * Extends InteractiveContract with calculator-specific features
 */

import { InteractiveContract } from './interactive-contract.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class Calculator extends InteractiveContract {
    constructor() {
        super();
        this.constantValue = null;
        this.symbol = '';
        this.name = '';
    }

    /**
     * Hook: After init, load constant value from contract
     */
    async onAfterInit() {
        await this.loadConstantValue();
    }

    /**
     * Load constant value from contract (if available)
     * Override in subclasses if contract provides a get_constant() method
     */
    async loadConstantValue() {
        if (!this.contract || !this.contract.get_constant) {
            return;
        }

        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
            console.log(`Loaded ${this.name} constant: ${this.constantValue}`);
        } catch (error) {
            console.log(`Using default ${this.name} value`);
        }
    }

    /**
     * Abstract method: Perform calculation
     * Subclasses should implement their specific calculation logic
     */
    async calculate(input) {
        throw new Error('Subclass must implement calculate()');
    }

    /**
     * Validate numeric input
     */
    validateInput(value, min = -Infinity, max = Infinity) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return null;
        }
        
        if (num < min || num >= max) {
            eventBus.emit(EVENTS.TOAST, {
                message: `Value must be in range [${min}, ${max})`,
                type: 'warning'
            });
            return null;
        }
        
        return num;
    }

    /**
     * Display calculation result in UI
     */
    displayResult(result, formula = null) {
        const resultValue = document.getElementById('result-value');
        if (resultValue) {
            resultValue.textContent = parseFloat(result).toFixed(10);
            resultValue.style.color = 'var(--success)';
        }

        if (formula) {
            eventBus.emit(EVENTS.TOAST, {
                message: formula,
                type: 'success'
            });
        }
    }

    /**
     * Helper: Get contract metadata for rendering
     */
    getMetadata() {
        return {
            contractName: this.getContractName(),
            addressKey: this.getAddressKey(),
            sourceKey: this.getSourceKey(),
            abiKey: this.getAbiKey(),
            symbol: this.symbol,
            name: this.name,
            constantValue: this.constantValue
        };
    }

    /**
     * Convert contract name to SCREAMING_SNAKE_CASE for lookups
     */
    getAddressKey() {
        return this.getContractName().toUpperCase().replace(/-/g, '_');
    }

    /**
     * Get source file key (same as address key)
     */
    getSourceKey() {
        return this.getAddressKey();
    }

    /**
     * Get ABI file key (same as address key)
     */
    getAbiKey() {
        return this.getAddressKey();
    }
}

