/**
 * Contract Configuration (Legacy)
 * Infrastructure layer - Backwards compatibility layer
 * 
 * ⚠️ DEPRECATED: This file is maintained for backwards compatibility only.
 * New code should use: import { getContractMetadata } from './contract-registry.js'
 * 
 * This file re-exports the old CONTRACT_ADDRESSES, CONTRACT_SOURCES, and CONTRACT_ABIS
 * objects by extracting them from the new unified registry.
 */

import { NETWORK } from './network.js';
import { CONTRACT_REGISTRY } from './contract-registry.js';

// Sepolia Testnet Addresses - ZERO-FEE DEPLOYMENT (Nov 11, 2025)
const SEPOLIA_ADDRESSES = {
    // Games (100% payouts, no owner extraction)
    PISSING_CONTEST: '0xbc379e64Ed78AB4FC63926DbA46c2f6Fbc590afE',
    MESSAGE_BOARD: '0xe8E0a2a75eDD3a09f58e0891BA13FaC409EA1B74',
    PAY_IT_FORWARD: '0x3D3EeA235a095cCbc08Dd5A137Cf4BC0127D5355',
    PAY_IT_BACKWARD: '0xA5c96421089E4CBe235DD5AEd0033360c03e47AF',
    KING_OF_THE_HILL: '0x04A7F28382e1527327450523Ae2C87edF4F112D4',
    LAST_CALL: '0x495c2f25fEb19BAFffe630846cF1be23a50edD9c',
    TIME_TO_MAKE_THE_DONUTS: '0xB7C9Cd7E64e219bE9c79Ec7aAb33D85F29B14f71',
    DICE_GODS: '0x6eaaA99e735702b05A3F033E347eD7b863b742Ea',
    SATAN_MOLOCH_BAAL: '0x1d105ef94cbA02dc3dd519C32475844942284796',
    
    // Discussions (0% board fee)
    DISCUSSION_BOARD: '0x58743322473f17Bd741853bB4B79b4B23F79AB46',
    DISCUSSION_BLUEPRINT: '0xb122fE99199f1b52B30179b3Bcfce27253b57753',
    
    // Futures Market (0% creation fee, 0% trade fee)
    FUTURE_FACTORY: '0x768E0e56d2597B17FC4b433C6A41BC947DAb774F',
    EULERIAN_FUTURE_BLUEPRINT: '0xa1Ef99A9612B8c97F7E4E00aDEFecEdFAD4d3257',
    
    // Content System (0% creation fee)
    CONTENT_FACTORY: '0xA37262Ef4eD684621468B6433B109a24a72F5b62',
    CONTENT_BLUEPRINT: '0x4F5a6c26B62052AC19E4d21bF9b18bA5a1e178A9',
    
    // Identity (0% creation fee)
    BADGE_FACTORY: '0x35e626194E0691FaA54EFA289D90CA0e6D610FA1',
    BADGE_BLUEPRINT: '0xB25D4f15D7FbA7Df399daab6114489B4Ba88d2D2',
    
    // Tools (Mathematical Constant Calculators)
    E_CALCULATOR: '0x0df17535A8C9B68C426F4bf872E3F4EE1c57Aab8',
    PI_CALCULATOR: '0xeBFaB280b828153b0419bFc866BF8639b485C1da',
    TAU_CALCULATOR: '0x4D4FF41BbF40BF3edE475686Cfd84Ea356647511',
    SIN_CALCULATOR: '0x2b974E0C5AD3c1377Ff9d13C341e796B07627f8b',
    COS_CALCULATOR: '0x85DABC736AA6DE75940cA7C33fc970cB703AcE04',
    TANH_CALCULATOR: '0x4bB456891e1e703Bc3bd23F69B6D6d91323622E1',
    POW10_CALCULATOR: '0x86C5081545f7c8Ab322e8308b5D772e3311DD499',
    POW2_CALCULATOR: '0x038c3931BB2eA55e564292D64bfC4d595F162059',
    LN_CALCULATOR: '0x349dC7858Ff7389F8a132d82aD505627E213391F', 
    LOG2_CALCULATOR: '0xDfA68b0fcC5fca85BB3c3749Ade5F364744AB65E',
    LOG10_CALCULATOR: '0xC39b9A0aDE77f8b8428f2BB5F0a7f457CFb68a6c',
    SQRT_CALCULATOR: '0xb7DdD29478DFC6318f48BeA493f6ae8df1C39226',
    ERF_CALCULATOR: '0x774f4e29521d0AE16E4101419dD059785345F142',
    
    // New Math Tools (Tier 1 & 2)
    EXP: '0xE62DAA640895ca022Abc53A2963A8542f6760138',
    FACTORIAL: '0xd38460Acbf04E3A7a6D40423367f6fd2a876c0d6',
    NORM_CDF: '0x96C2DC2C0A02dAba9E9aDFd21079F3DF863636d6',
    LN_FACTORIAL: '0x3f1E462e882bB09d95040b16184D1105f6E8D2E8',
    ATAN: '0xd1Cd4E090d61a2347319C62991D602A614C7C1E5',
    SINH: '0x306e141415d87B03B987Eee6912BF8051E213A08',
    COSH: '0xA713c8F56BB9133026FA617f4cbbAC2518b2a7d8'
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
    SATAN_MOLOCH_BAAL: '0x0000000000000000000000000000000000000000',
    
    // Discussions
    DISCUSSION_BOARD: '0x0000000000000000000000000000000000000000',
    DISCUSSION_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    
    // Futures Market
    FUTURE_FACTORY: '0x0000000000000000000000000000000000000000',
    EULERIAN_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    
    // Identity
    BADGE_FACTORY: '0x0000000000000000000000000000000000000000',
    BADGE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    
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
    LOG10_CALCULATOR: '0x0000000000000000000000000000000000000000',
    SQRT_CALCULATOR: '0x0000000000000000000000000000000000000000',
    ERF_CALCULATOR: '0x0000000000000000000000000000000000000000'
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
    PISSING_CONTEST: 'contracts/src/games/pissing_contest.vy',
    MESSAGE_BOARD: 'contracts/src/games/message_board.vy',
    PAY_IT_FORWARD: 'contracts/src/games/pay_it_forward.vy',
    PAY_IT_BACKWARD: 'contracts/src/games/pay_it_backward.vy',
    KING_OF_THE_HILL: 'contracts/src/games/king_of_the_hill.vy',
    LAST_CALL: 'contracts/src/games/last_call.vy',
    TIME_TO_MAKE_THE_DONUTS: 'contracts/src/games/time_to_make_the_donuts.vy',
    DICE_GODS: 'contracts/src/games/dice_gods.vy',
    SATAN_MOLOCH_BAAL: 'contracts/src/games/satan_moloch_baal.vy',
    DISCUSSION_BOARD: 'contracts/src/discussions/board.vy',
    DISCUSSION_BLUEPRINT: 'contracts/src/discussions/discussion.vy',
    FUTURE_FACTORY: 'contracts/src/market/future_factory.vy',
    EULERIAN_FUTURE_BLUEPRINT: 'contracts/src/market/eulerian_future.vy',
    BADGE_FACTORY: 'contracts/src/identity/badge_factory.vy',
    BADGE_BLUEPRINT: 'contracts/src/identity/badge.vy',
    CONTENT_FACTORY: 'contracts/src/content/content_factory.vy',
    CONTENT_BLUEPRINT: 'contracts/src/content/content.vy',
    E_CALCULATOR: 'contracts/src/tools/constants/e.vy',
    PI_CALCULATOR: 'contracts/src/tools/constants/pi.vy',
    TAU_CALCULATOR: 'contracts/src/tools/constants/tau.vy',
    SIN_CALCULATOR: 'contracts/src/tools/trig/sin.vy',
    COS_CALCULATOR: 'contracts/src/tools/trig/cos.vy',
    TANH_CALCULATOR: 'contracts/src/tools/trig/tanh.vy',
    POW10_CALCULATOR: 'contracts/src/tools/math/pow10.vy',
    POW2_CALCULATOR: 'contracts/src/tools/math/pow2.vy',
    LN_CALCULATOR: 'contracts/src/tools/math/ln.vy',
    LOG2_CALCULATOR: 'contracts/src/tools/math/log2.vy',
    LOG10_CALCULATOR: 'contracts/src/tools/math/log10.vy',
    SQRT_CALCULATOR: 'contracts/src/tools/math/sqrt.vy',
    ERF_CALCULATOR: 'contracts/src/tools/math/erf.vy'
};

