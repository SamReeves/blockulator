/**
 * Factorial Calculator Tool
 * Calculate n! on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class FactorialCalculator extends Calculator {
    getContractName() {
        return 'factorial';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `🎲 ${this.symbol} Calculator`,
            description: `Calculate n! on-chain! Factorial is essential for combinatorics, probability, and permutations.`,
            contractAddress: this.metadata.contractAddress,
            sourceFile: this.metadata.sourceFile,
            abiFile: this.metadata.abiFile
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(this.dom.createInput({
            id: 'input-value',
            label: 'Integer (n)',
            type: 'number',
            placeholder: 'Enter integer (e.g., 5)',
            min: 0,
            max: 20,
            step: 1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, 20] integers only';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(this.dom.createButton(
            'calculate-button',
            `Calculate ${this.symbol} On-Chain`
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
            label: `${this.symbol} =`,
            examples: [
                '0! = 1',
                '5! = 120',
                '10! = 3,628,800'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>n!</strong> (n factorial) is the product of all positive integers less than or equal to n.</p>`,
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
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        const n = this.validateInput(inputValue, 0, 21);
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
            console.log(`Calculating ${n}! on-chain`);
            
            const result = await this.contract.calculate(n);
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `${n}! = ${parseFloat(resultDecimal).toFixed(0)}`);
            return resultDecimal;
        }, { loading: 'Calculating...' });
    }
}
