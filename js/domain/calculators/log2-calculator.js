/**
 * Base-2 Logarithm Calculator Tool
 * Calculate log₂(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class Log2Calculator extends Calculator {
    getContractName() {
        return 'log2-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `🔢 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! Base-2 logarithm is essential for computer science and information theory.`,
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
            placeholder: 'Enter value (e.g., 8)',
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
                'log₂(2) = 1',
                'log₂(8) = 3',
                'log₂(1024) = 10'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>log₂(x)</strong> is the base-2 logarithm, answering "2 to what power equals x?"</p>`,
            features: [
                'Fundamental in computer science and binary systems',
                'Measures information in bits (Shannon entropy)',
                'Used in algorithm complexity analysis',
                'Essential for digital signal processing'
            ],
            notes: [
                '💡 <strong>CS Tip:</strong> log₂(n) tells you how many bits needed to represent n values',
                '🔒 <strong>On-chain calculation:</strong> Uses natural log conversion: log₂(x) = ln(x) / ln(2).'
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
