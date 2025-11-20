/**
 * Unified Contract Registry
 * Infrastructure layer - Single source of truth for all contract metadata
 * Consolidates addresses, source files, ABIs, and display metadata
 */

import { getCurrentNetwork } from './network.js';

/**
 * Contract Registry - All contract metadata in one place
 * Each entry contains: type, display info, addresses, source, and ABI path
 */
export const CONTRACT_REGISTRY = {
    // ========== GAMES ==========
    'pissing-contest': {
        type: 'game',
        name: 'Pissing Contest',
        emoji: '💦',
        description: 'Biggest donation takes the pot',
        addresses: {
            sepolia: '0x483470B5B779360b70d4CD7e5253d4d6380aA07d',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/pissing_contest.vy',
        abi: 'contracts/build/abis/pissing-contest.json'
    },
    
    'message-board': {
        type: 'game',
        name: 'Message Board',
        emoji: '💬',
        description: 'Permanent on-chain messages',
        addresses: {
            sepolia: '0xf90592207441eeef27845dE4B87a5259851EBa75',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/message_board.vy',
        abi: 'contracts/build/abis/message-board.json'
    },
    
    'pay-it-forward': {
        type: 'game',
        name: 'Pay It Forward',
        emoji: '⏩',
        description: 'Get previous player\'s donation',
        addresses: {
            sepolia: '0xB9Bc4f8D9d41a8dcBCDD99D7081d5c9170786679',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/pay_it_forward.vy',
        abi: 'contracts/build/abis/pay-it-forward.json'
    },
    
    'pay-it-backward': {
        type: 'game',
        name: 'Pay It Backward',
        emoji: '⏪',
        description: 'Reward the previous donor',
        addresses: {
            sepolia: '0x137E7907709898571948BddE2e0eCbAC1C343d8C',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/pay_it_backward.vy',
        abi: 'contracts/build/abis/pay-it-backward.json'
    },
    
    'king-of-the-hill': {
        type: 'game',
        name: 'King of the Hill',
        emoji: '👑',
        description: 'Dethrone king, stakes grow',
        addresses: {
            sepolia: '0x159317d877BbF41dE895465B576e706Ebcb0e30e',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/king_of_the_hill.vy',
        abi: 'contracts/build/abis/king-of-the-hill.json'
    },
    
    'last-call': {
        type: 'game',
        name: 'Last Call',
        emoji: '⏰',
        description: 'Last donor wins after timer',
        addresses: {
            sepolia: '0xaCffb1F658E1fD7A50E49Ef55f8fbEA2F1df1528',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/last_call.vy',
        abi: 'contracts/build/abis/last-call.json'
    },
    
    'time-to-make-the-donuts': {
        type: 'game',
        name: 'Time to Make the Donuts',
        emoji: '🍩',
        description: 'First donor daily at midnight',
        addresses: {
            sepolia: '0x98C52B972bDa78a009dE20837d406D96Eb14A3C0',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/time_to_make_the_donuts.vy',
        abi: 'contracts/build/abis/time-to-make-the-donuts.json'
    },
    
    'dice-gods': {
        type: 'game',
        name: 'Dice Gods',
        emoji: '🎲',
        description: 'Pick the least popular number',
        addresses: {
            sepolia: '0xfE76b636ea9dD2881c72Ba1e6A66998B60B2b07d',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/dice_gods.vy',
        abi: 'contracts/build/abis/dice-gods.json'
    },
    
    'satan-moloch-baal': {
        type: 'game',
        name: 'Satan, Moloch, Baal',
        emoji: '🔥',
        description: 'Vote for demons or burn to void',
        addresses: {
            sepolia: '0x1C5596AF550A33bc73d5bB401D6Fd9a0e17751f6',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/satan_moloch_baal.vy',
        abi: 'contracts/build/abis/satan-moloch-baal.json'
    },
    
    // ========== CALCULATORS ==========
    'exp': {
        type: 'calculator',
        name: 'Exponential',
        symbol: 'e^x',
        emoji: '📈',
        category: 'exponential',
        description: 'Calculate e^x on-chain',
        addresses: {
            sepolia: '0xE62DAA640895ca022Abc53A2963A8542f6760138',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/exp.vy',
        abi: 'contracts/build/abis/exp.json'
    },
    
    'factorial': {
        type: 'calculator',
        name: 'Factorial',
        symbol: 'n!',
        emoji: '🔢',
        category: 'basic',
        description: 'Calculate factorial on-chain',
        addresses: {
            sepolia: '0xd38460Acbf04E3A7a6D40423367f6fd2a876c0d6',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/factorial.vy',
        abi: 'contracts/build/abis/factorial.json'
    },
    
    'norm-cdf': {
        type: 'calculator',
        name: 'Normal CDF',
        symbol: 'Φ(x)',
        emoji: '📊',
        category: 'probability',
        description: 'Standard normal cumulative distribution function',
        addresses: {
            sepolia: '0x96C2DC2C0A02dAba9E9aDFd21079F3DF863636d6',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/norm_cdf.vy',
        abi: 'contracts/build/abis/norm-cdf.json'
    },
    
    'ln-factorial': {
        type: 'calculator',
        name: 'Log Factorial',
        symbol: 'ln(n!)',
        emoji: '📈',
        category: 'logarithmic',
        description: 'Natural log of factorial',
        addresses: {
            sepolia: '0x3f1E462e882bB09d95040b16184D1105f6E8D2E8',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/ln_factorial.vy',
        abi: 'contracts/build/abis/ln-factorial.json'
    },
    
    'atan': {
        type: 'calculator',
        name: 'Arctangent',
        symbol: 'atan(x)',
        emoji: '📐',
        category: 'trigonometric',
        description: 'Calculate arctangent on-chain',
        addresses: {
            sepolia: '0xd1Cd4E090d61a2347319C62991D602A614C7C1E5',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/atan.vy',
        abi: 'contracts/build/abis/atan.json'
    },
    
    'sinh': {
        type: 'calculator',
        name: 'Hyperbolic Sine',
        symbol: 'sinh(x)',
        emoji: '〰️',
        category: 'hyperbolic',
        description: 'Calculate hyperbolic sine',
        addresses: {
            sepolia: '0x306e141415d87B03B987Eee6912BF8051E213A08',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/sinh.vy',
        abi: 'contracts/build/abis/sinh.json'
    },
    
    'cosh': {
        type: 'calculator',
        name: 'Hyperbolic Cosine',
        symbol: 'cosh(x)',
        emoji: '〰️',
        category: 'hyperbolic',
        description: 'Calculate hyperbolic cosine',
        addresses: {
            sepolia: '0xA713c8F56BB9133026FA617f4cbbAC2518b2a7d8',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/cosh.vy',
        abi: 'contracts/build/abis/cosh.json'
    },
    
    'e-calculator': {
        type: 'calculator',
        name: 'Euler\'s Number',
        symbol: 'e',
        emoji: 'e',
        category: 'constants',
        description: 'Mathematical constant e',
        addresses: {
            sepolia: '0x0df17535A8C9B68C426F4bf872E3F4EE1c57Aab8',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/constants/e.vy',
        abi: 'contracts/build/abis/e-calculator.json'
    },
    
    'pi-calculator': {
        type: 'calculator',
        name: 'Pi',
        symbol: 'π',
        emoji: 'π',
        category: 'constants',
        description: 'Mathematical constant pi',
        addresses: {
            sepolia: '0xeBFaB280b828153b0419bFc866BF8639b485C1da',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/constants/pi.vy',
        abi: 'contracts/build/abis/pi-calculator.json'
    },
    
    'tau-calculator': {
        type: 'calculator',
        name: 'Tau',
        symbol: 'τ',
        emoji: 'τ',
        category: 'constants',
        description: 'Mathematical constant tau (2π)',
        addresses: {
            sepolia: '0x4D4FF41BbF40BF3edE475686Cfd84Ea356647511',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/constants/tau.vy',
        abi: 'contracts/build/abis/tau-calculator.json'
    },
    
    'sin-calculator': {
        type: 'calculator',
        name: 'Sine',
        symbol: 'sin(x)',
        emoji: '〰️',
        category: 'trigonometric',
        description: 'Calculate sine on-chain',
        addresses: {
            sepolia: '0x2b974E0C5AD3c1377Ff9d13C341e796B07627f8b',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/trig/sin.vy',
        abi: 'contracts/build/abis/sin-calculator.json'
    },
    
    'cos-calculator': {
        type: 'calculator',
        name: 'Cosine',
        symbol: 'cos(x)',
        emoji: '〰️',
        category: 'trigonometric',
        description: 'Calculate cosine on-chain',
        addresses: {
            sepolia: '0x85DABC736AA6DE75940cA7C33fc970cB703AcE04',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/trig/cos.vy',
        abi: 'contracts/build/abis/cos-calculator.json'
    },
    
    'tanh-calculator': {
        type: 'calculator',
        name: 'Hyperbolic Tangent',
        symbol: 'tanh(x)',
        emoji: '〰️',
        category: 'hyperbolic',
        description: 'Calculate hyperbolic tangent',
        addresses: {
            sepolia: '0x4bB456891e1e703Bc3bd23F69B6D6d91323622E1',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/trig/tanh.vy',
        abi: 'contracts/build/abis/tanh-calculator.json'
    },
    
    'pow10-calculator': {
        type: 'calculator',
        name: 'Power of 10',
        symbol: '10^x',
        emoji: '📈',
        category: 'exponential',
        description: 'Calculate powers of 10',
        addresses: {
            sepolia: '0x86C5081545f7c8Ab322e8308b5D772e3311DD499',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/pow10.vy',
        abi: 'contracts/build/abis/pow10-calculator.json'
    },
    
    'pow2-calculator': {
        type: 'calculator',
        name: 'Power of 2',
        symbol: '2^x',
        emoji: '📈',
        category: 'exponential',
        description: 'Calculate powers of 2',
        addresses: {
            sepolia: '0x038c3931BB2eA55e564292D64bfC4d595F162059',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/pow2.vy',
        abi: 'contracts/build/abis/pow2-calculator.json'
    },
    
    'ln-calculator': {
        type: 'calculator',
        name: 'Natural Logarithm',
        symbol: 'ln(x)',
        emoji: '📊',
        category: 'logarithmic',
        description: 'Calculate natural logarithm',
        addresses: {
            sepolia: '0x349dC7858Ff7389F8a132d82aD505627E213391F',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/ln.vy',
        abi: 'contracts/build/abis/ln-calculator.json'
    },
    
    'log2-calculator': {
        type: 'calculator',
        name: 'Log Base 2',
        symbol: 'log₂(x)',
        emoji: '📊',
        category: 'logarithmic',
        description: 'Calculate logarithm base 2',
        addresses: {
            sepolia: '0xDfA68b0fcC5fca85BB3c3749Ade5F364744AB65E',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/log2.vy',
        abi: 'contracts/build/abis/log2-calculator.json'
    },
    
    'log10-calculator': {
        type: 'calculator',
        name: 'Log Base 10',
        symbol: 'log₁₀(x)',
        emoji: '📊',
        category: 'logarithmic',
        description: 'Calculate logarithm base 10',
        addresses: {
            sepolia: '0xC39b9A0aDE77f8b8428f2BB5F0a7f457CFb68a6c',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/log10.vy',
        abi: 'contracts/build/abis/log10-calculator.json'
    },
    
    'sqrt-calculator': {
        type: 'calculator',
        name: 'Square Root',
        symbol: '√x',
        emoji: '√',
        category: 'basic',
        description: 'Calculate square root',
        addresses: {
            sepolia: '0xb7DdD29478DFC6318f48BeA493f6ae8df1C39226',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/sqrt.vy',
        abi: 'contracts/build/abis/sqrt-calculator.json'
    },
    
    'erf-calculator': {
        type: 'calculator',
        name: 'Error Function',
        symbol: 'erf(x)',
        emoji: '📊',
        category: 'probability',
        description: 'Gaussian error function',
        addresses: {
            sepolia: '0x774f4e29521d0AE16E4101419dD059785345F142',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/erf.vy',
        abi: 'contracts/build/abis/erf-calculator.json'
    },
    
    // ========== DISCUSSIONS ==========
    'discussion-board': {
        type: 'discussion',
        name: 'Discussion Board',
        emoji: '💬',
        description: 'On-chain discussion platform',
        addresses: {
            sepolia: '0xb216dfcDDB1A465675Ab1A79CA519A7e00fd8D63',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/discussions/board.vy',
        abi: 'contracts/build/abis/board.json'
    },
    
    'discussion-blueprint': {
        type: 'discussion',
        name: 'Discussion Blueprint',
        emoji: '📝',
        description: 'Discussion contract blueprint',
        addresses: {
            sepolia: '0x057bE4BD7892f7f85538a33567f3C8e2E9A39413',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/discussions/discussion.vy',
        abi: 'contracts/build/abis/discussion.json'
    },
    
    // ========== FUTURES ==========
    'future-factory': {
        type: 'future',
        name: 'Future Factory',
        emoji: '🏭',
        description: 'Eulerian futures marketplace',
        addresses: {
            sepolia: '0x8cf41fbE9abE00e47fDed94FdbdC75C2d07f8193',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/future_factory.vy',
        abi: 'contracts/build/abis/future-factory.json'
    },
    
    'eulerian-future-blueprint': {
        type: 'future',
        name: 'Eulerian Future Blueprint',
        emoji: '📋',
        description: 'Future contract blueprint',
        addresses: {
            sepolia: '0x2E942C37B0ED14017E502E2aFB038E8657eD5F67',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/eulerian_future.vy',
        abi: 'contracts/build/abis/eulerian-future.json'
    },
    
    // ========== IDENTITY ==========
    'badge-factory': {
        type: 'identity',
        name: 'Badge Factory',
        emoji: '🏭',
        description: 'Badge creation factory',
        addresses: {
            sepolia: '0xb79F5c67e616F913012af413891B2A71764D2294',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/identity/badge_factory.vy',
        abi: 'contracts/build/abis/badge-factory-v2.json'
    },
    
    'badge-blueprint': {
        type: 'identity',
        name: 'Badge Blueprint',
        emoji: '🎖️',
        description: 'Badge contract blueprint',
        addresses: {
            sepolia: '0x32C7C4A4426bf1cBBb1F60Fd706514F1846A828E',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/identity/badge.vy',
        abi: 'contracts/build/abis/badge-v2.json'
    },
    
    // ========== CONTENT / UPLOADS ==========
    'content-factory': {
        type: 'content',
        name: 'Content Factory',
        emoji: '🏭',
        description: 'Create on-chain images and text (RGB only)',
        addresses: {
            sepolia: '0x657D5E7A3568C8b26Dc63797f2634B063bE9277e',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/content_factory.vy',
        abi: 'contracts/build/abis/content-factory.json'
    },
    
    'content-blueprint': {
        type: 'content',
        name: 'Content Blueprint',
        emoji: '📄',
        description: 'Content contract blueprint (legacy)',
        addresses: {
            sepolia: '0x571bd6BCE1245e8bdA37db84caeC8adb1cCecc2F',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/content.vy',
        abi: 'contracts/build/abis/content.json'
    },
    
    // ========== CONTENT V3 (5-MODE COMPRESSION) ==========
    'content-factory-v3': {
        type: 'content',
        name: 'Content Factory V3',
        emoji: '🏭✨',
        description: '5-mode compression: RGB, Grayscale, Monochrome, Indexed, RGB565',
        addresses: {
            sepolia: '0x0E3250cAb6c3648a18330c846a7A814574E92143',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/content_factory_v3.vy',
        abi: 'contracts/build/abis/content_factory_v3.json'
    },
    
    'image-content-blueprint-v3': {
        type: 'content',
        name: 'Image Content Blueprint V3',
        emoji: '🖼️',
        description: 'Multi-mode compressed image storage',
        addresses: {
            sepolia: '0xF5793ff8457983Ab6a6b739315069a954C30A238',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/image_content_v3.vy',
        abi: 'contracts/build/abis/image_content_v3.json'
    }
};

/**
 * Get contract metadata by name
 * @param {string} contractName - Contract identifier (e.g., 'dice-gods')
 * @param {string} network - Network name (default: current network)
 * @returns {object} Complete contract metadata
 */
export function getContractMetadata(contractName, network = null) {
    const metadata = CONTRACT_REGISTRY[contractName];
    
    if (!metadata) {
        throw new Error(`Unknown contract: ${contractName}`);
    }
    
    // Use current network if not specified
    const targetNetwork = network || getCurrentNetwork();
    
    // Return metadata with resolved address for current network
    return {
        ...metadata,
        contractAddress: metadata.addresses[targetNetwork],
        sourceFile: metadata.source,
        abiFile: metadata.abi
    };
}

/**
 * Get contract address only (backward compatibility helper)
 * @param {string} contractName - Contract identifier
 * @param {string} network - Network name (default: current network)
 * @returns {string} Contract address
 */
export function getContractAddress(contractName, network = null) {
    return getContractMetadata(contractName, network).contractAddress;
}

/**
 * Get all contracts by type
 * @param {string} type - Contract type ('game', 'calculator', etc.)
 * @returns {Array<string>} Array of contract names
 */
export function getContractsByType(type) {
    return Object.keys(CONTRACT_REGISTRY)
        .filter(key => CONTRACT_REGISTRY[key].type === type);
}

/**
 * Check if contract exists in registry
 * @param {string} contractName - Contract identifier
 * @returns {boolean} True if contract exists
 */
export function hasContract(contractName) {
    return contractName in CONTRACT_REGISTRY;
}

// Export lists of contracts by type for convenience
export const GAMES = getContractsByType('game');
export const CALCULATORS = getContractsByType('calculator');
export const DISCUSSIONS = getContractsByType('discussion');
export const FUTURES = getContractsByType('future');
export const IDENTITY = getContractsByType('identity');
export const CONTENT = getContractsByType('content');


