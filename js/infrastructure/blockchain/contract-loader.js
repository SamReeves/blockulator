/**
 * Contract Loading Utility
 * Infrastructure layer - centralizes ABI fetching and contract instantiation
 * 
 * Works in both read-only mode (no wallet) and connected mode (with wallet).
 * Returns read-only contract when wallet not connected, or contract with signer when connected.
 */

import { eventBus, EVENTS } from '../events/event-bus.js';
import { getContractMetadata } from '../config/contract-registry.js';

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
            // Get contract metadata from registry
            const metadata = getContractMetadata(contractName);
            
            // Fetch ABI (with cache busting to ensure latest version)
            const cacheBust = Date.now();
            const response = await fetch(`/${metadata.abiFile}?v=${cacheBust}`);
            if (!response.ok) {
                throw new Error(`ABI file not found: ${contractName}.json`);
            }
            const abi = await response.json();
            
            // Get contract address
            const address = metadata.contractAddress;
            
            if (!address) {
                throw new Error(`No address configured for ${contractName}`);
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
}

