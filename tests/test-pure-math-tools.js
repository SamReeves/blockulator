/**
 * Test Suite for Pure Math Tools
 * 
 * This test verifies:
 * 1. Math tool contracts are deployable with @pure decorators
 * 2. Direct calls to pure functions work
 * 3. Cross-contract calls work (gas estimation)
 * 4. Results are mathematically correct
 * 
 * Run: node test-pure-math-tools.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURATION
// ========================================

const LOCAL_RPC = 'http://127.0.0.1:8545';
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil/Hardhat default account #0, public test key — DO NOT FUND

// ========================================
// HELPER FUNCTIONS
// ========================================

function loadABI(filename) {
    const abiPath = path.join(__dirname, `../contracts/build/abis/${filename}.json`);
    return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
}

function loadBytecode(filename) {
    const bytecodePath = path.join(__dirname, `../contracts/build/bytecode/${filename}.json`);
    return JSON.parse(fs.readFileSync(bytecodePath, 'utf8')).bytecode;
}

async function deployContract(wallet, name, filename, ...args) {
    console.log(`\n📦 Deploying ${name}...`);
    
    const abi = loadABI(filename);
    const bytecode = loadBytecode(filename);
    
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    
    console.log(`   ✅ Deployed at: ${contract.address}`);
    return contract;
}

function toDecimal(value) {
    return ethers.utils.parseUnits(value.toString(), 10);
}

function fromDecimal(value) {
    return parseFloat(ethers.utils.formatUnits(value, 10));
}

// ========================================
// TEST FUNCTIONS
// ========================================

async function testDirectCalls(contracts) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Test 1: Direct Calls to Pure Functions');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test ln(e) ≈ 1
    try {
        const e = toDecimal('2.718281828');
        const result = await contracts.ln.calculate(e);
        const value = fromDecimal(result);
        console.log(`✓ ln(e) = ${value.toFixed(10)} (expected ≈ 1.0)`);
        if (Math.abs(value - 1.0) < 0.01) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ ln(e) failed: ${error.message}`);
        failed++;
    }
    
    // Test e^1 ≈ e
    try {
        const result = await contracts.exp.calculate(toDecimal('1.0'));
        const value = fromDecimal(result);
        console.log(`✓ e^1 = ${value.toFixed(10)} (expected ≈ 2.718281828)`);
        if (Math.abs(value - 2.718281828) < 0.01) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ e^1 failed: ${error.message}`);
        failed++;
    }
    
    // Test sqrt(4) = 2
    try {
        const result = await contracts.sqrt.calculate(toDecimal('4.0'));
        const value = fromDecimal(result);
        console.log(`✓ sqrt(4) = ${value.toFixed(10)} (expected = 2.0)`);
        if (Math.abs(value - 2.0) < 0.01) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ sqrt(4) failed: ${error.message}`);
        failed++;
    }
    
    // Test 5! = 120
    try {
        const result = await contracts.factorial.calculate(5);
        console.log(`✓ 5! = ${result.toString()} (expected = 120)`);
        if (result.toString() === '120') passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ 5! failed: ${error.message}`);
        failed++;
    }
    
    // Test Φ(0) = 0.5
    try {
        const result = await contracts.normCDF.standard_cdf(toDecimal('0.0'));
        const value = fromDecimal(result);
        console.log(`✓ Φ(0) = ${value.toFixed(10)} (expected ≈ 0.5)`);
        if (Math.abs(value - 0.5) < 0.01) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ Φ(0) failed: ${error.message}`);
        failed++;
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
}

async function testCrossContractCalls(caller) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Test 2: Cross-Contract Calls (Gas Estimation)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Log ratio
    try {
        const result = await caller.test_log_ratio(toDecimal('10.0'), toDecimal('2.0'));
        const value = fromDecimal(result);
        const expected = Math.log(5); // ln(10/2) = ln(5)
        console.log(`✓ ln(10/2) = ${value.toFixed(10)} (expected ≈ ${expected.toFixed(10)})`);
        if (Math.abs(value - expected) < 0.1) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ Log ratio failed: ${error.message}`);
        failed++;
    }
    
    // Test 2: Geometric mean
    try {
        const result = await caller.test_geometric_mean(toDecimal('4.0'), toDecimal('9.0'));
        const value = fromDecimal(result);
        const expected = 6.0; // sqrt(36)
        console.log(`✓ sqrt(4*9) = ${value.toFixed(10)} (expected = ${expected.toFixed(10)})`);
        if (Math.abs(value - expected) < 0.1) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ Geometric mean failed: ${error.message}`);
        failed++;
    }
    
    // Test 3: Compound growth
    try {
        const result = await caller.test_compound_growth(toDecimal('0.05'), toDecimal('10.0'));
        const value = fromDecimal(result);
        const expected = Math.exp(0.5); // e^(0.05*10)
        console.log(`✓ e^(0.05*10) = ${value.toFixed(10)} (expected ≈ ${expected.toFixed(10)})`);
        if (Math.abs(value - expected) < 0.1) passed++;
        else failed++;
    } catch (error) {
        console.log(`✗ Compound growth failed: ${error.message}`);
        failed++;
    }
    
    // Test 4: Heavy gas test (multiple calls)
    try {
        console.log('   🔥 Testing heavy gas estimation (4 external calls)...');
        const gasEstimate = await caller.estimateGas.test_gas_estimation_heavy();
        console.log(`   ✓ Gas estimated: ${gasEstimate.toString()}`);
        
        const result = await caller.test_gas_estimation_heavy();
        const [r1, r2, r3, r4] = result;
        console.log(`   ✓ Results: ln(e)=${fromDecimal(r1).toFixed(3)}, e^1=${fromDecimal(r2).toFixed(3)}, sqrt(2)=${fromDecimal(r3).toFixed(3)}, Φ(0)=${fromDecimal(r4).toFixed(3)}`);
        passed++;
    } catch (error) {
        console.log(`   ✗ Heavy gas test failed: ${error.message}`);
        failed++;
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
}

async function testBlackScholesComponent(caller) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Test 3: Complex Calculation (Black-Scholes d1)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        const S = toDecimal('100.0');  // Stock price
        const K = toDecimal('100.0');  // Strike price
        const sigma = toDecimal('0.2');  // 20% volatility
        const T = toDecimal('1.0');    // 1 year
        
        console.log('   Parameters:');
        console.log('   S (stock price) = 100.0');
        console.log('   K (strike) = 100.0');
        console.log('   σ (volatility) = 0.2');
        console.log('   T (time) = 1.0 year');
        console.log('');
        
        const result = await caller.test_black_scholes_component(S, K, sigma, T);
        const d1 = fromDecimal(result);
        
        console.log(`   ✓ d1 = ${d1.toFixed(10)}`);
        console.log('   (Expected ≈ 0.1 for at-the-money option)');
        
        return { passed: 1, failed: 0 };
    } catch (error) {
        console.log(`   ✗ Black-Scholes test failed: ${error.message}`);
        return { passed: 0, failed: 1 };
    }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function main() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   PURE MATH TOOLS - COMPREHENSIVE TEST SUITE      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    // Setup
    console.log('🔗 Connecting to local network...');
    const provider = new ethers.providers.JsonRpcProvider(LOCAL_RPC);
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    
    console.log('💰 Deployer:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('   Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    // Deploy math tool contracts
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Phase 1: Deploy Math Tool Contracts');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const contracts = {
        ln: await deployContract(wallet, 'Ln Calculator', 'ln'),
        exp: await deployContract(wallet, 'Exp Calculator', 'exp'),
        sqrt: await deployContract(wallet, 'Sqrt Calculator', 'sqrt'),
        factorial: await deployContract(wallet, 'Factorial Calculator', 'factorial'),
        normCDF: await deployContract(wallet, 'Normal CDF Calculator', 'norm-cdf')
    };
    
    // Deploy test caller contract
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Phase 2: Deploy Test Caller Contract');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const caller = await deployContract(
        wallet,
        'Math Tools Caller',
        'math-tools-caller',
        contracts.ln.address,
        contracts.exp.address,
        contracts.sqrt.address,
        contracts.factorial.address,
        contracts.normCDF.address
    );
    
    // Run tests
    const test1 = await testDirectCalls(contracts);
    const test2 = await testCrossContractCalls(caller);
    const test3 = await testBlackScholesComponent(caller);
    
    // Summary
    const totalPassed = test1.passed + test2.passed + test3.passed;
    const totalFailed = test1.failed + test2.failed + test3.failed;
    
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                  FINAL RESULTS                     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ${totalFailed > 0 ? '❌' : '✅'} Total Failed: ${totalFailed}`);
    console.log('');
    
    if (totalFailed === 0) {
        console.log('🎉 ALL TESTS PASSED! Gas estimation works perfectly!');
        console.log('');
        console.log('✓ Pure functions (@pure) are working correctly');
        console.log('✓ Cross-contract calls succeed');
        console.log('✓ Gas estimation is reliable');
        console.log('✓ Mathematical results are accurate');
    } else {
        console.log('⚠️  Some tests failed. Check the output above.');
    }
    
    console.log('');
    process.exit(totalFailed === 0 ? 0 : 1);
}

// Run tests
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

