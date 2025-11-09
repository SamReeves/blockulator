/**
 * Survivor Pool Component
 * Shows who will split the pool if discussion terminates
 * Displays user's potential payout and complete survivor list
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class SurvivorPool {
    constructor(discussion, web3Provider) {
        this.discussion = discussion;
        this.web3Provider = web3Provider;
        this.containerElement = null;
        this.survivors = [];
        this.potentialPayout = null;
        this.totalPool = null;
    }

    setContainer(element) {
        this.containerElement = element;
    }

    async loadData() {
        try {
            console.log('💫 Loading survivor data...');
            
            const [survivors, potentialPayout, status] = await Promise.all([
                this.discussion.getSurvivors(),
                this.discussion.getPotentialPayout(),
                this.discussion.getStatus()
            ]);

            this.survivors = survivors;
            this.potentialPayout = potentialPayout;
            this.totalPool = status.totalPool;

            console.log(`✅ Loaded ${this.survivors.length} survivors`);
            console.log(`💰 Potential payout: ${ethers.utils.formatEther(this.potentialPayout)} ETH`);
        } catch (error) {
            console.error('Failed to load survivor data:', error);
            throw error;
        }
    }

    async render() {
        if (!this.containerElement) {
            console.error('Survivor pool: Container element not set');
            return;
        }

        try {
            await this.loadData();

            const currentUser = this.web3Provider.currentAddress?.toLowerCase();
            const isUserSurvivor = this.survivors.some(addr => 
                addr.toLowerCase() === currentUser
            );
            
            const payoutEth = ethers.utils.formatEther(this.potentialPayout);
            const poolEth = ethers.utils.formatEther(this.totalPool);

            this.containerElement.innerHTML = `
                <div class="survivor-pool-card ${isUserSurvivor ? 'user-is-survivor' : ''}">
                    <div class="card-header">
                        <h3>👥 Survivor Pool Analysis</h3>
                        ${isUserSurvivor ? '<span class="badge-survivor">✨ You\'re In!</span>' : ''}
                    </div>
                    
                    <div class="pool-stats">
                        <div class="stat-large">
                            <div class="stat-label">Total Pool</div>
                            <div class="stat-value">${parseFloat(poolEth).toFixed(4)} ETH</div>
                        </div>
                        <div class="stat-large">
                            <div class="stat-label">Survivors</div>
                            <div class="stat-value">${this.survivors.length}</div>
                        </div>
                        <div class="stat-large ${isUserSurvivor ? 'highlight' : ''}">
                            <div class="stat-label">Share Each</div>
                            <div class="stat-value">${parseFloat(payoutEth).toFixed(4)} ETH</div>
                        </div>
                    </div>

                    ${isUserSurvivor ? `
                        <div class="user-payout-highlight">
                            <div class="highlight-icon">💰</div>
                            <div class="highlight-text">
                                <strong>Your Potential Payout</strong>
                                <span class="highlight-amount">${parseFloat(payoutEth).toFixed(4)} ETH</span>
                                <small>If discussion terminates now</small>
                            </div>
                        </div>
                    ` : `
                        <div class="info-box">
                            <span class="info-icon">💡</span>
                            <span>Post a message to join the survivor pool and share in the final payout</span>
                        </div>
                    `}

                    <details class="survivor-list" ${this.survivors.length <= 5 ? 'open' : ''}>
                        <summary>
                            <span class="summary-icon">📋</span>
                            <span>View All ${this.survivors.length} Survivor${this.survivors.length !== 1 ? 's' : ''}</span>
                        </summary>
                        <ul class="survivor-addresses">
                            ${this.survivors.map((addr, idx) => {
                                const isCurrentUser = addr.toLowerCase() === currentUser;
                                const short = `${addr.slice(0, 10)}...${addr.slice(-8)}`;
                                return `
                                    <li class="${isCurrentUser ? 'current-user' : ''}">
                                        <span class="survivor-number">${idx + 1}.</span>
                                        <code class="survivor-address" title="${addr}">${short}</code>
                                        ${isCurrentUser ? '<span class="badge-you">YOU</span>' : ''}
                                        <div class="survivor-actions">
                                            <button class="btn-copy-tiny" data-copy="${addr}" title="Copy address">📋</button>
                                            <a href="https://sepolia.etherscan.io/address/${addr}" 
                                               target="_blank" 
                                               class="btn-etherscan-tiny" 
                                               title="View on Etherscan">↗</a>
                                        </div>
                                    </li>
                                `;
                            }).join('')}
                        </ul>
                    </details>

                    <div class="survivor-info-footer">
                        <small>
                            <strong>How it works:</strong> When a discussion terminates (after 7 days of inactivity), 
                            the total pool is split evenly among all unique message authors (survivors).
                        </small>
                    </div>
                </div>
            `;

            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to render survivor pool:', error);
            this.containerElement.innerHTML = `
                <div class="survivor-pool-card error">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to load survivor data</p>
                    <button class="btn-retry" id="retry-survivor-load">Retry</button>
                </div>
            `;

            // Attach retry listener
            const retryBtn = this.containerElement.querySelector('#retry-survivor-load');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.render());
            }
        }
    }

    attachEventListeners() {
        // Copy address buttons
        const copyButtons = this.containerElement.querySelectorAll('.btn-copy-tiny');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const address = btn.dataset.copy;
                try {
                    await navigator.clipboard.writeText(address);
                    eventBus.emit(EVENTS.TOAST, {
                        message: 'Address copied to clipboard',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Failed to copy:', error);
                }
            });
        });
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

