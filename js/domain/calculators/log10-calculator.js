/**
 * Base-10 Logarithm Calculator Tool
 * Calculate log₁₀(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class Log10Calculator extends Calculator {
    getContractName() {
        return 'log10-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `🔟 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! Base-10 logarithm is the common logarithm used in science and engineering.`,
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
            placeholder: 'Enter value (e.g., 100)',
            min: 0.000001,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: (0, ∞)';
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
                'log₁₀(10) = 1',
                'log₁₀(100) = 2',
                'log₁₀(1000) = 3'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>log₁₀(x)</strong> is the base-10 (common) logarithm, answering "10 to what power equals x?"</p>`,
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
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: 0.000001,
            max: Infinity
        });
    }
}
