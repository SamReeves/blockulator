/**
 * Natural Logarithm (ln) Calculator Tool
 * Calculate ln(x) on-chain
 */

import { ContractLoader } from '../core/contract-loader.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../contracts/deployments/addresses.js';

export class LnCalculator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'ln-calculator';
        this.constantValue = 2.718281828;
        this.symbol = 'ln';
        this.name = 'Natural Logarithm';
    }

    /**
     * Initialize the tool
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('ln-calculator', web3Provider);
        if (!this.contract) return;
        
        // Load constant value from contract (e)
        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
        } catch (error) {
            console.log('Using default e value');
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
            title: `📐 ${this.symbol}(x) Calculator`,
            description: `Calculate ln(x) on-chain! The natural logarithm is the inverse of e^x and is fundamental to calculus, probability, and growth/decay problems.`,
            contractAddress: CONTRACT_ADDRESSES.LN_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.LN_CALCULATOR,
            abiFile: CONTRACT_ABIS.LN_CALCULATOR
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        // Calculator controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'input-value',
            label: 'Input (x)',
            type: 'number',
            placeholder: 'Enter value (e.g., 10)',
            min: 0.000001,
            max: 22026.465,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: (0, e^10] ≈ (0, 22026.5]';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(DOMHelpers.createButton(
            'calculate-button',
            `Calculate ${this.symbol}(x) On-Chain`
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
                    <div class="result-label">${this.symbol}(x) =</div>
                    <div class="result-value" id="result-value">-</div>
                </div>
                <div class="result-info">
                    Enter a value and click Calculate to see the result
                </div>
                <div class="result-examples">
                    <p><strong>Quick Examples:</strong></p>
                    <ul>
                        <li>ln(1) = 0</li>
                        <li>ln(e) ≈ ln(2.718) = 1</li>
                        <li>ln(e²) ≈ ln(7.389) = 2</li>
                        <li>ln(10) ≈ 2.303</li>
                        <li>ln(100) ≈ 4.605</li>
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
                <p><strong>The natural logarithm</strong> is the logarithm to base <em>e</em> ≈ 2.718281828...</p>
                <ul>
                    <li><strong>Inverse of e^x:</strong> If e^y = x, then ln(x) = y</li>
                    <li><strong>Compound Growth:</strong> Calculate doubling time and growth rates</li>
                    <li><strong>Information Theory:</strong> Natural measure of information entropy</li>
                    <li><strong>Calculus:</strong> ln(x) has the simplest derivative: d/dx[ln(x)] = 1/x</li>
                    <li><strong>Probability:</strong> Log-likelihood in statistical inference</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> ln(x) is called "natural" because e appears naturally in many mathematical contexts!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses digit-by-digit extraction for high accuracy (~10 decimal places).</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts! Here's an example in Vyper:</p>
                <pre><code># Interface for ${this.name} Calculator
interface LnCalculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.LN_CALCULATOR}

@external
@view
def my_calculation(value: decimal) -> decimal:
    # Call ln(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall LnCalculator(CALC).calculate(value)
    return result

# Example: Calculate time to double with continuous growth
@external
@view
def doubling_time(growth_rate: decimal) -> decimal:
    # T = ln(2) / r
    ln_2: decimal = staticcall LnCalculator(CALC).calculate(2.0)
    return ln_2 / growth_rate
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.LN_CALCULATOR}</code></p>
            </div>
        `;
        return panel;
    }

    /**
     * Setup event listeners
     */
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

    /**
     * Calculate ln(x)
     */
    async calculate(inputValue) {
        const x = parseFloat(inputValue);
        
        if (isNaN(x)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return;
        }
        
        if (x <= 0 || x > 22026.465) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Input must be in range (0, e^10] ≈ (0, 22026.5]',
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
                message: `${this.symbol}(${x}) ≈ ${parseFloat(resultDecimal).toFixed(6)}`,
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
                calculateButton.textContent = `Calculate ${this.symbol}(x) On-Chain`;
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

