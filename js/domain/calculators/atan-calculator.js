/**
 * Arctangent Calculator Tool
 * Calculate atan(x) (inverse tangent) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class AtanCalculator extends Calculator {
    getContractName() {
        return 'atan';
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
            placeholder: 'Enter value (e.g., 1)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [-100, 100]';
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
                'atan(0) = 0',
                'atan(1) = π/4 ≈ 0.785',
                'atan(∞) → π/2'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>atan(x)</strong> is the arctangent or inverse tangent function.</p>`,
            features: [
                'Returns angle in radians: (-π/2, π/2)',
                'Used to find angles from coordinates',
                'Essential for 2D/3D rotations',
                'Common in computer graphics and robotics'
            ],
            notes: [
                '💡 <strong>Tip:</strong> For full circle angles, use atan2(y, x) which handles all quadrants',
                '🔒 <strong>On-chain calculation:</strong> Uses Taylor series approximations for accuracy.'
            ]
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: -100,
            max: 100
        });
    }
}
