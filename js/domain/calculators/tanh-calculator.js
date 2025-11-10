/**
 * Hyperbolic Tangent Calculator Tool
 * Calculate tanh(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class TanhCalculator extends Calculator {
    getContractName() {
        return 'tanh';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `📈 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! The hyperbolic tangent is crucial for neural networks and activation functions.`,
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
                'tanh(0) = 0',
                'tanh(1) ≈ 0.762',
                'tanh(∞) → 1'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>tanh(x)</strong> is the hyperbolic tangent function, widely used as an activation function in neural networks.</p>`,
            features: [
                'Returns values in range (-1, 1)',
                'Defined as: tanh(x) = sinh(x) / cosh(x)',
                'Smooth, differentiable, and zero-centered',
                'Popular in machine learning and AI'
            ],
            notes: [
                '💡 <strong>ML Tip:</strong> tanh is preferred over sigmoid in hidden layers because it\'s zero-centered',
                '🔒 <strong>On-chain calculation:</strong> Uses efficient approximations for neural network applications.'
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
