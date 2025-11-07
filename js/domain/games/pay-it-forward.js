/**
 * Pay It Forward Game
 * Your donation goes to the next donor - a chain of generosity!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class PayItForward extends Game {
    constructor() {
        super();
        this.gameState = {
            pendingDonor: '0x0000000000000000000000000000000000000000',
            pendingAmount: 0
        };
    }

    getContractName() {
        return 'pay-it-forward';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: '⏩ Pay It Forward',
            description: 'Donate now, receive the next donation! A chain of generosity.',
            contractAddress: CONTRACT_ADDRESSES.PAY_IT_FORWARD,
            sourceFile: CONTRACT_SOURCES.PAY_IT_FORWARD,
            abiFile: CONTRACT_ABIS.PAY_IT_FORWARD
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
        
        sectionsContainer.appendChild(this.renderStatePanel());
        sectionsContainer.appendChild(this.renderHowItWorks());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

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

    setupListeners() {
        const donateButton = document.getElementById('donate-button');
        const amountInput = document.getElementById('donate-amount');
        
        if (donateButton) {
            donateButton.addEventListener('click', () => 
                this.donate(amountInput.value)
            );
        }
        
        if (amountInput) {
            amountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.donate(e.target.value);
                }
            });
        }
    }

    async donate(weiAmount) {
        if (!this.requiresWallet('donate')) return;
        
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.donate({ 
                    value: ethers.BigNumber.from(weiAmount) 
                }),
                { 
                    game: 'pay-it-forward', 
                    wei: weiAmount 
                },
                (isLoading) => {
                    const btn = document.getElementById('donate-button');
                    if (btn) {
                        btn.disabled = isLoading;
                        btn.textContent = isLoading ? '⏳ Donating...' : '💰 Donate';
                    }
                }
            );
            
            document.getElementById('donate-amount').value = '';
            await this.refreshState();
            
        } catch (error) {
            console.error('Donation failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;

        try {
            const provider = this.web3Provider.getProvider();
            const [pendingDonor, pendingAmount, balance] = await Promise.all([
                this.contract.pending_donor(),
                this.contract.pending_amount(),
                provider.getBalance(this.contract.address)
            ]);

            this.gameState.pendingDonor = pendingDonor;
            this.gameState.pendingAmount = pendingAmount;

            DOMHelpers.updateInfo('pending-donor', 
                DOMHelpers.formatAddress(pendingDonor)
            );
            DOMHelpers.updateInfo('pending-amount', 
                DOMHelpers.formatWei(pendingAmount)
            );
            DOMHelpers.updateInfo('contract-balance', 
                DOMHelpers.formatWei(balance)
            );
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const isYouPending = pendingDonor.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                DOMHelpers.updateInfo('your-status', 
                    isYouPending ? '🎯 You are pending!' : 'Not pending'
                );

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
            } else {
                DOMHelpers.updateInfo('your-status', '👀 Read-only mode');
                const stateMessage = document.getElementById('state-message');
                if (stateMessage) {
                    if (pendingDonor === '0x0000000000000000000000000000000000000000') {
                        stateMessage.textContent = '🚀 Chain not started yet. Connect wallet to be first!';
                    } else {
                        stateMessage.textContent = '👀 Viewing game state. Connect wallet to participate!';
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

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('Donation', async (donor, amount, received, isFirst, event) => {
            console.log('Donation event:', { donor, amount: amount.toString(), received: received.toString(), isFirst });
            
            await this.refreshState();
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
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
            }
        });
    }
}

