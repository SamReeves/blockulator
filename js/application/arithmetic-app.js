/**
 * Arithmetic App - FixedPoint127 Calculator
 * Two-operand calculator (A op B) using the Huff-based 127.128 fixed-point arithmetic
 */

import { loadContract } from '../infrastructure/blockchain/load-contract.js';
import { ContractInfoRenderer } from '../presentation/renderers/contract-info-renderer.js';
import { SourceViewer } from '../presentation/components/source-viewer.js';
import { getContractMetadata } from '../infrastructure/config/contract-registry.js';
import { decimalToFp127, fp127ToDecimal, isValidFp127Decimal, formatFp127Display } from '../infrastructure/math/fp127-math.js';

const OP_ARITY = {
    add: 'arithmetic', sub: 'arithmetic', mul: 'arithmetic', div: 'arithmetic',
    exp: 'unary', exp2: 'unary', exp10: 'unary', ln: 'unary', log2: 'unary', log10: 'unary',
    sqrt: 'unary', cbrt: 'unary', abs: 'unary', neg: 'unary', inv: 'unary',
    sign: 'unary', floor: 'unary', ceil: 'unary', frac: 'unary', round: 'unary', log2Up: 'unary',
    factorial: 'unary', lambertW0: 'unary',
    pow: 'binary', min: 'binary', max: 'binary', avg: 'binary', gavg: 'binary',
    dist: 'binary', zeroFloorSub: 'binary', hypot: 'binary', gcd: 'binary',
    clamp: 'ternary', lerp: 'ternary'
};

const KNOWN_VALUES = {
    'exp_1': {
        value: '2.71828182845904523536028747135266249775724709369995957496696762772407663035354759457138217852516642742746639193200305992181741359662904357290033429526059563073813232862794349076323382988075319525101901',
        label: 'e (Euler\'s number)'
    },
    'sqrt_2': {
        value: '1.41421356237309504880168872420969807856967187537694807317667973799073247846210703885038753432764157273501384623091229702492483605585073721264412149709993583141322266592750559275579995050115278206057147',
        label: '√2'
    },
    'ln_2': {
        value: '0.69314718055994530941723212145817656807550013436025525412068000949339362196969471560586332699641868754200148102057068573368552023575813055703267075163507596193072757082837143519030703862389167347112335',
        label: 'ln(2)'
    },
    'lambertW0_1': {
        value: '0.56714329040978387299996866221035554975381578718651250406296283552215802394490717487293865296938284421303',
        label: 'Ω (omega constant)'
    }
};

