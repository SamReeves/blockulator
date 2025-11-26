/**
 * Deployment script for Badge system (32x32 pixel art badges)
 * Run with: node contracts/deployments/deploy-badges.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION - Update these before deploying
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Load from environment
const NETWORK = 'sepolia'; // or 'mainnet'

// Badge Factory Configuration
const CREATION_FEE = 0; // 0 = free badges (change if you want to charge)
const CREATION_COOLDOWN = 0; // 0 = no cooldown (change to prevent spam)

async function main() {
    console.log('🎨 Starting Badge System Deployment...\n');
    console.log('📐 Deploying 32x32 RGB pixel art badges');
    console.log('💾 Storage: 3,072 bytes per badge');
    console.log('💰 Estimated cost per badge: ~60,000 gas (~$5-10)\n');

    // Check for private key
    if (!PRIVATE_KEY) {
        console.error('❌ ERROR: PRIVATE_KEY environment variable not set!');
        console.error('   Set it with: export PRIVATE_KEY=your_private_key_here');
        process.exit(1);
    }

    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from address:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.lt(ethers.utils.parseEther('0.01'))) {
        console.warn('⚠️  WARNING: Low balance! You may need more ETH for deployment.\n');
    } else {
        console.log('✅ Sufficient balance for deployment\n');
    }

    // Step 1: Deploy Badge as Blueprint
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Step 1: Deploying Badge Blueprint (EIP-5202)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Read compiled blueprint bytecode
    const badgeBlueprintData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/badge-blueprint.json'),
        'utf8'
    );
    
    const blueprintBytecode = JSON.parse(badgeBlueprintData).bytecode;
    const blueprintSize = (blueprintBytecode.length - 2) / 2; // bytes
    
    console.log('📦 Blueprint size:', blueprintSize, 'bytes');
    console.log('🔷 Deploying EIP-5202 blueprint contract...');
    
    const blueprintTx = await wallet.sendTransaction({
        data: blueprintBytecode,
        gasLimit: 1000000 // Badge blueprint is small
    });
    
    console.log('⏳ Waiting for blueprint deployment...');
    console.log('   Tx hash:', blueprintTx.hash);
    console.log('   Explorer:', `https://${NETWORK}.etherscan.io/tx/${blueprintTx.hash}`);
    
    const blueprintReceipt = await blueprintTx.wait();
    const blueprintAddress = blueprintReceipt.contractAddress;
    
    console.log('✅ Badge Blueprint deployed!');
    console.log('   Address:', blueprintAddress);
    console.log('   Gas used:', blueprintReceipt.gasUsed.toString());
    console.log('   Block:', blueprintReceipt.blockNumber);
    console.log();

    // Step 2: Deploy Badge Factory
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Step 2: Deploying Badge Factory...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Read factory ABI and bytecode
    const factoryAbiData = fs.readFileSync(
        path.join(__dirname, '../build/abis/badge-factory.json'),
        'utf8'
    );
    const factoryAbi = JSON.parse(factoryAbiData);
    
    const factoryBytecodeData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/badge-factory.json'),
        'utf8'
    );
    const factoryBytecode = JSON.parse(factoryBytecodeData).bytecode;
    const factorySize = (factoryBytecode.length - 2) / 2; // bytes
    
    console.log('📦 Factory size:', factorySize, 'bytes');
    console.log('⚙️  Configuration:');
    console.log('   Blueprint:', blueprintAddress);
    console.log('   Owner:', wallet.address);
    console.log('   Creation Fee:', CREATION_FEE, 'wei');
    console.log('   Creation Cooldown:', CREATION_COOLDOWN, 'seconds');
    console.log();
    
    // Create factory contract instance
    const BadgeFactory = new ethers.ContractFactory(factoryAbi, factoryBytecode, wallet);
    
    console.log('🚀 Deploying Badge Factory...');
    const factory = await BadgeFactory.deploy(
        blueprintAddress,     // _badge_blueprint
        wallet.address,       // _owner
        CREATION_FEE,        // _creation_fee
        CREATION_COOLDOWN    // _creation_cooldown
    );
    
    console.log('⏳ Waiting for factory deployment...');
    console.log('   Tx hash:', factory.deployTransaction.hash);
    console.log('   Explorer:', `https://${NETWORK}.etherscan.io/tx/${factory.deployTransaction.hash}`);
    
    await factory.deployed();
    const factoryReceipt = await factory.deployTransaction.wait();
    
    console.log('✅ Badge Factory deployed!');
    console.log('   Address:', factory.address);
    console.log('   Gas used:', factoryReceipt.gasUsed.toString());
    console.log('   Block:', factoryReceipt.blockNumber);
    console.log();

    // Step 3: Verify deployment
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Step 3: Verifying Deployment...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        const registeredBlueprint = await factory.badge_blueprint();
        const factoryOwner = await factory.owner();
        const creationFee = await factory.creation_fee();
        const creationCooldown = await factory.creation_cooldown();
        const totalBadges = await factory.total_badges();
        
        console.log('🔍 Factory State:');
        console.log('   Blueprint:', registeredBlueprint);
        console.log('   Owner:', factoryOwner);
        console.log('   Creation Fee:', creationFee.toString(), 'wei');
        console.log('   Creation Cooldown:', creationCooldown.toString(), 'seconds');
        console.log('   Total Badges:', totalBadges.toString());
        console.log();
        
        if (registeredBlueprint.toLowerCase() !== blueprintAddress.toLowerCase()) {
            console.error('❌ ERROR: Blueprint address mismatch!');
            process.exit(1);
        }
        
        console.log('✅ All checks passed!');
        console.log();
    } catch (error) {
        console.error('❌ ERROR verifying deployment:', error.message);
        process.exit(1);
    }

    // Step 4: Save deployment info
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 Step 4: Saving Deployment Info...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const deploymentInfo = {
        network: NETWORK,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {
            badgeBlueprint: {
                address: blueprintAddress,
                txHash: blueprintTx.hash,
                blockNumber: blueprintReceipt.blockNumber,
                gasUsed: blueprintReceipt.gasUsed.toString()
            },
            badgeFactory: {
                address: factory.address,
                txHash: factory.deployTransaction.hash,
                blockNumber: factoryReceipt.blockNumber,
                gasUsed: factoryReceipt.gasUsed.toString(),
                config: {
                    blueprint: blueprintAddress,
                    owner: wallet.address,
                    creationFee: CREATION_FEE,
                    creationCooldown: CREATION_COOLDOWN
                }
            }
        }
    };
    
    const deploymentFilename = `deployment-badges-${NETWORK}-${Date.now()}.json`;
    const deploymentPath = path.join(__dirname, deploymentFilename);
    
    fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('✅ Deployment info saved to:', deploymentFilename);
    console.log();

    // Step 5: Update frontend config
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Step 5: Frontend Configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Update the following in js/infrastructure/config/contracts.js:\n');
    console.log('const SEPOLIA_ADDRESSES = {');
    console.log('    // ... existing contracts ...');
    console.log('');
    console.log('    // Identity');
    console.log(`    BADGE_FACTORY: '${factory.address}',`);
    console.log(`    BADGE_BLUEPRINT: '${blueprintAddress}',`);
    console.log('    ...');
    console.log('}\n');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Summary:');
    console.log(`   Badge Blueprint:  ${blueprintAddress}`);
    console.log(`   Badge Factory:    ${factory.address}`);
    console.log(`   Network:          ${NETWORK}`);
    console.log(`   Deployer:         ${wallet.address}`);
    console.log();
    
    console.log('🔗 Explorer Links:');
    console.log(`   Blueprint: https://${NETWORK}.etherscan.io/address/${blueprintAddress}`);
    console.log(`   Factory:   https://${NETWORK}.etherscan.io/address/${factory.address}`);
    console.log();
    
    console.log('📝 Next Steps:');
    console.log('   1. Update js/infrastructure/config/contracts.js with the factory address');
    console.log('   2. Refresh your browser');
    console.log('   3. Navigate to "Badges" section');
    console.log('   4. Create your first 32x32 pixel art badge! 🎨');
    console.log();
    
    console.log('💡 Tip: Test with a small pixel art first to verify everything works!');
    console.log();
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ DEPLOYMENT FAILED!\n');
        console.error(error);
        process.exit(1);
    });

