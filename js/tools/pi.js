/**
 * Pi Calculator Tool
 * Calculate π^x on-chain
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class PiCalculator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.gameType = 'pi-calculator';
        this.constantValue = 3.1415926536;
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
            const response = await fetch('/contracts/abis/pi-calculator.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.PI_CALCULATOR,
                abi
            );
            
            console.log('Pi Calculator: Contract loaded at', CONTRACT_ADDRESSES.PI_CALCULATOR);
            
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
                const piValue = await this.contract.get_constant();
                this.constantValue = parseFloat(piValue.toString());
            } catch (error) {
                console.log('Using default π value');
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
        title.textContent = '🥧 π Calculator';
        header.appendChild(title);
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = `Calculate π^x on-chain! Pi (π ≈ ${this.constantValue}) is the ratio of a circle's circumference to its diameter.`;
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
            <button id="calculate-button" class="button-primary">Calculate π^x</button>
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
                    <div class="result-label">π^x =</div>
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
            <h3>ℹ️ About Pi</h3>
            <div class="tool-info">
                <p><strong>π ≈ 3.14159...</strong> is one of the most famous mathematical constants.</p>
                <ul>
                    <li>Ratio of circle's circumference to diameter</li>
                    <li>Appears in geometry and trigonometry</li>
                    <li>Used in wave equations and physics</li>
                    <li>Transcendental number (not a root of any polynomial with rational coefficients)</li>
                </ul>
                <p class="note">💡 <strong>Fun fact:</strong> π has been calculated to over 100 trillion digits!</p>
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
     * Calculate π^x
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
            
            console.log(`Calculating π^${x}`);
            
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
                message: `π^${x} ≈ ${parseFloat(result.toString()).toFixed(6)}`,
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
                calculateButton.textContent = 'Calculate π^x';
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

