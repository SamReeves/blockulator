/**
 * Contract Loading Utility
 * Centralizes ABI fetching and contract instantiation
 * 
 * Usage:
 *   import { ContractLoader } from '../core/contract-loader.js';
 *   this.contract = await ContractLoader.load('pissing-contest', web3Provider);
 *   if (!this.contract) return;
 */

import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class ContractLoader {
    /**
     * Load a contract by name
     * @param {string} contractName - Name in kebab-case (e.g., 'pissing-contest')
     * @param {Object} web3Provider - Connected Web3 provider
     * @returns {Promise<Contract|null>} Ethers contract instance or null if failed
     */
    static async load(contractName, web3Provider) {
        // Validate wallet connection
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            console.error(`Cannot load ${contractName}: Wallet not connected`);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return null;
        }

        try {
            // Fetch ABI
            const response = await fetch(`/contracts/abis/${contractName}.json`);
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

            // Create contract instance
            const contract = web3Provider.getContract(address, abi);
            
            console.log(`✅ Contract loaded: ${contractName} at ${address}`);
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

