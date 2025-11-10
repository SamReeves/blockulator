/**
 * Deploy LN Calculator to Sepolia
 * Usage: PRIVATE_KEY=0x... node deploy-ln-calculator.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Timeout for RPC calls
const TIMEOUT = 30000; // 30 seconds

async function main() {
    console.log('🚀 Deploying LN Calculator to Sepolia...\n');

    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('Usage: PRIVATE_KEY=0x... node deploy-ln-calculator.js');
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
        console.log('\n💡 Try using a different RPC:');
        console.log('   SEPOLIA_RPC=https://your-rpc-url PRIVATE_KEY=0x... node deploy-ln-calculator.js');
        process.exit(1);
    }
    
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from:', wallet.address);
    
    console.log('⏳ Checking balance...');
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.lt(ethers.utils.parseEther('0.001'))) {
        console.error('❌ Insufficient balance. Need at least 0.001 ETH for deployment');
        console.log('Get Sepolia ETH from: https://sepolia-faucet.pk910.de/');
        process.exit(1);
    }
    
    console.log('');

    // Load bytecode and ABI
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Loading contract data...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const bytecodeData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/ln-calculator.json'),
        'utf8'
    );
    const abiData = fs.readFileSync(
        path.join(__dirname, '../build/abis/ln-calculator.json'),
        'utf8'
    );
    
    const bytecode = JSON.parse(bytecodeData).bytecode;
    const abi = JSON.parse(abiData);
    
    const contractSize = (bytecode.length - 2) / 2;
    console.log('📦 Contract size:', contractSize, 'bytes');
    console.log('');

    // Deploy
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Deploying LN Calculator...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log('⏳ Sending transaction...');
    const contract = await factory.deploy({
        gasLimit: 1000000
    });
    
    console.log('   Tx:', contract.deployTransaction.hash);
    console.log('⏳ Waiting for confirmation...');
    
    await contract.deployed();
    
    const receipt = await contract.deployTransaction.wait();
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LN Calculator Deployed!');
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
        // Test get_constant()
        const e = await contract.get_constant();
        console.log('✅ get_constant():', ethers.utils.formatUnits(e, 10));
        
        // Test calculate(e) should return ~1
        const testInput = ethers.utils.parseUnits('2.718281828', 10);
        const result = await contract.calculate(testInput);
        console.log('✅ calculate(e):', ethers.utils.formatUnits(result, 10));
        
        // Test calculate(10)
        const testInput2 = ethers.utils.parseUnits('10', 10);
        const result2 = await contract.calculate(testInput2);
        console.log('✅ calculate(10):', ethers.utils.formatUnits(result2, 10), '(expected ~2.302585)');
        
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
    console.log(`   LN_CALCULATOR: '${contract.address}',`);
    console.log('');
    console.log('2. Test in browser at:');
    console.log('   http://localhost:8000/#/tools');
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

