/**
 * Pissing Contest - Simplified Version
 * Send the highest donation to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class PissingContest extends Game {
    getContractName() {
        return 'pissing-contest';
    }

    render() {
        // Header with contract info
        const header = GameRenderer.createGameHeader({
            title: '💦 Pissing Contest',
            description: 'Send the HIGHEST donation to win the pot!',
            contractAddress: CONTRACT_ADDRESSES.PISSING_CONTEST,
            sourceFile: CONTRACT_SOURCES.PISSING_CONTEST,
            abiFile: CONTRACT_ABIS.PISSING_CONTEST
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Current Leader Display -->
                <div class="contest-info-panel" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">💦</div>
                    <h3 style="color: white; position: relative; z-index: 1;">🏆 CURRENT LEADER</h3>
                    <div style="text-align: center; padding: 2rem 0; position: relative; z-index: 1;">
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Highest Donor</div>
                        <div id="current-leader" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                            No donations yet
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">PRIZE POOL</div>
                                <div id="prize-pool" style="font-size: 1.5rem; font-weight: bold;">0 wei</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; backdrop-filter: blur(10px);">
                                <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">DONATIONS</div>
                                <div id="donations-count" style="font-size: 1.5rem; font-weight: bold;">0 / 0</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Your Status Panel -->
                <div class="contest-info-panel" style="border: 2px solid #3b82f6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>📊</span>
                        <span>Your Status</span>
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                        <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Your Donation</div>
                            <div id="your-donation" style="font-size: 1.25rem; font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Status</div>
                            <div id="your-status" style="font-size: 1.25rem; font-weight: bold;">Not playing</div>
                        </div>
                    </div>
                </div>

                <!-- Donate Panel -->
                <div class="contest-info-panel" style="border: 2px solid #10b981;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                        <span>💰</span>
                        <span>Make Your Donation</span>
                    </h3>
                    <div class="game-controls">
                        <div class="input-group" style="margin-top: 1rem;">
                            <label for="donate-amount" style="font-weight: 600; margin-bottom: 0.5rem; display: block;">Donation Amount (wei)</label>
                            <input 
                                type="number" 
                                id="donate-amount" 
                                placeholder="Enter amount in wei..."
                                min="0"
                                step="1"
                                style="width: 100%; padding: 1rem; background: var(--md-sys-color-surface); border: 2px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-small); color: var(--md-sys-color-on-surface); font-size: 1.1rem; font-family: monospace; transition: border-color 0.2s;"
                                onfocus="this.style.borderColor='#10b981'"
                                onblur="this.style.borderColor='var(--md-sys-color-outline)'"
                            />
                        </div>
                        
                        <button id="donate-button" class="btn-play" style="width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            💰 Donate & Compete
                        </button>
                        
                        <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                <span style="font-size: 1.5rem;">💡</span>
                                <strong style="font-size: 1.1rem; color: #f59e0b;">Pro Strategy</strong>
                            </div>
                            <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                <li>Send MORE than the current leader to take first place</li>
                                <li>You can donate multiple times - only your HIGHEST counts</li>
                                <li>Winner gets 99% of the total prize pool</li>
                                <li>Round ends when max donations is reached</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- How It Works Panel -->
                <div class="contest-info-panel">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>📖</span>
                        <span>How It Works</span>
                    </h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #3b82f6; min-width: 2.5rem;">1</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Make Your Donation</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">Send any amount of wei to enter the current round</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6; min-width: 2.5rem;">2</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Compete for the Lead</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">The HIGHEST single donation becomes the leader</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 4px solid #10b981;">
                                <div style="font-size: 2rem; font-weight: bold; color: #10b981; min-width: 2.5rem;">3</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Round Completion</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">When max donations is reached, the round ends automatically</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(251, 191, 36, 0.05); border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b; min-width: 2.5rem;">4</div>
                                <div>
                                    <strong style="display: block; margin-bottom: 0.25rem; color: var(--md-sys-color-on-surface);">Winner Takes the Pot</strong>
                                    <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">The leader wins 99% of the total prize pool!</span>
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
        const donateButton = document.getElementById('donate-button');
        const amountInput = document.getElementById('donate-amount');
        
        if (donateButton) {
            donateButton.addEventListener('click', () => 
                this.donate(amountInput.value)
            );
        }
        
        // Enter key support
        if (amountInput) {
            amountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.donate(e.target.value);
                }
            });
        }
    }

    async donate(weiAmount) {
        // Check wallet connection using base class method
        if (!this.requiresWallet('donate')) return;
        
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            // Use TransactionHandler utility with loading state callback
            await TransactionHandler.execute(
                this.contract.donate({ 
                    value: ethers.BigNumber.from(weiAmount) 
                }),
                { 
                    game: 'pissing-contest', 
                    wei: weiAmount 
                },
                (isLoading) => {
                    const btn = document.getElementById('donate-button');
                    if (btn) {
                        btn.disabled = isLoading;
                        btn.textContent = isLoading ? '⏳ Donating...' : '💰 Donate & Compete';
                    }
                }
            );
            
            // Clear input and refresh state
            document.getElementById('donate-amount').value = '';
            await this.refreshState();
            
        } catch (error) {
            // Error already handled by TransactionHandler
            console.error('Donation failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
            const roundInfo = await this.contract.get_current_round_info();
            
            // Handle both BigNumber and regular number types
            const donationCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
            const maxDonations = typeof roundInfo[2] === 'number' ? roundInfo[2] : roundInfo[2].toNumber();
            const largestDonor = roundInfo[4];
            const totalValue = roundInfo[5];

            // Update UI using DOMHelpers - these work in read-only mode
            DOMHelpers.updateInfo('prize-pool', 
                DOMHelpers.formatWei(totalValue)
            );
            DOMHelpers.updateInfo('donations-count', 
                `${donationCount} / ${maxDonations}`
            );
            DOMHelpers.updateInfo('current-leader', 
                largestDonor === '0x0000000000000000000000000000000000000000'
                    ? 'No donations yet'
                    : DOMHelpers.formatAddress(largestDonor)
            );

            // User-specific info - only load if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const userPosition = await this.contract.get_current_leaderboard_position(
                    this.web3Provider.currentAddress
                );
                const userDonation = userPosition[0];
                const isWinning = userPosition[1];

                DOMHelpers.updateInfo('your-donation', 
                    DOMHelpers.formatWei(userDonation)
                );
                
                DOMHelpers.updateInfo('your-status', 
                    userDonation.gt(0) 
                        ? (isWinning ? '🥇 Leading!' : '📊 Playing')
                        : 'Not playing'
                );
            } else {
                // Read-only mode - show placeholder
                DOMHelpers.updateInfo('your-donation', '👀 Read-only mode');
                DOMHelpers.updateInfo('your-status', 'Connect to play');
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

        this.contract.on('DonationReceived', async (roundNumber, donor, amount, donationNumber, isLargest) => {
            await this.refreshState();
            
            // Only show "you" messages if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                if (isYou && isLargest) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: '🏆 You are now leading!',
                        type: 'success'
                    });
                }
            }
        });

        this.contract.on('RoundEnded', async (roundNumber, winner, prize) => {
            // Check if winner is you, but only if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                
                if (isYou) {
                    eventBus.emit(EVENTS.CONFETTI);
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🎉 YOU WON ${DOMHelpers.formatWei(prize)}!`,
                        type: 'success'
                    });
                } else {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `Round ended. Winner: ${DOMHelpers.formatAddress(winner)}`,
                        type: 'info'
                    });
                }
            } else {
                // Read-only mode - just show winner
                eventBus.emit(EVENTS.TOAST, {
                    message: `Round ended. Winner: ${DOMHelpers.formatAddress(winner)}`,
                    type: 'info'
                });
            }
            
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

