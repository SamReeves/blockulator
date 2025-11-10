/**
 * Exponential (e^x) Calculator Tool
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class ExpCalculator extends Calculator {
    getContractName() {
        return 'exp';
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
            label: 'Exponent (x)',
            type: 'number',
            placeholder: 'Enter exponent (e.g., 2)',
            min: 0,
            max: 9.999,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, 10)';
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
                'e^0 = 1',
                'e^1 ≈ 2.718',
                'e^2 ≈ 7.389'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>e^x</strong> is the exponential function with base e ≈ 2.718</p>`,
            features: [
                'Compound interest and population growth',
                'Probability distributions (normal, Poisson)',
                'The derivative of e^x is e^x',
                'Essential for differential equations'
            ],
            notes: [
                `📍 <strong>Contract:</strong> <code style="word-break: break-all;">${this.metadata.contractAddress}</code>`
            ]
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: 0,
            max: 10
        });
    }
}
