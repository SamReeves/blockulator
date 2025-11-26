/**
 * Deployment script for Futures Factory system
 * Run with: node contracts/deployments/deploy-factory.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION - Update these before deploying
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE'; // NEVER commit this!
const NETWORK = 'sepolia'; // or 'mainnet'

async function main() {
    console.log('🚀 Starting Futures Factory Deployment...\n');

    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from address:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH\n');

    // Step 1: Deploy Eulerian Future as Blueprint
    console.log('📝 Step 1: Deploying Eulerian Future Blueprint...');
    
    // Read compiled blueprint bytecode (Vyper generates this with proper EIP-5202 preamble)
    const futureBlueprintData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/eulerian-future-blueprint.json'),
        'utf8'
    );
    
    const blueprintBytecode = JSON.parse(futureBlueprintData).bytecode;
    const blueprintSize = (blueprintBytecode.length - 2) / 2; // bytes
    
    console.log('📦 Deploying EIP-5202 blueprint...', blueprintSize, 'bytes');
    
    const blueprintTx = await wallet.sendTransaction({
        data: blueprintBytecode,
        gasLimit: 3000000 // Adjust if needed
    });
    
    console.log('⏳ Waiting for blueprint deployment...');
    console.log('   Tx hash:', blueprintTx.hash);
    
    const blueprintReceipt = await blueprintTx.wait();
    const blueprintAddress = blueprintReceipt.contractAddress;
    
    console.log('✅ Eulerian Future Blueprint deployed at:', blueprintAddress);
    console.log('   Gas used:', blueprintReceipt.gasUsed.toString(), '\n');

    // Step 2: Deploy Future Factory contract
    console.log('📝 Step 2: Deploying Future Factory...');
    
    // Load Factory ABI and bytecode
    const factoryAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/abis/future-factory.json'), 'utf8')
    );
    const factoryBytecode = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/bytecode/future-factory.json'), 'utf8')
    ).bytecode;
    
    // Create factory and deploy
    // Factory constructor: __init__(_future_blueprint: address, _owner: address)
    const FactoryFactory = new ethers.ContractFactory(factoryAbi, factoryBytecode, wallet);
    const factory = await FactoryFactory.deploy(
        blueprintAddress,  // _future_blueprint
        wallet.address,    // _owner (deployer becomes owner)
        {
            gasLimit: 5000000
        }
    );
    
    console.log('⏳ Waiting for factory deployment...');
    console.log('   Tx hash:', factory.deployTransaction.hash);
    
    await factory.deployed();
    
    console.log('✅ Future Factory deployed at:', factory.address);
    console.log('   Gas used:', (await factory.deployTransaction.wait()).gasUsed.toString(), '\n');

    // Step 3: Verify deployment
    console.log('🔍 Step 3: Verifying deployment...');
    
    const storedBlueprint = await factory.future_blueprint();
    console.log('   Blueprint address stored in factory:', storedBlueprint);
    console.log('   Match:', storedBlueprint === blueprintAddress ? '✅' : '❌');
    
    const totalCreated = await factory.total_created();
    const totalTrades = await factory.total_trades();
    const futuresCount = await factory.get_futures_count();
    
    console.log('   Initial stats:', {
        totalCreated: totalCreated.toNumber(),
        totalTrades: totalTrades.toNumber(),
        futuresCount: futuresCount.toNumber()
    });

    // Save addresses to file
    console.log('\n💾 Saving deployment addresses...');
    
    const deploymentInfo = {
        network: NETWORK,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {
            eulerianFutureBlueprint: blueprintAddress,
            futureFactory: factory.address
        },
        transactions: {
            blueprint: blueprintReceipt.transactionHash,
            factory: factory.deployTransaction.hash
        }
    };
    
    // Update addresses.js
    const addressesPath = path.join(__dirname, 'addresses.js');
    let addressesContent = fs.readFileSync(addressesPath, 'utf8');
    
    // Add futures addresses if not present
    const sepoliaSection = addressesContent.match(/const SEPOLIA_ADDRESSES = \{[\s\S]*?\n\};/)[0];
    let updatedSection = sepoliaSection;
    
    // Check if futures addresses exist
    if (!updatedSection.includes('FUTURE_FACTORY')) {
        // Add futures addresses before the closing brace
        updatedSection = updatedSection.replace(
            /(\n\};)/,
            `,\n    \n    // Futures Market\n    FUTURE_FACTORY: '${factory.address}',\n    EULERIAN_FUTURE_BLUEPRINT: '${blueprintAddress}'$1`
        );
    } else {
        // Update existing addresses
        updatedSection = updatedSection.replace(
            /FUTURE_FACTORY: '0x[a-fA-F0-9]{40}'/,
            `FUTURE_FACTORY: '${factory.address}'`
        );
        updatedSection = updatedSection.replace(
            /EULERIAN_FUTURE_BLUEPRINT: '0x[a-fA-F0-9]{40}'/,
            `EULERIAN_FUTURE_BLUEPRINT: '${blueprintAddress}'`
        );
    }
    
    addressesContent = addressesContent.replace(sepoliaSection, updatedSection);
    fs.writeFileSync(addressesPath, addressesContent);
    console.log('   Updated addresses.js');
    
    // Save detailed deployment info
    fs.writeFileSync(
        path.join(__dirname, `deployment-factory-${NETWORK}-${Date.now()}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log('   Saved deployment info');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Deployment Summary:');
    console.log('   Network:', NETWORK);
    console.log('   Eulerian Future Blueprint:', blueprintAddress);
    console.log('   Future Factory:', factory.address);
    console.log('\n📝 Next Steps:');
    console.log('   1. Update js/infrastructure/config/contracts.js');
    console.log('   2. Navigate to factory.html and connect wallet');
    console.log('   3. Create your first future!');
    console.log('\n🔗 Etherscan Links:');
    const explorerBase = NETWORK === 'mainnet' 
        ? 'https://etherscan.io' 
        : `https://${NETWORK}.etherscan.io`;
    console.log('   Blueprint:', `${explorerBase}/address/${blueprintAddress}`);
    console.log('   Factory:', `${explorerBase}/address/${factory.address}`);
    console.log('\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });

