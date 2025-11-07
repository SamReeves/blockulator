/**
 * Satan, Moloch, Baal - The Infernal Voting Game
 * Vote for your favorite demon by burning ETH in their name
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class SatanMolochBaal extends Game {
    getContractName() {
        return 'satan-moloch-baal';
    }

    render() {
        // Header with contract info
        const header = GameRenderer.createGameHeader({
            title: '🔥 Satan, Moloch, Baal',
            description: 'Vote for your demon by burning ETH to the void!',
            contractAddress: CONTRACT_ADDRESSES.SATAN_MOLOCH_BAAL,
            sourceFile: CONTRACT_SOURCES.SATAN_MOLOCH_BAAL,
            abiFile: CONTRACT_ABIS.SATAN_MOLOCH_BAAL
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        // Voting controls
        const votingDiv = document.createElement('div');
        votingDiv.className = 'voting-interface';
        votingDiv.innerHTML = `
            <h3>🔥 Cast Your Vote by Burning ETH 🔥</h3>
            <p class="vote-description">All donations go straight to the null address - eternal sacrifice!</p>
            
            <div class="vote-amount-input">
                <label for="vote-amount">Amount to Burn (wei)</label>
                <input type="number" id="vote-amount" placeholder="Enter wei amount..." min="0" step="1" />
            </div>
            
            <div class="demon-voting-buttons">
                <button id="vote-satan" class="demon-button satan">
                    <span class="demon-icon">😈</span>
                    <span class="demon-name">SATAN</span>
                    <span class="demon-subtitle">The Adversary</span>
                </button>
                
                <button id="vote-moloch" class="demon-button moloch">
                    <span class="demon-icon">🐂</span>
                    <span class="demon-name">MOLOCH</span>
                    <span class="demon-subtitle">The Bull God</span>
                </button>
                
                <button id="vote-baal" class="demon-button baal">
                    <span class="demon-icon">⚡</span>
                    <span class="demon-name">BAAL</span>
                    <span class="demon-subtitle">Lord of Storms</span>
                </button>
            </div>
        `;
        
        container.appendChild(votingDiv);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current standings panel
        sectionsContainer.appendChild(this.renderStandingsPanel());
        
        // Your stats panel
        sectionsContainer.appendChild(this.renderUserStatsPanel());
        
        // How it works panel
        sectionsContainer.appendChild(this.renderHowItWorks());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

    renderStandingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'info-panel';
        
        panel.innerHTML = `
            <h3>📊 Demon Standings</h3>
            <div class="demon-standings">
                <div class="demon-stat-card satan-card">
                    <div class="demon-stat-header">
                        <span class="demon-stat-icon">😈</span>
                        <span class="demon-stat-name">Satan</span>
                    </div>
                    <div class="demon-stat-amount" id="satan-total">0 wei</div>
                    <div class="demon-stat-votes" id="satan-votes">0 votes</div>
                    <div class="demon-stat-champion" id="satan-champion">No champion yet</div>
                </div>
                
                <div class="demon-stat-card moloch-card">
                    <div class="demon-stat-header">
                        <span class="demon-stat-icon">🐂</span>
                        <span class="demon-stat-name">Moloch</span>
                    </div>
                    <div class="demon-stat-amount" id="moloch-total">0 wei</div>
                    <div class="demon-stat-votes" id="moloch-votes">0 votes</div>
                    <div class="demon-stat-champion" id="moloch-champion">No champion yet</div>
                </div>
                
                <div class="demon-stat-card baal-card">
                    <div class="demon-stat-header">
                        <span class="demon-stat-icon">⚡</span>
                        <span class="demon-stat-name">Baal</span>
                    </div>
                    <div class="demon-stat-amount" id="baal-total">0 wei</div>
                    <div class="demon-stat-votes" id="baal-votes">0 votes</div>
                    <div class="demon-stat-champion" id="baal-champion">No champion yet</div>
                </div>
            </div>
            <div class="total-burned-section">
                <div class="info-label">🔥 Total Sacrificed to the Void</div>
                <div class="info-value" id="total-burned">0 wei</div>
            </div>
        `;
        
        return panel;
    }

    renderUserStatsPanel() {
        const panel = DOMHelpers.createInfoPanel('📈 Your Stats', [
            { label: 'Satan Burned', id: 'user-satan-burned' },
            { label: 'Moloch Burned', id: 'user-moloch-burned' },
            { label: 'Baal Burned', id: 'user-baal-burned' },
            { label: 'Total Burned', id: 'user-total-burned' }
        ]);
        
        return panel;
    }

    renderHowItWorks() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        
        panel.innerHTML = `
            <h3>📖 How It Works</h3>
            <div class="how-it-works">
                <ol>
                    <li><strong>Choose Your Demon:</strong> Satan, Moloch, or Baal</li>
                    <li><strong>Enter Amount:</strong> How much ETH to sacrifice (in wei)</li>
                    <li><strong>Cast Your Vote:</strong> Click the demon button to burn ETH in their name</li>
                    <li><strong>Watch the Tally:</strong> All burned ETH goes to 0x000...000 (the void)</li>
                    <li><strong>Become Champion:</strong> Burn more than anyone else for a demon to become their Best Worshipper!</li>
                </ol>
                <p class="note">
                    ⚠️ <strong>Warning:</strong> All ETH sent is PERMANENTLY BURNED to the null address. There are no winners, no prizes - only eternal sacrifice to the void!
                </p>
                <p class="note">
                    🔥 <strong>The Game:</strong> Which demon will receive the most burned ETH? Can you become a demon's champion? Vote with your sacrifice!
                </p>
                <p class="note">
                    👑 <strong>Best Worshipper:</strong> The address that has burned the most ETH for each demon gets eternal glory as their champion!
                </p>
            </div>
        `;
        
        return panel;
    }

    setupListeners() {
        const satanButton = document.getElementById('vote-satan');
        const molochButton = document.getElementById('vote-moloch');
        const baalButton = document.getElementById('vote-baal');
        const amountInput = document.getElementById('vote-amount');
        
        if (satanButton) {
            satanButton.addEventListener('click', () => 
                this.vote('satan', amountInput.value)
            );
        }
        
        if (molochButton) {
            molochButton.addEventListener('click', () => 
                this.vote('moloch', amountInput.value)
            );
        }
        
        if (baalButton) {
            baalButton.addEventListener('click', () => 
                this.vote('baal', amountInput.value)
            );
        }
    }

    async vote(demon, weiAmount) {
        // Check wallet connection using base class method
        if (!this.requiresWallet('vote')) return;
        
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount to burn',
                type: 'warning'
            });
            return;
        }
        
        const demonNames = {
            'satan': { display: 'Satan 😈', method: 'vote_satan', button: 'vote-satan' },
            'moloch': { display: 'Moloch 🐂', method: 'vote_moloch', button: 'vote-moloch' },
            'baal': { display: 'Baal ⚡', method: 'vote_baal', button: 'vote-baal' }
        };
        
        const demonInfo = demonNames[demon];
        
        try {
            // Use TransactionHandler utility with loading state callback
            await TransactionHandler.execute(
                this.contract[demonInfo.method]({ 
                    value: ethers.BigNumber.from(weiAmount) 
                }),
                { 
                    game: 'satan-moloch-baal',
                    demon: demon,
                    wei: weiAmount 
                },
                (isLoading) => {
                    const btn = document.getElementById(demonInfo.button);
                    if (btn) {
                        btn.disabled = isLoading;
                        const originalContent = btn.innerHTML;
                        if (isLoading) {
                            btn.innerHTML = '<span class="demon-icon">🔥</span><span class="demon-name">BURNING...</span>';
                        } else {
                            // Restore original content
                            btn.innerHTML = originalContent;
                        }
                    }
                }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: `🔥 Burned ${DOMHelpers.formatWei(weiAmount)} for ${demonInfo.display}!`,
                type: 'success'
            });
            
            // Clear input and refresh state
            document.getElementById('vote-amount').value = '';
            await this.refreshState();
            
        } catch (error) {
            // Error already handled by TransactionHandler
            console.error('Vote failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
            // Get current standings
            const standings = await this.contract.get_current_standings();
            const satanTotal = standings[0];
            const molochTotal = standings[1];
            const baalTotal = standings[2];
            
            // Get vote counts
            const voteCounts = await this.contract.get_vote_counts();
            const satanVotes = voteCounts[0];
            const molochVotes = voteCounts[1];
            const baalVotes = voteCounts[2];
            
            // Calculate total
            const total = satanTotal.add(molochTotal).add(baalTotal);

            // Get best worshippers
            const bestWorshippers = await this.contract.get_all_best_worshippers();
            const satanBestAddr = bestWorshippers[0];
            const satanBestAmt = bestWorshippers[1];
            const molochBestAddr = bestWorshippers[2];
            const molochBestAmt = bestWorshippers[3];
            const baalBestAddr = bestWorshippers[4];
            const baalBestAmt = bestWorshippers[5];

            // Format champion display
            const formatChampion = (addr, amt, demonName) => {
                if (addr === '0x0000000000000000000000000000000000000000') {
                    return '<span class="no-champion">No champion yet</span>';
                }
                return `<div class="champion-info">
                    <div class="champion-line">
                        <span>👑 ${DOMHelpers.formatAddress(addr)}</span>
                        <button class="copy-btn-mini" onclick="navigator.clipboard.writeText('${addr}'); this.textContent='✓'; setTimeout(() => this.textContent='📋', 1000)" title="Copy address">📋</button>
                    </div>
                    <div class="champion-amount">${DOMHelpers.formatWei(amt)}</div>
                </div>`;
            };

            // Update Satan stats
            DOMHelpers.updateInfo('satan-total', DOMHelpers.formatWei(satanTotal));
            DOMHelpers.updateInfo('satan-votes', `${satanVotes} vote${satanVotes.toNumber() === 1 ? '' : 's'}`);
            document.getElementById('satan-champion').innerHTML = formatChampion(satanBestAddr, satanBestAmt, 'Satan');
            
            // Update Moloch stats
            DOMHelpers.updateInfo('moloch-total', DOMHelpers.formatWei(molochTotal));
            DOMHelpers.updateInfo('moloch-votes', `${molochVotes} vote${molochVotes.toNumber() === 1 ? '' : 's'}`);
            document.getElementById('moloch-champion').innerHTML = formatChampion(molochBestAddr, molochBestAmt, 'Moloch');
            
            // Update Baal stats
            DOMHelpers.updateInfo('baal-total', DOMHelpers.formatWei(baalTotal));
            DOMHelpers.updateInfo('baal-votes', `${baalVotes} vote${baalVotes.toNumber() === 1 ? '' : 's'}`);
            document.getElementById('baal-champion').innerHTML = formatChampion(baalBestAddr, baalBestAmt, 'Baal');
            
            // Update total burned
            DOMHelpers.updateInfo('total-burned', DOMHelpers.formatWei(total));

            // User-specific stats - only load if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const userBurnedPerDemon = await this.contract.get_user_burned_per_demon(
                    this.web3Provider.currentAddress
                );
                
                const satanBurned = userBurnedPerDemon[0];
                const molochBurned = userBurnedPerDemon[1];
                const baalBurned = userBurnedPerDemon[2];

                const userStats = await this.contract.get_user_stats(
                    this.web3Provider.currentAddress
                );
                const userTotalBurned = userStats[3];

                DOMHelpers.updateInfo('user-satan-burned', DOMHelpers.formatWei(satanBurned));
                DOMHelpers.updateInfo('user-moloch-burned', DOMHelpers.formatWei(molochBurned));
                DOMHelpers.updateInfo('user-baal-burned', DOMHelpers.formatWei(baalBurned));
                DOMHelpers.updateInfo('user-total-burned', DOMHelpers.formatWei(userTotalBurned));
            } else {
                // Read-only mode - show placeholder
                DOMHelpers.updateInfo('user-satan-burned', '👀 Read-only');
                DOMHelpers.updateInfo('user-moloch-burned', '👀 Read-only');
                DOMHelpers.updateInfo('user-baal-burned', '👀 Read-only');
                DOMHelpers.updateInfo('user-total-burned', 'Connect to play');
            }

        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state. Check console for details.',
                type: 'error'
            });
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('VoteCast', async (voter, demon, amount, totalForDemon) => {
            await this.refreshState();
            
            const demonNames = ['😈 Satan', '🐂 Moloch', '⚡ Baal'];
            const demonName = demonNames[demon] || 'Unknown';
            
            // Only show "you" messages if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYou = voter.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                if (isYou) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🔥 Your sacrifice to ${demonName} is complete!`,
                        type: 'success'
                    });
                }
            }
        });

        this.contract.on('NewBestWorshipper', async (demon, worshipper, totalAmount, previousBest) => {
            await this.refreshState();
            
            const demonNames = ['😈 Satan', '🐂 Moloch', '⚡ Baal'];
            const demonName = demonNames[demon] || 'Unknown';
            
            // Only show "you" messages if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYou = worshipper.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                if (isYou) {
                    eventBus.emit(EVENTS.CONFETTI);
                    eventBus.emit(EVENTS.TOAST, {
                        message: `👑 You are now the BEST WORSHIPPER of ${demonName}!`,
                        type: 'success'
                    });
                } else {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `👑 New champion for ${demonName}: ${DOMHelpers.formatAddress(worshipper)}`,
                        type: 'info'
                    });
                }
            }
        });

        this.contract.on('SacrificeCompleted', async (amount, recipient) => {
            // Could add additional effects here
            console.log(`Sacrifice of ${amount} wei sent to ${recipient}`);
        });
    }
}

