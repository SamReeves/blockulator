/**
 * Simple contract loading utility
 * Infrastructure layer - fetches ABI and creates contract instance
 * 
 * IMPORTANT: This module has ZERO domain/game imports to avoid circular dependencies.
 * It only depends on infrastructure utilities.
 */

import { eventBus, EVENTS } from '../events/event-bus.js';

/**
 * Load a contract from ABI file and address
 * @param {string} abiPath - Path to ABI JSON file (e.g., 'contracts/build/abis/foo.json')
 * @param {string} address - Contract address
 * @param {Object} web3Provider - Web3 provider instance
 * @returns {Promise<Contract|null>} Ethers contract instance or null on failure
 */
export async function loadContract(abiPath, address, web3Provider) {
    try {
        if (!address || address === '0x0000000000000000000000000000000000000000') {
            throw new Error('No valid contract address');
        }

        const response = await fetch(`/${abiPath}?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`ABI file not found: ${abiPath}`);
        }
        const abi = await response.json();

        const contract = web3Provider.getContract(address, abi);
        return contract;

    } catch (error) {
        console.error('Failed to load contract:', error);
        eventBus.emit(EVENTS.TOAST, {
            message: `Failed to load contract: ${error.message}`,
            type: 'error'
        });
        return null;
    }
}
