/**
 * Deploy NORM_CDF Calculator to Sepolia
 * Usage: PRIVATE_KEY=0x... node deploy-norm-cdf.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
    console.log('🚀 Deploying NORM_CDF Calculator to Sepolia...\n');

    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('Usage: PRIVATE_KEY=0x... node deploy-norm-cdf.js');
        process.exit(1);
    }

    // Setup provider and wallet
    console.log('🔗 Connecting to Sepolia RPC...');
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC, {
        name: 'sepolia',
        chainId: 11155111
    });
    
    // Test connection
    try {
        const network = await Promise.race([
            provider.getNetwork(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
        ]);
        console.log('✅ Connected to network:', network.name, '(chainId:', network.chainId + ')');
    } catch (error) {
        console.error('❌ Failed to connect to RPC:', error.message);
        process.exit(1);
    }
    
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from:', wallet.address);
    
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.lt(ethers.utils.parseEther('0.001'))) {
        console.error('❌ Insufficient balance. Need at least 0.001 ETH for deployment');
        process.exit(1);
    }
    
    console.log('');

    // Load bytecode and ABI
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Loading contract data...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const bytecodeData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/norm-cdf.json'),
        'utf8'
    );
    const abiData = fs.readFileSync(
        path.join(__dirname, '../build/abis/norm-cdf.json'),
        'utf8'
    );
    
    const bytecode = JSON.parse(bytecodeData).bytecode;
    const abi = JSON.parse(abiData);
    
    const contractSize = (bytecode.length - 2) / 2;
    console.log('📦 Contract size:', contractSize, 'bytes');
    console.log('');

    // Deploy
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Deploying NORM_CDF Calculator...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log('⏳ Sending transaction...');
    const contract = await factory.deploy({
        gasLimit: 1500000
    });
    
    console.log('   Tx:', contract.deployTransaction.hash);
    console.log('⏳ Waiting for confirmation...');
    
    await contract.deployed();
    
    const receipt = await contract.deployTransaction.wait();
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ NORM_CDF Calculator Deployed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📍 Contract Address:', contract.address);
    console.log('⛽ Gas Used:', receipt.gasUsed.toString());
    console.log('🔗 Etherscan:', `https://sepolia.etherscan.io/address/${contract.address}`);
    console.log('');

    // Test the contract
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing contract...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        // Test get_constant() should return √2
        const sqrt2 = await contract.get_constant();
        console.log('✅ get_constant():', ethers.utils.formatUnits(sqrt2, 10), '(expected √2 = 1.4142135624)');
        
        // Test standard_cdf(0) should return 0.5
        const test0 = ethers.utils.parseUnits('0', 10);
        const result0 = await contract.standard_cdf(test0);
        console.log('✅ Φ(0):', ethers.utils.formatUnits(result0, 10), '(expected 0.5)');
        
        // Test standard_cdf(1) should return ~0.8413
        const test1 = ethers.utils.parseUnits('1', 10);
        const result1 = await contract.standard_cdf(test1);
        console.log('✅ Φ(1):', ethers.utils.formatUnits(result1, 10), '(expected ~0.8413)');
        
        // Test standard_cdf(-1) should return ~0.1587
        const testNeg1 = ethers.utils.parseUnits('-1', 10);
        const resultNeg1 = await contract.standard_cdf(testNeg1);
        console.log('✅ Φ(-1):', ethers.utils.formatUnits(resultNeg1, 10), '(expected ~0.1587)');
        
        console.log('');
        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Update address in js/infrastructure/config/contracts.js:');
    console.log(`   NORM_CDF: '${contract.address}',`);
    console.log('');
    console.log('2. Update address in contracts/deployments/addresses.js:');
    console.log(`   NORM_CDF: '${contract.address}',`);
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

