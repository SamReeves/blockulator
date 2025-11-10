/**
 * Normal CDF (Φ) Calculator Tool
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class NormCdfCalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 1.414213562;
        this.symbol = 'Φ(x)';
        this.name = 'Normal CDF';
    }

    getContractName() {
        return 'norm-cdf';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📊 ${this.symbol} Normal CDF Calculator`,
            description: `Calculate normal distribution CDF on-chain! Essential for statistics, z-tests, and probability.`,
            contractAddress: CONTRACT_ADDRESSES.NORM_CDF,
            sourceFile: CONTRACT_SOURCES.NORM_CDF,
            abiFile: CONTRACT_ABIS.NORM_CDF
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'input-value',
            label: 'Z-score (x)',
            type: 'number',
            placeholder: 'Enter z-score (e.g., 1.96)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Standard normal distribution (μ=0, σ=1)';
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
                <div class="result-info">Enter a z-score and click Calculate</div>
                <div class="result-examples">
                    <p><strong>Key Values:</strong></p>
                    <ul>
                        <li>Φ(0) = 0.5 (50%)</li>
                        <li>Φ(1) ≈ 0.841 (84.1%)</li>
                        <li>Φ(1.96) ≈ 0.975 (97.5%)</li>
                        <li>Φ(-1) ≈ 0.159 (15.9%)</li>
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
                <p><strong>Φ(x)</strong> gives the probability that a standard normal random variable is ≤ x</p>
                <ul>
                    <li>Z-tests and confidence intervals</li>
                    <li>Hypothesis testing in statistics</li>
                    <li>Uses error function internally</li>
                    <li>Returns probability between 0 and 1</li>
                </ul>
                <p class="note">📍 <strong>Contract:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.NORM_CDF}</code></p>
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

    async calculateValue(value) {
        // Convert to fixed-point (10 decimals)
        const valueScaled = Math.floor(value * 1e10);
        const result = await this.contract.standard_cdf(valueScaled);
        const resultFormatted = (Number(result) / 1e10).toFixed(10);
        document.getElementById('result-value').textContent = resultFormatted;
    }
}

