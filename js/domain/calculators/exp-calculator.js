/**
 * Exponential (e^x) Calculator Tool
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class ExpCalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 2.718281828;
        this.symbol = 'e^x';
        this.name = 'Exponential';
    }

    getContractName() {
        return 'exp';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📈 ${this.symbol} Calculator`,
            description: `Calculate e^x on-chain! The exponential function is fundamental to growth, decay, compound interest, and probability.`,
            contractAddress: CONTRACT_ADDRESSES.EXP,
            sourceFile: CONTRACT_SOURCES.EXP,
            abiFile: CONTRACT_ABIS.EXP
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
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
                <div class="result-info">
                    Enter a value and click Calculate
                </div>
                <div class="result-examples">
                    <p><strong>Examples:</strong></p>
                    <ul>
                        <li>e^0 = 1</li>
                        <li>e^1 ≈ 2.718</li>
                        <li>e^2 ≈ 7.389</li>
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
                <p><strong>e^x</strong> is the exponential function with base e ≈ 2.718</p>
                <ul>
                    <li>Compound interest and population growth</li>
                    <li>Probability distributions (normal, Poisson)</li>
                    <li>The derivative of e^x is e^x</li>
                    <li>Essential for differential equations</li>
                </ul>
                <p class="note">📍 <strong>Contract:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.EXP}</code></p>
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
