/**
 * Contract Loading Utility
 * Infrastructure layer - centralizes ABI fetching and contract instantiation
 * 
 * Works in both read-only mode (no wallet) and connected mode (with wallet).
 * Returns read-only contract when wallet not connected, or contract with signer when connected.
 * 
 * Can load contracts by:
 * - contractName (looks up in gameRegistry first, then CONTRACT_REGISTRY)
 * - metadata object (direct metadata with contract info)
 */

import { eventBus, EVENTS } from '../events/event-bus.js';
import { getContractMetadata, hasContract } from '../config/contract-registry.js';
import { getCurrentNetwork } from '../config/network.js';
import { gameRegistry } from '../../core/GameRegistry.js';

export class ContractLoader {
    /**
     * Load a contract by name or metadata
     * @param {string|Object} contractNameOrMetadata - Contract name or metadata object
     * @param {Object} web3Provider - Web3 provider (works with or without wallet connection)
     * @returns {Promise<Contract|null>} Ethers contract instance or null if failed
     */
    static async load(contractNameOrMetadata, web3Provider) {
        try {
            let metadata;
            let contractName;

            if (typeof contractNameOrMetadata === 'string') {
                contractName = contractNameOrMetadata;
                
                // Try gameRegistry first for game contracts
                const GameClass = gameRegistry.get(contractName);
                if (GameClass?.metadata?.contract) {
                    const gameMeta = GameClass.metadata;
                    const network = getCurrentNetwork();
                    metadata = {
                        abiFile: gameMeta.contract.abi,
                        contractAddress: gameMeta.contract.addresses[network],
                        name: gameMeta.title
                    };
                } else if (hasContract(contractName)) {
                    // Fall back to CONTRACT_REGISTRY for non-game contracts
                    metadata = getContractMetadata(contractName);
                } else {
                    throw new Error(`Unknown contract: ${contractName}`);
                }
            } else {
                // Direct metadata object passed
                metadata = contractNameOrMetadata;
                contractName = metadata.id || metadata.name || 'unknown';
            }
            
            // Fetch ABI (with cache busting to ensure latest version)
            const cacheBust = Date.now();
            const response = await fetch(`/${metadata.abiFile}?v=${cacheBust}`);
            if (!response.ok) {
                throw new Error(`ABI file not found: ${metadata.abiFile}`);
            }
            const abi = await response.json();
            
            // Get contract address
            const address = metadata.contractAddress;
            
            if (!address || address === '0x0000000000000000000000000000000000000000') {
                throw new Error(`No address configured for ${contractName}`);
            }

            // Create contract instance (read-only or with signer)
            const contract = web3Provider.getContract(address, abi);
            
            const mode = web3Provider.isConnected() ? 'connected' : 'read-only';
            console.log(`✅ Contract loaded: ${contractName} at ${address} (${mode} mode)`);
            return contract;

        } catch (error) {
            console.error(`Failed to load contract:`, error);
            
            let message = 'Failed to load contract';
            if (error.message.includes('ABI file not found')) {
                message = `Contract ABI not found`;
            } else if (error.message.includes('No address configured')) {
                message = `Contract address not configured`;
            } else if (error.message.includes('Unknown contract')) {
                message = error.message;
            }
            
            eventBus.emit(EVENTS.TOAST, { message, type: 'error' });
            return null;
        }
    }
}
