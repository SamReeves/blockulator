#!/usr/bin/env node
/**
 * Compare gas costs: V4 vs V4 Optimized
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'http://127.0.0.1:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function deployAndTest(name, abiFile, bytecodeFile) {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log('='.repeat(60));
    
    // Deploy blueprints (same for both)
    const imageBlueprintData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../build/bytecode/image-content-v3-blueprint.json'))
    );
    const textBlueprintData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../build/bytecode/text-content-v4-blueprint.json'))
    );
    
    const imageTx = await wallet.sendTransaction({ data: imageBlueprintData.bytecode, gasLimit: 3000000 });
    const imageReceipt = await imageTx.wait();
    const imageBlueprint = imageReceipt.contractAddress;
    
    const textTx = await wallet.sendTransaction({ data: textBlueprintData.bytecode, gasLimit: 2000000 });
    const textReceipt = await textTx.wait();
    const textBlueprint = textReceipt.contractAddress;
    
    // Deploy factory
    const abi = JSON.parse(fs.readFileSync(path.join(__dirname, `../../build/abis/${abiFile}`)));
    const bytecode = JSON.parse(fs.readFileSync(path.join(__dirname, `../../build/bytecode/${bytecodeFile}`))).bytecode;
    
    const Factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const factory = await Factory.deploy(textBlueprint, imageBlueprint, 0, 0);
    await factory.deployed();
    const factoryReceipt = await factory.deployTransaction.wait();
    
    console.log('Factory deployed:', factory.address);
    console.log('Factory gas:', factoryReceipt.gasUsed.toString());
    
    // Test uploads
    const tests = [
        { name: 'Tiny 2×2', width: 2, height: 2, data: '0x' + 'ff0000'.repeat(4) },
        { name: 'Small 16×16', width: 16, height: 16, data: '0x' + '00ff00'.repeat(256) },
        { name: 'Badge 32×32', width: 32, height: 32, data: '0x' + '0000ff'.repeat(1024) },
        { name: 'Max 73×73', width: 73, height: 73, data: '0x' + 'ffffff'.repeat(5329) }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const tx = await factory.create_image(test.width, test.height, test.data);
        const receipt = await tx.wait();
        results.push({
            name: test.name,
            gas: receipt.gasUsed.toNumber()
        });
        console.log(`${test.name}: ${receipt.gasUsed.toString()} gas`);
    }
    
    return { factory: factory.address, results };
}

async function main() {
    console.log('🔬 Gas Comparison: V4 vs V4 Optimized\n');
    
    const v4 = await deployAndTest(
        'V4 (Original)',
        'content-factory-v4.json',
        'content-factory-v4.json'
    );
    
    const v4opt = await deployAndTest(
        'V4 (Optimized)',
        'content-factory-v4-optimized.json',
        'content-factory-v4-optimized.json'
    );
    
    // Compare
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 COMPARISON');
    console.log('='.repeat(60));
    console.log();
    
    console.log('| Test | V4 Original | V4 Optimized | Savings | % Saved |');
    console.log('|------|-------------|--------------|---------|---------|');
    
    for (let i = 0; i < v4.results.length; i++) {
        const original = v4.results[i].gas;
        const optimized = v4opt.results[i].gas;
        const savings = original - optimized;
        const percent = ((savings / original) * 100).toFixed(2);
        
        console.log(
            `| ${v4.results[i].name.padEnd(12)} | ${original.toLocaleString().padStart(11)} | ` +
            `${optimized.toLocaleString().padStart(12)} | ${savings.toLocaleString().padStart(7)} | ${percent.padStart(6)}% |`
        );
    }
    
    console.log();
    console.log('✅ Test complete!');
}

main().catch(console.error);


