/**
 * Contract Addresses
 * Network-specific contract addresses for testnet and mainnet
 */

import { NETWORK } from '../js/config.js';

// Sepolia Testnet Addresses
const SEPOLIA_ADDRESSES = {
    // Games
    PISSING_CONTEST: '0x483470B5B779360b70d4CD7e5253d4d6380aA07d',
    MESSAGE_BOARD: '0xf90592207441eeef27845dE4B87a5259851EBa75',
    PAY_IT_FORWARD: '0xB9Bc4f8D9d41a8dcBCDD99D7081d5c9170786679',
    PAY_IT_BACKWARD: '0x137E7907709898571948BddE2e0eCbAC1C343d8C',
    KING_OF_THE_HILL: '0x159317d877BbF41dE895465B576e706Ebcb0e30e',
    LAST_CALL: '0xaCffb1F658E1fD7A50E49Ef55f8fbEA2F1df1528',
    TIME_TO_MAKE_THE_DONUTS: '0x98C52B972bDa78a009dE20837d406D96Eb14A3C0',
    DICE_GODS: '0xfE76b636ea9dD2881c72Ba1e6A66998B60B2b07d',
    
    // Tools (Mathematical Constant Calculators)
    E_CALCULATOR: '0x0df17535A8C9B68C426F4bf872E3F4EE1c57Aab8',
    PI_CALCULATOR: '0xeBFaB280b828153b0419bFc866BF8639b485C1da',
    TAU_CALCULATOR: '0x4D4FF41BbF40BF3edE475686Cfd84Ea356647511',
    SIN_CALCULATOR: '0x2b974E0C5AD3c1377Ff9d13C341e796B07627f8b',
    COS_CALCULATOR: '0x85DABC736AA6DE75940cA7C33fc970cB703AcE04',
    TANH_CALCULATOR: '0x4bB456891e1e703Bc3bd23F69B6D6d91323622E1',
    POW10_CALCULATOR: '0x86C5081545f7c8Ab322e8308b5D772e3311DD499',
    POW2_CALCULATOR: '0x038c3931BB2eA55e564292D64bfC4d595F162059',
    LN_CALCULATOR: '0xca9D2574655b0c414AD11b6F5A5969b5109c5EE4', 
    LOG2_CALCULATOR: '0xDfA68b0fcC5fca85BB3c3749Ade5F364744AB65E',
    LOG10_CALCULATOR: '0xC39b9A0aDE77f8b8428f2BB5F0a7f457CFb68a6c'
};

// Mainnet Addresses (update these after deploying to mainnet)
const MAINNET_ADDRESSES = {
    // Games
    PISSING_CONTEST: '0x0000000000000000000000000000000000000000',
    MESSAGE_BOARD: '0x0000000000000000000000000000000000000000',
    PAY_IT_FORWARD: '0x0000000000000000000000000000000000000000',
    PAY_IT_BACKWARD: '0x0000000000000000000000000000000000000000',
    KING_OF_THE_HILL: '0x0000000000000000000000000000000000000000',
    LAST_CALL: '0x0000000000000000000000000000000000000000',
    TIME_TO_MAKE_THE_DONUTS: '0x0000000000000000000000000000000000000000',
    DICE_GODS: '0x0000000000000000000000000000000000000000',
    
    // Tools (Mathematical Constant Calculators)
    E_CALCULATOR: '0x0000000000000000000000000000000000000000',
    PI_CALCULATOR: '0x0000000000000000000000000000000000000000',
    TAU_CALCULATOR: '0x0000000000000000000000000000000000000000',
    SIN_CALCULATOR: '0x0000000000000000000000000000000000000000',
    COS_CALCULATOR: '0x0000000000000000000000000000000000000000',
    TANH_CALCULATOR: '0x0000000000000000000000000000000000000000',
    POW10_CALCULATOR: '0x0000000000000000000000000000000000000000',
    POW2_CALCULATOR: '0x0000000000000000000000000000000000000000',
    LN_CALCULATOR: '0x0000000000000000000000000000000000000000',
    LOG2_CALCULATOR: '0x0000000000000000000000000000000000000000',
    LOG10_CALCULATOR: '0x0000000000000000000000000000000000000000'
};

// Select addresses based on current network
const NETWORK_ADDRESSES = {
    sepolia: SEPOLIA_ADDRESSES,
    mainnet: MAINNET_ADDRESSES
};

// Export active network addresses
export const CONTRACT_ADDRESSES = NETWORK_ADDRESSES[NETWORK];

// Map contract addresses to their source files
export const CONTRACT_SOURCES = {
    PISSING_CONTEST: 'contracts/games/pissing_contest.vy',
    MESSAGE_BOARD: 'contracts/games/message_board.vy',
    PAY_IT_FORWARD: 'contracts/games/pay_it_forward.vy',
    PAY_IT_BACKWARD: 'contracts/games/pay_it_backward.vy',
    KING_OF_THE_HILL: 'contracts/games/king_of_the_hill.vy',
    LAST_CALL: 'contracts/games/last_call.vy',
    TIME_TO_MAKE_THE_DONUTS: 'contracts/games/time_to_make_the_donuts.vy',
    DICE_GODS: 'contracts/games/dice_gods.vy',
    E_CALCULATOR: 'contracts/tools/e.vy',
    PI_CALCULATOR: 'contracts/tools/pi.vy',
    TAU_CALCULATOR: 'contracts/tools/tau.vy',
    SIN_CALCULATOR: 'contracts/tools/sin.vy',
    COS_CALCULATOR: 'contracts/tools/cos.vy',
    TANH_CALCULATOR: 'contracts/tools/tanh.vy',
    POW10_CALCULATOR: 'contracts/tools/pow10.vy',
    POW2_CALCULATOR: 'contracts/tools/pow2.vy',
    LN_CALCULATOR: 'contracts/tools/ln.vy',
    LOG2_CALCULATOR: 'contracts/tools/log2.vy',
    LOG10_CALCULATOR: 'contracts/tools/log10.vy'
};

// Map contract addresses to their ABI files
export const CONTRACT_ABIS = {
    PISSING_CONTEST: 'contracts/abis/pissing-contest.json',
    MESSAGE_BOARD: 'contracts/abis/message-board.json',
    PAY_IT_FORWARD: 'contracts/abis/pay-it-forward.json',
    PAY_IT_BACKWARD: 'contracts/abis/pay-it-backward.json',
    KING_OF_THE_HILL: 'contracts/abis/king-of-the-hill.json',
    LAST_CALL: 'contracts/abis/last-call.json',
    TIME_TO_MAKE_THE_DONUTS: 'contracts/abis/time-to-make-the-donuts.json',
    DICE_GODS: 'contracts/abis/dice-gods.json',
    E_CALCULATOR: 'contracts/abis/e-calculator.json',
    PI_CALCULATOR: 'contracts/abis/pi-calculator.json',
    TAU_CALCULATOR: 'contracts/abis/tau-calculator.json',
    SIN_CALCULATOR: 'contracts/abis/sin-calculator.json',
    COS_CALCULATOR: 'contracts/abis/cos-calculator.json',
    TANH_CALCULATOR: 'contracts/abis/tanh-calculator.json',
    POW10_CALCULATOR: 'contracts/abis/pow10-calculator.json',
    POW2_CALCULATOR: 'contracts/abis/pow2-calculator.json',
    LN_CALCULATOR: 'contracts/abis/ln-calculator.json',
    LOG2_CALCULATOR: 'contracts/abis/log2-calculator.json',
    LOG10_CALCULATOR: 'contracts/abis/log10-calculator.json'
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

