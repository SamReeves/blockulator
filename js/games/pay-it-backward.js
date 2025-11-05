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
        
        // Current state panel
        const statePanel = this.renderStatePanel();
        sectionsContainer.appendChild(statePanel);
        
        // How it works panel
        const howItWorksPanel = this.renderHowItWorks();
        sectionsContainer.appendChild(howItWorksPanel);
        
        this.container.appendChild(sectionsContainer);
    }

    /**
     * Render state panel - shows actual contract data
     */
    renderStatePanel() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'state-panel';
        
        panel.innerHTML = `
            <h3>🎮 Current State</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Last Donor</div>
                    <div class="info-value" id="last-donor">Loading...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Next Recipient</div>
                    <div class="info-value" id="next-recipient">Loading...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Your Status</div>
                    <div class="info-value" id="your-status">-</div>
                </div>
            </div>
            <div class="info-description" id="state-message">
                💡 Loading contract state...
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
            const amountInput = document.getElementById('donate-amount');
            if (amountInput) {
                amountInput.value = '';
            }
            
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
        this.updateStatePanel();
    }

    /**
     * Update state panel with actual contract data
     */
    updateStatePanel() {
        const state = this.gameState;
        
        // Last donor
        const lastDonorEl = document.getElementById('last-donor');
        if (lastDonorEl) {
            if (state.lastDonor === '0x0000000000000000000000000000000000000000') {
                lastDonorEl.textContent = '🌟 None (be the first!)';
                lastDonorEl.style.color = 'var(--primary)';
            } else if (state.lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                lastDonorEl.textContent = '🎯 YOU!';
                lastDonorEl.style.color = 'var(--success)';
            } else {
                lastDonorEl.textContent = `${state.lastDonor.slice(0, 10)}...${state.lastDonor.slice(-8)}`;
                lastDonorEl.style.color = '';
            }
        }
        
        // Next recipient
        const recipientEl = document.getElementById('next-recipient');
        if (recipientEl) {
            if (state.nextRecipient.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                recipientEl.textContent = '🎯 YOU!';
                recipientEl.style.color = 'var(--success)';
            } else {
                recipientEl.textContent = `${state.nextRecipient.slice(0, 10)}...${state.nextRecipient.slice(-8)}`;
                recipientEl.style.color = '';
            }
        }
        
        // Your status and message
        const statusEl = document.getElementById('your-status');
        const messageEl = document.getElementById('state-message');
        
        if (state.lastDonor === '0x0000000000000000000000000000000000000000') {
            if (statusEl) {
                statusEl.textContent = '🌟 Ready to Start';
                statusEl.style.color = 'var(--primary)';
            }
            if (messageEl) {
                messageEl.innerHTML = '💡 <strong>Be the first!</strong> Your donation will go to the contract owner, and you\'ll become the recipient of the next donation.';
            }
        } else if (state.lastDonor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
            if (statusEl) {
                statusEl.textContent = '🎯 Last Donor';
                statusEl.style.color = 'var(--success)';
            }
            if (messageEl) {
                messageEl.innerHTML = '🎯 <strong>You\'re the last donor!</strong> You will receive the next donation automatically.';
            }
        } else {
            if (statusEl) {
                statusEl.textContent = '💚 Ready to Donate';
                statusEl.style.color = 'var(--success)';
            }
            if (messageEl) {
                const recipientText = recipientEl ? recipientEl.textContent : 'the last donor';
                messageEl.innerHTML = `💚 <strong>Donate now!</strong> Your donation will go to <strong>${recipientText}</strong> immediately, and you become the new recipient.`;
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

