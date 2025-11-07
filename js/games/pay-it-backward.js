/**
 * Pay It Backward Game
 * Your donation goes to the previous donor - rewarding those who came before!
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../contracts/deployments/addresses.js';

export class PayItBackward {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'pay-it-backward';
        this.gameState = {
            lastDonor: '0x0000000000000000000000000000000000000000',
            owner: '0x0000000000000000000000000000000000000000'
        };
    }

    /**
     * Initialize the game
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('pay-it-backward', web3Provider);
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
        // Header with contract info
        const header = GameRenderer.createGameHeader({
            title: '⏪ Pay It Backward',
            description: 'Donate now, reward the previous donor! Immediate gratification for those who came before.',
            contractAddress: CONTRACT_ADDRESSES.PAY_IT_BACKWARD,
            sourceFile: CONTRACT_SOURCES.PAY_IT_BACKWARD,
            abiFile: CONTRACT_ABIS.PAY_IT_BACKWARD
        });
        
        const container = document.createElement('div');
        container.className = 'game-interface';
        container.appendChild(header);
        
        // Donation controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls';
        
        controlsDiv.appendChild(DOMHelpers.createInput({
            id: 'donate-amount',
            label: 'Donation Amount (wei)',
            placeholder: 'Enter amount in wei...',
            min: 0,
            step: 1
        }));
        
        controlsDiv.appendChild(DOMHelpers.createButton(
            'donate-button',
            '💰 Donate'
        ));
        
        container.appendChild(controlsDiv);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current state panel
        sectionsContainer.appendChild(this.renderStatePanel());
        
        // How it works panel
        sectionsContainer.appendChild(this.renderHowItWorks());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

    /**
     * Render state panel - shows actual contract data
     */
    renderStatePanel() {
        const panel = DOMHelpers.createInfoPanel('🎮 Current State', [
            { label: 'Last Donor', id: 'last-donor' },
            { label: 'Next Recipient', id: 'next-recipient' },
            { label: 'Your Status', id: 'your-status' }
        ]);
        
        // Add state message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'info-description';
        messageDiv.id = 'state-message';
        messageDiv.textContent = '💡 Loading contract state...';
        panel.appendChild(messageDiv);
        
        return panel;
    }

    /**
     * Render how it works panel
     */
    renderHowItWorks() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        
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

    /**
     * Make a donation
     */
    async donate(weiAmount) {
        // Check wallet connection first
        if (!this.web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: '🔐 Please connect your wallet to participate',
                type: 'warning'
            });
            return;
        }
        
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
                    game: 'pay-it-backward', 
                    wei: weiAmount 
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

    /**
     * Refresh game state from blockchain
     */
    async refreshState() {
        if (!this.contract) return;

        try {
            // Load state in parallel
            const [lastDonor, nextRecipient, owner] = await Promise.all([
                this.contract.last_donor(),
                this.contract.get_next_recipient(),
                this.contract.owner()
            ]);

            // Update local state
            this.gameState.lastDonor = lastDonor;
            this.gameState.nextRecipient = nextRecipient;
            this.gameState.owner = owner;

            // Update UI using DOMHelpers
            DOMHelpers.updateInfo('last-donor', 
                DOMHelpers.formatAddress(lastDonor)
            );
            DOMHelpers.updateInfo('next-recipient', 
                DOMHelpers.formatAddress(nextRecipient)
            );
            
            // User-specific info - only if wallet connected
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                // Check if current user is last donor
                const isYouLastDonor = lastDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                DOMHelpers.updateInfo('your-status', 
                    isYouLastDonor ? '🎯 You are the last donor!' : 'Not last donor'
                );

                // Update state message
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (lastDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 Be the first donor! Your donation will go to the contract owner.';
                    } else if (isYouLastDonor) {
                        stateMessage.textContent = '🎉 You are the last donor! You will receive the next donation.';
                    } else {
                        stateMessage.textContent = `💫 Donate now to reward ${DOMHelpers.formatAddress(nextRecipient)} and become the next recipient!`;
                    }
                }
            } else {
                // Read-only mode
                DOMHelpers.updateInfo('your-status', '👀 Read-only mode');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (lastDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 No donors yet. Connect wallet to be first!';
                    } else {
                        stateMessage.textContent = `👀 Next recipient: ${DOMHelpers.formatAddress(nextRecipient)}. Connect wallet to participate!`;
                    }
                }
            }

        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state',
                type: 'error'
            });
        }
    }

    /**
     * Setup real-time contract event listeners
     */
    setupContractEventListeners() {
        if (!this.contract) return;

        // Listen for Donation events
        this.contract.on('Donation', async (donor, amount, recipient, isFirst, event) => {
            console.log('Donation event:', { 
                donor, 
                amount: amount.toString(), 
                recipient, 
                isFirst 
            });
            
            // Refresh state when donations occur
            await this.refreshState();
            
            // Show notification if it involves current user (only if wallet connected)
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🎉 You donated ${DOMHelpers.formatWei(amount)} to ${DOMHelpers.formatAddress(recipient)}!`,
                        type: 'success'
                    });
                } else if (recipient.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `💰 You received ${DOMHelpers.formatWei(amount)} from ${DOMHelpers.formatAddress(donor)}!`,
                        type: 'success'
                    });
                }
            }
        });
    }

    /**
     * Cleanup when game is unloaded
     */
    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}
