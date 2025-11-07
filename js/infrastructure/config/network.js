/**
 * Network Configuration
 * Infrastructure layer - centralizes network-specific settings
 * 
 * To switch between testnet and mainnet, change the NETWORK constant.
 * - master branch: Use 'sepolia' for testnet
 * - mainnet branch: Use 'mainnet' for production
 */

const NETWORKS = {
    sepolia: {
        chainId: 11155111,
        chainIdHex: '0xaa36a7',
        // Using PublicNode RPC - free, reliable, no API key required
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        name: 'Sepolia Testnet',
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
        blockExplorer: 'https://etherscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    }
};

// 🚨 CHANGE THIS TO SWITCH NETWORKS
// Use 'sepolia' for testnet, 'mainnet' for production
export const NETWORK = 'sepolia';

// Export the active network configuration
export const config = NETWORKS[NETWORK];

// Helper function to get block explorer URL for an address
export function getExplorerUrl(address) {
    return `${config.blockExplorer}/address/${address}`;
}

// Helper function to get block explorer URL for a transaction
export function getTransactionUrl(txHash) {
    return `${config.blockExplorer}/tx/${txHash}`;
}

