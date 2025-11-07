/**
 * Test script for querying the discussion board
 * Run with: node test-board.js
 */

const fs = require('fs');
const path = require('path');

// Note: Since ethers isn't installed, this will use a simple fetch approach
async function testBoard() {
    const BOARD_ADDRESS = '0xb3fa9bad0654b553ec31adc94773a4bf4fb5ea08';
    const RPC_URL = 'http://localhost:8545'; // Anvil
    
    console.log('🔍 Testing Discussion Board at:', BOARD_ADDRESS);
    console.log('RPC:', RPC_URL);
    console.log('');
    
    // Load ABI
    const boardAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'contracts/build/abis/board.json'), 'utf8')
    );
    
    console.log('📋 Board ABI loaded');
    console.log(`  - Events: ${boardAbi.filter(i => i.type === 'event').length}`);
    console.log(`  - Functions: ${boardAbi.filter(i => i.type === 'function').length}`);
    console.log('');
    
    // Find the methods we need
    const getDiscussionCount = boardAbi.find(i => i.name === 'get_discussion_count');
    const getAllDiscussions = boardAbi.find(i => i.name === 'get_all_discussions');
    const getActiveDiscussions = boardAbi.find(i => i.name === 'get_active_discussions');
    
    console.log('🔎 Required methods:');
    console.log(`  - get_discussion_count: ${getDiscussionCount ? '✅' : '❌'}`);
    console.log(`  - get_all_discussions: ${getAllDiscussions ? '✅' : '❌'}`);
    console.log(`  - get_active_discussions: ${getActiveDiscussions ? '✅' : '❌'}`);
    console.log('');
    
    if (!getDiscussionCount || !getAllDiscussions) {
        console.error('❌ Required methods not found in ABI!');
        process.exit(1);
    }
    
    console.log('✅ All required methods found in ABI');
    console.log('');
    console.log('📊 Next steps:');
    console.log('  1. Open discussions.html in your browser');
    console.log('  2. Open browser console (F12)');
    console.log('  3. Check for any errors when loading discussions');
    console.log('  4. Look for console.log messages showing discussion count');
    console.log('');
    console.log('💡 Common issues:');
    console.log('  - If "0 discussions" → Board might be empty (create one!)');
    console.log('  - If errors about "method not found" → ABI mismatch (recompile)');
    console.log('  - If "Failed to load discussion" → Discussion contract might have issues');
    console.log('  - If filter is set to "Active" → New discussions without messages might be inactive');
}

testBoard()
    .then(() => {
        console.log('\n✅ ABI validation complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });

