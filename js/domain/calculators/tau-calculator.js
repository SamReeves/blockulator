/**
 * Tau (τ) Calculator Tool
 * Calculate τ = 2π on-chain with high precision
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class TauCalculator extends Calculator {
    getContractName() {
        return 'tau-calculator';
    }

    async onAfterInit() {
        // Load τ value from contract
        try {
            const value = await this.contract.get_constant();
            this.constantValue = this.math.fromFixedPoint(value, 10);
        } catch (error) {
            console.log('Using default τ value');
        }
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `⭕ ${this.symbol} Calculator`,
            description: `Get the mathematical constant ${this.symbol} (tau) = 2π ≈ 6.28318... on-chain with high precision!`,
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
            hint: 'Click the button to retrieve τ from the blockchain'
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>τ (tau)</strong> equals 2π and represents one complete turn around a circle, approximately 6.28318...</p>`,
            features: [
                'More intuitive than π for circular calculations',
                'One full rotation = τ radians (vs 2π radians)',
                'Simplifies many formulas in trigonometry',
                'Gaining popularity in mathematics education'
            ],
            notes: [
                '💡 <strong>Tau Day:</strong> Celebrated on June 28th (6/28)',
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
            console.log('Retrieving τ from contract');
            
            const result = await this.contract.get_constant();
            const resultDecimal = ethers.utils.formatUnits(result, 10);
            
            console.log('Result:', resultDecimal);
            
            this.displayResult(resultDecimal, `${this.symbol} ≈ ${parseFloat(resultDecimal).toFixed(10)}`);
            return resultDecimal;
        }, { loading: 'Loading...' });
    }
}
