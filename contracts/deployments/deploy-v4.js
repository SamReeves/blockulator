#!/usr/bin/env node

/**
 * Deploy ContentFactoryV4 with Text + Image Blueprints
 * 
 * V4 ARCHITECTURE:
 * - 2 Blueprints: TextContentV4 + ImageContentV3 (reused)
 * - 1 Factory: ContentFactoryV4 (unified)
 * - 2 Content Types: Text (0) + Image (1)
 * 
 * DEPLOYMENT ORDER:
 * 1. Deploy TextContentV4 blueprint
 * 2. Verify blueprint has 4-byte preamble (0xFE71)
 * 3. Deploy ContentFactoryV4 with both blueprint addresses
 * 4. Save addresses to contract-registry.js
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// ============================================================================
// CONFIGURATION
// ============================================================================

const NETWORK = 'sepolia';
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CREATION_FEE = 0;
const CREATION_COOLDOWN = 0;

// Reuse existing ImageContentV3 blueprint from V3 deployment
const IMAGE_BLUEPRINT_ADDRESS = '0xF5793ff8457983Ab6a6b739315069a954C30A238';

// ============================================================================
// PATHS
// ============================================================================

const BYTECODE_DIR = path.join(__dirname, '../build/bytecode');
const ABIS_DIR = path.join(__dirname, '../build/abis');
const OUTPUT_FILE = path.join(__dirname, `deployment-v4-${NETWORK}-${Date.now()}.json`);

// ============================================================================
// PROVIDER & WALLET
// ============================================================================

if (!PRIVATE_KEY) {
    console.error('❌ Missing PRIVATE_KEY environment variable');
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadBytecode(filename) {
    const filepath = path.join(BYTECODE_DIR, filename);
    if (!fs.existsSync(filepath)) {
        throw new Error(`Bytecode file not found: ${filepath}`);
    }
    const bytecode = fs.readFileSync(filepath, 'utf8').trim();
    return bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
}

function loadABI(filename) {
    const filepath = path.join(ABIS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        throw new Error(`ABI file not found: ${filepath}`);
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

async function verifyBlueprintPreamble(address, provider) {
    // EIP-5202: Deployed blueprint must start with 0xFE71 + 2-byte length
    const code = await provider.getCode(address);
    
    if (!code.startsWith('0xfe71')) {
        throw new Error('Invalid blueprint: Missing 0xFE71 preamble');
    }
    console.log('✅ Blueprint preamble verified (0xFE71)');
    
    // Extract length (2 bytes after 0xFE71)
    const lengthHex = code.slice(6, 10);
    const length = parseInt(lengthHex, 16);
    console.log(`   Runtime bytecode length: ${length} bytes`);
}

async function deployContract(name, bytecode, args = []) {
    console.log(`\n📦 Deploying ${name}...`);
    
    const factory = new ethers.ContractFactory(
        loadABI(`${name.toLowerCase()}.json`),
        bytecode,
        wallet
    );
    
    const gasEstimate = await factory.signer.estimateGas(
        factory.getDeployTransaction(...args)
    );
    
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);
    
    const contract = await factory.deploy(...args, {
        gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
    });
    
    console.log(`   Transaction: ${contract.deployTransaction.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    await contract.deployed();
    
    console.log(`✅ ${name} deployed at: ${contract.address}`);
    
    return contract;
}

async function deployBlueprint(name, bytecode) {
    console.log(`\n📦 Deploying ${name} blueprint...`);
    
    // Deploy as raw bytecode (no constructor args for blueprints)
    const gasEstimate = await wallet.estimateGas({
        data: bytecode
    });
    
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);
    
    const tx = await wallet.sendTransaction({
        data: bytecode,
        gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
    });
    
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    
    console.log(`✅ ${name} blueprint deployed at: ${receipt.contractAddress}`);
    
    return {
        address: receipt.contractAddress,
        deployTransaction: tx,
        receipt: receipt
    };
}

// ============================================================================
// MAIN DEPLOYMENT
// ============================================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         ContentFactoryV4 - Unified Deployment                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    const balance = await wallet.getBalance();
    console.log(`👤 Deployer: ${wallet.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    console.log(`🌐 Network: ${NETWORK}`);
    console.log(`📸 Reusing ImageContentV3 blueprint: ${IMAGE_BLUEPRINT_ADDRESS}\n`);
    
    const deploymentInfo = {
        network: NETWORK,
        deployer: wallet.address,
        timestamp: new Date().toISOString(),
        contracts: {}
    };
    
    // ========================================================================
    // STEP 1: Deploy TextContentV4 Blueprint
    // ========================================================================
    
    console.log('─────────────────────────────────────────────────────────────');
    console.log('STEP 1: Deploy TextContentV4 Blueprint');
    console.log('─────────────────────────────────────────────────────────────');
    
    const textBlueprintBytecode = loadBytecode('text_content_v4.bin');
    
    const textBlueprint = await deployBlueprint(
        'text_content_v4',
        textBlueprintBytecode
    );
    
    // Verify deployed blueprint has proper preamble
    await verifyBlueprintPreamble(textBlueprint.address, provider);
    
    deploymentInfo.contracts.text_blueprint = {
        name: 'TextContentV4',
        address: textBlueprint.address,
        deployTx: textBlueprint.deployTransaction.hash,
        gasUsed: textBlueprint.receipt.gasUsed.toString()
    };
    
    // ========================================================================
    // STEP 2: Verify Image Blueprint Exists
    // ========================================================================
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('STEP 2: Verify ImageContentV3 Blueprint');
    console.log('─────────────────────────────────────────────────────────────');
    
    const imageCode = await provider.getCode(IMAGE_BLUEPRINT_ADDRESS);
    if (imageCode === '0x') {
        throw new Error(`ImageContentV3 blueprint not found at ${IMAGE_BLUEPRINT_ADDRESS}`);
    }
    console.log(`✅ ImageContentV3 blueprint verified`);
    console.log(`   Code size: ${(imageCode.length - 2) / 2} bytes`);
    
    deploymentInfo.contracts.image_blueprint = {
        name: 'ImageContentV3',
        address: IMAGE_BLUEPRINT_ADDRESS,
        note: 'Reused from V3 deployment'
    };
    
    // ========================================================================
    // STEP 3: Deploy ContentFactoryV4
    // ========================================================================
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('STEP 3: Deploy ContentFactoryV4');
    console.log('─────────────────────────────────────────────────────────────');
    
    const factoryBytecode = loadBytecode('content_factory_v4.bin');
    
    const factory = await deployContract(
        'content_factory_v4',
        factoryBytecode,
        [
            textBlueprint.address,
            IMAGE_BLUEPRINT_ADDRESS,
            CREATION_FEE,
            CREATION_COOLDOWN
        ]
    );
    
    deploymentInfo.contracts.factory = {
        name: 'ContentFactoryV4',
        address: factory.address,
        deployTx: factory.deployTransaction.hash,
        gasUsed: (await factory.deployTransaction.wait()).gasUsed.toString(),
        config: {
            textBlueprint: textBlueprint.address,
            imageBlueprint: IMAGE_BLUEPRINT_ADDRESS,
            creationFee: CREATION_FEE.toString(),
            creationCooldown: CREATION_COOLDOWN.toString()
        }
    };
    
    // ========================================================================
    // VERIFICATION
    // ========================================================================
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('VERIFICATION');
    console.log('─────────────────────────────────────────────────────────────');
    
    const textBlueprintAddr = await factory.text_blueprint();
    const imageBlueprintAddr = await factory.image_blueprint();
    const owner = await factory.owner();
    
    console.log(`✅ Text Blueprint: ${textBlueprintAddr}`);
    console.log(`✅ Image Blueprint: ${imageBlueprintAddr}`);
    console.log(`✅ Factory Owner: ${owner}`);
    
    assert(textBlueprintAddr === textBlueprint.address, 'Text blueprint mismatch');
    assert(imageBlueprintAddr === IMAGE_BLUEPRINT_ADDRESS, 'Image blueprint mismatch');
    assert(owner === wallet.address, 'Owner mismatch');
    
    // ========================================================================
    // SAVE DEPLOYMENT INFO
    // ========================================================================
    
    fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  ✨ DEPLOYMENT COMPLETE ✨                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 DEPLOYMENT SUMMARY:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Factory:          ${factory.address}`);
    console.log(`Text Blueprint:   ${textBlueprint.address}`);
    console.log(`Image Blueprint:  ${IMAGE_BLUEPRINT_ADDRESS} (reused)`);
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`\n💾 Deployment info saved to: ${OUTPUT_FILE}\n`);
    
    console.log('📝 NEXT STEPS:');
    console.log('1. Update contract-registry.js with new addresses');
    console.log('2. Update frontend to use V4 factory');
    console.log('3. Test text + image creation');
    console.log('4. Verify contracts on Etherscan\n');
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// ============================================================================
// RUN
// ============================================================================

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Deployment failed:', error.message);
        console.error(error);
        process.exit(1);
    });

