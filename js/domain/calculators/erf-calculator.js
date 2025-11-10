/**
 * Error Function Calculator Tool
 * Calculate erf(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class ErfCalculator extends Calculator {
    getContractName() {
        return 'erf-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `📊 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! The error function is essential for probability, statistics, and the normal distribution.`,
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
            label: 'Input (x)',
            type: 'number',
            placeholder: 'Enter value (e.g., 1)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: (-∞, ∞)';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(this.dom.createButton(
            'calculate-button',
            `Calculate ${this.symbol}(x) On-Chain`
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
            label: `${this.symbol}(x) =`,
            examples: [
                'erf(0) = 0',
                'erf(1) ≈ 0.843',
                'erf(∞) → 1'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>erf(x)</strong> is the error function, integral to probability and statistics.</p>`,
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
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue);
    }
}
