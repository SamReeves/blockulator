/**
 * Contract Addresses
 * Update these with your deployed contract addresses
 */

export const CONTRACT_ADDRESSES = {
    // Games
    PISSING_CONTEST: '0x0000000000000000000000000000000000000000',
    MEDIAN_WHALE: '0x0000000000000000000000000000000000000000',
    MEAN_WHALE: '0x0000000000000000000000000000000000000000',
    MODE_WHALE: '0x0000000000000000000000000000000000000000',
    
    // Tools
    EXP_ESTIMATOR: '0x0000000000000000000000000000000000000000',
    FACTORIAL: '0x0000000000000000000000000000000000000000'
};

// Network configuration
export const NETWORKS = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet'
};

// Get contract address for current network
export function getContractAddress(contractName, chainId) {
    // TODO: Add network-specific addresses if needed
    return CONTRACT_ADDRESSES[contractName];
}

