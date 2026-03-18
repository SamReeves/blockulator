/**
 * Unified Contract Registry
 * Infrastructure layer - Single source of truth for all contract metadata
 * 
 * This registry defines WHAT contracts exist and WHERE they live on-chain.
 * Contains: addresses, ABI paths, source paths, and minimal display metadata
 * (name, emoji, description) for all contract types (games, calculators, futures, identity).
 * 
 * For calculator-specific UI configuration (input schemas, result formatting, method names),
 * see js/domain/calculators/calculator-registry.js, which references IDs from this file.
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
            sepolia: '0x09CB63309F854788C76D9b6750598b2d86EADC8b',
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
            sepolia: '0xE93Ac949Fe806d8b1cA93EB14e5f4d799cAc0d55',
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
            sepolia: '0x338C316e1FE9535e3569597D63267A8a1AD78855',
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
            sepolia: '0x478A53b021639CFbAbe45d222B240ffE409FEE3f',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/pay_it_backward.vy',
        abi: 'contracts/build/abis/pay-it-backward.json'
    },
    
    'king-of-the-hill': {
        type: 'game',
        name: 'King of the Hill',
        emoji: '👑',
        description: 'Dethrone the king; stakes grow with each challenge',
        addresses: {
            sepolia: '0x0DEEBef3228B5d0cD4158Dc367A5C4b31B6414A6',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/king_of_the_hill.vy',
        abi: 'contracts/build/abis/king-of-the-hill.json'
    },
    
    'last-call': {
        type: 'game',
        name: 'Last Call',
        emoji: '⏰',
        description: 'Last donor before the timer expires wins',
        addresses: {
            sepolia: '0xE0e1E3778d75E757fd4718FdF44bD4e0F5E73baa',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/last_call.vy',
        abi: 'contracts/build/abis/last-call.json'
    },
    
    'time-to-make-the-donuts': {
        type: 'game',
        name: 'Time to Make the Donuts',
        emoji: '🍩',
        description: 'First donor each day after midnight UTC wins',
        addresses: {
            sepolia: '0xD222eCe3C1D844B23384F56d62E59F556e925C85',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/time_to_make_the_donuts.vy',
        abi: 'contracts/build/abis/time-to-make-the-donuts.json'
    },
    
    'dice-gods': {
        type: 'game',
        name: 'Dice Gods',
        emoji: '🎲',
        description: 'Last digit of your donation is your guess (1-6)',
        addresses: {
            sepolia: '0x61d97822209D3B375c7B214597f1077F4879fD84',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/games/dice_gods.vy',
        abi: 'contracts/build/abis/dice-gods.json'
    },
    
    'satan-moloch-baal': {
        type: 'game',
        name: 'Satan, Moloch, Baal',
        emoji: '🔥',
        description: 'Sacrifice ETH to your chosen demon',
        addresses: {
            sepolia: '0x55Ec2808F3c2B55c02E065e1693c61a4A56967A2',
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
            sepolia: '0x214E417CeA3A20c7e9e583b30bc03253DCcC5a1C',
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
            sepolia: '0x987B55f5025361F7D438e47f27973B5129F9Bb48',
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
            sepolia: '0x412f9e6d1B231f4Cb96BbD67fcCEF9435Fb37FD2',
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
            sepolia: '0x21F8a75C0D60A5504A9FF7773F1e451bA4c8f479',
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
            sepolia: '0xE1974FF18f7f387bcb02f996D8ddC04be078b293',
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
            sepolia: '0xa5E15aFCb50b8B4241d41f9B8847Df277A6941Ad',
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
            sepolia: '0x117d0a451fa16AADBE344A80d944e9Ba35317295',
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
            sepolia: '0xE87ee976517CfA35945BFc51A697cCa9df4adc3a',
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
            sepolia: '0x9859707734328ca8DEB52ADA5d770ff11A5C4CFB',
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
            sepolia: '0x7e2111cbE6a364f4de2210D2809b49eF6b159A09',
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
            sepolia: '0x54133558fac25a8BE06818450A949E1788f8d36d',
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
            sepolia: '0xd105DEc01140cD654c3f529a734EFf4197661eAE',
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
            sepolia: '0x0033D56AAa908d789f4de02e58304B46FFC4Fd34',
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
            sepolia: '0x4cdb4e0b80fA70848679e3FDb6dC4D57B0646841',
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
            sepolia: '0x762D5A7a2a35a4eBb4412345532177c726B44E04',
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
            sepolia: '0xd133A5E0a7e8eDF1FDEA4cd06AC1F1D8325eB768',
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
            sepolia: '0xbBf23C4340CB4D10e608a6d62C907EC2FdEDb517',
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
            sepolia: '0x29359A46A4FAec3452dbDEa8715FD78cd06Cb9aa',
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
            sepolia: '0x5989EB39217eb102aaba8dF1a7c53995EbfAA85b',
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
            sepolia: '0x090285f2952ac6dCC8b6B40d90CD417B8789c1Df',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/erf.vy',
        abi: 'contracts/build/abis/erf-calculator.json'
    },
    
    'zscore': {
        type: 'calculator',
        name: 'Z-Score',
        symbol: 'z',
        emoji: '📏',
        category: 'statistics',
        description: 'Standardized distance from mean',
        addresses: {
            sepolia: '0x1090C2d12230B45077e19eF9725d94a0f78B39ea',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/zscore.vy',
        abi: 'contracts/build/abis/zscore.json'
    },
    
    'gaussian-tail': {
        type: 'calculator',
        name: 'Gaussian Tail',
        symbol: 'Tail(z)',
        emoji: '📉',
        category: 'statistics',
        description: 'Gaussian tail probability (Lin 1990)',
        addresses: {
            sepolia: '0xD2B7D1031E6a9e54B7329Fa71de667BfD6CeDE51',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/gaussian_tail.vy',
        abi: 'contracts/build/abis/gaussian-tail.json'
    },
    
    'binomial-coeff': {
        type: 'calculator',
        name: 'Binomial Coefficient',
        symbol: 'C(n,k)',
        emoji: '🎲',
        category: 'combinatorics',
        description: 'n choose k - combinations calculator',
        addresses: {
            sepolia: '0x4D024D9D815a50e0F6B0fA9D4D87D0CBAB716eC2',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/binomial_coeff.vy',
        abi: 'contracts/build/abis/binomial-coeff.json'
    },
    
    'norm-pdf': {
        type: 'calculator',
        name: 'Normal PDF',
        symbol: 'φ(z)',
        emoji: '🔔',
        category: 'statistics',
        description: 'Normal probability density function',
        addresses: {
            sepolia: '0xcF60383e6b9a385a644675956C6c1c49f7234e5F',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/norm_pdf.vy',
        abi: 'contracts/build/abis/norm-pdf.json'
    },
    
    'gcd': {
        type: 'calculator',
        name: 'GCD / LCM',
        symbol: 'GCD(a,b)',
        emoji: '🔢',
        category: 'number-theory',
        description: 'Greatest common divisor and least common multiple',
        addresses: {
            sepolia: '0xc2779e341D2B47ef3cE12Fd4171847DAd4cee152',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/math/gcd.vy',
        abi: 'contracts/build/abis/gcd.json'
    },
    
    // ========== ARITHMETIC (HUFF) ==========
    'fixedpoint127': {
        type: 'arithmetic',
        name: 'FP127',
        symbol: '+−×÷',
        emoji: '0x',
        category: 'huff',
        description: 'Signed 127.128 fixed-point arithmetic with 34 operations: add, sub, mul, div, exp, exp2, exp10, ln, log2, log10, sqrt, pow, abs, neg, inv, min, max, clamp, avg, gavg, dist, zeroFloorSub, hypot, cbrt, lerp, sign, floor, ceil, frac, round, log2Up, gcd, factorial, lambertW0',
        addresses: {
            sepolia: '0xfae694D0c2c44181791F838c54Ed64C3151FfE30',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/tools/huff/fp127/fp127.huff',
        abi: 'contracts/build/abis/fixedpoint127.json'
    },
    
    // ========== FUTURES ==========
    'future-factory': {
        type: 'future',
        name: 'Future Factory',
        emoji: '🏭',
        description: 'Eulerian futures marketplace',
        addresses: {
            sepolia: '0x23D6C1D2e9050f0DA6e8Df5812c886b755ba3dA2',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/future_factory.vy',
        abi: 'contracts/build/abis/future-factory.json'
    },
    
    'uniform-future-blueprint': {
        type: 'future',
        name: 'Uniform Future Blueprint',
        emoji: '📏',
        description: 'Constant payout rate, linear accumulation',
        addresses: {
            sepolia: '0xC630C3876cB4b84e6d7b3DD859Cc6078d2fCb1CB',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/uniform_future.vy',
        abi: 'contracts/build/abis/uniform-future.json'
    },
    
    'gaussian-future-blueprint': {
        type: 'future',
        name: 'Gaussian Future Blueprint',
        emoji: '🔔',
        description: 'Bell curve distribution, peak at midpoint',
        addresses: {
            sepolia: '0x452754b1b5b7421371537245192C682B409adB5d',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/gaussian_future.vy',
        abi: 'contracts/build/abis/gaussian-future.json'
    },
    
    'exponential-future-blueprint': {
        type: 'future',
        name: 'Exponential Future Blueprint',
        emoji: '📉',
        description: 'Front-loaded or back-loaded payouts',
        addresses: {
            sepolia: '0xA0662156296480a8d69a24a52F829701183aA915',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/exponential_future.vy',
        abi: 'contracts/build/abis/exponential-future.json'
    },
    
    'linear-future-blueprint': {
        type: 'future',
        name: 'Linear Future Blueprint',
        emoji: '🔺',
        description: 'Triangular distribution, linear growth or decay',
        addresses: {
            sepolia: '0x5dE0BC82DcEbA8F1152198f4c810Dd44b9235698',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/linear_future.vy',
        abi: 'contracts/build/abis/linear-future.json'
    },
    
    'inverted-gaussian-future-blueprint': {
        type: 'future',
        name: 'Inverted Gaussian Future Blueprint',
        emoji: '🆄',
        description: 'U-shaped curve, high at extremes',
        addresses: {
            sepolia: '0xA79a88290Ec19F6Cad38C40C5ff4c9fAf9ecE6F0',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/market/inverted_gaussian_future.vy',
        abi: 'contracts/build/abis/inverted-gaussian-future.json'
    },
    
    // ========== IDENTITY ==========
    'badge-factory': {
        type: 'identity',
        name: 'Badge Factory',
        emoji: '🏭',
        description: 'Badge creation factory',
        addresses: {
            sepolia: '0x5802f9121018aabC887b9686bA2eB1EFABB70BB7',
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
            sepolia: '0x906E93e3901C87e0E3158B8eE8D4bF56d887C1D0',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/identity/badge.vy',
        abi: 'contracts/build/abis/badge-v2.json'
    },
    
    // ========== CONTENT ==========
    'content-factory-v4': {
        type: 'content',
        name: 'Content Factory V4',
        emoji: '🏭',
        description: 'Content creation factory',
        addresses: {
            sepolia: '0x010EFFB50047820Fe8cEADD04877B427c92008B2',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/content_factory_v4.vy',
        abi: 'contracts/build/abis/content-factory-v4.json'
    },
    
    'image-content-v3-blueprint': {
        type: 'content',
        name: 'Image Content V3 Blueprint',
        emoji: '🖼️',
        description: 'Image content blueprint',
        addresses: {
            sepolia: '0x609798Eb02e4Fb49B3e8eCf41432A2e64F22050a',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/image_content_v3.vy',
        abi: 'contracts/build/abis/image-content-v3.json'
    },
    
    'text-content-v4-blueprint': {
        type: 'content',
        name: 'Text Content V4 Blueprint',
        emoji: '📝',
        description: 'Text content blueprint',
        addresses: {
            sepolia: '0x3088506F35f48D43c5946993D11D5e67624EDd83',
            mainnet: '0x0000000000000000000000000000000000000000'
        },
        source: 'contracts/src/content/text_content_v4.vy',
        abi: 'contracts/build/abis/text-content-v4.json'
    },
    
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
export const FUTURES = getContractsByType('future');
export const IDENTITY = getContractsByType('identity');


