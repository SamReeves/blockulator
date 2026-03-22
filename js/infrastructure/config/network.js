/**
 * Network Configuration
 * Infrastructure layer - centralizes network-specific settings
 * 
 * Network is now dynamic and user-switchable at runtime.
 * Default: Sepolia testnet (safe for exploration)
 * User can switch via the network badge in the header
 */

import { eventBus, EVENTS } from '../events/event-bus.js';

const NETWORKS = {
    sepolia: {
        chainId: 11155111,
        chainIdHex: '0xaa36a7',
        // Using PublicNode RPC - free, reliable, no API key required
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        name: 'Sepolia Testnet',
        displayName: 'TESTNET',
        blockExplorer: 'https://sepolia.etherscan.io',
        nativeCurrency: {
            name: 'Sepolia ETH',
            symbol: 'ETH',
            decimals: 18
        }
    },
    mainnet: {
        chainId: 1,
        chainIdHex: '0x1',
        rpcUrl: 'https://eth.llamarpc.com', // Free, reliable public RPC
        name: 'Ethereum Mainnet',
        displayName: 'MAINNET',
        blockExplorer: 'https://etherscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    }
};

// Current network - defaults to testnet, persisted in localStorage
let CURRENT_NETWORK = localStorage.getItem('preferred_network') || 'sepolia';

// Validate stored network
if (!NETWORKS[CURRENT_NETWORK]) {
    console.warn(`Invalid stored network: ${CURRENT_NETWORK}, defaulting to sepolia`);
    CURRENT_NETWORK = 'sepolia';
}

/**
 * Get the current network identifier
 */
export function getCurrentNetwork() {
    return CURRENT_NETWORK;
}

/**
 * Get the current network configuration
 */
export function getConfig() {
    return NETWORKS[CURRENT_NETWORK];
}

/**
 * Get all available networks
 */
export function getNetworks() {
    return NETWORKS;
}

/**
 * Switch to a different network
 * This will emit an event that all components should listen to
 */
export function switchNetwork(network) {
    if (!NETWORKS[network]) {
        console.error(`Invalid network: ${network}`);
        return false;
    }
    
    if (network === CURRENT_NETWORK) {
        console.log(`Already on ${network}`);
        return false;
    }
    
    console.log(`🔄 Switching network from ${CURRENT_NETWORK} to ${network}...`);
    
    CURRENT_NETWORK = network;
    localStorage.setItem('preferred_network', network);
    
    // Emit event - all components should listen and reinitialize
    eventBus.emit(EVENTS.NETWORK_CHANGED, {
        network: CURRENT_NETWORK,
        config: NETWORKS[CURRENT_NETWORK]
    });
    
    console.log(`✅ Switched to ${NETWORKS[network].name}`);
    return true;
}

// Helper function to get block explorer URL for an address
export function getExplorerUrl(address) {
    const currentConfig = getConfig();
    return `${currentConfig.blockExplorer}/address/${address}`;
}

// Helper function to get block explorer URL for a transaction
export function getTransactionUrl(txHash) {
    const currentConfig = getConfig();
    return `${currentConfig.blockExplorer}/tx/${txHash}`;
}

// Log initial network on load
console.log(`🌐 Network initialized: ${NETWORKS[CURRENT_NETWORK].name}`);

