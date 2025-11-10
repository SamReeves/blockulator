/**
 * Cosine Calculator Tool
 * Calculate cos(x) in radians on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class CosCalculator extends Calculator {
    getContractName() {
        return 'cos-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `📐 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! Cosine is a fundamental trigonometric function that returns the x-coordinate of a point on the unit circle.`,
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
            label: 'Angle (radians)',
            type: 'number',
            placeholder: 'Enter angle in radians (e.g., 1.5708)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Common values: 0 = 1, π/2 ≈ 1.5708 = 0, π ≈ 3.1416 = -1';
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
            hint: 'Enter an angle in radians and click Calculate to see the result'
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>cos(x)</strong> is one of the fundamental trigonometric functions.</p>`,
            features: [
                'Returns values in range [-1, 1]',
                'cos(0) = 1, cos(π/2) = 0, cos(π) = -1',
                'Used in circular motion, waves, and oscillations',
                'Essential for 3D graphics and physics simulations'
            ],
            notes: [
                '💡 <strong>Tip:</strong> π ≈ 3.14159, so π/2 ≈ 1.5708, π ≈ 3.1416, 2π ≈ 6.2832',
                '🔒 <strong>On-chain calculation:</strong> Uses a lookup table with linear interpolation for ~10 decimal place accuracy.'
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
