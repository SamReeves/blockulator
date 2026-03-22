/**
 * Pissing Contest - Simplified Version
 * Send the highest donation to win!
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { BarGraph3D } from '../../presentation/components/bar-graph-3d.js';
import { getTemplate } from './templates/pissing-contest.tpl.js';

export class PissingContest extends Game {
    static metadata = {
        id: 'pissing-contest',
        title: 'Pissing Contest',
        emoji: '💦',
        description: 'Biggest donation takes the pot',
        color: '#3b82f6',
        contract: {
            source: 'contracts/src/games/pissing_contest.vy',
            abi: 'contracts/build/abis/pissing-contest.json',
            addresses: {
                sepolia: '0x09CB63309F854788C76D9b6750598b2d86EADC8b',
                mainnet: '0x0000000000000000000000000000000000000000'
            }
        }
    };

    static async getStatus(contract) {
        const roundInfo = await contract.get_current_round_info();
        return {
            leader: roundInfo[4],
            pool: roundInfo[5],
            donations: roundInfo[1],
            players: roundInfo[3]
        };
    }

    constructor() {
        super();
        this.donationInput = null;
        this.barGraph = null;
    }

    getGameHTML() {
        return getTemplate({
            panelColor: this.metadata.color,
            btnColor: '#10b981'
        });
    }

    initComponents() {
        this.donationInput = this.createValueInput('donate-amount-input', {
            hint: 'Send the highest amount to lead!'
        });
        
        this.barGraph = new BarGraph3D('donations-3d-graph', {
            maxBars: 10,
            perspective: 1200,
            rotationX: -15,
            rotationY: 20
        });
        this.barGraph.init();
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
            buttonDefaultText: '💰 Donate',
            validationMessage: 'Please enter a valid donation amount',
            walletAction: 'donate'
        });
    }

    async fetchAndRenderState() {
        const roundInfo = await this.contract.get_current_round_info();
        
        const donationCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
        const maxDonations = typeof roundInfo[2] === 'number' ? roundInfo[2] : roundInfo[2].toNumber();
        const largestDonor = roundInfo[4];
        const totalValue = roundInfo[5];

        this.dom.updateInfo('prize-pool', this.dom.formatWei(totalValue));
        this.dom.updateInfo('donations-count', `${donationCount} / ${maxDonations}`);
        
        await this.updateLeaderDisplay(largestDonor);
        await this.updateUserStats();
        await this.updateGlobalStats();
        await this.loadWinnersHistory();
        await this.updateDonations3DGraph();
        await this.checkAdminAccess();
    }

    async updateLeaderDisplay(largestDonor) {
        const leaderEl = document.getElementById('current-leader');
        if (!leaderEl) return;
        
        const leaderAddress = String(largestDonor);
        if (leaderAddress === '0x0000000000000000000000000000000000000000') {
            leaderEl.textContent = 'No donations yet';
        } else {
            const leaderDisplay = await this.components.AddressBadge.createWithAddress(leaderAddress, this.web3Provider, {
                size: 32,
                formatAddress: true,
                addressStyle: 'font-size: 1.25rem; font-weight: bold;'
            });
            leaderEl.innerHTML = '';
            leaderEl.appendChild(leaderDisplay);
        }
    }

    async updateUserStats() {
        if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
            const userPosition = await this.contract.get_current_leaderboard_position(this.web3Provider.currentAddress);
            const userDonation = userPosition[0];
            const isWinning = userPosition[1];

            this.dom.updateInfo('your-donation', this.dom.formatWei(userDonation));
            this.dom.updateInfo('your-status', 
                userDonation.gt(0) 
                    ? (isWinning ? '🥇 Leading!' : '📊 Playing')
                    : 'Not playing'
            );
            
            const userStats = await this.contract.get_user_stats(this.web3Provider.currentAddress);
            this.dom.updateInfo('lifetime-donated', this.dom.formatWei(userStats[0]));
            this.dom.updateInfo('lifetime-won', this.dom.formatWei(userStats[1]));
            this.dom.updateInfo('rounds-won', userStats[2].toString());
            this.dom.updateInfo('rounds-participated', userStats[3].toString());
        } else {
            this.dom.updateInfo('your-donation', '👀 Read-only mode');
            this.dom.updateInfo('your-status', 'Connect to play');
            this.dom.updateInfo('lifetime-donated', 'Connect wallet');
            this.dom.updateInfo('lifetime-won', 'Connect wallet');
            this.dom.updateInfo('rounds-won', '-');
            this.dom.updateInfo('rounds-participated', '-');
        }
    }

    async updateGlobalStats() {
        const globalStats = await this.contract.get_global_stats();
        this.dom.updateInfo('total-rounds', globalStats[0].toString());
        this.dom.updateInfo('highest-donation', this.dom.formatWei(globalStats[1]));
        
        const championEl = document.getElementById('highest-donor');
        if (championEl) {
            const championAddress = String(globalStats[2]);
            if (championAddress === '0x0000000000000000000000000000000000000000') {
                championEl.textContent = 'No donations yet';
            } else {
                const championDisplay = await this.components.AddressBadge.createWithAddress(championAddress, this.web3Provider, {
                    size: 24,
                    formatAddress: true
                });
                championEl.innerHTML = '';
                championEl.appendChild(championDisplay);
            }
        }
        
        const contractBalance = await this.contract.get_contract_balance();
        this.dom.updateInfo('total-donated', this.dom.formatWei(contractBalance));
    }
    
    async loadWinnersHistory() {
        try {
            const winners = await this.contract.get_recent_winners(10);
            const historyContainer = document.getElementById('winners-history');
            
            if (!historyContainer) return;
            
            if (!winners || winners.length === 0) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        No completed rounds yet
                    </div>
                `;
                return;
            }
            
            const winnerDetails = await Promise.all(
                winners.slice().reverse().map(async (winner, index) => {
                    const roundNumber = winners.length - index;
                    try {
                        const roundResult = await this.contract.get_round_result(roundNumber);
                        return {
                            roundNumber,
                            winner: roundResult[0],
                            prize: roundResult[1],
                            totalDonations: roundResult[2],
                            donationCount: roundResult[3],
                            largestDonation: roundResult[4]
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );
            
            const filteredDetails = winnerDetails.filter(detail => detail !== null);
            
            if (filteredDetails.length === 0) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        No round details available
                    </div>
                `;
                return;
            }
            
            historyContainer.innerHTML = '';
            
            for (let index = 0; index < filteredDetails.length; index++) {
                const detail = filteredDetails[index];
                const isRecent = index === 0;
                
                const entry = document.createElement('div');
                entry.style.cssText = `padding: 0.75rem; background: ${isRecent ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.05)'}; border-radius: 6px; border-left: 3px solid ${isRecent ? '#f59e0b' : 'var(--md-sys-color-outline)'}; margin-bottom: 0.5rem; font-size: 0.875rem;`;
                
                const flexContainer = document.createElement('div');
                flexContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;';
                
                const leftDiv = document.createElement('div');
                const roundLabel = document.createElement('strong');
                roundLabel.style.cssText = 'font-size: 0.875rem; display: block; margin-bottom: 0.25rem;';
                roundLabel.textContent = `${isRecent ? '🏆 ' : ''}#${detail.roundNumber}`;
                leftDiv.appendChild(roundLabel);
                
                const winnerAddress = String(detail.winner);
                const addressDisplay = await this.components.AddressBadge.createWithAddress(winnerAddress, this.web3Provider, {
                    size: 16,
                    formatAddress: true,
                    addressStyle: 'font-size: 0.7rem; font-family: monospace; color: var(--md-sys-color-on-surface-variant);'
                });
                leftDiv.appendChild(addressDisplay);
                
                const rightDiv = document.createElement('div');
                rightDiv.style.cssText = 'text-align: right;';
                rightDiv.innerHTML = `
                    <div style="font-weight: bold; font-size: 0.875rem;">
                        ${this.dom.formatWei(detail.prize)}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant);">
                        ${detail.donationCount} donations
                    </div>
                `;
                
                flexContainer.appendChild(leftDiv);
                flexContainer.appendChild(rightDiv);
                entry.appendChild(flexContainer);
                historyContainer.appendChild(entry);
            }
                
        } catch (error) {
            console.error('Failed to load winners history:', error);
            const historyContainer = document.getElementById('winners-history');
            if (historyContainer) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        Failed to load history
                    </div>
                `;
            }
        }
    }
    
    async updateDonations3DGraph() {
        if (!this.barGraph || !this.contract) return;
        
        try {
            const roundInfo = await this.contract.get_current_round_info();
            const roundNumber = roundInfo[0];
            const donationCount = typeof roundInfo[1] === 'number' ? roundInfo[1] : roundInfo[1].toNumber();
            
            if (donationCount === 0) {
                this.barGraph.setData([]);
                return;
            }
            
            const filter = this.contract.filters.DonationReceived(roundNumber, null);
            const events = await this.contract.queryFilter(filter);
            
            if (events.length === 0) {
                this.barGraph.setData([]);
                return;
            }
            
            const donations = events.map((event) => ({
                address: String(event.args.donor),
                value: event.args.amount,
                donationNumber: event.args.donation_number,
                isCurrentUser: this.isCurrentUser(String(event.args.donor))
            }));
            
            donations.sort((a, b) => b.value.gt(a.value) ? 1 : -1);
            
            const topDonations = donations.slice(0, 10);
            
            const donationsWithBadges = await Promise.all(
                topDonations.map(async (d) => {
                    const badge = await this.components.AddressBadge.create(d.address, this.web3Provider, { size: 24 });
                    return { ...d, badge, label: null };
                })
            );
            
            this.barGraph.setData(donationsWithBadges);
            
        } catch (error) {
            console.error('Failed to update 3D graph:', error);
        }
    }
    
    async checkAdminAccess() {
        try {
            const config = await this.contract.get_config();
            const owner = config[0];
            const adminPanel = document.getElementById('admin-panel');
            
            const maxDonations = config[1];
            const minDonation = config[2];
            const paused = config[3];
            
            this.dom.updateInfo('min-donation', this.dom.formatWei(minDonation));
            if (this.donationInput && minDonation) {
                this.donationInput.setMinimum(minDonation.toString());
                this.donationInput.setValue(minDonation.toString());
            }
            
            if (!adminPanel) return;
            
            if (this.web3Provider?.currentAddress && this.isCurrentUser(owner)) {
                adminPanel.style.display = 'block';
                
                this.dom.updateInfo('contract-paused', paused ? 'Yes ⚠️' : 'No ✅');
                this.dom.updateInfo('config-min', this.dom.formatWei(minDonation));
                this.dom.updateInfo('config-max', maxDonations.toString());
                
                this.setupAdminListeners();
            } else {
                adminPanel.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to check admin access:', error);
        }
    }
    
    setupAdminListeners() {
        const togglePauseBtn = document.getElementById('toggle-pause-btn');
        const endRoundBtn = document.getElementById('end-round-early-btn');
        
        if (togglePauseBtn) {
            togglePauseBtn.replaceWith(togglePauseBtn.cloneNode(true));
            document.getElementById('toggle-pause-btn').addEventListener('click', () => this.togglePause());
        }
        
        if (endRoundBtn) {
            endRoundBtn.replaceWith(endRoundBtn.cloneNode(true));
            document.getElementById('end-round-early-btn').addEventListener('click', () => this.endRoundEarly());
        }
    }
    
    async togglePause() {
        if (!this.requiresWallet('toggle pause')) return;
        
        try {
            await this.transactionHandler.execute(
                this.contract.toggle_pause(),
                { game: 'pissing-contest', action: 'toggle_pause' }
            );
            
            this.toast('Pause status toggled', 'success');
            await this.refreshState();
        } catch (error) {
            console.error('Toggle pause failed:', error);
        }
    }
    
    async endRoundEarly() {
        if (!this.requiresWallet('end round early')) return;
        
        if (!confirm('Are you sure you want to end the current round early?')) {
            return;
        }
        
        try {
            await this.transactionHandler.execute(
                this.contract.end_round_early(),
                { game: 'pissing-contest', action: 'end_round_early' }
            );
            
            this.toast('Round ended early', 'success');
            await this.refreshState();
        } catch (error) {
            console.error('End round early failed:', error);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('DonationReceived', async (roundNumber, donor, amount, donationNumber, isLargest) => {
            await this.refreshState();
            
            if (this.isCurrentUser(donor) && isLargest) {
                this.toast('You are now leading', 'success');
            }
        });

        this.contract.on('RoundEnded', async (roundNumber, winner, prize) => {
            if (this.isCurrentUser(winner)) {
                this.celebrate(`You won ${this.dom.formatWei(prize)}!`);
            } else {
                this.toast(`Round ended. Winner: ${this.dom.formatAddress(winner)}`, 'info');
            }
            
            await this.refreshState();
        });

        this.contract.on('RoundStarted', async (roundNumber) => {
            this.toast(`Round ${roundNumber} started`, 'info');
            await this.refreshState();
        });
    }
}
