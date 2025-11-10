/**
 * Natural Logarithm (ln) Calculator Tool
 * Calculate ln(x) on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class LnCalculator extends Calculator {
    getContractName() {
        return 'ln-calculator';
    }

    async onAfterInit() {
        // Load constant value from contract (e)
        try {
            const value = await this.contract.get_constant();
            this.constantValue = this.math.fromFixedPoint(value, 10);
        } catch (error) {
            console.log('Using default e value');
        }
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(this.dom.createInput({
            id: 'input-value',
            label: 'Input (x)',
            type: 'number',
            placeholder: 'Enter value (e.g., 10)',
            min: 0.000001,
            max: 22026.465,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: (0, e^10] ≈ (0, 22026.5]';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(this.dom.createButton(
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
        return this.renderStandardResultPanel({
            label: `${this.symbol}(x) =`,
            examples: [
                'ln(1) = 0',
                'ln(e) ≈ ln(2.718) = 1',
                'ln(e²) ≈ ln(7.389) = 2',
                'ln(10) ≈ 2.303',
                'ln(100) ≈ 4.605'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>The natural logarithm</strong> is the logarithm to base <em>e</em> ≈ 2.718281828...</p>`,
            features: [
                '<strong>Inverse of e^x:</strong> If e^y = x, then ln(x) = y',
                '<strong>Compound Growth:</strong> Calculate doubling time and growth rates',
                '<strong>Information Theory:</strong> Natural measure of information entropy',
                '<strong>Calculus:</strong> ln(x) has the simplest derivative: d/dx[ln(x)] = 1/x',
                '<strong>Probability:</strong> Log-likelihood in statistical inference'
            ],
            notes: [
                '💡 <strong>Fun fact:</strong> ln(x) is called "natural" because e appears naturally in many mathematical contexts!',
                '🔒 <strong>On-chain calculation:</strong> Uses digit-by-digit extraction for high accuracy (~10 decimal places).'
            ],
            usageExample: `
# Interface for ${this.name} Calculator
interface LnCalculator:
    def calculate(x: decimal) -> decimal: view
    def get_constant() -> decimal: view

# Use the calculator
CALC: constant(address) = ${this.metadata.contractAddress}

@external
@view
def my_calculation(value: decimal) -> decimal:
    # Call ln(x) calculator (FREE - no gas cost!)
    result: decimal = staticcall LnCalculator(CALC).calculate(value)
    return result

# Example: Calculate time to double with continuous growth
@external
@view
def doubling_time(growth_rate: decimal) -> decimal:
    # T = ln(2) / r
    ln_2: decimal = staticcall LnCalculator(CALC).calculate(2.0)
    return ln_2 / growth_rate
            `.trim()
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: 0.000001,
            max: 22026.465
        });
    }
}
