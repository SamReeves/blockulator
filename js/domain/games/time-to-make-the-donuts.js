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
import { ValueInput } from '../../presentation/components/value-input.js';

export class TimeToMakeTheDonuts extends Game {
    constructor() {
        super();
        this.countdownInterval = null;
        this.donationInput = null;
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
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">🍩</div>
                        <h3 style="color: white; position: relative; z-index: 1;">⏰ NEXT DAY COUNTDOWN</h3>
                        <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                            <div id="countdown" style="font-size: 3rem; font-weight: bold; font-family: monospace; margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                                --:--:--
                            </div>
                            <div id="countdown-status" style="font-size: 1rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">
                                Time until next day (00:00 UTC)
                            </div>
                            <div id="new-day-alert" style="margin-top: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.2); border: 2px solid white; border-radius: 12px; font-weight: bold; display: none; backdrop-filter: blur(10px); animation: pulse 2s infinite;">
                                🚨 NEW DAY! BE FIRST TO WIN! 🚨
                            </div>
                        </div>
                    </div>

                    <!-- Current Status Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">🏆</div>
                        <h3 style="color: white; position: relative; z-index: 1;">🏆 TODAY'S STATUS</h3>
                        <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">First Donor Today</div>
                            <div id="first-donor-today" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                                No one yet
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">NEXT PRIZE POT</div>
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
                            <span>Daily Stats</span>
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                            <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Current Day</div>
                                <div id="current-day" style="font-size: 1.5rem; font-weight: bold;">0</div>
                            </div>
                            <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Total Days</div>
                                <div id="total-days" style="font-size: 1.5rem; font-weight: bold;">1</div>
                            </div>
                        </div>
                    </div>

                    <!-- Donate Panel -->
                    <div class="contest-info-panel" style="border: 2px solid #ec4899;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ec4899;">
                            <span>💰</span>
                            <span>Make Your Move</span>
                        </h3>
                        <div class="game-controls">
                            <div class="input-group" style="margin-top: 1rem;">
                                <div id="donation-amount-input"></div>
                            </div>
                            
                            <button id="donate-btn" class="btn-play" style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                                🎮 Donate (Try to Be First!)
                            </button>
                            
                            <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                    <span style="font-size: 1.5rem;">⏰</span>
                                    <strong style="font-size: 1.1rem; color: #f59e0b;">Race To Be First!</strong>
                                </div>
                                <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                    <li>Each day starts at 00:00 UTC (midnight)</li>
                                    <li>The FIRST person to donate wins yesterday's pot</li>
                                    <li>All donations add to tomorrow's prize</li>
                                    <li>Set your alarm - timing is everything!</li>
                                    <li>Winner gets 99% of the accumulated pot</li>
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
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(236, 72, 153, 0.05); border-radius: 8px; border-left: 4px solid #ec4899;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #ec4899; min-width: 2.5rem;">1</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Wait For Midnight UTC</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Each day starts at 00:00 UTC - watch the countdown timer closely</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; min-width: 2.5rem;">2</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Be The First To Donate</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Race to submit your donation as soon as the day changes</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 4px solid #10b981;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #10b981; min-width: 2.5rem;">3</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Claim Your Prize</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">If you're first, you win 99% of yesterday's accumulated pot!</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                    <div style="font-size: 2rem; font-weight: bold; color: #3b82f6; min-width: 2.5rem;">💡</div>
                                    <div>
                                        <strong style="display: block; margin-bottom: 0.25rem; color: #3b82f6;">Pro Strategy</strong>
                                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">The pot grows every day. Later days have bigger prizes but more competition. Choose your timing wisely!</span>
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
        this.donationInput = new ValueInput('donation-amount-input', {
            label: 'Donation Amount',
            hint: 'Donate before midnight to avoid being a donut!',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
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
            eventBus.emit(EVENTS.TOAST, {
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
            
            eventBus.emit(EVENTS.TOAST, {
                message: '🍩 Donation sent! Check if you won!',
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

