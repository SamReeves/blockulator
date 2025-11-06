/**
 * Pissing Contest - Simplified Version
 * Send the highest donation to win!
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES } from '../../contracts/addresses.js';

export class PissingContest {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        this.contract = await ContractLoader.load('pissing-contest', web3Provider);
        if (!this.contract) return;
        
        this.render();
        this.setupListeners();
        this.setupContractEvents();
        await this.refreshState();
    }

    render() {
        // Header with contract info
        const header = GameRenderer.createGameHeader({
            title: '💦 Pissing Contest',
            description: 'Send the HIGHEST donation to win the pot!',
            contractAddress: CONTRACT_ADDRESSES.PISSING_CONTEST,
            sourceFile: CONTRACT_SOURCES.PISSING_CONTEST
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
            '💰 Donate & Compete'
        ));
        
        container.appendChild(controlsDiv);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Current round panel
        sectionsContainer.appendChild(this.renderRoundPanel());
        
        // How it works panel
        sectionsContainer.appendChild(this.renderHowItWorks());
        
        container.appendChild(sectionsContainer);
        this.container.appendChild(container);
    }

    /**
     * Render current round panel
     */
    renderRoundPanel() {
        const panel = DOMHelpers.createInfoPanel('🏆 Current Round', [
            { label: 'Prize Pool', id: 'prize-pool' },
            { label: 'Donations', id: 'donations-count' },
            { label: 'Current Leader', id: 'current-leader' },
            { label: 'Your Donation', id: 'your-donation' },
            { label: 'Your Status', id: 'your-status' }
        ]);
        
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
                    <li><strong>Make Your Donation:</strong> Send any amount of wei to enter the current round</li>
                    <li><strong>Compete for the Lead:</strong> The HIGHEST single donation becomes the leader</li>
                    <li><strong>Round Completion:</strong> When max donations is reached, the round ends automatically</li>
                    <li><strong>Winner Takes the Pot:</strong> The leader wins 99% of the total prize pool!</li>
                </ol>
                <p class="note">
                    💡 <strong>Pro Tip:</strong> You can donate multiple times in a round, but only your LARGEST donation counts for leadership!
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
        
        // Enter key support
        if (amountInput) {
            amountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.donate(e.target.value);
                }
            });
        }
    }

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
            
            // Clear input and refresh state
            document.getElementById('donate-amount').value = '';
            await this.refreshState();
            
        } catch (error) {
            // Error already handled by TransactionHandler
            console.error('Donation failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract || !this.web3Provider?.currentAddress) return;

        try {
            const roundInfo = await this.contract.get_current_round_info();
            
            // Handle both BigNumber and regular number types
            const donationCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
            const maxDonations = typeof roundInfo[2] === 'number' ? roundInfo[2] : roundInfo[2].toNumber();
            const largestDonor = roundInfo[4];
            const totalValue = roundInfo[5];

            // Update UI using DOMHelpers
            DOMHelpers.updateInfo('prize-pool', 
                DOMHelpers.formatWei(totalValue)
            );
            DOMHelpers.updateInfo('donations-count', 
                `${donationCount} / ${maxDonations}`
            );
            DOMHelpers.updateInfo('current-leader', 
                largestDonor === '0x0000000000000000000000000000000000000000'
                    ? 'No donations yet'
                    : DOMHelpers.formatAddress(largestDonor)
            );

            // Get user's position
            const userPosition = await this.contract.get_current_leaderboard_position(
                this.web3Provider.currentAddress
            );
            const userDonation = userPosition[0];
            const isWinning = userPosition[1];

            DOMHelpers.updateInfo('your-donation', 
                DOMHelpers.formatWei(userDonation)
            );
            
            DOMHelpers.updateInfo('your-status', 
                userDonation.gt(0) 
                    ? (isWinning ? '🥇 Leading!' : '📊 Playing')
                    : 'Not playing'
            );

        } catch (error) {
            console.error('Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game state. Check console for details.',
                type: 'error'
            });
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('DonationReceived', async (roundNumber, donor, amount, donationNumber, isLargest) => {
            await this.refreshState();
            
            const isYou = donor.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            if (isYou && isLargest) {
                eventBus.emit(EVENTS.TOAST, {
                    message: '🏆 You are now leading!',
                    type: 'success'
                });
            }
        });

        this.contract.on('RoundEnded', async (roundNumber, winner, prize) => {
            const isYou = winner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
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
            
            await this.refreshState();
        });

        this.contract.on('RoundStarted', async (roundNumber) => {
            eventBus.emit(EVENTS.TOAST, {
                message: `🚀 Round #${roundNumber} started!`,
                type: 'info'
            });
            await this.refreshState();
        });
    }

    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}
