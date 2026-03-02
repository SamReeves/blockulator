/**
 * Pissing Contest - Simplified Version
 * Send the highest donation to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { BarGraph3D } from '../../presentation/components/bar-graph-3d.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';

export class PissingContest extends Game {
    constructor() {
        super();
        this.donationInput = null;
        this.barGraph = null;
    }

    getContractName() {
        return 'pissing-contest';
    }

    render() {
        // Header with contract info
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections" style="--panel-color: #3b82f6; --hero-color: #3b82f6; --btn-color: #10b981;">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel game-panel">
                    <div class="game-panel-grid">
                        <!-- Left: Current Leader & Play -->
                        <div class="min-w-0">
                            <div class="hero-card" style="margin-bottom: 1rem;">
                                <div class="hero-card-label">🏆 Current Leader</div>
                                <div id="current-leader" class="hero-card-content">
                                    No donations yet
                                </div>
                                <div class="hero-card-stats stat-grid">
                                    <div>
                                        <div>Prize Pool</div>
                                        <div id="prize-pool" class="value">0 wei</div>
                                    </div>
                                    <div>
                                        <div>Donations</div>
                                        <div id="donations-count" class="value">0 / 0</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-button" class="btn-action">
                                💰 Donate
                            </button>
                            
                            <div class="stat-grid-3" style="margin-top: 0.75rem;">
                                <div class="stat-box" style="--stat-color: #10b981;">
                                    <div class="stat-box-label">Your Donation</div>
                                    <div id="your-donation" class="stat-box-value">0 wei</div>
                                </div>
                                <div class="stat-box" style="--stat-color: #fbbf24;">
                                    <div class="stat-box-label">Status</div>
                                    <div id="your-status" class="stat-box-value">Not playing</div>
                                </div>
                                <div class="stat-box" style="--stat-color: #f59e0b;">
                                    <div class="stat-box-label">Minimum</div>
                                    <div id="min-donation" class="stat-box-value">-</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right: Histogram -->
                        <div class="min-w-0">
                            <div class="flex-between" style="margin-bottom: 0.5rem;">
                                <h3 class="game-panel-header" style="font-size: 1rem;">📊 Donation Histogram</h3>
                                <span style="font-size: 0.75rem; opacity: 0.8;">Top 10</span>
                            </div>
                            <div id="donations-3d-graph"></div>
                        </div>
                    </div>
                </div>

                <!-- Admin Panel (only visible to owner) -->
                <div id="admin-panel" class="contest-info-panel admin-panel" style="display: none;">
                    <h3 class="admin-panel-header">
                        <span>⚙️</span>
                        <span>Admin</span>
                    </h3>
                    <div class="stat-grid-3" style="margin: 0.75rem 0; font-size: 0.75rem; --stat-color: #ef4444;">
                        <div class="stat-box">
                            <div class="stat-box-label">Status</div>
                            <div id="contract-paused" class="stat-box-value">No</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">Min Donation</div>
                            <div id="config-min" class="stat-box-value">-</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">Max Donations</div>
                            <div id="config-max" class="stat-box-value">-</div>
                        </div>
                    </div>
                    <div class="stat-grid">
                        <button id="toggle-pause-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.8rem;">🔄 Pause</button>
                        <button id="end-round-early-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.8rem;">🏁 End</button>
                    </div>
                </div>

                <!-- Your Stats - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📈 Your Stats</span>
                    </summary>
                    <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.8rem;">
                        <div class="stat-box" style="--stat-color: #ec4899;">
                            <div class="stat-box-label">Lifetime Donated</div>
                            <div id="lifetime-donated" class="stat-box-value">0 wei</div>
                        </div>
                        <div class="stat-box" style="--stat-color: #ec4899;">
                            <div class="stat-box-label">Lifetime Won</div>
                            <div id="lifetime-won" class="stat-box-value">0 wei</div>
                        </div>
                        <div class="stat-box" style="--stat-color: #fbbf24;">
                            <div class="stat-box-label">Rounds Won</div>
                            <div id="rounds-won" class="stat-box-value">0</div>
                        </div>
                        <div class="stat-box" style="--stat-color: #fbbf24;">
                            <div class="stat-box-label">Rounds Played</div>
                            <div id="rounds-participated" class="stat-box-value">0</div>
                        </div>
                    </div>
                </details>

                <!-- Winners History - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>🏆 Recent Winners</span>
                    </summary>
                    <div id="winners-history" style="max-height: 250px; overflow-y: auto; margin-top: 0.75rem;">
                        <div style="text-align: center; padding: 1.5rem; color: var(--md-sys-color-on-surface-variant); font-size: 0.85rem;">
                            Loading history...
                        </div>
                    </div>
                </details>

                <!-- Global Stats - Collapsible -->
                <details class="contest-info-panel">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>🌍 Global Stats</span>
                    </summary>
                    <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.8rem; --stat-color: #10b981;">
                        <div class="stat-box">
                            <div class="stat-box-label">Total Rounds</div>
                            <div id="total-rounds" class="stat-box-value">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">Total Donated</div>
                            <div id="total-donated" class="stat-box-value">0 wei</div>
                        </div>
                    </div>
                    <div class="stat-box" style="margin-top: 0.5rem; font-size: 0.8rem; --stat-color: #10b981;">
                        <div class="stat-box-label">All-Time Record</div>
                        <div id="highest-donation" class="stat-box-value" style="margin-bottom: 0.25rem;">0 wei</div>
                        <div style="font-size: 0.75rem; opacity: 0.8;">
                            By: <span id="highest-donor">-</span>
                        </div>
                    </div>
                </details>

                <!-- How to Win -->
                <details class="contest-info-panel" open>
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📖 How to Win</span>
                    </summary>
                    <div style="margin-top: 1rem;">
                        <div class="strategy-callout" style="margin-bottom: 1rem;">
                            <strong>🎯 Goal:</strong> Send the highest donation in the round to win the entire prize pool.
                        </div>
                        
                        <div style="padding: 1rem; background: color-mix(in srgb, var(--panel-color) 5%, transparent); border-radius: 8px; font-size: 0.85rem;">
                            <strong style="display: block; margin-bottom: 0.5rem;">Rules:</strong>
                            • Each round accepts up to 10 donations<br>
                            • Highest donor becomes the leader<br>
                            • After 10 donations, round ends and leader wins 100%<br>
                            • New round starts immediately
                        </div>
                    </div>
                </details>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize ValueInput component
        this.donationInput = new this.components.ValueInput('donate-amount-input', {
            label: 'Donation Amount',
            hint: 'Send the highest amount to lead!',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true
        });
        this.donationInput.render();
        
        // Initialize 3D Bar Graph component
        this.initializeBarGraph();
    }
    
    initializeBarGraph() {
        this.barGraph = new BarGraph3D('donations-3d-graph', {
            maxBars: 10,
            perspective: 1200,
            rotationX: -15,
            rotationY: 20,
            onBarClick: (data) => {
                console.log('Clicked donation bar:', data);
                // Could show detailed stats modal in the future
            },
            onBarHover: (data) => {
                // Could show tooltip with more details
            }
        });
        this.barGraph.init();
    }

    setupListeners() {
        const donateButton = document.getElementById('donate-button');
        
        if (donateButton) {
            donateButton.addEventListener('click', () => this.donate());
        }
    }

    async donate() {
        // Check wallet connection using base class method
        if (!this.requiresWallet('donate')) return;
        
        const weiAmount = this.donationInput.getWeiValue();
        
        if (!weiAmount || weiAmount.eq(0)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
                        btn.textContent = isLoading ? '⏳ Donating...' : '💰 Donate';
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
            this.dom.updateInfo('prize-pool', 
                this.dom.formatWei(totalValue)
            );
            this.dom.updateInfo('donations-count', 
                `${donationCount} / ${maxDonations}`
            );
            // Update leader with badge
            const leaderEl = document.getElementById('current-leader');
            if (leaderEl) {
                const leaderAddress = String(largestDonor);
                if (leaderAddress === '0x0000000000000000000000000000000000000000') {
                    leaderEl.textContent = 'No donations yet';
                } else {
                    const leaderDisplay = await this.components.AddressBadge.createWithAddress(leaderAddress, this.web3Provider, {
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

                this.dom.updateInfo('your-donation', 
                    this.dom.formatWei(userDonation)
                );
                
                this.dom.updateInfo('your-status', 
                    userDonation.gt(0) 
                        ? (isWinning ? '🥇 Leading!' : '📊 Playing')
                        : 'Not playing'
                );
                
                // Get user lifetime stats
                const userStats = await this.contract.get_user_stats(this.web3Provider.currentAddress);
                this.dom.updateInfo('lifetime-donated', this.dom.formatWei(userStats[0]));
                this.dom.updateInfo('lifetime-won', this.dom.formatWei(userStats[1]));
                this.dom.updateInfo('rounds-won', userStats[2].toString());
                this.dom.updateInfo('rounds-participated', userStats[3].toString());
            } else {
                // Read-only mode - show placeholder
                this.dom.updateInfo('your-donation', '👀 Read-only mode');
                this.dom.updateInfo('your-status', 'Connect to play');
                this.dom.updateInfo('lifetime-donated', 'Connect wallet');
                this.dom.updateInfo('lifetime-won', 'Connect wallet');
                this.dom.updateInfo('rounds-won', '-');
                this.dom.updateInfo('rounds-participated', '-');
            }
            
            // Global stats - available to everyone
            const globalStats = await this.contract.get_global_stats();
            this.dom.updateInfo('total-rounds', globalStats[0].toString());
            this.dom.updateInfo('highest-donation', this.dom.formatWei(globalStats[1]));
            
            // Update all-time champion with badge
            const championEl = document.getElementById('highest-donor');
            if (championEl) {
                const championAddress = String(globalStats[2]);
                if (championAddress === '0x0000000000000000000000000000000000000000') {
                    championEl.textContent = 'No donations yet';
                } else {
                    const championDisplay = await this.components.AddressBadge.createWithAddress(championAddress, this.web3Provider, {
                        size: 24,
                        formatAddress: true
                    });
                    championEl.innerHTML = '';
                    championEl.appendChild(championDisplay);
                }
            }
            
            // Calculate total donated (we don't have this directly, so use contract balance as proxy)
            const contractBalance = await this.contract.get_contract_balance();
            this.dom.updateInfo('total-donated', this.dom.formatWei(contractBalance));
            
            // Load winners history
            await this.loadWinnersHistory();
            
            // Update 3D bar graph with current round donations
            await this.updateDonations3DGraph();
            
            // Check if current user is owner and show admin panel
            await this.checkAdminAccess();

        } catch (error) {
            console.error('Failed to refresh state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
                const winnerAddress = String(detail.winner);
                const addressDisplay = await this.components.AddressBadge.createWithAddress(winnerAddress, this.web3Provider, {
                    size: 16,
                    formatAddress: true,
                    addressStyle: 'font-size: 0.7rem; font-family: monospace; color: var(--md-sys-color-on-surface-variant);'
                });
                leftDiv.appendChild(addressDisplay);
                
                const rightDiv = document.createElement('div');
                rightDiv.style.cssText = 'text-align: right;';
                rightDiv.innerHTML = `
                    <div style="font-weight: bold; font-size: 0.875rem;">
                        ${this.dom.formatWei(detail.prize)}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant);">
                        ${detail.donationCount} donations
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
    
    async updateDonations3DGraph() {
        if (!this.barGraph || !this.contract) return;
        
        try {
            // Get current round info
            const roundInfo = await this.contract.get_current_round_info();
            const roundNumber = roundInfo[0];
            const donationCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
            
            if (donationCount === 0) {
                this.barGraph.setData([]);
                return;
            }
            
            // Query DonationReceived events for current round
            const filter = this.contract.filters.DonationReceived(roundNumber, null);
            const events = await this.contract.queryFilter(filter);
            
            if (events.length === 0) {
                this.barGraph.setData([]);
                return;
            }
            
            // Create array of all individual donations
            const donations = events.map((event, index) => ({
                address: String(event.args.donor),
                value: event.args.amount,
                donationNumber: event.args.donation_number,
                isCurrentUser: this.web3Provider?.currentAddress?.toLowerCase() === String(event.args.donor).toLowerCase()
            }));
            
            // Sort by value descending
            donations.sort((a, b) => {
                return b.value.gt(a.value) ? 1 : -1;
            });
            
            // Take top 10 largest donations
            const topDonations = donations.slice(0, 10);
            
            // Add badges to each donation (async)
            const donationsWithBadges = await Promise.all(
                topDonations.map(async (d) => {
                    const badge = await this.components.AddressBadge.create(d.address, this.web3Provider, { size: 24 });
                    return {
                        ...d,
                        badge,
                        label: null // Will use default address formatting in component
                    };
                })
            );
            
            this.barGraph.setData(donationsWithBadges);
            
        } catch (error) {
            console.error('Failed to update 3D graph:', error);
            // Don't show error toast - this is a nice-to-have feature
        }
    }
    
    async checkAdminAccess() {
        try {
            const config = await this.contract.get_config();
            const owner = config[0];
            const adminPanel = document.getElementById('admin-panel');
            
            // config returns: (owner, max_donations_per_round, minimum_donation, paused)
            const maxDonations = config[1];
            const minDonation = config[2];
            const paused = config[3];
            
            // Update minimum for all users
            this.dom.updateInfo('min-donation', this.dom.formatWei(minDonation));
            if (this.donationInput && minDonation) {
                this.donationInput.setMinimum(minDonation.toString());
            }
            
            if (!adminPanel) return;
            
            // Show admin panel if current user is owner
            if (this.web3Provider?.currentAddress && 
                this.web3Provider.currentAddress.toLowerCase() === owner.toLowerCase()) {
                adminPanel.style.display = 'block';
                
                this.dom.updateInfo('contract-paused', paused ? 'Yes ⚠️' : 'No ✅');
                this.dom.updateInfo('config-min', this.dom.formatWei(minDonation));
                this.dom.updateInfo('config-max', maxDonations.toString());
                
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
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Pause status toggled',
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
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Round ended early',
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
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: 'You are now leading',
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
                    this.events.bus.emit(this.events.EVENTS.CONFETTI);
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `You won ${this.dom.formatWei(prize)}!`,
                        type: 'success'
                    });
                } else {
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `Round ended. Winner: ${this.dom.formatAddress(winner)}`,
                        type: 'info'
                    });
                }
            } else {
                // Read-only mode - just show winner
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: `Round ended. Winner: ${this.dom.formatAddress(winner)}`,
                    type: 'info'
                });
            }
            
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


