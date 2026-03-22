/**
 * Pay It Backward Game
 * Your donation goes to the previous donor - rewarding those who came before!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { AddressFlow } from '../../presentation/components/address-flow.js';
import { getTemplate } from './templates/pay-it-backward.tpl.js';

export class PayItBackward extends Game {
    static metadata = {
        id: 'pay-it-backward',
        title: 'Pay It Backward',
        emoji: '⏪',
        description: 'Reward the previous donor',
        color: '#8b5cf6',
        contract: {
            source: 'contracts/src/games/pay_it_backward.vy',
            abi: 'contracts/build/abis/pay-it-backward.json',
            addresses: {
                sepolia: '0x478A53b021639CFbAbe45d222B240ffE409FEE3f',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const [lastDonor, nextRecipient] = await Promise.all([
            contract.last_donor(),
            contract.get_next_recipient()
        ]);
        return { lastDonor, nextRecipient };
    }

    constructor() {
        super();
        this.donationInput = null;
        this.addressFlow = null;
        this.gameState = {
            lastDonor: '0x0000000000000000000000000000000000000000',
            owner: '0x0000000000000000000000000000000000000000'
        };
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
            hint: 'Donate any amount to pay previous donor',
            minWei: '1'
        });
        this.donationInput.setValue(defaultWei);
        
        this.addressFlow = new AddressFlow('address-flow-container', { mode: 'backward' });
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
            buttonDefaultText: '⏪ Donate & Pay Previous',
            validationMessage: 'Please enter a donation amount',
            walletAction: 'donate'
        });
    }

    async fetchAndRenderState() {
        const [lastDonor, nextRecipient, owner] = await Promise.all([
            this.contract.last_donor(),
            this.contract.get_next_recipient(),
            this.contract.owner()
        ]);

        this.gameState.lastDonor = lastDonor;
        this.gameState.nextRecipient = nextRecipient;
        this.gameState.owner = owner;

        const isZero = lastDonor === '0x0000000000000000000000000000000000000000';

        const lastDonorEl = document.getElementById('last-donor');
        if (lastDonorEl) {
            if (isZero) {
                lastDonorEl.textContent = 'None';
            } else {
                const donorDisplay = await this.components.AddressBadge.createWithAddress(lastDonor, this.web3Provider, {
                    size: 24,
                    formatAddress: true,
                    addressStyle: 'font-size: 1rem;'
                });
                lastDonorEl.innerHTML = '';
                lastDonorEl.appendChild(donorDisplay);
            }
        }

        const nextRecipientEl = document.getElementById('next-recipient');
        if (nextRecipientEl) {
            const recipientDisplay = await this.components.AddressBadge.createWithAddress(nextRecipient, this.web3Provider, {
                size: 16,
                formatAddress: true,
                addressStyle: 'font-size: 0.75rem;'
            });
            nextRecipientEl.innerHTML = '';
            nextRecipientEl.appendChild(recipientDisplay);
        }
        
        if (this.addressFlow) {
            this.addressFlow.updateCurrent(lastDonor);
        }
        
        const stateMessage = document.getElementById('state-message');
        
        if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
            const isYouLastDonor = this.isCurrentUser(lastDonor);
            
            this.dom.updateInfo('your-status', isYouLastDonor ? '🎯 YOU' : '—');

            if (stateMessage) {
                if (isZero) {
                    stateMessage.textContent = '🚀 Be first! Donate to owner.';
                } else if (isYouLastDonor) {
                    stateMessage.textContent = '🎉 You\'re last! Next donor pays you.';
                } else {
                    stateMessage.textContent = `💫 Donate to pay ${this.dom.formatAddress(nextRecipient)}`;
                }
            }
        } else {
            this.dom.updateInfo('your-status', '—');
            if (stateMessage) {
                stateMessage.textContent = isZero ? '🚀 No donors yet' : '👀 Connect wallet to participate';
            }
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('Donation', async (donor, amount, recipient, isFirst) => {
            if (this.addressFlow) {
                this.addressFlow.addAddress(donor, this.dom.formatWei(amount), 'donated');
            }
            
            await this.refreshState();
            
            if (!this.web3Provider?.currentAddress) return;
            
            if (this.isCurrentUser(donor)) {
                this.toast(`You paid ${this.dom.formatWei(amount)} to ${this.dom.formatAddress(recipient)}`, 'success');
            } else if (this.isCurrentUser(recipient)) {
                this.toast(`You received ${this.dom.formatWei(amount)} from ${this.dom.formatAddress(donor)}`, 'success');
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
