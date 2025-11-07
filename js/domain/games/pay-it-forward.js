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

export class PayItForward extends Game {
    constructor() {
        super();
        this.gameState = {
            pendingDonor: '0x0000000000000000000000000000000000000000',
            pendingAmount: 0
        };
        this.donationInput = null;
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
                <!-- Pending Donor Display -->
                <div class="contest-info-panel" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">⏩</div>
                    <h3 style="color: white; position: relative; z-index: 1;">🎯 PENDING DONOR</h3>
                    <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Awaiting Next Donor</div>
                        <div id="pending-donor" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                            No one yet
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">PENDING AMOUNT</div>
                                <div id="pending-amount" style="font-size: 1.5rem; font-weight: bold;">0 wei</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">CONTRACT BALANCE</div>
                                <div id="contract-balance" style="font-size: 1.5rem; font-weight: bold;">0 wei</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- State Message & Your Status -->
                <div class="contest-info-panel" style="border: 2px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                    <div id="state-message" style="text-align: center; padding: 1.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem;">
                        💡 Loading contract state...
                    </div>
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <span>📊</span>
                        <span>Your Status</span>
                    </h3>
                    <div style="padding: 1.5rem; background: rgba(16, 185, 129, 0.15); border-radius: 12px; border-left: 4px solid #10b981;">
                        <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Status</div>
                        <div id="your-status" style="font-size: 1.5rem; font-weight: bold;">Not pending</div>
                    </div>
                </div>

                <!-- Donate Panel -->
                <div class="contest-info-panel" style="border: 2px solid #3b82f6;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #3b82f6;">
                        <span>💰</span>
                        <span>Make Your Donation</span>
                    </h3>
                    <div class="game-controls">
                        <div id="donate-amount-input" style="margin-top: 1rem;"></div>
                        
                        <button id="donate-button" class="btn-play" style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                            💰 Donate
                        </button>
                        
                        <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                <span style="font-size: 1.5rem;">💡</span>
                                <strong style="font-size: 1.1rem; color: #f59e0b;">How It Works</strong>
                            </div>
                            <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                <li>If no one is pending: You become the first pending donor</li>
                                <li>If someone is pending: You receive their amount instantly!</li>
                                <li>You then become the new pending donor</li>
                                <li>Wait for the next person to pay it forward to you</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- How It Works Panel -->
                <div class="contest-info-panel">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>🔗</span>
                        <span>The Chain of Generosity</span>
                    </h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 4px solid #10b981;">
                                <div style="font-size: 2rem; font-weight: bold; color: #10b981; min-width: 2.5rem;">1</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">First Donor</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Makes initial donation, becomes the pending donor awaiting reward</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #3b82f6; min-width: 2.5rem;">2</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Second Donor</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Receives first donor's amount immediately, becomes new pending donor</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6; min-width: 2.5rem;">3</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Chain Continues</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Each new donor receives the previous pending amount and keeps the chain alive</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(251, 191, 36, 0.05); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; min-width: 2.5rem;">⚠️</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: #f59e0b;">Important Note</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Your donation remains pending until the next person donates. Be patient!</span>
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
            hint: 'Your donation will go to the next donor',
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
            const provider = this.web3Provider.getProvider();
            const [pendingDonor, pendingAmount, balance] = await Promise.all([
                this.contract.pending_donor(),
                this.contract.pending_amount(),
                provider.getBalance(this.contract.address)
            ]);

            this.gameState.pendingDonor = pendingDonor;
            this.gameState.pendingAmount = pendingAmount;

            DOMHelpers.updateInfo('pending-donor', 
                DOMHelpers.formatAddress(pendingDonor)
            );
            DOMHelpers.updateInfo('pending-amount', 
                DOMHelpers.formatWei(pendingAmount)
            );
            DOMHelpers.updateInfo('contract-balance', 
                DOMHelpers.formatWei(balance)
            );
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouPending = pendingDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                DOMHelpers.updateInfo('your-status', 
                    isYouPending ? '🎯 You are pending!' : 'Not pending'
                );

                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (pendingDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 Be the first donor to start the chain!';
                    } else if (isYouPending) {
                        stateMessage.textContent = '⏳ You are pending! Waiting for the next donor to pay you.';
                    } else {
                        stateMessage.textContent = '💫 Donate now and receive the pending amount immediately!';
                    }
                }
            } else {
                DOMHelpers.updateInfo('your-status', '👀 Read-only mode');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (pendingDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 Chain not started yet. Connect wallet to be first!';
                    } else {
                        stateMessage.textContent = '👀 Viewing game state. Connect wallet to participate!';
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

        this.contract.on('Donation', async (donor, amount, received, isFirst, event) => {
            console.log('Donation event:', { donor, amount: amount.toString(), received: received.toString(), isFirst });
            
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
}

