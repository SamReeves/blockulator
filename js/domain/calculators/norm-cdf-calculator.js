/**
 * Normal CDF Calculator Tool
 * Calculate cumulative distribution function for standard normal distribution
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class NormCdfCalculator extends Calculator {
    getContractName() {
        return 'norm-cdf';
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
            label: 'Z-Score (x)',
            type: 'number',
            placeholder: 'Enter z-score (e.g., 1.96)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Standard normal: mean=0, std=1';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(this.dom.createButton(
            'calculate-button',
            `Calculate Φ(x) On-Chain`
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
            title: '📊 Probability',
            label: 'Φ(x) =',
            hint: 'Probability that a standard normal variable is ≤ x',
            examples: [
                'Φ(0) = 0.5 (50%)',
                'Φ(1.96) ≈ 0.975 (97.5%)',
                'Φ(-1.96) ≈ 0.025 (2.5%)'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>Φ(x)</strong> is the cumulative distribution function (CDF) of the standard normal distribution.</p>`,
            features: [
                'Returns probability: P(Z ≤ x)',
                'Used in hypothesis testing and confidence intervals',
                'Z-scores measure standard deviations from mean',
                'Essential for statistical analysis'
            ],
            notes: [
                '💡 <strong>Stats Tip:</strong> 95% of values fall within ±1.96 standard deviations',
                '🔒 <strong>On-chain calculation:</strong> Uses error function for high accuracy.'
            ],
            interfaceName: 'NormCdfCalculator'
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            formatResult: (x, result) => `Φ(${x}) ≈ ${parseFloat(result).toFixed(6)} (${(parseFloat(result) * 100).toFixed(2)}%)`
        });
    }
}
