/**
 * E (Euler's Number) Calculator Tool
 * Calculate e^x on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class ECalculator extends Calculator {
    constructor() {
        super();
        this.constantValue = 2.7182818285;
        this.symbol = 'e';
        this.name = 'Euler';
    }

    getContractName() {
        return 'e-calculator';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `🔢 ${this.symbol} Calculator`,
            description: `Calculate ${this.symbol}^x on-chain! Euler's number (${this.symbol} ≈ ${this.constantValue}) is the base of natural logarithms.`,
            contractAddress: CONTRACT_ADDRESSES.E_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.E_CALCULATOR,
            abiFile: CONTRACT_ABIS.E_CALCULATOR
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'exponent-input',
            label: 'Exponent (x)',
            type: 'number',
            placeholder: 'Enter exponent (e.g., 2.5)',
            min: 0,
            max: 9.999999,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, 10)';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(DOMHelpers.createButton(
            'calculate-button',
            `Calculate ${this.symbol}^x On-Chain`
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
                    <div class="result-label">${this.symbol}^x =</div>
                    <div class="result-value" id="result-value">-</div>
                </div>
                <div class="result-info">
                    Enter an exponent and click Calculate to see the result
                </div>
            </div>
        `;
        return panel;
    }

    renderInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.innerHTML = `
            <h3>ℹ️ About ${this.name}'s Number</h3>
            <div class="tool-info">
                <p><strong>${this.symbol} ≈ 2.71828...</strong> is the base of the natural logarithm.</p>
                <ul>
                    <li>Discovered by Leonhard Euler</li>
                    <li>Appears in compound interest calculations</li>
                    <li>Found in probability theory and statistics</li>
                    <li>Essential in calculus (derivative of e^x is e^x)</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> ${this.symbol} is irrational and transcendental, like π!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Results are computed on the blockchain using a lookup table for ~10 decimal place accuracy.</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts! Here's an example in Vyper:</p>
                <pre><code># Interface for ${this.name} Calculator
interface ${this.name}Calculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.E_CALCULATOR}

@external
@view
def my_calculation(exponent: decimal) -> decimal:
    # Call ${this.symbol}^x calculator (FREE - no gas cost!)
    result: decimal = staticcall ${this.name}Calculator(CALC).calculate(exponent)
    return result
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.E_CALCULATOR}</code></p>
            </div>
        `;
        return panel;
    }

    setupListeners() {
        const calculateButton = document.getElementById('calculate-button');
        const expInput = document.getElementById('exponent-input');
        
        if (calculateButton && expInput) {
            const handleCalculate = () => this.calculate(expInput.value);
            calculateButton.addEventListener('click', handleCalculate);
            expInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleCalculate();
            });
        }
    }

    async calculate(exponent) {
        const x = this.validateInput(exponent, 0, 10);
        if (x === null) return;
        
        const calculateButton = document.getElementById('calculate-button');
        
        try {
            if (calculateButton) {
                calculateButton.disabled = true;
                calculateButton.textContent = 'Calculating...';
            }
            
            console.log(`Calculating ${this.symbol}^${x} on-chain`);
            
            const xFixed = ethers.utils.parseUnits(x.toString(), 10);
            const result = await this.contract.calculate(xFixed);
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `${this.symbol}^${x} ≈ ${parseFloat(resultDecimal).toFixed(6)}`);
            
        } catch (error) {
            console.error('Calculation failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Calculation failed: ' + (error.reason || error.message),
                type: 'error'
            });
        } finally {
            if (calculateButton) {
                calculateButton.disabled = false;
                calculateButton.textContent = `Calculate ${this.symbol}^x On-Chain`;
            }
        }
    }
}

