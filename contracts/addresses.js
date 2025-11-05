/**
 * Contract Addresses
 * Update these with your deployed contract addresses
 */

export const CONTRACT_ADDRESSES = {
    // Games
    PISSING_CONTEST: '0x483470B5B779360b70d4CD7e5253d4d6380aA07d',
    MESSAGE_BOARD: '0x0000000000000000000000000000000000000000',
    PAY_IT_FORWARD: '0x0000000000000000000000000000000000000000',
    PAY_IT_BACKWARD: '0x0000000000000000000000000000000000000000',
    
    // Tools (Mathematical Constant Calculators)
    E_CALCULATOR: '0x0000000000000000000000000000000000000000',  // e^x calculator
    PI_CALCULATOR: '0x0000000000000000000000000000000000000000',  // π^x calculator
    TAU_CALCULATOR: '0x0000000000000000000000000000000000000000'  // τ^x calculator
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

