/**
 * Game Status Service
 * Fetches lightweight status information for games without loading full game modules
 * Separation of concerns: status vs full game state
 */

import { web3Provider } from '../infrastructure/blockchain/web3-provider.js';
import { CONTRACT_ADDRESSES } from '../infrastructure/config/contracts.js';
import { AddressBadge } from '../presentation/components/address-badge.js';
import { DOMHelpers } from '../presentation/dom/dom-helpers.js';

export class GameStatusService {
    constructor() {
        this.statusCache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    /**
     * Get status for all games
     * @returns {Promise<Map<string, object>>} Map of game name to status object
     */
    async getAllGameStatuses() {
        const games = [
            { name: 'pissing-contest', title: 'Pissing Contest', emoji: '💦', description: 'Biggest donation takes the pot' },
            { name: 'pay-it-forward', title: 'Pay It Forward', emoji: '⏩', description: 'Get previous player\'s donation' },
            { name: 'pay-it-backward', title: 'Pay It Backward', emoji: '⏪', description: 'Reward the previous donor' },
            { name: 'message-board', title: 'Message Board', emoji: '💬', description: 'Permanent on-chain messages' },
            { name: 'king-of-the-hill', title: 'King of the Hill', emoji: '👑', description: 'Dethrone king, stakes grow' },
            { name: 'last-call', title: 'Last Call', emoji: '⏰', description: 'Last donor wins after timer' },
            { name: 'time-to-make-the-donuts', title: 'Make the Donuts', emoji: '🍩', description: 'First donor daily at midnight' },
            { name: 'dice-gods', title: 'Dice Gods', emoji: '🎲', description: 'Pick the least popular number' },
            { name: 'satan-moloch-baal', title: 'Satan, Moloch, Baal', emoji: '🔥', description: 'Sacrifice ETH to your chosen demon' }
        ];

        const statuses = new Map();

        await Promise.all(games.map(async (game) => {
            try {
                const status = await this.getGameStatus(game.name);
                statuses.set(game.name, {
                    ...game,
                    ...status,
                    error: null
                });
            } catch (error) {
                console.error(`Failed to fetch status for ${game.name}:`, error);
                statuses.set(game.name, {
                    ...game,
                    status: 'Loading...',
                    details: 'Status unavailable',
                    error: null // Don't show errors prominently
                });
            }
        }));

        return statuses;
    }

    /**
     * Get status for a specific game
     * @param {string} gameName - Name of the game
     * @returns {Promise<object>} Status object
     */
    async getGameStatus(gameName) {
        // Check cache
        const cached = this.statusCache.get(gameName);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        // Fetch fresh data
        const status = await this.fetchGameStatus(gameName);
        
        // Update cache
        this.statusCache.set(gameName, {
            data: status,
            timestamp: Date.now()
        });

        return status;
    }

    /**
     * Fetch status from blockchain
     * @private
     */
    async fetchGameStatus(gameName) {
        const contractKey = gameName.toUpperCase().replace(/-/g, '_');
        const address = CONTRACT_ADDRESSES[contractKey];

        if (!address) {
            throw new Error(`Contract address not found for ${gameName}`);
        }

        try {
            // Dynamically import ABI path
            const abiModule = await import('../infrastructure/config/contracts.js');
            const abiPath = abiModule.CONTRACT_ABIS[contractKey];
            
            if (!abiPath) {
                throw new Error(`ABI path not found for ${gameName}`);
            }

            // Fetch the actual ABI JSON file
            const abiResponse = await fetch(`/${abiPath}`);
            if (!abiResponse.ok) {
                throw new Error(`Failed to fetch ABI: ${abiResponse.status}`);
            }
            const abi = await abiResponse.json();

            // Use web3Provider.getContract() - returns ethers.js contract
            const contract = web3Provider.getContract(address, abi);

            // Fetch game-specific status
            switch (gameName) {
                case 'pissing-contest':
                    return await this.getPissingContestStatus(contract);
                case 'pay-it-forward':
                    return await this.getPayItForwardStatus(contract);
                case 'pay-it-backward':
                    return await this.getPayItBackwardStatus(contract);
                case 'message-board':
                    return await this.getMessageBoardStatus(contract);
                case 'king-of-the-hill':
                    return await this.getKingOfTheHillStatus(contract);
                case 'last-call':
                    return await this.getLastCallStatus(contract);
                case 'time-to-make-the-donuts':
                    return await this.getDonutsStatus(contract);
                case 'dice-gods':
                    return await this.getDiceGodsStatus(contract);
                case 'satan-moloch-baal':
                    return await this.getSatanMolochBaalStatus(contract);
                default:
                    return { status: 'Unknown game', details: '' };
            }
        } catch (error) {
            console.error(`Error fetching ${gameName} status:`, error);
            throw error;
        }
    }

    // Game-specific status fetchers (using snake_case method names from Solidity contracts)
    async getPissingContestStatus(contract) {
        // Use get_current_round_info() which returns all data at once
        const roundInfo = await contract.get_current_round_info();
        
        // roundInfo: [isActive, donationCount, maxDonations, uniqueDonors, largestDonor, totalValue, isPaused]
        const donationCount = roundInfo[1];
        const uniqueDonors = roundInfo[3];
        const largestDonor = roundInfo[4];
        const totalValue = roundInfo[5];

        const hasLeader = largestDonor !== '0x0000000000000000000000000000000000000000';
        
        // Create address badge for leader
        const leaderBadge = hasLeader ? await AddressBadge.createWithAddress(largestDonor, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
        }) : null;
        
        const playerLabel = Number(uniqueDonors) === 1 ? 'player' : 'players';
        
        return {
            status: hasLeader ? leaderBadge : 'No donations yet',
            details: `Pool: ${DOMHelpers.formatWei(totalValue.toString())} • ${donationCount.toString()} donations • ${uniqueDonors.toString()} ${playerLabel}`
        };
    }

