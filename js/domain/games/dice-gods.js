/**
 * Dice Gods - Reverse Popularity Contest
 * Choose the least popular number (1-6) to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';
import { ValueInput } from '../../presentation/components/value-input.js';

export class DiceGods extends Game {
    constructor() {
        super();
        this.selectedNumber = null;
        this.donationInput = null;
    }

    getContractName() {
        return 'dice-gods';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: '🎲 Dice Gods',
            description: 'Choose the LEAST popular number to win the pot!',
            contractAddress: CONTRACT_ADDRESSES.DICE_GODS,
            sourceFile: CONTRACT_SOURCES.DICE_GODS,
            abiFile: CONTRACT_ABIS.DICE_GODS
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Dice Selection Panel -->
                <div class="contest-info-panel" style="border: 2px solid #8b5cf6; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #8b5cf6; margin-bottom: 1rem;">
                        <span>🎲</span>
                        <span>Choose Your Number</span>
                    </h3>
                    <div style="padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 12px; margin-bottom: 1rem; text-align: center;">
                        <strong style="color: #8b5cf6;">Pick the LEAST popular number to win!</strong>
                    </div>
                    <div class="dice-grid" id="dice-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;"></div>
                </div>

                <!-- Play Panel -->
                <div class="contest-info-panel" style="border: 2px solid #10b981;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                        <span>💰</span>
                        <span>Place Your Bet</span>
                    </h3>
                    <div class="game-controls">
                        <div class="input-group" style="margin-top: 1rem;">
                            <div id="play-amount-input"></div>
                        </div>
                        
                        <button id="play-button" class="btn-play" disabled style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); opacity: 0.5;">
                            🎲 Play Your Number
                        </button>
                        
                        <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%); border-radius: 12px; border-left: 4px solid #8b5cf6;">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                <span style="font-size: 1.5rem;">🎯</span>
                                <strong style="font-size: 1.1rem; color: #8b5cf6;">Reverse Psychology</strong>
                            </div>
                            <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                <li>Pick a number that others will AVOID</li>
                                <li>The LEAST popular choice wins</li>
                                <li>Think opposite - be unpredictable!</li>
                                <li>Winners split the pot equally</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Round Info Panel -->
                <div id="round-info-panel"></div>

                <!-- Vote Distribution Panel -->
                <div id="vote-distribution-panel"></div>

                <!-- How It Works Panel -->
                <div class="contest-info-panel">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>📖</span>
                        <span>How To Win</span>
                    </h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6; min-width: 2.5rem;">1</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Choose Your Number</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Select from 1-6. Think about what others will pick, then choose differently!</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 4px solid #10b981;">
                                <div style="font-size: 2rem; font-weight: bold; color: #10b981; min-width: 2.5rem;">2</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Place Your Bet</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Donate any amount and your choice is locked in for this round</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #3b82f6; min-width: 2.5rem;">3</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Wait For Round End</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Round ends when max players is reached or time runs out</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; min-width: 2.5rem;">4</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Winners Claim Prize</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Those who picked the LEAST popular number split 99% of the pot!</span>
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
        this.donationInput = new ValueInput('play-amount-input', {
            label: 'Donation Amount',
            hint: 'Vote with wei for your lucky number',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
        
        this.renderDiceButtons();
        this.renderRoundPanel();
        this.renderVoteDistribution();
    }

    renderDiceButtons() {
        const diceGrid = document.getElementById('dice-grid');
        if (!diceGrid) return;
        
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        
        diceGrid.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const button = document.createElement('button');
            button.className = 'dice-button';
            button.dataset.number = i;
            button.style.cssText = `
                padding: 1.5rem;
                background: var(--md-sys-color-surface-variant);
                border: 2px solid var(--md-sys-color-outline);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            `;
            button.innerHTML = `
                <div class="dice-face" style="font-size: 3rem;">${diceEmojis[i-1]}</div>
                <div class="dice-number" style="font-size: 1.5rem; font-weight: bold; color: ${colors[i-1]};">${i}</div>
                <div class="dice-votes" id="dice-votes-${i}" style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">0 votes</div>
            `;
            button.addEventListener('click', () => this.selectNumber(i));
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('selected')) {
                    button.style.borderColor = colors[i-1];
                    button.style.transform = 'translateY(-4px)';
                    button.style.boxShadow = `0 4px 12px ${colors[i-1]}33`;
                }
            });
            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('selected')) {
                    button.style.borderColor = 'var(--md-sys-color-outline)';
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                }
            });
            diceGrid.appendChild(button);
        }
    }

    selectNumber(number) {
        this.selectedNumber = number;
        
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        
        document.querySelectorAll('.dice-button').forEach(btn => {
            btn.classList.remove('selected');
            const num = parseInt(btn.dataset.number);
            btn.style.borderColor = 'var(--md-sys-color-outline)';
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        });
        
        const selectedBtn = document.querySelector(`.dice-button[data-number="${number}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
            selectedBtn.style.borderColor = colors[number-1];
            selectedBtn.style.borderWidth = '3px';
            selectedBtn.style.transform = 'translateY(-4px) scale(1.05)';
            selectedBtn.style.boxShadow = `0 6px 20px ${colors[number-1]}55`;
        }
        
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.disabled = false;
            playButton.style.opacity = '1';
        }
        
        eventBus.emit(EVENTS.TOAST, {
            message: `Number ${number} selected!`,
            type: 'info'
        });
    }

    renderRoundPanel() {
        const panel = DOMHelpers.createInfoPanel('🏆 Current Round', [
            { label: 'Round Number', id: 'round-number' },
            { label: 'Plays', id: 'plays-count' },
            { label: 'Prize Pool', id: 'prize-pool' },
            { label: 'Your Donation', id: 'your-donation' },
            { label: 'Your Number', id: 'your-number' }
        ]);
        
        return panel;
    }

    renderVoteDistribution() {
        const panel = document.createElement('div');
        panel.className = 'vote-distribution-panel';
        
        panel.innerHTML = `
            <h3>📊 Vote Distribution</h3>
            <div class="distribution-bars" id="distribution-bars">
                <div class="loading">No plays yet...</div>
            </div>
            <p class="strategy-hint">
                💡 <strong>Strategy:</strong> The number with the FEWEST votes wins!
                Earlier plays with higher donations get more of the pot.
            </p>
        `;
        
        return panel;
    }

    renderHowItWorks() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        
        panel.innerHTML = `
            <h3>📖 How It Works</h3>
            <div class="how-it-works">
                <ol>
                    <li><strong>Choose Your Number:</strong> Pick a number from 1 to 6 with your donation</li>
                    <li><strong>10 Plays per Round:</strong> After every 10 plays, the round ends</li>
                    <li><strong>Least Popular Wins:</strong> The number(s) with the FEWEST votes win</li>
                    <li><strong>Weighted Distribution:</strong> Earlier plays get more weight</li>
                    <li><strong>Formula:</strong> Your share = (amount × position_weight) / total_weight</li>
                </ol>
                <div class="example-box">
                    <h4>🎯 Example</h4>
                    <p>If you play early with a big donation on a rare number, you win big!</p>
                    <p>Position 1 (earliest) = 10x weight, Position 10 (latest) = 1x weight</p>
                </div>
            </div>
        `;
        
        return panel;
    }

    setupListeners() {
        const playButton = document.getElementById('play-button');
        
        if (playButton) {
            playButton.addEventListener('click', () => this.play());
        }
    }

    async play() {
        if (!this.requiresWallet('play')) return;
        
        if (!this.selectedNumber) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please select a number first',
                type: 'warning'
            });
            return;
        }
        
        const weiAmount = this.donationInput.getWeiValue();
        
        if (!weiAmount || weiAmount.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid donation amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.play(this.selectedNumber, { value: weiAmount }),
                { 
                    game: 'dice-gods', 
                    number: this.selectedNumber,
                    wei: weiAmount.toString() 
                }
            );
            
            this.donationInput.reset();
            this.selectedNumber = null;
            document.querySelectorAll('.dice-button').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.getElementById('play-button').disabled = true;
            
            await this.refreshState();
            
        } catch (error) {
            console.error('Play failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
            const roundInfo = await this.contract.get_current_round_info();
            const roundNumber = roundInfo[0];
            const playCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
            const totalPot = roundInfo[2];

            DOMHelpers.updateInfo('round-number', `#${roundNumber.toString()}`);
            DOMHelpers.updateInfo('plays-count', `${playCount} / 10`);
            DOMHelpers.updateInfo('prize-pool', DOMHelpers.formatWei(totalPot));

            const numberCounts = await this.contract.get_number_counts();
            
            for (let i = 0; i < 6; i++) {
                const count = typeof numberCounts[i] === 'number' ? numberCounts[i] : numberCounts[i].toNumber();
                const voteElement = document.getElementById(`dice-votes-${i+1}`);
                if (voteElement) {
                    voteElement.textContent = `${count} ${count === 1 ? 'vote' : 'votes'}`;
                }
            }

            this.updateDistributionBars(numberCounts);

            if (this.web3Provider?.currentAddress) {
                const currentPlays = await this.contract.get_plays();
                const userPlay = currentPlays.find(play => 
                    play.player.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()
                );

                if (userPlay) {
                    DOMHelpers.updateInfo('your-donation', DOMHelpers.formatWei(userPlay.amount));
                    DOMHelpers.updateInfo('your-number', `🎲 ${userPlay.number}`);
                } else {
                    DOMHelpers.updateInfo('your-donation', 'Not playing');
                    DOMHelpers.updateInfo('your-number', '-');
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

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('PlayMade', async (roundNumber, player, number, amount, playNumber) => {
            await this.refreshState();
            
            const isYou = player.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            if (isYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `🎲 Your play recorded: Number ${number}`,
                    type: 'success'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `Someone played number ${number}`,
                    type: 'info'
                });
            }
        });

        this.contract.on('WinnerPaid', async (roundNumber, winner, number, amount) => {
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.CONFETTI);
                eventBus.emit(EVENTS.TOAST, {
                    message: `🎉 YOU WON ${DOMHelpers.formatWei(amount)} with number ${number}!`,
                    type: 'success'
                });
            }
        });

        this.contract.on('RoundEnded', async (roundNumber, winningNumbers, winnerCount, totalPot) => {
            const numbersStr = winningNumbers.join(', ');
            eventBus.emit(EVENTS.TOAST, {
                message: `Round ended! Winning number(s): ${numbersStr}`,
                type: 'info'
            });
            
            await this.refreshState();
        });

        this.contract.on('RoundStarted', async (roundNumber) => {
            eventBus.emit(EVENTS.TOAST, {
                message: `🚀 Round #${roundNumber} started!`,
                type: 'info'
            });
            await this.refreshState();
        });
    }
}

