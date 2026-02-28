/**
 * Calculator Base Class
 * Domain layer - abstract base for on-chain calculators
 * Extends InteractiveContract with calculator-specific features
 */

import { InteractiveContract } from './interactive-contract.js';

export class Calculator extends InteractiveContract {
    constructor(config = {}) {
        super();
        
        // Store configuration
        this.config = config;
        
        // Calculator-specific properties
        this.constantValue = null;
        
        // Get symbol and name from metadata or config
        if (this.metadata) {
            this.symbol = this.metadata.symbol || '';
            this.name = this.metadata.name || '';
        } else {
            this.symbol = '';
            this.name = '';
        }
    }

    /**
     * Get contract name from config
     */
    getContractName() {
        return this.config.id || '';
    }

    /**
     * Hook: After init, load constant value from contract if needed
     */
    async onAfterInit() {
        if (this.config.onAfterInit?.method) {
            await this.loadConstantValue();
        }
    }

    /**
     * Load constant value from contract (if available)
     * Override in subclasses if contract provides a get_constant() method
     */
    async loadConstantValue() {
        if (!this.contract || !this.contract.get_constant) {
            return;
        }

        try {
            const value = await this.contract.get_constant();
            // Use injected math utility for conversion
            this.constantValue = this.math.fromFixedPoint(value, 10);
            console.log(`Loaded ${this.name} constant: ${this.constantValue}`);
        } catch (error) {
            console.log(`Using default ${this.name} value`);
        }
    }

    /**
     * Render calculator UI from config
     */
    render() {
        const headerConfig = {
            title: `${this.config.emoji || ''} ${this.symbol} Calculator`,
            description: this.config.description || '',
            contractAddress: this.metadata.contractAddress,
            sourceFile: this.metadata.sourceFile,
            abiFile: this.metadata.abiFile
        };
        
        const header = this.renderer.createGameHeader(headerConfig);
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        // Render input field (if calculator needs one)
        if (this.config.input) {
            const inputConfig = {
                id: 'input-value',
                label: this.config.input.label,
                type: 'number',
                placeholder: this.config.input.placeholder,
                min: this.config.input.min,
                max: this.config.input.max,
                step: this.config.input.step
            };
            controlsDiv.appendChild(this.dom.createInput(inputConfig));
            
            if (this.config.input.hint) {
                const hint = document.createElement('div');
                hint.className = 'input-hint';
                hint.textContent = this.config.input.hint;
                controlsDiv.querySelector('.input-group').appendChild(hint);
            }
        }
        
        // Render calculate button
        const buttonText = this.config.calculate?.noInput 
            ? `Get ${this.symbol} from Blockchain` 
            : `Calculate ${this.symbol}(x) On-Chain`;
        controlsDiv.appendChild(this.dom.createButton('calculate-button', buttonText));
        
        container.appendChild(controlsDiv);
        
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        sectionsContainer.appendChild(this.renderResultPanel());
        sectionsContainer.appendChild(this.renderInfoPanel());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

    /**
     * Render result panel from config
     */
    renderResultPanel() {
        return this.renderStandardResultPanel({
            title: this.config.result?.title || '📊 Result',
            label: this.config.result?.label || `${this.symbol}(x) =`,
            hint: this.config.result?.hint || 'Enter a value and click Calculate to see the result',
            examples: this.config.result?.examples || null
        });
    }

    /**
     * Render info panel from config
     */
    renderInfoPanel() {
        const info = this.config.info || {};
        return this.renderStandardInfoPanel({
            description: info.description || '',
            features: info.features || [],
            notes: info.notes || [],
            usageExample: info.usageExample || null,
            interfaceName: info.interfaceName || `${this.name}Calculator`,
            interfaceMethod: info.interfaceMethod || 'def calculate(x: decimal) -> decimal: view'
        });
    }

    /**
     * Setup event listeners from config
     */
    setupListeners() {
        if (this.config.calculate?.noInput) {
            // Constant calculator - just button click
            const button = document.getElementById('calculate-button');
            if (button) {
                button.addEventListener('click', () => this.calculate());
            }
        } else {
            // Standard calculator - input + button + enter key
            this.setupStandardListeners();
        }
    }

    /**
     * Perform calculation based on config
     */
    async calculate(inputValue) {
        // Handle constants (no input required)
        if (this.config.calculate?.noInput) {
            return await this.withButtonState('calculate-button', async () => {
                const result = await this.contract[this.config.calculate.method]();
                const resultDecimal = ethers.utils.formatUnits(result, 10);
                this.displayResult(resultDecimal, `${this.symbol} = ${parseFloat(resultDecimal).toFixed(10)}`);
                return resultDecimal;
            }, { loading: 'Loading...' });
        }

        // Validate input
        const calcConfig = this.config.calculate || {};
        const min = calcConfig.min !== undefined ? calcConfig.min : -Infinity;
        const max = calcConfig.max !== undefined ? calcConfig.max : Infinity;
        
        const x = this.validateInput(inputValue, min, max);
        if (x === null) return;

        // Integer check if required
        if (calcConfig.integerCheck && !Number.isInteger(x)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: calcConfig.message || 'Value must be an integer',
                type: 'warning'
            });
            return;
        }

