/**
 * Local deployment script for Discussion Board
 * Deploys to Anvil local testnet
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Anvil default private key (first account)
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const RPC_URL = 'http://localhost:8545';

async function main() {
    console.log('🚀 Deploying Discussion Board to Local Anvil...\n');

    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH\n');

    // Step 1: Deploy Discussion Blueprint
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Step 1: Deploying Discussion Blueprint...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const discussionBlueprintData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/discussion-blueprint.json'),
        'utf8'
    );
    
    const blueprintBytecode = JSON.parse(discussionBlueprintData).bytecode;
    console.log('📦 Blueprint size:', (blueprintBytecode.length - 2) / 2, 'bytes');
    
    const blueprintTx = await wallet.sendTransaction({
        data: blueprintBytecode,
        gasLimit: 3000000
    });
    
    console.log('⏳ Waiting for transaction...');
    console.log('   Tx:', blueprintTx.hash);
    
    const blueprintReceipt = await blueprintTx.wait();
    const blueprintAddress = blueprintReceipt.contractAddress;
    
    console.log('✅ Discussion Blueprint deployed!');
    console.log('   Address:', blueprintAddress);
    console.log('   Gas used:', blueprintReceipt.gasUsed.toString());
    console.log('');

    // Step 2: Deploy Board
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Step 2: Deploying Board Contract...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const boardBytecodeData = fs.readFileSync(
        path.join(__dirname, '../build/bytecode/board.json'),
        'utf8'
    );
    const boardAbiData = fs.readFileSync(
        path.join(__dirname, '../build/abis/board.json'),
        'utf8'
    );
    
    const boardBytecode = JSON.parse(boardBytecodeData).bytecode;
    const boardAbi = JSON.parse(boardAbiData);
    
    console.log('📦 Board size:', (boardBytecode.length - 2) / 2, 'bytes');
    
    // Create contract factory
    const BoardFactory = new ethers.ContractFactory(boardAbi, boardBytecode, wallet);
    
    // Deploy with constructor args: blueprint address and owner address
    console.log('   Blueprint:', blueprintAddress);
    console.log('   Owner:', wallet.address);
    
    const board = await BoardFactory.deploy(blueprintAddress, wallet.address);
    await board.deployed();
    
    console.log('✅ Board deployed!');
    console.log('   Address:', board.address);
    console.log('');

    // Step 3: Verify deployment
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Verifying Deployment...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const owner = await board.owner();
    const storedBlueprint = await board.discussion_blueprint();
    const discussionCount = await board.get_discussion_count();
    
    console.log('✅ Owner:', owner);
    console.log('✅ Blueprint:', storedBlueprint);
    console.log('✅ Discussion count:', discussionCount.toString());
    console.log('');

    // Step 4: Update addresses
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Updating Configuration Files...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Update contracts.js
    const contractsPath = path.join(__dirname, '../../js/infrastructure/config/contracts.js');
    let contractsContent = fs.readFileSync(contractsPath, 'utf8');
    
    // Update Sepolia addresses (we'll use these for local testing)
    contractsContent = contractsContent.replace(
        /DISCUSSION_BOARD: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BOARD: '${board.address}'`
    );
    contractsContent = contractsContent.replace(
        /DISCUSSION_BLUEPRINT: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BLUEPRINT: '${blueprintAddress}'`
    );
    
    fs.writeFileSync(contractsPath, contractsContent);
    console.log('✅ Updated js/infrastructure/config/contracts.js');
    
    // Update addresses.js
    const addressesPath = path.join(__dirname, 'addresses.js');
    let addressesContent = fs.readFileSync(addressesPath, 'utf8');
    
    addressesContent = addressesContent.replace(
        /DISCUSSION_BOARD: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BOARD: '${board.address}'`
    );
    addressesContent = addressesContent.replace(
        /DISCUSSION_BLUEPRINT: '0x[a-fA-F0-9]{40}'/,
        `DISCUSSION_BLUEPRINT: '${blueprintAddress}'`
    );
    
    fs.writeFileSync(addressesPath, addressesContent);
    console.log('✅ Updated contracts/deployments/addresses.js');
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Contract Addresses:');
    console.log('   Discussion Blueprint:', blueprintAddress);
    console.log('   Board:', board.address);
    console.log('');
    
    console.log('🔗 Next Steps:');
    console.log('   1. Make sure MetaMask is connected to Anvil (localhost:8545, Chain ID 31337)');
    console.log('   2. Import this account to MetaMask:');
    console.log('      Private Key: ' + PRIVATE_KEY);
    console.log('   3. Open http://localhost:8000/discussions.html');
    console.log('   4. Create a discussion and verify it shows up!');
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });

