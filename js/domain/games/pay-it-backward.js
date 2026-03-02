/**
 * Pay It Backward Game
 * Your donation goes to the previous donor - rewarding those who came before!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { AddressFlow } from '../../presentation/components/address-flow.js';

export class PayItBackward extends Game {
    constructor() {
        super();
        this.donationInput = null;
        this.addressFlow = null;
        this.gameState = {
            lastDonor: '0x0000000000000000000000000000000000000000',
            owner: '0x0000000000000000000000000000000000000000'
        };
    }

    getContractName() {
        return 'pay-it-backward';
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections" style="--panel-color: #8b5cf6; --hero-color: #8b5cf6; --btn-color: #8b5cf6;">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel game-panel">
                    <div class="flex-between" style="margin-bottom: 0.75rem;">
                        <h3 class="game-panel-header">
                            <span>⏪</span>
                            <span>Pay It Backward</span>
                        </h3>
                        <div style="font-size: 0.85rem; font-weight: 500;">Donate → Pay Previous → Wait</div>
                    </div>
                    
                    <div class="game-panel-grid">
                        <!-- Left: Chain Visualization -->
                        <div class="min-w-0">
                            <div id="address-flow-container"></div>
                        </div>
                        
                        <!-- Right: Status + Play -->
                        <div class="min-w-0">
                            <div class="hero-card" style="margin-bottom: 1rem;">
                                <div class="hero-card-label">🎯 Last Donor</div>
                                <div id="last-donor" class="hero-card-content" style="min-height: 1.5rem; font-family: monospace;">
                                    None
                                </div>
                                <div class="hero-card-stats stat-grid">
                                    <div>
                                        <div>Next Gets</div>
                                        <div id="next-recipient" class="value" style="font-size: 0.75rem;">—</div>
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
                                ⏪ Donate & Pay Previous
                            </button>
                        </div>
                    </div>
                </div>

                <!-- How It Works - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>🔄 How Pay It Backward Works</span>
                    </summary>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                        <div class="step-card" style="--step-color: #8b5cf6;">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <strong>First Donor</strong>
                                <span>Pays owner (bootstrap), becomes last donor</span>
                            </div>
                        </div>
                        <div class="step-card" style="--step-color: #ec4899;">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <strong>Second Donor</strong>
                                <span>Pays first donor IMMEDIATELY, becomes new last donor</span>
                            </div>
                        </div>
                        <div class="step-card" style="--step-color: #10b981;">
                            <div class="step-number">∞</div>
                            <div class="step-content">
                                <strong>Chain Continues</strong>
                                <span>Each donor pays previous instantly, becomes new last donor</span>
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
            hint: 'Donate any amount to pay previous donor',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
        
        // Initialize AddressFlow component in backward mode
        this.addressFlow = new AddressFlow('address-flow-container', {
            mode: 'backward'
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
                    game: 'pay-it-backward', 
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
            const [lastDonor, nextRecipient, owner] = await Promise.all([
                this.contract.last_donor(),
                this.contract.get_next_recipient(),
                this.contract.owner()
            ]);

            this.gameState.lastDonor = lastDonor;
            this.gameState.nextRecipient = nextRecipient;
            this.gameState.owner = owner;

            const isZero = lastDonor === '0x0000000000000000000000000000000000000000';

            this.dom.updateInfo('last-donor', 
                isZero ? 'None' : this.dom.formatAddress(lastDonor)
            );
            this.dom.updateInfo('next-recipient', 
                this.dom.formatAddress(nextRecipient)
            );
            
            // Update address flow component
            if (this.addressFlow) {
                this.addressFlow.updateCurrent(lastDonor);
            }
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouLastDonor = lastDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                this.dom.updateInfo('your-status', 
                    isYouLastDonor ? '🎯 YOU' : '—'
                );

                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (isZero) {
                        stateMessage.textContent = '🚀 Be first! Donate to owner.';
                    } else if (isYouLastDonor) {
                        stateMessage.textContent = '🎉 You\'re last! Next donor pays you.';
                    } else {
                        stateMessage.textContent = `💫 Donate to pay ${this.dom.formatAddress(nextRecipient)}`;
                    }
                }
            } else {
                this.dom.updateInfo('your-status', '—');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    stateMessage.textContent = isZero ? 
                        '🚀 No donors yet' : 
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

        this.contract.on('Donation', async (donor, amount, recipient, isFirst, event) => {
            // Add to flow visualization
            if (this.addressFlow) {
                this.addressFlow.addAddress(donor, this.dom.formatWei(amount), 'donated');
            }
            
            await this.refreshState();
            
            if (!this.web3Provider?.currentAddress) return;
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `You paid ${this.dom.formatWei(amount)} to ${this.dom.formatAddress(recipient)}`,
                        type: 'success'
                    });
                } else if (recipient.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `You received ${this.dom.formatWei(amount)} from ${this.dom.formatAddress(donor)}`,
                        type: 'success'
                    });
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

