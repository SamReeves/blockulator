/**
 * Binary Logarithm (log2) Calculator Tool
 * Calculate log2(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class Log2Calculator extends Calculator {
    constructor() {
        super();
        this.symbol = 'log₂';
        this.name = 'Binary Logarithm';
        this.constantValue = 2.0;
    }

    getContractName() {
        return 'log2-calculator';
    }

    async onAfterInit() {
        // Load constant value from contract (2)
        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
        } catch (error) {
            console.log('Using default 2 value');
        }
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `🔢 ${this.symbol}(x) Calculator`,
            description: `Calculate log₂(x) on-chain! The binary logarithm is the inverse of 2^x and is fundamental to computer science, information theory, and algorithmic complexity.`,
            contractAddress: CONTRACT_ADDRESSES.LOG2_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.LOG2_CALCULATOR,
            abiFile: CONTRACT_ABIS.LOG2_CALCULATOR
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
            placeholder: 'Enter value (e.g., 256)',
            min: 0.000001,
            max: 1024,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: (0, 2^10] = (0, 1024]';
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
                        <li>log₂(1) = 0</li>
                        <li>log₂(2) = 1</li>
                        <li>log₂(8) = 3</li>
                        <li>log₂(256) = 8 (1 byte)</li>
                        <li>log₂(1024) = 10 (1 KiB)</li>
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
                <p><strong>The binary logarithm</strong> is the logarithm to base 2 and is the inverse of 2^x.</p>
                <ul>
                    <li><strong>Inverse of 2^x:</strong> If 2^y = x, then log₂(x) = y</li>
                    <li><strong>Information Theory:</strong> Measures information content in bits</li>
                    <li><strong>Algorithm Analysis:</strong> Complexity of divide-and-conquer algorithms</li>
                    <li><strong>Binary Search:</strong> log₂(n) comparisons to find element</li>
                    <li><strong>Tree Depth:</strong> Height of balanced binary trees</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> log₂(x) tells you how many bits you need to represent x distinct values!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses digit-by-digit extraction for high accuracy (~10 decimal places).</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts!</p>
                <pre><code># Interface for ${this.name} Calculator
interface Log2Calculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.LOG2_CALCULATOR}

@external
@view
def my_calculation(value: decimal) -> decimal:
    # Call log₂(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall Log2Calculator(CALC).calculate(value)
    return result

# Example: Calculate bits needed to represent n values
@external
@view
def bits_needed(num_values: decimal) -> decimal:
    # bits = ceil(log₂(n))
    log_result: decimal = staticcall Log2Calculator(CALC).calculate(num_values)
    # Round up to next integer
    return ceil(log_result)
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.LOG2_CALCULATOR}</code></p>
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
        
        if (x <= 0 || x > 1024) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Input must be in range (0, 1024]',
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

