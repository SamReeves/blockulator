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

// Sepolia Testnet Addresses - Latest Deployment (Feb 28, 2026)
const SEPOLIA_ADDRESSES = {
    // Games (100% payouts, no owner extraction)
    PISSING_CONTEST: '0x09CB63309F854788C76D9b6750598b2d86EADC8b',
    MESSAGE_BOARD: '0xE93Ac949Fe806d8b1cA93EB14e5f4d799cAc0d55',
    PAY_IT_FORWARD: '0x338C316e1FE9535e3569597D63267A8a1AD78855',
    PAY_IT_BACKWARD: '0x478A53b021639CFbAbe45d222B240ffE409FEE3f',
    KING_OF_THE_HILL: '0x0DEEBef3228B5d0cD4158Dc367A5C4b31B6414A6',
    LAST_CALL: '0xE0e1E3778d75E757fd4718FdF44bD4e0F5E73baa',
    TIME_TO_MAKE_THE_DONUTS: '0xD222eCe3C1D844B23384F56d62E59F556e925C85',
    DICE_GODS: '0x61d97822209D3B375c7B214597f1077F4879fD84',
    SATAN_MOLOCH_BAAL: '0x55Ec2808F3c2B55c02E065e1693c61a4A56967A2',
    
    // Futures Market
    FUTURE_FACTORY: '0x23D6C1D2e9050f0DA6e8Df5812c886b755ba3dA2',
    EULERIAN_FUTURE_BLUEPRINT: '0x452754b1b5b7421371537245192C682B409adB5d', // Using Gaussian as the primary blueprint example
    UNIFORM_FUTURE_BLUEPRINT: '0xC630C3876cB4b84e6d7b3DD859Cc6078d2fCb1CB',
    GAUSSIAN_FUTURE_BLUEPRINT: '0x452754b1b5b7421371537245192C682B409adB5d',
    EXPONENTIAL_FUTURE_BLUEPRINT: '0xA0662156296480a8d69a24a52F829701183aA915',
    LINEAR_FUTURE_BLUEPRINT: '0x5dE0BC82DcEbA8F1152198f4c810Dd44b9235698',
    INVERTED_GAUSSIAN_FUTURE_BLUEPRINT: '0xA79a88290Ec19F6Cad38C40C5ff4c9fAf9ecE6F0',
    
    // Identity
    BADGE_FACTORY: '0x5802f9121018aabC887b9686bA2eB1EFABB70BB7',
    BADGE_BLUEPRINT: '0x906E93e3901C87e0E3158B8eE8D4bF56d887C1D0',
    
    // Content
    CONTENT_FACTORY_V4: '0x010EFFB50047820Fe8cEADD04877B427c92008B2',
    IMAGE_CONTENT_V3_BLUEPRINT: '0x609798Eb02e4Fb49B3e8eCf41432A2e64F22050a',
    TEXT_CONTENT_V4_BLUEPRINT: '0x3088506F35f48D43c5946993D11D5e67624EDd83',
    
    // Mathematical Constants
    E_CALCULATOR: '0xE87ee976517CfA35945BFc51A697cCa9df4adc3a',
    PI_CALCULATOR: '0x9859707734328ca8DEB52ADA5d770ff11A5C4CFB',
    TAU_CALCULATOR: '0x7e2111cbE6a364f4de2210D2809b49eF6b159A09',
    
    // Trigonometric Functions
    SIN_CALCULATOR: '0x54133558fac25a8BE06818450A949E1788f8d36d',
    COS_CALCULATOR: '0xd105DEc01140cD654c3f529a734EFf4197661eAE',
    TANH_CALCULATOR: '0x0033D56AAa908d789f4de02e58304B46FFC4Fd34',
    ATAN: '0xE1974FF18f7f387bcb02f996D8ddC04be078b293',
    
    // Hyperbolic Functions
    SINH: '0xa5E15aFCb50b8B4241d41f9B8847Df277A6941Ad',
    COSH: '0x117d0a451fa16AADBE344A80d944e9Ba35317295',
    
    // Exponential & Logarithmic
    EXP: '0x214E417CeA3A20c7e9e583b30bc03253DCcC5a1C',
    LN_CALCULATOR: '0xd133A5E0a7e8eDF1FDEA4cd06AC1F1D8325eB768',
    LOG2_CALCULATOR: '0xbBf23C4340CB4D10e608a6d62C907EC2FdEDb517',
    LOG10_CALCULATOR: '0x29359A46A4FAec3452dbDEa8715FD78cd06Cb9aa',
    POW2_CALCULATOR: '0x762D5A7a2a35a4eBb4412345532177c726B44E04',
    POW10_CALCULATOR: '0x4cdb4e0b80fA70848679e3FDb6dC4D57B0646841',
    
    // Basic Math
    SQRT_CALCULATOR: '0x5989EB39217eb102aaba8dF1a7c53995EbfAA85b',
    FACTORIAL: '0x987B55f5025361F7D438e47f27973B5129F9Bb48',
    LN_FACTORIAL: '0x21F8a75C0D60A5504A9FF7773F1e451bA4c8f479',
    GCD: '0xc2779e341D2B47ef3cE12Fd4171847DAd4cee152',
    BINOMIAL_COEFF: '0x4D024D9D815a50e0F6B0fA9D4D87D0CBAB716eC2',
    
    // Statistical Functions
    ERF_CALCULATOR: '0x090285f2952ac6dCC8b6B40d90CD417B8789c1Df',
    NORM_CDF: '0x412f9e6d1B231f4Cb96BbD67fcCEF9435Fb37FD2',
    NORM_PDF: '0xcF60383e6b9a385a644675956C6c1c49f7234e5F',
    GAUSSIAN_TAIL: '0xD2B7D1031E6a9e54B7329Fa71de667BfD6CeDE51',
    ZSCORE: '0x1090C2d12230B45077e19eF9725d94a0f78B39ea'
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
    
    // Futures Market
    FUTURE_FACTORY: '0x0000000000000000000000000000000000000000',
    EULERIAN_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    UNIFORM_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    GAUSSIAN_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    EXPONENTIAL_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    LINEAR_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    INVERTED_GAUSSIAN_FUTURE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    
    // Identity
    BADGE_FACTORY: '0x0000000000000000000000000000000000000000',
    BADGE_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    
    // Content
    CONTENT_FACTORY_V4: '0x0000000000000000000000000000000000000000',
    IMAGE_CONTENT_V3_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    TEXT_CONTENT_V4_BLUEPRINT: '0x0000000000000000000000000000000000000000',
    
    // Mathematical Constants
    E_CALCULATOR: '0x0000000000000000000000000000000000000000',
    PI_CALCULATOR: '0x0000000000000000000000000000000000000000',
    TAU_CALCULATOR: '0x0000000000000000000000000000000000000000',
    
    // Trigonometric Functions
    SIN_CALCULATOR: '0x0000000000000000000000000000000000000000',
    COS_CALCULATOR: '0x0000000000000000000000000000000000000000',
    TANH_CALCULATOR: '0x0000000000000000000000000000000000000000',
    ATAN: '0x0000000000000000000000000000000000000000',
    
    // Hyperbolic Functions
    SINH: '0x0000000000000000000000000000000000000000',
    COSH: '0x0000000000000000000000000000000000000000',
    
    // Exponential & Logarithmic
    EXP: '0x0000000000000000000000000000000000000000',
    LN_CALCULATOR: '0x0000000000000000000000000000000000000000',
    LOG2_CALCULATOR: '0x0000000000000000000000000000000000000000',
    LOG10_CALCULATOR: '0x0000000000000000000000000000000000000000',
    POW2_CALCULATOR: '0x0000000000000000000000000000000000000000',
    POW10_CALCULATOR: '0x0000000000000000000000000000000000000000',
    
    // Basic Math
    SQRT_CALCULATOR: '0x0000000000000000000000000000000000000000',
    FACTORIAL: '0x0000000000000000000000000000000000000000',
    LN_FACTORIAL: '0x0000000000000000000000000000000000000000',
    GCD: '0x0000000000000000000000000000000000000000',
    BINOMIAL_COEFF: '0x0000000000000000000000000000000000000000',
    
    // Statistical Functions
    ERF_CALCULATOR: '0x0000000000000000000000000000000000000000',
    NORM_CDF: '0x0000000000000000000000000000000000000000',
    NORM_PDF: '0x0000000000000000000000000000000000000000',
    GAUSSIAN_TAIL: '0x0000000000000000000000000000000000000000',
    ZSCORE: '0x0000000000000000000000000000000000000000'
};

