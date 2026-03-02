/**
 * Value Input Component
 * Allows toggling between ETH, GWEI, and WEI units
 */

export class ValueInput {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            label: options.label || 'Value',
            hint: options.hint || '',
            defaultUnit: options.defaultUnit || 'eth',
            minWei: options.minWei || '0',
            required: options.required !== false,
            step: options.step || 'any',
            ...options
        };
        
        this.currentUnit = this.options.defaultUnit.toLowerCase();
        this.weiValue = '0';
        this.inputValue = '';
        
        this.units = {
            wei: { multiplier: '1', decimals: 0, label: 'WEI' },
            gwei: { multiplier: '1000000000', decimals: 9, label: 'GWEI' },
            eth: { multiplier: '1000000000000000000', decimals: 18, label: 'ETH' }
        };
    }

    /**
     * Render the component
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="value-input-component">
                <div class="value-input-header">
                    <label>
                        ${this.options.label}
                        ${this.options.hint ? `<span class="form-hint">${this.options.hint}</span>` : ''}
                    </label>
                    <div class="unit-toggle">
                        <button type="button" class="unit-btn ${this.currentUnit === 'eth' ? 'active' : ''}" data-unit="eth">ETH</button>
                        <button type="button" class="unit-btn ${this.currentUnit === 'gwei' ? 'active' : ''}" data-unit="gwei">GWEI</button>
                        <button type="button" class="unit-btn ${this.currentUnit === 'wei' ? 'active' : ''}" data-unit="wei">WEI</button>
                    </div>
                </div>
                <input 
                    type="number" 
                    class="value-input" 
                    placeholder="0" 
                    step="${this.getStepForUnit()}"
                    min="${this.getMinForUnit()}"
                    ${this.options.required ? 'required' : ''}
                >
                <div class="value-conversion">
                    <div class="conversion-info">
                        <span class="conversion-label">Wei:</span>
                        <span class="conversion-value">0</span>
                    </div>
                    ${this.options.minWei && this.options.minWei !== '0' ? `
                    <div class="min-value-info">
                        <span class="min-label">Min:</span>
                        <span class="min-value">${this.getMinForUnit()} ${this.units[this.currentUnit].label}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const input = container.querySelector('.value-input');
        const unitButtons = container.querySelectorAll('.unit-btn');

        // Input change handler
        input.addEventListener('input', (e) => {
            this.inputValue = e.target.value;
            this.updateWeiValue();
        });

        // Unit toggle handlers
        unitButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newUnit = e.target.dataset.unit;
                this.switchUnit(newUnit);
            });
        });
    }

    /**
     * Switch between units
     */
    switchUnit(newUnit) {
        if (newUnit === this.currentUnit || !this.units[newUnit]) return;

        const container = document.getElementById(this.containerId);
        if (!container) return;

        const input = container.querySelector('.value-input');
        const unitButtons = container.querySelectorAll('.unit-btn');

        // Convert current value to new unit
        if (this.inputValue && this.inputValue !== '') {
            try {
                // Convert to wei first, then to new unit
                const currentMultiplier = ethers.BigNumber.from(this.units[this.currentUnit].multiplier);
                const newMultiplier = ethers.BigNumber.from(this.units[newUnit].multiplier);
                
                // Parse current value with proper decimals
                const valueStr = this.inputValue.toString();
                const weiValue = ethers.utils.parseUnits(valueStr, this.units[this.currentUnit].decimals);
                
                // Convert to new unit
                const newValue = weiValue.mul(ethers.BigNumber.from(10).pow(this.units[newUnit].decimals)).div(currentMultiplier);
                const formattedValue = ethers.utils.formatUnits(newValue, this.units[newUnit].decimals);
                
                this.inputValue = formattedValue;
                input.value = formattedValue;
            } catch (error) {
                console.error('Conversion error:', error);
            }
        }

        // Update UI
        this.currentUnit = newUnit;
        unitButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === newUnit);
        });

        // Update step and min based on unit
        input.step = this.getStepForUnit();
        input.min = this.getMinForUnit();
        
        // Update min display if it exists
        const minValueEl = container.querySelector('.min-value');
        if (minValueEl && this.options.minWei && this.options.minWei !== '0') {
            minValueEl.textContent = `${this.getMinForUnit()} ${this.units[this.currentUnit].label}`;
        }

        this.updateWeiValue();
    }

    /**
     * Get the appropriate step value for current unit
     */
    getStepForUnit() {
        if (this.currentUnit === 'wei') {
            return '1';
        } else if (this.currentUnit === 'gwei') {
            return '0.000000001';
        } else {
            return '0.000000000000000001';
        }
    }

    /**
     * Get the minimum value for current unit based on minWei
     */
    getMinForUnit() {
        try {
            if (!this.options.minWei || this.options.minWei === '0') {
                return '0';
            }

            const minWeiBN = ethers.BigNumber.from(this.options.minWei);
            const decimals = this.units[this.currentUnit].decimals;
            return ethers.utils.formatUnits(minWeiBN, decimals);
        } catch (error) {
            return '0';
        }
    }

    /**
     * Update the Wei value display and internal state
     */
    updateWeiValue() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const conversionValue = container.querySelector('.conversion-value');
        const input = container.querySelector('.value-input');
        
        try {
            if (!this.inputValue || this.inputValue === '') {
                this.weiValue = '0';
                conversionValue.textContent = '0';
                this.updateValidationState(input, false);
                return;
            }

            const decimals = this.units[this.currentUnit].decimals;
            const wei = ethers.utils.parseUnits(this.inputValue.toString(), decimals);
            this.weiValue = wei.toString();
            
            // Format wei value with commas for readability
            conversionValue.textContent = this.formatWeiDisplay(this.weiValue);
            
            // Update validation state
            const isValid = this.isValid();
            this.updateValidationState(input, isValid);
        } catch (error) {
            this.weiValue = '0';
            conversionValue.textContent = 'Invalid';
            this.updateValidationState(input, false);
        }
    }

    /**
     * Update visual validation state
     */
    updateValidationState(input, isValid) {
        if (!input) return;
        
        if (this.weiValue === '0' || this.weiValue === '' || !this.inputValue) {
            input.style.borderColor = '';
            return;
        }
        
        if (isValid) {
            input.style.borderColor = 'var(--md-sys-color-primary)';
        } else {
            input.style.borderColor = 'var(--md-sys-color-error)';
        }
    }

    /**
     * Format wei value for display
     */
    formatWeiDisplay(weiStr) {
        if (weiStr === '0') return '0';
        
        // Add commas for readability
        return weiStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Get the value in Wei (as BigNumber)
     */
    getWeiValue() {
        try {
            return ethers.BigNumber.from(this.weiValue || '0');
        } catch (error) {
            return ethers.BigNumber.from('0');
        }
    }

    /**
     * Get the value as a string in Wei
     */
    getWeiString() {
        return this.weiValue || '0';
    }

    /**
     * Set value programmatically (in wei)
     */
    setValue(weiValue) {
        try {
            const wei = ethers.BigNumber.from(weiValue);
            this.weiValue = wei.toString();
            
            // Convert to current unit and update input
            const decimals = this.units[this.currentUnit].decimals;
            const value = ethers.utils.formatUnits(wei, decimals);
            
            const container = document.getElementById(this.containerId);
            if (container) {
                const input = container.querySelector('.value-input');
                input.value = value;
                this.inputValue = value;
                this.updateWeiValue();
            }
        } catch (error) {
            console.error('Error setting value:', error);
        }
    }

    /**
     * Set minimum value in wei
     */
    setMinimum(minWei) {
        this.options.minWei = minWei;
        
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.value-input');
            if (input) {
                input.min = this.getMinForUnit();
            }
            
            // Update min display if it exists
            const minValueEl = container.querySelector('.min-value');
            if (minValueEl && this.options.minWei && this.options.minWei !== '0') {
                minValueEl.textContent = `${this.getMinForUnit()} ${this.units[this.currentUnit].label}`;
            }
        }
    }

    /**
     * Reset the input
     */
    reset() {
        this.inputValue = '';
        this.weiValue = '0';
        
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.value-input');
            input.value = '';
            this.updateWeiValue();
        }
    }

    /**
     * Validate against minimum
     */
    isValid() {
        try {
            const current = ethers.BigNumber.from(this.weiValue || '0');
            const min = ethers.BigNumber.from(this.options.minWei || '0');
            return current.gte(min);
        } catch (error) {
            return false;
        }
    }
}

