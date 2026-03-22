/**
 * King of the Hill - Winner Takes All Edition
 * Pay to dethrone and claim the prize. No refunds. Stakes grow exponentially.
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { KingLadder } from '../../presentation/components/king-ladder.js';
import { getTemplate } from './templates/king-of-the-hill.tpl.js';

export class KingOfTheHill extends Game {
    static metadata = {
        id: 'king-of-the-hill',
        title: 'King of the Hill',
        emoji: '👑',
        description: 'Dethrone king, stakes grow',
        color: '#8b5cf6',
        contract: {
            source: 'contracts/src/games/king_of_the_hill.vy',
            abi: 'contracts/build/abis/king-of-the-hill.json',
            addresses: {
                sepolia: '0x0DEEBef3228B5d0cD4158Dc367A5C4b31B6414A6',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const [currentKing, currentPrize, totalDethronements] = await Promise.all([
            contract.current_king(),
            contract.current_prize(),
            contract.total_dethronements()
        ]);
        return { currentKing, currentPrize, totalDethronements };
    }

    constructor() {
        super();
        this.paymentInput = null;
        this.kingLadder = null;
        this.updateInterval = null;
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: '#764ba2'
        });
    }

    initComponents() {
        this.paymentInput = this.createValueInput('throne-payment-input', {
            label: 'Your Payment',
            hint: 'Pay more to dethrone',
            minWei: '0'
        });
        
        this.kingLadder = new KingLadder('king-ladder-container', {
            maxVisible: 8,
            currentAddress: this.web3Provider?.currentAddress
        });
        this.kingLadder.init();
        
        this.updateInterval = setInterval(() => {
            if (this.kingLadder) {
                this.refreshState();
            }
        }, 5000);
    }

    getListeners() {
        return {
            'claim-btn': () => this.claimThrone()
        };
    }

    async claimThrone() {
        const minPayment = await this.contract.get_minimum_payment();
        
        await this.executeTransaction({
            inputComponent: this.paymentInput,
            contractCall: (wei) => this.contract.claim_throne({ value: wei }),
            buttonId: 'claim-btn',
            buttonLoadingText: '⏳ Claiming...',
            buttonDefaultText: '⚔️ Dethrone King',
            validationMessage: 'Please enter a payment amount',
            walletAction: 'claim the throne',
            extraValidation: async (weiAmount) => {
                if (weiAmount.lt(minPayment)) {
                    this.toast(`Payment too low. Minimum: ${ethers.utils.formatUnits(minPayment, 'gwei')} GWEI`, 'error');
                    return false;
                }
                return true;
            },
            onSuccess: async () => {
                this.toast('You are now king', 'success');
            }
        });
    }

    async fetchAndRenderState() {
        const [
            currentKing,
            currentPrize,
            totalDethronements,
            minPayment,
            reignDuration
        ] = await Promise.all([
            this.contract.current_king(),
            this.contract.current_prize(),
            this.contract.total_dethronements(),
            this.contract.get_minimum_payment(),
            this.contract.get_current_reign_duration()
        ]);
        
        let userStats = null;
        if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
            userStats = await this.contract.get_king_stats(this.web3Provider.currentAddress);
        }
        
        const isYouKing = this.isCurrentUser(currentKing);
        
        if (this.paymentInput && minPayment) {
            this.paymentInput.setMinimum(minPayment.toString());
            this.paymentInput.setValue(minPayment.toString());
        }
        
        if (this.kingLadder) {
            this.kingLadder.updateCurrentKing({
                address: currentKing,
                prize: this.dom.formatWei(currentPrize),
                reignDuration: reignDuration.toNumber(),
                isYou: isYouKing
            });
            this.kingLadder.updateCurrentAddress(this.web3Provider?.currentAddress);
        }
        
        this.dom.updateInfo('min-payment', this.dom.formatWei(minPayment));
        
        const badge = document.getElementById('total-dethrone-badge');
        if (badge) badge.textContent = totalDethronements.toString();
        
        if (userStats) {
            this.dom.updateInfo('your-crowns', userStats[0].toString());
            this.dom.updateInfo('your-reign', this.dom.formatDuration(userStats[1].toNumber()));
        } else {
            this.dom.updateInfo('your-crowns', '—');
            this.dom.updateInfo('your-reign', '—');
        }
        
        await this.loadHistory();
    }

    async loadHistory() {
        if (!this.kingLadder) return;
        
        try {
            const recentKings = await this.contract.get_recent_kings(10);
            const kings = [...recentKings].reverse().slice(1);
            this.kingLadder.setKings(kings);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('NewKing', (newKing, previousKing, payment, prizeWon, newPrize, dethroneNum, timestamp) => {
            if (this.isCurrentUser(newKing)) {
                this.celebrate(`You won ${this.dom.formatWei(prizeWon)} as king!`);
            } else if (this.isCurrentUser(previousKing)) {
                this.toast('You were dethroned', 'warning');
            } else {
                this.toast(`New king: ${this.dom.formatAddress(newKing)}`, 'info');
            }
            
            this.refreshState();
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        super.destroy();
    }
}
