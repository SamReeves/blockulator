/**
 * Pay It Backward Game
 * Your donation goes to the previous donor - rewarding those who came before!
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class PayItBackward {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.gameType = 'pay-it-backward';
        this.gameState = {
            lastDonor: '0x0000000000000000000000000000000000000000',
            totalDonations: 0,
            donationCount: 0,
            minimumDonation: 0,
            paused: false,
            owner: '0x0000000000000000000000000000000000000000'
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
            const response = await fetch('/contracts/abis/pay-it-backward.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.PAY_IT_BACKWARD,
                abi
            );
            
            console.log('Pay It Backward: Contract loaded at', CONTRACT_ADDRESSES.PAY_IT_BACKWARD);
            
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
        title.textContent = '⏪ Pay It Backward';
        header.appendChild(title);
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = 'Donate now, reward the previous donor! Immediate gratification for those who came before.';
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
        
        // Next recipient panel
        const recipientPanel = this.renderNextRecipient();
        sectionsContainer.appendChild(recipientPanel);
        
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
                    <div class="info-label">Last Donor</div>
                    <div class="info-value" id="last-donor">None</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render next recipient panel
     */
    renderNextRecipient() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'recipient-info-panel';
        
        panel.innerHTML = `
            <h3>🎯 Next Recipient</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Will Receive</div>
                    <div class="info-value" id="next-recipient">-</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Your Status</div>
                    <div class="info-value" id="your-status">-</div>
                </div>
            </div>
            <div class="info-description">
                💡 When you donate, the <strong>previous donor</strong> (or contract owner if first) receives your donation immediately!
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
                    <li><strong>First Donor:</strong> Donation goes to contract owner (bootstrap)</li>
                    <li><strong>Second Donor:</strong> Pays the first donor directly</li>
                    <li><strong>Chain Continues:</strong> Each donor rewards the one before them</li>
                    <li><strong>Immediate Rewards:</strong> Last donor becomes next recipient!</li>
                </ol>
                <p class="note">
                    ✅ <strong>No Waiting:</strong> Unlike Pay It Forward, all donations are distributed immediately. 
                    Become the last donor to receive the next donation!
                </p>
                <p class="note">
                    🎯 <strong>Simplified Version:</strong> This contract has no admin controls, no minimum donation, 
                    and no on-chain statistics tracking. Pure game logic only!
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
        
        // No minimum donation check in simplified version
        
        try {
            GameRenderer.setLoading(true);
            
            eventBus.emit(EVENTS.PLAY_SUBMITTED, {
                game: 'pay-it-backward',
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
                game: 'pay-it-backward',
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
            
            // Call individual public getters
            const lastDonor = await this.contract.last_donor();
            const owner = await this.contract.owner();
            const nextRecipient = await this.contract.get_next_recipient();
            
            this.gameState = {
                lastDonor,
                totalDonations: 0,   // Simplified: track via events if needed
                donationCount: 0,    // Simplified: track via events if needed
                minimumDonation: 0,  // Simplified: no minimum
                paused: false,
                owner,
                nextRecipient
            };
            
            // Simplified: no per-user tracking on-chain
            this.userStats = {
                totalDonated: ethers.BigNumber.from(0),
                totalReceived: ethers.BigNumber.from(0),
                donationCount: 0
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
        
        // Listen for Donation events (simplified - one event type)
        this.contract.on('Donation', async (donor, amount, recipient, isFirst) => {
            console.log('New donation!', {
                donor,
                amount: ethers.utils.formatEther(amount),
                recipient,
                isFirst
            });
            
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            const youReceived = recipient.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                if (isFirst) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `✅ You made the first donation of ${ethers.utils.formatEther(amount)} ETH! You are now the last donor.`,
                        type: 'success'
                    });
                } else {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `✅ You donated ${ethers.utils.formatEther(amount)} ETH! You are now the last donor.`,
                        type: 'success'
                    });
                }
            } else if (youReceived) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `💰 You received ${ethers.utils.formatEther(amount)} ETH!`,
                    type: 'success'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `💰 New donation! Someone donated ${ethers.utils.formatEther(amount)} ETH.`,
                    type: 'info'
                });
            }
            
            // Refresh state
            await this.refreshState();
        });
    }

    /**
     * Update all UI panels
     */
    updateAllPanels() {
        this.updateGameInfo();
        this.updateNextRecipient();
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
        
        // Last donor
        const lastDonorEl = document.getElementById('last-donor');
        if (lastDonorEl) {
            if (state.lastDonor === '0x0000000000000000000000000000000000000000') {
                lastDonorEl.textContent = 'None (be the first!)';
                lastDonorEl.style.color = '';
            } else if (state.lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                lastDonorEl.textContent = '🎯 YOU!';
                lastDonorEl.style.color = 'var(--success)';
            } else {
                lastDonorEl.textContent = `${state.lastDonor.slice(0, 8)}...${state.lastDonor.slice(-6)}`;
                lastDonorEl.style.color = '';
            }
        }
    }

    /**
     * Update next recipient panel
     */
    updateNextRecipient() {
        const state = this.gameState;
        
        // Next recipient
        const recipientEl = document.getElementById('next-recipient');
        if (recipientEl) {
            if (state.nextRecipient === '0x0000000000000000000000000000000000000000') {
                recipientEl.textContent = 'Contract Owner (first donation)';
                recipientEl.style.color = '';
            } else if (state.nextRecipient.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                recipientEl.textContent = '🎯 YOU!';
                recipientEl.style.color = 'var(--success)';
            } else {
                recipientEl.textContent = `${state.nextRecipient.slice(0, 8)}...${state.nextRecipient.slice(-6)}`;
                recipientEl.style.color = '';
            }
        }
        
        // Your status
        const statusEl = document.getElementById('your-status');
        if (statusEl) {
            if (state.lastDonor === '0x0000000000000000000000000000000000000000') {
                statusEl.textContent = 'No donations yet';
                statusEl.style.color = '';
            } else if (state.lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                statusEl.textContent = '🎯 Last Donor (will receive next)';
                statusEl.style.color = 'var(--success)';
            } else {
                statusEl.textContent = 'Not last donor';
                statusEl.style.color = '';
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
            this.contract.removeAllListeners('Donation');
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