// Map contract addresses to their ABI files
export const CONTRACT_ABIS = {
    PISSING_CONTEST: 'contracts/build/abis/pissing-contest.json',
    MESSAGE_BOARD: 'contracts/build/abis/message-board.json',
    PAY_IT_FORWARD: 'contracts/build/abis/pay-it-forward.json',
    PAY_IT_BACKWARD: 'contracts/build/abis/pay-it-backward.json',
    KING_OF_THE_HILL: 'contracts/build/abis/king-of-the-hill.json',
    LAST_CALL: 'contracts/build/abis/last-call.json',
    TIME_TO_MAKE_THE_DONUTS: 'contracts/build/abis/time-to-make-the-donuts.json',
    DICE_GODS: 'contracts/build/abis/dice-gods.json',
    SATAN_MOLOCH_BAAL: 'contracts/build/abis/satan-moloch-baal.json',
    DISCUSSION_BOARD: 'contracts/build/abis/board.json',
    DISCUSSION_BLUEPRINT: 'contracts/build/abis/discussion.json',
    FUTURE_FACTORY: 'contracts/build/abis/future-factory.json',
    EULERIAN_FUTURE_BLUEPRINT: 'contracts/build/abis/eulerian-future.json',
    BADGE_FACTORY: 'contracts/build/abis/badge-factory-v2.json',
    BADGE: 'contracts/build/abis/badge-v2.json',
    CONTENT_FACTORY: 'contracts/build/abis/content-factory.json',
    CONTENT: 'contracts/build/abis/content.json',
    E_CALCULATOR: 'contracts/build/abis/e-calculator.json',
    PI_CALCULATOR: 'contracts/build/abis/pi-calculator.json',
    TAU_CALCULATOR: 'contracts/build/abis/tau-calculator.json',
    SIN_CALCULATOR: 'contracts/build/abis/sin-calculator.json',
    COS_CALCULATOR: 'contracts/build/abis/cos-calculator.json',
    TANH_CALCULATOR: 'contracts/build/abis/tanh-calculator.json',
    POW10_CALCULATOR: 'contracts/build/abis/pow10-calculator.json',
    POW2_CALCULATOR: 'contracts/build/abis/pow2-calculator.json',
    LN_CALCULATOR: 'contracts/build/abis/ln-calculator.json',
    LOG2_CALCULATOR: 'contracts/build/abis/log2-calculator.json',
    LOG10_CALCULATOR: 'contracts/build/abis/log10-calculator.json',
    SQRT_CALCULATOR: 'contracts/build/abis/sqrt-calculator.json',
    ERF_CALCULATOR: 'contracts/build/abis/erf-calculator.json'
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

