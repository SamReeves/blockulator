/**
 * Deploy FixedPoint128 to Sepolia Testnet
 * 
 * Prerequisites:
 *   1. Compile: ./contracts/deployments/compile-huff.sh contracts/src/tools/huff/test_fixedpoint128.huff
 *   2. Set environment: export PRIVATE_KEY=your_private_key
 *   3. Run: node contracts/deployments/deploy-fixedpoint128.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = 'sepolia';

// Load bytecode and ABI
function loadBytecode() {
    const p = path.join(__dirname, '../build/bytecode/test_fp128.json');
    if (!fs.existsSync(p)) {
        throw new Error('Bytecode not found. Run compile-huff.sh first.');
    }
    return JSON.parse(fs.readFileSync(p, 'utf8')).bytecode;
}

function loadABI() {
    const p = path.join(__dirname, '../build/abis/fixedpoint128.json');
    if (!fs.existsSync(p)) {
        throw new Error('ABI not found. Run compile-huff.sh first.');
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function deploy() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  FixedPoint128 Deployment to Sepolia');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Validate environment
    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY not set');
        console.log('   Set environment variable: export PRIVATE_KEY=your_private_key');
        process.exit(1);
    }
    
    // Setup provider and wallet
    console.log('🌐 Connecting to Sepolia...');
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deployer:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH\n');
    
    if (balance.lt(ethers.utils.parseEther('0.01'))) {
        console.warn('⚠️  Warning: Low balance. Get testnet ETH from https://sepolia-faucet.pk910.de/\n');
    }
    
    // Load contract artifacts
    console.log('📦 Loading contract artifacts...');
    const bytecode = loadBytecode();
    const abi = loadABI();
    console.log('   Bytecode size:', bytecode.length / 2 - 1, 'bytes');
    console.log('   ABI functions:', abi.length, '\n');
    
    // Deploy contract
    console.log('🚀 Deploying FixedPoint128...');
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    
    console.log('⏳ Waiting for deployment transaction...');
    console.log('   Tx hash:', contract.deployTransaction.hash);
    
    await contract.deployed();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ Deployment Successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 Contract Address:', contract.address);
    console.log('🔗 Sepolia Explorer:', `https://sepolia.etherscan.io/address/${contract.address}`);
    console.log('📝 Transaction:', `https://sepolia.etherscan.io/tx/${contract.deployTransaction.hash}\n`);
    
    // Test the deployed contract
    console.log('🧪 Testing deployed contract...');
    
    const ONE = ethers.BigNumber.from(1).shl(128); // 1.0 in 128.128 format
    const TWO = ethers.BigNumber.from(2).shl(128); // 2.0
    const THREE = ethers.BigNumber.from(3).shl(128); // 3.0
    
    try {
        // Test multiplication: 2 × 3 = 6
        console.log('   Testing: 2 × 3 = 6');
        const result = await contract.mulRaw(TWO, THREE);
        const expected = ethers.BigNumber.from(6).shl(128);
        
        if (result.eq(expected)) {
            console.log('   ✅ Test passed!\n');
        } else {
            console.log('   ⚠️  Result:', result.toString());
            console.log('   ⚠️  Expected:', expected.toString(), '\n');
        }
    } catch (error) {
        console.error('   ❌ Test failed:', error.message, '\n');
    }
    
    // Save deployment info
    const deploymentInfo = {
        network: NETWORK,
        contractName: 'FixedPoint128',
        address: contract.address,
        deployer: wallet.address,
        deployedAt: new Date().toISOString(),
        txHash: contract.deployTransaction.hash,
        bytecodeSize: bytecode.length / 2 - 1,
        gasUsed: (await contract.deployTransaction.wait()).gasUsed.toString()
    };
    
    const deploymentPath = path.join(__dirname, 'active/fixedpoint128-deployment.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('💾 Deployment info saved to:', deploymentPath);
    console.log('\n📋 Next steps:');
    console.log('   1. Update js/infrastructure/config/contract-registry.js');
    console.log(`   2. Set address to: ${contract.address}`);
    console.log('   3. Restart web server to load new contract\n');
    
    return contract.address;
}

// Run deployment
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    });
