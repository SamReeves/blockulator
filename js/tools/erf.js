/**
 * Error Function (erf) Calculator Tool
 * Calculate erf(x) on-chain for normal distribution calculations
 */

import { ContractLoader } from '../core/contract-loader.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../contracts/deployments/addresses.js';

export class ErfCalculator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'erf-calculator';
        this.constantValue = 1.128379167;
        this.symbol = 'erf';
        this.name = 'Error Function';
    }

    /**
     * Initialize the tool
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('erf-calculator', web3Provider);
        if (!this.contract) return;
        
        // Load constant value from contract (2/√π)
        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
        } catch (error) {
            console.log('Using default 2/√π value');
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
            description: `Calculate erf(x) on-chain! The error function is essential for normal distribution calculations, used in statistics, probability theory, and partial differential equations.`,
            contractAddress: CONTRACT_ADDRESSES.ERF_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.ERF_CALCULATOR,
            abiFile: CONTRACT_ABIS.ERF_CALCULATOR
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
            placeholder: 'Enter value (e.g., 1.0)',
            min: -5,
            max: 5,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [-5, 5] - practical range for accurate results';
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
                        <li>erf(0) = 0</li>
                        <li>erf(0.5) ≈ 0.520</li>
                        <li>erf(1) ≈ 0.843</li>
                        <li>erf(2) ≈ 0.995</li>
                        <li>erf(∞) → 1</li>
                    </ul>
                    <p><strong>Normal CDF:</strong> Φ(x) = 0.5 × (1 + erf(x/√2))</p>
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
                <p><strong>The error function</strong> is defined as erf(x) = (2/√π) ∫₀ˣ e^(-t²) dt</p>
                <ul>
                    <li><strong>Normal Distribution:</strong> CDF of standard normal: Φ(x) = 0.5 × (1 + erf(x/√2))</li>
                    <li><strong>Probability Theory:</strong> Calculate probabilities under Gaussian distributions</li>
                    <li><strong>Statistics:</strong> P-values, confidence intervals, Z-scores</li>
                    <li><strong>Physics:</strong> Heat diffusion, quantum mechanics</li>
                    <li><strong>Signal Processing:</strong> Gaussian filtering and noise analysis</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> Called "error" function because it was first used to analyze errors in astronomical measurements!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses Abramowitz-Stegun approximation with accuracy ~1.5×10⁻⁷.</p>
                <p class="note">📊 <strong>Properties:</strong> Odd function (erf(-x) = -erf(x)), bounded between -1 and 1</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts! Here's an example in Vyper:</p>
                <pre><code># Interface for ${this.name} Calculator
interface ErfCalculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.ERF_CALCULATOR}

@external
@view
def my_calculation(value: decimal) -> decimal:
    # Call erf(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall ErfCalculator(CALC).calculate(value)
    return result

# Example: Calculate normal distribution CDF
@external
@view
def normal_cdf(z: decimal) -> decimal:
    # Φ(z) = 0.5 × (1 + erf(z/√2))
    # For z-score in standard normal distribution
    z_normalized: decimal = z / 1.4142135624  # divide by √2
    erf_result: decimal = staticcall ErfCalculator(CALC).calculate(z_normalized)
    return 0.5 * (1.0 + erf_result)
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.ERF_CALCULATOR}</code></p>
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
     * Calculate erf(x)
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
        
        if (x < -5 || x > 5) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Input outside practical range [-5, 5]',
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

