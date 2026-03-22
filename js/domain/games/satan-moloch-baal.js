/**
 * Satan, Moloch, Baal - The Infernal Voting Game
 * Vote for your favorite demon by burning ETH in their name
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { LazySusan3D } from '../../presentation/components/lazy-susan-3d.js';
import { getTemplate } from './templates/satan-moloch-baal.tpl.js';

export class SatanMolochBaal extends Game {
    static metadata = {
        id: 'satan-moloch-baal',
        title: 'Satan, Moloch, Baal',
        emoji: '🔥',
        description: 'Sacrifice ETH to your chosen demon',
        color: '#ef4444',
        contract: {
            source: 'contracts/src/games/satan_moloch_baal.vy',
            abi: 'contracts/build/abis/satan-moloch-baal.json',
            addresses: {
                sepolia: '0x55Ec2808F3c2B55c02E065e1693c61a4A56967A2',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const standings = await contract.get_current_standings();
        return {
            satanTotal: standings[0],
            molochTotal: standings[1],
            baalTotal: standings[2],
            voidBurned: standings[3] || 0
        };
    }

    constructor() {
        super();
        this.voteInput = null;
        this.lazySusan = null;
        this.demons = [
            { emoji: '😈', name: 'SATAN', subtitle: 'The Adversary', color: '#ef4444', key: 'satan' },
            { emoji: '🐂', name: 'MOLOCH', subtitle: 'The Bull God', color: '#f59e0b', key: 'moloch' },
            { emoji: '⚡', name: 'BAAL', subtitle: 'Lord of Storms', color: '#8b5cf6', key: 'baal' }
        ];
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            demons: this.demons
        });
    }

    initComponents() {
        this.voteInput = this.createValueInput('vote-amount-input', {
            label: 'Amount to Burn',
            hint: 'All goes to the null address - eternal sacrifice!'
        });
        
        this.lazySusan = new LazySusan3D('lazy-susan-container', {
            items: this.demons,
            onSelect: (index, demon) => {
                this.vote(demon.key);
            }
        });
        this.lazySusan.init();
    }

    getListeners() {
        return {};
    }

    async vote(demonKey) {
        if (!this.requiresWallet('vote')) return;
        
        const weiAmount = this.voteInput.getWeiValue();
        if (!weiAmount || weiAmount.eq(0)) {
            this.toast('Please enter a valid amount to burn', 'warning');
            return;
        }
        
        const demon = this.demons.find(d => d.key === demonKey);
        if (!demon) return;
        
        try {
            await this.transactionHandler.execute(
                this.contract[`vote_${demonKey}`]({ value: weiAmount }),
                { game: 'satan-moloch-baal', demon: demonKey, wei: weiAmount.toString() }
            );
            
            this.toast(`Burned ${this.dom.formatWei(weiAmount)} for ${demon.name}`, 'success');
            
            this.voteInput.reset();
            this.lazySusan?.reset();
            await this.refreshState();
            
        } catch (error) {
            console.error('Vote failed:', error);
        }
    }

    async fetchAndRenderState() {
        const [standings, voteCounts, bestWorshippers] = await Promise.all([
            this.contract.get_current_standings(),
            this.contract.get_vote_counts(),
            this.contract.get_all_best_worshippers()
        ]);
        
        const total = standings.reduce((sum, val) => sum.add(val), standings[0].mul(0));
        this.dom.updateInfo('total-burned', this.dom.formatWei(total));

        await Promise.all(this.demons.map(async (demon, i) => {
            const voteCount = voteCounts[i];
            this.dom.updateInfo(`${demon.key}-total`, this.dom.formatWei(standings[i]));
            this.dom.updateInfo(`${demon.key}-votes`, `${voteCount} vote${voteCount.toNumber() === 1 ? '' : 's'}`);
            
            const topDevoteeAddr = bestWorshippers[i * 2];
            const topDevoteeEl = document.getElementById(`${demon.key}-top-devotee`);
            if (topDevoteeEl) {
                if (topDevoteeAddr === '0x0000000000000000000000000000000000000000') {
                    topDevoteeEl.textContent = 'None';
                } else {
                    const devoteeDisplay = await this.components.AddressBadge.createWithAddress(topDevoteeAddr, this.web3Provider, {
                        size: 16,
                        formatAddress: true,
                        addressStyle: 'font-size: 0.75rem;'
                    });
                    topDevoteeEl.innerHTML = '';
                    topDevoteeEl.appendChild(devoteeDisplay);
                }
            }
        }));

        if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
            const [userBurnedPerDemon, userStats] = await Promise.all([
                this.contract.get_user_burned_per_demon(this.web3Provider.currentAddress),
                this.contract.get_user_stats(this.web3Provider.currentAddress)
            ]);
            
            this.demons.forEach((demon, i) => {
                this.dom.updateInfo(`user-${demon.key}-burned`, this.dom.formatWei(userBurnedPerDemon[i]));
            });
            this.dom.updateInfo('user-total-burned', this.dom.formatWei(userStats[3]));
        } else {
            this.demons.forEach(demon => {
                this.dom.updateInfo(`user-${demon.key}-burned`, '👀');
            });
            this.dom.updateInfo('user-total-burned', 'Connect wallet');
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('VoteCast', async (voter, demonIndex) => {
            await this.refreshState();
            
            const demon = this.demons[demonIndex];
            const demonDisplay = `${demon.emoji} ${demon.name}`;
            
            if (this.isCurrentUser(voter)) {
                this.toast(`Your sacrifice to ${demonDisplay} is complete`, 'success');
            }
        });

        this.contract.on('NewBestWorshipper', async (demonIndex, worshipper) => {
            await this.refreshState();
            
            const demon = this.demons[demonIndex];
            const demonDisplay = `${demon.emoji} ${demon.name}`;
            
            if (this.isCurrentUser(worshipper)) {
                this.celebrate(`You are the top devotee of ${demonDisplay}!`);
            } else if (this.web3Provider.isConnected()) {
                this.toast(`${demonDisplay} has a new top devotee`, 'info');
            }
        });
    }
    
    destroy() {
        if (this.lazySusan) {
            this.lazySusan.destroy();
            this.lazySusan = null;
        }
        super.destroy();
    }
}
