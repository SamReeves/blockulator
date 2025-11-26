/**
 * Deploy a standalone Discussion contract for testing (without board)
 * Run with: node contracts/deployments/deploy-standalone-discussion.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';

// Discussion parameters
const DISCUSSION_CONFIG = {
    subject: "Test Discussion",
    body: "This is a test discussion deployed without a board for testing purposes.",
    maxMessages: 100,
    maxMessageLength: 200,
    minDonation: ethers.utils.parseEther("0.001"), // 0.001 ETH
    initialValue: ethers.utils.parseEther("0.01") // 0.01 ETH initial pool
};

async function main() {
    console.log('🚀 Deploying Standalone Discussion for Testing...\n');

    // Setup
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH\n');

    // Load ABI and bytecode
    const discussionAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/abis/discussion.json'), 'utf8')
    );
    const discussionBytecode = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../build/bytecode/discussion.json'), 'utf8')
    ).bytecode;

    // Create factory
    const DiscussionFactory = new ethers.ContractFactory(
        discussionAbi, 
        discussionBytecode, 
        wallet
    );

    console.log('📝 Deploying discussion with config:');
    console.log('   Subject:', DISCUSSION_CONFIG.subject);
    console.log('   Body:', DISCUSSION_CONFIG.body);
    console.log('   Max Messages:', DISCUSSION_CONFIG.maxMessages);
    console.log('   Max Message Length:', DISCUSSION_CONFIG.maxMessageLength);
    console.log('   Min Donation:', ethers.utils.formatEther(DISCUSSION_CONFIG.minDonation), 'ETH');
    console.log('   Initial Value:', ethers.utils.formatEther(DISCUSSION_CONFIG.initialValue), 'ETH\n');

    // Deploy
    // NOTE: Using wallet address as "board" - this means only you can terminate it
    const discussion = await DiscussionFactory.deploy(
        wallet.address,  // Use your own address as "board" for testing
        DISCUSSION_CONFIG.subject,
        DISCUSSION_CONFIG.body,
        DISCUSSION_CONFIG.maxMessages,
        DISCUSSION_CONFIG.maxMessageLength,
        DISCUSSION_CONFIG.minDonation,
        {
            value: DISCUSSION_CONFIG.initialValue,
            gasLimit: 3000000
        }
    );

    console.log('⏳ Waiting for deployment...');
    console.log('   Tx hash:', discussion.deployTransaction.hash);

    await discussion.deployed();
    const receipt = await discussion.deployTransaction.wait();

    console.log('✅ Discussion deployed at:', discussion.address);
    console.log('   Gas used:', receipt.gasUsed.toString(), '\n');

    // Verify deployment
    console.log('🔍 Verifying deployment...');
    
    const subject = await discussion.subject();
    const creator = await discussion.creator();
    const totalPool = await discussion.total_pool();
    const config = await discussion.get_config();
    const status = await discussion.get_status();

    console.log('   Subject:', subject);
    console.log('   Creator:', creator);
    console.log('   Total Pool:', ethers.utils.formatEther(totalPool), 'ETH');
    console.log('   Config:', {
        maxMessages: config[0].toNumber(),
        maxMessageLength: config[1].toNumber(),
        minDonation: ethers.utils.formatEther(config[2]) + ' ETH'
    });
    console.log('   Status:', {
        terminated: status[0],
        messageCount: status[1].toNumber(),
        survivorCount: status[4].toNumber()
    });

    // Test posting a message
    console.log('\n📨 Testing message posting...');
    
    const minDonation = config[2];
    const testMessage = "Hello from the test script!";
    
    console.log('   Posting message with', ethers.utils.formatEther(minDonation), 'ETH donation...');
    
    const postTx = await discussion.post_message(testMessage, {
        value: minDonation,
        gasLimit: 500000
    });
    
    console.log('   Tx hash:', postTx.hash);
    await postTx.wait();
    
    console.log('✅ Message posted successfully!\n');

    // Verify message
    const messages = await discussion.get_all_messages();
    console.log('   Total messages:', messages.length);
    if (messages.length > 0) {
        const msg = messages[0];
        console.log('   First message:', {
            author: msg.author,
            content: msg.content,
            donation: ethers.utils.formatEther(msg.donation) + ' ETH'
        });
    }

    // Save deployment info
    console.log('\n💾 Saving deployment info...');
    
    const deploymentInfo = {
        network: 'sepolia',
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        discussion: {
            address: discussion.address,
            subject: DISCUSSION_CONFIG.subject,
            config: {
                maxMessages: DISCUSSION_CONFIG.maxMessages,
                maxMessageLength: DISCUSSION_CONFIG.maxMessageLength,
                minDonation: ethers.utils.formatEther(DISCUSSION_CONFIG.minDonation) + ' ETH'
            }
        },
        transaction: discussion.deployTransaction.hash
    };
    
    fs.writeFileSync(
        path.join(__dirname, `standalone-discussion-${Date.now()}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   Discussion Address:', discussion.address);
    console.log('   You are the "board":', wallet.address);
    console.log('   Initial Pool:', ethers.utils.formatEther(DISCUSSION_CONFIG.initialValue), 'ETH');
    console.log('   Messages Posted:', messages.length);
    console.log('\n⚠️  Important Notes:');
    console.log('   - This discussion is NOT on the board');
    console.log('   - Only YOU can terminate it (as the "board")');
    console.log('   - For production, use the full board deployment');
    console.log('\n📝 To interact with it:');
    console.log('   1. You can post messages directly via ethers.js');
    console.log('   2. Or create a simple frontend pointing to this address');
    console.log('   3. Min donation per message:', ethers.utils.formatEther(DISCUSSION_CONFIG.minDonation), 'ETH');
    console.log('\n🔗 Etherscan:');
    console.log('   https://sepolia.etherscan.io/address/' + discussion.address);
    console.log('\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });

