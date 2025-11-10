/**
 * Ln Factorial (ln(n!)) Calculator Tool
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class LnFactorialCalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 0.693147181;
        this.symbol = 'ln(n!)';
        this.name = 'Ln Factorial';
    }

    getContractName() {
        return 'ln-factorial';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📐 ${this.symbol} Calculator`,
            description: `Calculate ln(n!) on-chain! Log factorial avoids overflow for large combinatorial calculations.`,
            contractAddress: CONTRACT_ADDRESSES.LN_FACTORIAL,
            sourceFile: CONTRACT_SOURCES.LN_FACTORIAL,
            abiFile: CONTRACT_ABIS.LN_FACTORIAL
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'input-value',
            label: 'Integer (n)',
            type: 'number',
            placeholder: 'Enter integer (e.g., 10)',
            min: 0,
            max: 20,
            step: 1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, 20] integers only';
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
                <div class="result-info">Enter an integer and click Calculate</div>
                <div class="result-examples">
                    <p><strong>Examples:</strong></p>
                    <ul>
                        <li>ln(5!) ≈ 4.787</li>
                        <li>ln(10!) ≈ 15.104</li>
                        <li>ln(20!) ≈ 42.336</li>
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
                <p><strong>ln(n!)</strong> is the natural log of factorial</p>
                <ul>
                    <li>Calculate binomial coefficients: ln(C(n,k)) = ln(n!) - ln(k!) - ln((n-k)!)</li>
                    <li>Avoid overflow in large combinatorial problems</li>
                    <li>Used in statistical likelihood calculations</li>
                </ul>
                <p class="note">📍 <strong>Contract:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.LN_FACTORIAL}</code></p>
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
        
        const value = Math.floor(parseFloat(input));
        await this.calculateValue(value);
    }

    async calculateValue(value) {
        const result = await this.contract.calculate(Math.floor(value));
        const resultFormatted = (Number(result) / 1e10).toFixed(10);
        document.getElementById('result-value').textContent = resultFormatted;
    }
}

