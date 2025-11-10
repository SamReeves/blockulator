/**
 * Power of 2 Calculator Tool
 * Calculate 2^x on-chain
 * Domain layer - extends Calculator base class
 */

import { Calculator } from '../models/calculator.js';

export class Pow2Calculator extends Calculator {
    getContractName() {
        return 'pow2-calculator';
    }

    render() {
        const header = this.renderer.createGameHeader({
            title: `⚡ ${this.symbol} Calculator`,
            description: `Calculate ${this.symbol} on-chain! Powers of 2 are fundamental in computer science and binary systems.`,
            contractAddress: this.metadata.contractAddress,
            sourceFile: this.metadata.sourceFile,
            abiFile: this.metadata.abiFile
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls calculator-controls';
        
        controlsDiv.appendChild(this.dom.createInput({
            id: 'input-value',
            label: 'Exponent (x)',
            type: 'number',
            placeholder: 'Enter exponent (e.g., 10)',
            min: -10,
            max: 100,
            step: 0.1
        }));
        
        const hint = document.createElement('div');
        hint.className = 'input-hint';
        hint.textContent = 'Range: [-10, 100]';
        controlsDiv.querySelector('.input-group').appendChild(hint);
        
        controlsDiv.appendChild(this.dom.createButton(
            'calculate-button',
            `Calculate ${this.symbol} On-Chain`
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
            examples: [
                '2^0 = 1',
                '2^10 = 1024',
                '2^-1 = 0.5'
            ]
        });
    }

    renderInfoPanel() {
        return this.renderStandardInfoPanel({
            description: `<p><strong>2^x</strong> calculates powers of 2, fundamental to binary computing.</p>`,
            features: [
                'Binary system foundation (bits, bytes, memory)',
                'Exponential growth patterns',
                'Computer addressing and data structures',
                'Powers of 2 appear everywhere in CS'
            ],
            notes: [
                '💡 <strong>CS Fact:</strong> 2^10 = 1024 ≈ 1K, 2^20 ≈ 1M, 2^30 ≈ 1G',
                '🔒 <strong>On-chain calculation:</strong> Efficient bit-shifting for integer powers, exp approximation for fractional.'
            ]
        });
    }

    setupListeners() {
        this.setupStandardListeners();
    }

    async calculate(inputValue) {
        return await this.executeStandardCalculation(inputValue, {
            min: -10,
            max: 100
        });
    }
}
