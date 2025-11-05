/**
 * Pissing Contest Game
 * Compete to make the biggest splash - highest wei wins!
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';
import { DonationHistory } from '../ui/components/DonationHistory.js';
import { DonationStats } from '../ui/components/DonationStats.js';
import { DonationChart } from '../ui/components/DonationChart.js';

export class PissingContest {
    constructor() {
        this.contract = null;
        this.container = null;
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
        
        // Ensure wallet is connected and address is available
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            console.error('Cannot initialize game: Wallet not properly connected');
            console.log('Web3Provider state:', {
                isConnected: web3Provider.isConnected(),
                address: web3Provider.currentAddress,
                provider: !!web3Provider.provider,
                signer: !!web3Provider.signer
            });
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return;
        }
        
        console.log('✅ Wallet confirmed:', web3Provider.currentAddress);
        
        // Load contract ABI and initialize contract
        try {
            const response = await fetch('/contracts/abis/pissing-contest.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.PISSING_CONTEST,
                abi
            );
            
            console.log('Pissing Contest: Contract loaded at', CONTRACT_ADDRESSES.PISSING_CONTEST);
            
        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game contract',
                type: 'error'
            });
            return;
        }
        
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
        const roundPanel = this.renderRoundInfo();
        sectionsContainer.appendChild(roundPanel);
        
        // User stats panel
        const userStatsPanel = this.renderUserStats();
        sectionsContainer.appendChild(userStatsPanel);
        
        // Global stats and leaderboard
        const globalPanel = this.renderGlobalStats();
        sectionsContainer.appendChild(globalPanel);
        
        // Recent winners
        const winnersPanel = this.renderRecentWinners();
        sectionsContainer.appendChild(winnersPanel);
        
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
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'round-info-panel';
        
        panel.innerHTML = `
            <h3>🎯 Current Round</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Round Number</div>
                    <div class="info-value" id="round-number">Loading...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Current Leader</div>
                    <div class="info-value" id="current-leader">Loading...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Donations</div>
                    <div class="info-value" id="donations-count">0 / 0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Prize Pool</div>
                    <div class="info-value" id="prize-pool">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Your Donation</div>
                    <div class="info-value" id="your-donation">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Winner Gets</div>
                    <div class="info-value" id="winner-amount">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Time Est.</div>
                    <div class="info-value" id="time-remaining">-</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" id="round-status">Active</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render user statistics panel
     */
    renderUserStats() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'user-stats-panel';
        
        panel.innerHTML = `
            <h3>👤 Your Statistics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Lifetime Donated</div>
                    <div class="info-value" id="user-lifetime-donated">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Lifetime Won</div>
                    <div class="info-value" id="user-lifetime-won">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Rounds Won</div>
                    <div class="info-value" id="user-rounds-won">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Rounds Played</div>
                    <div class="info-value" id="user-rounds-participated">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Current Position</div>
                    <div class="info-value" id="user-current-position">-</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Win Rate</div>
                    <div class="info-value" id="user-win-rate">0%</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render global statistics panel
     */
    renderGlobalStats() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'global-stats-panel';
        
        panel.innerHTML = `
            <h3>🌍 All-Time Records</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Total Rounds</div>
                    <div class="info-value" id="total-rounds">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Highest Donation</div>
                    <div class="info-value" id="highest-donation">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Top Donor</div>
                    <div class="info-value" id="highest-donor">-</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contract Status</div>
                    <div class="info-value" id="contract-status">Active</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fee Rate</div>
                    <div class="info-value" id="fee-rate">0%</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Min Donation</div>
                    <div class="info-value" id="min-donation">0 wei</div>
                </div>
            </div>
        `;
        
        return panel;
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
        const simulateButton = document.getElementById('simulate-button');
        const weiInput = document.getElementById('play-wei');
        
        const handlePlay = () => this.donate(weiInput.value);
        
        playButton.addEventListener('click', handlePlay);
        
        // Hide simulate button for now (no historical data)
        if (simulateButton) {
            simulateButton.style.display = 'none';
        }
        
        // Enter key support
        weiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlePlay();
        });
        
        // Store for cleanup
        this.eventListeners.push({ element: playButton, handler: handlePlay });
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
            GameRenderer.setLoading(true);
            
            eventBus.emit(EVENTS.PLAY_SUBMITTED, {
                game: 'pissing-contest',
                wei: weiAmount
            });
            
            // Call actual contract donate method (no parameters, value is the donation)
            console.log(`Sending donation: ${weiAmount} wei`);
            const tx = await this.contract.donate({
                value: ethers.BigNumber.from(weiAmount)
            });
            
            console.log('Transaction sent:', tx.hash);
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction sent, waiting for confirmation...',
                type: 'info'
            });
            
            // Wait for transaction confirmation
            await tx.wait();
            
            console.log('Transaction confirmed!');
            
            eventBus.emit(EVENTS.PLAY_CONFIRMED, {
                game: 'pissing-contest',
                wei: weiAmount
            });
            
            // Trigger splash animation
            eventBus.emit(EVENTS.SPLASH, { intensity: parseFloat(weiAmount) });
            
            eventBus.emit(EVENTS.TOAST, {
                message: `Donated ${parseInt(weiAmount).toLocaleString()} wei!`,
                type: 'success'
            });
            
            // Refresh state from blockchain
            await this.refreshState();
            
        } catch (error) {
            console.error('Donation failed:', error);
            eventBus.emit(EVENTS.PLAY_FAILED, { error });
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction failed: ' + (error.reason || error.message),
                type: 'error'
            });
        } finally {
            GameRenderer.setLoading(false);
        }
    }

    /**
     * Refresh game state from blockchain
     */
    async refreshState() {
        try {
            console.log('🔄 Refreshing state from contract...');
            
            // Get current round info
            const roundInfo = await this.contract.get_current_round_info();
            const [roundNumber, donationCount, maxDonations, totalValue, currentLeader, largestDonation, startTime, isActive] = roundInfo;
            
            // Get config
            const config = await this.contract.get_config();
            const [owner, feeBP, maxDonationsConfig, minDonation, isPaused] = config;
            
            // Get global stats
            const globalStats = await this.contract.get_global_stats();
            const [totalRounds, totalDonated, totalPaidOut, highestDonor] = globalStats;
            
            // Get all-time highest donation
            const highestDonation = await this.contract.all_time_highest_donation();
            
            // Get user stats
            const userStats = await this.contract.get_user_stats(this.web3Provider.currentAddress);
            const [userLifetimeDonated, userLifetimeWon, userRoundsWon, userRoundsParticipated] = userStats;
            
            // Get user's current position
            let userPosition = null;
            let isLeading = false;
            try {
                const position = await this.contract.get_current_leaderboard_position(this.web3Provider.currentAddress);
                userPosition = position[0];
                isLeading = position[1];
            } catch (e) {
                // User might not have donated in this round
            }
            
            // Get current round donation for user
            const userRoundDonation = await this.contract.round_donations(roundNumber, this.web3Provider.currentAddress);
            
            // Calculate winner amount
            const [winnerAmount, feeAmount] = await this.contract.calculate_current_winnings();
            
            // Get time remaining estimate
            let timeRemaining = null;
            try {
                timeRemaining = await this.contract.get_time_remaining_estimate();
            } catch (e) {
                // Might not be available
            }
            
            // Load donation history from events for visualization
            await this.loadDonationHistory();
            
            // Store all state
            this.contestInfo = {
                roundNumber: roundNumber.toNumber(),
                currentDonations: donationCount,
                maxDonations: maxDonations,
                totalPool: totalValue,
                currentLeader,
                largestDonation,
                startTime: startTime.toNumber(),
                isActive,
                isPaused,
                feeBP: feeBP,
                minDonation,
                userRoundDonation,
                winnerAmount,
                feeAmount,
                timeRemaining: timeRemaining ? timeRemaining.toNumber() : null,
                totalRounds: totalRounds.toNumber(),
                highestDonation,
                highestDonor,
                userLifetimeDonated,
                userLifetimeWon,
                userRoundsWon: userRoundsWon.toNumber(),
                userRoundsParticipated: userRoundsParticipated.toNumber(),
                userPosition,
                isLeading
            };
            
            console.log('✅ Contract state loaded:', this.contestInfo);
            
            // Update game state bar
            GameRenderer.updateGameStateBar({
                playCount: donationCount,
                prizePool: parseFloat(ethers.utils.formatEther(totalValue)) * 1e18
            });
            
            // Update all UI panels
            this.updateAllPanels();
            
            // Update components with donation data
            this.updateComponents();
            
            console.log('✅ State refresh complete!');
            
        } catch (error) {
            console.error('❌ Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: `Failed to load game state: ${error.message}`,
                type: 'error'
            });
        }
    }

    /**
     * Load donation history from blockchain events (current round only)
     */
    async loadDonationHistory() {
        try {
            // Query recent events only (last 10000 blocks should be safe for most RPC providers)
            console.log('📊 Getting current block number...');
            const currentBlock = await this.web3Provider.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 10000);
            
            console.log(`📊 Querying events from block ${fromBlock} to ${currentBlock}`);
            console.log(`📊 Contract: ${this.contract.address}`);
            
            // Get all relevant events
            const donationFilter = this.contract.filters.DonationReceived();
            const startedFilter = this.contract.filters.RoundStarted();
            const endedFilter = this.contract.filters.RoundEnded();
            
            console.log('📊 Querying DonationReceived events...');
            const donationEvents = await this.contract.queryFilter(donationFilter, fromBlock, 'latest');
            console.log(`📊 Found ${donationEvents.length} donation events`);
            
            console.log('📊 Querying RoundStarted events...');
            const startedEvents = await this.contract.queryFilter(startedFilter, fromBlock, 'latest');
            console.log(`📊 Found ${startedEvents.length} started events`);
            
            console.log('📊 Querying RoundEnded events...');
            const endedEvents = await this.contract.queryFilter(endedFilter, fromBlock, 'latest');
            console.log(`📊 Found ${endedEvents.length} ended events`);
            
            console.log(`📊 Total: ${donationEvents.length} donations, ${startedEvents.length} started, ${endedEvents.length} ended events`);
            
            // Get current round number from contract to filter donations
            const currentRoundNumber = this.contestInfo?.roundNumber;
            
            // Filter donations to only those in the current round
            let currentRoundDonations = donationEvents.filter(e => 
                e.args.round_number && e.args.round_number.toNumber() === currentRoundNumber
            );
            
            // If we don't have the round number yet, fall back to the old logic
            if (!currentRoundNumber) {
                // Find the most recent round boundary (started or ended event)
                let roundStartBlock = fromBlock;
                
                const allBoundaryEvents = [...startedEvents, ...endedEvents].sort((a, b) => b.blockNumber - a.blockNumber);
                if (allBoundaryEvents.length > 0) {
                    roundStartBlock = allBoundaryEvents[0].blockNumber;
                    console.log(`Current round started at block ${roundStartBlock}`);
                }
                
                // Filter donations to only those in the current round (after the last start/end)
                currentRoundDonations = donationEvents.filter(e => e.blockNumber > roundStartBlock);
            }
            
            console.log(`Current round has ${currentRoundDonations.length} donations`);
            
            // Convert events to donation format
            this.donations = await Promise.all(currentRoundDonations.map(async (event) => {
                try {
                    const block = await event.getBlock();
                    return {
                        address: event.args.donor,
                        weiAmount: parseFloat(ethers.utils.formatEther(event.args.amount)) * 1e18,
                        timestamp: block.timestamp,
                        donation_number: event.args.donation_number,
                        isLargest: event.args.is_largest,
                        txHash: event.transactionHash
                    };
                } catch (error) {
                    console.error('Failed to process event:', error);
                    return null;
                }
            }));
            
            // Filter out any failed conversions
            this.donations = this.donations.filter(d => d !== null);
            
            // Sort by donation number (oldest to newest in current round)
            this.donations.sort((a, b) => a.donation_number - b.donation_number);
            
            console.log(`✅ Loaded ${this.donations.length} donations from current round`);
            
        } catch (error) {
            console.error('Failed to load donation history:', error);
            this.donations = [];
        }
    }

    /**
     * Setup real-time event listener for new donations
     */
    setupContractEventListeners() {
        if (!this.contract) return;
        
        // Listen for new DonationReceived events
        this.contract.on('DonationReceived', async (roundNumber, donor, amount, donationNumber, isLargest, timestamp) => {
            console.log('New donation received!', {
                roundNumber: roundNumber.toString(),
                donor,
                amount: ethers.utils.formatEther(amount),
                donationNumber: donationNumber.toString(),
                isLargest
            });
            
            // Only process if it's for the current round
            if (this.contestInfo && roundNumber.toNumber() === this.contestInfo.roundNumber) {
                // Show toast notification
                const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                eventBus.emit(EVENTS.TOAST, {
                    message: isYou 
                        ? '✅ Your donation was recorded!' 
                        : `💰 New donation: ${ethers.utils.formatEther(amount)} ETH`,
                    type: 'success'
                });
                
                // Refresh state and UI
                await this.refreshState();
            }
        });
        
        // Listen for RoundEnded event
        this.contract.on('RoundEnded', async (roundNumber, winner, prize, feeCollected, totalDonations, duration) => {
            console.log('Round ended!', {
                roundNumber: roundNumber.toString(),
                winner,
                prize: ethers.utils.formatEther(prize),
                totalDonations: totalDonations.toString()
            });
            
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            eventBus.emit(EVENTS.TOAST, {
                message: isYou 
                    ? `🎉 YOU WON Round ${roundNumber}! Prize: ${ethers.utils.formatEther(prize)} ETH!`
                    : `Round ${roundNumber} ended! Winner: ${winner.slice(0, 6)}...`,
                type: isYou ? 'success' : 'info'
            });
            
            // Refresh state
            await this.refreshState();
        });
        
        // Listen for RoundStarted event
        this.contract.on('RoundStarted', async (roundNumber, startTime) => {
            console.log('Round started:', {
                roundNumber: roundNumber.toString(),
                startTime: new Date(startTime.toNumber() * 1000)
            });
            
            eventBus.emit(EVENTS.TOAST, {
                message: `🔄 Round ${roundNumber} started!`,
                type: 'info'
            });
            
            // Refresh state
            await this.refreshState();
        });
        
        // Listen for LeaderboardUpdate event
        this.contract.on('LeaderboardUpdate', async (roundNumber, newLeader, amount, previousLeader) => {
            console.log('Leaderboard updated:', {
                roundNumber: roundNumber.toString(),
                newLeader,
                amount: ethers.utils.formatEther(amount)
            });
            
            // Only show notification if it's the current round
            if (this.contestInfo && roundNumber.toNumber() === this.contestInfo.roundNumber) {
                const isYou = newLeader.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                if (isYou) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: '👑 You are now the leader!',
                        type: 'success'
                    });
                }
            }
        });
    }

    /**
     * Update all UI panels with current state
     */
    async updateAllPanels() {
        this.updateRoundInfo();
        this.updateUserStatsPanel();
        this.updateGlobalStatsPanel();
        await this.updateRecentWinners();
    }

    /**
     * Update round info panel
     */
    updateRoundInfo() {
        const info = this.contestInfo;
        
        // Round number
        const roundNumEl = document.getElementById('round-number');
        if (roundNumEl) {
            roundNumEl.textContent = `#${info.roundNumber}`;
        }
        
        // Current leader
        const leaderEl = document.getElementById('current-leader');
        if (leaderEl) {
            const leader = info.currentLeader;
            if (leader === '0x0000000000000000000000000000000000000000') {
                leaderEl.textContent = 'No donations yet';
                leaderEl.style.color = '';
            } else if (leader.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                leaderEl.textContent = '🏆 YOU!';
                leaderEl.style.color = 'var(--success)';
            } else {
                leaderEl.textContent = `${leader.slice(0, 6)}...${leader.slice(-4)}`;
                leaderEl.style.color = '';
            }
        }
        
        // Donations count
        const countEl = document.getElementById('donations-count');
        if (countEl) {
            countEl.textContent = `${info.currentDonations} / ${info.maxDonations}`;
        }
        
        // Prize pool
        const poolEl = document.getElementById('prize-pool');
        if (poolEl) {
            const pool = parseFloat(ethers.utils.formatEther(info.totalPool));
            poolEl.textContent = pool >= 0.01 
                ? `${pool.toFixed(4)} ETH` 
                : `${(pool * 1e18).toLocaleString()} wei`;
        }
        
        // Your donation
        const yourEl = document.getElementById('your-donation');
        if (yourEl) {
            const donation = parseFloat(ethers.utils.formatEther(info.userRoundDonation));
            yourEl.textContent = donation >= 0.01 
                ? `${donation.toFixed(4)} ETH` 
                : `${(donation * 1e18).toLocaleString()} wei`;
        }
        
        // Winner amount
        const winnerEl = document.getElementById('winner-amount');
        if (winnerEl) {
            const amount = parseFloat(ethers.utils.formatEther(info.winnerAmount));
            winnerEl.textContent = amount >= 0.01 
                ? `${amount.toFixed(4)} ETH` 
                : `${(amount * 1e18).toLocaleString()} wei`;
        }
        
        // Time remaining
        const timeEl = document.getElementById('time-remaining');
        if (timeEl) {
            if (info.timeRemaining && info.timeRemaining > 0) {
                const hours = Math.floor(info.timeRemaining / 3600);
                const minutes = Math.floor((info.timeRemaining % 3600) / 60);
                timeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            } else {
                timeEl.textContent = '-';
            }
        }
        
        // Status
        const statusEl = document.getElementById('round-status');
        if (statusEl) {
            if (info.isPaused) {
                statusEl.textContent = '⏸️ Paused';
                statusEl.style.color = 'var(--warning)';
            } else if (info.isActive) {
                statusEl.textContent = '🟢 Active';
                statusEl.style.color = 'var(--success)';
            } else {
                statusEl.textContent = '🔴 Ended';
                statusEl.style.color = 'var(--danger)';
            }
        }
    }

    /**
     * Update user statistics panel
     */
    updateUserStatsPanel() {
        const info = this.contestInfo;
        
        // Lifetime donated
        const donatedEl = document.getElementById('user-lifetime-donated');
        if (donatedEl) {
            const donated = parseFloat(ethers.utils.formatEther(info.userLifetimeDonated));
            donatedEl.textContent = donated >= 0.01 
                ? `${donated.toFixed(4)} ETH` 
                : `${(donated * 1e18).toLocaleString()} wei`;
        }
        
        // Lifetime won
        const wonEl = document.getElementById('user-lifetime-won');
        if (wonEl) {
            const won = parseFloat(ethers.utils.formatEther(info.userLifetimeWon));
            wonEl.textContent = won >= 0.01 
                ? `${won.toFixed(4)} ETH` 
                : `${(won * 1e18).toLocaleString()} wei`;
        }
        
        // Rounds won
        const roundsWonEl = document.getElementById('user-rounds-won');
        if (roundsWonEl) {
            roundsWonEl.textContent = info.userRoundsWon.toString();
        }
        
        // Rounds participated
        const participatedEl = document.getElementById('user-rounds-participated');
        if (participatedEl) {
            participatedEl.textContent = info.userRoundsParticipated.toString();
        }
        
        // Current position
        const positionEl = document.getElementById('user-current-position');
        if (positionEl) {
            if (info.userPosition !== null) {
                positionEl.textContent = info.isLeading ? '🏆 Leading!' : `#${info.userPosition}`;
                positionEl.style.color = info.isLeading ? 'var(--success)' : '';
            } else {
                positionEl.textContent = 'Not participating';
                positionEl.style.color = '';
            }
        }
        
        // Win rate
        const winRateEl = document.getElementById('user-win-rate');
        if (winRateEl) {
            const rate = info.userRoundsParticipated > 0 
                ? (info.userRoundsWon / info.userRoundsParticipated * 100).toFixed(1)
                : '0.0';
            winRateEl.textContent = `${rate}%`;
        }
    }

    /**
     * Update global statistics panel
     */
    updateGlobalStatsPanel() {
        const info = this.contestInfo;
        
        // Total rounds
        const roundsEl = document.getElementById('total-rounds');
        if (roundsEl) {
            roundsEl.textContent = info.totalRounds.toString();
        }
        
        // Highest donation
        const highestEl = document.getElementById('highest-donation');
        if (highestEl) {
            const highest = parseFloat(ethers.utils.formatEther(info.highestDonation));
            highestEl.textContent = highest >= 0.01 
                ? `${highest.toFixed(4)} ETH` 
                : `${(highest * 1e18).toLocaleString()} wei`;
        }
        
        // Highest donor
        const donorEl = document.getElementById('highest-donor');
        if (donorEl) {
            const donor = info.highestDonor;
            if (donor === '0x0000000000000000000000000000000000000000') {
                donorEl.textContent = 'None yet';
            } else if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                donorEl.textContent = '🏆 YOU!';
                donorEl.style.color = 'var(--success)';
            } else {
                donorEl.textContent = `${donor.slice(0, 6)}...${donor.slice(-4)}`;
                donorEl.style.color = '';
            }
        }
        
        // Contract status
        const contractStatusEl = document.getElementById('contract-status');
        if (contractStatusEl) {
            contractStatusEl.textContent = info.isPaused ? '⏸️ Paused' : '✅ Active';
            contractStatusEl.style.color = info.isPaused ? 'var(--warning)' : 'var(--success)';
        }
        
        // Fee rate
        const feeEl = document.getElementById('fee-rate');
        if (feeEl) {
            const feePercent = (info.feeBP / 100).toFixed(1);
            feeEl.textContent = `${feePercent}%`;
        }
        
        // Min donation
        const minEl = document.getElementById('min-donation');
        if (minEl) {
            const min = parseFloat(ethers.utils.formatEther(info.minDonation));
            minEl.textContent = min >= 0.01 
                ? `${min.toFixed(4)} ETH` 
                : `${(min * 1e18).toLocaleString()} wei`;
        }
    }

    /**
     * Update recent winners list
     */
    async updateRecentWinners() {
        try {
            // Get recent winners (last 5)
            const winners = await this.contract.get_recent_winners(5);
            
            const listEl = document.getElementById('recent-winners-list');
            if (!listEl) return;
            
            if (winners.length === 0) {
                listEl.innerHTML = '<div class="no-data">No winners yet</div>';
                return;
            }
            
            // Build winners list
            let html = '<div class="winners-grid">';
            for (let i = 0; i < winners.length; i++) {
                const winner = winners[i];
                const roundNum = this.contestInfo.totalRounds - i;
                const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                
                html += `
                    <div class="winner-item">
                        <div class="winner-round">Round ${roundNum}</div>
                        <div class="winner-address ${isYou ? 'highlight' : ''}">
                            ${isYou ? '🏆 YOU' : `${winner.slice(0, 8)}...${winner.slice(-6)}`}
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            
            listEl.innerHTML = html;
            
        } catch (error) {
            console.error('Failed to load recent winners:', error);
            const listEl = document.getElementById('recent-winners-list');
            if (listEl) {
                listEl.innerHTML = '<div class="error">Failed to load winners</div>';
            }
        }
    }

    /**
     * Update all components with current data
     */
    updateComponents() {
        // Update donation statistics
        DonationStats.update(
            this.donations,
            this.web3Provider.currentAddress,
            this.contestInfo
        );
        
        // Update donation chart
        DonationChart.update(
            this.donations,
            this.web3Provider.currentAddress,
            this.contestInfo.currentLeader
        );
        
        // Update donation history
        DonationHistory.update(
            this.donations,
            this.web3Provider.currentAddress,
            this.contestInfo.currentLeader
        );
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners = [];
        
        // Remove contract event listeners
        if (this.contract) {
            this.contract.removeAllListeners('DonationReceived');
            this.contract.removeAllListeners('RoundEnded');
            this.contract.removeAllListeners('RoundStarted');
            this.contract.removeAllListeners('LeaderboardUpdate');
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