        // Execute calculation
        return await this.withButtonState('calculate-button', async () => {
            console.log(`Calculating ${this.symbol}(${x}) on-chain`);
            
            const xFixed = ethers.utils.parseUnits(x.toString(), 10);
            const result = await this.contract.calculate(xFixed);
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            // Format result
            let formula;
            if (calcConfig.formatResult === 'custom' && this.config.id === 'norm-cdf') {
                // Special formatting for norm-cdf
                formula = `Φ(${x}) ≈ ${parseFloat(resultDecimal).toFixed(6)} (${(parseFloat(resultDecimal) * 100).toFixed(2)}%)`;
            } else if (calcConfig.integerCheck) {
                // Integer results (factorial)
                formula = `${x}! = ${parseFloat(resultDecimal).toFixed(0)}`;
            } else {
                // Default formatting
                formula = `${this.symbol}(${x}) ≈ ${parseFloat(resultDecimal).toFixed(6)}`;
            }
            
            this.displayResult(resultDecimal, formula);
            return resultDecimal;
        }, { loading: 'Calculating...' });
    }

    /**
     * Validate numeric input
     */
    validateInput(value, min = -Infinity, max = Infinity) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid number',
                type: 'warning'
            });
            return null;
        }
        
        if (num < min || num >= max) {
            eventBus.emit(EVENTS.TOAST, {
                message: `Value must be in range [${min}, ${max})`,
                type: 'warning'
            });
            return null;
        }
        
        return num;
    }

    /**
     * Display calculation result in UI
     */
    displayResult(result, formula = null) {
        const resultValue = document.getElementById('result-value');
        if (resultValue) {
            resultValue.textContent = parseFloat(result).toFixed(10);
            resultValue.style.color = 'var(--success)';
        }

        if (formula) {
            eventBus.emit(EVENTS.TOAST, {
                message: formula,
                type: 'success'
            });
        }
    }

    /**
     * Helper: Get contract metadata for rendering
     */
    getMetadata() {
        return {
            contractName: this.getContractName(),
            addressKey: this.getAddressKey(),
            sourceKey: this.getSourceKey(),
            abiKey: this.getAbiKey(),
            symbol: this.symbol,
            name: this.name,
            constantValue: this.constantValue
        };
    }

    /**
     * Setup standard calculator event listeners
     * Binds calculate button and enter key on input
     * 
     * @param {string} buttonId - Calculate button ID (default: 'calculate-button')
     * @param {string} inputId - Input field ID (default: 'input-value')
     */
    setupStandardListeners(buttonId = 'calculate-button', inputId = 'input-value') {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        
        if (button && input) {
            const handler = () => this.calculate(input.value);
            button.addEventListener('click', handler);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handler();
            });
        }
    }

    /**
     * Standard calculation execution with ethers fixed-point conversion
     * Handles validation, button state, contract call, and result display
     * 
     * @param {any} inputValue - Input value to validate and convert
     * @param {Object} options - Configuration options
     * @returns {Promise} Calculation result
     */
    async executeStandardCalculation(inputValue, options = {}) {
        const {
            min = -Infinity,
            max = Infinity,
            precision = 10,
            buttonId = 'calculate-button',
            buttonText = `Calculate ${this.symbol}(x) On-Chain`,
            formatResult = (x, result) => `${this.symbol}(${x}) ≈ ${parseFloat(result).toFixed(6)}`
        } = options;

        const x = this.validateInput(inputValue, min, max);
        if (x === null) return;

        return await this.withButtonState(buttonId, async () => {
            console.log(`Calculating ${this.symbol}(${x}) on-chain`);
            
            // Use ethers for compatibility with existing contract calls
            const xFixed = ethers.utils.parseUnits(x.toString(), precision);
            const result = await this.contract.calculate(xFixed);
            const resultDecimal = ethers.utils.formatUnits(result, precision);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, formatResult(x, resultDecimal));
            return resultDecimal;
        }, { loading: 'Calculating...' });
    }

    /**
     * Render standard result panel for calculators
     * Creates consistent result display UI
     * 
     * @param {Object} options - Panel configuration
     * @returns {HTMLElement} Result panel element
     */
    renderStandardResultPanel(options = {}) {
        const {
            title = '📊 Result',
            label = `${this.symbol}(x) =`,
            placeholder = '—',
            hint = 'Enter a value and click Calculate to see the result',
            examples = null
        } = options;

        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        
        let examplesHtml = '';
        if (examples) {
            examplesHtml = `
                <div class="result-examples">
                    <p><strong>Examples:</strong></p>
                    <ul>
                        ${examples.map(ex => `<li>${ex}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        panel.innerHTML = `
            <h3>${title}</h3>
            <div class="calculator-result">
                <div class="result-display" id="result-display">
                    <div class="result-label">${label}</div>
                    <div class="result-value" id="result-value">${placeholder}</div>
                </div>
                <div class="result-info">
                    ${hint}
                </div>
                ${examplesHtml}
            </div>
        `;
        return panel;
    }

    /**
     * Render standard info panel for calculators
     * Creates consistent information and usage documentation
     * 
     * @param {Object} content - Panel content configuration
     * @returns {HTMLElement} Info panel element
     */
    renderStandardInfoPanel(content = {}) {
        const {
            aboutTitle = `ℹ️ About ${this.name}`,
            description = '',
            features = [],
            notes = [],
            usageTitle = '🔧 Use in Your Smart Contract',
            interfaceName = `${this.name}Calculator`,
            interfaceMethod = 'def calculate(x: decimal) -> decimal: view',
            usageExample = null
        } = content;

        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';

        let featuresHtml = '';
        if (features.length > 0) {
            featuresHtml = `
                <ul>
                    ${features.map(f => `<li>${f}</li>`).join('')}
                </ul>
            `;
        }

        let notesHtml = '';
        if (notes.length > 0) {
            notesHtml = notes.map(note => `<p class="note">${note}</p>`).join('');
        }

        const defaultUsageExample = usageExample || `
# Interface for ${this.name} Calculator
interface ${interfaceName}:
    ${interfaceMethod}

# Use the calculator
CALC: constant(address) = ${this.metadata.contractAddress}

@external
@view
def my_calculation(x: decimal) -> decimal:
    # Call ${this.symbol}(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall ${interfaceName}(CALC).calculate(x)
    return result
        `.trim();

        panel.innerHTML = `
            <h3>${aboutTitle}</h3>
            <div class="tool-info">
                ${description}
                ${featuresHtml}
                ${notesHtml}
            </div>
            
            <h3>${usageTitle}</h3>
            <div class="tool-info">
                <p>You can call this calculator from your own smart contracts!</p>
                <pre><code>${defaultUsageExample}</code></pre>
                <p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>
                <p class="note">📍 <strong>Contract Address:</strong> <code style="word-break: break-all;">${this.metadata.contractAddress}</code></p>
            </div>
        `;
        return panel;
    }
}

