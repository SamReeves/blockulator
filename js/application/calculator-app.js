/**
 * Calculator App — TI-style scientific calculator UI
 */

import { CALCULATOR_REGISTRY, CATEGORIES, getCalculatorById } from '../domain/calculators/calculator-registry.js?v=2';
import { loadContract } from '../infrastructure/blockchain/load-contract.js?v=2';
import { ContractInfoRenderer } from '../presentation/renderers/contract-info-renderer.js?v=2';
import { getContractsByType, getContractMetadata } from '../infrastructure/config/contract-registry.js?v=2';

// Explicit key layout — every function has a visible button.
// 6 columns, spatial grouping replaces category headers.
const BUTTON_LAYOUT = [
    'sin-calculator',   'cos-calculator',   'atan',             'sinh',             'cosh',             'tanh-calculator',
    'ln-calculator',    'log2-calculator',   'log10-calculator', 'exp',              'pow2-calculator',  'pow10-calculator',
    'sqrt-calculator',  'factorial',        'ln-factorial',     'gcd',              'erf-calculator',   'norm-cdf',
    'norm-pdf',         'gaussian-tail',    'zscore',           'pi-calculator',    'e-calculator',     'tau-calculator',
];

export class CalculatorApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.contracts = {};
        this.lastCalcId = null;

        console.log('CalculatorApp created');
    }

    async init() {
        console.log('Initializing Calculator app...');

        this.renderHTML();
        await this.loadContracts();
        this.buildButtons();
        this.setupListeners();
        this.renderContractInfo();

        console.log(`Calculator app initialized (${CALCULATOR_REGISTRY.length} calculators)`);
    }

    renderHTML() {
        const container = document.getElementById('vyper-container');
        if (!container) {
            console.error('vyper-container not found');
            return;
        }
        container.innerHTML = `
            <div class="ti-calc-shell">
                <!-- Header -->
                <div class="vyper-header">
                    <h2 class="vyper-title">Vyper Math</h2>
                    <p class="vyper-subtitle">Decimal Stats functions in Vyper 0.4</p>
                </div>

                <!-- LCD Screen -->
                <div class="ti-lcd">
                    <div class="ti-lcd-inner">
                        <div id="ti-expr" class="ti-expr"></div>
                        <div id="ti-result" class="ti-result">0</div>
                    </div>
                </div>

                <!-- Input area -->
                <div class="ti-input-area">
                    <input type="text" id="calc-input" class="ti-input" placeholder="0" autocomplete="off" inputmode="decimal">
                    <div id="ti-extra-inputs" class="ti-extra-inputs"></div>
                    <div id="status-msg" class="ti-status"></div>
                </div>

                <!-- Keypad -->
                <div class="ti-keypad">
                    <div class="ti-toolbar">
                        <button id="copy-btn" class="ti-tool-btn" title="Copy result">COPY</button>
                    </div>
                    <div id="calc-buttons" class="ti-buttons">
                        <div class="ti-loading">Loading...</div>
                    </div>
                </div>
            </div>

            <style>
                .ti-calc-shell {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 1.5rem 1rem;
                    font-family: 'Courier New', 'Consolas', monospace;
                }

                .vyper-header {
                    text-align: center;
                    margin-bottom: 1rem;
                }

                .vyper-title {
                    color: #00ff88;
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                    font-weight: 700;
                }

                .vyper-subtitle {
                    color: #4a7a4a;
                    font-size: 0.875rem;
                    letter-spacing: 0.5px;
                }

                /* ── LCD Display ── */
                .ti-lcd {
                    background: #1a2a1a;
                    border: 3px solid #333;
                    border-radius: 0.5rem;
                    padding: 3px;
                    margin-bottom: 0.75rem;
                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
                }

                .ti-lcd-inner {
                    background: #0d1f0d;
                    border-radius: 0.25rem;
                    padding: 1rem 1.25rem;
                    min-height: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }

                .ti-expr {
                    text-align: right;
                    color: #4a7a4a;
                    font-size: 0.875rem;
                    min-height: 1.25rem;
                    word-break: break-all;
                    letter-spacing: 0.5px;
                }

                .ti-result {
                    text-align: right;
                    color: #00ff88;
                    font-size: 1.75rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                    word-break: break-all;
                    text-shadow: 0 0 8px rgba(0,255,136,0.3);
                }

                /* ── Input ── */
                .ti-input-area {
                    margin-bottom: 0.75rem;
                }

                .ti-input {
                    width: 100%;
                    padding: 0.625rem 0.75rem;
                    background: #111;
                    border: 2px solid #333;
                    border-radius: 0.375rem;
                    color: #fff;
                    font-size: 1.125rem;
                    font-family: 'Courier New', monospace;
                    text-align: right;
                    box-sizing: border-box;
                }

                .ti-input:focus {
                    outline: none;
                    border-color: #00ff88;
                }

                .ti-extra-inputs {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .ti-extra-inputs:empty {
                    display: none;
                }

                .ti-extra-input-group {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                .ti-extra-label {
                    color: #666;
                    font-size: 0.75rem;
                    white-space: nowrap;
                }

                .ti-extra-field {
                    flex: 1;
                    padding: 0.5rem 0.625rem;
                    background: #111;
                    border: 2px solid #333;
                    border-radius: 0.375rem;
                    color: #fff;
                    font-size: 0.9rem;
                    font-family: 'Courier New', monospace;
                    text-align: right;
                    box-sizing: border-box;
                }

                .ti-extra-field:focus {
                    outline: none;
                    border-color: #00ff88;
                }

                .ti-status {
                    font-size: 0.75rem;
                    min-height: 1rem;
                    margin-top: 0.375rem;
                    text-align: right;
                }
                .ti-status.loading { color: #ffa500; }
                .ti-status.success { color: #00ff88; }
                .ti-status.error { color: #ff4444; }

                /* ── Toolbar ── */
                .ti-toolbar {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    justify-content: flex-end;
                }

                .ti-tool-btn {
                    position: relative;
                    padding: 0.375rem 0.75rem;
                    background: #1a1a1a;
                    border: 2px solid #333;
                    border-bottom-width: 4px;
                    border-radius: 0.375rem;
                    color: #888;
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.1s;
                    letter-spacing: 1px;
                    margin-left: auto;
                }

                .ti-tool-btn:active {
                    top: 2px;
                    border-bottom-width: 2px;
                }

                .ti-tool-btn:hover {
                    border-color: #00ff88;
                    color: #00ff88;
                }

                /* ── Button Grid ── */
                .ti-buttons {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 0.375rem;
                }

                .ti-key {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.625rem 0.25rem;
                    min-height: 48px;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.1s;
                    font-family: 'Courier New', monospace;
                    font-weight: 700;
                    font-size: 0.85rem;
                    letter-spacing: 0.5px;
                    text-align: center;
                    border-width: 2px;
                    border-style: solid;
                    border-bottom-width: 4px;
                    box-sizing: border-box;
                    user-select: none;
                }

                .ti-key:active {
                    top: 2px;
                    border-bottom-width: 2px;
                }

                /* Category color theming */
                .ti-key[data-cat="trig"] {
                    background: #1a2030;
                    border-color: #2a3550;
                    color: #8ab4f8;
                }
                .ti-key[data-cat="trig"]:hover {
                    background: #253050;
                    border-color: #8ab4f8;
                }

                .ti-key[data-cat="hyperbolic"] {
                    background: #1a2030;
                    border-color: #2a3550;
                    color: #8ab4f8;
                }
                .ti-key[data-cat="hyperbolic"]:hover {
                    background: #253050;
                    border-color: #8ab4f8;
                }

                .ti-key[data-cat="logarithms"] {
                    background: #1a2a2a;
                    border-color: #2a4545;
                    color: #6dd5c4;
                }
                .ti-key[data-cat="logarithms"]:hover {
                    background: #254040;
                    border-color: #6dd5c4;
                }

                .ti-key[data-cat="powers"] {
                    background: #1a2a2a;
                    border-color: #2a4545;
                    color: #6dd5c4;
                }
                .ti-key[data-cat="powers"]:hover {
                    background: #254040;
                    border-color: #6dd5c4;
                }

                .ti-key[data-cat="statistics"] {
                    background: #201a2a;
                    border-color: #352a50;
                    color: #b4a0f8;
                }
                .ti-key[data-cat="statistics"]:hover {
                    background: #302545;
                    border-color: #b4a0f8;
                }

                .ti-key[data-cat="special"] {
                    background: #201a2a;
                    border-color: #352a50;
                    color: #b4a0f8;
                }
                .ti-key[data-cat="special"]:hover {
                    background: #302545;
                    border-color: #b4a0f8;
                }

                .ti-key[data-cat="combinatorics"] {
                    background: #1f1f1a;
                    border-color: #3a3a28;
                    color: #c8c080;
                }
                .ti-key[data-cat="combinatorics"]:hover {
                    background: #2d2d22;
                    border-color: #c8c080;
                }

                .ti-key[data-cat="number-theory"] {
                    background: #1f1f1a;
                    border-color: #3a3a28;
                    color: #c8c080;
                }
                .ti-key[data-cat="number-theory"]:hover {
                    background: #2d2d22;
                    border-color: #c8c080;
                }

                .ti-key[data-cat="constants"] {
                    background: #2a1f0a;
                    border-color: #503a15;
                    color: #f0c060;
                }
                .ti-key[data-cat="constants"]:hover {
                    background: #3a2a10;
                    border-color: #f0c060;
                }

                .ti-key.selected {
                    box-shadow: 0 0 0 2px #00ff88;
                }

                .ti-loading {
                    text-align: center;
                    color: #666;
                    padding: 2rem;
                    font-size: 0.875rem;
                }

                @media (max-width: 480px) {
                    .ti-calc-shell { padding: 0.75rem 0.5rem; }
                    .ti-buttons { grid-template-columns: repeat(3, 1fr); gap: 0.25rem; }
                    .ti-key { font-size: 0.75rem; padding: 0.5rem 0.125rem; min-height: 40px; }
                    .ti-result { font-size: 1.25rem; }
                }
            </style>

            <!-- Smart Contracts Section -->
            <div class="calculator-contracts-section">
                <h2 class="section-title">Smart Contracts</h2>
                <div id="calculator-contract-info"></div>
            </div>

            <style>
                .calculator-contracts-section {
                    max-width: 1200px;
                    margin: 3rem auto 2rem;
                    padding: 0 1rem;
                }

                .calculator-contracts-section .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: #fff;
                    text-align: center;
                }

                #calculator-contract-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                @media (max-width: 480px) {
                    #calculator-contract-info {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    async loadContracts() {
        for (const calc of CALCULATOR_REGISTRY) {
            try {
                const metadata = getContractMetadata(calc.id);
                const contract = await loadContract(metadata.abiFile, metadata.contractAddress, this.web3Provider);
                if (contract) {
                    this.contracts[calc.id] = contract;
                }
            } catch (err) {
                console.warn(`[${calc.id}] Failed to load contract:`, err.message);
            }
        }
    }

    /**
     * Render contract info section with links to contracts
     */
    renderContractInfo() {
        const container = document.getElementById('calculator-contract-info');
        if (!container) return;

        container.innerHTML = '';

        // Get all calculator contracts from registry
        const calculatorContracts = getContractsByType('calculator');

        // Render each contract
        calculatorContracts.forEach(contractKey => {
            const metadata = getContractMetadata(contractKey);
            
            const contractCard = document.createElement('div');
            contractCard.className = 'contract-info-card';
            contractCard.innerHTML = `
                <div class="contract-card-header">
                    <h4>${metadata.emoji} ${metadata.name}</h4>
                    <p class="contract-card-description">${metadata.description}</p>
                </div>
            `;
            
            const contractInfo = ContractInfoRenderer.createContractInfo(
                metadata.contractAddress,
                metadata.sourceFile,
                metadata.abiFile
            );
            contractInfo.style.marginTop = '1rem';
            contractCard.appendChild(contractInfo);
            container.appendChild(contractCard);
        });
    }

    buildButtons() {
        const container = document.getElementById('calc-buttons');
        let html = '';

        for (const id of BUTTON_LAYOUT) {
            const c = getCalculatorById(id);
            if (!c) continue;

            html += `
                <button
                    class="ti-key"
                    data-id="${c.id}"
                    data-cat="${c.category}"
                    title="${c.name}">
                    ${c.btnLabel}
                </button>
            `;
        }

        container.innerHTML = html;
    }

    setupListeners() {
        document.querySelectorAll('.ti-key').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ti-key.selected').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.handleFunctionClick(btn.dataset.id);
            });
        });

        const input = document.getElementById('calc-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.lastCalcId) {
                    this.calculate(this.lastCalcId);
                }
            });
        }

        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const result = document.getElementById('ti-result').textContent;
                if (result && result !== '0') {
                    navigator.clipboard.writeText(result);
                    this.showStatus('Copied', 'success');
                }
            });
        }
    }

    handleFunctionClick(calcId) {
        const calc = getCalculatorById(calcId);
        if (!calc) return;

        this.lastCalcId = calcId;

        if (calc.additionalInputs && calc.additionalInputs.length > 0) {
            this.showExtraInputs(calc);
        } else {
            this.clearExtraInputs();
        }

        if (calc.calculate && calc.calculate.noInput) {
            this.calculate(calcId);
            return;
        }

        const input = document.getElementById('calc-input');
        if (input) {
            input.focus();
            if (input.value.trim()) {
                this.calculate(calcId);
            }
        }
    }

    showExtraInputs(calc) {
        const container = document.getElementById('ti-extra-inputs');
        container.innerHTML = calc.additionalInputs.map(inp => `
            <div class="ti-extra-input-group">
                <span class="ti-extra-label">${inp.label}:</span>
                <input type="text"
                    class="ti-extra-field"
                    data-name="${inp.name}"
                    placeholder="${inp.placeholder || '0'}"
                    autocomplete="off"
                    inputmode="decimal">
            </div>
        `).join('');

        container.querySelectorAll('.ti-extra-field').forEach(field => {
            field.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.lastCalcId) {
                    this.calculate(this.lastCalcId);
                }
            });
        });
    }

    clearExtraInputs() {
        const container = document.getElementById('ti-extra-inputs');
        if (container) container.innerHTML = '';
    }

    async calculate(calcId) {
        const inputEl = document.getElementById('calc-input');
        const calc = getCalculatorById(calcId);
        const exprEl = document.getElementById('ti-expr');
        const resultEl = document.getElementById('ti-result');

        if (!calc) return;

        const isNoInput = calc.calculate && calc.calculate.noInput;

        if (!isNoInput && (!inputEl || !inputEl.value.trim())) {
            this.showStatus('Enter a value', 'error');
            return;
        }

        const contract = this.contracts[calcId];
        if (!contract) {
            this.showStatus(`No contract: ${calcId}`, 'error');
            return;
        }

        try {
            this.showStatus('On-chain...', 'loading');
            resultEl.textContent = '...';

            const value = isNoInput ? 0 : parseFloat(inputEl.value.trim());
            let result;
            let exprText = '';

            if (isNoInput) {
                exprText = calc.btnLabel;
                result = await contract.get_constant();
                const display = (Number(result) / 1e10).toFixed(10);
                resultEl.textContent = display;
            } else if (calcId === 'factorial' || calcId === 'ln-factorial') {
                const n = Math.floor(value);
                exprText = calcId === 'factorial' ? `${n}!` : `ln(${n}!)`;
                result = await contract.calculate(n);
                if (calcId === 'factorial') {
                    resultEl.textContent = result.toString();
                } else {
                    resultEl.textContent = (Number(result) / 1e10).toFixed(10);
                }
            } else if (calcId === 'norm-cdf') {
                exprText = `Φ(${value})`;
                const scaled = Math.floor(value * 1e10);
                result = await contract.standard_cdf(scaled);
                resultEl.textContent = (Number(result) / 1e10).toFixed(10);
            } else if (calcId === 'norm-pdf') {
                exprText = `φ(${value})`;
                const scaled = Math.floor(value * 1e10);
                result = await contract.calculate(scaled);
                resultEl.textContent = (Number(result) / 1e10).toFixed(10);
            } else if (calcId === 'zscore') {
                const extras = this.getExtraInputValues();
                const mu = parseFloat(extras.mu || '0');
                const sigma = parseFloat(extras.sigma || '1');
                exprText = `z(${value}, μ=${mu}, σ=${sigma})`;
                const scaledT = Math.floor(value * 1e10);
                const scaledMu = Math.floor(mu * 1e10);
                const scaledSigma = Math.floor(sigma * 1e10);
                result = await contract.calculate(scaledT, scaledMu, scaledSigma);
                resultEl.textContent = (Number(result) / 1e10).toFixed(10);
            } else if (calcId === 'gcd') {
                const extras = this.getExtraInputValues();
                const b = parseInt(extras.b || '0');
                const a = Math.floor(value);
                exprText = `gcd(${a},${b})`;
                result = await contract.calculate(a, b);
                resultEl.textContent = result.toString();
            } else {
                exprText = `${calc.btnLabel}(${value})`;
                const scaled = Math.floor(value * 1e10);
                result = await contract.calculate(scaled);
                resultEl.textContent = (Number(result) / 1e10).toFixed(10);
            }

            exprEl.textContent = exprText;
            this.showStatus('', 'success');
        } catch (error) {
            console.error('Calculation error:', error);
            const { reason, rangeHint } = this.parseError(error, calc);
            resultEl.textContent = `ERR: ${reason}`;
            this.showStatus(rangeHint || reason, 'error');
        }
    }

    getExtraInputValues() {
        const values = {};
        document.querySelectorAll('.ti-extra-field').forEach(field => {
            values[field.dataset.name] = field.value.trim();
        });
        return values;
    }

    parseError(error, calc) {
        let reason = 'Calculation failed';

        if (error.reason) {
            reason = error.reason;
        } else if (error.errorArgs && error.errorArgs[0]) {
            reason = error.errorArgs[0];
        } else if (error.message && error.message.includes('reason string')) {
            const match = error.message.match(/reason string "([^"]+)"/);
            if (match) reason = match[1];
        }

        reason = reason.replace(/^Error:\s*/i, '').trim();

        let rangeHint = '';
        if (calc) {
            if (calc.input && calc.input.hint) {
                rangeHint = calc.input.hint;
            } else if (calc.calculate) {
                const { min, max } = calc.calculate;
                if (min !== null && min !== undefined && max !== null && max !== undefined) {
                    rangeHint = `Range: [${min}, ${max}${max === Infinity ? ')' : ']'}`;
                } else if (min !== null && min !== undefined) {
                    rangeHint = `Min: ${min}`;
                } else if (max !== null && max !== undefined) {
                    rangeHint = `Max: ${max}`;
                }
            }
        }

        return { reason, rangeHint };
    }

    showStatus(msg, type) {
        const status = document.getElementById('status-msg');
        if (!status) return;

        status.textContent = msg;
        status.className = `ti-status ${type}`;

        if (type === 'success' && msg) {
            setTimeout(() => { status.textContent = ''; }, 1500);
        }
    }
}
