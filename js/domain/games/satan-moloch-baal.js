/**
 * Satan, Moloch, Baal - The Infernal Voting Game
 * Vote for your favorite demon by burning ETH in their name
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { LazySusan3D } from '../../presentation/components/lazy-susan-3d.js';

export class SatanMolochBaal extends Game {
    constructor() {
        super();
        this.voteInput = null;
        this.lazySusan = null;
        this.demons = [
            { emoji: '😈', name: 'SATAN', subtitle: 'The Adversary', color: '#ef4444', key: 'satan' },
            { emoji: '🐂', name: 'MOLOCH', subtitle: 'The Bull God', color: '#f59e0b', key: 'moloch' },
            { emoji: '⚡', name: 'BAAL', subtitle: 'Lord of Storms', color: '#8b5cf6', key: 'baal' }
        ];
    }

    getContractName() {
        return 'satan-moloch-baal';
    }

    render() {
        // Clear container first to prevent duplicates
        this.container.innerHTML = '';
        
        // Header with contract info
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
                <!-- Left Column: Lazy Susan & Voting -->
                <div class="contest-info-panel" style="border: 2px solid #ef4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444;">
                        <span>🔥</span>
                        <span>Choose Your Demon</span>
                    </h3>
                    
                    <!-- 3D Lazy Susan -->
                    <div id="lazy-susan-container" style="margin: 1rem 0;"></div>
                    
                    <!-- Vote Amount Input -->
                    <div id="vote-amount-input" style="margin-top: 1.5rem;"></div>
                    
                    <div style="text-align: center; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #ef4444;">
                        <strong>⚠️ All ETH is burned to address(0) forever!</strong>
                    </div>
                </div>

                <!-- Right Column: Stats & Info -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Demon Standings -->
                    <div class="contest-info-panel">
                        <h3 style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <span>👹</span>
                                <span>Demon Standings</span>
                            </span>
                            <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">🔥 <span id="total-burned">0 wei</span></span>
                        </h3>
                        
                        <div id="demon-standings" style="display: grid; gap: 0.75rem;"></div>
                    </div>

                    <!-- Your Stats -->
                    <div class="contest-info-panel" style="border: 2px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981; margin-bottom: 1rem;">
                            <span>📈</span>
                            <span>Your Sacrifices</span>
                        </h3>
                        <div id="user-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;"></div>
                    </div>

                    <!-- How It Works -->
                    <details class="contest-info-panel" style="cursor: pointer;">
                        <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                            <span>▶</span>
                            <span>📖 The Ritual</span>
                        </summary>
                        <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6; display: grid; gap: 0.5rem;">
                            <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.05); border-radius: 8px; border-left: 3px solid #ef4444;">
                                <strong>1. Choose Demon</strong> - Rotate to select, then vote
                            </div>
                            <div style="padding: 0.75rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 3px solid #f59e0b;">
                                <strong>2. Burn ETH</strong> - Sent to address(0), destroyed forever
                            </div>
                            <div style="padding: 0.75rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 3px solid #8b5cf6;">
                                <strong>3. Become Champion</strong> - Highest donor per demon
                            </div>
                            <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.15); border-radius: 8px; border: 2px solid #ef4444;">
                                <strong style="color: #ef4444;">⚠️ Pure Sacrifice:</strong> NO refunds, NO prizes. ETH is permanently destroyed!
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.voteInput = new this.components.ValueInput('vote-amount-input', {
            label: 'Amount to Burn',
            hint: 'All goes to the null address - eternal sacrifice!',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.voteInput.render();
        
        // Initialize LazySusan3D component
        this.lazySusan = new LazySusan3D('lazy-susan-container', {
            items: this.demons,
            onSelect: (index, demon) => {
                // When user confirms selection (clicks VOTE NOW button), vote
                this.vote(demon.key);
            }
        });
        this.lazySusan.init();
        
        // Populate initial structure
        this.renderDemonStandings();
        this.renderUserStats();
    }
    
    renderDemonStandings() {
        const container = document.getElementById('demon-standings');
        if (!container) return;
        
        container.innerHTML = this.demons.map(demon => `
            <div style="padding: 1rem; background: linear-gradient(135deg, ${demon.color}19 0%, ${demon.color}0d 100%); border-radius: 8px; border-left: 4px solid ${demon.color};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">${demon.emoji}</span>
                        <span style="font-weight: bold; color: ${demon.color};">${demon.name}</span>
                    </div>
                    <div id="${demon.key}-votes" style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">0 votes</div>
                </div>
                <div id="${demon.key}-total" style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">0 wei</div>
                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                    <span>👑</span> <span id="${demon.key}-champion">None</span>
                </div>
            </div>
        `).join('');
    }
    
    renderUserStats() {
        const container = document.getElementById('user-stats');
        if (!container) return;
        
        const stats = [
            ...this.demons.map(demon => ({
                key: `user-${demon.key}-burned`,
                label: `${demon.emoji} ${demon.name}`,
                color: demon.color
            })),
            { key: 'user-total-burned', label: '🔥 Total', color: '#10b981' }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div style="padding: 0.75rem; background: ${stat.color}19; border-radius: 8px; border-left: 3px solid ${stat.color};">
                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">${stat.label}</div>
                <div id="${stat.key}" style="font-size: 1rem; font-weight: bold;">0 wei</div>
            </div>
        `).join('');
    }

    setupListeners() {
        // Lazy susan handles demon selection via callback
        // No additional listeners needed
    }

    async vote(demonKey) {
        if (!this.requiresWallet('vote')) return;
        
        const weiAmount = this.voteInput.getWeiValue();
        if (!weiAmount || weiAmount.eq(0)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Please enter a valid amount to burn',
                type: 'warning'
            });
            return;
        }
        
        const demon = this.demons.find(d => d.key === demonKey);
        if (!demon) return;
        
        try {
            await TransactionHandler.execute(
                this.contract[`vote_${demonKey}`]({ value: weiAmount }),
                { game: 'satan-moloch-baal', demon: demonKey, wei: weiAmount.toString() }
            );
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: `🔥 Burned ${this.dom.formatWei(weiAmount)} for ${demon.emoji} ${demon.name}!`,
                type: 'success'
            });
            
            this.voteInput.reset();
            this.lazySusan?.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Vote failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
            // Get all data in parallel
            const [standings, voteCounts, bestWorshippers] = await Promise.all([
                this.contract.get_current_standings(),
                this.contract.get_vote_counts(),
                this.contract.get_all_best_worshippers()
            ]);
            
            // Calculate total burned
            const total = standings.reduce((sum, val) => sum.add(val), standings[0].mul(0));
            this.dom.updateInfo('total-burned', this.dom.formatWei(total));

            // Update each demon's stats
            this.demons.forEach((demon, i) => {
                const voteCount = voteCounts[i];
                this.dom.updateInfo(`${demon.key}-total`, this.dom.formatWei(standings[i]));
                this.dom.updateInfo(`${demon.key}-votes`, `${voteCount} vote${voteCount.toNumber() === 1 ? '' : 's'}`);
                
                const championAddr = bestWorshippers[i * 2];
                const championDisplay = championAddr === '0x0000000000000000000000000000000000000000' 
                    ? 'None' 
                    : this.dom.formatAddress(championAddr);
                this.dom.updateInfo(`${demon.key}-champion`, championDisplay);
            });

            // User-specific stats
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const [userBurnedPerDemon, userStats] = await Promise.all([
                    this.contract.get_user_burned_per_demon(this.web3Provider.currentAddress),
                    this.contract.get_user_stats(this.web3Provider.currentAddress)
                ]);
                
                this.demons.forEach((demon, i) => {
                    this.dom.updateInfo(`user-${demon.key}-burned`, this.dom.formatWei(userBurnedPerDemon[i]));
                });
                this.dom.updateInfo('user-total-burned', this.dom.formatWei(userStats[3]));
            } else {
                // Read-only mode
                this.demons.forEach(demon => {
                    this.dom.updateInfo(`user-${demon.key}-burned`, '👀');
                });
                this.dom.updateInfo('user-total-burned', 'Connect wallet');
            }

        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load game state.',
                type: 'error'
            });
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('VoteCast', async (voter, demonIndex) => {
            await this.refreshState();
            
            const demon = this.demons[demonIndex];
            const demonDisplay = `${demon.emoji} ${demon.name}`;
            
            if (this.web3Provider.isConnected() && 
                voter.toLowerCase() === this.web3Provider.currentAddress?.toLowerCase()) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `🔥 Your sacrifice to ${demonDisplay} is complete!`,
                    type: 'success'
                });
            }
        });

        this.contract.on('NewBestWorshipper', async (demonIndex, worshipper) => {
            await this.refreshState();
            
            const demon = this.demons[demonIndex];
            const demonDisplay = `${demon.emoji} ${demon.name}`;
            const isYou = this.web3Provider.isConnected() && 
                worshipper.toLowerCase() === this.web3Provider.currentAddress?.toLowerCase();
            
            if (isYou) {
                this.events.bus.emit(this.events.EVENTS.CONFETTI);
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `👑 You are the CHAMPION of ${demonDisplay}!`,
                    type: 'success'
                });
            } else if (this.web3Provider.isConnected()) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `👑 ${demonDisplay} has a new champion!`,
                    type: 'info'
                });
            }
        });
    }
    
    destroy() {
        // Clean up lazy susan
        if (this.lazySusan) {
            this.lazySusan.destroy();
            this.lazySusan = null;
        }
        
        // Call parent destroy
        super.destroy();
    }
}

