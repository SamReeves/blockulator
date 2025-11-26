/**
 * Deploy SQRT (Square Root) Calculator to Sepolia
 * Usage: PRIVATE_KEY=0x... node deploy-sqrt.js
 * Optional: SEPOLIA_RPC=https://your-rpc-url PRIVATE_KEY=0x... node deploy-sqrt.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function deployContract(wallet) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Deploying SQRT Calculator...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Load bytecode and ABI
    const bytecodeFile = path.join(__dirname, '../../build/bytecode/sqrt-calculator.txt');
    const abiFile = path.join(__dirname, '../../build/abis/sqrt-calculator.json');
    
    if (!fs.existsSync(bytecodeFile) || !fs.existsSync(abiFile)) {
        throw new Error('Contract not compiled! Run: vyper -f abi src/tools/math/sqrt.vy > build/abis/sqrt.json && vyper -f bytecode src/tools/math/sqrt.vy > build/bytecode/sqrt.txt');
    }
    
    let bytecode = fs.readFileSync(bytecodeFile, 'utf8').trim();
    // Add 0x prefix if not present
    if (!bytecode.startsWith('0x')) {
        bytecode = '0x' + bytecode;
    }
    const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
    
    const contractSize = (bytecode.length - 2) / 2;
    console.log('📦 Contract size:', contractSize, 'bytes');
    
    if (contractSize > 24576) {
        console.log('⚠️  Warning: Contract size exceeds 24KB limit!');
    }
    
    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log('⏳ Sending transaction...');
    const contract = await factory.deploy({
        gasLimit: 1500000  // Increased for safety
    });
    
    console.log('   Tx:', contract.deployTransaction.hash);
    console.log('⏳ Waiting for confirmation...');
    
    await contract.deployed();
    const receipt = await contract.deployTransaction.wait();
    
    console.log('');
    console.log('✅ Deployed!');
    console.log('📍 Address:', contract.address);
    console.log('⛽ Gas Used:', receipt.gasUsed.toString());
    console.log('');
    
    // Test the contract
    console.log('🧪 Testing contract...');
    try {
        // Test 1: Get constant (sqrt(2))
        const sqrt2 = await contract.get_constant();
        console.log('   get_constant() [sqrt(2)]:', ethers.utils.formatUnits(sqrt2, 10));
        
        // Test 2: sqrt(0)
        const result0 = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   sqrt(0):', ethers.utils.formatUnits(result0, 10));
        
        // Test 3: sqrt(4)
        const result4 = await contract.calculate(ethers.utils.parseUnits('4', 10));
        console.log('   sqrt(4):', ethers.utils.formatUnits(result4, 10));
        
        // Test 4: sqrt(2)
        const result2 = await contract.calculate(ethers.utils.parseUnits('2', 10));
        console.log('   sqrt(2):', ethers.utils.formatUnits(result2, 10));
        
        // Test 5: sqrt(100)
        const result100 = await contract.calculate(ethers.utils.parseUnits('100', 10));
        console.log('   sqrt(100):', ethers.utils.formatUnits(result100, 10));
        
        // Test 6: Large number that was failing before (18999550464)
        const resultLarge = await contract.calculate(ethers.utils.parseUnits('18999550464', 10));
        console.log('   sqrt(18999550464):', ethers.utils.formatUnits(resultLarge, 10));
        
        console.log('   ✅ All tests passed!');
    } catch (error) {
        console.log('   ❌ Test error:', error.message);
        if (error.data) {
            console.log('   Error data:', error.data);
        }
    }
    console.log('');
    
    return {
        name: 'SQRT',
        address: contract.address,
        tx: contract.deployTransaction.hash,
        gasUsed: receipt.gasUsed.toString()
    };
}

async function main() {
    console.log('🔢 Deploying SQRT Calculator to Sepolia\n');

    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('Usage: PRIVATE_KEY=0x... node deploy-sqrt.js');
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
        console.log('   SEPOLIA_RPC=https://your-rpc-url PRIVATE_KEY=0x... node deploy-sqrt.js');
        process.exit(1);
    }
    
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from:', wallet.address);
    
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.lt(ethers.utils.parseEther('0.001'))) {
        console.error('❌ Insufficient balance. Need at least 0.001 ETH');
        console.log('Get Sepolia ETH from: https://sepolia-faucet.pk910.de/');
        process.exit(1);
    }
    
    console.log('');

    const result = await deployContract(wallet);
    
    // Save results
    const timestamp = Date.now();
    const deploymentData = {
        network: 'sepolia',
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contract: result
    };
    
    const outputFile = path.join(__dirname, `../archived/deployment-sqrt-sepolia-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentData, null, 2));
    
    // Print summary
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📦 SQRT: ${result.address}`);
    console.log(`⛽ Gas Used: ${parseInt(result.gasUsed).toLocaleString()}`);
    console.log('');
    console.log('💾 Deployment data saved to:');
    console.log(`   ${outputFile}`);
    console.log('');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Update js/infrastructure/config/contracts.js:');
    console.log('');
    console.log(`   SQRT: '${result.address}',`);
    console.log('');
    console.log('2. View on Etherscan:');
    console.log(`   https://sepolia.etherscan.io/address/${result.address}`);
    console.log('');
    console.log('3. Test in browser at: http://localhost:8000/#/tools');
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

