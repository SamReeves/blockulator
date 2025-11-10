/**
 * Euler's Number (e) Calculator Tool
 * Calculate e ≈ 2.71828... on-chain with high precision
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class ECalculator extends Calculator {
    getContractName() {
        return 'e-calculator';
    }

    async onAfterInit() {
        // Load e value from contract
        try {
            const value = await this.contract.get_constant();
            this.constantValue = this.math.fromFixedPoint(value, 10);
        } catch (error) {
            console.log('Using default e value');
        }
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `📈 ${this.symbol} Calculator`,
            description: `Get Euler's number ${this.symbol} ≈ 2.71828... on-chain with high precision!`,
            contractAddress: this.metadata.contractAddress,
            sourceFile: this.metadata.sourceFile,
            abiFile: this.metadata.abiFile
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(this.dom.createButton(
            'calculate-button',
            `Get ${this.symbol} On-Chain`
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
            label: `${this.symbol} =`,
            hint: 'Click the button to retrieve e from the blockchain'
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>e</strong> is Euler's number, the base of natural logarithms, approximately 2.71828...</p>`,
            features: [
                'Base of the natural exponential function e^x',
                'Appears in compound interest: A = P * e^(rt)',
                'Essential for calculus and differential equations',
                'Fundamental constant in mathematics'
            ],
            notes: [
                '💡 <strong>Fun fact:</strong> e is the limit of (1 + 1/n)^n as n approaches infinity',
                '🔒 <strong>On-chain value:</strong> Stored with 10 decimal places of precision.'
            ],
            interfaceMethod: 'def get_constant() -> decimal: view'
        });
    }

    setupListeners() {
        const button = document.getElementById('calculate-button');
        if (button) {
            button.addEventListener('click', () => this.calculate());
        }
    }

    async calculate() {
        return await this.withButtonState('calculate-button', async () => {
            console.log('Retrieving e from contract');
            
            const result = await this.contract.get_constant();
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `${this.symbol} ≈ ${parseFloat(resultDecimal).toFixed(10)}`);
            return resultDecimal;
        }, { loading: 'Loading...' });
    }
}
