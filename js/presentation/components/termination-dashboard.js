/**
 * Termination Dashboard Component
 * Shows terminatable discussions and allows one-click termination
 * Displays potential outcomes and survivor distributions
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class TerminationDashboard {
    constructor(board, web3Provider, discussionAbi) {
        this.board = board;
        this.web3Provider = web3Provider;
        this.discussionAbi = discussionAbi;
        this.containerElement = null;
        this.terminatableDiscussions = [];
    }

    setContainer(element) {
        this.containerElement = element;
    }

    async loadTerminatableDiscussions() {
        try {
            console.log('🔍 Finding terminatable discussions...');
            
            // Get all discussions
            const allDiscussions = await this.board.getAllDiscussions();
            
            // Check which ones can be terminated
            const terminatableChecks = await Promise.all(
                allDiscussions.map(async (entry) => {
                    const canTerminate = await this.board.canTerminate(entry.address);
                    return { entry, canTerminate };
                })
            );

            // Filter to only terminatable ones
            const terminatableEntries = terminatableChecks
                .filter(check => check.canTerminate)
                .map(check => check.entry);

            // Load full data for each terminatable discussion
            const { Discussion } = await import('../../domain/discussions/discussion.js');
            
            this.terminatableDiscussions = await Promise.all(
                terminatableEntries.map(async (entry) => {
                    try {
                        const discussion = new Discussion(
                            this.web3Provider,
                            entry.address,
                            this.discussionAbi
                        );
                        await discussion.init();

                        const [metadata, status, survivors, potentialPayout] = await Promise.all([
                            discussion.getMetadata(),
                            discussion.getStatus(),
                            discussion.getSurvivors(),
                            discussion.getPotentialPayout()
                        ]);

                        return {
                            address: entry.address,
                            ...metadata,
                            ...status,
                            survivors,
                            potentialPayout,
                            instance: discussion
                        };
                    } catch (error) {
                        console.error(`Failed to load discussion ${entry.address}:`, error);
                        return null;
                    }
                })
            );

            // Filter out failed loads
            this.terminatableDiscussions = this.terminatableDiscussions.filter(d => d !== null);

            console.log(`✅ Found ${this.terminatableDiscussions.length} terminatable discussions`);
        } catch (error) {
            console.error('Failed to load terminatable discussions:', error);
            throw error;
        }
    }

    async render() {
        if (!this.containerElement) {
            console.error('Termination dashboard: Container element not set');
            return;
        }

        this.containerElement.innerHTML = '<div class="loading-state">Finding terminatable discussions...</div>';

        try {
            await this.loadTerminatableDiscussions();

            if (this.terminatableDiscussions.length === 0) {
                this.containerElement.innerHTML = `
                    <div class="termination-dashboard empty">
                        <div class="empty-state">
                            <div class="empty-icon">✅</div>
                            <h3>No Terminatable Discussions</h3>
                            <p>All discussions are currently active. Discussions become terminatable after 7 days of inactivity.</p>
                        </div>
                    </div>
                `;
                return;
            }

            this.containerElement.innerHTML = `
                <div class="termination-dashboard">
                    <div class="dashboard-header">
                        <h3>⚰️ Terminatable Discussions (${this.terminatableDiscussions.length})</h3>
                        <p class="dashboard-description">
                            These discussions have been inactive for 7+ days and can be terminated. 
                            Termination distributes the pool among survivors and frees up board slots.
                        </p>
                    </div>

                    <div class="terminatable-list">
                        ${this.terminatableDiscussions.map((discussion, idx) => 
                            this.renderTerminatableCard(discussion, idx)
                        ).join('')}
                    </div>

                    <div class="termination-info">
                        <div class="info-icon">💡</div>
                        <div class="info-content">
                            <strong>Why terminate?</strong>
                            <ul>
                                <li>Survivors receive their share of the pool</li>
                                <li>Frees up board slot for new discussions</li>
                                <li>You may receive gas refund (minimal)</li>
                                <li>Helps maintain board health</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to render termination dashboard:', error);
            this.containerElement.innerHTML = `
                <div class="termination-dashboard error">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to load terminatable discussions</p>
                    <button class="btn-retry" id="retry-termination-load">Retry</button>
                </div>
            `;

            const retryBtn = this.containerElement.querySelector('#retry-termination-load');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.render());
            }
        }
    }

    renderTerminatableCard(discussion, index) {
        const poolEth = ethers.utils.formatEther(discussion.totalPool);
        const payoutEth = ethers.utils.formatEther(discussion.potentialPayout);
        
        const now = Math.floor(Date.now() / 1000);
        const inactiveDays = Math.floor((now - discussion.lastActivity) / 86400);
        
        const currentUser = this.web3Provider.currentAddress?.toLowerCase();
        const isUserSurvivor = discussion.survivors.some(addr => 
            addr.toLowerCase() === currentUser
        );

        return `
            <div class="terminatable-card" data-index="${index}">
                <div class="card-header">
                    <div class="discussion-info">
                        <h4 class="discussion-subject">${this.escapeHtml(discussion.subject)}</h4>
                        <code class="discussion-address">${discussion.address.slice(0, 10)}...${discussion.address.slice(-8)}</code>
                    </div>
                    <span class="inactive-badge">💀 ${inactiveDays}d inactive</span>
                </div>

                <div class="card-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Pool</span>
                        <span class="stat-value">${parseFloat(poolEth).toFixed(4)} ETH</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Survivors</span>
                        <span class="stat-value">${discussion.survivors.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Share Each</span>
                        <span class="stat-value">${parseFloat(payoutEth).toFixed(4)} ETH</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Messages</span>
                        <span class="stat-value">${discussion.messageCount}</span>
                    </div>
                </div>

                ${isUserSurvivor ? `
                    <div class="survivor-alert">
                        <span class="alert-icon">⚠️</span>
                        <span>You're a survivor! You'll receive <strong>${parseFloat(payoutEth).toFixed(4)} ETH</strong></span>
                    </div>
                ` : ''}

                <div class="termination-preview">
                    <div class="preview-label">What will happen:</div>
                    <ul class="preview-list">
                        <li>✅ ${discussion.survivors.length} survivor${discussion.survivors.length !== 1 ? 's' : ''} each receive ${parseFloat(payoutEth).toFixed(4)} ETH</li>
                        <li>🔓 Board slot freed for new discussion</li>
                        <li>📊 Discussion marked as terminated (visible in history)</li>
                    </ul>
                </div>

                <div class="card-actions">
                    <button class="btn-view-discussion" data-address="${discussion.address}">
                        View Discussion
                    </button>
                    <button class="btn-terminate" data-index="${index}">
                        ⚰️ Terminate & Distribute
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Terminate buttons
        const terminateButtons = this.containerElement.querySelectorAll('.btn-terminate');
        terminateButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                await this.handleTerminate(index);
            });
        });

        // View discussion buttons
        const viewButtons = this.containerElement.querySelectorAll('.btn-view-discussion');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const address = btn.dataset.address;
                const discussion = this.terminatableDiscussions.find(d => d.address === address);
                if (discussion) {
                    eventBus.emit('DISCUSSION_SELECTED', discussion);
                }
            });
        });
    }

    async handleTerminate(index) {
        const discussion = this.terminatableDiscussions[index];
        if (!discussion) return;

        // Confirm termination
        const poolEth = ethers.utils.formatEther(discussion.totalPool);
        const payoutEth = ethers.utils.formatEther(discussion.potentialPayout);
        
        const confirmed = confirm(
            `Terminate "${discussion.subject}"?\n\n` +
            `This will distribute ${poolEth} ETH among ${discussion.survivors.length} survivors ` +
            `(${payoutEth} ETH each).\n\n` +
            `Click OK to proceed.`
        );

        if (!confirmed) return;

        try {
            // Check wallet connection
            if (!this.web3Provider.currentAddress) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Please connect your wallet first',
                    type: 'warning'
                });
                return;
            }

            eventBus.emit(EVENTS.TOAST, {
                message: 'Terminating discussion...',
                type: 'info'
            });

            // Call terminate on the board
            await this.board.terminateDiscussion(discussion.address);

            eventBus.emit(EVENTS.TOAST, {
                message: `✅ Discussion terminated! Pool distributed to ${discussion.survivors.length} survivors.`,
                type: 'success'
            });

            // Refresh the dashboard
            await this.render();

            // Emit event for other components to refresh
            eventBus.emit('DISCUSSION_TERMINATED', { address: discussion.address });

        } catch (error) {
            console.error('Failed to terminate discussion:', error);
            
            let errorMessage = 'Failed to terminate discussion';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for gas';
            }

            eventBus.emit(EVENTS.TOAST, {
                message: errorMessage,
                type: 'error'
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

