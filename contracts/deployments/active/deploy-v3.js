/**
 * Deploy V3 Compression System
 * 
 * Deployment Order:
 * 1. Deploy ImageContentV3 as blueprint (immutable template)
 * 2. Deploy ContentFactoryV3 pointing to blueprint
 * 3. Verify on Etherscan
 * 4. Save addresses to registry
 */

const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

// Configuration
const NETWORK = process.env.NETWORK || 'sepolia';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INFURA_KEY = process.env.INFURA_KEY;

// Creation settings
const CREATION_FEE = ethers.utils.parseEther('0'); // Free
const CREATION_COOLDOWN = 0; // No cooldown

async function main() {
    console.log('🚀 Deploying V3 Compression System\n');
    
    // Setup provider and wallet
    const provider = new ethers.providers.InfuraProvider(NETWORK, INFURA_KEY);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📡 Network: ${NETWORK}`);
    console.log(`👤 Deployer: ${wallet.address}`);
    
    const balance = await wallet.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
    
    if (balance.lt(ethers.utils.parseEther('0.1'))) {
        console.warn('⚠️  Low balance! You may not have enough ETH for deployment.\n');
    }
    
    // Load compiled contracts
    const blueprintAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/abis/image_content_v3.json'), 'utf8')
    );
    let blueprintBytecode = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/image_content_v3_blueprint.bin'), 'utf8'
    ).trim();
    if (!blueprintBytecode.startsWith('0x')) {
        blueprintBytecode = '0x' + blueprintBytecode;
    }
    
    const factoryAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/abis/content_factory_v3.json'), 'utf8')
    );
    let factoryBytecode = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/content_factory_v3.bin'), 'utf8'
    ).trim();
    if (!factoryBytecode.startsWith('0x')) {
        factoryBytecode = '0x' + factoryBytecode;
    }
    
    console.log('📦 Contract sizes:');
    console.log(`   Blueprint: ${(blueprintBytecode.length / 2).toLocaleString()} bytes`);
    console.log(`   Factory:   ${(factoryBytecode.length / 2).toLocaleString()} bytes\n`);
    
    // Step 1: Deploy Blueprint
    console.log('📝 Step 1: Deploying ImageContentV3 Blueprint...');
    
    // Deploy blueprint as raw bytecode (no constructor call)
    const deployTx = await wallet.sendTransaction({
        data: blueprintBytecode,
        gasLimit: 5000000
    });
    
    console.log(`   Transaction: ${deployTx.hash}`);
    const receipt = await deployTx.wait();
    const blueprintAddress = receipt.contractAddress;
    
    console.log(`✅ Blueprint deployed: ${blueprintAddress}\n`);
    
    // Wait for confirmations
    console.log('⏳ Waiting for 2 confirmations...');
    await wallet.provider.waitForTransaction(deployTx.hash, 2);
    console.log('✅ Confirmed\n');
    
    // Step 2: Deploy Factory
    console.log('📝 Step 2: Deploying ContentFactoryV3...');
    const FactoryContract = new ethers.ContractFactory(factoryAbi, factoryBytecode, wallet);
    
    const factory = await FactoryContract.deploy(
        blueprintAddress,
        CREATION_FEE,
        CREATION_COOLDOWN,
        {
            gasLimit: 5000000
        }
    );
    await factory.deployed();
    
    console.log(`✅ Factory deployed: ${factory.address}`);
    console.log(`   Transaction: ${factory.deployTransaction.hash}\n`);
    
    // Wait for confirmations
    console.log('⏳ Waiting for 2 confirmations...');
    await factory.deployTransaction.wait(2);
    console.log('✅ Confirmed\n');
    
    // Step 3: Verify deployment
    console.log('🔍 Verifying deployment...');
    
    try {
        const owner = await factory.owner();
        const blueprintAddr = await factory.blueprint();
        const creationFee = await factory.creation_fee();
        const cooldown = await factory.creation_cooldown();
        
        console.log(`✅ Factory owner: ${owner}`);
        console.log(`✅ Factory blueprint: ${blueprintAddr}`);
        console.log(`✅ Creation fee: ${ethers.utils.formatEther(creationFee)} ETH`);
        console.log(`✅ Cooldown: ${cooldown} seconds\n`);
        
        // Test pure functions (these cost 0 gas!)
        console.log('🧪 Testing pure functions (0 gas)...');
        
        const rgbMaxDims = await factory.callStatic.calculate_max_dimensions(0);
        console.log(`   RGB max: ${rgbMaxDims[0]}×${rgbMaxDims[0]} (${rgbMaxDims[2]} pixels)`);
        
        const grayMaxDims = await factory.callStatic.calculate_max_dimensions(1);
        console.log(`   Grayscale max: ${grayMaxDims[0]}×${grayMaxDims[0]} (${grayMaxDims[2]} pixels)`);
        
        const monoMaxDims = await factory.callStatic.calculate_max_dimensions(2);
        console.log(`   Monochrome max: ${monoMaxDims[0]}×${monoMaxDims[0]} (${monoMaxDims[2]} pixels)`);
        
        const indexedMaxDims = await factory.callStatic.calculate_max_dimensions(3);
        console.log(`   Indexed max: ${indexedMaxDims[0]}×${indexedMaxDims[0]} (${indexedMaxDims[2]} pixels)\n`);
        
        // Test gas estimation
        const rgbGas = await factory.callStatic.estimate_gas_cost(0, 15987);
        console.log(`   Estimated gas for 73×73 RGB: ${rgbGas.toNumber().toLocaleString()}\n`);
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
    
    // Step 4: Save deployment info
    const deployment = {
        network: NETWORK,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {
            blueprint: {
                address: blueprintAddress,
                txHash: deployTx.hash
            },
            factory: {
                address: factory.address,
                txHash: factory.deployTransaction.hash,
                creationFee: ethers.utils.formatEther(CREATION_FEE),
                creationCooldown: CREATION_COOLDOWN
            }
        },
        etherscanUrls: {
            blueprint: `https://${NETWORK === 'mainnet' ? '' : NETWORK + '.'}etherscan.io/address/${blueprintAddress}`,
            factory: `https://${NETWORK === 'mainnet' ? '' : NETWORK + '.'}etherscan.io/address/${factory.address}`
        }
    };
    
    const deploymentFile = path.join(
        __dirname,
        `deployment-v3-${NETWORK}-${Date.now()}.json`
    );
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    console.log(`💾 Deployment info saved: ${deploymentFile}\n`);
    
    // Print summary
    console.log('🎉 DEPLOYMENT COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Blueprint:  ${blueprintAddress}`);
    console.log(`Factory:    ${factory.address}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('📝 Next steps:');
    console.log('   1. Verify contracts on Etherscan (optional but recommended)');
    console.log('   2. Update js/infrastructure/config/contract-registry.js');
    console.log('   3. Test with compression-demo.html');
    console.log('   4. Deploy to production\n');
    
    console.log('🔗 Etherscan links:');
    console.log(`   Blueprint: ${deployment.etherscanUrls.blueprint}`);
    console.log(`   Factory:   ${deployment.etherscanUrls.factory}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });

