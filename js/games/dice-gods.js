/**
 * Dice Gods - Reverse Popularity Contest
 * Choose the least popular number (1-6) to win!
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../contracts/deployments/addresses.js';

export class DiceGods {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.selectedNumber = null;
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        this.contract = await ContractLoader.load('dice-gods', web3Provider);
        if (!this.contract) return;
        
        this.render();
        this.setupListeners();
        this.setupContractEvents();
        await this.refreshState();
    }

    render() {
        // Header with contract info
        const header = GameRenderer.createGameHeader({
            title: '🎲 Dice Gods',
            description: 'Choose the LEAST popular number to win the pot!',
            contractAddress: CONTRACT_ADDRESSES.DICE_GODS,
            sourceFile: CONTRACT_SOURCES.DICE_GODS,
            abiFile: CONTRACT_ABIS.DICE_GODS
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        // Number selection area
        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'dice-selection-area';
        selectionDiv.innerHTML = `
            <h3>Choose Your Number</h3>
            <div class="dice-grid" id="dice-grid"></div>
        `;
        container.appendChild(selectionDiv);
        
        // Play controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'play-amount',
            label: 'Donation Amount (wei)',
            placeholder: 'Enter amount in wei...',
            min: 0,
            step: 1
        }));
        
        const playButton = DOMHelpers.createButton(
            'play-button',
            '🎲 Play Your Number'
        );
        playButton.disabled = true;
        controlsDiv.appendChild(playButton);
        
        container.appendChild(controlsDiv);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current round panel
        sectionsContainer.appendChild(this.renderRoundPanel());
        
        // Vote distribution
        sectionsContainer.appendChild(this.renderVoteDistribution());
        
        // How it works panel
        sectionsContainer.appendChild(this.renderHowItWorks());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
        
        // Render dice buttons after DOM is ready
        this.renderDiceButtons();
    }

    renderDiceButtons() {
        const diceGrid = document.getElementById('dice-grid');
        if (!diceGrid) return;
        
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        diceGrid.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const button = document.createElement('button');
            button.className = 'dice-button';
            button.dataset.number = i;
            button.innerHTML = `
                <div class="dice-face">${diceEmojis[i-1]}</div>
                <div class="dice-number">${i}</div>
                <div class="dice-votes" id="dice-votes-${i}">0 votes</div>
            `;
            button.addEventListener('click', () => this.selectNumber(i));
            diceGrid.appendChild(button);
        }
    }

    selectNumber(number) {
        this.selectedNumber = number;
        
        // Update button styles
        document.querySelectorAll('.dice-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`.dice-button[data-number="${number}"]`)?.classList.add('selected');
        
        // Enable play button
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.disabled = false;
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
        const amountInput = document.getElementById('play-amount');
        
        if (playButton) {
            playButton.addEventListener('click', () => 
                this.play(amountInput.value)
            );
        }
        
        // Enter key support
        if (amountInput) {
            amountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.selectedNumber) {
                    this.play(e.target.value);
                }
            });
        }
    }

    async play(weiAmount) {
        // Check wallet connection first
        if (!this.web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: '🔐 Please connect your wallet to play',
                type: 'warning'
            });
            return;
        }
        
        if (!this.selectedNumber) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please select a number first',
                type: 'warning'
            });
            return;
        }
        
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
                type: 'warning'
            });
            return;
        }
        
        try{
            await TransactionHandler.execute(
                this.contract.play(this.selectedNumber, { 
                    value: ethers.BigNumber.from(weiAmount) 
                }),
                { 
                    game: 'dice-gods', 
                    number: this.selectedNumber,
                    wei: weiAmount 
                }
            );
            
            // Clear input and selection
            document.getElementById('play-amount').value = '';
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
            console.log('Contract instance:', this.contract);
            console.log('Contract address:', this.contract.address);
            console.log('Calling get_current_round_info...');
            
            // Get current round info (returns: round_number, play_count, total_pot)
            const roundInfo = await this.contract.get_current_round_info();
            const roundNumber = roundInfo[0];
            const playCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
            const totalPot = roundInfo[2];

            // Update round panel
            DOMHelpers.updateInfo('round-number', `#${roundNumber.toString()}`);
            DOMHelpers.updateInfo('plays-count', `${playCount} / 10`);
            DOMHelpers.updateInfo('prize-pool', DOMHelpers.formatWei(totalPot));

            // Get number counts
            const numberCounts = await this.contract.get_number_counts();
            
            // Update dice button vote counts
            for (let i = 0; i < 6; i++) {
                const count = typeof numberCounts[i] === 'number' ? numberCounts[i] : numberCounts[i].toNumber();
                const voteElement = document.getElementById(`dice-votes-${i+1}`);
                if (voteElement) {
                    voteElement.textContent = `${count} ${count === 1 ? 'vote' : 'votes'}`;
                }
            }

            // Update distribution visualization
            this.updateDistributionBars(numberCounts);

            // Only load user-specific data if address is available
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
                message: 'Failed to load game state. Check console for details.',
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

    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}

