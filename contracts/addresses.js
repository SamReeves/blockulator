/**
 * Contract Addresses
 * Update these with your deployed contract addresses
 */

export const CONTRACT_ADDRESSES = {
    // Games
    PISSING_CONTEST: '0x483470B5B779360b70d4CD7e5253d4d6380aA07d',
    MESSAGE_BOARD: '0xf90592207441eeef27845dE4B87a5259851EBa75',
    PAY_IT_FORWARD: '0xB9Bc4f8D9d41a8dcBCDD99D7081d5c9170786679',
    PAY_IT_BACKWARD: '0x137E7907709898571948BddE2e0eCbAC1C343d8C',
    KING_OF_THE_HILL: '0x159317d877BbF41dE895465B576e706Ebcb0e30e',
    LAST_CALL: '0xaCffb1F658E1fD7A50E49Ef55f8fbEA2F1df1528',
    
    // Tools (Mathematical Constant Calculators)
    E_CALCULATOR: '0x0df17535A8C9B68C426F4bf872E3F4EE1c57Aab8',
    PI_CALCULATOR: '0xeBFaB280b828153b0419bFc866BF8639b485C1da',
    TAU_CALCULATOR: '0x4D4FF41BbF40BF3edE475686Cfd84Ea356647511'
};

// Map contract addresses to their source files
export const CONTRACT_SOURCES = {
    PISSING_CONTEST: 'contracts/games/pissing_contest.vy',
    MESSAGE_BOARD: 'contracts/games/message_board.vy',
    PAY_IT_FORWARD: 'contracts/games/pay_it_forward.vy',
    PAY_IT_BACKWARD: 'contracts/games/pay_it_backward.vy',
    KING_OF_THE_HILL: 'contracts/games/king_of_the_hill.vy',
    LAST_CALL: 'contracts/games/last_call.vy',
    E_CALCULATOR: 'contracts/tools/e.vy',
    PI_CALCULATOR: 'contracts/tools/pi.vy',
    TAU_CALCULATOR: 'contracts/tools/tau.vy'
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

