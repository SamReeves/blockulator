/**
 * Pay It Forward Game
 * Your donation goes to the next donor - a chain of generosity!
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { eventBus, EVENTS } from '../ui/events.js';

export class PayItForward {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'pay-it-forward';
        this.gameState = {
            pendingDonor: '0x0000000000000000000000000000000000000000',
            pendingAmount: 0
        };
    }

    /**
     * Initialize the game
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('pay-it-forward', web3Provider);
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
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Header using DOMHelpers
        container.appendChild(DOMHelpers.createHeader(
            '⏩ Pay It Forward',
            'Donate now, receive the next donation! A chain of generosity.'
        ));
        
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
        this.container.appendChild(container);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current state panel
        sectionsContainer.appendChild(this.renderStatePanel());
        
        // How it works panel
        sectionsContainer.appendChild(this.renderHowItWorks());
        
        this.container.appendChild(sectionsContainer);
    }

    /**
     * Render state panel - shows actual contract data
     */
    renderStatePanel() {
        const panel = DOMHelpers.createInfoPanel('🎮 Current State', [
            { label: 'Pending Donor', id: 'pending-donor' },
            { label: 'Pending Amount', id: 'pending-amount' },
            { label: 'Contract Balance', id: 'contract-balance' },
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
                    <li><strong>First Donor:</strong> Makes initial donation, becomes pending donor</li>
                    <li><strong>Second Donor:</strong> Receives first donor's amount, becomes new pending donor</li>
                    <li><strong>Chain Continues:</strong> Each new donor receives the previous pending amount</li>
                    <li><strong>Pay It Forward:</strong> Your donation awaits the next generous soul!</li>
                </ol>
                <p class="note">
                    ⚠️ <strong>Important:</strong> Your donation is pending until someone else donates.
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
                    game: 'pay-it-forward', 
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
            const [pendingDonor, pendingAmount, balance] = await Promise.all([
                this.contract.pending_donor(),
                this.contract.pending_amount(),
                this.web3Provider.provider.getBalance(this.contract.address)
            ]);

            // Update local state
            this.gameState.pendingDonor = pendingDonor;
            this.gameState.pendingAmount = pendingAmount;

            // Update UI using DOMHelpers
            DOMHelpers.updateInfo('pending-donor', 
                DOMHelpers.formatAddress(pendingDonor)
            );
            DOMHelpers.updateInfo('pending-amount', 
                DOMHelpers.formatWei(pendingAmount)
            );
            DOMHelpers.updateInfo('contract-balance', 
                DOMHelpers.formatWei(balance)
            );
            
            // Check if current user is pending
            const isYouPending = pendingDonor.toLowerCase() === 
                this.web3Provider.currentAddress.toLowerCase();
            
            DOMHelpers.updateInfo('your-status', 
                isYouPending ? '🎯 You are pending!' : 'Not pending'
            );

            // Update state message
            const stateMessage = document.getElementById('state-message');
            if (stateMessage) {
                if (pendingDonor === '0x0000000000000000000000000000000000000000') {
                    stateMessage.textContent = '🚀 Be the first donor to start the chain!';
                } else if (isYouPending) {
                    stateMessage.textContent = '⏳ You are pending! Waiting for the next donor to pay you.';
                } else {
                    stateMessage.textContent = '💫 Donate now and receive the pending amount immediately!';
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
        this.contract.on('Donation', async (donor, amount, received, isFirst, event) => {
            console.log('Donation event:', { donor, amount: amount.toString(), received: received.toString(), isFirst });
            
            // Refresh state when donations occur
            await this.refreshState();
            
            // Show notification if it involves current user
            if (donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                if (isFirst) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: '🎉 You started the chain! Waiting for next donor.',
                        type: 'success'
                    });
                } else {
                    eventBus.emit(EVENTS.TOAST, {
                        message: `🎉 You received ${DOMHelpers.formatWei(received)} and are now pending!`,
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
