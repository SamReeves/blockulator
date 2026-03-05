/**
 * Price Suggester Component
 * Suggests optimal pricing for futures using contract's suggest_price function
 * Provides one-click pricing at various premium/discount levels
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class PriceSuggester {
    constructor(factory, futureAddress) {
        this.factory = factory;
        this.futureAddress = futureAddress;
        this.containerElement = null;
        this.expectedValue = null;
        this.pricingOptions = [];
        this.customPremium = 0;
    }

    setContainer(element) {
        this.containerElement = element;
    }

    async loadExpectedValue() {
        try {
            console.log('💵 Loading expected value for pricing...');
            this.expectedValue = await this.factory.getExpectedValue(this.futureAddress);
            console.log(`✅ Base expected value: ${ethers.utils.formatEther(this.expectedValue)} ETH`);
        } catch (error) {
            console.error('Failed to load expected value:', error);
            throw error;
        }
    }

    async calculateSuggestedPrice(premiumPercent) {
        try {
            return await this.factory.suggestPrice(this.futureAddress, premiumPercent);
        } catch (error) {
            console.error(`Failed to calculate price at ${premiumPercent}%:`, error);
            // Fallback: manual calculation
            const multiplier = 1 + (premiumPercent / 100);
            return ethers.BigNumber.from(this.expectedValue).mul(Math.floor(multiplier * 100)).div(100);
        }
    }

    async loadPricingOptions() {
        try {
            console.log('📊 Calculating pricing options...');
            
            // Calculate prices at different premium/discount levels
            const premiumLevels = [30, 20, 10, 0, -10, -20, -30];
            
            this.pricingOptions = await Promise.all(
                premiumLevels.map(async (premium) => {
                    const price = await this.calculateSuggestedPrice(premium);
                    return {
                        premium,
                        price,
                        priceEth: ethers.utils.formatEther(price)
                    };
                })
            );

            console.log(`✅ Calculated ${this.pricingOptions.length} pricing options`);
        } catch (error) {
            console.error('Failed to load pricing options:', error);
            throw error;
        }
    }

    async render() {
        if (!this.containerElement) {
            console.error('Price suggester: Container element not set');
            return;
        }

        try {
            await this.loadExpectedValue();
            await this.loadPricingOptions();
            
            const expectedEth = ethers.utils.formatEther(this.expectedValue);

            this.containerElement.innerHTML = `
                <div class="price-suggester-card">
                    <div class="card-header">
                        <h3>💵 Smart Pricing Assistant</h3>
                        <span class="helper-badge">One-Click</span>
                    </div>
                    
                    <div class="base-value-display">
                        <div class="base-label">📊 Fair Market Value (Expected Value)</div>
                        <div class="base-amount">${parseFloat(expectedEth).toFixed(4)} ETH</div>
                        <small class="base-hint">Based on current distribution position</small>
                    </div>

                    <div class="pricing-strategies">
                        <h4 class="strategies-title">Suggested Pricing Strategies</h4>
                        
                        ${this.pricingOptions.map((option, idx) => {
                            const { premium, price, priceEth } = option;
                            const isPositive = premium > 0;
                            const isNeutral = premium === 0;
                            
                            let strategyInfo = this.getStrategyInfo(premium);
                            let rowClass = isNeutral ? 'fair' : isPositive ? 'premium' : 'discount';
                            
                            return `
                                <div class="pricing-row ${rowClass}" data-index="${idx}">
                                    <div class="strategy-info">
                                        <div class="strategy-name">
                                            <span class="strategy-icon">${strategyInfo.icon}</span>
                                            <span class="strategy-label">${strategyInfo.label}</span>
                                        </div>
                                        <div class="strategy-premium">${premium > 0 ? '+' : ''}${premium}%</div>
                                    </div>
                                    <div class="strategy-price">
                                        <span class="price-amount">${parseFloat(priceEth).toFixed(4)} ETH</span>
                                        <button class="btn-use-price" data-price="${price}" data-premium="${premium}">
                                            Use This Price
                                        </button>
                                    </div>
                                    <div class="strategy-description">${strategyInfo.description}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="custom-pricing-section">
                        <details>
                            <summary>
                                <span class="summary-icon">⚙️</span>
                                <span>Custom Premium/Discount</span>
                            </summary>
                            <div class="custom-pricing-content">
                                <div class="custom-input-group">
                                    <label for="custom-premium-input">
                                        Premium/Discount (%)
                                        <small>Positive for markup, negative for discount</small>
                                    </label>
                                    <div class="input-with-button">
                                        <input 
                                            type="number" 
                                            id="custom-premium-input" 
                                            value="0" 
                                            min="-50" 
                                            max="200" 
                                            step="5"
                                            placeholder="e.g., 15 or -25">
                                        <button id="calc-custom-price" class="btn-secondary">
                                            Calculate
                                        </button>
                                    </div>
                                </div>
                                <div id="custom-result" class="custom-result hidden">
                                    <!-- Dynamic result inserted here -->
                                </div>
                            </div>
                        </details>
                    </div>

                    <div class="pricing-tips">
                        <div class="tip-icon">💡</div>
                        <div class="tip-content">
                            <strong>Pricing Tips:</strong>
                            <ul>
                                <li><strong>Premium pricing</strong> works when demand is high or time value is uncertain</li>
                                <li><strong>Fair value</strong> attracts buyers who understand the math</li>
                                <li><strong>Discount pricing</strong> ensures quick sales and liquidity</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to render price suggester:', error);
            this.containerElement.innerHTML = `
                <div class="price-suggester-card error">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to load pricing suggestions</p>
                    <button class="btn-retry" id="retry-price-load">Retry</button>
                </div>
            `;

            const retryBtn = this.containerElement.querySelector('#retry-price-load');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.render());
            }
        }
    }

    getStrategyInfo(premium) {
        const strategies = {
            30: {
                icon: '🔥',
                label: 'Ultra Premium',
                description: 'For unique or high-demand futures. Captures maximum value.'
            },
            20: {
                icon: '📈',
                label: 'Premium',
                description: 'Higher than fair value. Good for desirable distribution types.'
            },
            10: {
                icon: '💎',
                label: 'Modest Premium',
                description: 'Slight markup. Reasonable for quality futures.'
            },
            0: {
                icon: '⚖️',
                label: 'Fair Value',
                description: 'Mathematical expected value. Most transparent pricing.'
            },
            '-10': {
                icon: '💨',
                label: 'Quick Sale',
                description: 'Small discount for faster liquidity. Attractive to buyers.'
            },
            '-20': {
                icon: '⚡',
                label: 'Fire Sale',
                description: 'Significant discount. Ensures rapid sale.'
            },
            '-30': {
                icon: '🚨',
                label: 'Emergency Exit',
                description: 'Maximum discount. Urgent liquidity needed.'
            }
        };

        return strategies[premium] || strategies[0];
    }

    attachEventListeners() {
        // Use price buttons
        const usePriceButtons = this.containerElement.querySelectorAll('.btn-use-price');
        usePriceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const price = btn.dataset.price;
                const premium = btn.dataset.premium;

                // Emit event with selected price
                eventBus.emit(EVENTS.PRICE_SELECTED, {
                    price,
                    priceWei: price,
                    priceEth: ethers.utils.formatEther(price),
                    premium,
                    futureAddress: this.futureAddress 
                });
                
                // Show confirmation
                eventBus.emit(EVENTS.TOAST, {
                    message: `✅ Price set to ${ethers.utils.formatEther(price)} ETH (${premium > 0 ? '+' : ''}${premium}%)`,
                    type: 'success'
                });

                // Visual feedback
                btn.textContent = '✓ Selected';
                btn.classList.add('selected');
                
                // Reset other buttons
                usePriceButtons.forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.textContent = 'Use This Price';
                        otherBtn.classList.remove('selected');
                    }
                });
            });
        });

        // Custom premium calculator
        const calcButton = this.containerElement.querySelector('#calc-custom-price');
        const premiumInput = this.containerElement.querySelector('#custom-premium-input');
        const customResult = this.containerElement.querySelector('#custom-result');
        
        if (calcButton && premiumInput && customResult) {
            const calculateCustomPrice = async () => {
                const premium = parseInt(premiumInput.value);
                
                if (isNaN(premium)) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: 'Please enter a valid number',
                        type: 'warning'
                    });
                    return;
                }

                calcButton.disabled = true;
                calcButton.textContent = 'Calculating...';
                
                try {
                    const customPrice = await this.calculateSuggestedPrice(premium);
                    const priceEth = ethers.utils.formatEther(customPrice);
                    
                    customResult.innerHTML = `
                        <div class="custom-result-content">
                            <div class="result-label">Calculated Price</div>
                            <div class="result-price">${parseFloat(priceEth).toFixed(4)} ETH</div>
                            <div class="result-premium">${premium > 0 ? '+' : ''}${premium}% ${premium > 0 ? 'premium' : premium < 0 ? 'discount' : 'fair value'}</div>
                            <button class="btn-use-price btn-use-custom" data-price="${customPrice}" data-premium="${premium}">
                                Use Custom Price
                            </button>
                        </div>
                    `;
                    customResult.classList.remove('hidden');
                    
                    // Attach listener to the new button
                    const useCustomBtn = customResult.querySelector('.btn-use-custom');
                    if (useCustomBtn) {
                        useCustomBtn.addEventListener('click', () => {
                            eventBus.emit(EVENTS.PRICE_SELECTED, {
                                price: customPrice,
                                priceWei: customPrice,
                                priceEth,
                                premium,
                                futureAddress: this.futureAddress 
                            });
                            
                            eventBus.emit(EVENTS.TOAST, {
                                message: `✅ Custom price set: ${priceEth} ETH (${premium > 0 ? '+' : ''}${premium}%)`,
                                type: 'success'
                            });
                        });
                    }
                    
                } catch (error) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: 'Failed to calculate custom price',
                        type: 'error'
                    });
                } finally {
                    calcButton.disabled = false;
                    calcButton.textContent = 'Calculate';
                }
            };

            calcButton.addEventListener('click', calculateCustomPrice);
            
            // Also calculate on Enter key
            premiumInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    calculateCustomPrice();
                }
            });
        }
    }

    async refresh() {
        await this.render();
    }

    destroy() {
        if (this.containerElement) {
            this.containerElement.innerHTML = '';
        }
    }
}

