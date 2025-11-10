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
import { ValueInput } from '../../presentation/components/value-input.js';
import { AddressBadge } from '../../presentation/components/address-badge.js';

export class PissingContest extends Game {
    constructor() {
        super();
        this.donationInput = null;
    }

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

                <!-- Compact Stats & Info Tabs -->
                <div class="contest-info-panel">
                    <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid var(--md-sys-color-outline); margin-bottom: 1rem; flex-wrap: wrap;">
                        <button class="tab-btn active" data-tab="current" style="padding: 0.75rem 1rem; background: none; border: none; border-bottom: 3px solid #3b82f6; cursor: pointer; font-weight: bold; color: #3b82f6;">
                            📊 Current Round
                        </button>
                        <button class="tab-btn" data-tab="stats" style="padding: 0.75rem 1rem; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; color: var(--md-sys-color-on-surface-variant);">
                            📈 Your Stats
                        </button>
                        <button class="tab-btn" data-tab="history" style="padding: 0.75rem 1rem; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; color: var(--md-sys-color-on-surface-variant);">
                            🏆 History
                        </button>
                        <button class="tab-btn" data-tab="global" style="padding: 0.75rem 1rem; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; color: var(--md-sys-color-on-surface-variant);">
                            🌍 Global
                        </button>
                    </div>
                    
                    <!-- Current Round Tab -->
                    <div id="tab-current" class="tab-content">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                            <div style="padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 3px solid #3b82f6;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Your Donation</div>
                                <div id="your-donation" style="font-size: 1rem; font-weight: bold;">0 wei</div>
                            </div>
                            <div style="padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 3px solid #8b5cf6;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Status</div>
                                <div id="your-status" style="font-size: 1rem; font-weight: bold;">Not playing</div>
                            </div>
                        </div>
                        <div id="leaderboard-position" style="margin-top: 0.75rem; padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Position</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">-</div>
                        </div>
                    </div>
                    
                    <!-- Your Stats Tab -->
                    <div id="tab-stats" class="tab-content" style="display: none;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                            <div style="padding: 0.75rem; background: rgba(236, 72, 153, 0.1); border-radius: 8px; border-left: 3px solid #ec4899;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Lifetime Donated</div>
                                <div id="lifetime-donated" style="font-size: 1rem; font-weight: bold;">0 wei</div>
                            </div>
                            <div style="padding: 0.75rem; background: rgba(236, 72, 153, 0.1); border-radius: 8px; border-left: 3px solid #ec4899;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Lifetime Won</div>
                                <div id="lifetime-won" style="font-size: 1rem; font-weight: bold;">0 wei</div>
                            </div>
                            <div style="padding: 0.75rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border-left: 3px solid #f59e0b;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Rounds Won</div>
                                <div id="rounds-won" style="font-size: 1rem; font-weight: bold;">0</div>
                            </div>
                            <div style="padding: 0.75rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border-left: 3px solid #f59e0b;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Rounds Played</div>
                                <div id="rounds-participated" style="font-size: 1rem; font-weight: bold;">0</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- History Tab -->
                    <div id="tab-history" class="tab-content" style="display: none;">
                        <div id="winners-history" style="max-height: 300px; overflow-y: auto;">
                            <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                                Loading history...
                            </div>
                        </div>
                    </div>
                    
                    <!-- Global Stats Tab -->
                    <div id="tab-global" class="tab-content" style="display: none;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                            <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Total Rounds</div>
                                <div id="total-rounds" style="font-size: 1rem; font-weight: bold;">0</div>
                            </div>
                            <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
                                <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">Total Donated</div>
                                <div id="total-donated" style="font-size: 1rem; font-weight: bold;">0 wei</div>
                            </div>
                        </div>
                        <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
                            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem; text-transform: uppercase;">All-Time Record</div>
                            <div id="highest-donation" style="font-size: 1rem; font-weight: bold; margin-bottom: 0.25rem;">0 wei</div>
                            <div style="font-size: 0.7rem; font-family: monospace; color: var(--md-sys-color-on-surface-variant);">
                                By: <span id="highest-donor">-</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Admin Panel (only visible to owner) -->
                <div id="admin-panel" class="contest-info-panel" style="border: 2px solid #ef4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%); display: none;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444; margin-bottom: 0.75rem;">
                        <span>⚙️</span>
                        <span>Admin Panel</span>
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.875rem;">
                        <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Status</div>
                            <div id="contract-paused" style="font-weight: bold;">No</div>
                        </div>
                        <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Fee</div>
                            <div id="config-fee" style="font-weight: bold;">-</div>
                        </div>
                        <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Min</div>
                            <div id="config-min" style="font-weight: bold;">-</div>
                        </div>
                        <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">Max</div>
                            <div id="config-max" style="font-weight: bold;">-</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <button id="toggle-pause-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.875rem;">
                            🔄 Pause
                        </button>
                        <button id="end-round-early-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.875rem;">
                            🏁 End Early
                        </button>
                    </div>
                </div>

