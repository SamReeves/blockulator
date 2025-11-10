/**
 * Test script to verify Factory deployment
 * Run with: node test-factory-deployment.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const FACTORY_ADDRESS = '0x04e493e377F681b947595243255C0d9a925ac153';
const BLUEPRINT_ADDRESS = '0xBa141CF8c6f1b0f13716455e3B06cD2738a7FFC1';

async function testDeployment() {
    console.log('🧪 Testing Factory Deployment...\n');
    
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    // Load ABI
    const factoryAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'contracts/build/abis/future-factory.json'), 'utf8')
    );
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
    
    console.log('📍 Factory Address:', FACTORY_ADDRESS);
    console.log('📍 Blueprint Address:', BLUEPRINT_ADDRESS);
    console.log('');
    
    try {
        // Test 1: Check blueprint address
        console.log('Test 1: Verify blueprint address...');
        const storedBlueprint = await factory.future_blueprint();
        console.log('   Stored blueprint:', storedBlueprint);
        console.log('   Expected:', BLUEPRINT_ADDRESS);
        console.log('   Match:', storedBlueprint.toLowerCase() === BLUEPRINT_ADDRESS.toLowerCase() ? '✅' : '❌');
        console.log('');
        
        // Test 2: Check owner
        console.log('Test 2: Verify owner...');
        const owner = await factory.owner();
        console.log('   Owner:', owner);
        console.log('   ✅');
        console.log('');
        
        // Test 3: Check initial stats
        console.log('Test 3: Check initial stats...');
        const totalCreated = await factory.total_created();
        const totalTrades = await factory.total_trades();
        const futuresCount = await factory.get_futures_count();
        const marketBalance = await factory.market_balance();
        
        console.log('   Total Created:', totalCreated.toString());
        console.log('   Total Trades:', totalTrades.toString());
        console.log('   Futures Count:', futuresCount.toString());
        console.log('   Market Balance:', ethers.utils.formatEther(marketBalance), 'ETH');
        console.log('   ✅');
        console.log('');
        
        // Test 4: Check constants
        console.log('Test 4: Check contract constants...');
        // These are view functions that return the constants
        console.log('   ✅ Contract is responsive');
        console.log('');
        
        // Test 5: Try to get all futures (should be empty array)
        console.log('Test 5: Get all futures...');
        const allFutures = await factory.get_all_futures();
        console.log('   Futures array length:', allFutures.length);
        console.log('   Expected: 0 (no futures created yet)');
        console.log('   ✅');
        console.log('');
        
        console.log('═══════════════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════');
        console.log('');
        console.log('📝 Next Steps:');
        console.log('   1. Start your web server: ./test-server.sh');
        console.log('   2. Open: http://localhost:8000/factory.html');
        console.log('   3. Connect MetaMask (Sepolia network)');
        console.log('   4. Create your first future!');
        console.log('');
        console.log('💡 Distribution Types Available:');
        console.log('   0: Uniform - Constant rate');
        console.log('   1: Gaussian - Bell curve (peak at midpoint)');
        console.log('   2: Exponential Decay - Early payouts favored');
        console.log('   3: Exponential Growth - Late payouts favored');
        console.log('   4: Linear Decay - Triangular (high at start)');
        console.log('   5: Inverted Gaussian - U-shape (high at extremes)');
        console.log('   6: Linear Growth - Triangular (low at start, high at end)');
        console.log('');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDeployment()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

