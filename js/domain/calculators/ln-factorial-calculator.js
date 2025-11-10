/**
 * Natural Log of Factorial Calculator Tool
 * Calculate ln(n!) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class LnFactorialCalculator extends Calculator {
    getContractName() {
        return 'ln-factorial';
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(this.dom.createInput({
            id: 'input-value',
            label: 'Integer (n)',
            type: 'number',
            placeholder: 'Enter integer (e.g., 50)',
            min: 0,
            max: 1000,
            step: 1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, 1000] integers only';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(this.dom.createButton(
            'calculate-button',
            `Calculate ln(${this.symbol}) On-Chain`
        ));
        
        container.appendChild(controlsDiv);
        
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        sectionsContainer.appendChild(this.renderResultPanel());
        sectionsContainer.appendChild(this.renderInfoPanel());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

    renderResultPanel() {
        return this.renderStandardResultPanel({
            label: `ln(${this.symbol}) =`,
            examples: [
                'ln(0!) = 0',
                'ln(5!) ≈ 4.787',
                'ln(100!) ≈ 363.739'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>ln(n!)</strong> calculates the natural logarithm of n factorial, useful for large factorials that would overflow.</p>`,
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
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        const n = this.validateInput(inputValue, 0, 1001);
        if (n === null) return;

        // Check if integer
        if (!Number.isInteger(n)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Factorial requires an integer value',
                type: 'warning'
            });
            return;
        }

        return await this.withButtonState('calculate-button', async () => {
            console.log(`Calculating ln(${n}!) on-chain`);
            
            const result = await this.contract.calculate(n);
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `ln(${n}!) ≈ ${parseFloat(resultDecimal).toFixed(6)}`);
            return resultDecimal;
        }, { loading: 'Calculating...' });
    }
}
