import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class FactorialCalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 1;
        this.symbol = 'n!';
        this.name = 'Factorial';
    }

    getContractName() {
        return 'factorial';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `🎲 ${this.symbol} Calculator`,
            description: `Calculate n! on-chain! Factorial is essential for combinatorics, probability, and permutations.`,
            contractAddress: CONTRACT_ADDRESSES.FACTORIAL,
            sourceFile: CONTRACT_SOURCES.FACTORIAL,
            abiFile: CONTRACT_ABIS.FACTORIAL
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
            placeholder: 'Enter integer (e.g., 5)',
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
                        <li>0! = 1</li>
                        <li>5! = 120</li>
                        <li>10! = 3,628,800</li>
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
                <p><strong>n!</strong> is the product of all positive integers ≤ n</p>
                <ul>
                    <li>Permutations: P(n,k) = n!/(n-k)!</li>
                    <li>Combinations: C(n,k) = n!/(k!(n-k)!)</li>
                    <li>Essential for probability calculations</li>
                </ul>
                <p class="note">📍 <strong>Contract:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.FACTORIAL}</code></p>
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
        const result = await this.contract.calculate(value);
        document.getElementById('result-value').textContent = result.toString();
    }

    async calculateValue(value) {
        const result = await this.contract.calculate(Math.floor(value));
        document.getElementById('result-value').textContent = result.toString();
    }
}
