/**
 * Contract Addresses
 * Update these with your deployed contract addresses
 */

export const CONTRACT_ADDRESSES = {
    // Games
    PISSING_CONTEST: '0x483470B5B779360b70d4CD7e5253d4d6380aA07d',
    MESSAGE_BOARD: '0x7E688Bf0044656E80859eEe2963D03A97be78760',
    PAY_IT_FORWARD: '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8',
    PAY_IT_BACKWARD: '0xd9145CCE52D386f254917e481eB44e9943F39138',
    
    // Tools (Mathematical Constant Calculators)
    E_CALCULATOR: '0x84defAdbc0Bdc9dEE9fCf68b47700f7D0016A14f',  // e^x calculator
    PI_CALCULATOR: '0x1E74Dd04108750FA00C94FbD9eda7BC182BE931e',  // π^x calculator
    TAU_CALCULATOR: '0xd1576B5640CB1E702BA6394d9fB050c5B0Dee48a'  // τ^x calculator
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

