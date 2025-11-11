/**
 * King of the Hill - Winner Takes All Edition
 * Pay to dethrone and claim the prize. No refunds. Stakes grow exponentially.
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { KingLadder } from '../../presentation/components/king-ladder.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';

export class KingOfTheHill extends Game {
    constructor() {
        super();
        this.paymentInput = null;
        this.kingLadder = null;
        this.updateInterval = null;
    }

    getContractName() {
        return 'king-of-the-hill';
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Main Panel -->
                <div class="contest-info-panel" style="border: 2px solid #764ba2; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #764ba2; margin: 0;">
                            <span>👑</span>
                            <span>King of the Hill</span>
                        </h3>
                        <div style="font-size: 0.75rem; color: #764ba2;">
                            <span id="total-dethrone-badge">0</span> battles
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Controls -->
                        <div style="min-width: 0;">
                            <div style="background: rgba(118, 75, 162, 0.15); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; border-left: 3px solid #764ba2;">
                                <div style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.3rem;">Min Payment</div>
                                <div id="min-payment" style="font-size: 0.95rem; font-weight: bold; color: #764ba2;">
                                    0 wei
                                </div>
                            </div>
                            
                            <div id="throne-payment-input" style="margin-bottom: 0.75rem;"></div>
                            
                            <button id="claim-btn" class="btn-play" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);">
                                ⚔️ Dethrone King
                            </button>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.75rem;">
                                <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 4px;">
                                    <div style="opacity: 0.7; margin-bottom: 0.2rem;">Crowns</div>
                                    <div id="your-crowns" style="font-weight: bold; font-size: 0.8rem;">—</div>
                                </div>
                                <div style="padding: 0.5rem; background: rgba(245, 158, 11, 0.1); border-radius: 4px;">
                                    <div style="opacity: 0.7; margin-bottom: 0.2rem;">Total Reign</div>
                                    <div id="your-reign" style="font-weight: bold; font-size: 0.8rem;">—</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right: King Ladder -->
                        <div style="min-width: 0;">
                            <div id="king-ladder-container"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.paymentInput = new this.components.ValueInput('throne-payment-input', {
            label: 'Your Payment',
            hint: 'Pay more to dethrone',
            defaultUnit: 'gwei',
            minWei: '0',
            required: true
        });
        this.paymentInput.render();
        
        // Initialize KingLadder component
        this.kingLadder = new KingLadder('king-ladder-container', {
            maxVisible: 8,
            currentAddress: this.web3Provider?.currentAddress
        });
        this.kingLadder.init();
        
        // Start updating reign time
        this.updateInterval = setInterval(() => {
            if (this.kingLadder) {
                this.refreshState();
            }
        }, 5000); // Update every 5 seconds
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
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Please enter a payment amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            const minPayment = await this.contract.get_minimum_payment();
            
            if (paymentBN.lt(minPayment)) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `Payment too low. Minimum: ${ethers.utils.formatUnits(minPayment, 'gwei')} GWEI`,
                    type: 'error'
                });
                return;
            }
            
            await TransactionHandler.execute(
                this.contract.claim_throne({ value: paymentBN }),
                { game: 'king-of-the-hill', payment: paymentBN.toString() }
            );
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
                totalDethronements,
                minPayment,
                reignDuration
            ] = await Promise.all([
                this.contract.current_king(),
                this.contract.current_prize(),
                this.contract.total_dethronements(),
                this.contract.get_minimum_payment(),
                this.contract.get_current_reign_duration()
            ]);
            
            let userStats = null;
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                userStats = await this.contract.get_king_stats(this.web3Provider.currentAddress);
            }
            
            const isYouKing = this.web3Provider.isConnected() && 
                             this.web3Provider.currentAddress &&
                             currentKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            // Update king ladder
            if (this.kingLadder) {
                this.kingLadder.updateCurrentKing({
                    address: currentKing,
                    prize: this.dom.formatWei(currentPrize),
                    reignDuration: reignDuration.toNumber(),
                    isYou: isYouKing
                });
                this.kingLadder.updateCurrentAddress(this.web3Provider?.currentAddress);
            }
            
            this.dom.updateInfo('min-payment', this.dom.formatWei(minPayment));
            
            // Update badges
            const badge = document.getElementById('total-dethrone-badge');
            if (badge) badge.textContent = totalDethronements.toString();
            
            if (userStats) {
                this.dom.updateInfo('your-crowns', userStats[0].toString());
                this.dom.updateInfo('your-reign', this.dom.formatDuration(userStats[1].toNumber()));
            } else {
                this.dom.updateInfo('your-crowns', '—');
                this.dom.updateInfo('your-reign', '—');
            }
            
            await this.loadHistory();
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    async loadHistory() {
        if (!this.kingLadder) return;
        
        try {
            const recentKings = await this.contract.get_recent_kings(10);
            
            // Reverse to show most recent first (excluding current king)
            const kings = [...recentKings].reverse().slice(1); // Skip first (current king already shown)
            
            this.kingLadder.setKings(kings);
            
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('NewKing', (newKing, previousKing, payment, prizeWon, newPrize, dethroneNum, timestamp) => {
            const isYou = newKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            const wasYou = previousKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `👑 You won ${this.dom.formatWei(prizeWon)}!`,
                    type: 'success'
                });
                this.events.bus.emit(this.events.EVENTS.CONFETTI);
            } else if (wasYou) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: '⚔️ You were dethroned!',
                    type: 'warning'
                });
            } else {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `👑 New king: ${this.dom.formatAddress(newKing)}`,
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

