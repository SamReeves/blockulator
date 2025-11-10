/**
 * Calculator App
 * Unified scientific calculator with all functions as buttons
 */

import { CALCULATOR_REGISTRY, CATEGORIES } from '../domain/calculators/calculator-registry.js';
import { ContractLoader } from '../infrastructure/blockchain/contract-loader.js';

export class CalculatorApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.contracts = {};
        
        console.log('🧮 CalculatorApp created');
    }

    /**
     * Initialize calculator view
     */
    async init() {
        console.log('🧮 Initializing Calculator app...');
        
        this.renderHTML();
        await this.loadContracts();
        this.buildButtons();
        this.setupListeners();
        
        console.log(`✅ Calculator app initialized (${CALCULATOR_REGISTRY.length} calculators)`);
    }

    /**
     * Render calculator HTML structure
     */
    renderHTML() {
        const container = document.getElementById('tool-container');
        container.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
                <h1 style="margin: 0 0 1rem 0; font-size: 1.5rem; color: #00ff88;">🧮 On-Chain Scientific Calculator</h1>
                
                <!-- Calculator Display -->
                <div class="calc-display">
                    <div class="display-row">
                        <label>Input:</label>
                        <input type="text" id="calc-input" placeholder="Enter value..." autocomplete="off">
                    </div>
                    <div class="display-row">
                        <label>Result:</label>
                        <div id="calc-output">-</div>
                        <button id="copy-btn" class="copy-btn" title="Copy result">📋</button>
                    </div>
                    <div id="status-msg" class="status-msg"></div>
                </div>

                <!-- Calculator Buttons -->
                <div id="calc-buttons" class="calc-buttons">
                    <div class="loading">Loading contracts...</div>
                </div>
            </div>

            <style>
                .calc-display {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                }
                
                .display-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .display-row:last-of-type {
                    margin-bottom: 0;
                }
                
                .display-row label {
                    min-width: 60px;
                    color: #888;
                    font-weight: 500;
                    font-size: 0.875rem;
                }
                
                #calc-input {
                    flex: 1;
                    padding: 0.75rem;
                    background: #0a0a0a;
                    border: 1px solid #333;
                    border-radius: 0.375rem;
                    color: #fff;
                    font-size: 1.25rem;
                    font-family: 'Courier New', monospace;
                }
                
                #calc-input:focus {
                    outline: none;
                    border-color: #00ff88;
                }
                
                #calc-output {
                    flex: 1;
                    padding: 0.75rem;
                    background: #0a0a0a;
                    border: 1px solid #00ff88;
                    border-radius: 0.375rem;
                    color: #00ff88;
                    font-size: 1.25rem;
                    font-family: 'Courier New', monospace;
                    font-weight: 600;
                }
                
                .copy-btn {
                    padding: 0.5rem;
                    background: #222;
                    border: 1px solid #333;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                
                .copy-btn:hover {
                    background: #333;
                    border-color: #00ff88;
                }
                
                .status-msg {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                    min-height: 1.25rem;
                }
                
                .status-msg.loading { color: #ffa500; }
                .status-msg.success { color: #00ff88; }
                .status-msg.error { color: #ff4444; }
                
                .calc-buttons {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                
                .btn-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .group-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #888;
                    margin-bottom: 0.25rem;
                }
                
                .calc-fn-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 0.375rem;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }
                
                .calc-fn-btn:hover {
                    background: #00ff88;
                    color: #000;
                    border-color: #00ff88;
                    transform: translateX(2px);
                }
                
                @media (max-width: 768px) {
                    .calc-buttons {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    /**
     * Load all calculator contracts
     */
    async loadContracts() {
        for (const calc of CALCULATOR_REGISTRY) {
            const contract = await ContractLoader.load(calc.id, this.web3Provider);
            if (contract) {
                this.contracts[calc.id] = contract;
            }
        }
    }

    /**
     * Build calculator function buttons
     */
    buildButtons() {
        const container = document.getElementById('calc-buttons');
        const grouped = {};
        
        CALCULATOR_REGISTRY.forEach(calc => {
            if (!grouped[calc.category]) grouped[calc.category] = [];
            grouped[calc.category].push(calc);
        });
        
        const sorted = Object.keys(grouped).sort((a, b) => 
            (CATEGORIES[a]?.order || 999) - (CATEGORIES[b]?.order || 999)
        );
        
        let html = '';
        sorted.forEach(catKey => {
            const cat = CATEGORIES[catKey];
            const calcs = grouped[catKey];
            
            html += `
                <div class="btn-group">
                    <div class="group-label">${cat.icon} ${cat.name}</div>
                    ${calcs.map(c => `
                        <button 
                            class="calc-fn-btn" 
                            data-id="${c.id}"
                            title="${c.description}">
                            ${c.emoji} <span>${c.name}</span>
                        </button>
                    `).join('')}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        // Function buttons
        document.querySelectorAll('.calc-fn-btn').forEach(btn => {
            btn.addEventListener('click', () => this.calculate(btn.dataset.id));
        });
        
        // Enter key
        const input = document.getElementById('calc-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const firstBtn = document.querySelector('.calc-fn-btn');
                    if (firstBtn) this.calculate(firstBtn.dataset.id);
                }
            });
        }
        
        // Copy button
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const output = document.getElementById('calc-output').textContent;
                if (output !== '-') {
                    navigator.clipboard.writeText(output);
                    this.showStatus('Copied!', 'success');
                }
            });
        }
    }

    /**
     * Perform calculation
     */
    async calculate(calcId) {
        const input = document.getElementById('calc-input').value.trim();
        const output = document.getElementById('calc-output');
        
        if (!input) {
            this.showStatus('Enter a value first', 'error');
            return;
        }
        
        const contract = this.contracts[calcId];
        if (!contract) {
            this.showStatus(`Contract not available for ${calcId}`, 'error');
            return;
        }
        
        try {
            this.showStatus('Calculating on-chain...', 'loading');
            
            const value = parseFloat(input);
            let result;
            
            // Handle different input types
            if (calcId === 'factorial' || calcId === 'ln-factorial') {
                // Integer input
                result = await contract.calculate(Math.floor(value));
                if (calcId === 'factorial') {
                    output.textContent = result.toString();
                } else {
                    output.textContent = (Number(result) / 1e10).toFixed(10);
                }
            } else if (calcId === 'norm-cdf') {
                // Uses standard_cdf
                const scaled = Math.floor(value * 1e10);
                result = await contract.standard_cdf(scaled);
                output.textContent = (Number(result) / 1e10).toFixed(10);
            } else {
                // Standard decimal calculation
                const scaled = Math.floor(value * 1e10);
                result = await contract.calculate(scaled);
                output.textContent = (Number(result) / 1e10).toFixed(10);
            }
            
            this.showStatus(`✓ ${calcId}(${value}) calculated`, 'success');
        } catch (error) {
            console.error('Calculation error:', error);
            output.textContent = 'Error';
            this.showStatus(error.message || 'Calculation failed', 'error');
        }
    }

    /**
     * Show status message
     */
    showStatus(msg, type) {
        const status = document.getElementById('status-msg');
        if (!status) return;
        
        status.textContent = msg;
        status.className = `status-msg ${type}`;
        
        if (type === 'success') {
            setTimeout(() => status.textContent = '', 2000);
        }
    }
}
