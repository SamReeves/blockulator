/**
 * Square Root Calculator Tool
 * Calculate sqrt(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class SqrtCalculator extends Calculator {
    getContractName() {
        return 'sqrt-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `📐 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! The square root is fundamental for distance calculations, geometry, and physics.`,
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
            placeholder: 'Enter value (e.g., 16)',
            min: 0,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, ∞)';
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
                'sqrt(4) = 2',
                'sqrt(16) = 4',
                'sqrt(2) ≈ 1.414'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>sqrt(x)</strong> returns the square root - the number that when multiplied by itself equals x.</p>`,
            features: [
                'Only defined for non-negative numbers',
                'Used in distance formulas (Pythagorean theorem)',
                'Essential for standard deviation calculations',
                'Common in physics for quadratic relationships'
            ],
            notes: [
                '💡 <strong>Math Tip:</strong> sqrt(a*b) = sqrt(a) * sqrt(b)',
                '🔒 <strong>On-chain calculation:</strong> Uses Newton\'s method for fast convergence.'
            ]
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: 0,
            max: Infinity
        });
    }
}
