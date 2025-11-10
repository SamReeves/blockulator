/**
 * Hyperbolic Cosine (cosh) Calculator Tool
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class CoshCalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 1.0;
        this.symbol = 'cosh(x)';
        this.name = 'Hyperbolic Cosine';
    }

    getContractName() {
        return 'cosh';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📈 ${this.symbol} Calculator`,
            description: `Calculate cosh(x) = (e^x + e^(-x))/2 on-chain! The even hyperbolic function.`,
            contractAddress: CONTRACT_ADDRESSES.COSH,
            sourceFile: CONTRACT_SOURCES.COSH,
            abiFile: CONTRACT_ABIS.COSH
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'input-value',
            label: 'Input (x)',
            type: 'number',
            placeholder: 'Enter value (e.g., 1)',
            min: -10,
            max: 10,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [-10, 10]';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(DOMHelpers.createButton(
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
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.innerHTML = `
            <h3>📊 Result</h3>
            <div class="calculator-result">
                <div class="result-display" id="result-display">
                    <div class="result-label">${this.symbol} =</div>
                    <div class="result-value" id="result-value">-</div>
                </div>
                <div class="result-info">Enter a value and click Calculate</div>
                <div class="result-examples">
                    <p><strong>Examples:</strong></p>
                    <ul>
                        <li>cosh(0) = 1</li>
                        <li>cosh(1) ≈ 1.543</li>
                        <li>cosh(-1) ≈ 1.543 (even function)</li>
                    </ul>
                </div>
            </div>
        `;
        return panel;
    }

    renderInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.innerHTML = `
            <h3>ℹ️ About ${this.name}</h3>
            <div class="tool-info">
                <p><strong>cosh(x) = (e^x + e^(-x))/2</strong> is the hyperbolic cosine function</p>
                <ul>
                    <li>Even function: cosh(-x) = cosh(x)</li>
                    <li>Always ≥ 1 for all real x</li>
                    <li>Identity: cosh²(x) - sinh²(x) = 1</li>
                    <li>Describes shape of hanging cables</li>
                </ul>
                <p class="note">📍 <strong>Contract:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.COSH}</code></p>
            </div>
        `;
        return panel;
    }

    setupListeners() {
        const calculateButton = document.getElementById('calculate-button');
        if (calculateButton) {
            calculateButton.addEventListener('click', () => this.handleCalculate());
        }
    }

    async handleCalculate() {
        const input = document.getElementById('input-value').value;
        if (!input) return;
        
        const value = parseFloat(input);
        await this.calculateValue(value);
    }
}

