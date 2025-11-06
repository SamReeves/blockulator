/**
 * King of the Hill - Winner Takes All Edition
 * Pay to dethrone and claim the prize. No refunds. Stakes grow exponentially.
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES } from '../../contracts/addresses.js';

export class KingOfTheHill {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'king-of-the-hill';
        this.updateInterval = null;
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('king-of-the-hill', web3Provider);
        if (!this.contract) return;
        
        this.render();
        this.setupListeners();
        this.setupContractEvents();
        await this.loadState();
        
        // Update reign timer every second
        this.updateInterval = setInterval(() => this.updateReign(), 1000);
    }

    render() {
        // Create header with contract info
        const header = GameRenderer.createGameHeader({
            title: '👑 King of the Hill',
            description: 'Pay to dethrone and win the prize. No refunds. Stakes grow forever.',
            contractAddress: CONTRACT_ADDRESSES.KING_OF_THE_HILL,
            sourceFile: CONTRACT_SOURCES.KING_OF_THE_HILL
        });
        
        // Create rest of the interface
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
                            
                            <div class="input-group">
                                <label for="throne-payment">Your Payment (wei)</label>
                                <input 
                                    type="number" 
                                    id="throne-payment" 
                                    placeholder="Minimum..."
                                    min="0"
                                />
                            </div>
                            
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

                    <!-- History Panel -->
                    <div class="contest-info-panel">
                        <h3>📜 Recent Kings</h3>
                        <div id="history" style="max-height: 400px; overflow-y: auto;">
                            <div class="loading">Loading...</div>
                        </div>
                    </div>
                </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
    }

    setupListeners() {
        const claimBtn = document.getElementById('claim-btn');
        const paymentInput = document.getElementById('throne-payment');
        
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimThrone());
        }
        
        // Auto-fill minimum payment
        if (paymentInput) {
            paymentInput.addEventListener('focus', async () => {
                if (!paymentInput.value) {
                    const minPayment = await this.contract.get_minimum_payment();
                    paymentInput.value = minPayment.toString();
                }
            });
        }
    }

    async claimThrone() {
        const payment = document.getElementById('throne-payment').value;
        
        if (!payment || payment <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a payment amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            const minPayment = await this.contract.get_minimum_payment();
            const paymentBN = ethers.BigNumber.from(payment);
            
            if (paymentBN.lt(minPayment)) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `Payment too low. Minimum: ${minPayment.toString()} wei`,
                    type: 'error'
                });
                return;
            }
            
            // Use TransactionHandler utility
            await TransactionHandler.execute(
                this.contract.claim_throne({ value: paymentBN }),
                { game: 'king-of-the-hill', payment: payment }
            );
            
            // Show custom success message
            eventBus.emit(EVENTS.TOAST, {
                message: '👑 You are now KING!',
                type: 'success'
            });
            
            // Clear input and refresh
            document.getElementById('throne-payment').value = '';
            await this.loadState();
            
        } catch (error) {
            // Error already handled by TransactionHandler
            console.error('Claim failed:', error);
        }
    }

    async loadState() {
        if (!this.contract) return;
        
        try {
            const [
                currentKing,
                currentPrize,
                coronationTime,
                totalDethronements,
                contractBalance,
                minPayment,
                userStats
            ] = await Promise.all([
                this.contract.current_king(),
                this.contract.current_prize(),
                this.contract.coronation_time(),
                this.contract.total_dethronements(),
                this.contract.get_contract_balance(),
                this.contract.get_minimum_payment(),
                this.contract.get_king_stats(this.web3Provider.currentAddress)
            ]);
            
            // Update king display using DOMHelpers
            const kingDisplay = currentKing === '0x0000000000000000000000000000000000000000' 
                ? 'No King Yet' 
                : DOMHelpers.formatAddress(currentKing);
            
            const kingEl = document.getElementById('king-address');
            if (kingEl) {
                const isYouKing = currentKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                if (isYouKing) {
                    kingEl.innerHTML = 
                        `<span style="color: #ffd700;">YOU!</span><br><span style="font-size: 0.875rem; opacity: 0.9;">${kingDisplay}</span>`;
                } else {
                    kingEl.textContent = kingDisplay;
                }
            }
            
            // Update prize using DOMHelpers
            DOMHelpers.updateInfo('current-prize', DOMHelpers.formatWei(currentPrize));
            
            // Update reign time
            this.updateReign();
            
            // Update minimum payment using DOMHelpers
            DOMHelpers.updateInfo('min-payment', DOMHelpers.formatWei(minPayment));
            
            const paymentInput = document.getElementById('throne-payment');
            if (paymentInput) {
                paymentInput.placeholder = `Minimum: ${minPayment.toString()}`;
            }
            
            // Update stats using DOMHelpers
            DOMHelpers.updateInfo('total-dethrone', totalDethronements.toString());
            DOMHelpers.updateInfo('contract-balance', DOMHelpers.formatWei(contractBalance));
            DOMHelpers.updateInfo('your-crowns', userStats[0].toString());
            DOMHelpers.updateInfo('your-reign', DOMHelpers.formatDuration(userStats[1].toNumber()));
            
            // Load history
            await this.loadHistory();
            
        } catch (error) {
            console.error('Failed to load state:', error);
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
            
            // Reverse to show most recent first
            const kings = [...recentKings].reverse();
            
            let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
            kings.forEach((king, idx) => {
                const position = recentKings.length - idx;
                const isYou = king.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                html += `
                    <div style="padding: 0.75rem; background: rgba(0,0,0,0.1); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: bold; color: ${isYou ? '#ffd700' : 'inherit'};">
                                ${isYou ? '👑 YOU' : `#${position}`}
                            </span>
                        </div>
                        <div style="font-family: monospace; font-size: 0.875rem;">
                            ${DOMHelpers.formatAddress(king)}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            historyEl.innerHTML = html;
            
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    updateReign() {
        // This gets called every second to update the reign timer
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
            
            this.loadState();
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}
