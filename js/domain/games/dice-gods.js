/**
 * Dice Gods - Reverse Popularity Contest
 * Choose the least popular number (1-6) to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { DiceThreeD } from '../../presentation/components/dice-3d.js';
import { getTemplate } from './templates/dice-gods.tpl.js';

export class DiceGods extends Game {
    static metadata = {
        id: 'dice-gods',
        title: 'Dice Gods',
        emoji: '🎲',
        description: 'Pick the least popular number',
        color: '#8b5cf6',
        contract: {
            source: 'contracts/src/games/dice_gods.vy',
            abi: 'contracts/build/abis/dice-gods.json',
            addresses: {
                sepolia: '0x61d97822209D3B375c7B214597f1077F4879fD84',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const roundInfo = await contract.get_current_round_info();
        return {
            roundNumber: roundInfo[0],
            playCount: roundInfo[1],
            totalPot: roundInfo[2],
            isActive: roundInfo[3]
        };
    }

    constructor() {
        super();
        this.selectedNumber = null;
        this.donationInput = null;
        this.dice3D = null;
        
        this.DICE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        this.DICE_EMOJIS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: '#10b981'
        });
    }

    initComponents() {
        this.donationInput = this.createValueInput('play-amount-input', {
            hint: 'Last digit (1-6) is your number'
        });
        
        this.dice3D = new DiceThreeD('dice-3d-container', {
            onSelect: () => {}
        });
        this.dice3D.init();
    }

    getListeners() {
        return {
            'play-button': () => this.play()
        };
    }

    async play() {
        if (!this.requiresWallet('play')) return;
        
        const weiAmount = this.donationInput.getWeiValue();
        
        if (!weiAmount || weiAmount.eq(0)) {
            this.toast('Please enter a donation amount', 'warning');
            return;
        }
        
        const weiString = weiAmount.toString();
        const lastDigit = parseInt(weiString[weiString.length - 1]);
        let selectedNumber = lastDigit === 0 ? 6 : (lastDigit > 6 ? lastDigit % 6 || 6 : lastDigit);
        
        if (this.dice3D) {
            this.dice3D.selectFace(selectedNumber);
        }
        
        try {
            await this.transactionHandler.execute(
                this.contract.play(selectedNumber, { value: weiAmount }),
                { game: 'dice-gods', number: selectedNumber, wei: weiAmount.toString() },
                (isLoading) => this.setButtonState('play-button', isLoading, '⏳ Playing...', 'Play')
            );
            
            this.toast(`Played number ${selectedNumber}`, 'success');
            this.donationInput.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Play failed:', error);
        }
    }

    async fetchAndRenderState() {
        const [roundInfo, minDonation] = await Promise.all([
            this.contract.get_current_round_info(),
            this.contract.minimum_donation()
        ]);
        
        const roundNumber = roundInfo[0];
        const playCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
        const totalPot = roundInfo[2];

        this.dom.updateInfo('round-number', `#${roundNumber.toString()}`);
        this.dom.updateInfo('plays-count', `${playCount} / 10`);
        this.dom.updateInfo('prize-pool', this.dom.formatWei(totalPot));
        this.dom.updateInfo('min-donation', this.dom.formatWei(minDonation));
        
        if (this.donationInput && minDonation) {
            this.donationInput.setMinimum(minDonation.toString());
        }

        const numberCounts = await this.contract.get_number_counts();
        this.updateDistributionBars(numberCounts);
        
        const currentPlays = await this.contract.get_plays();
        this.updateCurrentPlaysList(currentPlays);
    }

    updateDistributionBars(numberCounts) {
        const barsContainer = document.getElementById('distribution-bars');
        if (!barsContainer) return;

        const counts = numberCounts.map((c, i) => ({
            number: i + 1,
            count: typeof c === 'number' ? c : c.toNumber()
        }));

        const maxCount = Math.max(...counts.map(c => c.count), 1);
        const minCount = Math.min(...counts.filter(c => c.count > 0).map(c => c.count), maxCount);

        barsContainer.innerHTML = counts.map(({ number, count }) => {
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isWinning = count > 0 && count === minCount;
            const barClass = isWinning ? 'winning' : '';
            
            return `
                <div class="distribution-row">
                    <div class="dist-number">${number}</div>
                    <div class="dist-bar-container">
                        <div class="dist-bar ${barClass}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="dist-count">${count}</div>
                    ${isWinning && count > 0 ? '<span class="winning-badge">🏆</span>' : ''}
                </div>
            `;
        }).join('');
    }
    
    updateCurrentPlaysList(plays) {
        const listContainer = document.getElementById('current-plays-list');
        if (!listContainer) return;
        
        if (!plays || plays.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 1.5rem; color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">
                    No plays yet
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = plays.map((play) => {
            const playIndex = typeof play.play_index === 'number' ? play.play_index : play.play_index.toNumber();
            const number = typeof play.number === 'number' ? play.number : play.number.toNumber();
            const weight = 11 - playIndex;
            const isCurrentUser = this.isCurrentUser(play.player);
            
            return `
                <div style="padding: 0.75rem; background: ${isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'}; border-radius: 6px; border-left: 3px solid ${isCurrentUser ? '#3b82f6' : 'var(--md-sys-color-outline)'}; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.5rem;">${this.DICE_EMOJIS[number - 1]}</span>
                            <div>
                                <div style="font-weight: bold; font-size: 0.875rem; color: var(--md-sys-color-on-surface);">
                                    #${playIndex} ${isCurrentUser ? '(You)' : ''}
                                </div>
                                <div style="font-size: 0.7rem; font-family: monospace; color: var(--md-sys-color-on-surface-variant);">
                                    ${this.dom.formatAddress(play.player)}
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; font-size: 0.875rem; color: var(--md-sys-color-on-surface);">
                                ${this.dom.formatWei(play.amount)}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant);">
                                ${weight}x
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('PlayMade', async (roundNumber, player, number, amount, playNumber) => {
            await this.refreshState();
            
            if (this.isCurrentUser(player)) {
                this.toast(`Your play recorded: Number ${number}`, 'success');
            } else {
                this.toast(`Someone played number ${number}`, 'info');
            }
        });

        this.contract.on('WinnerPaid', async (roundNumber, winner, number, amount) => {
            if (this.isCurrentUser(winner)) {
                this.celebrate(`You won ${this.dom.formatWei(amount)} with number ${number}!`);
            }
        });

        this.contract.on('RoundEnded', async (roundNumber, winningNumbers, winnerCount, totalPot) => {
            const numbersStr = winningNumbers.join(', ');
            this.toast(`Round ended! Winning number(s): ${numbersStr}`, 'info');
            await this.refreshState();
        });

        this.contract.on('RoundStarted', async (roundNumber) => {
            this.toast(`Round ${roundNumber} started`, 'info');
            await this.refreshState();
        });
    }
}
