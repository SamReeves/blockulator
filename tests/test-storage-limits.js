/**
 * Empirical test to find maximum storage size for Bytes
 * Tests both local node (unlimited gas) and testnet (real limits)
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Test configuration
const SIZES_TO_TEST = [
    1024,      // 1KB
    4096,      // 4KB
    8192,      // 8KB
    16384,     // 16KB
    32768,     // 32KB
    49152,     // 48KB
    65536,     // 64KB
    98304,     // 96KB
    131072,    // 128KB
];

async function compileContract() {
    console.log('📝 Compiling storage_limit_test.vy...\n');
    
    try {
        // Compile with vyper
        const { stdout: bytecodeStdout, stderr } = await execPromise(
            'vyper -f bytecode contracts/src/tests/storage_limit_test.vy'
        );
        
        if (stderr) {
            console.error('Compilation warnings:', stderr);
        }
        
        const bytecode = bytecodeStdout.trim().startsWith('0x') 
            ? bytecodeStdout.trim() 
            : '0x' + bytecodeStdout.trim();
        
        // Also get ABI
        const { stdout: abiStdout } = await execPromise(
            'vyper -f abi contracts/src/tests/storage_limit_test.vy'
        );
        
        const abi = JSON.parse(abiStdout);
        
        console.log('✅ Contract compiled successfully');
        console.log(`   Bytecode size: ${(bytecode.length - 2) / 2} bytes\n`);
        
        return { bytecode, abi };
    } catch (error) {
        console.error('❌ Compilation failed:', error.message);
        throw error;
    }
}

function generateTestData(size) {
    /**
     * Generate deterministic test data
     * Pattern: repeating byte sequence for verification
     */
    const data = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
        data[i] = i % 256;
    }
    return '0x' + data.toString('hex');
}

async function testDeployment(provider, wallet, bytecode, abi, dataSize) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing size: ${dataSize.toLocaleString()} bytes (${(dataSize/1024).toFixed(1)}KB)`);
    console.log('='.repeat(60));
    
    try {
        // Generate test data
        const testData = generateTestData(dataSize);
        console.log(`📦 Generated ${dataSize} bytes of test data`);
        
        // Create contract factory
        const ContractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
        
        // Estimate gas
        console.log('⚙️  Estimating gas...');
        let gasEstimate;
        try {
            gasEstimate = await ContractFactory.signer.estimateGas(
                ContractFactory.getDeployTransaction(testData)
            );
            console.log(`   Estimated gas: ${gasEstimate.toLocaleString()}`);
        } catch (estimateError) {
            console.error(`   ❌ Gas estimation failed: ${estimateError.message}`);
            // Try with max gas
            gasEstimate = ethers.BigNumber.from(30000000);
            console.log(`   Using maximum gas: ${gasEstimate.toLocaleString()}`);
        }
        
        // Get current gas price
        const gasPrice = await provider.getGasPrice();
        const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
        console.log(`   Gas price: ${gasPriceGwei} gwei`);
        
        // Calculate cost
        const estimatedCost = gasEstimate.mul(gasPrice);
        console.log(`   Estimated cost: ${ethers.utils.formatEther(estimatedCost)} ETH`);
        
        // Deploy with extra gas buffer
        console.log('🚀 Deploying contract...');
        const contract = await ContractFactory.deploy(testData, {
            gasLimit: 30000000 // Use max gas for local testing
        });
        
        console.log('⏳ Waiting for deployment...');
        console.log(`   Tx hash: ${contract.deployTransaction.hash}`);
        
        const receipt = await contract.deployTransaction.wait();
        
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log(`   Contract address: ${contract.address}`);
        console.log(`   Gas used: ${receipt.gasUsed.toLocaleString()}`);
        console.log(`   Block number: ${receipt.blockNumber}`);
        
        // Verify data was stored correctly
        console.log('🔍 Verifying stored data...');
        const stats = await contract.get_stats();
        const actualSize = stats[0].toNumber();
        const deploymentGas = stats[1].toNumber();
        
        console.log(`   Stored size: ${actualSize.toLocaleString()} bytes`);
        console.log(`   Gas remaining at deployment: ${deploymentGas.toLocaleString()}`);
        
        // Verify hash
        const storedHash = await contract.get_data_hash();
        const expectedHash = ethers.utils.keccak256(testData);
        const hashMatch = storedHash === expectedHash;
        
        console.log(`   Hash verification: ${hashMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
        
        if (!hashMatch) {
            console.error(`   Expected: ${expectedHash}`);
            console.error(`   Got:      ${storedHash}`);
        }
        
        return {
            success: true,
            size: dataSize,
            gasUsed: receipt.gasUsed.toNumber(),
            gasEstimate: gasEstimate.toNumber(),
            cost: ethers.utils.formatEther(estimatedCost),
            address: contract.address,
            hashMatch
        };
        
    } catch (error) {
        console.error('❌ DEPLOYMENT FAILED');
        console.error(`   Error: ${error.message}`);
        
        // Check if it's a gas error
        if (error.message.includes('gas') || error.message.includes('limit')) {
            console.error('   Reason: GAS LIMIT EXCEEDED');
        } else if (error.message.includes('code size')) {
            console.error('   Reason: CONTRACT SIZE LIMIT EXCEEDED');
        } else if (error.message.includes('transaction') || error.message.includes('size')) {
            console.error('   Reason: TRANSACTION SIZE LIMIT EXCEEDED');
        } else if (error.message.includes('revert')) {
            console.error('   Reason: CONTRACT REVERTED');
        }
        
        return {
            success: false,
            size: dataSize,
            error: error.message
        };
    }
}

