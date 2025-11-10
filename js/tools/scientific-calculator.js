/**
 * Unified Scientific Calculator
 * All math tools in one compact interface
 */

import { ContractLoader } from '../infrastructure/blockchain/contract-loader.js';
import { DOMHelpers } from '../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES } from '../infrastructure/config/contracts.js';

export class ScientificCalculator {
    constructor() {
        this.contracts = {};
        this.container = null;
        this.web3Provider = null;
        this.currentFunction = 'sin';
        
        // Function definitions
        this.functions = {
            // Trigonometric
            sin: { name: 'sin', symbol: 'sin', emoji: '🌊', category: 'trig', input: 'angle (rad)', range: '(-∞, ∞)' },
            cos: { name: 'cos', symbol: 'cos', emoji: '〰️', category: 'trig', input: 'angle (rad)', range: '(-∞, ∞)' },
            tanh: { name: 'tanh', symbol: 'tanh', emoji: '📈', category: 'trig', input: 'x', range: '(-∞, ∞)' },
            
            // Logarithms
            ln: { name: 'ln', symbol: 'ln', emoji: '🪵', category: 'log', input: 'x', range: '(0, ∞)' },
            log2: { name: 'log₂', symbol: 'log₂', emoji: '💿', category: 'log', input: 'x', range: '(0, ∞)' },
            log10: { name: 'log₁₀', symbol: 'log₁₀', emoji: '🔢', category: 'log', input: 'x', range: '(0, ∞)' },
            
            // Powers & Exponentials
            e: { name: 'e^x', symbol: 'e', emoji: '📊', category: 'power', input: 'exponent', range: '[0, 10)' },
            pi: { name: 'π^x', symbol: 'π', emoji: '🥧', category: 'power', input: 'exponent', range: '[0, 10)' },
            tau: { name: 'τ^x', symbol: 'τ', emoji: '⭕', category: 'power', input: 'exponent', range: '[0, 10)' },
            pow2: { name: '2^x', symbol: '2', emoji: '💾', category: 'power', input: 'exponent', range: '[0, 10)' },
            pow10: { name: '10^x', symbol: '10', emoji: '🔟', category: 'power', input: 'exponent', range: '[0, 10)' },
            
            // Roots & Special
            sqrt: { name: '√x', symbol: '√', emoji: '√', category: 'special', input: 'x', range: '[0, ∞)' },
            erf: { name: 'erf', symbol: 'erf', emoji: '📉', category: 'special', input: 'x', range: '(-∞, ∞)' }
        };
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Don't load all contracts upfront - load on demand instead
        // This saves ~300ms on initial load
        console.log('✅ Scientific Calculator ready (contracts load on-demand)');
        
        // Render UI
        this.render();
        
        // Setup event listeners
        this.setupListeners();
    }

    /**
     * Get contract name for a function key
     */
    getContractName(functionKey) {
        const contractMap = {
            sin: 'sin-calculator',
            cos: 'cos-calculator',
            tanh: 'tanh-calculator',
            ln: 'ln-calculator',
            log2: 'log2-calculator',
            log10: 'log10-calculator',
            e: 'e-calculator',
            pi: 'pi-calculator',
            tau: 'tau-calculator',
            pow2: 'pow2-calculator',
            pow10: 'pow10-calculator',
            sqrt: 'sqrt-calculator',
            erf: 'erf-calculator'
        };
        return contractMap[functionKey];
    }