    async getPayItForwardStatus(contract) {
        const [pendingDonor, pendingAmount] = await Promise.all([
            contract.pending_donor(),
            contract.pending_amount()
        ]);

        const hasPending = pendingDonor !== '0x0000000000000000000000000000000000000000';
        
        const pendingBadge = hasPending ? await AddressBadge.createWithAddress(pendingDonor, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
        }) : null;
        
        return {
            status: hasPending ? pendingBadge : 'Awaiting first donor',
            details: hasPending ? `Reward: ${DOMHelpers.formatWei(pendingAmount.toString())}` : 'Start the chain!'
        };
    }

    async getPayItBackwardStatus(contract) {
        const [lastDonor, nextRecipient] = await Promise.all([
            contract.last_donor(),
            contract.get_next_recipient()
        ]);

        const hasStarted = lastDonor !== '0x0000000000000000000000000000000000000000';
        
        const nextBadge = hasStarted ? await AddressBadge.createWithAddress(nextRecipient, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
        }) : null;
        
        const lastBadge = hasStarted ? await AddressBadge.createWithAddress(lastDonor, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 400;'
        }) : null;
        
        // Create wrapper elements for status and details
        const statusElem = hasStarted ? (() => {
            const span = document.createElement('span');
            span.textContent = 'Next: ';
            span.appendChild(nextBadge);
            return span;
        })() : null;
        
        const detailsElem = hasStarted ? (() => {
            const span = document.createElement('span');
            span.textContent = 'Previous: ';
            span.appendChild(lastBadge);
            return span;
        })() : null;
        
        return {
            status: statusElem || 'Awaiting first donor',
            details: detailsElem || 'Start the chain!'
        };
    }

    async getMessageBoardStatus(contract) {
        const messageCount = await contract.get_message_count();
        
        return {
            status: `${messageCount.toString()} messages`,
            details: Number(messageCount) > 0 ? 'Board active' : 'No messages yet'
        };
    }

    async getKingOfTheHillStatus(contract) {
        const [currentKing, currentPrize, totalDethronements] = await Promise.all([
            contract.current_king(),
            contract.current_prize(),
            contract.total_dethronements()
        ]);

        const hasKing = currentKing !== '0x0000000000000000000000000000000000000000';
        
        const kingBadge = hasKing ? await AddressBadge.createWithAddress(currentKing, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
        }) : null;
        
        return {
            status: hasKing ? kingBadge : 'No king yet',
            details: `${totalDethronements.toString()} dethronements • Prize: ${DOMHelpers.formatWei(currentPrize.toString())}`
        };
    }

    async getLastCallStatus(contract) {
        const [roundNumber, potValue, lastDonor, canEnd] = await Promise.all([
            contract.round_number(),
            contract.pot_value(),
            contract.last_donor(),
            contract.can_end_round()
        ]);

        const hasLeader = lastDonor !== '0x0000000000000000000000000000000000000000';
        
        const leaderBadge = hasLeader ? await AddressBadge.createWithAddress(lastDonor, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
        }) : null;
        
        if (canEnd) {
            return {
                status: hasLeader ? leaderBadge : 'Round can end',
                details: `Round ${roundNumber.toString()} • Pot: ${DOMHelpers.formatWei(potValue.toString())}`
            };
        }
        
        return {
            status: hasLeader ? leaderBadge : 'No leader yet',
            details: `Round ${roundNumber.toString()} • Pot: ${DOMHelpers.formatWei(potValue.toString())}`
        };
    }

    async getDonutsStatus(contract) {
        const [currentDay, potValue, firstDonor, totalDays] = await Promise.all([
            contract.current_day(),
            contract.pot_value(),
            contract.first_donor_today(),
            contract.total_days()
        ]);

        const hasWinner = firstDonor !== '0x0000000000000000000000000000000000000000';
        
        const winnerBadge = hasWinner ? await AddressBadge.createWithAddress(firstDonor, web3Provider, {
            size: 16,
            formatAddress: true,
            addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
        }) : null;
        
        return {
            status: hasWinner ? winnerBadge : 'No winner yet',
            details: `Day ${currentDay.toString()} • Pot: ${DOMHelpers.formatWei(potValue.toString())}`
        };
    }

    async getDiceGodsStatus(contract) {
        // get_current_round_info returns: [roundNumber, playCount, totalPot, isActive]
        // NOTE: The order is roundNumber, playCount, totalPot (not potValue, playCount!)
        const roundInfo = await contract.get_current_round_info();
        const roundNumber = roundInfo[0];
        const playCount = roundInfo[1]; // This is the actual play count
        const totalPot = roundInfo[2];  // This is the pot value in wei
        const isActive = roundInfo[3];
        
        const playLabel = Number(playCount) === 1 ? 'play' : 'plays';
        
        return {
            status: isActive ? 'Round active' : 'New round starting',
            details: `Round ${roundNumber.toString()} • Pot: ${DOMHelpers.formatWei(totalPot.toString())} • ${playCount.toString()} ${playLabel}`
        };
    }

    async getSatanMolochBaalStatus(contract) {
        // get_current_standings returns: [satanTotal, molochTotal, baalTotal, voidBurned?]
        const standings = await contract.get_current_standings();
        const satanTotal = standings[0];
        const molochTotal = standings[1];
        const baalTotal = standings[2];
        const voidBurned = standings[3] || 0; // May not exist in older versions

        // Use BigInt for large number addition
        const totalBurned = BigInt(satanTotal.toString()) + BigInt(molochTotal.toString()) + BigInt(baalTotal.toString()) + BigInt(voidBurned.toString());
        
        return {
            status: `Total burned: ${DOMHelpers.formatWei(totalBurned.toString())}`,
            details: `Satan: ${DOMHelpers.formatWei(satanTotal.toString())} • Moloch: ${DOMHelpers.formatWei(molochTotal.toString())} • Baal: ${DOMHelpers.formatWei(baalTotal.toString())}`
        };
    }


    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    }

    /**
     * Clear cache for a specific game or all games
     */
    clearCache(gameName = null) {
        if (gameName) {
            this.statusCache.delete(gameName);
        } else {
            this.statusCache.clear();
        }
    }
}

// Export singleton instance
export const gameStatusService = new GameStatusService();

