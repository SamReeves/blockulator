/**
 * e^x Estimator Tool
 * On-chain exponential calculation
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';

export class ExpEstimator {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        console.log('e^x Estimator: Contract loading (placeholder)');
        
        this.render();
        this.setupListeners();
    }

    render() {
        const container = this.container;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'game-interface';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = '📈 e^x Estimator';
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = 'Calculate exponential values on-chain. Enter a value for x to compute e^x.';
        
        // Input section
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        
        const label = document.createElement('label');
        label.textContent = 'Value of x';
        label.setAttribute('for', 'exp-input');
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'exp-input';
        input.placeholder = 'Enter x value...';
        input.step = '0.01';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        
        // Calculate button
        const calcButton = document.createElement('button');
        calcButton.className = 'btn-play';
        calcButton.textContent = '🧮 Calculate';
        calcButton.id = 'calc-button';
        
        // Result section
        const resultSection = document.createElement('div');
        resultSection.className = 'blockchain-data';
        resultSection.style.marginTop = '24px';
        
        const resultTitle = document.createElement('h3');
        resultTitle.textContent = '📊 Result';
        
        const resultValue = document.createElement('div');
        resultValue.id = 'result-value';
        resultValue.style.padding = '16px';
        resultValue.style.background = 'var(--bg-primary)';
        resultValue.style.borderRadius = '8px';
        resultValue.style.marginTop = '16px';
        resultValue.style.fontFamily = "'Courier New', monospace";
        resultValue.style.fontSize = '1.5rem';
        resultValue.style.color = 'var(--primary)';
        resultValue.textContent = 'Enter a value and click Calculate';
        
        resultSection.appendChild(resultTitle);
        resultSection.appendChild(resultValue);
        
        wrapper.appendChild(title);
        wrapper.appendChild(description);
        wrapper.appendChild(inputGroup);
        wrapper.appendChild(calcButton);
        wrapper.appendChild(resultSection);
        
        container.appendChild(wrapper);
    }

    setupListeners() {
        const calcButton = document.getElementById('calc-button');
        const input = document.getElementById('exp-input');
        
        const handleCalc = () => this.calculate(input.value);
        
        calcButton.addEventListener('click', handleCalc);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalc();
        });
        
        this.eventListeners.push({ element: calcButton, handler: handleCalc });
    }

    async calculate(x) {
        if (!x) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a value for x',
                type: 'warning'
            });
            return;
        }
        
        try {
            const calcButton = document.getElementById('calc-button');
            const resultValue = document.getElementById('result-value');
            
            calcButton.disabled = true;
            calcButton.textContent = '⏳ Calculating...';
            resultValue.textContent = 'Computing on blockchain...';
            
            // TODO: Call actual contract
            // const result = await this.contract.estimateExp(x);
            
            // Placeholder calculation
            console.log(`Calculating e^${x}`);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const result = Math.exp(parseFloat(x));
            
            resultValue.textContent = `e^${x} ≈ ${result.toFixed(10)}`;
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Calculation complete!',
                type: 'success'
            });
            
        } catch (error) {
            console.error('Calculation failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Calculation failed: ' + error.message,
                type: 'error'
            });
        } finally {
            const calcButton = document.getElementById('calc-button');
            calcButton.disabled = false;
            calcButton.textContent = '🧮 Calculate';
        }
    }

    destroy() {
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners = [];
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

