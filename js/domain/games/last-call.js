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
            <div class="game-panel-grid" style="margin-top: 1rem; --panel-color: #ef4444; --btn-color: #10b981;">
                <!-- Left Column: Countdown & Action -->
                <div class="contest-info-panel game-panel">
                    <h3 class="game-panel-header">
                        <span>⏰</span>
                        <span>Time Remaining</span>
                    </h3>
                    
                    <!-- Countdown Display -->
                    <div class="countdown-container" style="--countdown-color: #ef4444;">
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
                        <div class="countdown-overlay">
                            <div id="countdown-time" class="countdown-time">--:--:--</div>
                            <div id="countdown-label" class="countdown-label">Until Round Ends</div>
                        </div>
                    </div>
                    
                    <!-- Donation Input -->
                    <div id="donation-amount-input" style="margin-bottom: 1rem;"></div>
                    
                    <button id="donate-btn" class="btn-action">
                        💰 Donate — Become the Last Donor
                    </button>
                    
                    <button id="end-round-btn" class="btn-action-secondary" style="--btn-color: #f59e0b; display: none;">
                        🏁 End Round & Claim Prize
                    </button>
                    
                    <div class="strategy-callout">
                        <strong>⚡ Strategy:</strong> Be the LAST donor when timer hits zero. Winner gets 100% of the pot!
                    </div>
                </div>

                <!-- Right Column: Round Info -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Current Leader -->
                    <div class="contest-info-panel game-panel" style="--panel-color: #10b981;">
                        <h3 class="flex-between game-panel-header" style="margin-bottom: 1rem;">
                            <span class="flex-center-gap">
                                <span>🏆</span>
                                <span>Current Leader</span>
                            </span>
                            <span style="font-size: 0.85rem; font-weight: normal;">Round <span id="round-number">#1</span></span>
                        </h3>
                        
                        <div id="current-winner" class="stat-box" style="margin-bottom: 1rem; text-align: center; min-height: 60px; display: flex; align-items: center; justify-content: center;">
                            No one yet
                        </div>
                        
                        <div class="stat-grid">
                            <div class="stat-box" style="--stat-color: #3b82f6; text-align: center;">
                                <div class="stat-box-label">💰 Current Pot</div>
                                <div id="pot-value" class="stat-box-value" style="font-size: 1.1rem;">0 wei</div>
                            </div>
                            <div class="stat-box" style="--stat-color: #f59e0b; text-align: center;">
                                <div class="stat-box-label">🎁 Winner Gets</div>
                                <div id="winner-prize" class="stat-box-value" style="font-size: 1.1rem;">0 wei</div>
                            </div>
                        </div>
                    </div>

                    <!-- How It Works -->
                    <details class="contest-info-panel" style="cursor: pointer;">
                        <summary class="collapsible-summary">
                            <span class="collapsible-arrow">▶</span>
                            <span>📖 How To Win</span>
                        </summary>
                        <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6; display: grid; gap: 0.5rem;">
                            <div class="step-card" style="--step-color: #10b981;">
                                <strong>1. Donate</strong> - Become current winner, reset 10-day timer
                            </div>
                            <div class="step-card" style="--step-color: #ef4444;">
                                <strong>2. Be Last</strong> - Stay in lead when countdown hits zero
                            </div>
                            <div class="step-card" style="--step-color: #f59e0b;">
                                <strong>3. Claim</strong> - End round to win the entire pot
                            </div>
                            <div class="step-card" style="--step-color: #3b82f6;">
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
                message: 'You are now in the last position',
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
                message: 'Round ended. Winner paid out.',
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
                    
                    const winnerDisplay = await this.components.AddressBadge.createWithAddress(lastDonor, this.web3Provider, {
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
            const [timeRemaining, lastDonor] = await Promise.all([
                this.contract.get_time_remaining(),
                this.contract.last_donor()
            ]);
            
            const seconds = timeRemaining.toNumber();
            const ROUND_DURATION = 864000; // 10 days in seconds (matches contract constant)
            
            // Update the countdown display manually
            const timeEl = document.getElementById('countdown-time');
            const labelEl = document.getElementById('countdown-label');
            const progressCircle = document.getElementById('countdown-progress-circle');
            
            if (!timeEl || !progressCircle) return;
            
            // Check if round has started
            const roundStarted = lastDonor !== '0x0000000000000000000000000000000000000000';
            
            // Format time display
            if (seconds === 0) {
                timeEl.textContent = 'ENDED!';
                timeEl.style.color = '#ef4444';
                if (labelEl) labelEl.textContent = 'Round Complete';
            } else if (!roundStarted) {
                timeEl.textContent = 'Waiting';
                timeEl.style.color = '#ec4899';
                if (labelEl) labelEl.textContent = 'For First Donation';
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
            
            // Update progress circle (shows time elapsed, not remaining)
            const circumference = 2 * Math.PI * 75;
            if (!roundStarted) {
                // Full circle when waiting for first donation
                progressCircle.style.strokeDashoffset = 0;
            } else {
                const timeElapsed = ROUND_DURATION - seconds;
                const progress = timeElapsed / ROUND_DURATION;
                const offset = circumference * (1 - progress);
                progressCircle.style.strokeDashoffset = offset;
            }
            
        } catch (error) {
            console.error('Failed to update countdown:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('DonationReceived', (roundNumber, donor, amount, newPot, deadline) => {
            if (!this.web3Provider?.currentAddress) {
                this.refreshState();
                return;
            }
            
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `You donated ${this.dom.formatWei(amount)} and are now last`,
                    type: 'success'
                });
            } else {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `${this.dom.formatAddress(donor)} just donated`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
        
        this.contract.on('RoundEnded', (roundNumber, winner, prize, fee) => {
            if (!this.web3Provider?.currentAddress) {
                this.refreshState();
                return;
            }
            
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.WINNER_DETERMINED, { player: winner, prize });
                this.events.bus.emit(this.events.EVENTS.CONFETTI);
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `You won ${this.dom.formatWei(prize)}!`,
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

