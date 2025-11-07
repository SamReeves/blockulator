/**
 * Hyperbolic Tangent Calculator Tool
 * Calculate tanh(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class TanhCalculator extends Calculator {
    constructor() {
        super();
        this.symbol = 'tanh';
        this.name = 'Hyperbolic Tangent';
    }

    getContractName() {
        return 'tanh-calculator';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `🌊 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! Hyperbolic tangent is an activation function commonly used in neural networks and machine learning.`,
            contractAddress: CONTRACT_ADDRESSES.TANH_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.TANH_CALCULATOR,
            abiFile: CONTRACT_ABIS.TANH_CALCULATOR
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'value-input',
            label: 'Input Value (x)',
            type: 'number',
            placeholder: 'Enter value (e.g., 2.5)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Common values: 0 = 0, 1 ≈ 0.762, 2 ≈ 0.964, ∞ → 1';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(DOMHelpers.createButton(
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
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.innerHTML = `
            <h3>📊 Result</h3>
            <div class="calculator-result">
                <div class="result-display" id="result-display">
                    <div class="result-label">${this.symbol}(x) =</div>
                    <div class="result-value" id="result-value">-</div>
                </div>
                <div class="result-info">
                    Enter a value and click Calculate to see the result
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
                <p><strong>tanh(x)</strong> is the hyperbolic tangent function.</p>
                <ul>
                    <li>Returns values in range (-1, 1)</li>
                    <li>tanh(0) = 0, tanh(∞) = 1, tanh(-∞) = -1</li>
                    <li>S-shaped curve similar to sigmoid</li>
                    <li>Popular activation function in neural networks</li>
                    <li>Smoother gradients than step functions</li>
                </ul>
                <p class="note">💡 <strong>Machine Learning:</strong> tanh is used in LSTMs and other recurrent neural networks!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses a lookup table with linear interpolation for accurate results.</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts!</p>
                <pre><code># Interface for ${this.name} Calculator
interface TanhCalculator:
    def calculate(x: decimal) -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.TANH_CALCULATOR}

@external
@view
def activation_function(x: decimal) -> decimal:
    # Call ${this.symbol}(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall TanhCalculator(CALC).calculate(x)
    return result
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.TANH_CALCULATOR}</code></p>
            </div>
        `;
        return panel;
    }

    setupListeners() {
        const calculateButton = document.getElementById('calculate-button');
        const valueInput = document.getElementById('value-input');
        
        if (calculateButton && valueInput) {
            const handleCalculate = () => this.calculate(valueInput.value);
            calculateButton.addEventListener('click', handleCalculate);
            valueInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleCalculate();
            });
        }
    }

    async calculate(value) {
        const x = parseFloat(value);
        if (isNaN(x)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return;
        }
        
        const calculateButton = document.getElementById('calculate-button');
        
        try {
            if (calculateButton) {
                calculateButton.disabled = true;
                calculateButton.textContent = 'Calculating...';
            }
            
            console.log(`Calculating ${this.symbol}(${x}) on-chain`);
            
            const xFixed = ethers.utils.parseUnits(x.toString(), 10);
            const result = await this.contract.calculate(xFixed);
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `${this.symbol}(${x}) ≈ ${parseFloat(resultDecimal).toFixed(6)}`);
            
        } catch (error) {
            console.error('Calculation failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Calculation failed: ' + (error.reason || error.message),
                type: 'error'
            });
        } finally {
            if (calculateButton) {
                calculateButton.disabled = false;
                calculateButton.textContent = `Calculate ${this.symbol}(x) On-Chain`;
            }
        }
    }
}

