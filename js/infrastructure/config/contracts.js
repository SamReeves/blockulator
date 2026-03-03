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

import { getCurrentNetwork } from './network.js';
import { CONTRACT_REGISTRY } from './contract-registry.js';

// Map registry keys (kebab-case) to legacy keys (SCREAMING_SNAKE_CASE)
const LEGACY_KEY_MAP = {
    'pissing-contest': 'PISSING_CONTEST',
    'message-board': 'MESSAGE_BOARD',
    'pay-it-forward': 'PAY_IT_FORWARD',
    'pay-it-backward': 'PAY_IT_BACKWARD',
    'king-of-the-hill': 'KING_OF_THE_HILL',
    'last-call': 'LAST_CALL',
    'time-to-make-the-donuts': 'TIME_TO_MAKE_THE_DONUTS',
    'dice-gods': 'DICE_GODS',
    'satan-moloch-baal': 'SATAN_MOLOCH_BAAL',
    'future-factory': 'FUTURE_FACTORY',
    'gaussian-future-blueprint': 'GAUSSIAN_FUTURE_BLUEPRINT',
    'uniform-future-blueprint': 'UNIFORM_FUTURE_BLUEPRINT',
    'exponential-future-blueprint': 'EXPONENTIAL_FUTURE_BLUEPRINT',
    'linear-future-blueprint': 'LINEAR_FUTURE_BLUEPRINT',
    'inverted-gaussian-future-blueprint': 'INVERTED_GAUSSIAN_FUTURE_BLUEPRINT',
    'badge-factory': 'BADGE_FACTORY',
    'badge-blueprint': 'BADGE_BLUEPRINT',
    'content-factory-v4': 'CONTENT_FACTORY_V4',
    'image-content-v3-blueprint': 'IMAGE_CONTENT_V3_BLUEPRINT',
    'text-content-v4-blueprint': 'TEXT_CONTENT_V4_BLUEPRINT',
    'e-calculator': 'E_CALCULATOR',
    'pi-calculator': 'PI_CALCULATOR',
    'tau-calculator': 'TAU_CALCULATOR',
    'sin-calculator': 'SIN_CALCULATOR',
    'cos-calculator': 'COS_CALCULATOR',
    'tanh-calculator': 'TANH_CALCULATOR',
    'atan': 'ATAN',
    'sinh': 'SINH',
    'cosh': 'COSH',
    'exp': 'EXP',
    'ln-calculator': 'LN_CALCULATOR',
    'log2-calculator': 'LOG2_CALCULATOR',
    'log10-calculator': 'LOG10_CALCULATOR',
    'pow2-calculator': 'POW2_CALCULATOR',
    'pow10-calculator': 'POW10_CALCULATOR',
    'sqrt-calculator': 'SQRT_CALCULATOR',
    'factorial': 'FACTORIAL',
    'ln-factorial': 'LN_FACTORIAL',
    'gcd': 'GCD',
    'binomial-coeff': 'BINOMIAL_COEFF',
    'erf-calculator': 'ERF_CALCULATOR',
    'norm-cdf': 'NORM_CDF',
    'norm-pdf': 'NORM_PDF',
    'gaussian-tail': 'GAUSSIAN_TAIL',
    'zscore': 'ZSCORE',
    'fp128-arithmetic': 'FP128_ARITHMETIC'
};

// Gaussian blueprint used as the "eulerian future" reference for backward compatibility
const EULERIAN_BLUEPRINT_KEY = 'gaussian-future-blueprint';

// Build legacy exports from the registry
function buildLegacyExports() {
    const addresses = { sepolia: {}, mainnet: {} };
    const sources = {};
    const abis = {};
    
    Object.entries(LEGACY_KEY_MAP).forEach(([registryKey, legacyKey]) => {
        const contract = CONTRACT_REGISTRY[registryKey];
        if (!contract) {
            console.warn(`Contract not found in registry: ${registryKey}`);
            return;
        }
        
        addresses.sepolia[legacyKey] = contract.addresses.sepolia;
        addresses.mainnet[legacyKey] = contract.addresses.mainnet;
        sources[legacyKey] = contract.source;
        abis[legacyKey] = contract.abi;
    });
    
    // Add EULERIAN_FUTURE_BLUEPRINT as alias to gaussian blueprint
    const gaussianBlueprint = CONTRACT_REGISTRY[EULERIAN_BLUEPRINT_KEY];
    if (gaussianBlueprint) {
        addresses.sepolia.EULERIAN_FUTURE_BLUEPRINT = gaussianBlueprint.addresses.sepolia;
        addresses.mainnet.EULERIAN_FUTURE_BLUEPRINT = gaussianBlueprint.addresses.mainnet;
        sources.EULERIAN_FUTURE_BLUEPRINT = gaussianBlueprint.source;
        abis.EULERIAN_FUTURE_BLUEPRINT = gaussianBlueprint.abi;
    }
    
    // Add BADGE as alias to badge-blueprint (for ABI key consistency)
    const badgeBlueprint = CONTRACT_REGISTRY['badge-blueprint'];
    if (badgeBlueprint) {
        abis.BADGE = badgeBlueprint.abi;
    }
    
    return { addresses, sources, abis };
}

const legacy = buildLegacyExports();

// Export active network addresses (dynamically resolved)
export const CONTRACT_ADDRESSES = legacy.addresses[getCurrentNetwork()];

// Map contract addresses to their source files
export const CONTRACT_SOURCES = legacy.sources;

// Map contract addresses to their ABI files
export const CONTRACT_ABIS = legacy.abis;

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
    return CONTRACT_ADDRESSES[contractName];
}

