/**
 * Deploy All Mathematical Tools to Sepolia
 * Usage: PRIVATE_KEY=0x... node deploy-all-math-tools.js
 * 
 * Deploys:
 * - Tier 1: exp, factorial, norm_cdf
 * - Tier 2: ln_factorial, atan, sinh, cosh
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract definitions
const CONTRACTS = [
    // Tier 1
    { name: 'EXP', file: 'exp', gasLimit: 1000000, tier: 1 },
    { name: 'FACTORIAL', file: 'factorial', gasLimit: 500000, tier: 1 },
    { name: 'NORM_CDF', file: 'norm-cdf', gasLimit: 1500000, tier: 1 },
    // Tier 2
    { name: 'LN_FACTORIAL', file: 'ln-factorial', gasLimit: 500000, tier: 2 },
    { name: 'ATAN', file: 'atan', gasLimit: 3000000, tier: 2 },
    { name: 'SINH', file: 'sinh', gasLimit: 1000000, tier: 2 },
    { name: 'COSH', file: 'cosh', gasLimit: 1000000, tier: 2 }
];

// Test functions for each contract
const TEST_FUNCTIONS = {
    EXP: async (contract) => {
        const e = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(e, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('1', 10));
        console.log('   calculate(1):', ethers.utils.formatUnits(result, 10));
    },
    FACTORIAL: async (contract) => {
        const result0 = await contract.calculate(0);
        console.log('   0! =', result0.toString());
        const result5 = await contract.calculate(5);
        console.log('   5! =', result5.toString());
        const result10 = await contract.calculate(10);
        console.log('   10! =', result10.toString());
    },
    NORM_CDF: async (contract) => {
        const sqrt2 = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(sqrt2, 10));
        const result0 = await contract.standard_cdf(ethers.utils.parseUnits('0', 10));
        console.log('   Φ(0):', ethers.utils.formatUnits(result0, 10));
        const result1 = await contract.standard_cdf(ethers.utils.parseUnits('1', 10));
        console.log('   Φ(1):', ethers.utils.formatUnits(result1, 10));
    },
    LN_FACTORIAL: async (contract) => {
        const ln2 = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(ln2, 10));
        const result5 = await contract.calculate(5);
        console.log('   ln(5!):', ethers.utils.formatUnits(result5, 10));
        const result10 = await contract.calculate(10);
        console.log('   ln(10!):', ethers.utils.formatUnits(result10, 10));
    },
    ATAN: async (contract) => {
        const pi4 = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(pi4, 10));
        const result0 = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   atan(0):', ethers.utils.formatUnits(result0, 10));
        const result1 = await contract.calculate(ethers.utils.parseUnits('1', 10));
        console.log('   atan(1):', ethers.utils.formatUnits(result1, 10));
    },
    SINH: async (contract) => {
        const sinh1 = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(sinh1, 10));
        const result0 = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   sinh(0):', ethers.utils.formatUnits(result0, 10));
        const result1 = await contract.calculate(ethers.utils.parseUnits('1', 10));
        console.log('   sinh(1):', ethers.utils.formatUnits(result1, 10));
    },
    COSH: async (contract) => {
        const cosh0 = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(cosh0, 10));
        const result0 = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   cosh(0):', ethers.utils.formatUnits(result0, 10));
        const result1 = await contract.calculate(ethers.utils.parseUnits('1', 10));
        console.log('   cosh(1):', ethers.utils.formatUnits(result1, 10));
    }
};

async function deployContract(wallet, contractDef) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Deploying ${contractDef.name}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Load bytecode and ABI
    const bytecodeData = fs.readFileSync(
        path.join(__dirname, `../build/bytecode/${contractDef.file}.json`),
        'utf8'
    );
    const abiData = fs.readFileSync(
        path.join(__dirname, `../build/abis/${contractDef.file}.json`),
        'utf8'
    );
    
    const bytecode = JSON.parse(bytecodeData).bytecode;
    const abi = JSON.parse(abiData);
    
    const contractSize = (bytecode.length - 2) / 2;
    console.log('📦 Contract size:', contractSize, 'bytes');
    
    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log('⏳ Sending transaction...');
    const contract = await factory.deploy({
        gasLimit: contractDef.gasLimit
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
    console.log('🧪 Testing...');
    try {
        const testFn = TEST_FUNCTIONS[contractDef.name];
        if (testFn) {
            await testFn(contract);
            console.log('   ✅ Tests passed!');
        }
    } catch (error) {
        console.log('   ⚠️  Test error:', error.message);
    }
    console.log('');
    
    return {
        name: contractDef.name,
        address: contract.address,
        tx: contract.deployTransaction.hash,
        gasUsed: receipt.gasUsed.toString(),
        tier: contractDef.tier
    };
}

async function main() {
    console.log('🚀 Deploying All Mathematical Tools to Sepolia\n');
    console.log('📦 Total contracts: 7');
    console.log('   Tier 1: 3 contracts (exp, factorial, norm_cdf)');
    console.log('   Tier 2: 4 contracts (ln_factorial, atan, sinh, cosh)');
    console.log('');

    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('Usage: PRIVATE_KEY=0x... node deploy-all-math-tools.js');
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
        console.log('   SEPOLIA_RPC=https://your-rpc-url PRIVATE_KEY=0x... node deploy-all-math-tools.js');
        process.exit(1);
    }
    
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from:', wallet.address);
    
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.lt(ethers.utils.parseEther('0.01'))) {
        console.error('❌ Insufficient balance. Need at least 0.01 ETH for all deployments');
        console.log('Get Sepolia ETH from: https://sepolia-faucet.pk910.de/');
        process.exit(1);
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Starting Deployments...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const deployedContracts = [];
    
    // Deploy all contracts
    for (const contractDef of CONTRACTS) {
        try {
            const result = await deployContract(wallet, contractDef);
            deployedContracts.push(result);
            
            // Small delay between deployments
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to deploy ${contractDef.name}:`, error.message);
            console.log('Continuing with remaining contracts...\n');
        }
    }
    
    // Save results
    const timestamp = Date.now();
    const deploymentData = {
        network: 'sepolia',
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: deployedContracts
    };
    
    const outputFile = path.join(__dirname, `deployment-math-tools-sepolia-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentData, null, 2));
    
    // Print summary
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📊 Deployed ${deployedContracts.length} of ${CONTRACTS.length} contracts`);
    console.log('');
    
    // Tier 1 summary
    console.log('📦 TIER 1 CONTRACTS:');
    deployedContracts.filter(c => c.tier === 1).forEach(contract => {
        console.log(`   ${contract.name}: ${contract.address}`);
    });
    console.log('');
    
    // Tier 2 summary
    console.log('📦 TIER 2 CONTRACTS:');
    deployedContracts.filter(c => c.tier === 2).forEach(contract => {
        console.log(`   ${contract.name}: ${contract.address}`);
    });
    console.log('');
    
    // Total gas used
    const totalGas = deployedContracts.reduce((sum, c) => sum + parseInt(c.gasUsed), 0);
    console.log('⛽ Total Gas Used:', totalGas.toLocaleString());
    console.log('');
    
    console.log('💾 Deployment data saved to:');
    console.log(`   ${outputFile}`);
    console.log('');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Update contracts/deployments/addresses.js:');
    console.log('');
    deployedContracts.forEach(contract => {
        console.log(`   ${contract.name}: '${contract.address}',`);
    });
    console.log('');
    console.log('2. Update js/infrastructure/config/contracts.js with same addresses');
    console.log('');
    console.log('3. View on Etherscan:');
    deployedContracts.forEach(contract => {
        console.log(`   ${contract.name}: https://sepolia.etherscan.io/address/${contract.address}`);
    });
    console.log('');
    console.log('4. Test in browser at: http://localhost:8000/#/tools');
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

