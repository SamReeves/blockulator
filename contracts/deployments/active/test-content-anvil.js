#!/usr/bin/env node
/**
 * Deploy and test Content System V4 on Anvil
 * Focus: Maximum compression within 15KB limit
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'http://127.0.0.1:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil/Hardhat default account #0, public test key — DO NOT FUND

async function main() {
    console.log('🚀 Testing Content Upload System on Anvil\n');

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Deployer:', wallet.address);
    console.log('Balance:', ethers.utils.formatEther(await wallet.getBalance()), 'ETH');
    console.log('Block:', (await provider.getBlockNumber()).toString(), '\n');

    // ========== DEPLOY IMAGE BLUEPRINT V3 ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Deploying Image Blueprint V3...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const imageBlueprintData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../build/bytecode/image-content-v3-blueprint.json'), 'utf8')
    );
    
    const imageBlueprintTx = await wallet.sendTransaction({
        data: imageBlueprintData.bytecode,
        gasLimit: 3000000
    });
    const imageBlueprintReceipt = await imageBlueprintTx.wait();
    const imageBlueprintAddress = imageBlueprintReceipt.contractAddress;
    
    console.log('✅ Image Blueprint:', imageBlueprintAddress);
    console.log('   Gas used:', imageBlueprintReceipt.gasUsed.toString());
    
    // Verify blueprint preamble
    const imageCode = await provider.getCode(imageBlueprintAddress);
    const hasImagePreamble = imageCode.startsWith('0xfe71');
    console.log('   Preamble:', hasImagePreamble ? '✅ 0xFE71' : '❌ Missing');
    console.log('   Size:', imageCode.length, 'chars', '(' + ((imageCode.length - 2) / 2), 'bytes)\n');

    // ========== DEPLOY TEXT BLUEPRINT V4 ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Deploying Text Blueprint V4...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const textBlueprintData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../build/bytecode/text-content-v4-blueprint.json'), 'utf8')
    );
    
    const textBlueprintTx = await wallet.sendTransaction({
        data: textBlueprintData.bytecode,
        gasLimit: 2000000
    });
    const textBlueprintReceipt = await textBlueprintTx.wait();
    const textBlueprintAddress = textBlueprintReceipt.contractAddress;
    
    console.log('✅ Text Blueprint:', textBlueprintAddress);
    console.log('   Gas used:', textBlueprintReceipt.gasUsed.toString());
    
    const textCode = await provider.getCode(textBlueprintAddress);
    const hasTextPreamble = textCode.startsWith('0xfe71');
    console.log('   Preamble:', hasTextPreamble ? '✅ 0xFE71' : '❌ Missing');
    console.log('   Size:', textCode.length, 'chars', '(' + ((textCode.length - 2) / 2), 'bytes)\n');

    // ========== DEPLOY FACTORY V4 ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏭 Deploying Content Factory V4...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const factoryAbi = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../build/abis/content-factory-v4.json'), 'utf8')
    );
    const factoryData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../build/bytecode/content-factory-v4.json'), 'utf8')
    );

    const ContentFactory = new ethers.ContractFactory(factoryAbi, factoryData.bytecode, wallet);
    const factory = await ContentFactory.deploy(
        textBlueprintAddress,   // _text_blueprint
        imageBlueprintAddress,  // _image_blueprint
        0,                      // _creation_fee
        0                       // _creation_cooldown
    );
    await factory.deployed();
    const factoryReceipt = await factory.deployTransaction.wait();
    
    console.log('✅ Factory V4:', factory.address);
    console.log('   Gas used:', factoryReceipt.gasUsed.toString(), '\n');

    // ========== VERIFY DEPLOYMENT ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Verifying Deployment...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const registeredTextBlueprint = await factory.text_blueprint();
    const registeredImageBlueprint = await factory.image_blueprint();
    const owner = await factory.owner();
    const contentCount = await factory.get_content_count();
    
    console.log('Text Blueprint:');
    console.log('   Registered:', registeredTextBlueprint);
    console.log('   Expected:', textBlueprintAddress);
    console.log('   Match:', registeredTextBlueprint === textBlueprintAddress ? '✅' : '❌');
    console.log();
    console.log('Image Blueprint:');
    console.log('   Registered:', registeredImageBlueprint);
    console.log('   Expected:', imageBlueprintAddress);
    console.log('   Match:', registeredImageBlueprint === imageBlueprintAddress ? '✅' : '❌');
    console.log();
    console.log('Factory State:');
    console.log('   Owner:', owner);
    console.log('   Content Count:', contentCount.toString());
    console.log();

    // ========== TEST UPLOADS ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing Image Uploads...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 1: Tiny 2x2 image
    console.log('Test 1: Tiny 2x2 image (12 bytes)');
    const tiny = '0x' + 'ff0000'.repeat(4); // 4 red pixels
    try {
        const tinyGas = await factory.estimateGas.create_image(2, 2, tiny);
        console.log('✅ Gas estimate:', tinyGas.toString());
        
        const tinyTx = await factory.create_image(2, 2, tiny);
        const tinyReceipt = await tinyTx.wait();
        console.log('✅ Uploaded! Gas used:', tinyReceipt.gasUsed.toString());
        console.log('   Block:', tinyReceipt.blockNumber);
    } catch (e) {
        console.log('❌ Failed:', e.message);
        if (e.error) console.log('   Error:', e.error.message);
    }
    console.log();

    // Test 2: Small 16x16 image (768 bytes)
    console.log('Test 2: Small 16x16 image (768 bytes)');
    const small = '0x' + '00ff00'.repeat(256); // 256 green pixels
    try {
        const smallGas = await factory.estimateGas.create_image(16, 16, small);
        console.log('✅ Gas estimate:', smallGas.toString());
        
        const smallTx = await factory.create_image(16, 16, small);
        const smallReceipt = await smallTx.wait();
        console.log('✅ Uploaded! Gas used:', smallReceipt.gasUsed.toString());
    } catch (e) {
        console.log('❌ Failed:', e.message);
    }
    console.log();

    // Test 3: Badge-sized 32x32 image (3,072 bytes)
    console.log('Test 3: Badge-sized 32x32 image (3,072 bytes)');
    const badge = '0x' + '0000ff'.repeat(1024); // 1024 blue pixels
    try {
        const badgeGas = await factory.estimateGas.create_image(32, 32, badge);
        console.log('✅ Gas estimate:', badgeGas.toString());
        
        const badgeTx = await factory.create_image(32, 32, badge);
        const badgeReceipt = await badgeTx.wait();
        console.log('✅ Uploaded! Gas used:', badgeReceipt.gasUsed.toString());
    } catch (e) {
        console.log('❌ Failed:', e.message);
    }
    console.log();

    // Test 4: Maximum 73x73 image (15,987 bytes - max for V3)
    console.log('Test 4: Maximum 73x73 image (15,987 bytes)');
    const maxPixels = 73 * 73; // 5,329 pixels
    const max = '0x' + 'ffffff'.repeat(maxPixels); // White pixels
    console.log('   Pixels:', maxPixels);
    console.log('   Bytes:', maxPixels * 3);
    try {
        const maxGas = await factory.estimateGas.create_image(73, 73, max);
        console.log('✅ Gas estimate:', maxGas.toString());
        
        const maxTx = await factory.create_image(73, 73, max);
        const maxReceipt = await maxTx.wait();
        console.log('✅ Uploaded! Gas used:', maxReceipt.gasUsed.toString());
        console.log('   🎉 SUCCESS: Maximum size upload works!');
    } catch (e) {
        console.log('❌ Failed:', e.message);
        if (e.error) console.log('   Error:', e.error.message);
    }
    console.log();

    // Test 5: Text upload (16KB max)
    console.log('Test 5: Text upload (16,384 bytes max)');
    const textContent = 'Hello from Anvil! '.repeat(900); // ~16.2KB, will be trimmed
    const textBytes = ethers.utils.toUtf8Bytes(textContent.substring(0, 16384));
    const textHex = ethers.utils.hexlify(textBytes);
    console.log('   Text length:', textBytes.length, 'bytes');
    try {
        const textGas = await factory.estimateGas.create_text(textHex);
        console.log('✅ Gas estimate:', textGas.toString());
        
        const textTx = await factory.create_text(textHex);
        const textReceipt = await textTx.wait();
        console.log('✅ Uploaded! Gas used:', textReceipt.gasUsed.toString());
    } catch (e) {
        console.log('❌ Failed:', e.message);
    }
    console.log();

    // ========== FINAL STATS ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Stats');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const finalCount = await factory.get_content_count();
    console.log('Total uploads:', finalCount.toString());
    console.log();

    // Show all uploaded content
    for (let i = 0; i < finalCount.toNumber(); i++) {
        const entry = await factory.get_content_by_index(i);
        console.log(`Content ${i}:`);
        console.log('   Address:', entry.content_address);
        console.log('   Type:', entry.content_type === 0 ? 'Text' : 'Image');
        if (entry.content_type === 1) {
            console.log('   Dimensions:', entry.width.toString(), 'x', entry.height.toString());
            console.log('   Pixels:', entry.pixel_count.toString());
        }
        console.log('   Size:', entry.data_size.toString(), 'bytes');
        console.log();
    }

    // ========== SAVE DEPLOYMENT ==========
    const deployment = {
        network: 'anvil',
        timestamp: new Date().toISOString(),
        textBlueprintAddress,
        imageBlueprintAddress,
        factoryAddress: factory.address,
        deployerAddress: wallet.address,
        maxImageSize: 15987, // 73x73x3
        maxTextSize: 16384,
        testResults: {
            tiny: '2x2 - 12 bytes',
            small: '16x16 - 768 bytes',
            badge: '32x32 - 3,072 bytes',
            max: '73x73 - 15,987 bytes',
            text: '16,384 bytes'
        }
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'deployment-content-v4-anvil.json'),
        JSON.stringify(deployment, null, 2)
    );

    console.log('✅ Deployment saved to deployment-content-v4-anvil.json');
    console.log();
    console.log('Update contract-registry.js with:');
    console.log(`anvil: '${factory.address}'  // content-factory-v4`);
}

main()
    .then(() => {
        console.log('\n🎉 All tests completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test failed!');
        console.error(error);
        process.exit(1);
    });