// Select addresses based on current network
const NETWORK_ADDRESSES = {
    sepolia: SEPOLIA_ADDRESSES,
    mainnet: MAINNET_ADDRESSES
};

// Export active network addresses (dynamically resolved)
export const CONTRACT_ADDRESSES = NETWORK_ADDRESSES[getCurrentNetwork()];

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
    FUTURE_FACTORY: 'contracts/src/market/future_factory.vy',
    EULERIAN_FUTURE_BLUEPRINT: 'contracts/src/market/eulerian_future.vy',
    UNIFORM_FUTURE_BLUEPRINT: 'contracts/src/market/uniform_future.vy',
    GAUSSIAN_FUTURE_BLUEPRINT: 'contracts/src/market/gaussian_future.vy',
    EXPONENTIAL_FUTURE_BLUEPRINT: 'contracts/src/market/exponential_future.vy',
    LINEAR_FUTURE_BLUEPRINT: 'contracts/src/market/linear_future.vy',
    INVERTED_GAUSSIAN_FUTURE_BLUEPRINT: 'contracts/src/market/inverted_gaussian_future.vy',
    BADGE_FACTORY: 'contracts/src/identity/badge_factory.vy',
    BADGE_BLUEPRINT: 'contracts/src/identity/badge.vy',
    CONTENT_FACTORY_V4: 'contracts/src/content/content_factory_v4.vy',
    IMAGE_CONTENT_V3_BLUEPRINT: 'contracts/src/content/image_content_v3.vy',
    TEXT_CONTENT_V4_BLUEPRINT: 'contracts/src/content/text_content_v4.vy',
    E_CALCULATOR: 'contracts/src/tools/constants/e.vy',
    PI_CALCULATOR: 'contracts/src/tools/constants/pi.vy',
    TAU_CALCULATOR: 'contracts/src/tools/constants/tau.vy',
    SIN_CALCULATOR: 'contracts/src/tools/trig/sin.vy',
    COS_CALCULATOR: 'contracts/src/tools/trig/cos.vy',
    TANH_CALCULATOR: 'contracts/src/tools/trig/tanh.vy',
    ATAN: 'contracts/src/tools/math/atan.vy',
    SINH: 'contracts/src/tools/math/sinh.vy',
    COSH: 'contracts/src/tools/math/cosh.vy',
    EXP: 'contracts/src/tools/math/exp.vy',
    LN_CALCULATOR: 'contracts/src/tools/math/ln.vy',
    LOG2_CALCULATOR: 'contracts/src/tools/math/log2.vy',
    LOG10_CALCULATOR: 'contracts/src/tools/math/log10.vy',
    POW2_CALCULATOR: 'contracts/src/tools/math/pow2.vy',
    POW10_CALCULATOR: 'contracts/src/tools/math/pow10.vy',
    SQRT_CALCULATOR: 'contracts/src/tools/math/sqrt.vy',
    FACTORIAL: 'contracts/src/tools/math/factorial.vy',
    LN_FACTORIAL: 'contracts/src/tools/math/ln_factorial.vy',
    GCD: 'contracts/src/tools/math/gcd.vy',
    BINOMIAL_COEFF: 'contracts/src/tools/math/binomial_coeff.vy',
    ERF_CALCULATOR: 'contracts/src/tools/math/erf.vy',
    NORM_CDF: 'contracts/src/tools/math/norm_cdf.vy',
    NORM_PDF: 'contracts/src/tools/math/norm_pdf.vy',
    GAUSSIAN_TAIL: 'contracts/src/tools/math/gaussian_tail.vy',
    ZSCORE: 'contracts/src/tools/math/zscore.vy'
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
    FUTURE_FACTORY: 'contracts/build/abis/future-factory.json',
    EULERIAN_FUTURE_BLUEPRINT: 'contracts/build/abis/eulerian-future.json',
    UNIFORM_FUTURE_BLUEPRINT: 'contracts/build/abis/uniform-future.json',
    GAUSSIAN_FUTURE_BLUEPRINT: 'contracts/build/abis/gaussian-future.json',
    EXPONENTIAL_FUTURE_BLUEPRINT: 'contracts/build/abis/exponential-future.json',
    LINEAR_FUTURE_BLUEPRINT: 'contracts/build/abis/linear-future.json',
    INVERTED_GAUSSIAN_FUTURE_BLUEPRINT: 'contracts/build/abis/inverted-gaussian-future.json',
    BADGE_FACTORY: 'contracts/build/abis/badge-factory-v2.json',
    BADGE: 'contracts/build/abis/badge-v2.json',
    CONTENT_FACTORY_V4: 'contracts/build/abis/content-factory-v4.json',
    IMAGE_CONTENT_V3_BLUEPRINT: 'contracts/build/abis/image-content-v3.json',
    TEXT_CONTENT_V4_BLUEPRINT: 'contracts/build/abis/text-content-v4.json',
    E_CALCULATOR: 'contracts/build/abis/e-calculator.json',
    PI_CALCULATOR: 'contracts/build/abis/pi-calculator.json',
    TAU_CALCULATOR: 'contracts/build/abis/tau-calculator.json',
    SIN_CALCULATOR: 'contracts/build/abis/sin-calculator.json',
    COS_CALCULATOR: 'contracts/build/abis/cos-calculator.json',
    TANH_CALCULATOR: 'contracts/build/abis/tanh-calculator.json',
    ATAN: 'contracts/build/abis/atan.json',
    SINH: 'contracts/build/abis/sinh.json',
    COSH: 'contracts/build/abis/cosh.json',
    EXP: 'contracts/build/abis/exp.json',
    LN_CALCULATOR: 'contracts/build/abis/ln-calculator.json',
    LOG2_CALCULATOR: 'contracts/build/abis/log2-calculator.json',
    LOG10_CALCULATOR: 'contracts/build/abis/log10-calculator.json',
    POW2_CALCULATOR: 'contracts/build/abis/pow2-calculator.json',
    POW10_CALCULATOR: 'contracts/build/abis/pow10-calculator.json',
    SQRT_CALCULATOR: 'contracts/build/abis/sqrt-calculator.json',
    FACTORIAL: 'contracts/build/abis/factorial.json',
    LN_FACTORIAL: 'contracts/build/abis/ln-factorial.json',
    GCD: 'contracts/build/abis/gcd.json',
    BINOMIAL_COEFF: 'contracts/build/abis/binomial-coeff.json',
    ERF_CALCULATOR: 'contracts/build/abis/erf-calculator.json',
    NORM_CDF: 'contracts/build/abis/norm-cdf.json',
    NORM_PDF: 'contracts/build/abis/norm-pdf.json',
    GAUSSIAN_TAIL: 'contracts/build/abis/gaussian-tail.json',
    ZSCORE: 'contracts/build/abis/zscore.json'
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

