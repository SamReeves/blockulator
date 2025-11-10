/**
 * Pissing Contest - Simplified Version
 * Send the highest donation to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { BarGraph3D } from '../../presentation/components/bar-graph-3d.js';

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
            <div class="game-sections">
                <!-- Main Consolidated Panel -->
                <div class="contest-info-panel" style="border: 2px solid #3b82f6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);">
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Current Leader & Play -->
                        <div style="min-width: 0;">
                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                <div style="font-size: 0.7rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">🏆 Current Leader</div>
                                <div id="current-leader" style="font-size: 0.9rem; font-weight: bold; word-break: break-all; margin-bottom: 0.75rem;">
                                    No donations yet
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.75rem;">
                                    <div>
                                        <div style="opacity: 0.8;">Prize Pool</div>
                                        <div id="prize-pool" style="font-weight: bold;">0 wei</div>
                                    </div>
                                    <div>
                                        <div style="opacity: 0.8;">Donations</div>
                                        <div id="donations-count" style="font-weight: bold;">0 / 0</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                            <button id="donate-button" class="btn-play" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                                💰 Donate & Compete
                            </button>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem;">
                                <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.15); border-radius: 6px; font-size: 0.75rem;">
                                    <div style="opacity: 0.7; margin-bottom: 0.25rem;">Your Donation</div>
                                    <div id="your-donation" style="font-weight: bold; font-size: 0.85rem;">0 wei</div>
                                </div>
                                <div style="padding: 0.5rem; background: rgba(251, 191, 36, 0.15); border-radius: 6px; font-size: 0.75rem;">
                                    <div style="opacity: 0.7; margin-bottom: 0.25rem;">Status</div>
                                    <div id="your-status" style="font-weight: bold; font-size: 0.85rem;">Not playing</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right: Histogram -->
                        <div style="min-width: 0;">
                            <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #3b82f6; margin: 0; font-size: 1rem;">📊 Donation Histogram</h3>
                                <span style="font-size: 0.75rem; color: #3b82f6; opacity: 0.8;">Top 10</span>
                            </div>
                            <div id="donations-3d-graph"></div>
                        </div>
                    </div>
                </div>

                <!-- Admin Panel (only visible to owner) -->
                <div id="admin-panel" class="contest-info-panel" style="border: 2px solid #ef4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%); display: none;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444; margin: 0; font-size: 0.95rem;">
                        <span>⚙️</span>
                        <span>Admin</span>
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin: 0.75rem 0; font-size: 0.75rem;">
                        <div style="padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem; font-size: 0.65rem;">Status</div>
                            <div id="contract-paused" style="font-weight: bold; font-size: 0.8rem;">No</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem; font-size: 0.65rem;">Fee</div>
                            <div id="config-fee" style="font-weight: bold; font-size: 0.8rem;">-</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem; font-size: 0.65rem;">Min</div>
                            <div id="config-min" style="font-weight: bold; font-size: 0.8rem;">-</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem; font-size: 0.65rem;">Max</div>
                            <div id="config-max" style="font-weight: bold; font-size: 0.8rem;">-</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <button id="toggle-pause-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.8rem;">🔄 Pause</button>
                        <button id="end-round-early-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.8rem;">🏁 End</button>
                    </div>
                </div>

                <!-- Your Stats - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">📈 Your Stats</span>
                    </summary>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.75rem;">
                        <div style="padding: 0.5rem; background: rgba(236, 72, 153, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Lifetime Donated</div>
                            <div id="lifetime-donated" style="font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(236, 72, 153, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Lifetime Won</div>
                            <div id="lifetime-won" style="font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(251, 191, 36, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Rounds Won</div>
                            <div id="rounds-won" style="font-weight: bold;">0</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(251, 191, 36, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Rounds Played</div>
                            <div id="rounds-participated" style="font-weight: bold;">0</div>
                        </div>
                    </div>
                </details>

                <!-- Winners History - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">🏆 Recent Winners</span>
                    </summary>
                    <div id="winners-history" style="max-height: 250px; overflow-y: auto; margin-top: 0.75rem;">
                        <div style="text-align: center; padding: 1.5rem; color: var(--md-sys-color-on-surface-variant); font-size: 0.85rem;">
                            Loading history...
                        </div>
                    </div>
                </details>

                <!-- Global Stats - Collapsible -->
                <details class="contest-info-panel">
                    <summary style="list-style: none; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                        <span style="font-size: 0.85rem;">▶</span>
                        <span style="font-weight: 600;">🌍 Global Stats</span>
                    </summary>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.75rem;">
                        <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Total Rounds</div>
                            <div id="total-rounds" style="font-weight: bold;">0</div>
                        </div>
                        <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 6px; font-size: 0.8rem;">
                            <div style="opacity: 0.7; margin-bottom: 0.25rem;">Total Donated</div>
                            <div id="total-donated" style="font-weight: bold;">0 wei</div>
                        </div>
                    </div>
                    <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 6px; margin-top: 0.5rem; font-size: 0.8rem;">
                        <div style="opacity: 0.7; margin-bottom: 0.25rem;">All-Time Record</div>
                        <div id="highest-donation" style="font-weight: bold; margin-bottom: 0.25rem;">0 wei</div>
                        <div style="font-size: 0.75rem; opacity: 0.8;">
                            By: <span id="highest-donor">-</span>
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
                    const leaderDisplay = await AddressBadge.createWithAddress(leaderAddress, this.web3Provider, {
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
                    const championDisplay = await AddressBadge.createWithAddress(championAddress, this.web3Provider, {
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
                const addressDisplay = await AddressBadge.createWithAddress(winnerAddress, this.web3Provider, {
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
                    const badge = await AddressBadge.create(d.address, this.web3Provider, { size: 24 });
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
                
                this.dom.updateInfo('contract-paused', paused ? 'Yes ⚠️' : 'No ✅');
                this.dom.updateInfo('config-fee', `${(feeBp / 100).toFixed(2)}%`);
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
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
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
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
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
                    this.events.bus.emit(this.events.EVENTS.CONFETTI);
                    this.events.bus.emit(this.events.EVENTS.TOAST, {
                        message: `🎉 YOU WON ${this.dom.formatWei(prize)}!`,
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
                message: `🚀 Round #${roundNumber} started!`,
                type: 'info'
            });
            await this.refreshState();
        });
    }
}


