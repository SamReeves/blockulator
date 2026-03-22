/**
 * Expected Value Calculator Component
 * Shows real-time expected value for futures based on distribution type
 * Calculates optimal claim timing
 */

import { eventBus } from '../../infrastructure/events/event-bus.js';

export class ExpectedValueCalculator {
    constructor(factory, futureAddress) {
        this.factory = factory;
        this.futureAddress = futureAddress;
        this.containerElement = null;
        this.expectedValue = null;
        this.futureInfo = null;
    }

    setContainer(element) {
        this.containerElement = element;
    }

    async loadData() {
        try {
            console.log('📊 Loading expected value data...');
            
            const [expectedValue, futureInfo] = await Promise.all([
                this.factory.getExpectedValue(this.futureAddress),
                this.factory.getFutureInfo(this.futureAddress)
            ]);

            this.expectedValue = expectedValue;
            this.futureInfo = futureInfo;

            console.log(`✅ Expected value: ${ethers.utils.formatEther(expectedValue)} ETH`);
            console.log(`📦 Balance: ${ethers.utils.formatEther(futureInfo.balance)} ETH`);
        } catch (error) {
            console.error('Failed to load expected value:', error);
            throw error;
        }
    }

    async render() {
        if (!this.containerElement) {
            console.error('Expected value calc: Container element not set');
            return;
        }

        try {
            await this.loadData();

            const expectedEth = ethers.utils.formatEther(this.expectedValue);
            const balanceEth = ethers.utils.formatEther(this.futureInfo.balance);
            const remainingValue = parseFloat(balanceEth) - parseFloat(expectedEth);
            
            const now = Math.floor(Date.now() / 1000);
            const timeElapsed = now - this.futureInfo.creationTime;
            const lifetime = this.futureInfo.expiryTime - this.futureInfo.creationTime;
            const timeRemaining = this.futureInfo.expiryTime - now;
            const percentElapsed = Math.min(100, (timeElapsed / lifetime * 100));
            const percentRemaining = 100 - percentElapsed;

            const distributionNames = ['Uniform', 'Gaussian', 'Exp Decay', 'Exp Growth', 'Linear Decay', 'Linear Growth'];
            const distName = distributionNames[this.futureInfo.distributionType] || 'Unknown';

            // Format time remaining
            let timeRemainingText = '';
            if (timeRemaining > 86400) {
                const days = Math.floor(timeRemaining / 86400);
                const hours = Math.floor((timeRemaining % 86400) / 3600);
                timeRemainingText = `${days}d ${hours}h`;
            } else if (timeRemaining > 3600) {
                const hours = Math.floor(timeRemaining / 3600);
                const minutes = Math.floor((timeRemaining % 3600) / 60);
                timeRemainingText = `${hours}h ${minutes}m`;
            } else if (timeRemaining > 60) {
                const minutes = Math.floor(timeRemaining / 60);
                timeRemainingText = `${minutes}m`;
            } else {
                timeRemainingText = `${timeRemaining}s`;
            }

            // Calculate payout percentage
            const payoutPercent = parseFloat(balanceEth) > 0 
                ? (parseFloat(expectedEth) / parseFloat(balanceEth) * 100).toFixed(1)
                : '0.0';

            this.containerElement.innerHTML = `
                <div class="expected-value-card">
                    <div class="card-header">
                        <h3>📊 Expected Value Analysis</h3>
                        <span class="distribution-badge">${distName}</span>
                    </div>
                    
                    <div class="value-breakdown">
                        <div class="value-row primary">
                            <span class="label">
                                <span class="label-icon">💰</span>
                                Expected Value Now
                            </span>
                            <span class="value">${parseFloat(expectedEth).toFixed(4)} ETH</span>
                        </div>
                        <div class="value-row">
                            <span class="label">Current Balance</span>
                            <span class="value">${parseFloat(balanceEth).toFixed(4)} ETH</span>
                        </div>
                        <div class="value-row ${remainingValue > 0 ? 'positive' : 'negative'}">
                            <span class="label">Remaining Value</span>
                            <span class="value">${remainingValue.toFixed(4)} ETH</span>
                        </div>
                        <div class="value-row highlight">
                            <span class="label">Payout Rate</span>
                            <span class="value">${payoutPercent}%</span>
                        </div>
                    </div>

                    <div class="time-progress-section">
                        <div class="progress-header">
                            <span class="progress-label">⏰ Time Progress</span>
                            <span class="progress-percent">${percentElapsed.toFixed(1)}% elapsed</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentElapsed}%"></div>
                            <div class="progress-marker" style="left: ${percentElapsed}%">
                                <span class="marker-label">Now</span>
                            </div>
                        </div>
                        <div class="progress-footer">
                            <span class="time-label">Start</span>
                            <span class="time-remaining">${timeRemainingText} remaining</span>
                            <span class="time-label">Expiry</span>
                        </div>
                    </div>

                    <div class="value-insight">
                        <div class="insight-icon">💡</div>
                        <div class="insight-content">
                            <strong>What this means:</strong>
                            <p>
                                If you transfer ownership now, you'll receive <strong>${parseFloat(expectedEth).toFixed(4)} ETH</strong> 
                                and the new owner will get a future with <strong>${remainingValue.toFixed(4)} ETH</strong> remaining.
                            </p>
                        </div>
                    </div>

                    <div class="timing-tips">
                        <details>
                            <summary>⏱️ Optimal Timing Strategy</summary>
                            <div class="tips-content">
                                ${this.getTimingAdvice(this.futureInfo.distributionType, percentElapsed)}
                            </div>
                        </details>
                    </div>
                </div>
            `;

            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to render expected value:', error);
            this.containerElement.innerHTML = `
                <div class="expected-value-card error">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to calculate expected value</p>
                    <button class="btn-retry" id="retry-ev-load">Retry</button>
                </div>
            `;

            const retryBtn = this.containerElement.querySelector('#retry-ev-load');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.render());
            }
        }
    }

    getTimingAdvice(distributionType, percentElapsed) {
        const advice = {
            0: { // Uniform
                description: 'Constant rate distribution',
                tip: 'Value decreases linearly. Any time is equally good based on your needs.'
            },
            1: { // Gaussian
                description: 'Bell curve distribution',
                tip: percentElapsed < 40 ? 'Value is building. Peak payout at ~50% lifetime.' :
                     percentElapsed < 60 ? '🎯 Near peak value! Consider claiming soon.' :
                     'Past peak. Value declining. Consider claiming before further decline.'
            },
            2: { // Exp Decay
                description: 'Front-loaded distribution',
                tip: percentElapsed < 30 ? '⚡ High early value! Consider claiming to capture front-loaded payout.' :
                     'Value declining rapidly. Claim sooner rather than later.'
            },
            3: { // Exp Growth
                description: 'Back-loaded distribution',
                tip: percentElapsed < 70 ? '⏳ Be patient. Value accumulates toward end of lifetime.' :
                     '🎯 Approaching peak value! Consider waiting a bit longer for maximum payout.'
            },
            4: { // Linear Decay
                description: 'Triangular (high start)',
                tip: percentElapsed < 30 ? '🔥 Maximum value at start! Consider claiming early.' :
                     'Value declining steadily. Earlier is better.'
            },
            5: { // Linear Growth
                description: 'Triangular (high end)',
                tip: percentElapsed < 70 ? '⏳ Value increases linearly. Wait for higher payout.' :
                     '🎯 Approaching maximum value! Consider claiming soon.'
            }
        };

        const info = advice[distributionType] || advice[0];
        
        return `
            <div class="timing-advice">
                <h4>${info.description}</h4>
                <p class="advice-tip">${info.tip}</p>
            </div>
        `;
    }

    attachEventListeners() {
        // Future: Add refresh button or auto-refresh
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