                <!-- Donate Panel -->
                <div class="contest-info-panel" style="border: 2px solid #10b981;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                        <span>💰</span>
                        <span>Make Your Donation</span>
                    </h3>
                    <div class="game-controls">
                        <div id="donate-amount-input" style="margin-top: 1rem;"></div>
                        
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

                <!-- How It Works - Collapsible -->
                <details class="contest-info-panel" style="cursor: pointer;">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span id="how-it-works-toggle">▶</span>
                        <span>📖 How It Works</span>
                    </summary>
                    <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6;">
                        <div style="padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 3px solid #3b82f6; margin-bottom: 0.5rem;">
                            <strong>1. Donate</strong> - Send any amount to enter the round
                        </div>
                        <div style="padding: 0.75rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border-left: 3px solid #8b5cf6; margin-bottom: 0.5rem;">
                            <strong>2. Compete</strong> - Highest single donation leads
                        </div>
                        <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border-left: 3px solid #10b981; margin-bottom: 0.5rem;">
                            <strong>3. Round Ends</strong> - When max donations reached
                        </div>
                        <div style="padding: 0.75rem; background: rgba(251, 191, 36, 0.05); border-radius: 8px; border-left: 3px solid #f59e0b;">
                            <strong>4. Winner Gets 99%</strong> - Leader wins the pot!
                        </div>
                    </div>
                </details>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new ValueInput('donate-amount-input', {
            label: 'Donation Amount',
            hint: 'Send the highest amount to lead!',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
    }

    setupListeners() {
        const donateButton = document.getElementById('donate-button');
        
        if (donateButton) {
            donateButton.addEventListener('click', () => this.donate());
        }
        
        // Setup tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update buttons
                tabButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottom = '3px solid transparent';
                    b.style.fontWeight = 'normal';
                    b.style.color = 'var(--md-sys-color-on-surface-variant)';
                });
                btn.classList.add('active');
                btn.style.borderBottom = '3px solid #3b82f6';
                btn.style.fontWeight = 'bold';
                btn.style.color = '#3b82f6';
                
