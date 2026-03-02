/**
 * Pay It Forward Game
 * Your donation goes to the next donor - a chain of generosity!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { AddressFlow } from '../../presentation/components/address-flow.js';

export class PayItForward extends Game {
    constructor() {
        super();
        this.gameState = {
            pendingDonor: '0x0000000000000000000000000000000000000000',
            pendingAmount: 0
        };
        this.donationInput = null;
        this.addressFlow = null;
    }

    getContractName() {
        return 'pay-it-forward';
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections" style="--panel-color: #10b981; --hero-color: #10b981; --btn-color: #10b981;">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel game-panel">
                    <div class="flex-between" style="margin-bottom: 0.75rem;">
                        <h3 class="game-panel-header">
                            <span>⏩</span>
                            <span>Pay It Forward</span>
                        </h3>
                        <div style="font-size: 0.85rem; font-weight: 500;">Donate → Wait → Receive</div>
                    </div>
                    
                    <div class="game-panel-grid">
                        <!-- Left: Chain Visualization -->
                        <div class="min-w-0">
                            <div id="address-flow-container"></div>
                        </div>
                        
                        <!-- Right: Status + Play -->
                        <div class="min-w-0">
                            <div class="hero-card" style="margin-bottom: 1rem;">
                                <div class="hero-card-label">⏳ Pending Donor</div>
                                <div id="pending-donor" class="hero-card-content" style="min-height: 1.5rem; font-family: monospace;">
                                    None
                                </div>
                                <div class="hero-card-stats stat-grid">
                                    <div>
                                        <div>Pending</div>
                                        <div id="pending-amount" class="value">0 wei</div>
                                    </div>
                                    <div>
                                        <div>Your Status</div>
                                        <div id="your-status" class="value">—</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="state-message" class="strategy-callout" style="text-align: center; font-weight: 600; margin-bottom: 1rem;">
                                💡 Loading state...
                            </div>
                            
                            <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-button" class="btn-action">
                                ⏩ Donate & Join Chain
                            </button>
                        </div>
                    </div>
                </div>

                <!-- How It Works - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>🔗 How Pay It Forward Works</span>
                    </summary>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                        <div class="step-card" style="--step-color: #10b981;">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <strong>First Donor</strong>
                                <span>Becomes pending, waits for next person</span>
                            </div>
                        </div>
                        <div class="step-card" style="--step-color: #3b82f6;">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <strong>Second Donor</strong>
                                <span>Receives first donor's amount, becomes new pending</span>
                            </div>
                        </div>
                        <div class="step-card" style="--step-color: #8b5cf6;">
                            <div class="step-number">∞</div>
                            <div class="step-content">
                                <strong>Chain Continues</strong>
                                <span>Each donor receives from pending and becomes new pending</span>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new this.components.ValueInput('donate-amount-input', {
            label: 'Donation Amount',
            hint: 'Donate any amount to join the chain',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
        
        // Initialize AddressFlow component
        this.addressFlow = new AddressFlow('address-flow-container', {
            mode: 'forward'
        });
        this.addressFlow.init();
        this.addressFlow.startAutoUpdate();
    }

    setupListeners() {
        const donateButton = document.getElementById('donate-button');
        
        if (donateButton) {
            donateButton.addEventListener('click', () => this.donate());
        }
    }

    async donate() {
        if (!this.requiresWallet('donate')) return;
        
        const weiAmount = this.donationInput.getWeiValue();
        
        if (!weiAmount || weiAmount.lte(0)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Please enter a donation amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.donate({ value: weiAmount }),
                { 
                    game: 'pay-it-forward', 
                    wei: weiAmount.toString() 
                },
                (isLoading) => {
                    const btn = document.getElementById('donate-button');
                    if (btn) {
                        btn.disabled = isLoading;
                        btn.textContent = isLoading ? '⏳ Donating...' : '💰 Donate';
                    }
                }
            );
            
            this.donationInput.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Donation failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
            const [pendingDonor, pendingAmount] = await Promise.all([
                this.contract.pending_donor(),
                this.contract.pending_amount()
            ]);

            this.gameState.pendingDonor = pendingDonor;
            this.gameState.pendingAmount = pendingAmount;

            const isZero = pendingDonor === '0x0000000000000000000000000000000000000000';
            
            this.dom.updateInfo('pending-donor', 
                isZero ? 'None' : this.dom.formatAddress(pendingDonor)
            );
            this.dom.updateInfo('pending-amount', 
                this.dom.formatWei(pendingAmount)
            );
            
            // Update address flow component
            if (this.addressFlow) {
                this.addressFlow.updateCurrent(pendingDonor, this.dom.formatWei(pendingAmount));
            }
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouPending = pendingDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                this.dom.updateInfo('your-status', 
                    isYouPending ? '🎯 YOU' : '—'
                );

                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (isZero) {
                        stateMessage.textContent = '🚀 Be the first to start the chain!';
                    } else if (isYouPending) {
                        stateMessage.textContent = '⏳ You\'re pending! Next donor pays you.';
                    } else {
                        stateMessage.textContent = '💫 Donate now, receive pending instantly!';
                    }
                }
            } else {
                this.dom.updateInfo('your-status', '—');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    stateMessage.textContent = isZero ? 
                        '🚀 Chain not started' : 
                        '👀 Connect wallet to participate';
                }
            }

        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('Donation', async (donor, amount, received, isFirst, event) => {
            // Add to flow visualization
            if (this.addressFlow) {
                this.addressFlow.addAddress(donor, this.dom.formatWei(amount), 'donated');
            }
            
            await this.refreshState();
            
            if (!this.web3Provider?.currentAddress) return;
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    if (isFirst) {
                        this.events.bus.emit(this.events.EVENTS.TOAST, {
                            message: 'You started the chain. Waiting for next donor.',
                            type: 'success'
                        });
                    } else {
                        this.events.bus.emit(this.events.EVENTS.TOAST, {
                            message: `You received ${this.dom.formatWei(received)} and are now pending`,
                            type: 'success'
                        });
                    }
                }
            }
        });
    }
    
    destroy() {
        if (this.addressFlow) {
            this.addressFlow.destroy();
        }
        super.destroy();
    }
}

