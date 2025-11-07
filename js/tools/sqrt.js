/**
 * Square Root (√) Calculator Tool
 * Calculate √x on-chain
 */

import { ContractLoader } from '../core/contract-loader.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../contracts/deployments/addresses.js';

export class SqrtCalculator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'sqrt-calculator';
        this.constantValue = 1.414213562;
        this.symbol = '√';
        this.name = 'Square Root';
    }

    /**
     * Initialize the tool
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('sqrt-calculator', web3Provider);
        if (!this.contract) return;
        
        // Load constant value from contract (√2)
        try {
            const value = await this.contract.get_constant();
            this.constantValue = parseFloat(ethers.utils.formatUnits(value, 10));
        } catch (error) {
            console.log('Using default √2 value');
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
            title: `📐 ${this.symbol}x Calculator`,
            description: `Calculate √x on-chain! The square root is fundamental to geometry, physics, statistics, and appears everywhere from the Pythagorean theorem to standard deviation.`,
            contractAddress: CONTRACT_ADDRESSES.SQRT_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.SQRT_CALCULATOR,
            abiFile: CONTRACT_ABIS.SQRT_CALCULATOR
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
            placeholder: 'Enter value (e.g., 16)',
            min: 0,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [0, ∞) - any non-negative number';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(DOMHelpers.createButton(
            'calculate-button',
            `Calculate ${this.symbol}x On-Chain`
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
                    <div class="result-label">${this.symbol}x =</div>
                    <div class="result-value" id="result-value">-</div>
                </div>
                <div class="result-info">
                    Enter a value and click Calculate to see the result
                </div>
                <div class="result-examples">
                    <p><strong>Quick Examples:</strong></p>
                    <ul>
                        <li>√1 = 1</li>
                        <li>√2 ≈ 1.414</li>
                        <li>√4 = 2</li>
                        <li>√16 = 4</li>
                        <li>√100 = 10</li>
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
                <p><strong>The square root</strong> is the inverse operation of squaring: if x² = y, then √y = x</p>
                <ul>
                    <li><strong>Pythagorean Theorem:</strong> c = √(a² + b²) - hypotenuse of right triangle</li>
                    <li><strong>Standard Deviation:</strong> σ = √(variance) - measure of spread in statistics</li>
                    <li><strong>Distance Formula:</strong> d = √((x₂-x₁)² + (y₂-y₁)²)</li>
                    <li><strong>Physics:</strong> Appears in wave equations, escape velocity, and more</li>
                    <li><strong>Finance:</strong> Volatility calculations and portfolio theory</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> √2 was the first irrational number proven by ancient Greeks!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses Newton-Raphson method with lookup tables for ~10 decimal places accuracy.</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts! Here's an example in Vyper:</p>
                <pre><code># Interface for ${this.name} Calculator
interface SqrtCalculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.SQRT_CALCULATOR}

@external
@view
def my_calculation(value: decimal) -> decimal:
    # Call √x calculator (FREE - no gas cost!)
    result: decimal = staticcall SqrtCalculator(CALC).calculate(value)
    return result

# Example: Calculate Euclidean distance
@external
@view
def distance(x1: decimal, y1: decimal, x2: decimal, y2: decimal) -> decimal:
    # d = √((x₂-x₁)² + (y₂-y₁)²)
    dx: decimal = x2 - x1
    dy: decimal = y2 - y1
    sum_of_squares: decimal = dx * dx + dy * dy
    return staticcall SqrtCalculator(CALC).calculate(sum_of_squares)
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.SQRT_CALCULATOR}</code></p>
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
     * Calculate √x
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
        
        if (x < 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Square root undefined for negative numbers',
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
            
            console.log(`Calculating ${this.symbol}${x} on-chain`);
            
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
                message: `${this.symbol}${x} ≈ ${parseFloat(resultDecimal).toFixed(6)}`,
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
                calculateButton.textContent = `Calculate ${this.symbol}x On-Chain`;
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

