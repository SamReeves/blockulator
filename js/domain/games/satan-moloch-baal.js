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
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Voting Controls -->
                <div class="contest-info-panel" style="border: 2px solid #ef4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444;">
                        <span>🔥</span>
                        <span>Cast Your Vote by Burning ETH</span>
                    </h3>
                    <div style="text-align: center; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 12px; margin-top: 1rem; margin-bottom: 1.5rem;">
                        <strong style="color: #ef4444;">All donations go straight to the null address - eternal sacrifice!</strong>
                    </div>
                    
                    <div class="input-group" style="margin-bottom: 1.5rem;">
                        <label for="vote-amount" style="font-weight: 600; margin-bottom: 0.5rem; display: block;">Amount to Burn (wei)</label>
                        <input type="number" id="vote-amount" placeholder="Enter wei amount..." min="0" step="1" 
                            style="width: 100%; padding: 1rem; background: var(--md-sys-color-surface); border: 2px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-small); color: var(--md-sys-color-on-surface); font-size: 1.1rem; font-family: monospace; transition: border-color 0.2s;"
                            onfocus="this.style.borderColor='#ef4444'"
                            onblur="this.style.borderColor='var(--md-sys-color-outline)'"
                        />
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <button id="vote-satan" class="demon-button" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 6px 20px rgba(239, 68, 68, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'">
                            <span style="font-size: 3rem;">😈</span>
                            <span style="font-size: 1.25rem; font-weight: bold;">SATAN</span>
                            <span style="font-size: 0.75rem; opacity: 0.9;">The Adversary</span>
                        </button>
                        
                        <button id="vote-moloch" class="demon-button" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 6px 20px rgba(245, 158, 11, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.3)'">
                            <span style="font-size: 3rem;">🐂</span>
                            <span style="font-size: 1.25rem; font-weight: bold;">MOLOCH</span>
                            <span style="font-size: 0.75rem; opacity: 0.9;">The Bull God</span>
                        </button>
                        
                        <button id="vote-baal" class="demon-button" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 6px 20px rgba(139, 92, 246, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.3)'">
                            <span style="font-size: 3rem;">⚡</span>
                            <span style="font-size: 1.25rem; font-weight: bold;">BAAL</span>
                            <span style="font-size: 0.75rem; opacity: 0.9;">Lord of Storms</span>
                        </button>
                    </div>
                </div>

                <!-- Demon Standings -->
                <div class="contest-info-panel">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>📊</span>
                        <span>Demon Standings</span>
                    </h3>
                    <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                        <div style="padding: 1.5rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%); border-radius: 12px; border-left: 4px solid #ef4444;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                <span style="font-size: 2.5rem;">😈</span>
                                <div>
                                    <div style="font-size: 1.25rem; font-weight: bold; color: #ef4444;">Satan</div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">The Adversary</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Total Burned</div>
                                    <div id="satan-total" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Votes</div>
                                    <div id="satan-votes" style="font-size: 1.25rem; font-weight: bold;">0</div>
                                </div>
                            </div>
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(239, 68, 68, 0.2);">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Champion</div>
                                <div id="satan-champion" style="font-family: monospace; font-size: 0.875rem;">No champion yet</div>
                            </div>
                        </div>

                        <div style="padding: 1.5rem; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                <span style="font-size: 2.5rem;">🐂</span>
                                <div>
                                    <div style="font-size: 1.25rem; font-weight: bold; color: #f59e0b;">Moloch</div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">The Bull God</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Total Burned</div>
                                    <div id="moloch-total" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Votes</div>
                                    <div id="moloch-votes" style="font-size: 1.25rem; font-weight: bold;">0</div>
                                </div>
                            </div>
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(245, 158, 11, 0.2);">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Champion</div>
                                <div id="moloch-champion" style="font-family: monospace; font-size: 0.875rem;">No champion yet</div>
                            </div>
                        </div>

                        <div style="padding: 1.5rem; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%); border-radius: 12px; border-left: 4px solid #8b5cf6;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                <span style="font-size: 2.5rem;">⚡</span>
                                <div>
                                    <div style="font-size: 1.25rem; font-weight: bold; color: #8b5cf6;">Baal</div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">Lord of Storms</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Total Burned</div>
                                    <div id="baal-total" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Votes</div>
                                    <div id="baal-votes" style="font-size: 1.25rem; font-weight: bold;">0</div>
                                </div>
                            </div>
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(139, 92, 246, 0.2);">
                                <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Champion</div>
                                <div id="baal-champion" style="font-family: monospace; font-size: 0.875rem;">No champion yet</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%); border-radius: 12px; text-align: center; border: 2px solid #ef4444;">
                        <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">🔥 Total Sacrificed to the Void</div>
                        <div id="total-burned" style="font-size: 2rem; font-weight: bold; color: #ef4444;">0 wei</div>
                    </div>
                </div>

                <!-- Your Stats -->
                <div class="contest-info-panel" style="border: 2px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                        <span>📈</span>
                        <span>Your Stats</span>
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                        <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">😈 Satan Burned</div>
                            <div id="user-satan-burned" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">🐂 Moloch Burned</div>
                            <div id="user-moloch-burned" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">⚡ Baal Burned</div>
                            <div id="user-baal-burned" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 4px solid #10b981;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">🔥 Total Burned</div>
                            <div id="user-total-burned" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                        </div>
                    </div>
                </div>

                <!-- How It Works -->
                <div class="contest-info-panel">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>📖</span>
                        <span>The Ritual</span>
                    </h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.05); border-radius: 8px; border-left: 4px solid #ef4444;">
                                <div style="font-size: 2rem; font-weight: bold; color: #ef4444; min-width: 2.5rem;">1</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Choose Your Demon</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Vote for Satan, Moloch, or Baal - pledge your allegiance</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.05); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; min-width: 2.5rem;">2</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Burn Your ETH</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">All donations are sent to address(0) - the eternal void. Your ETH is destroyed forever</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6; min-width: 2.5rem;">3</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Become Champion</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">The highest donor per demon becomes their champion - eternal glory</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%); border-radius: 8px; border: 2px solid #ef4444;">
                                <div style="font-size: 2rem; font-weight: bold; color: #ef4444; min-width: 2.5rem;">⚠️</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: #ef4444;">No Rewards - Pure Sacrifice</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">There are NO refunds, NO winners, NO prizes. All ETH is permanently destroyed. This is digital sacrifice to the void.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
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

