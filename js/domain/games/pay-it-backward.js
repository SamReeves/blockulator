/**
 * Pay It Backward Game
 * Your donation goes to the previous donor - rewarding those who came before!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';
import { ValueInput } from '../../presentation/components/value-input.js';
import { AddressBadge } from '../../presentation/components/address-badge.js';
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
        const header = GameRenderer.createGameHeader({
            title: '⏪ Pay It Backward',
            description: 'Donate now, reward the previous donor! Instant payouts.',
            contractAddress: CONTRACT_ADDRESSES.PAY_IT_BACKWARD,
            sourceFile: CONTRACT_SOURCES.PAY_IT_BACKWARD,
            abiFile: CONTRACT_ABIS.PAY_IT_BACKWARD
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel" style="border: 2px solid #8b5cf6; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #8b5cf6; margin: 0;">
                            <span>⏪</span>
                            <span>Pay It Backward</span>
                        </h3>
                        <div style="font-size: 0.85rem; color: #8b5cf6; font-weight: 500;">Donate → Pay Previous → Wait</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Chain Visualization -->
                        <div style="min-width: 0;">
                            <div id="address-flow-container"></div>
                        </div>
                        
                        <!-- Right: Status + Play -->
                        <div style="min-width: 0;">
                            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                                <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">🎯 Last Donor</div>
                                <div id="last-donor" style="font-size: 0.85rem; font-weight: bold; word-break: break-all; margin-bottom: 0.75rem; min-height: 1.5rem; font-family: monospace;">
                                    None
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.7rem;">
                                    <div>
                                        <div style="opacity: 0.8;">Next Gets</div>
                                        <div id="next-recipient" style="font-weight: bold; font-size: 0.75rem;">—</div>
                                    </div>
                                    <div>
                                        <div style="opacity: 0.8;">Your Status</div>
                                        <div id="your-status" style="font-weight: bold; font-size: 0.8rem;">—</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="state-message" style="text-align: center; padding: 0.75rem; background: rgba(139, 92, 246, 0.15); border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; border-left: 3px solid #8b5cf6;">
                                💡 Loading...
                            </div>
                            
                            <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-button" class="btn-play" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                                ⏪ Donate & Pay Previous
                            </button>
                        </div>
                    </div>
                </div>

                <!-- How It Works - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">🔄 How Pay It Backward Works</span>
                    </summary>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(139, 92, 246, 0.05); border-radius: 6px; border-left: 3px solid #8b5cf6;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #8b5cf6; min-width: 1.75rem;">1</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">First Donor</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Pays owner (bootstrap), becomes last donor</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(236, 72, 153, 0.05); border-radius: 6px; border-left: 3px solid #ec4899;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #ec4899; min-width: 1.75rem;">2</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Second Donor</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Pays first donor IMMEDIATELY, becomes new last donor</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border-radius: 6px; border-left: 3px solid #10b981;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #10b981; min-width: 1.75rem;">∞</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Chain Continues</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Each donor pays previous instantly, becomes new last donor</span>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new ValueInput('donate-amount-input', {
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
        
        if (!weiAmount || weiAmount.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
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

            DOMHelpers.updateInfo('last-donor', 
                isZero ? 'None' : DOMHelpers.formatAddress(lastDonor)
            );
            DOMHelpers.updateInfo('next-recipient', 
                DOMHelpers.formatAddress(nextRecipient)
            );
            
            // Update address flow component
            if (this.addressFlow) {
                this.addressFlow.updateCurrent(lastDonor);
            }
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouLastDonor = lastDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                DOMHelpers.updateInfo('your-status', 
                    isYouLastDonor ? '🎯 YOU' : '—'
                );

                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (isZero) {
                        stateMessage.textContent = '🚀 Be first! Donate to owner.';
                    } else if (isYouLastDonor) {
                        stateMessage.textContent = '🎉 You\'re last! Next donor pays you.';
                    } else {
                        stateMessage.textContent = `💫 Donate to pay ${DOMHelpers.formatAddress(nextRecipient)}`;
                    }
                }
            } else {
                DOMHelpers.updateInfo('your-status', '—');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    stateMessage.textContent = isZero ? 
                        '🚀 No donors yet' : 
                        '👀 Connect wallet to participate';
                }
            }

        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('Donation', async (donor, amount, recipient, isFirst, event) => {
            console.log('Donation event:', { 
                donor, 
                amount: amount.toString(), 
                recipient, 
                isFirst 
            });
            
            // Add to flow visualization
            if (this.addressFlow) {
                this.addressFlow.addAddress(donor, DOMHelpers.formatWei(amount), 'donated');
            }
            
            await this.refreshState();
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🎉 You paid ${DOMHelpers.formatWei(amount)} to ${DOMHelpers.formatAddress(recipient)}!`,
                        type: 'success'
                    });
                } else if (recipient.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `💰 You received ${DOMHelpers.formatWei(amount)} from ${DOMHelpers.formatAddress(donor)}!`,
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

