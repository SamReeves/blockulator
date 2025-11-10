/**
 * Hyperbolic Sine Calculator Tool
 * Calculate sinh(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class SinhCalculator extends Calculator {
    getContractName() {
        return 'sinh';
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
            label: 'Input (x)',
            type: 'number',
            placeholder: 'Enter value (e.g., 2)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [-10, 10]';
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
                'sinh(0) = 0',
                'sinh(1) ≈ 1.175',
                'sinh(2) ≈ 3.627'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>sinh(x)</strong> is the hyperbolic sine function.</p>`,
            features: [
                'Defined as: sinh(x) = (e^x - e^(-x)) / 2',
                'Used in calculus and hyperbolic geometry',
                'Models catenary curves (hanging chains)',
                'Essential for special relativity calculations'
            ],
            notes: [
                '💡 <strong>Note:</strong> Range is restricted to [-10, 10] to prevent overflow',
                '🔒 <strong>On-chain calculation:</strong> Uses exponential approximations for accuracy.'
            ]
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: -10,
            max: 10
        });
    }
}
