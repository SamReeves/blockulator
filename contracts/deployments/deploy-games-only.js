/**
 * Game Contracts Deployment Script (Zero-Fee)
 * 
 * Deploys all 9 game contracts with zero owner extraction
 * 
 * Run with: node contracts/deployments/deploy-games-only.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = process.env.NETWORK || 'sepolia';

// Game-specific parameters
const PARAMS = {
    pissingContest: {
        maxDonations: 10,
        minDonation: ethers.utils.parseEther('0.001')
    },
    messageBoard: {
        minPostFee: ethers.utils.parseEther('0.0001'),
        rateLimit: 60
    }
};

function loadContractData(contractName) {
    const abiPath = path.join(__dirname, `../build/abis/${contractName}.json`);
    const bytecodePath = path.join(__dirname, `../build/bytecode/${contractName}.json`);
    
    if (!fs.existsSync(abiPath) || !fs.existsSync(bytecodePath)) {
        throw new Error(`Missing files for ${contractName}. Run compile-and-prepare.sh first!`);
    }
    
    return {
        abi: JSON.parse(fs.readFileSync(abiPath, 'utf8')),
        bytecode: JSON.parse(fs.readFileSync(bytecodePath, 'utf8')).bytecode
    };
}

async function deployGame(wallet, name, contractName, args = []) {
    console.log(`\n🎮 Deploying ${name}...`);
    
    const { abi, bytecode } = loadContractData(contractName);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    const contract = await factory.deploy(...args, { gasLimit: 3000000 });
    console.log(`   ⏳ Tx: ${contract.deployTransaction.hash}`);
    
    await contract.deployed();
    const receipt = await contract.deployTransaction.wait();
    
    console.log(`   ✅ Address: ${contract.address}`);
    console.log(`   ⛽ Gas: ${receipt.gasUsed.toString()}`);
    
    return {
        address: contract.address,
        txHash: contract.deployTransaction.hash,
        gasUsed: receipt.gasUsed.toString()
    };
}

async function main() {
    console.log('🎲 ══════════════════════════════════════════════════════');
    console.log('🎲  ZERO-FEE GAMES DEPLOYMENT');
    console.log('🎲  Winners get 100% | No owner extraction');
    console.log('🎲 ══════════════════════════════════════════════════════\n');

    if (!PRIVATE_KEY) {
        console.error('❌ Set PRIVATE_KEY environment variable!');
        process.exit(1);
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deployer:', wallet.address);
    console.log('💰 Balance:', ethers.utils.formatEther(await wallet.getBalance()), 'ETH');
    console.log('🌐 Network:', NETWORK);

    const deployed = {
        network: NETWORK,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        games: {}
    };

    try {
        // Deploy all games
        deployed.games.kingOfTheHill = await deployGame(
            wallet,
            'King of the Hill',
            'king-of-the-hill',
            [ethers.utils.parseEther('0.01')]  // Starting prize: 0.01 ETH
        );

        deployed.games.timeToMakeTheDonuts = await deployGame(
            wallet,
            'Time to Make the Donuts',
            'time-to-make-the-donuts'
        );

        deployed.games.lastCall = await deployGame(
            wallet,
            'Last Call',
            'last-call'
        );

        deployed.games.pissingContest = await deployGame(
            wallet,
            'Pissing Contest',
            'pissing-contest',
            [PARAMS.pissingContest.maxDonations, PARAMS.pissingContest.minDonation]
        );

        deployed.games.payItForward = await deployGame(
            wallet,
            'Pay It Forward',
            'pay-it-forward'
        );

        deployed.games.payItBackward = await deployGame(
            wallet,
            'Pay It Backward',
            'pay-it-backward'
        );

        deployed.games.messageBoard = await deployGame(
            wallet,
            'Message Board',
            'message-board',
            [PARAMS.messageBoard.minPostFee, PARAMS.messageBoard.rateLimit]
        );

        deployed.games.diceGods = await deployGame(
            wallet,
            'Dice Gods',
            'dice-gods',
            [ethers.utils.parseEther('0.001')]  // Minimum donation: 0.001 ETH
        );

        deployed.games.satanMolochBaal = await deployGame(
            wallet,
            'Satan Moloch Baal',
            'satan-moloch-baal'
        );

        // Save results
        const outputFile = path.join(
            __dirname,
            `deployment-games-${NETWORK}-${Date.now()}.json`
        );
        fs.writeFileSync(outputFile, JSON.stringify(deployed, null, 2));

        console.log('\n\n✅ ══════════════════════════════════════════════════════');
        console.log('✅  ALL GAMES DEPLOYED!');
        console.log('✅ ══════════════════════════════════════════════════════\n');

        Object.entries(deployed.games).forEach(([name, info]) => {
            console.log(`${name}:`, info.address);
        });

        console.log('\n💾 Saved to:', outputFile);
        console.log('\n🎮 All games operate with ZERO owner extraction! 🎉\n');

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

