/**
 * Arctangent (atan) Calculator Tool
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class AtanCalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 0.785398163;
        this.symbol = 'atan(x)';
        this.name = 'Arctangent';
    }

    getContractName() {
        return 'atan';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📐 ${this.symbol} Calculator`,
            description: `Calculate arctangent on-chain! Returns angle in radians from any input value.`,
            contractAddress: CONTRACT_ADDRESSES.ATAN,
            sourceFile: CONTRACT_SOURCES.ATAN,
            abiFile: CONTRACT_ABIS.ATAN
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
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Returns angle in radians [-π/2, π/2]';
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
                    <p><strong>Key Values:</strong></p>
                    <ul>
                        <li>atan(0) = 0</li>
                        <li>atan(1) = π/4 ≈ 0.785</li>
                        <li>atan(-1) = -π/4 ≈ -0.785</li>
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
                <p><strong>atan(x)</strong> is the inverse tangent function</p>
                <ul>
                    <li>Returns angle whose tangent is x</li>
                    <li>Used in angle calculations and navigation</li>
                    <li>Completes the inverse trig suite</li>
                    <li>Essential for 2D graphics and geometry</li>
                </ul>
                <p class="note">📍 <strong>Contract:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.ATAN}</code></p>
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

