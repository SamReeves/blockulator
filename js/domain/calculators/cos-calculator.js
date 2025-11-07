/**
 * Cosine Calculator Tool
 * Calculate cos(x) in radians on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class CosCalculator extends Calculator {
    constructor() {
        super();
        this.symbol = 'cos';
        this.name = 'Cosine';
    }

    getContractName() {
        return 'cos-calculator';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: `📐 ${this.symbol}(x) Calculator`,
            description: `Calculate ${this.symbol}(x) on-chain! Cosine is a fundamental trigonometric function that returns the x-coordinate of a point on the unit circle.`,
            contractAddress: CONTRACT_ADDRESSES.COS_CALCULATOR,
            sourceFile: CONTRACT_SOURCES.COS_CALCULATOR,
            abiFile: CONTRACT_ABIS.COS_CALCULATOR
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'angle-input',
            label: 'Angle (radians)',
            type: 'number',
            placeholder: 'Enter angle in radians (e.g., 1.5708)',
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Common values: 0 = 1, π/2 ≈ 1.5708 = 0, π ≈ 3.1416 = -1';
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
                    Enter an angle in radians and click Calculate to see the result
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
                <p><strong>cos(x)</strong> is one of the fundamental trigonometric functions.</p>
                <ul>
                    <li>Returns values in range [-1, 1]</li>
                    <li>cos(0) = 1, cos(π/2) = 0, cos(π) = -1</li>
                    <li>Used in circular motion, waves, and oscillations</li>
                    <li>Essential for 3D graphics and physics simulations</li>
                </ul>
                <p class="note">💡 <strong>Tip:</strong> π ≈ 3.14159, so π/2 ≈ 1.5708, π ≈ 3.1416, 2π ≈ 6.2832</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Uses a lookup table with linear interpolation for ~10 decimal place accuracy.</p>
            </div>
            
            <h3>🔧 Use in Your Smart Contract</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts!</p>
                <pre><code># Interface for ${this.name} Calculator
interface ${this.name}Calculator:
    def calculate(x: decimal) -> decimal: view

# Use the calculator
CALC: constant(address) = ${CONTRACT_ADDRESSES.COS_CALCULATOR}

@external
@view
def my_calculation(angle: decimal) -> decimal:
    # Call ${this.symbol}(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall ${this.name}Calculator(CALC).calculate(angle)
    return result
</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${CONTRACT_ADDRESSES.COS_CALCULATOR}</code></p>
            </div>
        `;
        return panel;
    }

    setupListeners() {
        const calculateButton = document.getElementById('calculate-button');
        const angleInput = document.getElementById('angle-input');
        
        if (calculateButton && angleInput) {
            const handleCalculate = () => this.calculate(angleInput.value);
            calculateButton.addEventListener('click', handleCalculate);
            angleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleCalculate();
            });
        }
    }

    async calculate(angle) {
        const x = parseFloat(angle);
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

