/**
 * Time to Make the Donuts - The Race to Be First
 * A game where being FIRST wins. Rush to be the first donor of each day!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { CountdownWheel } from '../../presentation/components/countdown-wheel.js';

export class TimeToMakeTheDonuts extends Game {
    constructor() {
        super();
        this.countdownWheel = null;
        this.donationInput = null;
    }

    getContractName() {
        return 'time-to-make-the-donuts';
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections" style="--panel-color: #ec4899; --hero-color: #f59e0b; --btn-color: #ec4899;">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel game-panel">
                    <div class="flex-between" style="margin-bottom: 0.75rem;">
                        <h3 class="game-panel-header">
                            <span>🍩</span>
                            <span>Make the Donuts</span>
                        </h3>
                        <div style="font-size: 0.85rem; font-weight: 500;">First donor after midnight UTC wins</div>
                    </div>
                    
                    <div class="game-panel-grid">
                        <!-- Left: Countdown Wheel -->
                        <div class="min-w-0">
                            <div id="countdown-wheel-container"></div>
                        </div>
                        
                        <!-- Right: Status + Play -->
                        <div class="min-w-0">
                            <div class="hero-card" style="margin-bottom: 1rem;">
                                <div class="hero-card-label">🏆 First Donor Today</div>
                                <div id="first-donor-today" class="hero-card-content" style="min-height: 1.5rem;">
                                    No one yet
                                </div>
                                <div class="hero-card-stats stat-grid-3">
                                    <div>
                                        <div>Prize Pool</div>
                                        <div id="pot-value" class="value">0 wei</div>
                                    </div>
                                    <div>
                                        <div>Winner Gets</div>
                                        <div id="winner-prize" class="value">0 wei</div>
                                    </div>
                                    <div>
                                        <div>Day</div>
                                        <div id="current-day" class="value">0</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="donation-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-btn" class="btn-action">
                                🎮 Donate & Race to Win
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Game Rules - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📖 How To Win</span>
                    </summary>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                        <div class="step-card" style="--step-color: #ec4899;">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <strong>Wait For Midnight UTC</strong>
                                <span>Each day starts at 00:00 UTC - watch the countdown closely</span>
                            </div>
                        </div>
                        <div class="step-card" style="--step-color: #f59e0b;">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <strong>Be First To Donate</strong>
                                <span>Race to submit your donation as soon as the day changes</span>
                            </div>
                        </div>
                        <div class="step-card" style="--step-color: #10b981;">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <strong>Win the Prize Pool</strong>
                                <span>First donor wins 100% of yesterday's pot automatically!</span>
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Stats - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📊 Stats</span>
                    </summary>
                    <div class="stat-box" style="margin-top: 0.75rem; font-size: 0.8rem; --stat-color: #ec4899;">
                        <div class="stat-box-label">Total Days</div>
                        <div id="total-days" class="stat-box-value" style="font-size: 0.9rem;">1</div>
                    </div>
                </details>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new this.components.ValueInput('donation-amount-input', {
            label: 'Donation Amount',
            hint: 'Any amount helps grow the prize pool',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
        
        // Initialize CountdownWheel component
        this.countdownWheel = new CountdownWheel('countdown-wheel-container', {
            timeGetter: async () => {
                if (!this.contract) return 0;
                const timeUntilNextDay = await this.contract.get_time_until_next_day();
                return timeUntilNextDay.toNumber();
            }
        });
        this.countdownWheel.init();
    }

    setupListeners() {
        const donateBtn = document.getElementById('donate-btn');
        
        if (donateBtn) {
            donateBtn.addEventListener('click', () => this.donate());
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
                { game: 'time-to-make-the-donuts', amount: amount.toString() }
            );
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Donation sent. Check if you won.',
                type: 'success'
            });
            
            this.donationInput.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Donation failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;
        
        try {
            const [
                currentDay,
                potValue,
                firstDonorToday,
                totalDays,
                potentialPrize
            ] = await Promise.all([
                this.contract.current_day(),
                this.contract.pot_value(),
                this.contract.first_donor_today(),
                this.contract.total_days(),
                this.contract.get_potential_prize()
            ]);
            
            this.dom.updateInfo('current-day', currentDay.toString());
            this.dom.updateInfo('total-days', totalDays.toString());
            this.dom.updateInfo('pot-value', this.dom.formatWei(potValue));
            this.dom.updateInfo('winner-prize', this.dom.formatWei(potentialPrize[0]));
            
            const donorEl = document.getElementById('first-donor-today');
            if (donorEl) {
                const isZeroAddress = firstDonorToday === '0x0000000000000000000000000000000000000000';
                
                if (isZeroAddress) {
                    donorEl.innerHTML = `🎯 <strong>UNCLAIMED!</strong>`;
                } else {
                    const currentAddress = this.web3Provider?.currentAddress;
                    const isYou = currentAddress && firstDonorToday.toLowerCase() === currentAddress.toLowerCase();
                    
                    if (isYou) {
                        donorEl.innerHTML = `<strong style="color: #ffd700;">🏆 YOU!</strong> ${this.dom.formatAddress(firstDonorToday)}`;
                    } else {
                        donorEl.innerHTML = this.dom.formatAddress(firstDonorToday);
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('DonationReceived', (dayNumber, donor, amount, newPot, isFirstDonor) => {
            if (!this.web3Provider?.currentAddress) {
                this.refreshState();
                return;
            }
            
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isFirstDonor) {
                if (isYou) {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `You were first today! You donated ${this.dom.formatWei(amount)}`,
                        type: 'success'
                    });
                } else {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `${this.dom.formatAddress(donor)} was first today`,
                        type: 'info'
                    });
                }
            } else {
                if (isYou) {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `You donated ${this.dom.formatWei(amount)} (too late for today!)`,
                        type: 'info'
                    });
                } else {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `${this.dom.formatAddress(donor)} donated (not first)`,
                        type: 'info'
                    });
                }
            }
            
            this.refreshState();
        });
        
        this.contract.on('WinnerPaid', (dayNumber, winner, prize, fee) => {
            if (!this.web3Provider?.currentAddress) {
                this.refreshState();
                return;
            }
            
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.WINNER_DETERMINED, { player: winner, prize });
                this.events.bus.emit(this.events.EVENTS.CONFETTI);
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `You won ${this.dom.formatWei(prize)} by being first today!`,
                    type: 'success'
                });
            } else {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `Winner: ${this.dom.formatAddress(winner)} won ${this.dom.formatWei(prize)}`,
                    type: 'info'
                });
            }
            
            this.refreshState();
        });
    }

    destroy() {
        if (this.countdownWheel) {
            this.countdownWheel.destroy();
        }
        super.destroy();
    }
}