async function runTests(network = 'local') {
    console.log('🧪 Storage Limit Empirical Test');
    console.log('================================\n');
    
    // Setup provider based on network
    let provider, wallet;
    
    if (network === 'local') {
        console.log('📍 Testing on LOCAL NODE (Anvil)');
        console.log('   (High gas limits, finding practical maximum)\n');
        provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        
        // Use first Anvil account (well-funded test account)
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil/Hardhat default account #0, public test key — DO NOT FUND
        wallet = new ethers.Wallet(privateKey, provider);
        
    } else if (network === 'sepolia') {
        console.log('📍 Testing on SEPOLIA TESTNET');
        console.log('   (Real gas limits, finding practical maximum)\n');
        
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        if (!PRIVATE_KEY) {
            throw new Error('Set PRIVATE_KEY environment variable for testnet deployment');
        }
        
        provider = new ethers.providers.JsonRpcProvider(
            process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
        );
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    } else {
        throw new Error('Unknown network. Use "local" or "sepolia"');
    }
    
    const address = await wallet.getAddress();
    const balance = await wallet.getBalance();
    
    console.log(`Deployer: ${address}`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
    
    // Compile contract
    const { bytecode, abi } = await compileContract();
    
    // Run tests
    const results = [];
    
    for (const size of SIZES_TO_TEST) {
        const result = await testDeployment(provider, wallet, bytecode, abi, size);
        results.push(result);
        
        // If deployment failed, don't test larger sizes
        if (!result.success) {
            console.log('\n⚠️  Reached maximum size, stopping tests.');
            break;
        }
        
        // Small delay between deployments
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60) + '\n');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
        const maxSuccess = successful[successful.length - 1];
        console.log(`✅ Maximum successful size: ${maxSuccess.size.toLocaleString()} bytes (${(maxSuccess.size/1024).toFixed(1)}KB)`);
        console.log(`   Gas used: ${maxSuccess.gasUsed.toLocaleString()}`);
        console.log(`   Cost: ${maxSuccess.cost} ETH`);
        console.log(`   Contract: ${maxSuccess.address}`);
    }
    
    if (failed.length > 0) {
        const minFail = failed[0];
        console.log(`\n❌ First failure at: ${minFail.size.toLocaleString()} bytes (${(minFail.size/1024).toFixed(1)}KB)`);
        console.log(`   Error: ${minFail.error.substring(0, 100)}...`);
    }
    
    console.log('\n📊 Gas usage by size:');
    console.log('-'.repeat(60));
    successful.forEach(r => {
        const gasPerByte = r.gasUsed / r.size;
        console.log(`${(r.size/1024).toString().padStart(6)}KB: ${r.gasUsed.toLocaleString().padStart(10)} gas (${gasPerByte.toFixed(2)} gas/byte)`);
    });
    
    // Save results
    const resultsFile = path.join(__dirname, `storage-limits-${network}-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
}

// Run tests
const network = process.argv[2] || 'local';

runTests(network)
    .then(() => {
        console.log('\n✅ Tests complete');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });

