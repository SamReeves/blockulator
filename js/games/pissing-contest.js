/**
 * Pissing Contest Game
 * Compete to make the biggest splash - highest wei wins!
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { DonationHistory } from '../ui/components/DonationHistory.js';
import { DonationStats } from '../ui/components/DonationStats.js';
import { DonationChart } from '../ui/components/DonationChart.js';

export class PissingContest {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.eventListeners = [];
        this.gameType = 'pissing-contest';
        this.donations = []; // Store donations from blockchain events
        this.contestInfo = {
            currentDonations: 0,
            maxDonations: 10,
            totalPool: 0,
            currentLeader: '0x0000000000000000000000000000000000000000',
            contestActive: true
        };
        this.lastQueriedBlock = 0;
    }

    /**
     * Initialize the game
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('pissing-contest', web3Provider);
        if (!this.contract) return;
        
        // Render UI
        this.render();
        
        // Setup event listeners
        this.setupListeners();
        
        // Setup real-time contract event listeners
        this.setupContractEventListeners();
        
        // Load initial state from blockchain
        await this.refreshState();
    }

    /**
     * Render the game interface
     */
    render() {
        // Main game interface
        const ui = GameRenderer.createGameInterface({
            title: '💦 Pissing Contest',
            description: 'Send the HIGHEST donation to win! Winner takes the pot when max donations reached.'
        });
        this.container.appendChild(ui);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current round info panel
        sectionsContainer.appendChild(this.renderRoundInfo());
        
        // User stats panel
        sectionsContainer.appendChild(this.renderUserStats());
        
        // Global stats and leaderboard
        sectionsContainer.appendChild(this.renderGlobalStats());
        
        // Recent winners
        sectionsContainer.appendChild(this.renderRecentWinners());
        
        // Donation chart
        const chartPanel = DonationChart.render(
            this.donations,
            this.web3Provider.currentAddress,
            this.contestInfo.currentLeader
        );
        sectionsContainer.appendChild(chartPanel);
        
        // Donation history table
        const historyPanel = DonationHistory.render(
            this.donations,
            this.web3Provider.currentAddress,
            this.contestInfo.currentLeader
        );
        sectionsContainer.appendChild(historyPanel);
        
        this.container.appendChild(sectionsContainer);
    }

    /**
     * Render current round information panel
     */
    renderRoundInfo() {
        return DOMHelpers.createInfoPanel('🎯 Current Round', [
            { label: 'Round Number', id: 'round-number' },
            { label: 'Current Leader', id: 'current-leader' },
            { label: 'Donations', id: 'donations-count', defaultValue: '0 / 0' },
            { label: 'Prize Pool', id: 'prize-pool', defaultValue: '0 wei' },
            { label: 'Your Donation', id: 'your-donation', defaultValue: '0 wei' },
            { label: 'Winner Gets', id: 'winner-amount', defaultValue: '0 wei' },
            { label: 'Time Est.', id: 'time-remaining', defaultValue: '-' },
            { label: 'Status', id: 'round-status', defaultValue: 'Active' }
        ]);
    }

    /**
     * Render user statistics panel
     */
    renderUserStats() {
        return DOMHelpers.createInfoPanel('👤 Your Statistics', [
            { label: 'Lifetime Donated', id: 'user-lifetime-donated', defaultValue: '0 wei' },
            { label: 'Lifetime Won', id: 'user-lifetime-won', defaultValue: '0 wei' },
            { label: 'Rounds Won', id: 'user-rounds-won', defaultValue: '0' },
            { label: 'Rounds Played', id: 'user-rounds-participated', defaultValue: '0' },
            { label: 'Current Position', id: 'user-current-position', defaultValue: '-' },
            { label: 'Win Rate', id: 'user-win-rate', defaultValue: '0%' }
        ]);
    }

    /**
     * Render global statistics panel
     */
    renderGlobalStats() {
        return DOMHelpers.createInfoPanel('🌍 All-Time Records', [
            { label: 'Total Rounds', id: 'total-rounds', defaultValue: '0' },
            { label: 'Highest Donation', id: 'highest-donation', defaultValue: '0 wei' },
            { label: 'Top Donor', id: 'highest-donor', defaultValue: '-' },
            { label: 'Contract Status', id: 'contract-status', defaultValue: 'Active' },
            { label: 'Fee Rate', id: 'fee-rate', defaultValue: '0%' },
            { label: 'Min Donation', id: 'min-donation', defaultValue: '0 wei' }
        ]);
    }

    /**
     * Render recent winners panel
     */
    renderRecentWinners() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'recent-winners-panel';
        
        panel.innerHTML = `
            <h3>🏆 Recent Winners</h3>
            <div id="recent-winners-list" class="winners-list">
                <div class="loading">Loading winners...</div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        const playButton = document.getElementById('play-button');
        const weiInput = document.getElementById('play-wei');
        
        if (playButton && weiInput) {
            const handlePlay = () => this.donate(weiInput.value);
            playButton.addEventListener('click', handlePlay);
            weiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handlePlay();
            });
        }
    }

    /**
     * Make a donation (play the game)
     */
    async donate(weiAmount) {
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            // Use TransactionHandler utility
            await TransactionHandler.execute(
                this.contract.donate({
                    value: ethers.BigNumber.from(weiAmount)
                }),
                {
                    game: 'pissing-contest',
                    wei: weiAmount
                }
            );
            
            // Trigger splash animation (unique to this game)
            eventBus.emit(EVENTS.SPLASH, { intensity: parseFloat(weiAmount) });
            
            // Clear input and refresh state
            const input = document.getElementById('play-wei');
            if (input) input.value = '';
            
            await this.refreshState();
            
        } catch (error) {
            // Error already handled by TransactionHandler
            console.error('Donation failed:', error);
        }
    }

    /**
     * Refresh game state from blockchain
     */
    async refreshState() {
        if (!this.contract) return;

        try {
            // Load all data in parallel
            const [
                roundState,
                config,
                userStats,
                globalStats
            ] = await Promise.all([
                this.contract.get_current_round_state(),
                this.contract.get_config(),
                this.contract.get_player_stats(this.web3Provider.currentAddress),
                this.contract.get_global_stats()
            ]);

            // Update round info using DOMHelpers
            DOMHelpers.updateInfo('round-number', roundState.round_number.toString());
            DOMHelpers.updateInfo('current-leader', DOMHelpers.formatAddress(roundState.largest_donor));
            DOMHelpers.updateInfo('donations-count', 
                `${roundState.donation_count} / ${config.max_donations_per_round}`
            );
            DOMHelpers.updateInfo('prize-pool', DOMHelpers.formatWei(roundState.total_value));
            DOMHelpers.updateInfo('round-status', roundState.is_active ? 'Active' : 'Completed');

            // Calculate winner amount (after fee)
            const feeAmount = roundState.total_value.mul(config.fee_basis_points).div(10000);
            const winnerAmount = roundState.total_value.sub(feeAmount);
            DOMHelpers.updateInfo('winner-amount', DOMHelpers.formatWei(winnerAmount));

            // Update user stats using DOMHelpers
            DOMHelpers.updateInfo('user-lifetime-donated', DOMHelpers.formatWei(userStats.total_donated));
            DOMHelpers.updateInfo('user-lifetime-won', DOMHelpers.formatWei(userStats.total_won));
            DOMHelpers.updateInfo('user-rounds-won', userStats.rounds_won.toString());
            DOMHelpers.updateInfo('user-rounds-participated', userStats.rounds_participated.toString());

            // Calculate win rate
            const winRate = userStats.rounds_participated.gt(0)
                ? (userStats.rounds_won.toNumber() / userStats.rounds_participated.toNumber() * 100).toFixed(1)
                : '0.0';
            DOMHelpers.updateInfo('user-win-rate', `${winRate}%`);

            // Update global stats using DOMHelpers
            DOMHelpers.updateInfo('total-rounds', globalStats.total_rounds_completed.toString());
            DOMHelpers.updateInfo('highest-donation', DOMHelpers.formatWei(globalStats.highest_single_donation));
            DOMHelpers.updateInfo('highest-donor', DOMHelpers.formatAddress(globalStats.highest_donor));
            DOMHelpers.updateInfo('contract-status', config.paused ? 'Paused' : 'Active');
            DOMHelpers.updateInfo('fee-rate', `${(config.fee_basis_points.toNumber() / 100).toFixed(1)}%`);
            DOMHelpers.updateInfo('min-donation', DOMHelpers.formatWei(config.minimum_donation));

            // Update contest info for charts
            this.contestInfo = {
                currentDonations: roundState.donation_count.toNumber(),
                maxDonations: config.max_donations_per_round.toNumber(),
                totalPool: roundState.total_value,
                currentLeader: roundState.largest_donor,
                contestActive: roundState.is_active
            };

            // Load current round donations
            await this.loadCurrentRoundDonations(roundState.round_number.toNumber());

            // Load recent winners
            await this.loadRecentWinners();

            // Find user's donation in current round
            const userDonation = this.donations.find(
                d => d.donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()
            );
            
            if (userDonation) {
                DOMHelpers.updateInfo('your-donation', DOMHelpers.formatWei(userDonation.amount));
                
                // Calculate position
                const sortedDonations = [...this.donations].sort((a, b) => 
                    ethers.BigNumber.from(b.amount).sub(ethers.BigNumber.from(a.amount)).toNumber()
                );
                const position = sortedDonations.findIndex(
                    d => d.donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()
                ) + 1;
                
                DOMHelpers.updateInfo('user-current-position', 
                    position === 1 ? '🥇 Leader!' : `#${position}`
                );
            } else {
                DOMHelpers.updateInfo('your-donation', '0 wei');
                DOMHelpers.updateInfo('user-current-position', '-');
            }

            // Update donation visualizations
            this.updateDonationVisualizations();

        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    /**
     * Load donations for current round
     */
    async loadCurrentRoundDonations(roundNumber) {
        try {
            const donations = await this.contract.get_round_donations(roundNumber);
            this.donations = donations.map(d => ({
                donor: d.donor,
                amount: d.amount,
                timestamp: d.timestamp.toNumber(),
                donationNumber: d.donation_number.toNumber()
            }));
        } catch (error) {
            console.error('Failed to load donations:', error);
            this.donations = [];
        }
    }

    /**
     * Load recent winners
     */
    async loadRecentWinners() {
        try {
            const winnersCount = 10;
            const recentWinners = await this.contract.get_recent_winners(winnersCount);
            
            const winnersEl = document.getElementById('recent-winners-list');
            if (!winnersEl) return;

            if (recentWinners.length === 0) {
                winnersEl.innerHTML = '<div class="loading">No winners yet. Be the first!</div>';
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
            recentWinners.reverse().forEach((winner, idx) => {
                const isYou = winner.winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                html += `
                    <div style="padding: 0.75rem; background: rgba(0,0,0,0.1); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="font-weight: bold; color: ${isYou ? '#ffd700' : 'inherit'};">
                                Round #${winner.round_number}
                            </span>
                            <span style="font-family: monospace; font-size: 0.875rem;">
                                ${DOMHelpers.formatAddress(winner.winner)}
                                ${isYou ? ' <strong>(You)</strong>' : ''}
                            </span>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">
                            Prize: ${DOMHelpers.formatWei(winner.prize)}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            winnersEl.innerHTML = html;

        } catch (error) {
            console.error('Failed to load winners:', error);
        }
    }

    /**
     * Update donation visualizations (charts, history)
     */
    updateDonationVisualizations() {
        // Update donation chart
        const chartPanel = document.querySelector('#donation-chart-panel');
        if (chartPanel) {
            const newChart = DonationChart.render(
                this.donations,
                this.web3Provider.currentAddress,
                this.contestInfo.currentLeader
            );
            chartPanel.replaceWith(newChart);
        }

        // Update donation history
        const historyPanel = document.querySelector('#donation-history-panel');
        if (historyPanel) {
            const newHistory = DonationHistory.render(
                this.donations,
                this.web3Provider.currentAddress,
                this.contestInfo.currentLeader
            );
            historyPanel.replaceWith(newHistory);
        }
    }

    /**
     * Setup real-time contract event listeners
     */
    setupContractEventListeners() {
        if (!this.contract) return;

        // Listen for new donations
        this.contract.on('DonationReceived', async (roundNumber, donor, amount, donationNumber, isLargest, timestamp) => {
            console.log('New donation:', { donor, amount: amount.toString(), isLargest });
            
            // Refresh state
            await this.refreshState();
            
            // Show notification
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            if (isYou && isLargest) {
                eventBus.emit(EVENTS.TOAST, {
                    message: '🏆 You are now leading!',
                    type: 'success'
                });
            } else if (!isYou && this.contestInfo.currentLeader.toLowerCase() === donor.toLowerCase()) {
                eventBus.emit(EVENTS.TOAST, {
                    message: '⚡ New leader!',
                    type: 'info'
                });
            }
        });

        // Listen for round ended
        this.contract.on('RoundEnded', async (roundNumber, winner, prize, feeCollected, totalDonations, duration) => {
            console.log('Round ended:', { winner, prize: prize.toString() });
            
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.WINNER_DETERMINED, { player: winner, prize });
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
            
            // Refresh state
            await this.refreshState();
        });

        // Listen for new round started
        this.contract.on('RoundStarted', async (roundNumber, startTime) => {
            console.log('New round started:', roundNumber.toString());
            
            eventBus.emit(EVENTS.TOAST, {
                message: `🚀 Round #${roundNumber} started!`,
                type: 'info'
            });
            
            await this.refreshState();
        });
    }

    /**
     * Cleanup when game is unloaded
     */
    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        this.eventListeners.forEach(({ element, handler }) => {
            element?.removeEventListener('click', handler);
        });
    }
}
