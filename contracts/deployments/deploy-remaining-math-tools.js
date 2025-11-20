/**
 * Deploy Remaining Mathematical Tools to Sepolia
 * Usage: PRIVATE_KEY=0x... node deploy-remaining-math-tools.js
 * 
 * Deploys the 13 contracts not in deploy-all-math-tools.js:
 * - Math: ln, sqrt, erf, pow2, pow10, log2, log10
 * - Constants: e, pi, tau
 * - Trig: sin, cos, tanh
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract definitions
const CONTRACTS = [
    // Math tools
    { name: 'LN', file: 'ln', gasLimit: 1000000, category: 'Math' },
    { name: 'SQRT', file: 'sqrt', gasLimit: 1000000, category: 'Math' },
    { name: 'ERF', file: 'erf', gasLimit: 1000000, category: 'Math' },
    { name: 'POW2', file: 'pow2', gasLimit: 1000000, category: 'Math' },
    { name: 'POW10', file: 'pow10', gasLimit: 1000000, category: 'Math' },
    { name: 'LOG2', file: 'log2', gasLimit: 1000000, category: 'Math' },
    { name: 'LOG10', file: 'log10', gasLimit: 1000000, category: 'Math' },
    // Constants
    { name: 'E', file: 'e', gasLimit: 1000000, category: 'Constants' },
    { name: 'PI', file: 'pi', gasLimit: 1000000, category: 'Constants' },
    { name: 'TAU', file: 'tau', gasLimit: 1000000, category: 'Constants' },
    // Trigonometry
    { name: 'SIN', file: 'sin', gasLimit: 3000000, category: 'Trig' },
    { name: 'COS', file: 'cos', gasLimit: 3000000, category: 'Trig' },
    { name: 'TANH', file: 'tanh', gasLimit: 3000000, category: 'Trig' }
];

// Test functions for each contract
const TEST_FUNCTIONS = {
    LN: async (contract) => {
        const e = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(e, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('2.718281828', 10));
        console.log('   ln(e):', ethers.utils.formatUnits(result, 10));
    },
    SQRT: async (contract) => {
        const sqrt2 = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(sqrt2, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('4', 10));
        console.log('   sqrt(4):', ethers.utils.formatUnits(result, 10));
    },
    ERF: async (contract) => {
        const constant = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(constant, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   erf(0):', ethers.utils.formatUnits(result, 10));
    },
    POW2: async (contract) => {
        const two = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(two, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('3', 10));
        console.log('   2^3:', ethers.utils.formatUnits(result, 10));
    },
    POW10: async (contract) => {
        const ten = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(ten, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('2', 10));
        console.log('   10^2:', ethers.utils.formatUnits(result, 10));
    },
    LOG2: async (contract) => {
        const two = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(two, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('8', 10));
        console.log('   log2(8):', ethers.utils.formatUnits(result, 10));
    },
    LOG10: async (contract) => {
        const ten = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(ten, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('100', 10));
        console.log('   log10(100):', ethers.utils.formatUnits(result, 10));
    },
    E: async (contract) => {
        const e = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(e, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('1', 10));
        console.log('   e^1:', ethers.utils.formatUnits(result, 10));
    },
    PI: async (contract) => {
        const pi = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(pi, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   π^0:', ethers.utils.formatUnits(result, 10));
    },
    TAU: async (contract) => {
        const tau = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(tau, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   τ^0:', ethers.utils.formatUnits(result, 10));
    },
    SIN: async (contract) => {
        const one = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(one, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   sin(0):', ethers.utils.formatUnits(result, 10));
    },
    COS: async (contract) => {
        const one = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(one, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   cos(0):', ethers.utils.formatUnits(result, 10));
    },
    TANH: async (contract) => {
        const zero = await contract.get_constant();
        console.log('   get_constant():', ethers.utils.formatUnits(zero, 10));
        const result = await contract.calculate(ethers.utils.parseUnits('0', 10));
        console.log('   tanh(0):', ethers.utils.formatUnits(result, 10));
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
        category: contractDef.category
    };
}

async function main() {
    console.log('🚀 Deploying Remaining Mathematical Tools to Sepolia\n');
    console.log('📦 Total contracts: 13');
    console.log('   Math: 7 contracts');
    console.log('   Constants: 3 contracts');
    console.log('   Trig: 3 contracts');
    console.log('');

    if (!PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('Usage: PRIVATE_KEY=0x... node deploy-remaining-math-tools.js');
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
    
    if (balance.lt(ethers.utils.parseEther('0.01'))) {
        console.error('❌ Insufficient balance. Need at least 0.01 ETH');
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
    
    const outputFile = path.join(__dirname, `deployment-remaining-math-tools-sepolia-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentData, null, 2));
    
    // Display results
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📊 Deployed ${deployedContracts.length} of ${CONTRACTS.length} contracts`);
    console.log('');
    
    // Group by category
    const byCategory = {};
    deployedContracts.forEach(c => {
        if (!byCategory[c.category]) byCategory[c.category] = [];
        byCategory[c.category].push(c);
    });
    
    Object.keys(byCategory).forEach(category => {
        console.log(`📦 ${category.toUpperCase()} CONTRACTS:`);
        byCategory[category].forEach(c => {
            console.log(`   ${c.name}: ${c.address}`);
        });
        console.log('');
    });
    
    const totalGas = deployedContracts.reduce((sum, c) => sum + parseInt(c.gasUsed), 0);
    console.log(`⛽ Total Gas Used: ${totalGas.toLocaleString()}`);
    console.log('');
    console.log('💾 Deployment data saved to:');
    console.log(`   ${outputFile}`);
    console.log('');
    
    // Next steps
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Update js/infrastructure/config/contracts.js with new addresses');
    console.log('');
    console.log('2. View on Etherscan:');
    deployedContracts.forEach(c => {
        console.log(`   ${c.name}: https://sepolia.etherscan.io/address/${c.address}`);
    });
    console.log('');
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});