export class ArithmeticApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.contract = null;
        this.selectedOp = 'add';
        this.isTranscendental = false;
        this.showRawHex = false;
        this.lastRawResult = null;
        this.executeOnChain = false;

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
        const container = document.getElementById('fp127-container');
        container.innerHTML = `
            <div class="ti-calc-shell ti-fp127-arithmetic">
                <!-- Header -->
                <div class="vyper-header">
                    <h2 class="vyper-title">FP127</h2>
                    <p class="vyper-subtitle">
                        127.128 Fixed-Point • Pure Huff Assembly • 34 Operations<br>
                        <a href="https://sepolia.etherscan.io/address/0x38999881d76a9EbA876022Bf48433840F1Aa41Eb" target="_blank" rel="noopener noreferrer" class="etherscan-link">
                            Live on Sepolia ↗
                        </a>
                    </p>
                </div>

                <!-- Preset Demos -->
                <div class="preset-demos">
                    <div class="preset-label">Try it:</div>
                    <button class="preset-btn" data-preset="exp_1">exp(1) = e</button>
                    <button class="preset-btn" data-preset="sqrt_2">√2</button>
                    <button class="preset-btn" data-preset="ln_2">ln(2)</button>
                    <button class="preset-btn" data-preset="pi_e">π × e</button>
                    <button class="preset-btn" data-preset="factorial_20">20!</button>
                    <button class="preset-btn" data-preset="w0_1">W₀(1)</button>
                </div>

                <!-- LCD Screen -->
                <div class="ti-lcd">
                    <div class="ti-lcd-inner">
                        <div id="arith-expr" class="ti-expr">A + B</div>
                        <div id="arith-result" class="ti-result">0</div>
                        <div id="arith-raw" class="ti-raw" style="display: none;"></div>
                        <div id="arith-gas" class="ti-gas"></div>
                        <div id="arith-precision" class="ti-precision"></div>
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
                        <button id="arith-hex" class="ti-tool-btn">HEX</button>
                    </div>
                    <div id="fp127-buttons" class="ti-buttons">
                        <button class="ti-key selected" data-op="add" data-cat="arithmetic" title="Addition">+</button>
                        <button class="ti-key" data-op="sub" data-cat="arithmetic" title="Subtraction">−</button>
                        <button class="ti-key" data-op="mul" data-cat="arithmetic" title="Multiplication">×</button>
                        <button class="ti-key" data-op="div" data-cat="arithmetic" title="Division">÷</button>
                        <button class="ti-key" data-op="pow" data-cat="powers" title="Power (x^y)">x^y</button>
                        <button class="ti-key" data-op="sqrt" data-cat="powers" title="Square Root">√</button>

                        <button class="ti-key" data-op="exp" data-cat="logarithms" title="Exponential">exp</button>
                        <button class="ti-key" data-op="exp2" data-cat="logarithms" title="Base-2 Exponential">exp2</button>
                        <button class="ti-key" data-op="exp10" data-cat="logarithms" title="Base-10 Exponential">exp10</button>
                        <button class="ti-key" data-op="ln" data-cat="logarithms" title="Natural Logarithm">ln</button>
                        <button class="ti-key" data-op="log2" data-cat="logarithms" title="Base-2 Logarithm">log2</button>
                        <button class="ti-key" data-op="log10" data-cat="logarithms" title="Base-10 Logarithm">log10</button>

                        <button class="ti-key" data-op="cbrt" data-cat="powers" title="Cube Root">cbrt</button>
                        <button class="ti-key" data-op="abs" data-cat="powers" title="Absolute Value">abs</button>
                        <button class="ti-key" data-op="neg" data-cat="powers" title="Negate">neg</button>
                        <button class="ti-key" data-op="inv" data-cat="powers" title="Inverse (1/x)">inv</button>
                        <button class="ti-key" data-op="hypot" data-cat="powers" title="Hypotenuse">hypot</button>
                        <button class="ti-key" data-op="dist" data-cat="powers" title="Distance |a-b|">dist</button>

                        <button class="ti-key" data-op="floor" data-cat="statistics" title="Floor">floor</button>
                        <button class="ti-key" data-op="ceil" data-cat="statistics" title="Ceiling">ceil</button>
                        <button class="ti-key" data-op="round" data-cat="statistics" title="Round">round</button>
                        <button class="ti-key" data-op="frac" data-cat="statistics" title="Fractional Part">frac</button>
                        <button class="ti-key" data-op="sign" data-cat="statistics" title="Sign (-1, 0, +1)">sign</button>
                        <button class="ti-key" data-op="log2Up" data-cat="statistics" title="Ceiling of Log2">log2↑</button>

                        <button class="ti-key" data-op="min" data-cat="combinatorics" title="Minimum">min</button>
                        <button class="ti-key" data-op="max" data-cat="combinatorics" title="Maximum">max</button>
                        <button class="ti-key" data-op="avg" data-cat="combinatorics" title="Average">avg</button>
                        <button class="ti-key" data-op="gavg" data-cat="combinatorics" title="Geometric Mean">gavg</button>
                        <button class="ti-key" data-op="clamp" data-cat="combinatorics" title="Clamp (x, min, max)">clamp</button>
                        <button class="ti-key" data-op="lerp" data-cat="combinatorics" title="Linear Interpolation">lerp</button>

                        <button class="ti-key" data-op="zeroFloorSub" data-cat="special" title="Zero-Floor Subtraction">zfs</button>
                        <button class="ti-key" data-op="gcd" data-cat="special" title="Greatest Common Divisor">gcd</button>
                        <button class="ti-key" data-op="factorial" data-cat="special" title="Factorial">n!</button>
                        <button class="ti-key" data-op="lambertW0" data-cat="special" title="Lambert W₀ Function">W₀(x)</button>
                    </div>
                    <button id="arith-calculate" class="ti-calculate-btn">CALCULATE</button>
                    <div class="ti-onchain-toggle">
                        <label class="ti-toggle-label">
                            <input type="checkbox" id="arith-onchain" />
                            <span class="ti-toggle-text">Execute On-Chain</span>
                            <span class="ti-toggle-hint">(costs gas)</span>
                        </label>
                    </div>
                </div>

                <!-- On-Chain Result Info -->
                <div id="arith-tx-info" class="ti-tx-info" style="display: none;">
                    <div class="ti-tx-row">
                        <span class="ti-tx-label">Tx Hash:</span>
                        <a id="arith-tx-hash" class="ti-tx-link" href="#" target="_blank" rel="noopener"></a>
                    </div>
                    <div class="ti-tx-row">
                        <span class="ti-tx-label">Gas Used:</span>
                        <span id="arith-tx-gas" class="ti-tx-value"></span>
                    </div>
                    <div class="ti-tx-row">
                        <span class="ti-tx-label">Cost:</span>
                        <span id="arith-tx-cost" class="ti-tx-value"></span>
                    </div>
                </div>

                <!-- Technical Info Section -->
                <div class="arithmetic-info">
                    <h3>Technical Specifications</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Format:</span>
                            <span class="info-value">Signed 127.128 Fixed-Point</span>
                        </div>
                    <div class="info-item">
                        <span class="info-label">Precision:</span>
                        <span class="info-value">38 decimal digits (128 bits)</span>
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
                            <span class="info-value">34 functions</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Internal:</span>
                            <span class="info-value">int256 / 2¹²⁸</span>
                        </div>
                    </div>
                </div>

                <!-- Contract Info -->
                <div id="arithmetic-contract-info"></div>
            </div>

        `;
    }

    async loadContract() {
        const metadata = getContractMetadata('fixedpoint127');
        this.contract = await loadContract(metadata.abiFile, metadata.contractAddress, this.web3Provider);
        if (!this.contract) {
            console.error('Failed to load FixedPoint127 contract');
        }
    }

    renderContractInfo() {
        const container = document.getElementById('arithmetic-contract-info');
        if (!container) return;

        const metadata = getContractMetadata('fixedpoint127');
        if (!metadata) return;

        const SOURCE_MODULES = [
            { file: 'contracts/archive/huff/src/fp127/fp127.huff', name: 'FP127 Contract', desc: 'Entry point — dispatcher, ABI interface, conversions' },
            { file: 'contracts/archive/huff/src/fp127/constants.huff', name: 'Constants', desc: '127.128 format constants: ONE, LN2, LOG2E, E, PI' },
            { file: 'contracts/archive/huff/src/fp127/primitives.huff', name: 'Primitives', desc: 'Safe comparisons, negation, and bit operations' },
            { file: 'contracts/archive/huff/src/fp127/arithmetic.huff', name: 'Arithmetic', desc: 'Core add, sub, mul, div for 127.128 fixed-point' },
            { file: 'contracts/archive/huff/src/fp127/exp.huff', name: 'Exponential', desc: '2^x and e^x via degree-22 minimax polynomial' },
            { file: 'contracts/archive/huff/src/fp127/ln.huff', name: 'Natural Log', desc: 'ln(x) = log2(x) * ln(2)' },
            { file: 'contracts/archive/huff/src/fp127/log2.huff', name: 'Log Base 2', desc: 'log2(x) via MSB extraction + Horner polynomial' },
            { file: 'contracts/archive/huff/src/fp127/sqrt.huff', name: 'Square Root', desc: 'Carmack CLZ initial guess + Newton-Raphson refinement' },
            { file: 'contracts/archive/huff/src/fp127/pow.huff', name: 'Power', desc: 'x^y = 2^(y * log2(x))' },
            { file: 'contracts/archive/huff/src/fp127/utils.huff', name: 'Utilities', desc: 'abs, min, max, avg, gavg, dist, clamp, sign, floor, ceil' },
            { file: 'contracts/archive/huff/src/fp127/transcendental_utils.huff', name: 'Transcendental Utils', desc: 'cbrt, hypot, lerp, log10, exp10, factorial' },
            { file: 'contracts/archive/huff/src/fp127/lambertw0.huff', name: 'Lambert W0', desc: 'Lambert W principal branch via Fritsch iteration' },
        ];

        container.innerHTML = `
            <div class="fp127-contracts-section source-section-lazy" style="opacity: 0;">
                <div class="fp127-contract-header">
                    <h2 class="section-title">Source Code</h2>
                    <p class="section-subtitle">Pure Huff Assembly • 12 Modules</p>
                </div>
                <div id="fp127-contract-info-row"></div>
                <div id="fp127-source-viewers"></div>
            </div>
        `;

        // Contract info row (address, Etherscan, ABI)
        const infoRow = document.getElementById('fp127-contract-info-row');
        const contractInfo = ContractInfoRenderer.createContractInfo(
            metadata.contractAddress,
            null,
            metadata.abiFile
        );
        infoRow.appendChild(contractInfo);

        // Source viewers - all collapsed by default, lazy loaded when section is visible
        const viewersContainer = document.getElementById('fp127-source-viewers');
        const section = container.querySelector('.fp127-contracts-section');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sources = SOURCE_MODULES.map(mod => ({
                        sourceUrl: mod.file,
                        title: `${mod.name} — ${mod.desc}`,
                        language: 'asm'
                    }));
                    
                    const group = SourceViewer.createGroup(sources);
                    viewersContainer.appendChild(group);
                    section.style.opacity = '1';
                    section.style.transition = 'opacity 0.3s ease';
                    observer.disconnect();
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(section);
    }

    setupListeners() {
        document.querySelectorAll('#fp127-buttons .ti-key[data-op]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#fp127-buttons .ti-key[data-op]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedOp = btn.dataset.op;
                const arity = OP_ARITY[this.selectedOp] || 'arithmetic';
                
                const inputBRow = document.getElementById('input-b-row');
                const inputCRow = document.getElementById('input-c-row');
                const labelA = document.getElementById('label-a');
                
                if (arity === 'unary') {
                    inputBRow.style.display = 'none';
                    inputCRow.style.display = 'none';
                    labelA.textContent = 'x:';
                } else if (arity === 'binary') {
                    inputBRow.style.display = 'flex';
                    inputCRow.style.display = 'none';
                    if (this.selectedOp === 'pow') {
                        labelA.textContent = 'x:';
                        document.querySelector('#input-b-row .arithmetic-label').textContent = 'y:';
                    } else {
                        labelA.textContent = 'A:';
                        document.querySelector('#input-b-row .arithmetic-label').textContent = 'B:';
                    }
                } else if (arity === 'ternary') {
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

        // HEX toggle button
        document.getElementById('arith-hex').addEventListener('click', () => {
            this.toggleHex();
        });

        // On-Chain toggle
        document.getElementById('arith-onchain').addEventListener('change', (e) => {
            this.executeOnChain = e.target.checked;
            // Hide tx info when toggling off
            if (!this.executeOnChain) {
                document.getElementById('arith-tx-info').style.display = 'none';
            }
        });

        // Preset demo buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.runPreset(preset);
            });
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
        
        const arity = OP_ARITY[this.selectedOp] || 'arithmetic';
        
        if (arity === 'unary') {
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
        } else if (arity === 'ternary') {
            if (this.selectedOp === 'lerp') {
                document.getElementById('arith-expr').textContent = `lerp(${a}, ${b}, ${c})`;
            } else {
                document.getElementById('arith-expr').textContent = `clamp(${a}, ${b}, ${c})`;
            }
        } else if (arity === 'binary') {
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
            // Validate input format (no parseFloat - preserve precision)
            if (!isValidFp127Decimal(aValue)) {
                this.showStatus('Invalid number format', 'error');
                return;
            }

            const arity = OP_ARITY[this.selectedOp] || 'arithmetic';

            if (arity === 'unary') {
                this.showStatus('Calculating on-chain...', 'loading');
                resultEl.textContent = '...';

                // Convert to native fp127 format (preserves all digits)
                const fp127A = decimalToFp127(aValue);

                // Domain validation using BigInt comparison
                const negativeOneOverE = decimalToFp127('-0.36787944117144232159552377016146');
                
                let result;
                switch (this.selectedOp) {
                    case 'exp':
                        result = await this.contract.expRaw(fp127A);
                        break;
                    case 'exp2':
                        result = await this.contract.exp2Raw(fp127A);
                        break;
                    case 'exp10':
                        result = await this.contract.exp10Raw(fp127A);
                        break;
                    case 'ln':
                        if (fp127A <= 0n) {
                            this.showStatus('ln requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.lnRaw(fp127A);
                        break;
                    case 'log2':
                        if (fp127A <= 0n) {
                            this.showStatus('log2 requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.log2Raw(fp127A);
                        break;
                    case 'log10':
                        if (fp127A <= 0n) {
                            this.showStatus('log10 requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.log10Raw(fp127A);
                        break;
                    case 'sqrt':
                        if (fp127A < 0n) {
                            this.showStatus('sqrt requires non-negative input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.sqrtRaw(fp127A);
                        break;
                    case 'abs':
                        result = await this.contract.absRaw(fp127A);
                        break;
                    case 'neg':
                        result = await this.contract.negRaw(fp127A);
                        break;
                    case 'inv':
                        if (fp127A === 0n) {
                            this.showStatus('inv: division by zero', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.invRaw(fp127A);
                        break;
                    case 'sign':
                        result = await this.contract.signRaw(fp127A);
                        break;
                    case 'floor':
                        result = await this.contract.floorRaw(fp127A);
                        break;
                    case 'ceil':
                        result = await this.contract.ceilRaw(fp127A);
                        break;
                    case 'frac':
                        result = await this.contract.fracRaw(fp127A);
                        break;
                    case 'cbrt':
                        result = await this.contract.cbrtRaw(fp127A);
                        break;
                    case 'round':
                        result = await this.contract.roundRaw(fp127A);
                        break;
                    case 'log2Up':
                        if (fp127A <= 0n) {
                            this.showStatus('log2Up requires positive input', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.log2UpRaw(fp127A);
                        break;
                    case 'factorial':
                        const aFp127Num = Number(fp127A >> 128n);
                        if (aFp127Num < 0 || aFp127Num > 33) {
                            this.showStatus('Factorial requires 0 <= n <= 33', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.factorialRaw(fp127A);
                        break;
                    case 'lambertW0':
                        const oneFp127 = 1n << 128n;
                        const sixtyFourFp127 = 64n << 128n;
                        if (fp127A < oneFp127 || fp127A > sixtyFourFp127) {
                            this.showStatus('Lambert W₀ requires 1 ≤ x ≤ 64', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.lambertW0Raw(fp127A);
                        break;
                    default:
                        this.showStatus('Unknown operation', 'error');
                        return;
                }

                // Convert result back to decimal string with full precision
                const resultBigInt = BigInt(result.toString());
                this.lastRawResult = resultBigInt;
                const displayResult = formatFp127Display(fp127ToDecimal(resultBigInt, 38));

                resultEl.textContent = displayResult;

                // Update raw hex if toggle is on
                if (this.showRawHex) {
                    const rawEl = document.getElementById('arith-raw');
                    const hex = resultBigInt.toString(16).padStart(64, '0');
                    rawEl.textContent = `0x${hex}`;
                    rawEl.style.display = 'block';
                }

                // Execute on-chain if toggle is on, otherwise just estimate
                if (this.executeOnChain) {
                    const { gasUsed } = await this.executeOnChainTransaction(this.selectedOp, [fp127A]);
                    document.getElementById('arith-gas').textContent = `Gas: ${gasUsed.toLocaleString()} (actual)`;
                    this.showStatus('Executed on-chain successfully', 'success');
                } else {
                    this.estimateGas(this.selectedOp, [fp127A]);
                    this.showStatus('Calculated successfully', 'success');
                }

                // Check precision for known values
                this.checkPrecision(this.selectedOp, aValue, displayResult);

            } else if (arity === 'ternary') {
                const inputC = document.getElementById('input-c');
                const bValue = inputB.value.trim();
                const cValue = inputC.value.trim();
                
                if (!bValue || !cValue) {
                    this.showStatus('Please enter all three values', 'error');
                    return;
                }

                if (!isValidFp127Decimal(bValue) || !isValidFp127Decimal(cValue)) {
                    this.showStatus('Invalid number format', 'error');
                    return;
                }

                this.showStatus('Calculating on-chain...', 'loading');
                resultEl.textContent = '...';

                const fp127A = decimalToFp127(aValue);
                const fp127B = decimalToFp127(bValue);
                const fp127C = decimalToFp127(cValue);

                let result;
                if (this.selectedOp === 'lerp') {
                    result = await this.contract.lerpRaw(fp127A, fp127B, fp127C);
                } else {
                    result = await this.contract.clampRaw(fp127A, fp127B, fp127C);
                }

                const resultBigInt = BigInt(result.toString());
                this.lastRawResult = resultBigInt;
                const displayResult = formatFp127Display(fp127ToDecimal(resultBigInt, 38));

                resultEl.textContent = displayResult;

                // Update raw hex if toggle is on
                if (this.showRawHex) {
                    const rawEl = document.getElementById('arith-raw');
                    const hex = resultBigInt.toString(16).padStart(64, '0');
                    rawEl.textContent = `0x${hex}`;
                    rawEl.style.display = 'block';
                }

                // Execute on-chain if toggle is on, otherwise just estimate
                if (this.executeOnChain) {
                    const { gasUsed } = await this.executeOnChainTransaction(this.selectedOp, [fp127A, fp127B, fp127C]);
                    document.getElementById('arith-gas').textContent = `Gas: ${gasUsed.toLocaleString()} (actual)`;
                    this.showStatus('Executed on-chain successfully', 'success');
                } else {
                    this.estimateGas(this.selectedOp, [fp127A, fp127B, fp127C]);
                    this.showStatus('Calculated successfully', 'success');
                }

            } else {
                // Binary operations (arithmetic + new binary ops)
                const bValue = inputB.value.trim();
                if (!bValue) {
                    this.showStatus('Please enter both values', 'error');
                    return;
                }

                if (!isValidFp127Decimal(bValue)) {
                    this.showStatus('Invalid number format', 'error');
                    return;
                }

                this.showStatus('Calculating on-chain...', 'loading');
                resultEl.textContent = '...';

                const fp127A = decimalToFp127(aValue);
                const fp127B = decimalToFp127(bValue);

                let result;
                switch (this.selectedOp) {
                    case 'add':
                        result = await this.contract.addRaw(fp127A, fp127B);
                        break;
                    case 'sub':
                        result = await this.contract.subRaw(fp127A, fp127B);
                        break;
                    case 'mul':
                        result = await this.contract.mulRaw(fp127A, fp127B);
                        break;
                    case 'div':
                        if (fp127B === 0n) {
                            this.showStatus('Division by zero', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.divRaw(fp127A, fp127B);
                        break;
                    case 'pow':
                        if (fp127A < 0n) {
                            this.showStatus('pow requires non-negative base', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.powRaw(fp127A, fp127B);
                        break;
                    case 'min':
                        result = await this.contract.minRaw(fp127A, fp127B);
                        break;
                    case 'max':
                        result = await this.contract.maxRaw(fp127A, fp127B);
                        break;
                    case 'avg':
                        result = await this.contract.avgRaw(fp127A, fp127B);
                        break;
                    case 'gavg':
                        if (fp127A < 0n || fp127B < 0n) {
                            this.showStatus('gavg requires non-negative inputs', 'error');
                            resultEl.textContent = 'Error';
                            return;
                        }
                        result = await this.contract.gavgRaw(fp127A, fp127B);
                        break;
                    case 'dist':
                        result = await this.contract.distRaw(fp127A, fp127B);
                        break;
                    case 'zeroFloorSub':
                        result = await this.contract.zeroFloorSubRaw(fp127A, fp127B);
                        break;
                    case 'hypot':
                        result = await this.contract.hypotRaw(fp127A, fp127B);
                        break;
                    case 'gcd':
                        result = await this.contract.gcdRaw(fp127A, fp127B);
                        break;
                    default:
                        this.showStatus('Unknown operation', 'error');
                        return;
                }

                const resultBigInt = BigInt(result.toString());
                this.lastRawResult = resultBigInt;
                const displayResult = formatFp127Display(fp127ToDecimal(resultBigInt, 38));

                resultEl.textContent = displayResult;

                // Update raw hex if toggle is on
                if (this.showRawHex) {
                    const rawEl = document.getElementById('arith-raw');
                    const hex = resultBigInt.toString(16).padStart(64, '0');
                    rawEl.textContent = `0x${hex}`;
                    rawEl.style.display = 'block';
                }

                // Execute on-chain if toggle is on, otherwise just estimate
                if (this.executeOnChain) {
                    const { gasUsed } = await this.executeOnChainTransaction(this.selectedOp, [fp127A, fp127B]);
                    document.getElementById('arith-gas').textContent = `Gas: ${gasUsed.toLocaleString()} (actual)`;
                    this.showStatus('Executed on-chain successfully', 'success');
                } else {
                    this.estimateGas(this.selectedOp, [fp127A, fp127B]);
                    this.showStatus('Calculated successfully', 'success');
                }
            }

        } catch (error) {
            console.error('Calculation error:', error);
            this.showStatus(`Error: ${error.message || 'Calculation failed'}`, 'error');
            resultEl.textContent = 'Error';
        } finally {
            this._scrollFp127LcdToEnd();
        }
    }

    _scrollFp127LcdToEnd() {
        const inner = document.querySelector('#fp127-container .ti-lcd-inner');
        if (!inner) return;
        requestAnimationFrame(() => {
            inner.scrollLeft = inner.scrollWidth;
        });
    }

    clear() {
        document.getElementById('input-a').value = '';
        document.getElementById('input-b').value = '';
        document.getElementById('input-c').value = '';
        document.getElementById('arith-result').textContent = '0';
        document.getElementById('arith-gas').textContent = '';
        document.getElementById('arith-precision').textContent = '';
        document.getElementById('arith-raw').textContent = '';
        document.getElementById('arith-raw').style.display = 'none';
        document.getElementById('arith-tx-info').style.display = 'none';
        this.lastRawResult = null;
        this.showStatus('', '');
        this.updateExpression();
        this._scrollFp127LcdToEnd();
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

    toggleHex() {
        this.showRawHex = !this.showRawHex;
        const rawEl = document.getElementById('arith-raw');
        const hexBtn = document.getElementById('arith-hex');
        
        if (this.showRawHex) {
            hexBtn.classList.add('arith-hex-active');
            if (this.lastRawResult !== null) {
                const hex = this.lastRawResult.toString(16).padStart(64, '0');
                rawEl.textContent = `0x${hex}`;
                rawEl.style.display = 'block';
            }
            this._scrollFp127LcdToEnd();
        } else {
            hexBtn.classList.remove('arith-hex-active');
            rawEl.style.display = 'none';
        }
    }

    runPreset(preset) {
        const presets = {
            'exp_1': { op: 'exp', a: '1' },
            'sqrt_2': { op: 'sqrt', a: '2' },
            'ln_2': { op: 'ln', a: '2' },
            'pi_e': { op: 'mul', a: '3.14159265358979323846264338327950288', b: '2.71828182845904523536028747135266249' },
            'factorial_20': { op: 'factorial', a: '20' },
            'w0_1': { op: 'lambertW0', a: '1' }
        };

        const config = presets[preset];
        if (!config) return;

        // Select the operation button
        const opButton = document.querySelector(`#fp127-buttons .ti-key[data-op="${config.op}"]`);
        if (opButton) {
            opButton.click();
        }

        // Fill in the inputs
        document.getElementById('input-a').value = config.a;
        if (config.b) {
            document.getElementById('input-b').value = config.b;
        }
        if (config.c) {
            document.getElementById('input-c').value = config.c;
        }

        // Update expression and calculate
        this.updateExpression();
        setTimeout(() => this.calculate(), 100);
    }

    checkPrecision(op, inputA, result) {
        const precisionEl = document.getElementById('arith-precision');
        
        // Build key for known values
        let key = null;
        if (op === 'exp' && inputA === '1') key = 'exp_1';
        else if (op === 'sqrt' && inputA === '2') key = 'sqrt_2';
        else if (op === 'ln' && inputA === '2') key = 'ln_2';
        else if (op === 'lambertW0' && inputA === '1') key = 'lambertW0_1';

        if (!key || !KNOWN_VALUES[key]) {
            precisionEl.textContent = '';
            return;
        }

        const known = KNOWN_VALUES[key];
        const resultStr = result.replace(/,/g, '');
        const knownStr = known.value;

        // Compare digit by digit
        let matches = 0;
        const minLen = Math.min(resultStr.length, knownStr.length);
        for (let i = 0; i < minLen; i++) {
            if (resultStr[i] === knownStr[i]) {
                matches++;
            } else {
                break;
            }
        }

        // Account for decimal point
        if (matches > 0 && resultStr.includes('.')) {
            matches--; // Don't count the decimal point
        }

        precisionEl.textContent = `${matches} digits match ${known.label}`;
    }

    async estimateGas(op, args) {
        const gasEl = document.getElementById('arith-gas');

        try {
            // Ethers v6 uses contract.methodName.estimateGas(args)
            // Ethers v5 uses contract.estimateGas.methodName(args)
            let gasEstimate;
            const method = `${op}Raw`;

            if (this.contract[method] && this.contract[method].estimateGas) {
                // Ethers v6
                gasEstimate = await this.contract[method].estimateGas(...args);
            } else if (this.contract.estimateGas && this.contract.estimateGas[method]) {
                // Ethers v5
                gasEstimate = await this.contract.estimateGas[method](...args);
            } else {
                gasEl.textContent = '';
                return;
            }

            const gasNumber = typeof gasEstimate === 'bigint' ? Number(gasEstimate) : gasEstimate.toNumber();
            gasEl.textContent = `Gas: ~${gasNumber.toLocaleString()}`;
        } catch (error) {
            console.warn('Gas estimation failed:', error);
            gasEl.textContent = '';
        }
    }

    async executeOnChainTransaction(op, args) {
        const txInfoEl = document.getElementById('arith-tx-info');
        const txHashEl = document.getElementById('arith-tx-hash');
        const txGasEl = document.getElementById('arith-tx-gas');
        const txCostEl = document.getElementById('arith-tx-cost');

        if (!this.web3Provider || !this.web3Provider.isConnected()) {
            throw new Error('Wallet not connected. Connect wallet to execute on-chain.');
        }

        const method = `${op}Raw`;
        const contractFn = this.contract[method];
        if (!contractFn) {
            throw new Error(`Unknown method: ${method}`);
        }

        // Get the signer from wallet
        const signer = await this.web3Provider.getSigner();
        const contractWithSigner = this.contract.connect(signer);

        // Encode the function call data
        const data = contractWithSigner.interface.encodeFunctionData(method, args);
        const contractAddress = this.contract.address;

        // Send the transaction
        this.showStatus('Sending transaction...', 'loading');
        const tx = await signer.sendTransaction({
            to: contractAddress,
            data: data,
        });

        this.showStatus('Waiting for confirmation...', 'loading');
        const receipt = await tx.wait();

        // Get gas price for cost calculation
        const gasUsed = typeof receipt.gasUsed === 'bigint' ? receipt.gasUsed : BigInt(receipt.gasUsed.toString());
        const effectiveGasPrice = receipt.effectiveGasPrice 
            ? (typeof receipt.effectiveGasPrice === 'bigint' ? receipt.effectiveGasPrice : BigInt(receipt.effectiveGasPrice.toString()))
            : 0n;
        const totalCost = gasUsed * effectiveGasPrice;

        // Format the cost in ETH
        const costInEth = Number(totalCost) / 1e18;
        const costStr = costInEth < 0.000001 
            ? `${(costInEth * 1e9).toFixed(4)} Gwei`
            : `${costInEth.toFixed(8)} ETH`;

        // Get network for Etherscan link
        const chainId = this.web3Provider.chainId;
        let explorerBase = 'https://etherscan.io';
        if (chainId === 11155111) explorerBase = 'https://sepolia.etherscan.io';
        else if (chainId === 5) explorerBase = 'https://goerli.etherscan.io';

        // Calculate computation gas (subtract 21k base tx overhead)
        const computeGas = Number(gasUsed) - 21000;

        // Display transaction info
        txHashEl.textContent = `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`;
        txHashEl.href = `${explorerBase}/tx/${tx.hash}`;
        txGasEl.textContent = `${computeGas.toLocaleString()} (+ 21k tx base)`;
        txCostEl.textContent = costStr;
        txInfoEl.style.display = 'block';

        return { receipt, gasUsed: computeGas };
    }
}
