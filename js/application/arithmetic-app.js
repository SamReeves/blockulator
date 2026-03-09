/**
 * Arithmetic App - FixedPoint128 Calculator
 * Two-operand calculator (A op B) using the Huff-based 128.128 fixed-point arithmetic
 */

import { ContractLoader } from '../infrastructure/blockchain/contract-loader.js';
import { ContractInfoRenderer } from '../presentation/renderers/contract-info-renderer.js';
import { getContractMetadata } from '../infrastructure/config/contract-registry.js';

export class ArithmeticApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.contract = null;
        this.selectedOp = 'add';
        this.isTranscendental = false;

        console.log('ArithmeticApp created');
    }

    async init() {
        console.log('Initializing Arithmetic app...');

        this.renderHTML();
        await this.loadContract();
        this.setupListeners();
        this.renderContractInfo();

        console.log('Arithmetic app initialized');
    }

    renderHTML() {
        const container = document.getElementById('fp128-container');
        container.innerHTML = `
            <div class="ti-calc-shell">
                <!-- Header -->
                <div class="arithmetic-header">
                    <h2 class="arithmetic-title">FP128</h2>
                    <p class="arithmetic-subtitle">Huff Assembly • 128.128 Fixed-Point • 22 Operations</p>
                </div>

                <!-- LCD Screen -->
                <div class="ti-lcd">
                    <div class="ti-lcd-inner">
                        <div id="arith-expr" class="ti-expr">A + B</div>
                        <div id="arith-result" class="ti-result">0</div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="ti-input-area">
                    <div class="arithmetic-input-row">
                        <span class="arithmetic-label" id="label-a">A:</span>
                        <input type="text" id="input-a" class="ti-input" placeholder="0" autocomplete="off" inputmode="decimal">
                    </div>
                    <div class="arithmetic-input-row" id="input-b-row">
                        <span class="arithmetic-label">B:</span>
                        <input type="text" id="input-b" class="ti-input" placeholder="0" autocomplete="off" inputmode="decimal">
                    </div>
                    <div class="arithmetic-input-row" id="input-c-row" style="display: none;">
                        <span class="arithmetic-label">C:</span>
                        <input type="text" id="input-c" class="ti-input" placeholder="0" autocomplete="off" inputmode="decimal">
                    </div>
                    <div id="arith-status" class="ti-status"></div>
                </div>

                <!-- Keypad -->
                <div class="ti-keypad">
                    <div class="ti-toolbar">
                        <button id="arith-clear" class="ti-tool-btn">CLR</button>
                        <button id="arith-copy" class="ti-tool-btn">COPY</button>
                    </div>
                    <div class="arithmetic-operators">
                        <button class="ti-key selected" data-op="add" data-cat="arithmetic" title="Addition">+</button>
                        <button class="ti-key" data-op="sub" data-cat="arithmetic" title="Subtraction">−</button>
                        <button class="ti-key" data-op="mul" data-cat="arithmetic" title="Multiplication">×</button>
                        <button class="ti-key" data-op="div" data-cat="arithmetic" title="Division">÷</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="exp" data-cat="unary" title="Exponential">exp</button>
                        <button class="ti-key" data-op="exp2" data-cat="unary" title="Base-2 Exponential">exp2</button>
                        <button class="ti-key" data-op="ln" data-cat="unary" title="Natural Logarithm">ln</button>
                        <button class="ti-key" data-op="log2" data-cat="unary" title="Base-2 Logarithm">log2</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="log10" data-cat="unary" title="Base-10 Logarithm">log10</button>
                        <button class="ti-key" data-op="exp10" data-cat="unary" title="Base-10 Exponential">exp10</button>
                        <button class="ti-key" data-op="sqrt" data-cat="unary" title="Square Root">√</button>
                        <button class="ti-key" data-op="pow" data-cat="binary" title="Power (x^y)">x^y</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="abs" data-cat="unary" title="Absolute Value">abs</button>
                        <button class="ti-key" data-op="neg" data-cat="unary" title="Negate">neg</button>
                        <button class="ti-key" data-op="inv" data-cat="unary" title="Inverse (1/x)">inv</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="min" data-cat="binary" title="Minimum">min</button>
                        <button class="ti-key" data-op="max" data-cat="binary" title="Maximum">max</button>
                        <button class="ti-key" data-op="clamp" data-cat="ternary" title="Clamp (x, min, max)">clamp</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="avg" data-cat="binary" title="Average">avg</button>
                        <button class="ti-key" data-op="gavg" data-cat="binary" title="Geometric Mean">gavg</button>
                        <button class="ti-key" data-op="dist" data-cat="binary" title="Distance |a-b|">dist</button>
                        <button class="ti-key" data-op="zeroFloorSub" data-cat="binary" title="Zero-Floor Subtraction">zfs</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="sign" data-cat="unary" title="Sign (-1, 0, or +1)">sign</button>
                        <button class="ti-key" data-op="floor" data-cat="unary" title="Floor">floor</button>
                        <button class="ti-key" data-op="ceil" data-cat="unary" title="Ceiling">ceil</button>
                        <button class="ti-key" data-op="frac" data-cat="unary" title="Fractional Part">frac</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="cbrt" data-cat="unary" title="Cube Root">cbrt</button>
                        <button class="ti-key" data-op="lerp" data-cat="ternary" title="Linear Interpolation">lerp</button>
                        <button class="ti-key" data-op="hypot" data-cat="binary" title="Hypotenuse">hypot</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="round" data-cat="unary" title="Round to Nearest Integer">round</button>
                        <button class="ti-key" data-op="log2Up" data-cat="unary" title="Ceiling of Log2">log2Up</button>
                        <button class="ti-key" data-op="gcd" data-cat="binary" title="Greatest Common Divisor">gcd</button>
                    </div>
                    <div class="arithmetic-operators" style="margin-top: 0.5rem;">
                        <button class="ti-key" data-op="factorial" data-cat="unary" title="Factorial">n!</button>
                        <button class="ti-key" data-op="lambertW0" data-cat="unary" title="Lambert W0 Function">W₀(x)</button>
                    </div>
                    <button id="arith-calculate" class="ti-calculate-btn">CALCULATE</button>
                </div>

                <!-- Technical Info Section -->
                <div class="arithmetic-info">
                    <h3>Technical Specifications</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Format:</span>
                            <span class="info-value">Signed 128.128 Fixed-Point</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Precision:</span>
                            <span class="info-value">~38 decimal digits</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Range:</span>
                            <span class="info-value">±1.7e38</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Language:</span>
                            <span class="info-value">Pure Huff Assembly</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Operations:</span>
                            <span class="info-value">34 functions: arithmetic, transcendental, utility, comparison, rounding, special</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Internal:</span>
                            <span class="info-value">int256 / 2^128 (signed)</span>
                        </div>
                    </div>
                </div>

                <!-- Contract Info -->
                <div id="arithmetic-contract-info"></div>
            </div>

            <style>
                .ti-calc-shell {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 1.5rem 1rem;
                    font-family: 'Courier New', 'Consolas', monospace;
                }

                .arithmetic-header {
                    text-align: center;
                    margin-bottom: 1rem;
                }

                .arithmetic-title {
                    color: #00ff88;
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                    font-weight: 700;
                }

                .arithmetic-subtitle {
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

                /* ── Input Area ── */
                .ti-input-area {
                    margin-bottom: 0.75rem;
                }

                .arithmetic-input-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .arithmetic-label {
                    color: #888;
                    font-size: 0.875rem;
                    font-weight: 600;
                    min-width: 1.5rem;
                }

                .ti-input {
                    flex: 1;
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

                .ti-status {
                    font-size: 0.75rem;
                    min-height: 1rem;
                    margin-top: 0.375rem;
                    text-align: right;
                }
                .ti-status.loading { color: #ffa500; }
                .ti-status.success { color: #00ff88; }
                .ti-status.error { color: #ff4444; }

                /* ── Keypad ── */
                .ti-keypad {
                    margin-bottom: 1.5rem;
                }

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
                }

                .ti-tool-btn:active {
                    top: 2px;
                    border-bottom-width: 2px;
                }

                .ti-tool-btn:hover {
                    border-color: #00ff88;
                    color: #00ff88;
                }

                .arithmetic-operators {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.375rem;
                    margin-bottom: 0.5rem;
                }

                .ti-key {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.75rem 0.25rem;
                    min-height: 56px;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.1s;
                    font-family: 'Courier New', monospace;
                    font-weight: 700;
                    font-size: 1.25rem;
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

                .ti-key[data-cat="arithmetic"] {
                    background: #1a2a20;
                    border-color: #2a4535;
                    color: #6dd5c4;
                }

                .ti-key[data-cat="arithmetic"]:hover {
                    background: #254035;
                    border-color: #6dd5c4;
                }

                .ti-key[data-cat="transcendental"] {
                    background: #1a2030;
                    border-color: #354560;
                    color: #6db4d5;
                    font-size: 0.875rem;
                }

                .ti-key[data-cat="transcendental"]:hover {
                    background: #253550;
                    border-color: #6db4d5;
                }

                .ti-key[data-cat="power"] {
                    background: #301a30;
                    border-color: #603560;
                    color: #d56db4;
                    font-size: 0.875rem;
                }

                .ti-key[data-cat="power"]:hover {
                    background: #502550;
                    border-color: #d56db4;
                }

                .arithmetic-input-row.hidden {
                    display: none;
                }

                .ti-key.selected {
                    box-shadow: 0 0 0 2px #00ff88;
                }

                .ti-calculate-btn {
                    width: 100%;
                    position: relative;
                    padding: 1rem;
                    background: #1a3020;
                    border: 2px solid #2a5030;
                    border-bottom-width: 4px;
                    border-radius: 0.375rem;
                    color: #00ff88;
                    font-family: 'Courier New', monospace;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.1s;
                    letter-spacing: 2px;
                }

                .ti-calculate-btn:active {
                    top: 2px;
                    border-bottom-width: 2px;
                }

                .ti-calculate-btn:hover {
                    background: #255030;
                    border-color: #00ff88;
                    box-shadow: 0 0 12px rgba(0,255,136,0.4);
                }

                /* ── Technical Info ── */
                .arithmetic-info {
                    background: #1a1a1a;
                    border: 2px solid #333;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .arithmetic-info h3 {
                    color: #00ff88;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    letter-spacing: 1px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem;
                    background: #0d0d0d;
                    border: 1px solid #2a2a2a;
                    border-radius: 0.25rem;
                }

                .info-label {
                    color: #888;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .info-value {
                    color: #6dd5c4;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-align: right;
                }

                #arithmetic-contract-info {
                    margin-top: 2rem;
                }

                @media (max-width: 480px) {
                    .ti-calc-shell {
                        padding: 0.75rem 0.5rem;
                    }

                    .arithmetic-operators {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 0.25rem;
                    }

                    .ti-key {
                        font-size: 1rem;
                        padding: 0.625rem 0.125rem;
                        min-height: 48px;
                    }

                    .ti-result {
                        font-size: 1.25rem;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    async loadContract() {
        this.contract = await ContractLoader.load('fixedpoint128', this.web3Provider);
        if (!this.contract) {
            console.error('Failed to load FixedPoint128 contract');
        }
    }

    renderContractInfo() {
        const container = document.getElementById('arithmetic-contract-info');
        if (!container) return;

        const metadata = getContractMetadata('fixedpoint128');
        if (!metadata) return;

        const contractCard = document.createElement('div');
        contractCard.style.background = '#1a1a1a';
        contractCard.style.border = '2px solid #333';
        contractCard.style.borderRadius = '0.5rem';
        contractCard.style.padding = '1.5rem';
        
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="color: #00ff88; margin-bottom: 0.5rem; font-size: 1rem; letter-spacing: 1px;">
                ${metadata.emoji} ${metadata.name}
            </h3>
            <p style="color: #888; margin-bottom: 1rem; font-size: 0.875rem;">
                ${metadata.description}
            </p>
        `;
        contractCard.appendChild(header);
        
        const contractInfo = ContractInfoRenderer.createContractInfo(
            metadata.contractAddress,
            metadata.sourceFile,
            metadata.abiFile
        );
        contractCard.appendChild(contractInfo);
        
        container.appendChild(contractCard);
    }

    setupListeners() {
        // Operator selection
        document.querySelectorAll('.ti-key[data-op]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ti-key[data-op]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedOp = btn.dataset.op;
                const cat = btn.dataset.cat;
                
                // Show/hide inputs based on operation type
                const inputBRow = document.getElementById('input-b-row');
                const inputCRow = document.getElementById('input-c-row');
                const labelA = document.getElementById('label-a');
                
                if (cat === 'unary') {
                    inputBRow.style.display = 'none';
                    inputCRow.style.display = 'none';
                    labelA.textContent = 'x:';
                } else if (cat === 'binary') {
                    inputBRow.style.display = 'flex';
                    inputCRow.style.display = 'none';
                    if (this.selectedOp === 'pow') {
                        labelA.textContent = 'x:';
                        document.querySelector('#input-b-row .arithmetic-label').textContent = 'y:';
                    } else {
                        labelA.textContent = 'A:';
                        document.querySelector('#input-b-row .arithmetic-label').textContent = 'B:';
                    }
                } else if (cat === 'ternary') {
                    inputBRow.style.display = 'flex';
                    inputCRow.style.display = 'flex';
                    if (this.selectedOp === 'lerp') {
                        labelA.textContent = 'a:';
                        document.querySelector('#input-b-row .arithmetic-label').textContent = 'b:';
                        document.querySelector('#input-c-row .arithmetic-label').textContent = 't:';
                    } else {
                        labelA.textContent = 'x:';
                        document.querySelector('#input-b-row .arithmetic-label').textContent = 'min:';
                        document.querySelector('#input-c-row .arithmetic-label').textContent = 'max:';
                    }
                } else {
                    // arithmetic
                    inputBRow.style.display = 'flex';
                    inputCRow.style.display = 'none';
                    labelA.textContent = 'A:';
                    document.querySelector('#input-b-row .arithmetic-label').textContent = 'B:';
                }
                
                this.updateExpression();
            });
        });

        // Calculate button
        document.getElementById('arith-calculate').addEventListener('click', () => {
            this.calculate();
        });

        // Clear button
        document.getElementById('arith-clear').addEventListener('click', () => {
            this.clear();
        });

        // Copy button
        document.getElementById('arith-copy').addEventListener('click', () => {
            this.copyResult();
        });

        // Enter key on inputs
        document.getElementById('input-a').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculate();
        });
        document.getElementById('input-b').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculate();
        });
        document.getElementById('input-c').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculate();
        });

        // Update expression as user types
        document.getElementById('input-a').addEventListener('input', () => {
            this.updateExpression();
        });
        document.getElementById('input-b').addEventListener('input', () => {
            this.updateExpression();
        });
        document.getElementById('input-c').addEventListener('input', () => {
            this.updateExpression();
        });
    }

    updateExpression() {
        const a = document.getElementById('input-a').value.trim() || '0';
        const b = document.getElementById('input-b').value.trim() || '0';
        const c = document.getElementById('input-c').value.trim() || '0';
        
        const cat = document.querySelector('.ti-key[data-op].selected')?.dataset.cat;
        
        if (cat === 'unary') {
            const opNames = { 
                exp: 'exp', exp2: '2^', exp10: '10^',
                ln: 'ln', log2: 'log2', log10: 'log10',
                sqrt: '√', abs: 'abs', neg: 'neg', inv: 'inv',
                sign: 'sign', floor: 'floor', ceil: 'ceil', frac: 'frac',
                cbrt: 'cbrt', round: 'round', log2Up: 'log2Up',
                factorial: 'factorial', lambertW0: 'W₀'
            };
            const name = opNames[this.selectedOp] || 'f';
            if (this.selectedOp === 'exp2') {
                document.getElementById('arith-expr').textContent = `2^(${a})`;
            } else if (this.selectedOp === 'exp10') {
                document.getElementById('arith-expr').textContent = `10^(${a})`;
            } else {
                document.getElementById('arith-expr').textContent = `${name}(${a})`;
            }
        } else if (cat === 'ternary') {
            if (this.selectedOp === 'lerp') {
                document.getElementById('arith-expr').textContent = `lerp(${a}, ${b}, ${c})`;
            } else {
                document.getElementById('arith-expr').textContent = `clamp(${a}, ${b}, ${c})`;
            }
        } else if (cat === 'binary') {
            const opNames = { 
                pow: '^', min: 'min', max: 'max', avg: 'avg', 
                gavg: 'gavg', dist: 'dist', zeroFloorSub: 'zfs',
                gcd: 'gcd', hypot: 'hypot', lerp: 'lerp'
            };
            const name = opNames[this.selectedOp] || this.selectedOp;
            if (this.selectedOp === 'pow') {
                document.getElementById('arith-expr').textContent = `${a} ^ ${b}`;
            } else {
                document.getElementById('arith-expr').textContent = `${name}(${a}, ${b})`;
            }
        } else {
            // arithmetic
            const opSymbols = { add: '+', sub: '−', mul: '×', div: '÷' };
            const symbol = opSymbols[this.selectedOp] || '+';
            document.getElementById('arith-expr').textContent = `${a} ${symbol} ${b}`;
        }
    }

    async calculate() {
        const inputA = document.getElementById('input-a');
        const inputB = document.getElementById('input-b');
        const resultEl = document.getElementById('arith-result');
        
        const aValue = inputA.value.trim();

        if (!aValue) {
            this.showStatus('Please enter a value', 'error');
            return;
        }

        if (!this.contract) {
            this.showStatus('Contract not loaded', 'error');
            return;
        }

        try {
            const a = parseFloat(aValue);

            if (isNaN(a)) {
                this.showStatus('Invalid number format', 'error');
                return;
            }

            const cat = document.querySelector('.ti-key[data-op].selected')?.dataset.cat;

            // Unary operations
            if (cat === 'unary') {
                this.showStatus('Calculating on-chain...', 'loading');
                resultEl.textContent = '...';

                const scaledA = BigInt(Math.floor(a * 1e18));

                let result;
                switch (this.selectedOp) {
                    case 'exp':
                        result = await this.contract.exp(scaledA);
                        break;
                    case 'exp2':
                        result = await this.contract.exp2(scaledA);
                        break;
                    case 'exp10':
                        result = await this.contract.exp10(scaledA);
                        break;
                    case 'ln':
                        if (a <= 0) {
                            this.showStatus('ln requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.ln(scaledA);
                        break;
                    case 'log2':
                        if (a <= 0) {
                            this.showStatus('log2 requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.log2(scaledA);
                        break;
                    case 'log10':
                        if (a <= 0) {
                            this.showStatus('log10 requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.log10(scaledA);
                        break;
                    case 'sqrt':
                        if (a < 0) {
                            this.showStatus('sqrt requires non-negative input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.sqrt(scaledA);
                        break;
                    case 'abs':
                        result = await this.contract.abs(scaledA);
                        break;
                    case 'neg':
                        result = await this.contract.neg(scaledA);
                        break;
                    case 'inv':
                        if (a === 0) {
                            this.showStatus('inv: division by zero', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.inv(scaledA);
                        break;
                    case 'sign':
                        result = await this.contract.sign(scaledA);
                        break;
                    case 'floor':
                        result = await this.contract.floor(scaledA);
                        break;
                    case 'ceil':
                        result = await this.contract.ceil(scaledA);
                        break;
                    case 'frac':
                        result = await this.contract.frac(scaledA);
                        break;
                    case 'cbrt':
                        result = await this.contract.cbrt(scaledA);
                        break;
                    case 'round':
                        result = await this.contract.round(scaledA);
                        break;
                    case 'log2Up':
                        if (a <= 0) {
                            this.showStatus('log2Up requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.log2Up(scaledA);
                        break;
                    case 'factorial':
                        if (a < 0 || a > 33) {
                            this.showStatus('Factorial requires 0 <= n <= 33', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.factorial(scaledA);
                        break;
                    case 'lambertW0':
                        if (a < -0.3679) {
                            this.showStatus('Lambert W0 requires x >= -1/e', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.lambertW0(scaledA);
                        break;
                    default:
                        this.showStatus('Unknown operation', 'error');
                        return;
                }

                const resultBigInt = BigInt(result.toString());
                const isNegative = resultBigInt > (BigInt(2) ** BigInt(255));
                const absValue = isNegative ? (BigInt(2) ** BigInt(256)) - resultBigInt : resultBigInt;
                const resultNumber = Number(absValue) / 1e18;
                const displayResult = (isNegative ? -resultNumber : resultNumber).toFixed(18);

                resultEl.textContent = displayResult;
                this.showStatus('Calculated successfully', 'success');

            } else if (cat === 'ternary') {
                const inputC = document.getElementById('input-c');
                const bValue = inputB.value.trim();
                const cValue = inputC.value.trim();
                
                if (!bValue || !cValue) {
                    this.showStatus('Please enter all three values', 'error');
                    return;
                }

                const b = parseFloat(bValue);
                const c = parseFloat(cValue);
                if (isNaN(b) || isNaN(c)) {
                    this.showStatus('Invalid number format', 'error');
                    return;
                }

                this.showStatus('Calculating on-chain...', 'loading');
                resultEl.textContent = '...';

                const scaledA = BigInt(Math.floor(a * 1e18));
                const scaledB = BigInt(Math.floor(b * 1e18));
                const scaledC = BigInt(Math.floor(c * 1e18));

                let result;
                if (this.selectedOp === 'lerp') {
                    result = await this.contract.lerp(scaledA, scaledB, scaledC);
                } else {
                    result = await this.contract.clamp(scaledA, scaledB, scaledC);
                }

                const resultBigInt = BigInt(result.toString());
                const isNegative = resultBigInt > (BigInt(2) ** BigInt(255));
                const absValue = isNegative ? (BigInt(2) ** BigInt(256)) - resultBigInt : resultBigInt;
                const resultNumber = Number(absValue) / 1e18;
                const displayResult = (isNegative ? -resultNumber : resultNumber).toFixed(18);

                resultEl.textContent = displayResult;
                this.showStatus('Calculated successfully', 'success');

            } else {
                // Binary operations (arithmetic + new binary ops)
                const bValue = inputB.value.trim();
                if (!bValue) {
                    this.showStatus('Please enter both values', 'error');
                    return;
                }

                const b = parseFloat(bValue);
                if (isNaN(b)) {
                    this.showStatus('Invalid number format', 'error');
                    return;
                }

                this.showStatus('Calculating on-chain...', 'loading');
                resultEl.textContent = '...';

                const scaledA = BigInt(Math.floor(a * 1e18));
                const scaledB = BigInt(Math.floor(b * 1e18));

                let result;
                switch (this.selectedOp) {
                    case 'add':
                        result = await this.contract.add(scaledA, scaledB);
                        break;
                    case 'sub':
                        result = await this.contract.sub(scaledA, scaledB);
                        break;
                    case 'mul':
                        result = await this.contract.mul(scaledA, scaledB);
                        break;
                    case 'div':
                        if (b === 0) {
                            this.showStatus('Division by zero', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.div(scaledA, scaledB);
                        break;
                    case 'pow':
                        if (a < 0) {
                            this.showStatus('pow requires non-negative base', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.pow(scaledA, scaledB);
                        break;
                    case 'min':
                        result = await this.contract.min(scaledA, scaledB);
                        break;
                    case 'max':
                        result = await this.contract.max(scaledA, scaledB);
                        break;
                    case 'avg':
                        result = await this.contract.avg(scaledA, scaledB);
                        break;
                    case 'gavg':
                        if (a < 0 || b < 0) {
                            this.showStatus('gavg requires non-negative inputs', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.gavg(scaledA, scaledB);
                        break;
                    case 'dist':
                        result = await this.contract.dist(scaledA, scaledB);
                        break;
                    case 'zeroFloorSub':
                        result = await this.contract.zeroFloorSub(scaledA, scaledB);
                        break;
                    case 'hypot':
                        result = await this.contract.hypot(scaledA, scaledB);
                        break;
                    case 'gcd':
                        result = await this.contract.gcd(scaledA, scaledB);
                        break;
                    default:
                        this.showStatus('Unknown operation', 'error');
                        return;
                }

                const resultBigInt = BigInt(result.toString());
                const isNegative = resultBigInt > (BigInt(2) ** BigInt(255));
                const absValue = isNegative ? (BigInt(2) ** BigInt(256)) - resultBigInt : resultBigInt;
                const resultNumber = Number(absValue) / 1e18;
                const displayResult = (isNegative ? -resultNumber : resultNumber).toFixed(18);

                resultEl.textContent = displayResult;
                this.showStatus('Calculated successfully', 'success');
            }

        } catch (error) {
            console.error('Calculation error:', error);
            this.showStatus(`Error: ${error.message || 'Calculation failed'}`, 'error');
            resultEl.textContent = 'Error';
        }
    }

    clear() {
        document.getElementById('input-a').value = '';
        document.getElementById('input-b').value = '';
        document.getElementById('input-c').value = '';
        document.getElementById('arith-result').textContent = '0';
        this.showStatus('', '');
        this.updateExpression();
    }

    copyResult() {
        const result = document.getElementById('arith-result').textContent;
        if (result && result !== '0' && result !== 'Error') {
            navigator.clipboard.writeText(result);
            this.showStatus('Copied to clipboard', 'success');
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('arith-status');
        statusEl.textContent = message;
        statusEl.className = `ti-status ${type}`;
    }
}
