/**
 * Comprehensive Test Suite
 * Tests all calculator contracts, the gaussian_tail chain, and thin futures via factory.
 *
 * Prerequisites:
 *   1. Run tests/compile-all.sh
 *   2. Start anvil (anvil --block-time 1)
 *   3. Run: node tests/test-all-contracts.js
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC = 'http://127.0.0.1:8545';
const PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil/Hardhat default account #0, public test key — DO NOT FUND
const PK2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

let totalPassed = 0;
let totalFailed = 0;
let totalSkipped = 0;

function loadABI(name) {
    const p = path.join(__dirname, `../contracts/build/abis/${name}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadBytecode(name) {
    const p = path.join(__dirname, `../contracts/build/bytecode/${name}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8')).bytecode;
}

function toD(v) { return ethers.utils.parseUnits(v.toString(), 10); }
function fromD(v) { return parseFloat(ethers.utils.formatUnits(v, 10)); }

async function deploy(wallet, name, label, ...args) {
    const abi = loadABI(name);
    const bytecode = loadBytecode(name);
    if (!abi || !bytecode) {
        console.log(`  SKIP ${label} - not compiled (run compile-all.sh)`);
        totalSkipped++;
        return null;
    }
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    return contract;
}

async function deployBlueprint(wallet, name, label) {
    const p = path.join(__dirname, `../contracts/build/bytecode/${name}-blueprint.json`);
    if (!fs.existsSync(p)) {
        console.log(`  SKIP ${label} blueprint - not compiled`);
        totalSkipped++;
        return null;
    }
    const blueprintBytecode = JSON.parse(fs.readFileSync(p, 'utf8')).bytecode;
    const tx = await wallet.sendTransaction({ data: blueprintBytecode });
    const receipt = await tx.wait();
    return receipt.contractAddress;
}

function check(label, value, expected, tolerance = 0.01) {
    const diff = Math.abs(value - expected);
    if (diff < tolerance) {
        console.log(`  PASS ${label}: ${value} (expected ${expected})`);
        totalPassed++;
        return true;
    } else {
        console.log(`  FAIL ${label}: ${value} (expected ${expected}, diff ${diff})`);
        totalFailed++;
        return false;
    }
}

function checkExact(label, value, expected) {
    if (value === expected) {
        console.log(`  PASS ${label}: ${value}`);
        totalPassed++;
    } else {
        console.log(`  FAIL ${label}: ${value} (expected ${expected})`);
        totalFailed++;
    }
}

// ============================================================
// TEST SUITES
// ============================================================

async function testPureCalculators(wallet) {
    console.log('\n=== Test Suite 1: Pure Calculator Contracts ===\n');

    const tests = [
        { name: 'exp',       label: 'e^1',        call: async c => fromD(await c.calculate(toD('1.0'))),          expected: 2.7182818285 },
        { name: 'exp',       label: 'e^0',        call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 1.0 },
        { name: 'exp',       label: 'e^2',        call: async c => fromD(await c.calculate(toD('2.0'))),          expected: 7.3890560989, tol: 0.001 },
        { name: 'ln',        label: 'ln(e)',       call: async c => fromD(await c.calculate(toD('2.7182818285'))), expected: 1.0 },
        { name: 'ln',        label: 'ln(1)',       call: async c => fromD(await c.calculate(toD('1.0'))),          expected: 0.0 },
        { name: 'sqrt',      label: 'sqrt(4)',     call: async c => fromD(await c.calculate(toD('4.0'))),          expected: 2.0 },
        { name: 'sqrt',      label: 'sqrt(2)',     call: async c => fromD(await c.calculate(toD('2.0'))),          expected: 1.4142135624 },
        { name: 'sqrt',      label: 'sqrt(10000)', call: async c => fromD(await c.calculate(toD('10000.0'))),      expected: 100.0, tol: 0.01 },
        { name: 'sqrt',      label: 'sqrt(1000000)', call: async c => fromD(await c.calculate(toD('1000000.0'))), expected: 1000.0, tol: 0.1 },
        { name: 'factorial',  label: '5!',         call: async c => (await c.calculate(5)).toNumber(),              expected: 120, exact: true },
        { name: 'factorial',  label: '0!',         call: async c => (await c.calculate(0)).toNumber(),              expected: 1, exact: true },
        { name: 'norm-cdf',  label: 'Phi(0)',      call: async c => fromD(await c.standard_cdf(toD('0.0'))),       expected: 0.5 },
        { name: 'erf',       label: 'erf(0)',      call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 0.0, tol: 0.001 },
        { name: 'erf',       label: 'erf(1)',      call: async c => fromD(await c.calculate(toD('1.0'))),          expected: 0.8427, tol: 0.01 },
        { name: 'pow2',      label: '2^8',         call: async c => fromD(await c.calculate(toD('8.0'))),          expected: 256.0, tol: 1.0 },
        { name: 'pow2',      label: '2^10',        call: async c => fromD(await c.calculate(toD('10.0'))),         expected: 1024.0, tol: 1.0 },
        { name: 'pow2',      label: '2^20',        call: async c => fromD(await c.calculate(toD('20.0'))),         expected: 1048576.0, tol: 10.0 },
        { name: 'pow2',      label: '2^32',        call: async c => fromD(await c.calculate(toD('32.0'))),         expected: 4294967296.0, tol: 1000.0 },
        { name: 'pow2',      label: '2^64',        call: async c => fromD(await c.calculate(toD('64.0'))),         expected: 18446744073709551616.0, tol: 1000000.0 },
        { name: 'pow10',     label: '10^3',        call: async c => fromD(await c.calculate(toD('3.0'))),          expected: 1000.0, tol: 1.0 },
        { name: 'log2',      label: 'log2(8)',     call: async c => fromD(await c.calculate(toD('8.0'))),          expected: 3.0 },
        { name: 'log10',     label: 'log10(100)',  call: async c => fromD(await c.calculate(toD('100.0'))),        expected: 2.0 },
        { name: 'sin',       label: 'sin(0)',      call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 0.0, tol: 0.001 },
        { name: 'cos',       label: 'cos(0)',      call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 1.0 },
        { name: 'sinh',      label: 'sinh(0)',     call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 0.0, tol: 0.001 },
        { name: 'cosh',      label: 'cosh(0)',     call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 1.0 },
        { name: 'tanh',      label: 'tanh(0)',     call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 0.0, tol: 0.001 },
        { name: 'atan',      label: 'atan(0)',     call: async c => fromD(await c.calculate(toD('0.0'))),          expected: 0.0, tol: 0.001 },
    ];

    const deployed = {};
    for (const t of tests) {
        if (!deployed[t.name]) {
            deployed[t.name] = await deploy(wallet, t.name, t.name);
        }
        const c = deployed[t.name];
        if (!c) continue;
        try {
            const result = await t.call(c);
            if (t.exact) checkExact(t.label, result, t.expected);
            else check(t.label, result, t.expected, t.tol || 0.01);
        } catch (e) {
            console.log(`  FAIL ${t.label}: ${e.message.substring(0, 80)}`);
            totalFailed++;
        }
    }

    return deployed;
}

async function testZScore(wallet) {
    console.log('\n=== Test Suite 2: Z-Score Calculator ===\n');

    const zscore = await deploy(wallet, 'zscore', 'zscore');
    if (!zscore) return null;

    try {
        const r1 = fromD(await zscore.calculate(toD('105.0'), toD('100.0'), toD('15.0')));
        check('z(105, 100, 15)', r1, 0.3333, 0.01);

        const r2 = fromD(await zscore.calculate(toD('130.0'), toD('100.0'), toD('15.0')));
        check('z(130, 100, 15)', r2, 2.0, 0.01);

        const r3 = fromD(await zscore.calculate(toD('100.0'), toD('100.0'), toD('15.0')));
        check('z(100, 100, 15) = 0', r3, 0.0, 0.001);

        const r4 = fromD(await zscore.z_score_signed(toD('85.0'), toD('100.0'), toD('15.0')));
        check('z_signed(85, 100, 15) = -1', r4, -1.0, 0.01);
    } catch (e) {
        console.log(`  FAIL zscore: ${e.message.substring(0, 80)}`);
        totalFailed++;
    }

    return zscore;
}

async function testBinomialCoeff(wallet, factorialContract) {
    console.log('\n=== Test Suite 2.5: Binomial Coefficient (binomial -> factorial) ===\n');

    const binomial = await deploy(wallet, 'binomial-coeff', 'binomial-coeff', factorialContract.address);
    if (!binomial) return null;

    try {
        const r1 = await binomial.calculate(5, 2);
        checkExact('C(5,2)', r1.toNumber(), 10);

        const r2 = await binomial.calculate(10, 5);
        checkExact('C(10,5)', r2.toNumber(), 252);

        const r3 = await binomial.calculate(20, 10);
        checkExact('C(20,10)', r3.toNumber(), 184756);

        const r4 = await binomial.permutations(5, 2);
        checkExact('P(5,2)', r4.toNumber(), 20);

        const r5 = await binomial.permutations(10, 3);
        checkExact('P(10,3)', r5.toNumber(), 720);
    } catch (e) {
        console.log(`  FAIL binomial: ${e.message.substring(0, 80)}`);
        totalFailed++;
    }

    return binomial;
}

async function testNormPdf(wallet, expContract) {
    console.log('\n=== Test Suite 2.6: Normal PDF (norm_pdf -> exp) ===\n');

    const normPdf = await deploy(wallet, 'norm-pdf', 'norm-pdf', expContract.address);
    if (!normPdf) return null;

    try {
        const r1 = fromD(await normPdf.calculate(toD('0.0')));
        check('φ(0)', r1, 0.3989, 0.001);

        const r2 = fromD(await normPdf.calculate(toD('1.0')));
        check('φ(1)', r2, 0.2420, 0.001);

        const r3 = fromD(await normPdf.calculate(toD('2.0')));
        check('φ(2)', r3, 0.0540, 0.001);

        const r4 = fromD(await normPdf.calculate_general(toD('110.0'), toD('100.0'), toD('10.0')));
        check('φ(110; μ=100, σ=10)', r4, 0.0242, 0.001);
    } catch (e) {
        console.log(`  FAIL norm_pdf: ${e.message.substring(0, 80)}`);
        totalFailed++;
    }

    return normPdf;
}

async function testGCD(wallet) {
    console.log('\n=== Test Suite 2.7: GCD / LCM ===\n');

    const gcd = await deploy(wallet, 'gcd', 'gcd');
    if (!gcd) return null;

    try {
        const r1 = await gcd.calculate(12, 8);
        checkExact('GCD(12,8)', r1.toNumber(), 4);

        const r2 = await gcd.calculate(100, 75);
        checkExact('GCD(100,75)', r2.toNumber(), 25);

        const r3 = await gcd.calculate(48, 18);
        checkExact('GCD(48,18)', r3.toNumber(), 6);

        const r4 = await gcd.lcm(4, 6);
        checkExact('LCM(4,6)', r4.toNumber(), 12);

        const r5 = await gcd.lcm(12, 15);
        checkExact('LCM(12,15)', r5.toNumber(), 60);
    } catch (e) {
        console.log(`  FAIL gcd: ${e.message.substring(0, 80)}`);
        totalFailed++;
    }

    return gcd;
}

async function testGaussianTailChain(wallet, expContract) {
    console.log('\n=== Test Suite 3: Gaussian Tail Chain (gaussian_tail -> exp) ===\n');

    let exp = expContract;
    if (!exp) {
        exp = await deploy(wallet, 'exp', 'exp');
    }
    if (!exp) return null;

    const gt = await deploy(wallet, 'gaussian-tail', 'gaussian-tail', exp.address);
    if (!gt) return null;

    try {
        const r1 = fromD(await gt.calculate(toD('0.0')));
        check('tail(0) = 0.5', r1, 0.5, 0.01);

        const r2 = fromD(await gt.calculate(toD('1.96')));
        check('cdf(1.96) ~ 0.975', r2, 0.975, 0.01);

        const r3 = fromD(await gt.calculate(toD('1.0')));
        check('cdf(1) ~ 0.841', r3, 0.8413, 0.02);

        const r4 = fromD(await gt.z_score(toD('120.0'), toD('100.0'), toD('10.0')));
        check('z(120, 100, 10) = 2', r4, 2.0, 0.01);

        const gas = await gt.estimateGas.calculate(toD('1.96'));
        console.log(`  INFO gas for tail(1.96): ${gas.toString()}`);
        totalPassed++;
    } catch (e) {
        console.log(`  FAIL gaussian_tail chain: ${e.message.substring(0, 120)}`);
        totalFailed++;
    }

    return gt;
}

async function testFuturesFactory(wallet, wallet2, provider, expContract, gtContract) {
    console.log('\n=== Test Suite 4: Thin Futures via Factory ===\n');

    let exp = expContract;
    if (!exp) exp = await deploy(wallet, 'exp', 'exp');
    let gt = gtContract;
    if (!gt) gt = await deploy(wallet, 'gaussian-tail', 'gaussian-tail', exp.address);
    if (!exp || !gt) { console.log('  SKIP - missing calculator contracts'); return; }

    console.log('  Deploying blueprints...');
    const bpUniform   = await deployBlueprint(wallet, 'uniform-future', 'uniform');
    const bpGaussian  = await deployBlueprint(wallet, 'gaussian-future', 'gaussian');
    const bpExpDecay  = await deployBlueprint(wallet, 'exponential-future', 'exp-decay');
    const bpExpGrowth = await deployBlueprint(wallet, 'exponential-future', 'exp-growth');
    const bpLinDecay  = await deployBlueprint(wallet, 'linear-future', 'linear-decay');
    const bpLinGrowth = await deployBlueprint(wallet, 'linear-future', 'linear-growth');

    if (!bpUniform || !bpGaussian || !bpExpDecay || !bpExpGrowth || !bpLinDecay || !bpLinGrowth) {
        console.log('  SKIP - missing blueprint bytecodes');
        return;
    }
    console.log('  All 6 blueprints deployed');

    console.log('  Deploying factory...');
    const factory = await deploy(
        wallet, 'future-factory', 'future-factory',
        bpUniform, bpGaussian, bpExpDecay, bpExpGrowth,
        bpLinDecay, bpLinGrowth,
        exp.address, gt.address, wallet.address
    );
    if (!factory) return;
    console.log(`  Factory at: ${factory.address}`);

    const futureABI = loadABI('uniform-future');
    const VALUE = ethers.utils.parseEther('1.0');
    const LIFETIME = 3600;

    const distNames = [
        'Uniform (0)', 'Gaussian (1)', 'Exp Decay (2)', 'Exp Growth (3)',
        'Linear Decay (4)', 'Linear Growth (5)'
    ];

    for (let dtype = 0; dtype <= 5; dtype++) {
        try {
            // Skip cooldown between creates
            if (dtype > 0) {
                await provider.send('evm_increaseTime', [301]);
                await provider.send('evm_mine', []);
            }

            const gasEst = await factory.estimateGas.create_future(LIFETIME, dtype, { value: VALUE });
            console.log(`  INFO ${distNames[dtype]} gas estimate: ${gasEst.toString()}`);

            const tx = await factory.create_future(LIFETIME, dtype, {
                value: VALUE,
                gasLimit: gasEst.mul(130).div(100)
            });
            const receipt = await tx.wait();

            const createdEvent = receipt.events?.find(e => e.event === 'FutureCreated');
            if (!createdEvent) {
                console.log(`  FAIL ${distNames[dtype]}: no FutureCreated event`);
                totalFailed++;
                continue;
            }

            const futureAddr = createdEvent.args.future_address;
            console.log(`  PASS ${distNames[dtype]} created at ${futureAddr} (gas: ${receipt.gasUsed.toString()})`);
            totalPassed++;

            const future = new ethers.Contract(futureAddr, futureABI, wallet);

            const balance = await future.get_balance();
            check(`  ${distNames[dtype]} balance = 1 ETH`, parseFloat(ethers.utils.formatEther(balance)), 1.0, 0.001);

            const [lastT, lastCache, retType] = await future.get_current_state();
            checkExact(`  ${distNames[dtype]} dist_type`, retType, dtype);

            const owner = await future.current_owner();
            checkExact(`  ${distNames[dtype]} owner`, owner, wallet.address);

        } catch (e) {
            console.log(`  FAIL ${distNames[dtype]}: ${e.message.substring(0, 120)}`);
            totalFailed++;
        }
    }

    console.log('\n  --- Transfer test (Uniform) ---');
    try {
        const futures = await factory.get_all_futures();
        if (futures.length === 0) {
            console.log('  SKIP transfer test - no futures created');
            return;
        }
        const uniformAddr = futures[0];
        const uniform = new ethers.Contract(uniformAddr, futureABI, wallet);

        // Advance time so meaningful payout accumulates (10% of lifetime)
        await provider.send('evm_increaseTime', [360]);
        await provider.send('evm_mine', []);

        const balBefore = await provider.getBalance(wallet.address);
        const tx = await uniform.transfer(wallet2.address);
        const receipt = await tx.wait();
        const balAfter = await provider.getBalance(wallet.address);

        const newOwner = await uniform.current_owner();
        checkExact('  transfer: new owner', newOwner, wallet2.address);

        // Wallet1 (old owner) should have received payout, minus gas
        const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
        const netReceived = balAfter.sub(balBefore).add(gasCost);
        const received = parseFloat(ethers.utils.formatEther(netReceived));
        if (received > 0) {
            console.log(`  PASS transfer: owner received ${received.toFixed(6)} ETH payout`);
            totalPassed++;
        } else {
            console.log(`  FAIL transfer: owner received 0 ETH payout`);
            totalFailed++;
        }
    } catch (e) {
        console.log(`  FAIL transfer test: ${e.message.substring(0, 120)}`);
        totalFailed++;
    }

    console.log('\n  --- Marketplace test (list + buy) ---');
    try {
        const futures = await factory.get_all_futures();
        if (futures.length < 2) {
            console.log('  SKIP marketplace test - need at least 2 futures');
            return;
        }
        const gaussianAddr = futures[1];
        const gaussianABI = loadABI('gaussian-future') || futureABI;
        const gaussian = new ethers.Contract(gaussianAddr, gaussianABI, wallet);

        const askPrice = ethers.utils.parseEther('0.5');
        const listTx = await factory.list_future(gaussianAddr, askPrice);
        await listTx.wait();

        const [isListed] = await factory.get_listing(gaussianAddr);
        checkExact('  list: is_listed', isListed, true);

        // buy_future transfers ownership + pays seller + pays out accumulated value
        const factory2 = factory.connect(wallet2);
        const buyTx = await factory2.buy_future(gaussianAddr, { value: askPrice });
        await buyTx.wait();

        const newOwner = await gaussian.current_owner();
        checkExact('  buy: new owner is wallet2', newOwner, wallet2.address);

        const [isListedAfter] = await factory.get_listing(gaussianAddr);
        checkExact('  buy: delisted after sale', isListedAfter, false);

    } catch (e) {
        console.log(`  FAIL marketplace: ${e.message.substring(0, 150)}`);
        totalFailed++;
    }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
    console.log('========================================');
    console.log(' BLOCKULATOR - FULL CONTRACT TEST SUITE');
    console.log('========================================');

    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(PK, provider);
    const wallet2 = new ethers.Wallet(PK2, provider);

    try {
        const blockNum = await provider.getBlockNumber();
        console.log(`\nConnected to Anvil (block ${blockNum})`);
    } catch (e) {
        console.error('\nERROR: Cannot connect to Anvil at', RPC);
        console.error('Start it with: anvil --block-time 1');
        process.exit(1);
    }

    const bal = await wallet.getBalance();
    console.log(`Wallet 1: ${wallet.address} (${ethers.utils.formatEther(bal)} ETH)`);
    console.log(`Wallet 2: ${wallet2.address}`);

    const deployed = await testPureCalculators(wallet);
    await testZScore(wallet);
    await testBinomialCoeff(wallet, deployed?.factorial || null);
    await testNormPdf(wallet, deployed?.exp || null);
    await testGCD(wallet);
    const gt = await testGaussianTailChain(wallet, deployed?.exp || null);
    await testFuturesFactory(wallet, wallet2, provider, deployed?.exp || null, gt);

    console.log('\n========================================');
    console.log(' RESULTS');
    console.log('========================================');
    console.log(`  Passed:  ${totalPassed}`);
    console.log(`  Failed:  ${totalFailed}`);
    if (totalSkipped > 0) console.log(`  Skipped: ${totalSkipped}`);
    console.log('========================================\n');

    if (totalFailed > 0) {
        console.log('SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('ALL TESTS PASSED');
        process.exit(0);
    }
}

main().catch(e => {
    console.error('FATAL:', e.message);
    process.exit(1);
});
