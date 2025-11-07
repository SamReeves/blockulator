/**
 * Test script for interacting with deployed discussion
 * Run with: node test-discussion.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const DISCUSSION_ADDRESS = '0x456328A47ed2cF11447C1F88c26BcD7400aCb426';
const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'; // or your RPC
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // Optional - only needed for posting messages

async function main() {
    console.log('🔍 Testing Discussion at:', DISCUSSION_ADDRESS);
    console.log('');

    // Setup provider
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    // Load ABI
    const discussionAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'contracts/build/abis/discussion.json'), 'utf8')
    );
    
    // Create read-only contract instance
    const discussion = new ethers.Contract(DISCUSSION_ADDRESS, discussionAbi, provider);

    // 1. Get Basic Info
    console.log('📋 Basic Information:');
    console.log('─'.repeat(60));
    
    try {
        const subject = await discussion.subject();
        const body = await discussion.body();
        const creator = await discussion.creator();
        const board = await discussion.board();
        const creationTime = await discussion.creation_time();
        const initialValue = await discussion.initial_value();
        
        console.log('Subject:', subject);
        console.log('Body:', body);
        console.log('Creator:', creator);
        console.log('Board:', board);
        console.log('Created:', new Date(creationTime.toNumber() * 1000).toLocaleString());
        console.log('Initial Value:', ethers.utils.formatEther(initialValue), 'ETH');
    } catch (error) {
        console.error('❌ Error reading basic info:', error.message);
        return;
    }

    // 2. Get Configuration
    console.log('\n⚙️  Configuration:');
    console.log('─'.repeat(60));
    
    try {
        const config = await discussion.get_config();
        console.log('Max Messages:', config[0].toNumber());
        console.log('Max Message Length:', config[1].toNumber(), 'characters');
        console.log('Min Donation:', ethers.utils.formatEther(config[2]), 'ETH');
    } catch (error) {
        console.error('❌ Error reading config:', error.message);
    }

    // 3. Get Status
    console.log('\n📊 Current Status:');
    console.log('─'.repeat(60));
    
    try {
        const status = await discussion.get_status();
        const totalPool = await discussion.total_pool();
        const lastActivity = await discussion.last_activity();
        
        console.log('Terminated:', status[0] ? '❌ Yes' : '✅ No');
        console.log('Message Count:', status[1].toNumber());
        console.log('Total Pool:', ethers.utils.formatEther(totalPool), 'ETH');
        console.log('Last Activity:', new Date(lastActivity.toNumber() * 1000).toLocaleString());
        console.log('Survivor Count:', status[4].toNumber());
        
        // Calculate time since last activity
        const now = Math.floor(Date.now() / 1000);
        const timeSinceActivity = now - lastActivity.toNumber();
        const daysInactive = timeSinceActivity / (24 * 60 * 60);
        console.log('Days Since Activity:', daysInactive.toFixed(2), '(inactive after 7 days)');
    } catch (error) {
        console.error('❌ Error reading status:', error.message);
    }

    // 4. Get Messages
    console.log('\n💬 Messages:');
    console.log('─'.repeat(60));
    
    try {
        const messages = await discussion.get_all_messages();
        
        if (messages.length === 0) {
            console.log('No messages yet.');
        } else {
            console.log(`Total: ${messages.length} message(s)\n`);
            
            messages.forEach((msg, i) => {
                console.log(`Message #${i}:`);
                console.log('  Author:', msg.author);
                console.log('  Content:', msg.content);
                console.log('  Donation:', ethers.utils.formatEther(msg.donation), 'ETH');
                console.log('  Time:', new Date(msg.timestamp.toNumber() * 1000).toLocaleString());
                console.log('');
            });
        }
    } catch (error) {
        console.error('❌ Error reading messages:', error.message);
    }

    // 5. Get Survivors
    console.log('🏆 Potential Winners (if terminated now):');
    console.log('─'.repeat(60));
    
    try {
        const survivors = await discussion.get_survivors();
        const potentialPayout = await discussion.get_potential_payout();
        
        if (survivors.length === 0) {
            console.log('No survivors yet (no messages posted).');
        } else {
            console.log(`${survivors.length} unique author(s) would split the pool:`);
            console.log('Payout per survivor:', ethers.utils.formatEther(potentialPayout), 'ETH\n');
            
            survivors.forEach((address, i) => {
                console.log(`  ${i + 1}. ${address}`);
            });
        }
    } catch (error) {
        console.error('❌ Error reading survivors:', error.message);
    }

    // 6. Get Required Donation
    console.log('\n💰 Posting Requirements:');
    console.log('─'.repeat(60));
    
    try {
        const requiredDonation = await discussion.get_required_donation();
        console.log('Required Donation to Post:', ethers.utils.formatEther(requiredDonation), 'ETH');
        
        const messageCount = await discussion.get_message_count();
        const config = await discussion.get_config();
        const maxMessages = config[0].toNumber();
        
        if (messageCount.toNumber() < maxMessages) {
            console.log('Status: ✅ Discussion has space for more messages');
        } else {
            console.log('Status: ⚠️  Discussion is full - must beat lowest donation');
        }
    } catch (error) {
        console.error('❌ Error reading requirements:', error.message);
    }

    // 7. Test Posting (if private key provided)
    if (PRIVATE_KEY && PRIVATE_KEY !== 'YOUR_PRIVATE_KEY_HERE') {
        console.log('\n📝 Testing Message Post:');
        console.log('─'.repeat(60));
        
        try {
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            const discussionWithSigner = discussion.connect(wallet);
            
            console.log('Posting from:', wallet.address);
            
            const requiredDonation = await discussion.get_required_donation();
            const testMessage = `Test message posted at ${new Date().toLocaleString()}`;
            
            console.log('Message:', testMessage);
            console.log('Donation:', ethers.utils.formatEther(requiredDonation), 'ETH');
            console.log('Sending transaction...');
            
            const tx = await discussionWithSigner.post_message(testMessage, {
                value: requiredDonation,
                gasLimit: 500000
            });
            
            console.log('Transaction hash:', tx.hash);
            console.log('Waiting for confirmation...');
            
            const receipt = await tx.wait();
            console.log('✅ Message posted successfully!');
            console.log('Gas used:', receipt.gasUsed.toString());
            
            // Read messages again to verify
            const updatedMessages = await discussion.get_all_messages();
            console.log('New message count:', updatedMessages.length);
            
        } catch (error) {
            console.error('❌ Error posting message:', error.message);
        }
    } else {
        console.log('\n💡 To test posting messages, add your PRIVATE_KEY to the script.');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Testing Complete!');
    console.log('='.repeat(60));
    console.log('\n🔗 View on Etherscan:');
    console.log('https://sepolia.etherscan.io/address/' + DISCUSSION_ADDRESS);
    console.log('');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });

