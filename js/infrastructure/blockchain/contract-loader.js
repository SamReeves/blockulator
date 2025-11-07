/**
 * Contract Loading Utility
 * Infrastructure layer - centralizes ABI fetching and contract instantiation
 * 
 * Works in both read-only mode (no wallet) and connected mode (with wallet).
 * Returns read-only contract when wallet not connected, or contract with signer when connected.
 */

import { eventBus, EVENTS } from '../events/event-bus.js';
import { CONTRACT_ADDRESSES } from '../config/contracts.js';

export class ContractLoader {
    /**
     * Load a contract by name
     * @param {string} contractName - Name in kebab-case (e.g., 'pissing-contest')
     * @param {Object} web3Provider - Web3 provider (works with or without wallet connection)
     * @returns {Promise<Contract|null>} Ethers contract instance or null if failed
     */
    static async load(contractName, web3Provider) {
        // No longer requires wallet connection - works in read-only mode too!
        try {
            // Fetch ABI
            const response = await fetch(`/contracts/build/abis/${contractName}.json`);
            if (!response.ok) {
                throw new Error(`ABI file not found: ${contractName}.json`);
            }
            const abi = await response.json();
            
            // Get contract address
            const addressKey = this.toAddressKey(contractName);
            const address = CONTRACT_ADDRESSES[addressKey];
            
            if (!address) {
                throw new Error(`No address configured for ${contractName} (key: ${addressKey})`);
            }

            // Create contract instance (read-only or with signer)
            const contract = web3Provider.getContract(address, abi);
            
            const mode = web3Provider.isConnected() ? 'connected' : 'read-only';
            console.log(`✅ Contract loaded: ${contractName} at ${address} (${mode} mode)`);
            return contract;

        } catch (error) {
            console.error(`Failed to load contract ${contractName}:`, error);
            
            let message = 'Failed to load contract';
            if (error.message.includes('ABI file not found')) {
                message = `Contract ABI not found: ${contractName}`;
            } else if (error.message.includes('No address configured')) {
                message = `Contract address not configured: ${contractName}`;
            }
            
            eventBus.emit(EVENTS.TOAST, { message, type: 'error' });
            return null;
        }
    }

    /**
     * Convert kebab-case to SCREAMING_SNAKE_CASE for address lookup
     * @param {string} kebabCase - e.g., 'pissing-contest'
     * @returns {string} e.g., 'PISSING_CONTEST'
     */
    static toAddressKey(kebabCase) {
        return kebabCase.toUpperCase().replace(/-/g, '_');
    }
}

