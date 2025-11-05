/**
 * Pay It Forward Game
 * Your donation goes to the next donor - a chain of generosity!
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class PayItForward {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.gameType = 'pay-it-forward';
        this.gameState = {
            pendingDonor: '0x0000000000000000000000000000000000000000',
            pendingAmount: 0,
            totalDonations: 0,
            donationCount: 0,
            minimumDonation: 0,
            paused: false
        };
        this.userStats = {
            totalDonated: 0,
            totalReceived: 0,
            donationCount: 0
        };
    }

    /**
     * Initialize the game
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Ensure wallet is connected
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            console.error('Cannot initialize game: Wallet not properly connected');
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return;
        }
        
        console.log('✅ Wallet confirmed:', web3Provider.currentAddress);
        
        // Load contract ABI and initialize contract
        try {
            const response = await fetch('/contracts/abis/pay-it-forward.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.PAY_IT_FORWARD,
                abi
            );
            
            console.log('Pay It Forward: Contract loaded at', CONTRACT_ADDRESSES.PAY_IT_FORWARD);
            
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
        // Create custom interface (not using standard round-based game interface)
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Title and description header
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = '⏩ Pay It Forward';
        header.appendChild(title);
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = 'Donate now, receive the next donation! A chain of generosity.';
        header.appendChild(description);
        
        container.appendChild(header);
        
        // Donation controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls';
        controlsDiv.innerHTML = `
            <div class="input-group">
                <label for="donate-amount">Donation Amount (wei)</label>
                <input 
                    type="number" 
                    id="donate-amount" 
                    placeholder="Enter amount in wei..."
                    min="0"
                    step="1"
                />
            </div>
            <button id="donate-button" class="button-primary">💰 Donate</button>
        `;
        
        container.appendChild(controlsDiv);
        this.container.appendChild(container);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Game info panel
        const gamePanel = this.renderGameInfo();
        sectionsContainer.appendChild(gamePanel);
        
        // Pending donation panel
        const pendingPanel = this.renderPendingInfo();
        sectionsContainer.appendChild(pendingPanel);
        
        // User stats panel
        const userStatsPanel = this.renderUserStats();
        sectionsContainer.appendChild(userStatsPanel);
        
        // How it works panel
        const howItWorksPanel = this.renderHowItWorks();
        sectionsContainer.appendChild(howItWorksPanel);
        
        this.container.appendChild(sectionsContainer);
    }

    /**
     * Render game info panel
     */
    renderGameInfo() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'game-info-panel';
        
        panel.innerHTML = `
            <h3>🎮 Game Status</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Total Donations</div>
                    <div class="info-value" id="total-donations">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Donation Count</div>
                    <div class="info-value" id="donation-count">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Minimum Donation</div>
                    <div class="info-value" id="minimum-donation">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" id="game-status">Active</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contract Balance</div>
                    <div class="info-value" id="contract-balance">0 wei</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render pending donation info panel
     */
    renderPendingInfo() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'pending-info-panel';
        
        panel.innerHTML = `
            <h3>⏳ Pending Donation</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Pending Donor</div>
                    <div class="info-value" id="pending-donor">None</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Pending Amount</div>
                    <div class="info-value" id="pending-amount">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">You Are</div>
                    <div class="info-value" id="your-position">-</div>
                </div>
            </div>
            <div class="info-description">
                💡 The next donor will receive this pending amount and become the new pending donor!
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
                    <div class="info-label">Total Donated</div>
                    <div class="info-value" id="user-total-donated">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Received</div>
                    <div class="info-value" id="user-total-received">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Donation Count</div>
                    <div class="info-value" id="user-donation-count">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Net Position</div>
                    <div class="info-value" id="user-net-position">0 wei</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render how it works panel
     */
    renderHowItWorks() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'how-it-works-panel';
        
        panel.innerHTML = `
            <h3>📖 How It Works</h3>
            <div class="how-it-works">
                <ol>
                    <li><strong>First Donor:</strong> Makes initial donation, becomes pending donor</li>
                    <li><strong>Second Donor:</strong> Receives first donor's amount, becomes new pending donor</li>
                    <li><strong>Chain Continues:</strong> Each new donor receives the previous pending amount</li>
                    <li><strong>Pay It Forward:</strong> Your donation awaits the next generous soul!</li>
                </ol>
                <p class="note">
                    ⚠️ <strong>Important:</strong> Your donation is pending until someone else donates. 
                    The last donor in the chain holds the pending amount.
                </p>
            </div>
        `;
        
        return panel;
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        const donateButton = document.getElementById('donate-button');
        const amountInput = document.getElementById('donate-amount');
        
        const handleDonate = () => this.donate(amountInput.value);
        
        if (donateButton) {
            donateButton.addEventListener('click', handleDonate);
            this.eventListeners.push({ element: donateButton, handler: handleDonate });
        }
        
        // Enter key support
        if (amountInput) {
            amountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleDonate();
            });
        }
    }

    /**
     * Make a donation
     */
    async donate(weiAmount) {
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
                type: 'warning'
            });
            return;
        }
        
        if (parseFloat(weiAmount) < parseFloat(this.gameState.minimumDonation)) {
            eventBus.emit(EVENTS.TOAST, {
                message: `Donation must be at least ${this.gameState.minimumDonation} wei`,
                type: 'warning'
            });
            return;
        }
        
        try {
            GameRenderer.setLoading(true);
            
            eventBus.emit(EVENTS.PLAY_SUBMITTED, {
                game: 'pay-it-forward',
                wei: weiAmount
            });
            
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
                game: 'pay-it-forward',
                wei: weiAmount
            });
            
            eventBus.emit(EVENTS.TOAST, {
                message: `Donated ${parseInt(weiAmount).toLocaleString()} wei!`,
                type: 'success'
            });
            
            // Clear input
            document.getElementById('play-wei').value = '';
            
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
            
            // Get pending info
            const pendingInfo = await this.contract.get_pending_info();
            const [pendingDonor, pendingAmount] = pendingInfo;
            
            // Get stats
            const stats = await this.contract.get_stats();
            const [totalDonations, donationCount, paused, minimumDonation] = stats;
            
            // Get contract balance
            const balance = await this.contract.get_contract_balance();
            
            // Get user stats
            const userStats = await this.contract.get_user_stats(this.web3Provider.currentAddress);
            const [userTotalDonated, userTotalReceived, userDonationCount] = userStats;
            
            this.gameState = {
                pendingDonor,
                pendingAmount,
                totalDonations,
                donationCount: donationCount.toNumber(),
                minimumDonation,
                paused,
                balance
            };
            
            this.userStats = {
                totalDonated: userTotalDonated,
                totalReceived: userTotalReceived,
                donationCount: userDonationCount.toNumber()
            };
            
            console.log('✅ Contract state loaded:', this.gameState);
            
            // Update all UI panels
            this.updateAllPanels();
            
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
     * Setup real-time event listeners
     */
    setupContractEventListeners() {
        if (!this.contract) return;
        
        // Listen for Donated events
        this.contract.on('Donated', async (donor, amount, receivedFrom, receivedAmount, timestamp) => {
            console.log('New donation!', {
                donor,
                amount: ethers.utils.formatEther(amount),
                receivedFrom,
                receivedAmount: ethers.utils.formatEther(receivedAmount)
            });
            
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            const receivedFromYou = receivedFrom.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `✅ You donated ${ethers.utils.formatEther(amount)} ETH and received ${ethers.utils.formatEther(receivedAmount)} ETH!`,
                    type: 'success'
                });
            } else if (receivedFromYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `💰 Someone donated! You are no longer pending.`,
                    type: 'info'
                });
            }
            
            // Refresh state
            await this.refreshState();
        });
        
        // Listen for FirstDonation event
        this.contract.on('FirstDonation', async (donor, amount, timestamp) => {
            console.log('First donation!', {
                donor,
                amount: ethers.utils.formatEther(amount)
            });
            
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            eventBus.emit(EVENTS.TOAST, {
                message: isYou 
                    ? `✅ You made the first donation! You are now pending.` 
                    : `🎉 First donation received from ${donor.slice(0, 6)}...`,
                type: 'success'
            });
            
            // Refresh state
            await this.refreshState();
        });
    }

    /**
     * Update all UI panels
     */
    updateAllPanels() {
        this.updateGameInfo();
        this.updatePendingInfo();
        this.updateUserStatsPanel();
    }

    /**
     * Update game info panel
     */
    updateGameInfo() {
        const state = this.gameState;
        
        // Total donations
        const totalEl = document.getElementById('total-donations');
        if (totalEl) {
            const total = parseFloat(ethers.utils.formatEther(state.totalDonations));
            totalEl.textContent = total >= 0.01 
                ? `${total.toFixed(4)} ETH` 
                : `${state.totalDonations.toString()} wei`;
        }
        
        // Donation count
        const countEl = document.getElementById('donation-count');
        if (countEl) {
            countEl.textContent = state.donationCount.toString();
        }
        
        // Minimum donation
        const minEl = document.getElementById('minimum-donation');
        if (minEl) {
            const min = parseFloat(ethers.utils.formatEther(state.minimumDonation));
            minEl.textContent = min >= 0.01 
                ? `${min.toFixed(4)} ETH` 
                : `${state.minimumDonation.toString()} wei`;
        }
        
        // Status
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            if (state.paused) {
                statusEl.textContent = '⏸️ Paused';
                statusEl.style.color = 'var(--warning)';
            } else {
                statusEl.textContent = '✅ Active';
                statusEl.style.color = 'var(--success)';
            }
        }
        
        // Contract balance
        const balanceEl = document.getElementById('contract-balance');
        if (balanceEl) {
            const balance = parseFloat(ethers.utils.formatEther(state.balance));
            balanceEl.textContent = balance >= 0.01 
                ? `${balance.toFixed(4)} ETH` 
                : `${state.balance.toString()} wei`;
        }
    }

    /**
     * Update pending info panel
     */
    updatePendingInfo() {
        const state = this.gameState;
        
        // Pending donor
        const donorEl = document.getElementById('pending-donor');
        if (donorEl) {
            if (state.pendingDonor === '0x0000000000000000000000000000000000000000') {
                donorEl.textContent = 'None (be the first!)';
                donorEl.style.color = '';
            } else if (state.pendingDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                donorEl.textContent = '🎯 YOU!';
                donorEl.style.color = 'var(--success)';
            } else {
                donorEl.textContent = `${state.pendingDonor.slice(0, 8)}...${state.pendingDonor.slice(-6)}`;
                donorEl.style.color = '';
            }
        }
        
        // Pending amount
        const amountEl = document.getElementById('pending-amount');
        if (amountEl) {
            const amount = parseFloat(ethers.utils.formatEther(state.pendingAmount));
            amountEl.textContent = amount >= 0.01 
                ? `${amount.toFixed(4)} ETH` 
                : `${state.pendingAmount.toString()} wei`;
        }
        
        // Your position
        const positionEl = document.getElementById('your-position');
        if (positionEl) {
            if (state.pendingDonor === '0x0000000000000000000000000000000000000000') {
                positionEl.textContent = 'No one pending';
                positionEl.style.color = '';
            } else if (state.pendingDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                positionEl.textContent = '⏳ Pending (waiting for next donor)';
                positionEl.style.color = 'var(--warning)';
            } else {
                positionEl.textContent = 'Not pending';
                positionEl.style.color = '';
            }
        }
    }

    /**
     * Update user statistics panel
     */
    updateUserStatsPanel() {
        const stats = this.userStats;
        
        // Total donated
        const donatedEl = document.getElementById('user-total-donated');
        if (donatedEl) {
            const donated = parseFloat(ethers.utils.formatEther(stats.totalDonated));
            donatedEl.textContent = donated >= 0.01 
                ? `${donated.toFixed(4)} ETH` 
                : `${stats.totalDonated.toString()} wei`;
        }
        
        // Total received
        const receivedEl = document.getElementById('user-total-received');
        if (receivedEl) {
            const received = parseFloat(ethers.utils.formatEther(stats.totalReceived));
            receivedEl.textContent = received >= 0.01 
                ? `${received.toFixed(4)} ETH` 
                : `${stats.totalReceived.toString()} wei`;
        }
        
        // Donation count
        const countEl = document.getElementById('user-donation-count');
        if (countEl) {
            countEl.textContent = stats.donationCount.toString();
        }
        
        // Net position
        const netEl = document.getElementById('user-net-position');
        if (netEl) {
            const donated = ethers.BigNumber.from(stats.totalDonated);
            const received = ethers.BigNumber.from(stats.totalReceived);
            const net = received.sub(donated);
            const netValue = parseFloat(ethers.utils.formatEther(net.abs()));
            
            if (net.isZero()) {
                netEl.textContent = 'Even';
                netEl.style.color = '';
            } else if (net.gt(0)) {
                netEl.textContent = netValue >= 0.01 
                    ? `+${netValue.toFixed(4)} ETH` 
                    : `+${net.toString()} wei`;
                netEl.style.color = 'var(--success)';
            } else {
                netEl.textContent = netValue >= 0.01 
                    ? `-${netValue.toFixed(4)} ETH` 
                    : `${net.toString()} wei`;
                netEl.style.color = 'var(--danger)';
            }
        }
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
            this.contract.removeAllListeners('Donated');
            this.contract.removeAllListeners('FirstDonation');
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

