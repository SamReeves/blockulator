/**
 * Pow10 Calculator Tool
 * Calculate 10^x on-chain
 */

import { ContractLoader } from '../core/contract-loader.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../contracts/addresses.js';

export class Pow10Calculator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'pow10-calculator';
        this.constantValue = 10.0;
        this.symbol = '10';
        this.name = 'Power of 10';
    }

    /**
     * Initialize the tool
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('pow10-calculator', web3Provider);
        if (!this.contract) return;
        
        // Load constant value from contract
        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
        } catch (error) {
            console.log('Using default 10 value');
        }
        
        // Render UI
        this.render();
        
        // Setup event listeners
        this.setupListeners();
    }

    /**
     * Render the tool interface
     */
    render() {
        // Header with contract info
        const header = GameRenderer.createGameHeader({
            title: `🔟 ${this.symbol}^x Calculator`,
            description: `Calculate ${this.symbol}^x on-chain! Power of 10 is fundamental to our decimal number system and scientific notation.`,
            contractAddress: CONTRACT_ADDRESSES.POW10_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.POW10_CALCULATOR,
            abiFile: CONTRACT_ABIS.POW10_CALCULATOR
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        // Calculator controls
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
        
        // Content sections
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        sectionsContainer.appendChild(this.renderResultPanel());
        sectionsContainer.appendChild(this.renderInfoPanel());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

    /**
     * Render result panel
     */
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
                <div class="result-examples">
                    <p><strong>Quick Examples:</strong></p>
                    <ul>
                        <li>10^0 = 1</li>
                        <li>10^1 = 10</li>
                        <li>10^2 = 100</li>
                        <li>10^0.5 ≈ 3.162 (√10)</li>
                        <li>10^3.5 ≈ 3162.278</li>
                    </ul>
                </div>
            </div>
        `;
        return panel;
    }

    /**
     * Render info panel
     */
    renderInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.innerHTML = `
            <h3>ℹ️ About ${this.name}</h3>
            <div class="tool-info">
                <p><strong>Base 10</strong> is the foundation of our decimal number system.</p>
                <ul>
                    <li><strong>Scientific Notation:</strong> Express large/small numbers (e.g., 6.02 × 10^23)</li>
                    <li><strong>Logarithm Base:</strong> Common logarithm (log₁₀) is the inverse</li>
                    <li><strong>Decimal System:</strong> Each position represents a power of 10</li>
                    <li><strong>Order of Magnitude:</strong> Quick comparison of sizes</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> Powers of 10 are exact in decimal representation!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses digit-by-digit lookup table for high accuracy (~10 decimal places).</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts! Here's an example in Vyper:</p>
                <pre><code># Interface for ${this.name} Calculator
interface Pow10Calculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.POW10_CALCULATOR}

@external
@view
def my_calculation(exponent: decimal) -> decimal:
    # Call 10^x calculator (FREE - no gas cost!)
    result: decimal = staticcall Pow10Calculator(CALC).calculate(exponent)
    return result

# Example: Convert log scale to linear
@external
@view
def log_to_linear(log_value: decimal) -> decimal:
    return staticcall Pow10Calculator(CALC).calculate(log_value)
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.POW10_CALCULATOR}</code></p>
            </div>
        `;
        return panel;
    }

    /**
     * Setup event listeners
     */
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

    /**
     * Calculate 10^x
     */
    async calculate(exponent) {
        const x = parseFloat(exponent);
        
        if (isNaN(x)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return;
        }
        
        if (x < 0 || x >= 10) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Exponent must be in range [0, 10)',
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
            
            console.log(`Calculating ${this.symbol}^${x} on-chain`);
            
            // Convert JavaScript decimal to Vyper fixed-point (10 decimal places)
            const xFixed = ethers.utils.parseUnits(x.toString(), 10);
            
            // Use calculate() view function (free, no gas cost)
            const result = await this.contract.calculate(xFixed);
            
            // Convert result back from fixed-point to decimal
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            // Display result
            const resultValue = document.getElementById('result-value');
            if (resultValue) {
                resultValue.textContent = parseFloat(resultDecimal).toFixed(10);
                resultValue.style.color = 'var(--success)';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: `${this.symbol}^${x} ≈ ${parseFloat(resultDecimal).toFixed(6)}`,
                type: 'success'
            });
            
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

    /**
     * Cleanup
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

