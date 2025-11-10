/**
 * Pay It Forward Game
 * Your donation goes to the next donor - a chain of generosity!
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
        const header = GameRenderer.createGameHeader({
            title: '⏩ Pay It Forward',
            description: 'Donate now, receive the next donation! A chain of generosity.',
            contractAddress: CONTRACT_ADDRESSES.PAY_IT_FORWARD,
            sourceFile: CONTRACT_SOURCES.PAY_IT_FORWARD,
            abiFile: CONTRACT_ABIS.PAY_IT_FORWARD
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel" style="border: 2px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981; margin: 0;">
                            <span>⏩</span>
                            <span>Pay It Forward</span>
                        </h3>
                        <div style="font-size: 0.85rem; color: #10b981; font-weight: 500;">Donate → Wait → Receive</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Chain Visualization -->
                        <div style="min-width: 0;">
                            <div id="address-flow-container"></div>
                        </div>
                        
                        <!-- Right: Status + Play -->
                        <div style="min-width: 0;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                                <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">⏳ Pending Donor</div>
                                <div id="pending-donor" style="font-size: 0.85rem; font-weight: bold; word-break: break-all; margin-bottom: 0.75rem; min-height: 1.5rem; font-family: monospace;">
                                    None
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.7rem;">
                                    <div>
                                        <div style="opacity: 0.8;">Pending</div>
                                        <div id="pending-amount" style="font-weight: bold; font-size: 0.8rem;">0 wei</div>
                                    </div>
                                    <div>
                                        <div style="opacity: 0.8;">Your Status</div>
                                        <div id="your-status" style="font-weight: bold; font-size: 0.8rem;">—</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="state-message" style="text-align: center; padding: 0.75rem; background: rgba(16, 185, 129, 0.15); border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; border-left: 3px solid #10b981;">
                                💡 Loading...
                            </div>
                            
                            <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-button" class="btn-play" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                                ⏩ Donate & Join Chain
                            </button>
                        </div>
                    </div>
                </div>

                <!-- How It Works - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">🔗 How Pay It Forward Works</span>
                    </summary>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border-radius: 6px; border-left: 3px solid #10b981;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #10b981; min-width: 1.75rem;">1</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">First Donor</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Becomes pending, waits for next person</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-radius: 6px; border-left: 3px solid #3b82f6;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #3b82f6; min-width: 1.75rem;">2</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Second Donor</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Receives first donor's amount, becomes new pending</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(139, 92, 246, 0.05); border-radius: 6px; border-left: 3px solid #8b5cf6;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #8b5cf6; min-width: 1.75rem;">∞</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Chain Continues</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Each donor receives from pending and becomes new pending</span>
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
        
        if (!weiAmount || weiAmount.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid donation amount',
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
            
            DOMHelpers.updateInfo('pending-donor', 
                isZero ? 'None' : DOMHelpers.formatAddress(pendingDonor)
            );
            DOMHelpers.updateInfo('pending-amount', 
                DOMHelpers.formatWei(pendingAmount)
            );
            
            // Update address flow component
            if (this.addressFlow) {
                this.addressFlow.updateCurrent(pendingDonor, DOMHelpers.formatWei(pendingAmount));
            }
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouPending = pendingDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                DOMHelpers.updateInfo('your-status', 
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
                DOMHelpers.updateInfo('your-status', '—');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    stateMessage.textContent = isZero ? 
                        '🚀 Chain not started' : 
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

        this.contract.on('Donation', async (donor, amount, received, isFirst, event) => {
            console.log('Donation event:', { donor, amount: amount.toString(), received: received.toString(), isFirst });
            
            // Add to flow visualization
            if (this.addressFlow) {
                this.addressFlow.addAddress(donor, DOMHelpers.formatWei(amount), 'donated');
            }
            
            await this.refreshState();
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    if (isFirst) {
                        eventBus.emit(EVENTS.TOAST, {
                            message: '🎉 You started the chain! Waiting for next donor.',
                            type: 'success'
                        });
                    } else {
                        eventBus.emit(EVENTS.TOAST, {
                            message: `🎉 You received ${DOMHelpers.formatWei(received)} and are now pending!`,
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

