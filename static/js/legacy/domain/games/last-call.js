/**
 * Last Call - The Race to Be Last
 * A game where being LAST wins. Rush to donate at the end of each 10-day round!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { getTemplate } from './templates/last-call.tpl.js';
import { gamePanelColor, SDR_PALETTE } from '../../theme/sdr-palette.js';

export class LastCall extends Game {
    static metadata = {
        id: 'last-call',
        title: 'Last Call',
        emoji: '⏰',
        description: 'Last donor wins after timer',
        color: gamePanelColor('last-call'),
        contract: {
            source: 'contracts/src/games/last_call.vy',
            abi: 'contracts/build/abis/last-call.json',
            addresses: {
                sepolia: '0xE0e1E3778d75E757fd4718FdF44bD4e0F5E73baa',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const [roundNumber, potValue, lastDonor, canEnd] = await Promise.all([
            contract.round_number(),
            contract.pot_value(),
            contract.last_donor(),
            contract.can_end_round()
        ]);
        return { roundNumber, potValue, lastDonor, canEnd };
    }

    constructor() {
        super();
        this.donationInput = null;
        this.countdownInterval = null;
    }

    async onAfterInit() {
        await super.onAfterInit();
        this.countdownInterval = setInterval(() => this.updateCountdownWheel(), 1000);
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: SDR_PALETTE.particleEmerald
        });
    }

    initComponents() {
        const defaultWei = '100000000000000'; // 0.0001 ETH
        this.donationInput = this.createValueInput('donation-amount-input', {
            hint: 'Be the last donor when time expires!',
            minWei: '1'
        });
        this.donationInput.setValue(defaultWei);
    }

    getListeners() {
        return {
            'donate-btn': () => this.donate(),
            'end-round-btn': () => this.endRound()
        };
    }

    async donate() {
        await this.executeTransaction({
            inputComponent: this.donationInput,
            contractCall: (wei) => this.contract.donate({ value: wei }),
            buttonId: 'donate-btn',
            buttonLoadingText: '⏳ Donating...',
            buttonDefaultText: '💰 Donate — Become the Last Donor',
            validationMessage: 'Please enter a donation amount',
            walletAction: 'participate',
            onSuccess: async () => {
                this.toast('You are now in the last position', 'success');
            }
        });
    }

    async endRound() {
        try {
            const canEnd = await this.contract.can_end_round();
            if (!canEnd) {
                this.toast('Round cannot be ended yet', 'warning');
                return;
            }
            
            await this.transactionHandler.execute(
                this.contract.end_round(),
                { game: 'last-call', action: 'end-round' }
            );
            
            this.toast('Round ended. Winner paid out.', 'success');
            await this.refreshState();
            
        } catch (error) {
            console.error('End round failed:', error);
        }
    }

    async fetchAndRenderState() {
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
        
        await this.updateWinnerDisplay(lastDonor);
        await this.updateCountdownWheel();
        
        const endRoundBtn = document.getElementById('end-round-btn');
        if (endRoundBtn) {
            endRoundBtn.style.display = canEnd ? 'block' : 'none';
        }
    }

    async updateWinnerDisplay(lastDonor) {
        const winnerEl = document.getElementById('current-winner');
        if (!winnerEl) return;
        
        if (lastDonor === '0x0000000000000000000000000000000000000000') {
            winnerEl.innerHTML = '<span style="opacity: 0.6;">No one yet</span>';
        } else {
            const isYou = this.isCurrentUser(lastDonor);
            
            const winnerDisplay = await this.components.AddressBadge.createWithAddress(lastDonor, this.web3Provider, {
                size: 24,
                formatAddress: true,
                addressStyle: 'font-size: 1rem; font-weight: bold;'
            });
            
            winnerEl.innerHTML = '';
            if (isYou) {
                const youLabel = document.createElement('div');
                youLabel.style.cssText = `color: ${SDR_PALETTE.particleEmerald}; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;`;
                youLabel.textContent = '🎉 YOU ARE WINNING! 🎉';
                winnerEl.appendChild(youLabel);
            }
            winnerEl.appendChild(winnerDisplay);
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
            const ROUND_DURATION = 864000;
            
            const timeEl = document.getElementById('countdown-time');
            const labelEl = document.getElementById('countdown-label');
            const progressCircle = document.getElementById('countdown-progress-circle');
            
            if (!timeEl || !progressCircle) return;
            
            const roundStarted = lastDonor !== '0x0000000000000000000000000000000000000000';
            
            if (seconds === 0) {
                timeEl.textContent = 'ENDED!';
                timeEl.style.color = SDR_PALETTE.particleRed;
                if (labelEl) labelEl.textContent = 'Round Complete';
            } else if (!roundStarted) {
                timeEl.textContent = 'Waiting';
                timeEl.style.color = SDR_PALETTE.particleSapphire;
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
                
                if (seconds < 3600) {
                    timeEl.style.color = SDR_PALETTE.particleRed;
                } else if (seconds < 86400) {
                    timeEl.style.color = SDR_PALETTE.particleGold;
                } else {
                    timeEl.style.color = SDR_PALETTE.particleSapphire;
                }
                
                if (labelEl) labelEl.textContent = 'Until Round Ends';
            }
            
            const circumference = 2 * Math.PI * 75;
            if (!roundStarted) {
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
            if (this.isCurrentUser(donor)) {
                this.toast(`You donated ${this.dom.formatWei(amount)} and are now last`, 'success');
            } else if (this.web3Provider?.currentAddress) {
                this.toast(`${this.dom.formatAddress(donor)} just donated`, 'info');
            }
            
            this.refreshState();
        });
        
        this.contract.on('RoundEnded', (roundNumber, winner, prize, fee) => {
            if (this.isCurrentUser(winner)) {
                this.events.bus.emit(this.events.EVENTS.WINNER_DETERMINED, { player: winner, prize });
                this.celebrate(`You won ${this.dom.formatWei(prize)}!`);
            } else {
                this.toast(`Round ended. Winner: ${this.dom.formatAddress(winner)}`, 'info');
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
