/**
 * Common Logarithm (log10) Calculator Tool
 * Calculate log10(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class Log10Calculator extends Calculator {
    constructor() {
        super();
        this.symbol = 'log₁₀';
        this.name = 'Common Logarithm';
        this.constantValue = 10.0;
    }

    getContractName() {
        return 'log10-calculator';
    }

    async onAfterInit() {
        // Load constant value from contract (10)
        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
        } catch (error) {
            console.log('Using default 10 value');
        }
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📊 ${this.symbol}(x) Calculator`,
            description: `Calculate log₁₀(x) on-chain! The common logarithm is the inverse of 10^x and is widely used in science, engineering, and measuring orders of magnitude.`,
            contractAddress: CONTRACT_ADDRESSES.LOG10_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.LOG10_CALCULATOR,
            abiFile: CONTRACT_ABIS.LOG10_CALCULATOR
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
            placeholder: 'Enter value (e.g., 1000)',
            min: 0.000001,
            max: 10000000000,
            step: 1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: (0, 10^10] = (0, 10 billion]';
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
                <div class="result-examples">
                    <p><strong>Quick Examples:</strong></p>
                    <ul>
                        <li>log₁₀(1) = 0</li>
                        <li>log₁₀(10) = 1</li>
                        <li>log₁₀(100) = 2</li>
                        <li>log₁₀(1000) = 3</li>
                        <li>log₁₀(1,000,000) = 6</li>
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
                <p><strong>The common logarithm</strong> is the logarithm to base 10 and is the inverse of 10^x.</p>
                <ul>
                    <li><strong>Inverse of 10^x:</strong> If 10^y = x, then log₁₀(x) = y</li>
                    <li><strong>Orders of Magnitude:</strong> Measures scale in powers of 10</li>
                    <li><strong>Decibels:</strong> Sound intensity = 10·log₁₀(I/I₀)</li>
                    <li><strong>pH Scale:</strong> pH = -log₁₀[H⁺]</li>
                    <li><strong>Richter Scale:</strong> Earthquake magnitude</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> log₁₀(x) tells you the number of digits in x (rounded up)!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses digit-by-digit extraction for high accuracy (~10 decimal places).</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts!</p>
                <pre><code># Interface for ${this.name} Calculator
interface Log10Calculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.LOG10_CALCULATOR}

@external
@view
def my_calculation(value: decimal) -> decimal:
    # Call log₁₀(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall Log10Calculator(CALC).calculate(value)
    return result

# Example: Calculate number of digits in a number
@external
@view
def count_digits(number: decimal) -> decimal:
    # digits = floor(log₁₀(n)) + 1
    log_result: decimal = staticcall Log10Calculator(CALC).calculate(number)
    return floor(log_result) + 1.0
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.LOG10_CALCULATOR}</code></p>
            </div>
        `;
        return panel;
    }

    setupListeners() {
        const calculateButton = document.getElementById('calculate-button');
        const valueInput = document.getElementById('input-value');
        
        if (calculateButton && valueInput) {
            const handleCalculate = () => this.calculate(valueInput.value);
            calculateButton.addEventListener('click', handleCalculate);
            valueInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleCalculate();
            });
        }
    }

    async calculate(inputValue) {
        const x = parseFloat(inputValue);
        
        if (isNaN(x)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return;
        }
        
        if (x <= 0 || x > 10000000000) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Input must be in range (0, 10 billion]',
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

