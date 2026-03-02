/**
 * Dice Gods - Reverse Popularity Contest
 * Choose the least popular number (1-6) to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { DiceThreeD } from '../../presentation/components/dice-3d.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';

export class DiceGods extends Game {
    constructor() {
        super();
        this.selectedNumber = null;
        this.donationInput = null;
        this.dice3D = null;
        
        // Constants for dice display
        this.DICE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        this.DICE_EMOJIS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    }

    getContractName() {
        return 'dice-gods';
    }

    render() {
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections" style="--panel-color: #8b5cf6; --btn-color: #10b981;">
                <!-- Main Game Panel -->
                <div class="contest-info-panel game-panel">
                    <div class="game-panel-grid">
                        <!-- Left: Die Animation -->
                        <div class="min-w-0">
                            <div id="dice-3d-container"></div>
                        </div>
                        
                        <!-- Right: Play Controls -->
                        <div class="min-w-0">
                            <div class="strategy-callout" style="margin-bottom: 1rem;">
                                <strong>How to play:</strong> The last digit of your donation (1-6) is your number. Pick the LEAST popular to win!
                            </div>
                            
                            <div id="play-amount-input" style="margin-bottom: 1rem;"></div>
                            <button id="play-button" class="btn-action">
                                Play
                            </button>
                            
                            <div class="stat-grid-4" style="margin-top: 1rem; font-size: 0.75rem;">
                                <div class="stat-box">
                                    <div class="stat-box-label">Round</div>
                                    <div id="round-number" class="stat-box-value">-</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-box-label">Plays</div>
                                    <div id="plays-count" class="stat-box-value">-</div>
                                </div>
                                <div class="stat-box" style="--stat-color: #10b981;">
                                    <div class="stat-box-label">Pool</div>
                                    <div id="prize-pool" class="stat-box-value">-</div>
                                </div>
                                <div class="stat-box" style="--stat-color: #f59e0b;">
                                    <div class="stat-box-label">Min</div>
                                    <div id="min-donation" class="stat-box-value">-</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current Round -->
                <div id="vote-distribution-panel"></div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new this.components.ValueInput('play-amount-input', {
            label: 'Donation Amount',
            hint: 'Last digit (1-6) is your number',
            defaultUnit: 'gwei',
            minWei: '1', // Will be updated from contract
            required: true
        });
        this.donationInput.render();
        
        this.renderDice3D();
        this.renderCompactRoundPanel();
        this.renderVoteDistribution();
    }

    renderDice3D() {
        // Initialize the 3D die component (visual only)
        this.dice3D = new DiceThreeD('dice-3d-container', {
            onSelect: () => {} // No action needed
        });
        this.dice3D.init();
    }

    renderCompactRoundPanel() {
        // Stats are now rendered inline in the main template
    }

    renderVoteDistribution() {
        const container = document.getElementById('vote-distribution-panel');
        if (!container) return;
        
        container.innerHTML = `
            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📊 Current Round - Number Votes</span>
                </summary>
                <div style="margin-top: 1rem;">
                    <div class="distribution-bars" id="distribution-bars" style="margin-bottom: 1rem;">
                        <div style="text-align: center; padding: 1rem; color: var(--md-sys-color-on-surface-variant);">
                            No plays yet...
                        </div>
                    </div>
                    <div id="current-plays-list" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
            </details>
        `;
    }


    setupListeners() {
        const playButton = document.getElementById('play-button');
        
        if (playButton) {
            playButton.addEventListener('click', () => this.play());
        }
    }

    async play() {
        if (!this.requiresWallet('play')) return;
        
        const weiAmount = this.donationInput.getWeiValue();
        
        if (!weiAmount || weiAmount.eq(0)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Please enter a donation amount',
                type: 'warning'
            });
            return;
        }
        
        // Extract last digit of the wei amount as the number (1-6)
        const weiString = weiAmount.toString();
        const lastDigit = parseInt(weiString[weiString.length - 1]);
        let selectedNumber = lastDigit === 0 ? 6 : (lastDigit > 6 ? lastDigit % 6 || 6 : lastDigit);
        
        // Show the die face for this number
        if (this.dice3D) {
            this.dice3D.selectFace(selectedNumber);
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.play(selectedNumber, { value: weiAmount }),
                { 
                    game: 'dice-gods', 
                    number: selectedNumber,
                    wei: weiAmount.toString() 
                }
            );
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: `Played number ${selectedNumber}`,
                type: 'success'
            });
            
            this.donationInput.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Play failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
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
            
            // Update the ValueInput minimum
            if (this.donationInput && minDonation) {
                this.donationInput.setMinimum(minDonation.toString());
            }

            const numberCounts = await this.contract.get_number_counts();
            this.updateDistributionBars(numberCounts);
            
            const currentPlays = await this.contract.get_plays();
            this.updateCurrentPlaysList(currentPlays);

        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
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
        
        listContainer.innerHTML = plays.map((play, index) => {
            const playIndex = typeof play.play_index === 'number' ? play.play_index : play.play_index.toNumber();
            const number = typeof play.number === 'number' ? play.number : play.number.toNumber();
            const weight = 11 - playIndex; // Position weight: first play gets 10x, last gets 1x
            const isCurrentUser = this.web3Provider?.currentAddress && 
                                  play.player.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
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
            
            const isYou = player.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `Your play recorded: Number ${number}`,
                    type: 'success'
                });
            } else {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `Someone played number ${number}`,
                    type: 'info'
                });
            }
        });

        this.contract.on('WinnerPaid', async (roundNumber, winner, number, amount) => {
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.CONFETTI);
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `You won ${this.dom.formatWei(amount)} with number ${number}!`,
                    type: 'success'
                });
            }
        });

        this.contract.on('RoundEnded', async (roundNumber, winningNumbers, winnerCount, totalPot) => {
            const numbersStr = winningNumbers.join(', ');
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: `Round ended! Winning number(s): ${numbersStr}`,
                type: 'info'
            });
            
            await this.refreshState();
        });

        this.contract.on('RoundStarted', async (roundNumber) => {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: `Round ${roundNumber} started`,
                type: 'info'
            });
            await this.refreshState();
        });
    }
}

