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

export class LastCall extends Game {
    constructor() {
        super();
        this.countdownInterval = null;
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
                    <!-- Countdown Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">⏰</div>
                        <h3 style="color: white; position: relative; z-index: 1;">⏱️ ROUND COUNTDOWN</h3>
                        <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                            <div id="countdown" style="font-size: 3rem; font-weight: bold; font-family: monospace; margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                                --:--:--
                            </div>
                            <div id="countdown-status" style="font-size: 1rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">
                                Time until round ends
                            </div>
                            <button id="end-round-btn" style="margin-top: 1.5rem; padding: 0.75rem 2rem; background: rgba(255,255,255,0.2); border: 2px solid white; color: white; border-radius: 8px; font-weight: bold; cursor: pointer; display: none; backdrop-filter: blur(10px); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                🏁 End Round & Claim Prize
                            </button>
                        </div>
                    </div>

                    <!-- Current Winner Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">🏆</div>
                        <h3 style="color: white; position: relative; z-index: 1;">🏆 CURRENT WINNER</h3>
                        <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Last Donor (Winning Position)</div>
                            <div id="current-winner" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                                No one yet
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">POT VALUE</div>
                                    <div id="pot-value" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">WINNER GETS (99%)</div>
                                    <div id="winner-prize" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Game Info -->
                    <div class="contest-info-panel" style="border: 2px solid #f59e0b; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>📊</span>
                            <span>Round Info</span>
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                            <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Round Number</div>
                                <div id="round-number" style="font-size: 1.5rem; font-weight: bold;">1</div>
                            </div>
                            <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Round Duration</div>
                                <div style="font-size: 1.5rem; font-weight: bold;">10 days</div>
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
                            <div class="input-group" style="margin-top: 1rem;">
                                <label for="donation-amount" style="font-weight: 600; margin-bottom: 0.5rem; display: block;">Donation Amount (wei)</label>
                                <input 
                                    type="number" 
                                    id="donation-amount" 
                                    placeholder="Enter wei amount..."
                                    min="1"
                                    style="width: 100%; padding: 1rem; background: var(--md-sys-color-surface); border: 2px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-small); color: var(--md-sys-color-on-surface); font-size: 1.1rem; font-family: monospace; transition: border-color 0.2s;"
                                    onfocus="this.style.borderColor='#10b981'"
                                    onblur="this.style.borderColor='var(--md-sys-color-outline)'"
                                />
                            </div>
                            
                            <button id="donate-btn" class="btn-play" style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                                🎮 Donate (Become Last!)
                            </button>
                            
                            <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%); border-radius: 12px; border-left: 4px solid #ef4444;">
                                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                    <span style="font-size: 1.5rem;">⏰</span>
                                    <strong style="font-size: 1.1rem; color: #ef4444;">Race Against Time!</strong>
                                </div>
                                <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                    <li>Each donation resets the 10-day countdown</li>
                                    <li>Be the LAST person to donate before time expires</li>
                                    <li>Winner takes 99% of the entire pot</li>
                                    <li>All donations accumulate - no refunds!</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- How It Works Panel -->
                    <div class="contest-info-panel">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>📖</span>
                            <span>How To Win</span>
                        </h3>
                        <div style="margin-top: 1rem;">
                            <div style="display: grid; gap: 1rem;">
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.05); border-radius: 8px; border-left: 4px solid #ef4444;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #ef4444; min-width: 2.5rem;">1</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Donate Strategically</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Send any amount to become the current winner and reset the countdown</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; min-width: 2.5rem;">2</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Watch The Clock</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Monitor the countdown - you need to be the last donor when time expires</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 4px solid #10b981;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #10b981; min-width: 2.5rem;">3</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Claim Your Prize</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">After the countdown hits zero, end the round to claim 99% of the pot!</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #3b82f6; min-width: 2.5rem;">💡</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: #3b82f6;">Pro Tip</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Timing is everything! Wait too long and someone else might snipe the win. Act too early and you'll reset the clock for others.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
    }

    setupListeners() {
        const donateBtn = document.getElementById('donate-btn');
        const donationInput = document.getElementById('donation-amount');
        const endRoundBtn = document.getElementById('end-round-btn');
        
        if (donateBtn) {
            donateBtn.addEventListener('click', () => this.donate());
        }
        
        if (donationInput) {
            donationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.donate();
                }
            });
        }
        
        if (endRoundBtn) {
            endRoundBtn.addEventListener('click', () => this.endRound());
        }
    }

    async donate() {
        if (!this.requiresWallet('participate')) return;
        
        const amount = document.getElementById('donation-amount').value;
        
        if (!amount || amount <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a donation amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            const amountBN = ethers.BigNumber.from(amount);
            
            await TransactionHandler.execute(
                this.contract.donate({ value: amountBN }),
                { game: 'last-call', amount: amount }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '⏰ You are now in the LAST position!',
                type: 'success'
            });
            
            document.getElementById('donation-amount').value = '';
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
            
            const winnerDisplay = lastDonor === '0x0000000000000000000000000000000000000000' 
                ? 'No one yet' 
                : DOMHelpers.formatAddress(lastDonor);
            
            const winnerEl = document.getElementById('current-winner');
            if (winnerEl) {
                const isYou = lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                if (isYou && lastDonor !== '0x0000000000000000000000000000000000000000') {
                    winnerEl.innerHTML = 
                        `<span style="color: #ffd700;">🎉 YOU! 🎉</span><br><span style="font-size: 0.875rem; opacity: 0.9;">${winnerDisplay}</span>`;
                } else {
                    winnerEl.textContent = winnerDisplay;
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