    /**
     * Load a single contract on-demand
     */
    async loadContract(functionKey) {
        const contractName = this.getContractName(functionKey);
        
        if (!contractName) {
            throw new Error(`Unknown function: ${functionKey}`);
        }
        
        console.log(`📥 Loading ${contractName} contract...`);
        const startTime = performance.now();
        
            try {
            this.contracts[functionKey] = await ContractLoader.load(contractName, this.web3Provider);
            const loadTime = (performance.now() - startTime).toFixed(2);
            console.log(`✅ ${contractName} loaded in ${loadTime}ms`);
            } catch (error) {
                console.warn(`Failed to load ${contractName}:`, error);
            throw error;
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Header
        const header = GameRenderer.createGameHeader({
            title: '🧮 Scientific Calculator',
            description: 'All on-chain math functions in one place! Trig, logs, powers, and more.',
            contractAddress: null
        });
        container.appendChild(header);
        
        // Main calculator interface
        const calcDiv = document.createElement('div');
        calcDiv.className = 'game-sections';
        calcDiv.style.maxWidth = '900px';
        calcDiv.style.margin = '0 auto';
        
        calcDiv.innerHTML = `
            <!-- Function Selector Tabs -->
            <div class="contest-info-panel" style="padding: 0.75rem;">
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.7rem; font-weight: bold; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.5px;">Trigonometric</div>
                    <div style="display: flex; gap: 0.375rem; flex-wrap: wrap;">
                        ${this.renderFunctionButton('sin')}
                        ${this.renderFunctionButton('cos')}
                        ${this.renderFunctionButton('tanh')}
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.7rem; font-weight: bold; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.5px;">Logarithms</div>
                    <div style="display: flex; gap: 0.375rem; flex-wrap: wrap;">
                        ${this.renderFunctionButton('ln')}
                        ${this.renderFunctionButton('log2')}
                        ${this.renderFunctionButton('log10')}
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.7rem; font-weight: bold; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.5px;">Powers & Exponentials</div>
                    <div style="display: flex; gap: 0.375rem; flex-wrap: wrap;">
                        ${this.renderFunctionButton('e')}
                        ${this.renderFunctionButton('pi')}
                        ${this.renderFunctionButton('tau')}
                        ${this.renderFunctionButton('pow2')}
                        ${this.renderFunctionButton('pow10')}
                    </div>
                </div>
                
                <div>
                    <div style="font-size: 0.7rem; font-weight: bold; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.5px;">Roots & Special</div>
                    <div style="display: flex; gap: 0.375rem; flex-wrap: wrap;">
                        ${this.renderFunctionButton('sqrt')}
                        ${this.renderFunctionButton('erf')}
                    </div>
                </div>
            </div>
            
            <!-- Calculator Display -->
            <div class="contest-info-panel" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 1.5rem;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div id="function-display" style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                        sin(x)
                    </div>
                    <div id="function-description" style="font-size: 0.875rem; opacity: 0.9;">
                        Sine function
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: center;">
                        <div>
                            <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.375rem;">INPUT</div>
                            <input 
                                type="number" 
                                id="calc-input" 
                                step="0.1"
                                placeholder="Enter value"
                                style="width: 100%; padding: 0.5rem; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: white; border-radius: 6px; font-size: 1rem; font-weight: bold; text-align: center;"
                            />
                            <div id="input-hint" style="font-size: 0.65rem; margin-top: 0.25rem; opacity: 0.75;">Range: (-∞, ∞)</div>
                        </div>
                        
                        <div style="font-size: 1.5rem; opacity: 0.6;">→</div>
                        
                        <div>
                            <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.375rem;">RESULT</div>
                            <div id="calc-result" style="padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px; min-height: 2.5rem; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; font-family: monospace;">
                                -
                            </div>
                        </div>
                    </div>
                </div>
                
                <button id="calc-btn" class="btn-primary" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.2); border: 2px solid white; color: white; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    ⚡ Calculate On-Chain
                </button>
            </div>
            
            <!-- Quick Reference -->
            <details class="contest-info-panel" style="cursor: pointer;">
                <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                    <span>▶</span>
                    <span>📖 Quick Reference & Individual Calculators</span>
                </summary>
                <div style="margin-top: 0.75rem; font-size: 0.875rem;">
                    <p style="margin-bottom: 1rem; color: var(--md-sys-color-on-surface-variant);">
                        Need detailed documentation? Click any calculator below to view its individual page with full examples and usage information.
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.75rem;">
                        ${this.renderContractInfo()}
                    </div>
                </div>
            </details>
        `;
        
        container.appendChild(calcDiv);
        this.container.appendChild(container);
    }

    renderFunctionButton(key) {
        const fn = this.functions[key];
        const isActive = key === this.currentFunction;
        return `
            <button 
                class="function-btn" 
                data-function="${key}"
                style="
                    padding: 0.5rem 0.75rem;
                    background: ${isActive ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(139, 92, 246, 0.1)'};
                    color: ${isActive ? 'white' : 'var(--md-sys-color-on-surface)'};
                    border: 2px solid ${isActive ? '#3b82f6' : 'var(--md-sys-color-outline)'};
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: ${isActive ? 'bold' : 'normal'};
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                "
            >
                <span>${fn.emoji}</span>
                <span>${fn.name}</span>
            </button>
        `;
    }

    renderContractInfo() {
        return Object.entries(this.functions).map(([key, fn]) => {
            const addressKey = key.toUpperCase().replace('LOG2', 'LOG2').replace('LOG10', 'LOG10').replace('POW2', 'POW2').replace('POW10', 'POW10') + '_CALCULATOR';
            const address = CONTRACT_ADDRESSES[addressKey];
            const contractName = key + '-calculator';
            
            return `
                <div style="padding: 0.75rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 3px solid #8b5cf6; transition: all 0.2s; cursor: pointer;" 
                     onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'" 
                     onmouseout="this.style.background='rgba(139, 92, 246, 0.05)'"
                     onclick="window.open('?tool=${contractName}', '_blank')">
                    <div style="font-weight: bold; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 0.375rem;">
                            <span>${fn.emoji}</span>
                            <span>${fn.name}</span>
                        </div>
                        <span style="font-size: 0.75rem; opacity: 0.6;">↗</span>
                    </div>
                    <div style="font-size: 0.65rem; font-family: monospace; word-break: break-all; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">
                        ${address || 'N/A'}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--md-sys-color-primary); opacity: 0.8;">
                        Click for detailed docs →
                    </div>
                </div>
            `;
        }).join('');
    }

    setupListeners() {
        // Function button clicks
        document.querySelectorAll('.function-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchFunction(btn.dataset.function);
            });
        });
        
        // Calculate button
        const calcBtn = document.getElementById('calc-btn');
        const calcInput = document.getElementById('calc-input');
        
        if (calcBtn && calcInput) {
            calcBtn.addEventListener('click', () => this.calculate());
            calcInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calculate();
            });
        }
    }

    switchFunction(functionKey) {
        this.currentFunction = functionKey;
        const fn = this.functions[functionKey];
        
        // Update button states
        document.querySelectorAll('.function-btn').forEach(btn => {
            const isActive = btn.dataset.function === functionKey;
            btn.style.background = isActive ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(139, 92, 246, 0.1)';
            btn.style.color = isActive ? 'white' : 'var(--md-sys-color-on-surface)';
            btn.style.borderColor = isActive ? '#3b82f6' : 'var(--md-sys-color-outline)';
            btn.style.fontWeight = isActive ? 'bold' : 'normal';
        });
        
        // Update display
        const display = document.getElementById('function-display');
        const desc = document.getElementById('function-description');
        const hint = document.getElementById('input-hint');
        const result = document.getElementById('calc-result');
        
        if (display) {
            if (fn.category === 'power') {
                display.textContent = fn.name;
            } else if (fn.name === '√x') {
                display.textContent = '√x';
            } else {
                display.textContent = `${fn.name}(x)`;
            }
        }
        
        if (desc) {
            const descriptions = {
                sin: 'Sine function - fundamental to waves and oscillations',
                cos: 'Cosine function - phase-shifted sine',
                tanh: 'Hyperbolic tangent - sigmoid-like activation',
                ln: 'Natural logarithm - inverse of e^x',
                log2: 'Binary logarithm - used in computer science',
                log10: 'Common logarithm - base 10',
                e: "Euler's number exponential - natural growth",
                pi: 'Pi exponential - circular mathematics',
                tau: 'Tau exponential - alternative to pi',
                pow2: 'Powers of 2 - binary computing',
                pow10: 'Powers of 10 - scientific notation',
                sqrt: 'Square root - inverse of squaring',
                erf: 'Error function - statistics and probability'
            };
            desc.textContent = descriptions[functionKey] || fn.name;
        }
        
        if (hint) {
            hint.textContent = `Range: ${fn.range}`;
        }
        
        if (result) {
            result.textContent = '-';
        }
        
        // Clear input
        const input = document.getElementById('calc-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    }

    async calculate() {
        const input = document.getElementById('calc-input');
        const result = document.getElementById('calc-result');
        const calcBtn = document.getElementById('calc-btn');
        
        if (!input || !result) return;
        
        const x = parseFloat(input.value);
        
        if (isNaN(x)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return;
        }
        
        const fn = this.functions[this.currentFunction];
        
        // Load contract on-demand if not already loaded
        if (!this.contracts[this.currentFunction]) {
            try {
                result.textContent = 'Loading contract...';
                await this.loadContract(this.currentFunction);
            } catch (error) {
            eventBus.emit(EVENTS.TOAST, {
                    message: 'Failed to load contract',
                type: 'error'
            });
                result.textContent = 'Error';
            return;
            }
        }
        
        const contract = this.contracts[this.currentFunction];
        
        // Validate range
        if ((this.currentFunction === 'ln' || this.currentFunction === 'log2' || this.currentFunction === 'log10') && x <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Logarithms require positive input',
                type: 'warning'
            });
            return;
        }
        
        if ((this.currentFunction === 'e' || this.currentFunction === 'pi' || this.currentFunction === 'tau' || 
             this.currentFunction === 'pow2' || this.currentFunction === 'pow10') && (x < 0 || x >= 10)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Exponent must be in range [0, 10)',
                type: 'warning'
            });
            return;
        }
        
        if (this.currentFunction === 'sqrt' && x < 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Square root requires non-negative input',
                type: 'warning'
            });
            return;
        }
        
        try {
            if (calcBtn) {
                calcBtn.disabled = true;
                calcBtn.textContent = '⏳ Calculating...';
            }
            
            // Convert to fixed-point
            const xFixed = ethers.utils.parseUnits(x.toString(), 10);
            
            // Call contract
            const contractResult = await contract.calculate(xFixed);
            
            // Convert result
            const resultDecimal = ethers.utils.formatUnits(contractResult, 10);
            
            // Display result
            if (result) {
                result.textContent = parseFloat(resultDecimal).toFixed(10);
                result.style.color = '#10b981';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: `${fn.name}(${x}) ≈ ${parseFloat(resultDecimal).toFixed(6)}`,
                type: 'success'
            });
            
        } catch (error) {
            console.error('Calculation failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Calculation failed: ' + (error.reason || error.message),
                type: 'error'
            });
            if (result) {
                result.textContent = 'Error';
                result.style.color = '#ef4444';
            }
        } finally {
            if (calcBtn) {
                calcBtn.disabled = false;
                calcBtn.textContent = '⚡ Calculate On-Chain';
            }
        }
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

