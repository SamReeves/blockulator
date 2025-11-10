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
import { AddressBadge } from '../../presentation/components/address-badge.js';
import { DiceThreeD } from '../../presentation/components/dice-3d.js';

export class DiceGods extends Game {
    constructor() {
        super();
        this.selectedNumber = null;
        this.donationInput = null;
        this.dice3D = null;
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
                <!-- Consolidated Game Panel -->
                <div class="contest-info-panel" style="border: 2px solid #8b5cf6; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #8b5cf6; margin: 0;">
                            <span>🎲</span>
                            <span>Dice Gods</span>
                        </h3>
                        <div style="font-size: 0.85rem; color: #8b5cf6; font-weight: 500;">Pick the LEAST popular number!</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start; position: relative;">
                        <!-- Left: Die + Selection -->
                        <div style="min-width: 0;">
                            <div id="dice-3d-container" style="margin-bottom: 0;"></div>
                            <div id="selected-number-display" style="text-align: center; margin-top: 0.5rem; padding: 0.5rem; background: rgba(139, 92, 246, 0.08); border-radius: 8px;">
                                <div style="font-size: 1rem; color: #8b5cf6; font-weight: 600;">
                                    <span id="selected-number-text">—</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right: Amount + Play + Round Info -->
                        <div style="position: relative; overflow: visible; min-width: 0;">
                            <div style="margin-bottom: 1rem; position: relative; overflow: visible;">
                                <div id="play-amount-input" style="position: relative; overflow: visible;"></div>
                            </div>
                            
                            <button id="play-button" class="btn-play" disabled style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); opacity: 0.5; margin-bottom: 1rem;">
                                🎲 Play Your Number
                            </button>
                            
                            <div id="round-info-panel-compact"></div>
                        </div>
                    </div>
                </div>

                <!-- Vote Distribution Panel -->
                <div id="vote-distribution-panel"></div>
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
        
        this.renderDice3D();
        this.renderCompactRoundPanel();
        this.renderVoteDistribution();
    }

    renderDice3D() {
        // Initialize the 3D die component
        this.dice3D = new DiceThreeD('dice-3d-container', {
            onSelect: (number) => this.handleDiceSelect(number)
        });
        this.dice3D.init();
    }

    handleDiceSelect(number) {
        this.selectedNumber = number;
        this.updateSelectedNumberDisplay();
        this.updatePlayButton();
    }

    updateSelectedNumberDisplay() {
        const displayText = document.getElementById('selected-number-text');
        if (!displayText) return;
        
        const numberEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        
        if (this.selectedNumber) {
            displayText.innerHTML = `
                <span style="font-size: 1.5rem; display: block;">${numberEmojis[this.selectedNumber]}</span>
                <span style="color: ${colors[this.selectedNumber]}; font-weight: 700; font-size: 0.9rem;">Number ${this.selectedNumber}</span>
            `;
        } else {
            displayText.textContent = '—';
        }
    }

    renderDiceButtons() {
        // Legacy method - now replaced by renderDice3D
        // Keeping for backward compatibility but not used
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

    renderCompactRoundPanel() {
        const container = document.getElementById('round-info-panel-compact');
        if (!container) return;
        
        container.innerHTML = `
            <div style="background: rgba(139, 92, 246, 0.08); border-radius: 8px; padding: 0.75rem; font-size: 0.85rem;">
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; row-gap: 0.3rem;">
                    <div style="color: #8b5cf6; font-weight: 600;">Round:</div>
                    <div id="round-number">-</div>
                    
                    <div style="color: #8b5cf6; font-weight: 600;">Plays:</div>
                    <div id="plays-count">-</div>
                    
                    <div style="color: #10b981; font-weight: 600;">Pool:</div>
                    <div id="prize-pool" style="color: #10b981;">-</div>
                </div>
            </div>
        `;
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
            <details style="cursor: pointer;">
                <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; font-weight: bold; font-size: 1rem; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 2px solid rgba(139, 92, 246, 0.2);">
                    <span style="transition: transform 0.2s;">▶</span>
                    <span>📊 Vote Distribution & Plays</span>
                </summary>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px;">
                    <div class="distribution-bars" id="distribution-bars" style="margin-bottom: 1rem;">
                        <div class="loading">No plays yet...</div>
                    </div>
                    <div style="font-size: 0.85rem; color: #8b5cf6; margin-bottom: 1rem; padding: 0.5rem; background: rgba(139, 92, 246, 0.1); border-radius: 6px;">
                        💡 Number with FEWEST votes wins! Earlier + bigger donations = more payout.
                    </div>
                    <div id="current-plays-list" style="max-height: 300px; overflow-y: auto;">
                        <div style="text-align: center; padding: 1rem; color: var(--md-sys-color-on-surface-variant); font-size: 0.85rem;">
                            Loading plays...
                        </div>
                    </div>
                </div>
            </details>
        `;
        
        // Add rotation for arrow
        panel.querySelector('details').addEventListener('toggle', (e) => {
            const arrow = e.target.querySelector('summary span');
            arrow.style.transform = e.target.open ? 'rotate(90deg)' : 'rotate(0deg)';
        });
        
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
            
            const currentPlays = await this.contract.get_plays();
            this.updateCurrentPlaysList(currentPlays);

            if (this.web3Provider?.currentAddress) {
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
    
    updateCurrentPlaysList(plays) {
        const listContainer = document.getElementById('current-plays-list');
        if (!listContainer) return;
        
        if (!plays || plays.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                    No plays yet in this round
                </div>
            `;
            return;
        }
        
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
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
                            <span style="font-size: 1.5rem;">${diceEmojis[number - 1]}</span>
                            <div>
                                <div style="font-weight: bold; font-size: 0.875rem; color: var(--md-sys-color-on-surface);">
                                    #${playIndex} ${isCurrentUser ? '(You)' : ''}
                                </div>
                                <div style="font-size: 0.7rem; font-family: monospace; color: var(--md-sys-color-on-surface-variant);">
                                    ${DOMHelpers.formatAddress(play.player)}
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; font-size: 0.875rem; color: var(--md-sys-color-on-surface);">
                                ${DOMHelpers.formatWei(play.amount)}
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

