/**
 * King of the Hill - Winner Takes All Edition
 * Pay to dethrone and claim the prize. No refunds. Stakes grow exponentially.
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

export class KingOfTheHill extends Game {
    constructor() {
        super();
        this.updateInterval = null;
        this.paymentInput = null;
    }

    getContractName() {
        return 'king-of-the-hill';
    }

    async onAfterInit() {
        // Call parent to setup events and load initial state
        await super.onAfterInit();
        
        // Update reign timer every second
        this.updateInterval = setInterval(() => this.updateReign(), 1000);
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: '👑 King of the Hill',
            description: 'Pay to dethrone and win the prize. No refunds. Stakes grow forever.',
            contractAddress: CONTRACT_ADDRESSES.KING_OF_THE_HILL,
            sourceFile: CONTRACT_SOURCES.KING_OF_THE_HILL,
            abiFile: CONTRACT_ABIS.KING_OF_THE_HILL
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
                <div class="game-sections">
                    <!-- Current King Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h3 style="color: white;">👑 CURRENT KING</h3>
                        <div style="text-align: center; padding: 2rem 0;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Reigning Champion</div>
                            <div id="king-address" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1rem;">
                                Loading...
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                                <div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.25rem;">CURRENT PRIZE</div>
                                    <div id="current-prize" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.25rem;">REIGN TIME</div>
                                    <div id="reign-time" style="font-size: 1.5rem; font-weight: bold;">0s</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Dethrone Panel -->
                    <div class="contest-info-panel">
                        <h3>⚔️ Claim the Throne</h3>
                        <div class="game-controls">
                            <div class="info-grid" style="margin-bottom: 1rem;">
                                <div class="info-item">
                                    <div class="info-label">Minimum Payment</div>
                                    <div class="info-value" id="min-payment">0 wei</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Required Increase</div>
                                    <div class="info-value">+1000 wei AND +1%</div>
                                </div>
                            </div>
                            
                            <div id="throne-payment-input"></div>
                            
                            <button id="claim-btn" class="btn-play">
                                🎮 Play
                            </button>
                            
                            <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 8px; font-size: 0.875rem;">
                                <strong>How it works:</strong><br>
                                • Pay BOTH: +1000 wei AND +1% (both conditions required)<br>
                                • You immediately win the current prize<br>
                                • Your payment becomes the new prize<br>
                                • No refunds - prize pot grows forever!
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Panel -->
                    <div class="contest-info-panel">
                        <h3>📊 Statistics</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Total Dethronements</div>
                                <div class="info-value" id="total-dethrone">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Contract Balance</div>
                                <div class="info-value" id="contract-balance">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Your Times Crowned</div>
                                <div class="info-value" id="your-crowns">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Your Total Reign</div>
                                <div class="info-value" id="your-reign">0s</div>
                            </div>
                        </div>
                    </div>

                    <!-- History Panel - Collapsible -->
                    <details class="contest-info-panel" style="cursor: pointer;">
                        <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                            <span>▶</span>
                            <span>📜 Recent Kings</span>
                        </summary>
                        <div id="history" style="max-height: 300px; overflow-y: auto; margin-top: 0.75rem;">
                            <div class="loading">Loading...</div>
                        </div>
                    </details>
                </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.paymentInput = new ValueInput('throne-payment-input', {
            label: 'Your Payment',
            hint: 'Amount to claim the throne',
            defaultUnit: 'gwei',
            minWei: '0',
            required: true
        });
        this.paymentInput.render();
    }

    setupListeners() {
        const claimBtn = document.getElementById('claim-btn');
        
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimThrone());
        }
    }

    async claimThrone() {
        if (!this.requiresWallet('claim the throne')) return;
        
        const paymentBN = this.paymentInput.getWeiValue();
        
        if (!paymentBN || paymentBN.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a payment amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            const minPayment = await this.contract.get_minimum_payment();
            
            if (paymentBN.lt(minPayment)) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `Payment too low. Minimum: ${ethers.utils.formatUnits(minPayment, 'gwei')} GWEI`,
                    type: 'error'
                });
                return;
            }
            
            await TransactionHandler.execute(
                this.contract.claim_throne({ value: paymentBN }),
                { game: 'king-of-the-hill', payment: paymentBN.toString() }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '👑 You are now KING!',
                type: 'success'
            });
            
            this.paymentInput.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Claim failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;
        
        try {
            const [
                currentKing,
                currentPrize,
                coronationTime,
                totalDethronements,
                contractBalance,
                minPayment
            ] = await Promise.all([
                this.contract.current_king(),
                this.contract.current_prize(),
                this.contract.coronation_time(),
                this.contract.total_dethronements(),
                this.contract.get_contract_balance(),
                this.contract.get_minimum_payment()
            ]);
            
            let userStats = null;
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                userStats = await this.contract.get_king_stats(this.web3Provider.currentAddress);
            }
            
            const kingEl = document.getElementById('king-address');
            if (kingEl) {
                if (currentKing === '0x0000000000000000000000000000000000000000') {
                    kingEl.textContent = 'No King Yet';
                } else {
                    const isYouKing = this.web3Provider.isConnected() && 
                                       this.web3Provider.currentAddress &&
                                       currentKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                    
                    // Create badge + address display
                    const kingDisplay = await AddressBadge.createWithAddress(currentKing, this.web3Provider, {
                        size: 32,
                        formatAddress: true,
                        addressStyle: 'font-size: 1.25rem; font-weight: bold;',
                        badgeStyle: 'margin-right: 0.5rem;'
                    });
                    
                    if (isYouKing) {
                        kingEl.innerHTML = '';
                        const youLabel = document.createElement('span');
                        youLabel.style.cssText = 'color: #ffd700; display: block; margin-bottom: 0.5rem;';
                        youLabel.textContent = 'YOU!';
                        kingEl.appendChild(youLabel);
                        kingEl.appendChild(kingDisplay);
                    } else {
                        kingEl.innerHTML = '';
                        kingEl.appendChild(kingDisplay);
                    }
                }
            }
            
            DOMHelpers.updateInfo('current-prize', DOMHelpers.formatWei(currentPrize));
            this.updateReign();
            DOMHelpers.updateInfo('min-payment', DOMHelpers.formatWei(minPayment));
            
            DOMHelpers.updateInfo('total-dethrone', totalDethronements.toString());
            DOMHelpers.updateInfo('contract-balance', DOMHelpers.formatWei(contractBalance));
            
            if (userStats) {
                DOMHelpers.updateInfo('your-crowns', userStats[0].toString());
                DOMHelpers.updateInfo('your-reign', DOMHelpers.formatDuration(userStats[1].toNumber()));
            } else {
                DOMHelpers.updateInfo('your-crowns', '👀');
                DOMHelpers.updateInfo('your-reign', 'Read-only');
            }
            
            await this.loadHistory();
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    async loadHistory() {
        try {
            const recentKings = await this.contract.get_recent_kings(20);
            const historyEl = document.getElementById('history');
            
            if (!historyEl) return;
            
            if (recentKings.length === 0) {
                historyEl.innerHTML = 
                    '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">No kings yet. Be the first!</div>';
                return;
            }
            
            const kings = [...recentKings].reverse();
            
            // Create container
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';
            
            // Create entries with badges (async)
            const entries = await Promise.all(kings.map(async (king, idx) => {
                const position = recentKings.length - idx;
                const isYou = this.web3Provider.isConnected() && 
                             this.web3Provider.currentAddress &&
                             king.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                
                const entry = document.createElement('div');
                entry.style.cssText = 'padding: 0.75rem; background: rgba(0,0,0,0.1); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
                
                const label = document.createElement('span');
                label.style.cssText = `font-weight: bold; color: ${isYou ? '#ffd700' : 'inherit'};`;
                label.textContent = isYou ? '👑 YOU' : `#${position}`;
                
                const labelDiv = document.createElement('div');
                labelDiv.appendChild(label);
                entry.appendChild(labelDiv);
                
                // Create badge + address
                const addressDisplay = await AddressBadge.createWithAddress(king, this.web3Provider, {
                    size: 20,
                    formatAddress: true,
                    addressStyle: 'font-family: monospace; font-size: 0.875rem;'
                });
                entry.appendChild(addressDisplay);
                
                return entry;
            }));
            
            entries.forEach(entry => container.appendChild(entry));
            historyEl.innerHTML = '';
            historyEl.appendChild(container);
            
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    updateReign() {
        if (!this.contract) return;
        
        this.contract.get_current_reign_duration()
            .then(duration => {
                const seconds = duration.toNumber();
                DOMHelpers.updateInfo('reign-time', DOMHelpers.formatDuration(seconds));
            })
            .catch(err => console.error('Failed to update reign:', err));
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('NewKing', (newKing, previousKing, payment, prizeWon, newPrize, dethroneNum, timestamp) => {
            const isYou = newKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            const wasYou = previousKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `👑 You won ${DOMHelpers.formatWei(prizeWon)}!`,
                    type: 'success'
                });
            } else if (wasYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: '⚔️ You were dethroned!',
                    type: 'warning'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `👑 New king: ${DOMHelpers.formatAddress(newKing)}`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        super.destroy();
    }
}

