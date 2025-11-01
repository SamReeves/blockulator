/**
 * Factorial Lookup Tool
 * On-chain factorial computation
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';

export class Factorial {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        console.log('Factorial: Contract loading (placeholder)');
        
        this.render();
        this.setupListeners();
    }

    render() {
        const container = this.container;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'game-interface';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = '🔢 Factorial Lookup';
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = 'Calculate factorial values on-chain. Enter a number n to compute n!';
        
        // Input section
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        
        const label = document.createElement('label');
        label.textContent = 'Value of n';
        label.setAttribute('for', 'factorial-input');
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'factorial-input';
        input.placeholder = 'Enter n value...';
        input.min = '0';
        input.step = '1';
        
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
        resultValue.style.wordBreak = 'break-all';
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
        const input = document.getElementById('factorial-input');
        
        const handleCalc = () => this.calculate(input.value);
        
        calcButton.addEventListener('click', handleCalc);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalc();
        });
        
        this.eventListeners.push({ element: calcButton, handler: handleCalc });
    }

    async calculate(n) {
        if (!n) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a value for n',
                type: 'warning'
            });
            return;
        }
        
        const num = parseInt(n);
        if (num < 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Factorial is only defined for non-negative integers',
                type: 'warning'
            });
            return;
        }
        
        if (num > 170) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Value too large (max 170)',
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
            // const result = await this.contract.factorial(n);
            
            // Placeholder calculation
            console.log(`Calculating ${n}!`);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const result = this.computeFactorial(num);
            
            resultValue.textContent = `${n}! = ${result}`;
            
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

    computeFactorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result.toExponential(10);
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

