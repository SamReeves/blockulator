/**
 * Deployment script for Discussion Board system
 * Run with: node contracts/deployments/deploy-discussions.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION - Update these before deploying
// You can use any of these public RPCs for Sepolia:
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE'; // NEVER commit this!
const NETWORK = 'sepolia'; // or 'mainnet'

async function main() {
    console.log('🚀 Starting Discussion Board Deployment...\n');

    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from address:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH\n');

    // Step 1: Deploy Discussion as Blueprint
    console.log('📝 Step 1: Deploying Discussion Blueprint...');
    
    // Read compiled blueprint bytecode (Vyper generates this with proper EIP-5202 preamble)
    const discussionBlueprintData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/discussion-blueprint.json'),
        'utf8'
    );
    
    const blueprintBytecode = JSON.parse(discussionBlueprintData).bytecode;
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
    
    console.log('✅ Discussion Blueprint deployed at:', blueprintAddress);
    console.log('   Gas used:', blueprintReceipt.gasUsed.toString(), '\n');

    // Step 2: Deploy Board contract
    console.log('📝 Step 2: Deploying Discussion Board...');
    
    // Load Board ABI and bytecode
    const boardAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/abis/board.json'), 'utf8')
    );
    const boardBytecode = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/bytecode/board.json'), 'utf8')
    ).bytecode;
    
    // Create factory and deploy
    // Board constructor: __init__(_discussion_blueprint: address, _owner: address)
    const BoardFactory = new ethers.ContractFactory(boardAbi, boardBytecode, wallet);
    const board = await BoardFactory.deploy(
        blueprintAddress,  // _discussion_blueprint
        wallet.address,    // _owner (deployer becomes owner)
        {
            gasLimit: 3000000
        }
    );
    
    console.log('⏳ Waiting for board deployment...');
    console.log('   Tx hash:', board.deployTransaction.hash);
    
    await board.deployed();
    
    console.log('✅ Discussion Board deployed at:', board.address);
    console.log('   Gas used:', (await board.deployTransaction.wait()).gasUsed.toString(), '\n');

    // Step 3: Verify deployment
    console.log('🔍 Step 3: Verifying deployment...');
    
    const storedBlueprint = await board.discussion_blueprint();
    console.log('   Blueprint address stored in board:', storedBlueprint);
    console.log('   Match:', storedBlueprint === blueprintAddress ? '✅' : '❌');
    
    const stats = await board.get_stats();
    console.log('   Initial stats:', {
        totalOnBoard: stats[0].toNumber(),
        totalCreated: stats[1].toNumber(),
        activeCount: stats[2].toNumber()
    });

    // Save addresses to file
    console.log('\n💾 Saving deployment addresses...');
    
    const deploymentInfo = {
        network: NETWORK,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {
            discussionBlueprint: blueprintAddress,
            board: board.address
        },
        transactions: {
            blueprint: blueprintReceipt.transactionHash,
            board: board.deployTransaction.hash
        }
    };
    
    // Update addresses.js
    const addressesPath = path.join(__dirname, 'addresses.js');
    let addressesContent = fs.readFileSync(addressesPath, 'utf8');
    
    // Replace SEPOLIA addresses (match any hex address)
    const sepoliaSection = addressesContent.match(/const SEPOLIA_ADDRESSES = \{[\s\S]*?\n\};/)[0];
    let updatedSection = sepoliaSection.replace(
        /DISCUSSION_BOARD: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BOARD: '${board.address}'`
    );
    updatedSection = updatedSection.replace(
        /DISCUSSION_BLUEPRINT: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BLUEPRINT: '${blueprintAddress}'`
    );
    addressesContent = addressesContent.replace(sepoliaSection, updatedSection);
    
    fs.writeFileSync(addressesPath, addressesContent);
    console.log('   Updated addresses.js');
    
    // Update contracts.js
    const contractsPath = path.join(__dirname, '../../js/infrastructure/config/contracts.js');
    let contractsContent = fs.readFileSync(contractsPath, 'utf8');
    
    // Find and update SEPOLIA_ADDRESSES section
    const contractsSepoliaSection = contractsContent.match(/const SEPOLIA_ADDRESSES = \{[\s\S]*?\n\};/)[0];
    let updatedContractsSection = contractsSepoliaSection.replace(
        /DISCUSSION_BOARD: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BOARD: '${board.address}'`
    );
    updatedContractsSection = updatedContractsSection.replace(
        /DISCUSSION_BLUEPRINT: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BLUEPRINT: '${blueprintAddress}'`
    );
    contractsContent = contractsContent.replace(contractsSepoliaSection, updatedContractsSection);
    
    fs.writeFileSync(contractsPath, contractsContent);
    console.log('   Updated contracts.js');
    
    // Save detailed deployment info
    fs.writeFileSync(
        path.join(__dirname, `deployment-${NETWORK}-${Date.now()}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log('   Saved deployment info');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Deployment Summary:');
    console.log('   Network:', NETWORK);
    console.log('   Discussion Blueprint:', blueprintAddress);
    console.log('   Discussion Board:', board.address);
    console.log('\n📝 Next Steps:');
    console.log('   1. Update discussions-app.js line 67 with board address');
    console.log('   2. Navigate to discussions.html and connect wallet');
    console.log('   3. Create your first discussion!');
    console.log('\n🔗 Etherscan Links:');
    const explorerBase = NETWORK === 'mainnet' 
        ? 'https://etherscan.io' 
        : `https://${NETWORK}.etherscan.io`;
    console.log('   Blueprint:', `${explorerBase}/address/${blueprintAddress}`);
    console.log('   Board:', `${explorerBase}/address/${board.address}`);
    console.log('\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });

