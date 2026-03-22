/**
 * Complete Deployment Script for Blockulator
 * Deploys ALL contracts to Sepolia in correct dependency order
 * 
 * Prerequisites:
 *   1. Run tests/compile-all.sh
 *   2. Set environment: export PRIVATE_KEY=your_private_key
 *   3. (Optional) Set RPC_URL (defaults to Sepolia public RPC)
 *   4. Run: node contracts/deployments/deploy-all.js
 * 
 * This script:
 *   - Deploys 48+ contracts in dependency order
 *   - Saves deployment record to active/
 *   - Auto-updates contract-registry.js with new addresses
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = 'sepolia';

// Game configuration (reasonable defaults)
const GAME_CONFIG = {
    pissingContest: { maxDonations: 100, minDonation: ethers.utils.parseEther('0.001') },
    messageBoard: { minFee: ethers.utils.parseEther('0.0001'), rateLimit: 60 },
    kingOfTheHill: { initialPrize: ethers.utils.parseEther('0.01') },
    diceGods: { minDonation: ethers.utils.parseEther('0.001') }
};

// Factory configuration
const FACTORY_CONFIG = {
    badge: { creationFee: 0, creationCooldown: 0 },
    content: { creationFee: 0, creationCooldown: 0 }
};

// ============================================================================
// DEPLOYMENT STATE
// ============================================================================

const deployments = {
    timestamp: new Date().toISOString(),
    network: NETWORK,
    deployer: null,
    contracts: {}
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadABI(name) {
    const p = path.join(__dirname, `../build/abis/${name}.json`);
    if (!fs.existsSync(p)) {
        throw new Error(`ABI not found for ${name}. Run compile-all.sh first.`);
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadBytecode(name) {
    const p = path.join(__dirname, `../build/bytecode/${name}.json`);
    if (!fs.existsSync(p)) {
        throw new Error(`Bytecode not found for ${name}. Run compile-all.sh first.`);
    }
    return JSON.parse(fs.readFileSync(p, 'utf8')).bytecode;
}

async function deployContract(wallet, name, displayName, args = []) {
    console.log(`\n📝 Deploying ${displayName}...`);
    
    const abi = loadABI(name);
    const bytecode = loadBytecode(name);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    const deployTx = factory.getDeployTransaction(...args);
    const gasEst = await wallet.estimateGas(deployTx);
    const gasLimit = gasEst.mul(130).div(100); // 30% buffer
    
    console.log(`   Gas estimate: ${gasEst.toString()} (using ${gasLimit.toString()})`);
    
    const contract = await factory.deploy(...args, { gasLimit });
    console.log(`   Tx: ${contract.deployTransaction.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    await contract.deployed();
    const receipt = await contract.deployTransaction.wait();
    
    console.log(`   ✅ Deployed at: ${contract.address}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    
    // Save deployment info
    deployments.contracts[name] = {
        address: contract.address,
        displayName,
        txHash: contract.deployTransaction.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        constructorArgs: args.map(a => a.toString ? a.toString() : a)
    };
    
    return contract;
}

async function deployBlueprint(wallet, name, displayName) {
    console.log(`\n📘 Deploying ${displayName} Blueprint...`);
    
    const p = path.join(__dirname, `../build/bytecode/${name}-blueprint.json`);
    if (!fs.existsSync(p)) {
        throw new Error(`Blueprint bytecode not found for ${name}. Run compile-all.sh first.`);
    }
    
    const blueprintBytecode = JSON.parse(fs.readFileSync(p, 'utf8')).bytecode;
    const size = (blueprintBytecode.length - 2) / 2;
    
    console.log(`   Blueprint size: ${size} bytes`);
    
    const gasEst = await wallet.estimateGas({ data: blueprintBytecode });
    const gasLimit = gasEst.mul(130).div(100);
    
    console.log(`   Gas estimate: ${gasEst.toString()} (using ${gasLimit.toString()})`);
    
    const tx = await wallet.sendTransaction({ 
        data: blueprintBytecode,
        gasLimit
    });
    
    console.log(`   Tx: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    
    console.log(`   ✅ Blueprint deployed at: ${receipt.contractAddress}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    
    // Save deployment info
    deployments.contracts[`${name}-blueprint`] = {
        address: receipt.contractAddress,
        displayName: `${displayName} Blueprint`,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
    };
    
    return receipt.contractAddress;
}

// ============================================================================
// DEPLOYMENT TIERS
// ============================================================================

async function deployTier1(wallet) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  TIER 1: Pure Contracts (No Dependencies)                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    // Calculators (core math)
    const exp = await deployContract(wallet, 'exp', 'Exponential (e^x)');
    const ln = await deployContract(wallet, 'ln', 'Natural Log (ln)');
    const sqrt = await deployContract(wallet, 'sqrt', 'Square Root');
    const factorial = await deployContract(wallet, 'factorial', 'Factorial');
    const atan = await deployContract(wallet, 'atan', 'Arctangent');
    const pow2 = await deployContract(wallet, 'pow2', 'Power of 2');
    const pow10 = await deployContract(wallet, 'pow10', 'Power of 10');
    const log2 = await deployContract(wallet, 'log2', 'Log Base 2');
    const log10 = await deployContract(wallet, 'log10', 'Log Base 10');
    const zscore = await deployContract(wallet, 'zscore', 'Z-Score');
    const gcd = await deployContract(wallet, 'gcd', 'GCD/LCM');
    
    // Trig
    const sin = await deployContract(wallet, 'sin', 'Sine');
    const cos = await deployContract(wallet, 'cos', 'Cosine');
    const tanh = await deployContract(wallet, 'tanh', 'Hyperbolic Tangent');
    
    // Constants
    const e = await deployContract(wallet, 'e', 'Euler\'s Number (e)');
    const pi = await deployContract(wallet, 'pi', 'Pi');
    const tau = await deployContract(wallet, 'tau', 'Tau');
    
    return { exp, ln, sqrt, factorial, atan, pow2, pow10, log2, log10, zscore, gcd, sin, cos, tanh, e, pi, tau };
}

async function deployTier2(wallet, tier1) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  TIER 2: Contracts with Tier 1 Dependencies                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    // These are pure contracts with no constructor args (they embed lookup tables)
    const lnFactorial = await deployContract(wallet, 'ln-factorial', 'Ln Factorial');
    const erf = await deployContract(wallet, 'erf', 'Error Function');
    const normCdf = await deployContract(wallet, 'norm-cdf', 'Normal CDF');
    const sinh = await deployContract(wallet, 'sinh', 'Hyperbolic Sine');
    const cosh = await deployContract(wallet, 'cosh', 'Hyperbolic Cosine');
    
    // These use staticcall and need calculator addresses
    const normPdf = await deployContract(wallet, 'norm-pdf', 'Normal PDF', [tier1.exp.address]);
    const gaussianTail = await deployContract(wallet, 'gaussian-tail', 'Gaussian Tail', [tier1.exp.address]);
    const binomialCoeff = await deployContract(wallet, 'binomial-coeff', 'Binomial Coefficient', [tier1.factorial.address]);
    
    return { lnFactorial, erf, normCdf, sinh, cosh, normPdf, gaussianTail, binomialCoeff };
}

async function deployTier3(wallet) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  TIER 3: Blueprint Contracts                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    // Future blueprints
    const bpUniform = await deployBlueprint(wallet, 'uniform-future', 'Uniform Future');
    const bpGaussian = await deployBlueprint(wallet, 'gaussian-future', 'Gaussian Future');
    const bpExpDecay = await deployBlueprint(wallet, 'exponential-future', 'Exponential Future');
    const bpExpGrowth = bpExpDecay; // Same contract, reused for growth
    const bpLinDecay = await deployBlueprint(wallet, 'linear-future', 'Linear Future');
    const bpLinGrowth = bpLinDecay; // Same contract, reused for growth
    
    // Identity blueprint
    const bpBadge = await deployBlueprint(wallet, 'badge', 'Badge');
    
    // Content blueprints
    const bpImage = await deployBlueprint(wallet, 'image-content-v3', 'Image Content V3');
    const bpText = await deployBlueprint(wallet, 'text-content-v4', 'Text Content V4');
    
    return { 
        bpUniform, bpGaussian, bpExpDecay, bpExpGrowth, 
        bpLinDecay, bpLinGrowth,
        bpBadge, bpImage, bpText 
    };
}

async function deployTier4(wallet, tier1, tier2, tier3) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  TIER 4: Factory Contracts                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    // Future Factory
    const futureFactory = await deployContract(
        wallet, 
        'future-factory', 
        'Future Factory',
        [
            tier3.bpUniform,
            tier3.bpGaussian,
            tier3.bpExpDecay,
            tier3.bpExpGrowth,
            tier3.bpLinDecay,
            tier3.bpLinGrowth,
            tier1.exp.address,
            tier2.gaussianTail.address,
            wallet.address
        ]
    );
    
    // Badge Factory
    const badgeFactory = await deployContract(
        wallet,
        'badge-factory',
        'Badge Factory',
        [
            tier3.bpBadge,
            wallet.address,
            FACTORY_CONFIG.badge.creationFee,
            FACTORY_CONFIG.badge.creationCooldown
        ]
    );
    
    // Content Factory V4
    const contentFactory = await deployContract(
        wallet,
        'content-factory-v4',
        'Content Factory V4',
        [
            tier3.bpText,
            tier3.bpImage,
            FACTORY_CONFIG.content.creationFee,
            FACTORY_CONFIG.content.creationCooldown
        ]
    );
    
    return { futureFactory, badgeFactory, contentFactory };
}

async function deployGames(wallet) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  GAMES: On-Chain Applications                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    const pissingContest = await deployContract(
        wallet, 
        'pissing-contest', 
        'Pissing Contest',
        [GAME_CONFIG.pissingContest.maxDonations, GAME_CONFIG.pissingContest.minDonation]
    );
    
    const messageBoard = await deployContract(
        wallet,
        'message-board',
        'Message Board',
        [GAME_CONFIG.messageBoard.minFee, GAME_CONFIG.messageBoard.rateLimit]
    );
    
    const payItForward = await deployContract(wallet, 'pay-it-forward', 'Pay It Forward');
    const payItBackward = await deployContract(wallet, 'pay-it-backward', 'Pay It Backward');
    
    const kingOfTheHill = await deployContract(
        wallet,
        'king-of-the-hill',
        'King of the Hill',
        [GAME_CONFIG.kingOfTheHill.initialPrize]
    );
    
    const lastCall = await deployContract(wallet, 'last-call', 'Last Call');
    const donuts = await deployContract(wallet, 'time-to-make-the-donuts', 'Time to Make the Donuts');
    
    const diceGods = await deployContract(
        wallet,
        'dice-gods',
        'Dice Gods',
        [GAME_CONFIG.diceGods.minDonation]
    );
    
    const satanMolochBaal = await deployContract(wallet, 'satan-moloch-baal', 'Satan Moloch Baal');
    
    return { pissingContest, messageBoard, payItForward, payItBackward, kingOfTheHill, lastCall, donuts, diceGods, satanMolochBaal };
}

// ============================================================================
// REGISTRY UPDATE
// ============================================================================

function updateContractRegistry() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  UPDATING CONTRACT REGISTRY                                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    const registryPath = path.join(__dirname, '../../js/infrastructure/config/contract-registry.js');
    let registryContent = fs.readFileSync(registryPath, 'utf8');
    
    // Mapping from deployment name to registry key
    const nameMap = {
        'exp': 'exp',
        'ln': 'ln',
        'sqrt': 'sqrt',
        'factorial': 'factorial',
        'ln-factorial': 'ln-factorial',
        'erf': 'erf',
        'norm-cdf': 'norm-cdf',
        'atan': 'atan',
        'pow2': 'pow2',
        'pow10': 'pow10',
        'log2': 'log2',
        'log10': 'log10',
        'sinh': 'sinh',
        'cosh': 'cosh',
        'zscore': 'zscore',
        'gaussian-tail': 'gaussian-tail',
        'binomial-coeff': 'binomial-coeff',
        'norm-pdf': 'norm-pdf',
        'gcd': 'gcd',
        'sin': 'sin-calculator',
        'cos': 'cos-calculator',
        'tanh': 'tanh-calculator',
        'e': 'e-calculator',
        'pi': 'pi-calculator',
        'tau': 'tau-calculator',
        'uniform-future-blueprint': 'uniform-future-blueprint',
        'gaussian-future-blueprint': 'gaussian-future-blueprint',
        'exponential-future-blueprint': 'exponential-future-blueprint',
        'linear-future-blueprint': 'linear-future-blueprint',
        'future-factory': 'future-factory',
        'badge-blueprint': 'badge-blueprint',
        'badge-factory': 'badge-factory',
        'image-content-v3-blueprint': 'image-content-v3-blueprint',
        'text-content-v4-blueprint': 'text-content-v4-blueprint',
        'content-factory-v4': 'content-factory-v4',
        'pissing-contest': 'pissing-contest',
        'message-board': 'message-board',
        'pay-it-forward': 'pay-it-forward',
        'pay-it-backward': 'pay-it-backward',
        'king-of-the-hill': 'king-of-the-hill',
        'last-call': 'last-call',
        'time-to-make-the-donuts': 'time-to-make-the-donuts',
        'dice-gods': 'dice-gods',
        'satan-moloch-baal': 'satan-moloch-baal'
    };
    
    let updateCount = 0;
    
    for (const [deployName, contractInfo] of Object.entries(deployments.contracts)) {
        const registryKey = nameMap[deployName];
        if (!registryKey) {
            console.log(`   ⚠️  No registry mapping for ${deployName}, skipping`);
            continue;
        }
        
        // Find the registry entry and update the Sepolia address
        const pattern = new RegExp(
            `('${registryKey}':\\s*\\{[^}]*sepolia:\\s*)'0x[0-9a-fA-F]{40}'`,
            'g'
        );
        
        const newContent = registryContent.replace(
            pattern,
            `$1'${contractInfo.address}'`
        );
        
        if (newContent !== registryContent) {
            console.log(`   ✅ Updated ${registryKey}: ${contractInfo.address}`);
            registryContent = newContent;
            updateCount++;
        } else {
            console.log(`   ⚠️  Pattern not found for ${registryKey}`);
        }
    }
    
    // Write updated registry
    fs.writeFileSync(registryPath, registryContent, 'utf8');
    console.log(`\n   💾 Updated ${updateCount} addresses in contract-registry.js`);
}

// ============================================================================
// HELPER: Resume from failed deployment
// ============================================================================

function loadPartialDeployment() {
    // Find the most recent failed deployment JSON
    const activeDir = path.join(__dirname, 'active');
    const files = fs.readdirSync(activeDir);
    const failedFiles = files.filter(f => f.startsWith('deployment-FAILED-'));
    
    if (failedFiles.length === 0) {
        throw new Error('No failed deployment found to resume from');
    }
    
    // Sort by timestamp (newest first)
    failedFiles.sort().reverse();
    const latestFailed = failedFiles[0];
    const filepath = path.join(activeDir, latestFailed);
    
    console.log(`\n📂 Loading partial deployment from: ${latestFailed}\n`);
    
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function reconstructTier1FromPartial(partial, wallet) {
    // Create contract instances from already-deployed addresses
    const tier1 = {};
    
    const mapping = {
        'exp': 'exp',
        'ln': 'ln',
        'sqrt': 'sqrt',
        'factorial': 'factorial',
        'atan': 'atan',
        'pow2': 'pow2',
        'pow10': 'pow10',
        'log2': 'log2',
        'log10': 'log10',
        'zscore': 'zscore',
        'gcd': 'gcd',
        'sin': 'sin',
        'cos': 'cos',
        'tanh': 'tanh',
        'e': 'e',
        'pi': 'pi',
        'tau': 'tau'
    };
    
    for (const [key, name] of Object.entries(mapping)) {
        if (partial.contracts[name]) {
            const address = partial.contracts[name].address;
            const abi = loadABI(name);
            tier1[key] = new ethers.Contract(address, abi, wallet);
            console.log(`   ✅ Loaded ${name}: ${address}`);
        }
    }
    
    // Copy partial deployment data into current deployment
    deployments.timestamp = partial.timestamp;
    deployments.contracts = { ...partial.contracts };
    
    return tier1;
}

// ============================================================================
// MAIN DEPLOYMENT
// ============================================================================

async function main() {
    // Check for --resume flag
    const isResume = process.argv.includes('--resume');
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║          BLOCKULATOR - COMPLETE DEPLOYMENT SCRIPT             ║');
    if (isResume) {
        console.log('║                   (RESUME MODE)                               ║');
    }
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    // Check prerequisites
    if (!PRIVATE_KEY) {
        console.error('❌ ERROR: PRIVATE_KEY environment variable not set!');
        console.error('   Set it with: export PRIVATE_KEY=your_private_key_here');
        process.exit(1);
    }
    
    // Setup provider and wallet
    console.log('🔌 Connecting to network...');
    console.log(`   RPC: ${RPC_URL}`);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    deployments.deployer = wallet.address;
    
    console.log(`\n📍 Deploying from: ${wallet.address}`);
    
    const balance = await wallet.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.5'))) {
        console.warn('\n⚠️  WARNING: Balance may be insufficient for full deployment!');
        console.warn('   Recommended: 0.5+ ETH for all contracts\n');
    } else {
        console.log('✅ Sufficient balance for deployment\n');
    }
    
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})\n`);
    
    console.log('⏳ Starting deployment... This will take several minutes.\n');
    
    try {
        // Deploy in dependency order (or resume from partial)
        let tier1;
        if (isResume) {
            const partial = loadPartialDeployment();
            tier1 = reconstructTier1FromPartial(partial, wallet);
            console.log(`\n✅ Resuming with ${Object.keys(tier1).length} already-deployed Tier 1 contracts\n`);
        } else {
            tier1 = await deployTier1(wallet);
        }
        
        const tier2 = await deployTier2(wallet, tier1);
        const tier3 = await deployTier3(wallet);
        const tier4 = await deployTier4(wallet, tier1, tier2, tier3);
        const games = await deployGames(wallet);
        
        // Save deployment record
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║  SAVING DEPLOYMENT RECORD                                     ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        
        const timestamp = Date.now();
        const filename = `deployment-all-${NETWORK}-${timestamp}.json`;
        const filepath = path.join(__dirname, 'active', filename);
        
        fs.writeFileSync(filepath, JSON.stringify(deployments, null, 2), 'utf8');
        console.log(`   💾 Saved: ${filename}`);
        
        // Update contract registry
        updateContractRegistry();
        
        // Print summary
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║  DEPLOYMENT COMPLETE!                                         ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        
        console.log('📊 Summary:');
        console.log(`   Total contracts deployed: ${Object.keys(deployments.contracts).length}`);
        console.log(`   Network: ${NETWORK}`);
        console.log(`   Deployer: ${wallet.address}`);
        console.log(`   Deployment record: ${filename}\n`);
        
        // Calculate total gas used
        let totalGas = ethers.BigNumber.from(0);
        for (const contract of Object.values(deployments.contracts)) {
            totalGas = totalGas.add(ethers.BigNumber.from(contract.gasUsed));
        }
        console.log(`   Total gas used: ${totalGas.toString()}`);
        console.log(`   Estimated cost: ~${ethers.utils.formatEther(totalGas.mul(20000000000))} ETH @ 20 gwei\n`);
        
        // Key contracts
        console.log('🔑 Key Contract Addresses:\n');
        console.log('   Factories:');
        console.log(`      Future Factory:  ${deployments.contracts['future-factory'].address}`);
        console.log(`      Badge Factory:   ${deployments.contracts['badge-factory'].address}`);
        console.log(`      Content Factory: ${deployments.contracts['content-factory-v4'].address}`);
        console.log();
        console.log('   Core Calculators:');
        console.log(`      exp:             ${deployments.contracts['exp'].address}`);
        console.log(`      gaussian-tail:   ${deployments.contracts['gaussian-tail'].address}`);
        console.log(`      zscore:          ${deployments.contracts['zscore'].address}`);
        console.log(`      sqrt:            ${deployments.contracts['sqrt'].address}`);
        console.log(`      pow2:            ${deployments.contracts['pow2'].address}`);
        console.log();
        
        console.log('🔗 Explorer:');
        console.log(`   https://${NETWORK}.etherscan.io/address/${wallet.address}\n`);
        
        console.log('✅ Contract registry automatically updated!');
        console.log('   Refresh your browser to use the new contracts.\n');
        
    } catch (error) {
        console.error('\n❌ DEPLOYMENT FAILED!\n');
        console.error('Error:', error.message);
        
        // Save partial deployment info
        const timestamp = Date.now();
        const filename = `deployment-FAILED-${NETWORK}-${timestamp}.json`;
        const filepath = path.join(__dirname, 'active', filename);
        
        deployments.error = error.message;
        deployments.failedAt = new Date().toISOString();
        
        fs.writeFileSync(filepath, JSON.stringify(deployments, null, 2), 'utf8');
        console.error(`\n💾 Partial deployment info saved: ${filename}\n`);
        
        throw error;
    }
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\nFATAL ERROR:', error);
        process.exit(1);
    });
