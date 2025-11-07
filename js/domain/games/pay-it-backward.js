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

export class PayItBackward extends Game {
    constructor() {
        super();
        this.donationInput = null;
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
            description: 'Donate now, reward the previous donor! Immediate gratification for those who came before.',
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
                <!-- Next Recipient Display -->
                <div class="contest-info-panel" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">⏪</div>
                    <h3 style="color: white; position: relative; z-index: 1;">🎁 NEXT RECIPIENT</h3>
                    <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Will Receive Your Donation</div>
                        <div id="next-recipient" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                            Loading...
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px); margin-top: 1.5rem;">
                            <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">LAST DONOR</div>
                            <div id="last-donor" style="font-size: 1.25rem; font-weight: bold; font-family: monospace;">No one yet</div>
                        </div>
                    </div>
                </div>

                <!-- State Message & Your Status -->
                <div class="contest-info-panel" style="border: 2px solid #8b5cf6; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);">
                    <div id="state-message" style="text-align: center; padding: 1.5rem; background: rgba(139, 92, 246, 0.1); border-radius: 12px; font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem;">
                        💡 Loading contract state...
                    </div>
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <span>📊</span>
                        <span>Your Status</span>
                    </h3>
                    <div style="padding: 1.5rem; background: rgba(139, 92, 246, 0.15); border-radius: 12px; border-left: 4px solid #8b5cf6;">
                        <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Status</div>
                        <div id="your-status" style="font-size: 1.5rem; font-weight: bold;">Not last donor</div>
                    </div>
                </div>

                <!-- Donate Panel -->
                <div class="contest-info-panel" style="border: 2px solid #ec4899;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ec4899;">
                        <span>💰</span>
                        <span>Make Your Donation</span>
                    </h3>
                    <div class="game-controls">
                        <div id="donate-amount-input" style="margin-top: 1rem;"></div>
                        
                        <button id="donate-button" class="btn-play" style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                            💰 Donate
                        </button>
                        
                        <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border-radius: 12px; border-left: 4px solid #10b981;">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                <span style="font-size: 1.5rem;">✅</span>
                                <strong style="font-size: 1.1rem; color: #10b981;">Instant Rewards</strong>
                            </div>
                            <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                <li>Your donation goes IMMEDIATELY to the previous donor</li>
                                <li>You become the new "last donor"</li>
                                <li>The next person to donate will reward YOU</li>
                                <li>No waiting, no pending - instant gratification!</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- How It Works Panel -->
                <div class="contest-info-panel">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>🔄</span>
                        <span>The Backward Chain</span>
                    </h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6; min-width: 2.5rem;">1</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">First Donor</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Donation goes to contract owner (bootstrap), becomes the "last donor"</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(236, 72, 153, 0.05); border-radius: 8px; border-left: 4px solid #ec4899;">
                                <div style="font-size: 2rem; font-weight: bold; color: #ec4899; min-width: 2.5rem;">2</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Second Donor</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Pays the first donor immediately, becomes the new "last donor"</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 4px solid #10b981;">
                                <div style="font-size: 2rem; font-weight: bold; color: #10b981; min-width: 2.5rem;">3</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Chain Continues</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Each donor rewards the one before them and hopes to be rewarded by the next</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #3b82f6; min-width: 2.5rem;">✨</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: #3b82f6;">Key Difference</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Unlike "Pay It Forward", all donations are distributed IMMEDIATELY. No waiting, no pending balance!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new ValueInput('donate-amount-input', {
            label: 'Donation Amount',
            hint: 'Your donation goes to the previous donor',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
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

            DOMHelpers.updateInfo('last-donor', 
                DOMHelpers.formatAddress(lastDonor)
            );
            DOMHelpers.updateInfo('next-recipient', 
                DOMHelpers.formatAddress(nextRecipient)
            );
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouLastDonor = lastDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                DOMHelpers.updateInfo('your-status', 
                    isYouLastDonor ? '🎯 You are the last donor!' : 'Not last donor'
                );

                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (lastDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 Be the first donor! Your donation will go to the contract owner.';
                    } else if (isYouLastDonor) {
                        stateMessage.textContent = '🎉 You are the last donor! You will receive the next donation.';
                    } else {
                        stateMessage.textContent = `💫 Donate now to reward ${DOMHelpers.formatAddress(nextRecipient)} and become the next recipient!`;
                    }
                }
            } else {
                DOMHelpers.updateInfo('your-status', '👀 Read-only mode');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (lastDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 No donors yet. Connect wallet to be first!';
                    } else {
                        stateMessage.textContent = `👀 Next recipient: ${DOMHelpers.formatAddress(nextRecipient)}. Connect wallet to participate!`;
                    }
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
            
            await this.refreshState();
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🎉 You donated ${DOMHelpers.formatWei(amount)} to ${DOMHelpers.formatAddress(recipient)}!`,
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
}

