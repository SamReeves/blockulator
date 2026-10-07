/**
 * Game Status Service
 * Fetches lightweight status information for games using game class static methods
 * Returns plain data - UI formatting happens in presentation layer
 */

import { web3Provider } from '../infrastructure/blockchain/web3-provider.js';
import { getCurrentNetwork } from '../infrastructure/config/network.js';
import { gameRegistry } from '../core/GameRegistry.js';

export class GameStatusService {
    constructor() {
        this.statusCache = new Map();
        this.cacheTimeout = 30000;
    }

    /**
     * Get status for all games
     * @returns {Promise<Map<string, object>>} Map of game id to status object
     */
    async getAllGameStatuses() {
        const statuses = new Map();

        await Promise.all(gameRegistry.getAll().map(async (GameClass) => {
            const { id } = GameClass.metadata;
            try {
                const status = await this.getGameStatus(id);
                statuses.set(id, {
                    ...GameClass.metadata,
                    ...status,
                    error: null
                });
            } catch (error) {
                console.error(`Failed to fetch status for ${id}:`, error);
                statuses.set(id, {
                    ...GameClass.metadata,
                    error: error.message
                });
            }
        }));

        return statuses;
    }

    /**
     * Get status for a specific game
     * @param {string} gameId - ID of the game
     * @returns {Promise<object>} Status object (plain data)
     */
    async getGameStatus(gameId) {
        const cached = this.statusCache.get(gameId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const status = await this.fetchGameStatus(gameId);
        
        this.statusCache.set(gameId, {
            data: status,
            timestamp: Date.now()
        });

        return status;
    }

    /**
     * Fetch status from blockchain using game's static getStatus method
     * @private
     */
    async fetchGameStatus(gameId) {
        const GameClass = gameRegistry.get(gameId);
        if (!GameClass) {
            throw new Error(`Unknown game: ${gameId}`);
        }

        const { contract: contractInfo } = GameClass.metadata;
        const network = getCurrentNetwork();
        const address = contractInfo.addresses[network];

        if (!address || address === '0x0000000000000000000000000000000000000000') {
            throw new Error(`No contract address for ${gameId} on ${network}`);
        }

        const abiResponse = await fetch(`/${contractInfo.abi}`);
        if (!abiResponse.ok) {
            throw new Error(`Failed to fetch ABI: ${abiResponse.status}`);
        }
        const abi = await abiResponse.json();

        const contract = web3Provider.getContract(address, abi);
        return await GameClass.getStatus(contract);
    }

    /**
     * Clear cache for a specific game or all games
     */
    clearCache(gameId = null) {
        if (gameId) {
            this.statusCache.delete(gameId);
        } else {
            this.statusCache.clear();
        }
    }
}

export const gameStatusService = new GameStatusService();
