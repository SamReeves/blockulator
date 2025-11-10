/**
 * Hyperbolic Cosine Calculator Tool
 * Calculate cosh(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class CoshCalculator extends Calculator {
    getContractName() {
        return 'cosh';
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
                'cosh(0) = 1',
                'cosh(1) ≈ 1.543',
                'cosh(2) ≈ 3.762'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>cosh(x)</strong> is the hyperbolic cosine function.</p>`,
            features: [
                'Defined as: cosh(x) = (e^x + e^(-x)) / 2',
                'Always greater than or equal to 1',
                'Models catenary curves (hanging cables)',
                'Used in physics and engineering'
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
