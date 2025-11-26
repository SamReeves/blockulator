/**
 * Deploy Factories Only (Blueprints + Factories)
 * Run with: node contracts/deployments/deploy-factories-only.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = process.env.NETWORK || 'sepolia';

const PARAMS = {
    contentFactory: {
        creationFee: 0,
        creationCooldown: 300
    },
    badgeFactory: {
        creationFee: 0,
        creationCooldown: 300
    }
};

function loadBytecode(contractName) {
    const bytecodePath = path.join(__dirname, `../build/bytecode/${contractName}.json`);
    if (!fs.existsSync(bytecodePath)) {
        throw new Error(`Bytecode not found for ${contractName}`);
    }
    return JSON.parse(fs.readFileSync(bytecodePath, 'utf8')).bytecode;
}

function loadContractData(contractName) {
    const abiPath = path.join(__dirname, `../build/abis/${contractName}.json`);
    const bytecodePath = path.join(__dirname, `../build/bytecode/${contractName}.json`);
    
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const bytecode = JSON.parse(fs.readFileSync(bytecodePath, 'utf8')).bytecode;
    
    return { abi, bytecode };
}

async function deployBlueprint(wallet, name, bytecode) {
    console.log(`\n📘 Deploying ${name} Blueprint...`);
    const tx = await wallet.sendTransaction({
        data: bytecode,
        gasLimit: 3000000
    });
    console.log(`   ⏳ Tx: ${tx.hash}`);
    const receipt = await tx.wait();
    const address = receipt.contractAddress;
    console.log(`   ✅ Address: ${address}`);
    console.log(`   ⛽ Gas: ${receipt.gasUsed.toString()}`);
    return address;
}

async function deployContract(wallet, name, abi, bytecode, args = []) {
    console.log(`\n📝 Deploying ${name}...`);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(...args, { gasLimit: 5000000 });
    console.log(`   ⏳ Tx: ${contract.deployTransaction.hash}`);
    await contract.deployed();
    console.log(`   ✅ Address: ${contract.address}`);
    return contract;
}

async function main() {
    console.log('🏭 ══════════════════════════════════════════════════════');
    console.log('🏭  DEPLOYING FACTORIES ONLY');
    console.log('🏭  (Games already deployed)');
    console.log('🏭 ══════════════════════════════════════════════════════\n');

    if (!PRIVATE_KEY) {
        console.error('❌ Set PRIVATE_KEY environment variable!');
        process.exit(1);
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deployer:', wallet.address);
    console.log('💰 Balance:', ethers.utils.formatEther(await wallet.getBalance()), 'ETH\n');

    const deployed = {
        network: NETWORK,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        factories: {},
        blueprints: {}
    };

    try {
        // Future Factory
        console.log('\n📈 Futures Market');
        const futureBlueprintBytecode = loadBytecode('eulerian-future-blueprint');
        const futureBlueprint = await deployBlueprint(wallet, 'Eulerian Future', futureBlueprintBytecode);
        deployed.blueprints.eulerianFuture = futureBlueprint;

        const factoryData = loadContractData('future-factory');
        const futureFactory = await deployContract(
            wallet, 'Future Factory', factoryData.abi, factoryData.bytecode,
            [futureBlueprint, wallet.address]
        );
        deployed.factories.futureFactory = futureFactory.address;

        // Discussion Board
        console.log('\n💭 Discussion Board');
        const discussionBlueprintBytecode = loadBytecode('discussion-blueprint');
        const discussionBlueprint = await deployBlueprint(wallet, 'Discussion', discussionBlueprintBytecode);
        deployed.blueprints.discussion = discussionBlueprint;

        const boardData = loadContractData('board');
        const board = await deployContract(
            wallet, 'Discussion Board', boardData.abi, boardData.bytecode,
            [discussionBlueprint, wallet.address]
        );
        deployed.factories.discussionBoard = board.address;

        // Content Factory
        console.log('\n🖼️  Content Factory');
        const contentBlueprintBytecode = loadBytecode('content-blueprint');
        const contentBlueprint = await deployBlueprint(wallet, 'Content', contentBlueprintBytecode);
        deployed.blueprints.content = contentBlueprint;

        const contentFactoryData = loadContractData('content-factory');
        const contentFactory = await deployContract(
            wallet, 'Content Factory', contentFactoryData.abi, contentFactoryData.bytecode,
            [contentBlueprint, wallet.address, PARAMS.contentFactory.creationFee, PARAMS.contentFactory.creationCooldown]
        );
        deployed.factories.contentFactory = contentFactory.address;

        // Badge Factory
        console.log('\n🏅 Badge Factory');
        const badgeBlueprintBytecode = loadBytecode('badge-blueprint');
        const badgeBlueprint = await deployBlueprint(wallet, 'Badge', badgeBlueprintBytecode);
        deployed.blueprints.badge = badgeBlueprint;

        const badgeFactoryData = loadContractData('badge-factory');
        const badgeFactory = await deployContract(
            wallet, 'Badge Factory', badgeFactoryData.abi, badgeFactoryData.bytecode,
            [badgeBlueprint, wallet.address, PARAMS.badgeFactory.creationFee, PARAMS.badgeFactory.creationCooldown]
        );
        deployed.factories.badgeFactory = badgeFactory.address;

        // Save results
        const outputFile = path.join(__dirname, `deployment-factories-${NETWORK}-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(deployed, null, 2));

        console.log('\n\n✅ ══════════════════════════════════════════════════════');
        console.log('✅  ALL FACTORIES DEPLOYED!');
        console.log('✅ ══════════════════════════════════════════════════════\n');

        console.log('📊 ADDRESSES:\n');
        console.log('Blueprints:');
        Object.entries(deployed.blueprints).forEach(([name, addr]) => {
            console.log(`  ${name}: ${addr}`);
        });
        console.log('\nFactories:');
        Object.entries(deployed.factories).forEach(([name, addr]) => {
            console.log(`  ${name}: ${addr}`);
        });

        console.log('\n💾 Saved to:', outputFile);
        console.log('\n🎉 Zero-fee protocol complete!\n');

    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

