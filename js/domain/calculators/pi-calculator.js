/**
 * Pi (π) Calculator Tool
 * Calculate π on-chain with high precision
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class PiCalculator extends Calculator {
    getContractName() {
        return 'pi-calculator';
    }

    async onAfterInit() {
        // Load π value from contract
        try {
            const value = await this.contract.get_constant();
            this.constantValue = this.math.fromFixedPoint(value, 10);
        } catch (error) {
            console.log('Using default π value');
        }
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `🥧 ${this.symbol} Calculator`,
            description: `Get the mathematical constant ${this.symbol} (pi) ≈ 3.14159... on-chain with high precision!`,
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
            hint: 'Click the button to retrieve π from the blockchain'
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>π (pi)</strong> is the ratio of a circle's circumference to its diameter, approximately 3.14159...</p>`,
            features: [
                'Fundamental constant in geometry and trigonometry',
                'Appears in Euler\'s formula: e^(iπ) + 1 = 0',
                'Used in circular motion, waves, and oscillations',
                'Essential for engineering and physics calculations'
            ],
            notes: [
                '💡 <strong>Fun fact:</strong> π is irrational and transcendental',
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
            console.log('Retrieving π from contract');
            
            const result = await this.contract.get_constant();
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `${this.symbol} ≈ ${parseFloat(resultDecimal).toFixed(10)}`);
            return resultDecimal;
        }, { loading: 'Loading...' });
    }
}