                // Update content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                const targetTab = document.getElementById(`tab-${tabName}`);
                if (targetTab) {
                    targetTab.style.display = 'block';
                }
            });
        });
    }

    async donate() {
        // Check wallet connection using base class method
        if (!this.requiresWallet('donate')) return;
        
        const weiAmount = this.donationInput.getWeiValue();
        
        if (!weiAmount || weiAmount.eq(0)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid donation amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            // Use TransactionHandler utility with loading state callback
            await TransactionHandler.execute(
                this.contract.donate({ value: weiAmount }),
                { 
                    game: 'pissing-contest', 
                    wei: weiAmount.toString() 
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
            this.donationInput.reset();
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
            // Update leader with badge
            const leaderEl = document.getElementById('current-leader');
            if (leaderEl) {
                if (largestDonor === '0x0000000000000000000000000000000000000000') {
                    leaderEl.textContent = 'No donations yet';
                } else {
                    const leaderDisplay = await AddressBadge.createWithAddress(largestDonor, this.web3Provider, {
                        size: 32,
                        formatAddress: true,
                        addressStyle: 'font-size: 1.25rem; font-weight: bold;'
                    });
                    leaderEl.innerHTML = '';
                    leaderEl.appendChild(leaderDisplay);
                }
            }

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
                
                // Get user lifetime stats
                const userStats = await this.contract.get_user_stats(this.web3Provider.currentAddress);
                DOMHelpers.updateInfo('lifetime-donated', DOMHelpers.formatWei(userStats[0]));
                DOMHelpers.updateInfo('lifetime-won', DOMHelpers.formatWei(userStats[1]));
                DOMHelpers.updateInfo('rounds-won', userStats[2].toString());
                DOMHelpers.updateInfo('rounds-participated', userStats[3].toString());
                
                // Update leaderboard position
                const positionElement = document.getElementById('leaderboard-position');
                if (positionElement) {
                    if (userDonation.gt(0)) {
                        positionElement.innerHTML = `
                            <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">Your Current Position</div>
                            <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">
                                ${isWinning ? '🥇 #1 - LEADING!' : '📊 Competing'}
                            </div>
                            <div style="font-size: 0.875rem; margin-top: 0.5rem;">
                                Your donation: ${DOMHelpers.formatWei(userDonation)}
                            </div>
                        `;
                    } else {
                        positionElement.innerHTML = `
                            <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">Your Current Position</div>
                            <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">-</div>
                            <div style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--md-sys-color-on-surface-variant);">
                                Not participating this round
                            </div>
                        `;
                    }
                }
            } else {
                // Read-only mode - show placeholder
                DOMHelpers.updateInfo('your-donation', '👀 Read-only mode');
                DOMHelpers.updateInfo('your-status', 'Connect to play');
                DOMHelpers.updateInfo('lifetime-donated', 'Connect wallet');
                DOMHelpers.updateInfo('lifetime-won', 'Connect wallet');
                DOMHelpers.updateInfo('rounds-won', '-');
                DOMHelpers.updateInfo('rounds-participated', '-');
            }
            
            // Global stats - available to everyone
            const globalStats = await this.contract.get_global_stats();
            DOMHelpers.updateInfo('total-rounds', globalStats[0].toString());
            DOMHelpers.updateInfo('highest-donation', DOMHelpers.formatWei(globalStats[1]));
            
            // Update all-time champion with badge
            const championEl = document.getElementById('highest-donor');
            if (championEl) {
                if (globalStats[2] === '0x0000000000000000000000000000000000000000') {
                    championEl.textContent = 'No donations yet';
                } else {
                    const championDisplay = await AddressBadge.createWithAddress(globalStats[2], this.web3Provider, {
                        size: 24,
                        formatAddress: true
                    });
                    championEl.innerHTML = '';
                    championEl.appendChild(championDisplay);
                }
            }
            
            // Calculate total donated (we don't have this directly, so use contract balance as proxy)
            const contractBalance = await this.contract.get_contract_balance();
            DOMHelpers.updateInfo('total-donated', DOMHelpers.formatWei(contractBalance));
            
            // Load winners history
            await this.loadWinnersHistory();
            
            // Check if current user is owner and show admin panel
            await this.checkAdminAccess();

        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state. Check console for details.',
                type: 'error'
            });
        }
    }
    
    async loadWinnersHistory() {
        try {
            const winners = await this.contract.get_recent_winners(10);
            const historyContainer = document.getElementById('winners-history');
            
            if (!historyContainer) return;
            
            if (!winners || winners.length === 0) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        No completed rounds yet
                    </div>
                `;
                return;
            }
            
            // Get detailed info for each winner
            const winnerDetails = await Promise.all(
                winners.slice().reverse().map(async (winner, index) => {
                    const roundNumber = winners.length - index;
                    try {
                        const roundResult = await this.contract.get_round_result(roundNumber);
                        return {
                            roundNumber,
                            winner: roundResult[0],
                            prize: roundResult[1],
                            totalDonations: roundResult[2],
                            donationCount: roundResult[3],
                            largestDonation: roundResult[4]
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );
            
            // Create history entries with badges
            const filteredDetails = winnerDetails.filter(detail => detail !== null);
            
            if (filteredDetails.length === 0) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        No round details available
                    </div>
                `;
                return;
            }
            
            historyContainer.innerHTML = '';
            
            for (let index = 0; index < filteredDetails.length; index++) {
                const detail = filteredDetails[index];
                const isRecent = index === 0;
                
                const entry = document.createElement('div');
                entry.style.cssText = `padding: 0.75rem; background: ${isRecent ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.05)'}; border-radius: 6px; border-left: 3px solid ${isRecent ? '#f59e0b' : 'var(--md-sys-color-outline)'}; margin-bottom: 0.5rem; font-size: 0.875rem;`;
                
                const flexContainer = document.createElement('div');
                flexContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;';
                
                const leftDiv = document.createElement('div');
                const roundLabel = document.createElement('strong');
                roundLabel.style.cssText = 'font-size: 0.875rem; display: block; margin-bottom: 0.25rem;';
                roundLabel.textContent = `${isRecent ? '🏆 ' : ''}#${detail.roundNumber}`;
                leftDiv.appendChild(roundLabel);
                
                // Add badge + address
                const addressDisplay = await AddressBadge.createWithAddress(detail.winner, this.web3Provider, {
                    size: 16,
                    formatAddress: true,
                    addressStyle: 'font-size: 0.7rem; font-family: monospace; color: var(--md-sys-color-on-surface-variant);'
                });
                leftDiv.appendChild(addressDisplay);
                
                const rightDiv = document.createElement('div');
                rightDiv.style.cssText = 'text-align: right;';
                rightDiv.innerHTML = `
                    <div style="font-weight: bold; font-size: 0.875rem;">
                        ${DOMHelpers.formatWei(detail.prize)}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant);">
                        ${detail.donationCount} plays
                    </div>
                `;
                
                flexContainer.appendChild(leftDiv);
                flexContainer.appendChild(rightDiv);
                entry.appendChild(flexContainer);
                historyContainer.appendChild(entry);
            }
                
        } catch (error) {
            console.error('Failed to load winners history:', error);
            const historyContainer = document.getElementById('winners-history');
            if (historyContainer) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        Failed to load history
                    </div>
                `;
            }
        }
    }
    
    async checkAdminAccess() {
        try {
            const config = await this.contract.get_config();
            const owner = config[0];
            const adminPanel = document.getElementById('admin-panel');
            
            if (!adminPanel) return;
            
            // Show admin panel if current user is owner
            if (this.web3Provider?.currentAddress && 
                this.web3Provider.currentAddress.toLowerCase() === owner.toLowerCase()) {
                adminPanel.style.display = 'block';
                
                // Update config display
                const paused = config[4];
                const feeBp = config[1];
                const maxDonations = config[2];
                const minDonation = config[3];
                
                DOMHelpers.updateInfo('contract-paused', paused ? 'Yes ⚠️' : 'No ✅');
                DOMHelpers.updateInfo('config-fee', `${(feeBp / 100).toFixed(2)}%`);
                DOMHelpers.updateInfo('config-min', DOMHelpers.formatWei(minDonation));
                DOMHelpers.updateInfo('config-max', maxDonations.toString());
                
                // Setup admin button listeners
                this.setupAdminListeners();
            } else {
                adminPanel.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to check admin access:', error);
        }
    }
    
    setupAdminListeners() {
        const togglePauseBtn = document.getElementById('toggle-pause-btn');
        const endRoundBtn = document.getElementById('end-round-early-btn');
        
        if (togglePauseBtn) {
            togglePauseBtn.replaceWith(togglePauseBtn.cloneNode(true));
            document.getElementById('toggle-pause-btn').addEventListener('click', () => this.togglePause());
        }
        
        if (endRoundBtn) {
            endRoundBtn.replaceWith(endRoundBtn.cloneNode(true));
            document.getElementById('end-round-early-btn').addEventListener('click', () => this.endRoundEarly());
        }
    }
    
    async togglePause() {
        if (!this.requiresWallet('toggle pause')) return;
        
        try {
            await TransactionHandler.execute(
                this.contract.toggle_pause(),
                { game: 'pissing-contest', action: 'toggle_pause' }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Pause status toggled',
                type: 'success'
            });
            
            await this.refreshState();
        } catch (error) {
            console.error('Toggle pause failed:', error);
        }
    }
    
    async endRoundEarly() {
        if (!this.requiresWallet('end round early')) return;
        
        if (!confirm('Are you sure you want to end the current round early?')) {
            return;
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.end_round_early(),
                { game: 'pissing-contest', action: 'end_round_early' }
            );
            
            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Round ended early',
                type: 'success'
            });
            
            await this.refreshState();
        } catch (error) {
            console.error('End round early failed:', error);
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

