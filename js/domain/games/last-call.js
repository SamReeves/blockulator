/**
 * Last Call - The Race to Be Last
 * A game where being LAST wins. Rush to donate at the end of each 10-day round!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';

export class LastCall extends Game {
    constructor() {
        super();
        this.donationInput = null;
    }

    getContractName() {
        return 'last-call';
    }

    async onAfterInit() {
        // Update countdown wheel every second
        setInterval(() => this.updateCountdownWheel(), 1000);
    }

    render() {
        // Clear container first to prevent duplicates
        this.container.innerHTML = '';
        
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
                <!-- Left Column: Countdown & Action -->
                <div class="contest-info-panel" style="border: 2px solid #ef4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444;">
                        <span>⏰</span>
                        <span>Time's Running Out!</span>
                    </h3>
                    
                    <!-- Countdown Display -->
                    <div style="margin: 1.5rem 0; display: flex; flex-direction: column; align-items: center;">
                        <svg width="200" height="200" viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                            <!-- Background circle -->
                            <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(239, 68, 68, 0.1)" stroke-width="12"/>
                            <!-- Progress circle -->
                            <circle id="countdown-progress-circle" cx="100" cy="100" r="75" fill="none" 
                                    stroke="url(#lastcall-gradient)" stroke-width="12" stroke-linecap="round"
                                    stroke-dasharray="471.24" stroke-dashoffset="471.24" 
                                    style="transition: stroke-dashoffset 1s linear;"/>
                            <!-- Gradient -->
                            <defs>
                                <linearGradient id="lastcall-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1"/>
                                    <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 70px;">
                            <div id="countdown-time" style="font-size: 2rem; font-weight: bold; color: #ec4899; font-family: monospace;">--:--:--</div>
                            <div id="countdown-label" style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem;">Until Round Ends</div>
                        </div>
                    </div>
                    
                    <!-- Donation Input -->
                    <div id="donation-amount-input" style="margin-bottom: 1rem;"></div>
                    
                    <button id="donate-btn" class="btn-play" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        💰 Donate (Become Last!)
                    </button>
                    
                    <button id="end-round-btn" style="width: 100%; margin-top: 0.75rem; padding: 0.75rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; color: white; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; display: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                        🏁 End Round & Claim Prize
                    </button>
                    
                    <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 3px solid #ef4444; font-size: 0.85rem;">
                        <strong style="color: #ef4444;">⚡ Strategy:</strong> Be the LAST donor when timer hits zero. Winner gets 99%!
                    </div>
                </div>

                <!-- Right Column: Round Info -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Current Leader -->
                    <div class="contest-info-panel" style="border: 2px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                        <h3 style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; color: #10b981;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <span>🏆</span>
                                <span>Current Leader</span>
                            </span>
                            <span style="font-size: 0.85rem; font-weight: normal;">Round <span id="round-number">#1</span></span>
                        </h3>
                        
                        <div id="current-winner" style="padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; margin-bottom: 1rem; text-align: center; min-height: 60px; display: flex; align-items: center; justify-content: center;">
                            No one yet
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                            <div style="padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; text-align: center;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">💰 Current Pot</div>
                                <div id="pot-value" style="font-size: 1.1rem; font-weight: bold;">0 wei</div>
                            </div>
                            <div style="padding: 0.75rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; text-align: center;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">🎁 Winner Gets</div>
                                <div id="winner-prize" style="font-size: 1.1rem; font-weight: bold;">0 wei</div>
                            </div>
                        </div>
                    </div>

                    <!-- How It Works -->
                    <details class="contest-info-panel" style="cursor: pointer;">
                        <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                            <span>▶</span>
                            <span>📖 How To Win</span>
                        </summary>
                        <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6; display: grid; gap: 0.5rem;">
                            <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 3px solid #10b981;">
                                <strong>1. Donate</strong> - Become current winner, reset 10-day timer
                            </div>
                            <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.05); border-radius: 8px; border-left: 3px solid #ef4444;">
                                <strong>2. Be Last</strong> - Stay in lead when countdown hits zero
                            </div>
                            <div style="padding: 0.75rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 3px solid #f59e0b;">
                                <strong>3. Claim</strong> - End round to win 99% of the pot
                            </div>
                            <div style="padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 3px solid #3b82f6;">
                                <strong>💡 Tip:</strong> Each donation resets the clock. Time your move perfectly!
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new this.components.ValueInput('donation-amount-input', {
            label: 'Donation Amount',
            hint: 'Be the last donor when time expires!',
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
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: 'Round cannot be ended yet',
                    type: 'warning'
                });
                return;
            }
            
            await TransactionHandler.execute(
                this.contract.end_round(),
                { game: 'last-call', action: 'end-round' }
            );
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
            
            this.dom.updateInfo('round-number', `#${roundNumber.toString()}`);
            this.dom.updateInfo('pot-value', this.dom.formatWei(potValue));
            this.dom.updateInfo('winner-prize', this.dom.formatWei(currentWinnerPrize[0]));
            
            const winnerEl = document.getElementById('current-winner');
            if (winnerEl) {
                if (lastDonor === '0x0000000000000000000000000000000000000000') {
                    winnerEl.innerHTML = '<span style="opacity: 0.6;">No one yet</span>';
                } else {
                    const isYou = this.web3Provider.isConnected() && 
                                 this.web3Provider.currentAddress &&
                                 lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                    
                    const winnerDisplay = await AddressBadge.createWithAddress(lastDonor, this.web3Provider, {
                        size: 24,
                        formatAddress: true,
                        addressStyle: 'font-size: 1rem; font-weight: bold;'
                    });
                    
                    winnerEl.innerHTML = '';
                    if (isYou) {
                        const youLabel = document.createElement('div');
                        youLabel.style.cssText = 'color: #10b981; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;';
                        youLabel.textContent = '🎉 YOU ARE WINNING! 🎉';
                        winnerEl.appendChild(youLabel);
                    }
                    winnerEl.appendChild(winnerDisplay);
                }
            }
            
            // Update countdown wheel
            await this.updateCountdownWheel();
            
            const endRoundBtn = document.getElementById('end-round-btn');
            if (endRoundBtn) {
                endRoundBtn.style.display = canEnd ? 'block' : 'none';
            }
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    async updateCountdownWheel() {
        if (!this.contract) return;
        
        try {
            const timeRemaining = await this.contract.get_time_remaining();
            const seconds = timeRemaining.toNumber();
            const totalDuration = 10 * 24 * 60 * 60; // 10 days in seconds
            
            // Update the countdown display manually
            const timeEl = document.getElementById('countdown-time');
            const labelEl = document.getElementById('countdown-label');
            const progressCircle = document.getElementById('countdown-progress-circle');
            
            if (!timeEl || !progressCircle) return;
            
            // Format time display
            if (seconds === 0) {
                timeEl.textContent = 'ENDED!';
                timeEl.style.color = '#ef4444';
                if (labelEl) labelEl.textContent = 'Round Complete';
            } else {
                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                
                if (days > 0) {
                    timeEl.textContent = `${days}d ${hours}h`;
                } else if (hours > 0) {
                    timeEl.textContent = `${hours}h ${minutes}m`;
                } else {
                    timeEl.textContent = `${minutes}m ${secs}s`;
                }
                
                // Color based on urgency
                if (seconds < 3600) {
                    timeEl.style.color = '#ef4444';
                } else if (seconds < 86400) {
                    timeEl.style.color = '#f59e0b';
                } else {
                    timeEl.style.color = '#ec4899';
                }
                
                if (labelEl) labelEl.textContent = 'Until Round Ends';
            }
            
            // Update progress circle
            const circumference = 2 * Math.PI * 75;
            const progress = seconds / totalDuration;
            const offset = circumference * (1 - progress);
            progressCircle.style.strokeDashoffset = offset;
            
        } catch (error) {
            console.error('Failed to update countdown:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('DonationReceived', (roundNumber, donor, amount, newPot, deadline) => {
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `⏰ You donated ${this.dom.formatWei(amount)}! You're now LAST!`,
                    type: 'success'
                });
            } else {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `⚡ ${this.dom.formatAddress(donor)} just donated!`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
        
        this.contract.on('RoundEnded', (roundNumber, winner, prize, fee) => {
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.WINNER_DETERMINED, { player: winner, prize });
                this.events.bus.emit(this.events.EVENTS.CONFETTI);
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `🎉 YOU WON ${this.dom.formatWei(prize)}!`,
                    type: 'success'
                });
            } else {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `Round ended. Winner: ${this.dom.formatAddress(winner)}`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
    }

    destroy() {
        super.destroy();
    }
}

