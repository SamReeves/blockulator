/**
 * Time to Make the Donuts - The Race to Be First
 * A game where being FIRST wins. Rush to be the first donor of each day!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class TimeToMakeTheDonuts extends Game {
    constructor() {
        super();
        this.countdownInterval = null;
    }

    getContractName() {
        return 'time-to-make-the-donuts';
    }

    async onAfterInit() {
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: '🍩 Time to Make the Donuts',
            description: 'Be the FIRST to donate each day! Set your alarm for midnight UTC. First donor of the day wins yesterday\'s pot (99%)!',
            contractAddress: CONTRACT_ADDRESSES.TIME_TO_MAKE_THE_DONUTS,
            sourceFile: CONTRACT_SOURCES.TIME_TO_MAKE_THE_DONUTS,
            abiFile: CONTRACT_ABIS.TIME_TO_MAKE_THE_DONUTS
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
                <div class="game-sections">
                    <!-- Countdown Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                        <h3 style="color: white;">⏰ NEXT DAY COUNTDOWN</h3>
                        <div style="text-align: center; padding: 2rem 0;">
                            <div id="countdown" style="font-size: 3rem; font-weight: bold; font-family: monospace; margin-bottom: 1rem;">
                                --:--:--
                            </div>
                            <div id="countdown-status" style="font-size: 1rem; opacity: 0.9;">
                                Time until next day (00:00 UTC)
                            </div>
                            <div id="new-day-alert" style="margin-top: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.2); border: 2px solid white; border-radius: 8px; font-weight: bold; display: none;">
                                🚨 NEW DAY! BE FIRST TO WIN! 🚨
                            </div>
                        </div>
                    </div>

                    <!-- Current Status Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
                        <h3 style="color: white;">🏆 TODAY'S STATUS</h3>
                        <div style="text-align: center; padding: 2rem 0;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">First Donor Today</div>
                            <div id="first-donor-today" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1rem;">
                                No one yet
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                                <div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.25rem;">NEXT PRIZE POT</div>
                                    <div id="pot-value" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.25rem;">WINNER GETS (99%)</div>
                                    <div id="winner-prize" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Donate Panel -->
                    <div class="contest-info-panel">
                        <h3>💰 Make Your Move</h3>
                        <div class="game-controls">
                            <div class="info-grid" style="margin-bottom: 1rem;">
                                <div class="info-item">
                                    <div class="info-label">Current Day</div>
                                    <div class="info-value" id="current-day">0</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Total Days</div>
                                    <div class="info-value" id="total-days">1</div>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label for="donation-amount">Donation Amount (wei)</label>
                                <input 
                                    type="number" 
                                    id="donation-amount" 
                                    placeholder="Enter wei amount..."
                                    min="1"
                                />
                            </div>
                            
                            <button id="donate-btn" class="btn-play">
                                🎮 Donate (Try to Be First!)
                            </button>
                            
                            <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 8px; font-size: 0.875rem;">
                                <strong>How it works:</strong><br>
                                • Each day starts at 00:00 UTC<br>
                                • The FIRST person to donate each day wins the previous day's pot<br>
                                • All donations add to tomorrow's prize<br>
                                • Set your alarm and be ready at midnight!<br>
                                • Winner gets 99% of the pot
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
                { game: 'time-to-make-the-donuts', amount: amount }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '🍩 Donation sent! Check if you won!',
                type: 'success'
            });
            
            document.getElementById('donation-amount').value = '';
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
                isNewDay,
                totalDays,
                potentialPrize
            ] = await Promise.all([
                this.contract.current_day(),
                this.contract.pot_value(),
                this.contract.first_donor_today(),
                this.contract.is_new_day_available(),
                this.contract.total_days(),
                this.contract.get_potential_prize()
            ]);
            
            DOMHelpers.updateInfo('current-day', currentDay.toString());
            DOMHelpers.updateInfo('total-days', totalDays.toString());
            DOMHelpers.updateInfo('pot-value', DOMHelpers.formatWei(potValue));
            
            const donorEl = document.getElementById('first-donor-today');
            if (donorEl) {
                const isZeroAddress = firstDonorToday === '0x0000000000000000000000000000000000000000';
                
                if (isZeroAddress) {
                    donorEl.textContent = 'No one yet - BE FIRST!';
                } else {
                    const currentAddress = this.web3Provider?.currentAddress;
                    const isYou = currentAddress && firstDonorToday.toLowerCase() === currentAddress.toLowerCase();
                    
                    if (isYou) {
                        donorEl.innerHTML = 
                            `<span style="color: #ffd700;">🎉 YOU! 🎉</span><br><span style="font-size: 0.875rem; opacity: 0.9;">${DOMHelpers.formatAddress(firstDonorToday)}</span>`;
                    } else {
                        donorEl.textContent = DOMHelpers.formatAddress(firstDonorToday);
                    }
                }
            }
            
            DOMHelpers.updateInfo('winner-prize', DOMHelpers.formatWei(potentialPrize[0]));
            
            const newDayAlert = document.getElementById('new-day-alert');
            if (newDayAlert) {
                newDayAlert.style.display = isNewDay ? 'block' : 'none';
            }
            
            this.updateCountdown();
            
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
            const timeUntilNextDay = await this.contract.get_time_until_next_day();
            const seconds = timeUntilNextDay.toNumber();
            
            const countdownEl = document.getElementById('countdown');
            const statusEl = document.getElementById('countdown-status');
            
            if (!countdownEl || !statusEl) return;
            
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            
            if (seconds < 60) {
                countdownEl.style.color = '#ff4444';
                statusEl.textContent = '⚡ NEW DAY ABOUT TO START! ⚡';
            } else if (seconds < 300) {
                countdownEl.style.color = '#ffaa00';
                statusEl.textContent = 'Get ready! New day soon!';
            } else {
                countdownEl.style.color = 'white';
                statusEl.textContent = 'Time until next day (00:00 UTC)';
            }
            
            const isNewDay = await this.contract.is_new_day_available();
            const newDayAlert = document.getElementById('new-day-alert');
            if (newDayAlert) {
                newDayAlert.style.display = isNewDay ? 'block' : 'none';
            }
            
        } catch (error) {
            console.error('Failed to update countdown:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('DonationReceived', (dayNumber, donor, amount, newPot, isFirstDonor) => {
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isFirstDonor) {
                if (isYou) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🍩 You donated ${DOMHelpers.formatWei(amount)} and were FIRST TODAY!`,
                        type: 'success'
                    });
                } else {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `⚡ ${DOMHelpers.formatAddress(donor)} was first today!`,
                        type: 'info'
                    });
                }
            } else {
                if (isYou) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `You donated ${DOMHelpers.formatWei(amount)} (too late for today!)`,
                        type: 'info'
                    });
                } else {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `${DOMHelpers.formatAddress(donor)} donated (not first)`,
                        type: 'info'
                    });
                }
            }
            
            this.refreshState();
        });
        
        this.contract.on('WinnerPaid', (dayNumber, winner, prize, fee) => {
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.WINNER_DETERMINED, { player: winner, prize });
                eventBus.emit(EVENTS.CONFETTI);
                eventBus.emit(EVENTS.TOAST, {
                    message: `🎉 YOU WON ${DOMHelpers.formatWei(prize)} by being first today!`,
                    type: 'success'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `Winner: ${DOMHelpers.formatAddress(winner)} won ${DOMHelpers.formatWei(prize)}`,
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

