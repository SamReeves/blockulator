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
            description: 'Send the HIGHEST donation to win! Winner gets 99% of the pot when contest ends at 10 donations.'
        });
        this.container.appendChild(ui);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current contest info panel
        const infoPanel = this.renderContestInfo();
        sectionsContainer.appendChild(infoPanel);
        
        // Donation statistics
        const statsPanel = DonationStats.render(
            this.donations,
            this.web3Provider.currentAddress,
            this.contestInfo
        );
        sectionsContainer.appendChild(statsPanel);
        
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
     * Render contest information panel
     */
    renderContestInfo() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'contest-info-panel';
        
        panel.innerHTML = `
            <h3>📊 Current Contest Status</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Current Leader</div>
                    <div class="info-value" id="current-leader">Loading...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Your Donation</div>
                    <div class="info-value" id="your-donation">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Potential Prize</div>
                    <div class="info-value" id="potential-prize">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contest Status</div>
                    <div class="info-value" id="contest-status">Active</div>
                </div>
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
     * Refresh game state from blockchain events
     * Pure event-driven approach - no view functions needed
     */
    async refreshState() {
        try {
            console.log('🔄 Refreshing state from contract events...');
            console.log('Contract address:', CONTRACT_ADDRESSES.PISSING_CONTEST);
            console.log('Wallet address:', this.web3Provider.currentAddress);
            
            // Load donation history from blockchain events FIRST
            console.log('📜 Loading donation history...');
            await this.loadDonationHistory();
            
            // Derive all state from events (the purist way!)
            const currentDonations = this.donations.length;
            
            // Calculate total pool by summing all donation amounts
            let totalPool = ethers.BigNumber.from(0);
            for (const donation of this.donations) {
                totalPool = totalPool.add(ethers.BigNumber.from(Math.floor(donation.weiAmount)));
            }
            
            // Current leader is the donor of the most recent (highest donation_number) donation
            const currentLeader = this.donations.length > 0 
                ? this.donations[this.donations.length - 1].address 
                : '0x0000000000000000000000000000000000000000';
            
            // Max donations is a contract constant (10)
            const maxDonations = 10;
            
            // Contest is active if we haven't reached max donations yet
            const contestActive = currentDonations < maxDonations;
            
            // Calculate user's total donation in current round
            let userDonation = ethers.BigNumber.from(0);
            for (const donation of this.donations) {
                if (donation.address.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    userDonation = userDonation.add(ethers.BigNumber.from(Math.floor(donation.weiAmount)));
                }
            }
            
            // Calculate potential winnings (90% to winner, 10% fee based on description)
            // Note: Description says 99% but typical is 90%, adjust based on actual contract logic
            const winnerAmount = totalPool.mul(90).div(100);
            const feeAmount = totalPool.mul(10).div(100);
            
            // Store derived state
            this.contestInfo = {
                currentDonations,
                maxDonations,
                totalPool,
                currentLeader,
                contestActive
            };
            
            console.log('✅ Contract state derived from events:', { 
                currentDonations,
                maxDonations,
                totalPool: ethers.utils.formatEther(totalPool) + ' ETH',
                currentLeader,
                contestActive,
                userDonation: ethers.utils.formatEther(userDonation) + ' ETH',
                winnerAmount: ethers.utils.formatEther(winnerAmount) + ' ETH',
                totalDonationEvents: this.donations.length
            });
            
            // Update game state bar
            GameRenderer.updateGameStateBar({
                playCount: currentDonations,
                prizePool: parseFloat(ethers.utils.formatEther(totalPool)) * 1e18
            });
            
            // Update contest info panel
            this.updateContestInfo(userDonation, winnerAmount, contestActive);
            
            // Update all components with donation data
            this.updateComponents();
            
            console.log('✅ State refresh complete!');
            
        } catch (error) {
            console.error('❌ Failed to refresh state:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            
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
            const resetFilter = this.contract.filters.ContestReset();
            const endedFilter = this.contract.filters.ContestEnded();
            
            console.log('📊 Querying DonationReceived events...');
            const donationEvents = await this.contract.queryFilter(donationFilter, fromBlock, 'latest');
            console.log(`📊 Found ${donationEvents.length} donation events`);
            
            console.log('📊 Querying ContestReset events...');
            const resetEvents = await this.contract.queryFilter(resetFilter, fromBlock, 'latest');
            console.log(`📊 Found ${resetEvents.length} reset events`);
            
            console.log('📊 Querying ContestEnded events...');
            const endedEvents = await this.contract.queryFilter(endedFilter, fromBlock, 'latest');
            console.log(`📊 Found ${endedEvents.length} ended events`);
            
            console.log(`📊 Total: ${donationEvents.length} donations, ${resetEvents.length} resets, ${endedEvents.length} ended events`);
            
            // Find the most recent round boundary (reset or ended event)
            let roundStartBlock = fromBlock;
            
            const allBoundaryEvents = [...resetEvents, ...endedEvents].sort((a, b) => b.blockNumber - a.blockNumber);
            if (allBoundaryEvents.length > 0) {
                roundStartBlock = allBoundaryEvents[0].blockNumber;
                console.log(`Current round started at block ${roundStartBlock}`);
            }
            
            // Filter donations to only those in the current round (after the last reset/end)
            let currentRoundDonations = donationEvents.filter(e => e.blockNumber > roundStartBlock);
            
            // Alternative check: verify donation_numbers form a sequence starting from 1
            // This handles the case where the round boundary wasn't captured
            const sortedByBlock = [...currentRoundDonations].sort((a, b) => a.blockNumber - b.blockNumber);
            
            // Find the last "reset point" where donation_number goes back to 1 or decreases
            let currentRoundStart = 0;
            for (let i = 1; i < sortedByBlock.length; i++) {
                const prevNum = sortedByBlock[i-1].args.donation_number;
                const currNum = sortedByBlock[i].args.donation_number;
                
                // If donation number decreased or reset to 1, this is a new round
                if (currNum <= prevNum) {
                    currentRoundStart = i;
                }
            }
            
            const finalDonations = sortedByBlock.slice(currentRoundStart);
            
            console.log(`Current round has ${finalDonations.length} donations`);
            
            // Convert events to donation format
            this.donations = await Promise.all(finalDonations.map(async (event) => {
                try {
                    const block = await event.getBlock();
                    return {
                        address: event.args.donor,
                        weiAmount: parseFloat(ethers.utils.formatEther(event.args.amount)) * 1e18,
                        timestamp: block.timestamp,
                        donation_number: event.args.donation_number,
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
        this.contract.on('DonationReceived', async (donor, amount, donation_number, event) => {
            console.log('New donation received!', {
                donor,
                amount: ethers.utils.formatEther(amount),
                donation_number: donation_number.toString()
            });
            
            // Get block timestamp
            try {
                const block = await event.getBlock();
                
                // Add to donations array
                const newDonation = {
                    address: donor,
                    weiAmount: parseFloat(ethers.utils.formatEther(amount)) * 1e18,
                    timestamp: block.timestamp,
                    donation_number: donation_number.toNumber(),
                    txHash: event.transactionHash
                };
                
                this.donations.push(newDonation);
                this.donations.sort((a, b) => a.donation_number - b.donation_number);
                
                // Show toast notification
                const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                eventBus.emit(EVENTS.TOAST, {
                    message: isYou 
                        ? '✅ Your donation was recorded!' 
                        : `💰 New donation received from ${donor.slice(0, 6)}...`,
                    type: 'success'
                });
                
                // Refresh state and UI
                await this.refreshState();
                
            } catch (error) {
                console.error('Failed to process new donation event:', error);
            }
        });
        
        // Listen for ContestEnded event
        this.contract.on('ContestEnded', async (winner, prize, feeCollected, totalDonations) => {
            console.log('Contest ended!', {
                winner,
                prize: ethers.utils.formatEther(prize),
                totalDonations: totalDonations.toString()
            });
            
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            eventBus.emit(EVENTS.TOAST, {
                message: isYou 
                    ? `🎉 YOU WON! Prize: ${Math.round(parseFloat(ethers.utils.formatEther(prize)) * 1e18).toLocaleString()} wei!`
                    : `Contest ended! Winner: ${winner.slice(0, 6)}...`,
                type: isYou ? 'success' : 'info'
            });
            
            // Refresh state
            await this.refreshState();
        });
        
        // Listen for ContestReset event
        this.contract.on('ContestReset', async (timestamp) => {
            console.log('Contest reset at:', new Date(timestamp.toNumber() * 1000));
            
            eventBus.emit(EVENTS.TOAST, {
                message: '🔄 New contest round started!',
                type: 'info'
            });
            
            // Clear donations for new round
            this.donations = [];
            
            // Refresh state
            await this.refreshState();
        });
    }

    /**
     * Update contest info display
     */
    updateContestInfo(userDonation, winnerAmount, contestActive) {
        const leaderEl = document.getElementById('current-leader');
        const donationEl = document.getElementById('your-donation');
        const prizeEl = document.getElementById('potential-prize');
        const statusEl = document.getElementById('contest-status');
        
        if (leaderEl) {
            const leader = this.contestInfo.currentLeader;
            if (leader === '0x0000000000000000000000000000000000000000') {
                leaderEl.textContent = 'No donations yet';
            } else if (leader.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                leaderEl.textContent = '🏆 YOU!';
                leaderEl.style.color = 'var(--success)';
            } else {
                leaderEl.textContent = `${leader.slice(0, 6)}...${leader.slice(-4)}`;
                leaderEl.style.color = 'var(--text-primary)';
            }
        }
        
        if (donationEl) {
            const donation = parseFloat(ethers.utils.formatEther(userDonation)) * 1e18;
            donationEl.textContent = `${Math.round(donation).toLocaleString()} wei`;
        }
        
        if (prizeEl) {
            const prize = parseFloat(ethers.utils.formatEther(winnerAmount)) * 1e18;
            prizeEl.textContent = `${Math.round(prize).toLocaleString()} wei`;
        }
        
        if (statusEl) {
            statusEl.textContent = contestActive ? '🟢 Active' : '🔴 Ended';
            statusEl.style.color = contestActive ? 'var(--success)' : 'var(--danger)';
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
            this.contract.removeAllListeners('ContestEnded');
            this.contract.removeAllListeners('ContestReset');
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
