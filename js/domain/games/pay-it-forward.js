/**
 * Pay It Forward Game
 * Your donation goes to the next donor - a chain of generosity!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { AddressFlow } from '../../presentation/components/address-flow.js';
import { getTemplate } from './templates/pay-it-forward.tpl.js';
import { gamePanelColor } from '../../theme/sdr-palette.js';

export class PayItForward extends Game {
    static metadata = {
        id: 'pay-it-forward',
        title: 'Pay It Forward',
        emoji: '⏩',
        description: 'Get previous player\'s donation',
        color: gamePanelColor('pay-it-forward'),
        contract: {
            source: 'contracts/src/games/pay_it_forward.vy',
            abi: 'contracts/build/abis/pay-it-forward.json',
            addresses: {
                sepolia: '0x338C316e1FE9535e3569597D63267A8a1AD78855',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const [pendingDonor, pendingAmount] = await Promise.all([
            contract.pending_donor(),
            contract.pending_amount()
        ]);
        return { pendingDonor, pendingAmount };
    }

    constructor() {
        super();
        this.gameState = {
            pendingDonor: '0x0000000000000000000000000000000000000000',
            pendingAmount: 0
        };
        this.donationInput = null;
        this.addressFlow = null;
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: this.metadata.color
        });
    }

    initComponents() {
        const defaultWei = '100000000000000'; // 0.0001 ETH
        this.donationInput = this.createValueInput('donate-amount-input', {
            hint: 'Donate any amount to join the chain',
            minWei: '1'
        });
        this.donationInput.setValue(defaultWei);
        
        this.addressFlow = new AddressFlow('address-flow-container', { mode: 'forward' });
        this.addressFlow.init();
        this.addressFlow.startAutoUpdate();
    }

    getListeners() {
        return {
            'donate-button': () => this.donate()
        };
    }

    async donate() {
        await this.executeTransaction({
            inputComponent: this.donationInput,
            contractCall: (wei) => this.contract.donate({ value: wei }),
            buttonId: 'donate-button',
            buttonLoadingText: '⏳ Donating...',
            buttonDefaultText: '⏩ Donate & Join Chain',
            validationMessage: 'Please enter a donation amount',
            walletAction: 'donate'
        });
    }

    async fetchAndRenderState() {
        const [pendingDonor, pendingAmount] = await Promise.all([
            this.contract.pending_donor(),
            this.contract.pending_amount()
        ]);

        this.gameState.pendingDonor = pendingDonor;
        this.gameState.pendingAmount = pendingAmount;

        const isZero = pendingDonor === '0x0000000000000000000000000000000000000000';
        
        const pendingDonorEl = document.getElementById('pending-donor');
        if (pendingDonorEl) {
            if (isZero) {
                pendingDonorEl.textContent = 'None';
            } else {
                const donorDisplay = await this.components.AddressBadge.createWithAddress(pendingDonor, this.web3Provider, {
                    size: 24,
                    formatAddress: true,
                    addressStyle: 'font-size: 1rem;'
                });
                pendingDonorEl.innerHTML = '';
                pendingDonorEl.appendChild(donorDisplay);
            }
        }
        this.dom.updateInfo('pending-amount', this.dom.formatWei(pendingAmount));
        
        if (this.addressFlow) {
            this.addressFlow.updateCurrent(pendingDonor, this.dom.formatWei(pendingAmount));
        }
        
        const stateMessage = document.getElementById('state-message');
        
        if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
            const isYouPending = this.isCurrentUser(pendingDonor);
            
            this.dom.updateInfo('your-status', isYouPending ? '🎯 YOU' : '—');

            if (stateMessage) {
                if (isZero) {
                    stateMessage.textContent = '🚀 Be the first to start the chain!';
                } else if (isYouPending) {
                    stateMessage.textContent = '⏳ You\'re pending! Next donor pays you.';
                } else {
                    stateMessage.textContent = '💫 Donate now, receive pending instantly!';
                }
            }
        } else {
            this.dom.updateInfo('your-status', '—');
            if (stateMessage) {
                stateMessage.textContent = isZero ? '🚀 Chain not started' : '👀 Connect wallet to participate';
            }
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('Donation', async (donor, amount, received, isFirst) => {
            if (this.addressFlow) {
                this.addressFlow.addAddress(donor, this.dom.formatWei(amount), 'donated');
            }
            
            await this.refreshState();
            
            if (!this.web3Provider?.currentAddress) return;
            
            if (this.isCurrentUser(donor)) {
                if (isFirst) {
                    this.toast('You started the chain. Waiting for next donor.', 'success');
                } else {
                    this.toast(`You received ${this.dom.formatWei(received)} and are now pending`, 'success');
                }
            }
        });
    }
    
    destroy() {
        if (this.addressFlow) {
            this.addressFlow.destroy();
        }
        super.destroy();
    }
}
