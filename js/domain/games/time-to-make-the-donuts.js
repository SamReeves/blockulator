/**
 * Time to Make the Donuts - The Race to Be First
 * A game where being FIRST wins. Rush to be the first donor of each day!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { CountdownWheel } from '../../presentation/components/countdown-wheel.js';
import { getTemplate } from './templates/time-to-make-the-donuts.tpl.js';

export class TimeToMakeTheDonuts extends Game {
    static metadata = {
        id: 'time-to-make-the-donuts',
        title: 'Make the Donuts',
        emoji: '🍩',
        description: 'First donor daily at midnight',
        color: '#ec4899',
        contract: {
            source: 'contracts/src/games/time_to_make_the_donuts.vy',
            abi: 'contracts/build/abis/time-to-make-the-donuts.json',
            addresses: {
                sepolia: '0xD222eCe3C1D844B23384F56d62E59F556e925C85',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const [currentDay, potValue, firstDonor, totalDays] = await Promise.all([
            contract.current_day(),
            contract.pot_value(),
            contract.first_donor_today(),
            contract.total_days()
        ]);
        return { currentDay, potValue, firstDonor, totalDays };
    }

    constructor() {
        super();
        this.countdownWheel = null;
        this.donationInput = null;
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: this.metadata.color
        });
    }

    initComponents() {
        const defaultWei = '100000000000000'; // 0.0001 ETH
        this.donationInput = this.createValueInput('donation-amount-input', {
            hint: 'Any amount helps grow the prize pool',
            minWei: '1'
        });
        this.donationInput.setValue(defaultWei);
        
        this.countdownWheel = new CountdownWheel('countdown-wheel-container', {
            timeGetter: async () => {
                if (!this.contract) return 0;
                const timeUntilNextDay = await this.contract.get_time_until_next_day();
                return timeUntilNextDay.toNumber();
            }
        });
        this.countdownWheel.init();
    }

    getListeners() {
        return {
            'donate-btn': () => this.donate()
        };
    }

    async donate() {
        await this.executeTransaction({
            inputComponent: this.donationInput,
            contractCall: (wei) => this.contract.donate({ value: wei }),
            buttonId: 'donate-btn',
            buttonLoadingText: '⏳ Donating...',
            buttonDefaultText: '🎮 Donate & Race to Win',
            validationMessage: 'Please enter a donation amount',
            walletAction: 'participate',
            onSuccess: async () => {
                this.toast('Donation sent. Check if you won.', 'success');
            }
        });
    }

    async fetchAndRenderState() {
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
        
        await this.updateFirstDonorDisplay(firstDonorToday);
    }

    async updateFirstDonorDisplay(firstDonorToday) {
        const donorEl = document.getElementById('first-donor-today');
        if (!donorEl) return;
        
        const isZeroAddress = firstDonorToday === '0x0000000000000000000000000000000000000000';
        
        if (isZeroAddress) {
            donorEl.innerHTML = '🎯 <strong>UNCLAIMED!</strong>';
        } else {
            const isYou = this.isCurrentUser(firstDonorToday);
            
            const donorDisplay = await this.components.AddressBadge.createWithAddress(firstDonorToday, this.web3Provider, {
                size: 24,
                formatAddress: true,
                addressStyle: 'font-size: 1rem;'
            });
            
            donorEl.innerHTML = '';
            
            if (isYou) {
                const youLabel = document.createElement('strong');
                youLabel.style.cssText = 'color: #ffd700; margin-right: 0.5rem;';
                youLabel.textContent = '🏆 YOU!';
                donorEl.appendChild(youLabel);
            }
            
            donorEl.appendChild(donorDisplay);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('DonationReceived', (dayNumber, donor, amount, newPot, isFirstDonor) => {
            if (isFirstDonor) {
                if (this.isCurrentUser(donor)) {
                    this.toast(`You were first today! You donated ${this.dom.formatWei(amount)}`, 'success');
                } else if (this.web3Provider?.currentAddress) {
                    this.toast(`${this.dom.formatAddress(donor)} was first today`, 'info');
                }
            } else {
                if (this.isCurrentUser(donor)) {
                    this.toast(`You donated ${this.dom.formatWei(amount)} (too late for today!)`, 'info');
                } else if (this.web3Provider?.currentAddress) {
                    this.toast(`${this.dom.formatAddress(donor)} donated (not first)`, 'info');
                }
            }
            
            this.refreshState();
        });
        
        this.contract.on('WinnerPaid', (dayNumber, winner, prize, fee) => {
            if (this.isCurrentUser(winner)) {
                this.events.bus.emit(this.events.EVENTS.WINNER_DETERMINED, { player: winner, prize });
                this.celebrate(`You won ${this.dom.formatWei(prize)} by being first today!`);
            } else if (this.web3Provider?.currentAddress) {
                this.toast(`Winner: ${this.dom.formatAddress(winner)} won ${this.dom.formatWei(prize)}`, 'info');
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
