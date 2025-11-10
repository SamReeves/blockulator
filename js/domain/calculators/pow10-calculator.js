/**
 * Power of 10 Calculator Tool
 * Calculate 10^x on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class Pow10Calculator extends Calculator {
    getContractName() {
        return 'pow10-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `🔟 ${this.symbol} Calculator`,
            description: `Calculate ${this.symbol} on-chain! Powers of 10 are essential for scientific notation and decimal systems.`,
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
            label: 'Exponent (x)',
            type: 'number',
            placeholder: 'Enter exponent (e.g., 3)',
            min: -10,
            max: 50,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [-10, 50]';
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
                '10^0 = 1',
                '10^3 = 1000',
                '10^-2 = 0.01'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>10^x</strong> calculates powers of 10, foundation of our decimal system.</p>`,
            features: [
                'Scientific notation: express large/small numbers',
                'Orders of magnitude comparisons',
                'Decimal system and place values',
                'Used in engineering and science calculations'
            ],
            notes: [
                '💡 <strong>Sci Notation:</strong> 3.5 × 10^8 represents 350,000,000',
                '🔒 <strong>On-chain calculation:</strong> Optimized for decimal powers with high precision.'
            ]
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: -10,
            max: 50
        });
    }
}
