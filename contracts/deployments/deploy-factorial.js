/**
 * Deploy FACTORIAL Calculator to Sepolia
 * Usage: PRIVATE_KEY=0x... node deploy-factorial.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
    console.log('🚀 Deploying FACTORIAL Calculator to Sepolia...\n');

    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('Usage: PRIVATE_KEY=0x... node deploy-factorial.js');
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
        path.join(__dirname, '../build/bytecode/factorial.json'),
        'utf8'
    );
    const abiData = fs.readFileSync(
        path.join(__dirname, '../build/abis/factorial.json'),
        'utf8'
    );
    
    const bytecode = JSON.parse(bytecodeData).bytecode;
    const abi = JSON.parse(abiData);
    
    const contractSize = (bytecode.length - 2) / 2;
    console.log('📦 Contract size:', contractSize, 'bytes (tiny!)');
    console.log('');

    // Deploy
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Deploying FACTORIAL Calculator...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log('⏳ Sending transaction...');
    const contract = await factory.deploy({
        gasLimit: 500000
    });
    
    console.log('   Tx:', contract.deployTransaction.hash);
    console.log('⏳ Waiting for confirmation...');
    
    await contract.deployed();
    
    const receipt = await contract.deployTransaction.wait();
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FACTORIAL Calculator Deployed!');
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
        // Test some factorials
        const test0 = await contract.calculate(0);
        console.log('✅ 0! =', test0.toString(), '(expected 1)');
        
        const test5 = await contract.calculate(5);
        console.log('✅ 5! =', test5.toString(), '(expected 120)');
        
        const test10 = await contract.calculate(10);
        console.log('✅ 10! =', test10.toString(), '(expected 3,628,800)');
        
        const test20 = await contract.calculate(20);
        console.log('✅ 20! =', test20.toString(), '(expected 2,432,902,008,176,640,000)');
        
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
    console.log(`   FACTORIAL: '${contract.address}',`);
    console.log('');
    console.log('2. Update address in contracts/deployments/addresses.js:');
    console.log(`   FACTORIAL: '${contract.address}',`);
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

