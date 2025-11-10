/**
 * Last Call - The Race to Be Last
 * A game where being LAST wins. Rush to donate at the end of each 10-day round!
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

export class LastCall extends Game {
    constructor() {
        super();
        this.countdownInterval = null;
        this.donationInput = null;
    }

    getContractName() {
        return 'last-call';
    }

    async onAfterInit() {
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: '⏰ Last Call',
            description: 'Be the LAST to donate before time runs out! Rush to be the final player. Winner takes 99% of the pot!',
            contractAddress: CONTRACT_ADDRESSES.LAST_CALL,
            sourceFile: CONTRACT_SOURCES.LAST_CALL,
            abiFile: CONTRACT_ABIS.LAST_CALL
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
                <div class="game-sections">
                    <!-- Compact Round Status -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                        <div style="text-align: center; padding: 1.5rem 0;">
                            <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem;">⏱️ TIME REMAINING</div>
                            <div id="countdown" style="font-size: 2.5rem; font-weight: bold; font-family: monospace; margin-bottom: 0.75rem;">
                                --:--:--
                            </div>
                            <div id="countdown-status" style="font-size: 0.875rem; opacity: 0.9;">Round ends when time expires</div>
                            <button id="end-round-btn" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: rgba(255,255,255,0.2); border: 2px solid white; color: white; border-radius: 8px; font-size: 0.875rem; font-weight: bold; cursor: pointer; display: none;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                🏁 End & Claim
                            </button>
                        </div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.2); padding: 1rem 0;">
                            <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-align: center;">🏆 CURRENT WINNER</div>
                            <div id="current-winner" style="font-family: monospace; font-size: 1rem; font-weight: bold; text-align: center; margin-bottom: 1rem;">
                                No one yet
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; font-size: 0.875rem;">
                                <div style="text-align: center;">
                                    <div style="opacity: 0.8; font-size: 0.7rem; margin-bottom: 0.25rem;">POT</div>
                                    <div id="pot-value" style="font-weight: bold;">0</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="opacity: 0.8; font-size: 0.7rem; margin-bottom: 0.25rem;">PRIZE</div>
                                    <div id="winner-prize" style="font-weight: bold;">0</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="opacity: 0.8; font-size: 0.7rem; margin-bottom: 0.25rem;">ROUND</div>
                                    <div id="round-number" style="font-weight: bold;">#1</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Donate Panel -->
                    <div class="contest-info-panel" style="border: 2px solid #10b981;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                            <span>💰</span>
                            <span>Make Your Move</span>
                        </h3>
                        <div class="game-controls">
                            <div id="donation-amount-input" style="margin-top: 1rem;"></div>
                            
                            <button id="donate-btn" class="btn-play" style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                                🎮 Donate (Become Last!)
                            </button>
                            
                            <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 3px solid #ef4444; font-size: 0.875rem;">
                                <strong style="color: #ef4444;">⏰ Strategy:</strong> Be LAST when timer expires. Each donation resets the countdown. Winner gets 99%!
                            </div>
                        </div>
                    </div>

                    <!-- How It Works - Collapsible -->
                    <details class="contest-info-panel" style="cursor: pointer;">
                        <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                            <span>▶</span>
                            <span>📖 How To Win</span>
                        </summary>
                        <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6;">
                            <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.05); border-radius: 8px; border-left: 3px solid #ef4444; margin-bottom: 0.5rem;">
                                <strong>1. Donate</strong> - Become current winner, reset the 10-day countdown
                            </div>
                            <div style="padding: 0.75rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 3px solid #f59e0b; margin-bottom: 0.5rem;">
                                <strong>2. Watch</strong> - Be LAST donor when time expires
                            </div>
                            <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 3px solid #10b981; margin-bottom: 0.5rem;">
                                <strong>3. Claim</strong> - End round after countdown to win 99%!
                            </div>
                            <div style="padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 3px solid #3b82f6;">
                                <strong>💡 Tip:</strong> Timing is everything! Not too early, not too late.
                            </div>
                        </div>
                    </details>
                </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new ValueInput('donation-amount-input', {
            label: 'Donation Amount',
            hint: 'Try to make the final donation before time runs out!',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
    }

    setupListeners() {
        const donateBtn = document.getElementById('donate-btn');
        const endRoundBtn = document.getElementById('end-round-btn');
        
        if (donateBtn) {
            donateBtn.addEventListener('click', () => this.donate());
        }
        
        if (endRoundBtn) {
            endRoundBtn.addEventListener('click', () => this.endRound());
        }
    }

    async donate() {
        if (!this.requiresWallet('participate')) return;
        
        const amount = this.donationInput.getWeiValue();
        
        if (!amount || amount.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a donation amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.donate({ value: amount }),
                { game: 'last-call', amount: amount.toString() }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '⏰ You are now in the LAST position!',
                type: 'success'
            });
            
            this.donationInput.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Donation failed:', error);
        }
    }

    async endRound() {
        try {
            const canEnd = await this.contract.can_end_round();
            if (!canEnd) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Round cannot be ended yet',
                    type: 'warning'
                });
                return;
            }
            
            await TransactionHandler.execute(
                this.contract.end_round(),
                { game: 'last-call', action: 'end-round' }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '🏁 Round ended! Winner paid out.',
                type: 'success'
            });
            
            await this.refreshState();
            
        } catch (error) {
            console.error('End round failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;
        
        try {
            const [
                roundNumber,
                potValue,
                lastDonor,
                canEnd,
                currentWinnerPrize
            ] = await Promise.all([
                this.contract.round_number(),
                this.contract.pot_value(),
                this.contract.last_donor(),
                this.contract.can_end_round(),
                this.contract.get_current_winner_prize()
            ]);
            
            DOMHelpers.updateInfo('round-number', roundNumber.toString());
            DOMHelpers.updateInfo('pot-value', DOMHelpers.formatWei(potValue));
            
            const winnerEl = document.getElementById('current-winner');
            if (winnerEl) {
                if (lastDonor === '0x0000000000000000000000000000000000000000') {
                    winnerEl.textContent = 'No one yet';
                } else {
                    const isYou = this.web3Provider.isConnected() && 
                                 this.web3Provider.currentAddress &&
                                 lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                    
                    const winnerDisplay = await AddressBadge.createWithAddress(lastDonor, this.web3Provider, {
                        size: 28,
                        formatAddress: true,
                        addressStyle: 'font-size: 1.1rem; font-weight: bold;'
                    });
                    
                    winnerEl.innerHTML = '';
                    if (isYou) {
                        const youLabel = document.createElement('div');
                        youLabel.style.cssText = 'color: #ffd700; margin-bottom: 0.5rem;';
                        youLabel.textContent = '🎉 YOU! 🎉';
                        winnerEl.appendChild(youLabel);
                    }
                    winnerEl.appendChild(winnerDisplay);
                }
            }
            
            DOMHelpers.updateInfo('winner-prize', DOMHelpers.formatWei(currentWinnerPrize[0]));
            this.updateCountdown();
            
            const endRoundBtn = document.getElementById('end-round-btn');
            if (endRoundBtn) {
                endRoundBtn.style.display = canEnd ? 'block' : 'none';
            }
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    async updateCountdown() {
        if (!this.contract) return;
        
        try {
            const timeRemaining = await this.contract.get_time_remaining();
            const seconds = timeRemaining.toNumber();
            
            const countdownEl = document.getElementById('countdown');
            const statusEl = document.getElementById('countdown-status');
            
            if (!countdownEl || !statusEl) return;
            
            if (seconds === 0) {
                countdownEl.textContent = 'ENDED!';
                countdownEl.style.color = '#ff4444';
                statusEl.textContent = 'Round can be ended now!';
                
                const endRoundBtn = document.getElementById('end-round-btn');
                if (endRoundBtn) {
                    endRoundBtn.style.display = 'block';
                }
            } else {
                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                
                if (days > 0) {
                    countdownEl.textContent = `${days}d ${hours}h ${minutes}m`;
                } else if (hours > 0) {
                    countdownEl.textContent = `${hours}h ${minutes}m ${secs}s`;
                } else {
                    countdownEl.textContent = `${minutes}m ${secs}s`;
                }
                
                if (seconds < 3600) {
                    countdownEl.style.color = '#ff4444';
                } else if (seconds < 86400) {
                    countdownEl.style.color = '#ffaa00';
                } else {
                    countdownEl.style.color = 'white';
                }
                
                statusEl.textContent = 'Time until round ends';
            }
            
        } catch (error) {
            console.error('Failed to update countdown:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('DonationReceived', (roundNumber, donor, amount, newPot, deadline) => {
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `⏰ You donated ${DOMHelpers.formatWei(amount)}! You're now LAST!`,
                    type: 'success'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `⚡ ${DOMHelpers.formatAddress(donor)} just donated!`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
        
        this.contract.on('RoundEnded', (roundNumber, winner, prize, fee) => {
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.WINNER_DETERMINED, { player: winner, prize });
                eventBus.emit(EVENTS.CONFETTI);
                eventBus.emit(EVENTS.TOAST, {
                    message: `🎉 YOU WON ${DOMHelpers.formatWei(prize)}!`,
                    type: 'success'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `Round ended. Winner: ${DOMHelpers.formatAddress(winner)}`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
    }

    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        super.destroy();
    }
}

