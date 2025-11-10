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
import { AddressBadge } from '../../presentation/components/address-badge.js';
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
        const header = GameRenderer.createGameHeader({
            title: '🍩 Time to Make the Donuts',
            description: 'Be the FIRST to donate each day! First donor of the day wins yesterday\'s pot (99%)!',
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
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel" style="border: 2px solid #ec4899; background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ec4899; margin: 0;">
                            <span>🍩</span>
                            <span>Make the Donuts</span>
                        </h3>
                        <div style="font-size: 0.85rem; color: #ec4899; font-weight: 500;">Be FIRST at midnight UTC!</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Countdown Wheel -->
                        <div style="min-width: 0;">
                            <div id="countdown-wheel-container"></div>
                        </div>
                        
                        <!-- Right: Status + Play -->
                        <div style="min-width: 0;">
                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                                <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">🏆 First Donor Today</div>
                                <div id="first-donor-today" style="font-size: 0.85rem; font-weight: bold; word-break: break-all; margin-bottom: 0.75rem; min-height: 1.5rem;">
                                    No one yet
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; font-size: 0.7rem;">
                                    <div>
                                        <div style="opacity: 0.8;">Prize Pool</div>
                                        <div id="pot-value" style="font-weight: bold; font-size: 0.8rem;">0 wei</div>
                                    </div>
                                    <div>
                                        <div style="opacity: 0.8;">Winner Gets</div>
                                        <div id="winner-prize" style="font-weight: bold; font-size: 0.8rem;">0 wei</div>
                                    </div>
                                    <div>
                                        <div style="opacity: 0.8;">Day</div>
                                        <div id="current-day" style="font-weight: bold; font-size: 0.8rem;">0</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="donation-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-btn" class="btn-play" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                                🎮 Donate & Race to Win
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Game Rules - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">📖 How To Win</span>
                    </summary>
                    <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(236, 72, 153, 0.05); border-radius: 6px; border-left: 3px solid #ec4899;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #ec4899; min-width: 1.75rem;">1</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Wait For Midnight UTC</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Each day starts at 00:00 UTC - watch the countdown closely</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(245, 158, 11, 0.05); border-radius: 6px; border-left: 3px solid #f59e0b;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #f59e0b; min-width: 1.75rem;">2</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Be First To Donate</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">Race to submit your donation as soon as the day changes</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border-radius: 6px; border-left: 3px solid #10b981;">
                            <div style="font-size: 1.25rem; font-weight: bold; color: #10b981; min-width: 1.75rem;">3</div>
                            <div>
                                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.9rem;">Claim 99% of Prize Pool</strong>
                                <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8rem;">First donor wins 99% of yesterday's pot automatically!</span>
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Daily Stats - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">📊 Daily Stats</span>
                    </summary>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.75rem;">
                        <div style="padding: 0.5rem; background: rgba(236, 72, 153, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Total Days</div>
                            <div id="total-days" style="font-weight: bold; font-size: 0.9rem;">1</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(245, 158, 11, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Contract Balance</div>
                            <div id="contract-balance" style="font-weight: bold; font-size: 0.9rem;">0 wei</div>
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
                totalDays,
                potentialPrize
            ] = await Promise.all([
                this.contract.current_day(),
                this.contract.pot_value(),
                this.contract.first_donor_today(),
                this.contract.total_days(),
                this.contract.get_potential_prize()
            ]);
            
            console.log('🍩 Donuts Game State:', {
                currentDay: currentDay.toString(),
                totalDays: totalDays.toString(),
                potValue: potValue.toString(),
                potValueEth: ethers.utils.formatEther(potValue),
                firstDonorToday: firstDonorToday,
                potentialPrize: potentialPrize[0].toString()
            });
            
            DOMHelpers.updateInfo('current-day', currentDay.toString());
            DOMHelpers.updateInfo('total-days', totalDays.toString());
            DOMHelpers.updateInfo('pot-value', DOMHelpers.formatWei(potValue));
            DOMHelpers.updateInfo('winner-prize', DOMHelpers.formatWei(potentialPrize[0]));
            DOMHelpers.updateInfo('contract-balance', DOMHelpers.formatWei(potValue));
            
            const donorEl = document.getElementById('first-donor-today');
            if (donorEl) {
                const isZeroAddress = firstDonorToday === '0x0000000000000000000000000000000000000000';
                
                if (isZeroAddress) {
                    donorEl.innerHTML = `🎯 <strong>UNCLAIMED!</strong>`;
                } else {
                    const currentAddress = this.web3Provider?.currentAddress;
                    const isYou = currentAddress && firstDonorToday.toLowerCase() === currentAddress.toLowerCase();
                    
                    if (isYou) {
                        donorEl.innerHTML = `<strong style="color: #ffd700;">🏆 YOU!</strong> ${DOMHelpers.formatAddress(firstDonorToday)}`;
                    } else {
                        donorEl.innerHTML = DOMHelpers.formatAddress(firstDonorToday);
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
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
        if (this.countdownWheel) {
            this.countdownWheel.destroy();
        }
        super.destroy();
    }
}



