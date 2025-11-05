/**
 * Tau Calculator Tool
 * Calculate τ^x on-chain
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class TauCalculator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.gameType = 'tau-calculator';
        this.constantValue = 6.2831853072;
    }

    /**
     * Initialize the tool
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            console.error('Cannot initialize tool: Wallet not properly connected');
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return;
        }
        
        console.log('✅ Wallet confirmed:', web3Provider.currentAddress);
        
        // Load ABI from file
        try {
            const response = await fetch('/contracts/abis/tau-calculator.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.TAU_CALCULATOR,
                abi
            );
            
            console.log('Tau Calculator: Contract loaded at', CONTRACT_ADDRESSES.TAU_CALCULATOR);
            
        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load contract. Deploy the contract and update the ABI.',
                type: 'error'
            });
            return;
        }
        
        // Render UI
        this.render();
        
        // Setup event listeners
        this.setupListeners();
        
        // Load constant value
        if (this.contract) {
            try {
                const tauValue = await this.contract.get_constant();
                this.constantValue = parseFloat(tauValue.toString());
            } catch (error) {
                console.log('Using default τ value');
            }
        }
    }

    /**
     * Render the tool interface
     */
    render() {
        // Create custom calculator interface
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Title and description header
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = '⭕ τ Calculator';
        header.appendChild(title);
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = `Calculate τ^x on-chain! Tau (τ ≈ ${this.constantValue}) is the ratio of a circle's circumference to its radius (2π).`;
        header.appendChild(description);
        
        container.appendChild(header);
        
        // Calculator controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        controlsDiv.innerHTML = `
            <div class="input-group">
                <label for="exponent-input">Exponent (x)</label>
                <input 
                    type="number" 
                    id="exponent-input" 
                    placeholder="Enter exponent (e.g., 2.5)"
                    min="0"
                    max="9.999999"
                    step="0.1"
                />
                <div class="input-hint">Range: [0, 10)</div>
            </div>
            <button id="calculate-button" class="button-primary">Calculate τ^x</button>
        `;
        
        container.appendChild(controlsDiv);
        this.container.appendChild(container);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Result panel
        const resultPanel = this.renderResultPanel();
        sectionsContainer.appendChild(resultPanel);
        
        // Info panel
        const infoPanel = this.renderInfoPanel();
        sectionsContainer.appendChild(infoPanel);
        
        this.container.appendChild(sectionsContainer);
    }

    /**
     * Render result panel
     */
    renderResultPanel() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'result-panel';
        
        panel.innerHTML = `
            <h3>📊 Result</h3>
            <div class="calculator-result">
                <div class="result-display" id="result-display">
                    <div class="result-label">τ^x =</div>
                    <div class="result-value" id="result-value">-</div>
                </div>
                <div class="result-info">
                    Enter an exponent and click Calculate to see the result
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
            <h3>ℹ️ About Tau</h3>
            <div class="tool-info">
                <p><strong>τ ≈ 6.28318...</strong> is the "true" circle constant (2π).</p>
                <ul>
                    <li>Ratio of circle's circumference to radius</li>
                    <li>Simplifies many trigonometric formulas</li>
                    <li>One full turn = τ radians (not 2π)</li>
                    <li>Growing movement to replace π with τ in mathematics</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> June 28 (6/28) is Tau Day, celebrating τ!</p>
                <p class="note">🔒 <strong>On-chain calculation:</strong> Results are computed on the blockchain using a lookup table for ~10 decimal place accuracy.</p>
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
        
        const handleCalculate = () => this.calculate(expInput.value);
        
        if (calculateButton) {
            calculateButton.addEventListener('click', handleCalculate);
            this.eventListeners.push({ element: calculateButton, handler: handleCalculate });
        }
        
        if (expInput) {
            expInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleCalculate();
            });
        }
    }

    /**
     * Calculate τ^x
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
        
        try {
            const calculateButton = document.getElementById('calculate-button');
            if (calculateButton) {
                calculateButton.disabled = true;
                calculateButton.textContent = 'Calculating...';
            }
            
            console.log(`Calculating τ^${x}`);
            
            // Call the view function (free calculation)
            const result = await this.contract.calculate(x);
            
            console.log('Result:', result.toString());
            
            // Display result
            const resultValue = document.getElementById('result-value');
            if (resultValue) {
                const resultNum = parseFloat(result.toString());
                resultValue.textContent = resultNum.toFixed(10);
                resultValue.style.color = 'var(--success)';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: `τ^${x} ≈ ${parseFloat(result.toString()).toFixed(6)}`,
                type: 'success'
            });
            
        } catch (error) {
            console.error('Calculation failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Calculation failed: ' + (error.reason || error.message),
                type: 'error'
            });
        } finally {
            const calculateButton = document.getElementById('calculate-button');
            if (calculateButton) {
                calculateButton.disabled = false;
                calculateButton.textContent = 'Calculate τ^x';
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners = [];
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

