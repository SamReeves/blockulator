/**
 * Test various image dimensions to find optimal sizes for on-chain storage
 * Tests different aspect ratios and sizes up to the 16KB limit
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Dimension combinations to test (width, height, description)
const DIMENSIONS_TO_TEST = [
    // Current
    { width: 64, height: 64, name: "Square 64×64 (current)" },
    
    // Larger squares
    { width: 70, height: 70, name: "Square 70×70" },
    { width: 73, height: 73, name: "Square 73×73 (near max)" },
    
    // Wider rectangles
    { width: 80, height: 64, name: "Wide 80×64" },
    { width: 85, height: 64, name: "Wide 85×64" },
    { width: 96, height: 56, name: "Widescreen 96×56" },
    { width: 128, height: 42, name: "Ultra-wide 128×42" },
    
    // Taller rectangles
    { width: 64, height: 80, name: "Tall 64×80" },
    { width: 64, height: 85, name: "Tall 64×85" },
    { width: 56, height: 96, name: "Tall 56×96" },
    
    // Balanced large
    { width: 80, height: 68, name: "Balanced 80×68" },
    { width: 68, height: 80, name: "Balanced 68×80" },
    
    // Edge cases (should fail - over 16KB)
    { width: 74, height: 74, name: "Square 74×74 (should fail)" },
    { width: 128, height: 43, name: "Wide 128×43 (should fail)" },
];

function generateTestImage(width, height) {
    /**
     * Generate a gradient test pattern
     * Returns RGB bytes in row-major order
     */
    const pixelCount = width * height;
    const bytes = Buffer.alloc(pixelCount * 3);
    
    let offset = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Create a gradient pattern for visual verification
            const r = Math.floor((x / width) * 255);
            const g = Math.floor((y / height) * 255);
            const b = 128; // Constant blue channel
            
            bytes[offset++] = r;
            bytes[offset++] = g;
            bytes[offset++] = b;
        }
    }
    
    return '0x' + bytes.toString('hex');
}

async function testDimension(factory, wallet, dimension) {
    const { width, height, name } = dimension;
    const totalPixels = width * height;
    const totalBytes = totalPixels * 3;
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${name}`);
    console.log(`Dimensions: ${width}×${height} = ${totalPixels.toLocaleString()} pixels`);
    console.log(`Data size: ${totalBytes.toLocaleString()} bytes (${(totalBytes/1024).toFixed(2)}KB)`);
    console.log('='.repeat(70));
    
    // Check theoretical limit
    if (totalBytes > 16384) {
        console.log('⚠️  WARNING: Exceeds theoretical 16KB limit');
    }
    
    try {
        // Generate test data
        console.log('🎨 Generating test image...');
        const pixelData = generateTestImage(width, height);
        console.log(`   Generated ${pixelData.length - 2} hex chars (${(pixelData.length - 2) / 2} bytes)`);
        
        // Estimate gas
        console.log('⚙️  Estimating gas...');
        const gasEstimate = await factory.estimateGas.create_image(
            width,
            height,
            pixelData,
            { value: 0 }
        );
        console.log(`   Estimated gas: ${gasEstimate.toLocaleString()}`);
        
        // Get gas price
        const gasPrice = await wallet.provider.getGasPrice();
        const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
        const estimatedCost = gasEstimate.mul(gasPrice);
        console.log(`   Gas price: ${gasPriceGwei} gwei`);
        console.log(`   Estimated cost: ${ethers.utils.formatEther(estimatedCost)} ETH`);
        
        // Deploy
        console.log('🚀 Creating image contract...');
        const tx = await factory.create_image(width, height, pixelData, {
            value: 0,
            gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
        });
        
        console.log(`   Tx hash: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        
        // Parse event to get contract address
        const event = receipt.events.find(e => e.event === 'ContentCreated');
        const contentAddress = event?.args?.content_address || 'unknown';
        
        console.log('✅ SUCCESS!');
        console.log(`   Content address: ${contentAddress}`);
        console.log(`   Gas used: ${receipt.gasUsed.toLocaleString()}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        
        // Verify dimensions
        if (contentAddress !== 'unknown') {
            const contentABI = [
                'function image_width() view returns (uint256)',
                'function image_height() view returns (uint256)',
                'function actual_size() view returns (uint256)'
            ];
            const content = new ethers.Contract(contentAddress, contentABI, wallet);
            
            const storedWidth = await content.image_width();
            const storedHeight = await content.image_height();
            const storedSize = await content.actual_size();
            
            console.log('🔍 Verification:');
            console.log(`   Width: ${storedWidth} (expected: ${width}) ${storedWidth.toNumber() === width ? '✓' : '✗'}`);
            console.log(`   Height: ${storedHeight} (expected: ${height}) ${storedHeight.toNumber() === height ? '✓' : '✗'}`);
            console.log(`   Size: ${storedSize} bytes (expected: ${totalBytes}) ${storedSize.toNumber() === totalBytes ? '✓' : '✗'}`);
        }
        
        return {
            success: true,
            width,
            height,
            pixels: totalPixels,
            bytes: totalBytes,
            gasUsed: receipt.gasUsed.toNumber(),
            gasEstimate: gasEstimate.toNumber(),
            cost: ethers.utils.formatEther(estimatedCost),
            address: contentAddress,
            txHash: tx.hash
        };
        
    } catch (error) {
        console.error('❌ FAILED');
        console.error(`   Error: ${error.message}`);
        
        // Categorize error
        let errorType = 'Unknown';
        if (error.message.includes('Dimensions too large')) {
            errorType = 'Dimension limit exceeded';
        } else if (error.message.includes('Image too large')) {
            errorType = 'Size limit exceeded';
        } else if (error.message.includes('gas')) {
            errorType = 'Gas limit exceeded';
        } else if (error.message.includes('revert')) {
            errorType = 'Contract reverted';
        }
        
        console.error(`   Reason: ${errorType}`);
        
        return {
            success: false,
            width,
            height,
            pixels: totalPixels,
            bytes: totalBytes,
            error: error.message,
            errorType
        };
    }
}

async function runTests(network = 'sepolia') {
    console.log('🧪 Image Dimension Testing');
    console.log('===========================\n');
    
    // Setup provider
    let provider, wallet;
    
    if (network === 'sepolia') {
        console.log('📍 Testing on SEPOLIA TESTNET\n');
        
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        if (!PRIVATE_KEY) {
            throw new Error('Set PRIVATE_KEY environment variable');
        }
        
        provider = new ethers.providers.JsonRpcProvider(
            process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
        );
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
    } else if (network === 'local') {
        console.log('📍 Testing on LOCAL NODE\n');
        provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        wallet = new ethers.Wallet(privateKey, provider);
    } else {
        throw new Error('Unknown network. Use "local" or "sepolia"');
    }
    
    const address = await wallet.getAddress();
    const balance = await wallet.getBalance();
    
    console.log(`Deployer: ${address}`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
    
    // Load factory contract
    const deploymentPath = path.join(__dirname, '../contracts/deployments/deployment-content-sepolia-1762834228712.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const factoryAddress = deployment.contracts.content_factory;
    
    console.log(`Content Factory: ${factoryAddress}\n`);
    
    // Load ABI
    const factoryABI = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../contracts/build/abis/content_factory.json'), 'utf8')
    );
    
    const factory = new ethers.Contract(factoryAddress, factoryABI, wallet);
    
    // Run tests
    const results = [];
    
    for (const dimension of DIMENSIONS_TO_TEST) {
        const result = await testDimension(factory, wallet, dimension);
        results.push(result);
        
        // Delay between tests (be nice to testnet)
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70) + '\n');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}\n`);
    
    if (successful.length > 0) {
        const maxSize = successful.reduce((max, r) => r.bytes > max.bytes ? r : max);
        console.log(`📊 Maximum successful size:`);
        console.log(`   Dimensions: ${maxSize.width}×${maxSize.height}`);
        console.log(`   Total: ${maxSize.pixels.toLocaleString()} pixels`);
        console.log(`   Size: ${maxSize.bytes.toLocaleString()} bytes (${(maxSize.bytes/1024).toFixed(2)}KB)`);
        console.log(`   Gas: ${maxSize.gasUsed.toLocaleString()}`);
        console.log(`   Cost: ${maxSize.cost} ETH`);
        console.log(`   Contract: ${maxSize.address}\n`);
    }
    
    console.log('📈 Gas efficiency by size:');
    console.log('-'.repeat(70));
    successful.forEach(r => {
        const gasPerPixel = r.gasUsed / r.pixels;
        const gasPerByte = r.gasUsed / r.bytes;
        console.log(`${r.width.toString().padStart(3)}×${r.height.toString().padStart(3)} ` +
                   `(${r.bytes.toString().padStart(5)} bytes): ` +
                   `${r.gasUsed.toLocaleString().padStart(9)} gas ` +
                   `(${gasPerByte.toFixed(1)} gas/byte, ${gasPerPixel.toFixed(1)} gas/pixel)`);
    });
    
    if (failed.length > 0) {
        console.log('\n❌ Failed dimensions:');
        console.log('-'.repeat(70));
        failed.forEach(r => {
            console.log(`${r.width}×${r.height} (${r.bytes} bytes): ${r.errorType}`);
        });
    }
    
    // Save results
    const resultsFile = path.join(__dirname, `image-dimensions-${network}-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Generate recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(70));
    
    if (successful.length > 0) {
        const squares = successful.filter(r => r.width === r.height);
        const wide = successful.filter(r => r.width > r.height);
        const tall = successful.filter(r => r.height > r.width);
        
        if (squares.length > 0) {
            const bestSquare = squares.reduce((max, r) => r.pixels > max.pixels ? r : max);
            console.log(`Best square: ${bestSquare.width}×${bestSquare.height} (${(bestSquare.bytes/1024).toFixed(2)}KB)`);
        }
        
        if (wide.length > 0) {
            const bestWide = wide.reduce((max, r) => r.pixels > max.pixels ? r : max);
            console.log(`Best wide: ${bestWide.width}×${bestWide.height} (${(bestWide.bytes/1024).toFixed(2)}KB)`);
        }
        
        if (tall.length > 0) {
            const bestTall = tall.reduce((max, r) => r.pixels > max.pixels ? r : max);
            console.log(`Best tall: ${bestTall.width}×${bestTall.height} (${(bestTall.bytes/1024).toFixed(2)}KB)`);
        }
        
        console.log('\nSuggested constants for content.vy:');
        const maxDim = Math.max(...successful.map(r => Math.max(r.width, r.height)));
        const maxBytes = Math.max(...successful.map(r => r.bytes));
        console.log(`MAX_IMAGE_DIMENSION: constant(uint256) = ${maxDim}`);
        console.log(`MAX_IMAGE_SIZE: constant(uint256) = ${maxBytes}  # ~${(maxBytes/1024).toFixed(1)}KB`);
    }
}

// Run tests
const network = process.argv[2] || 'sepolia';

runTests(network)
    .then(() => {
        console.log('\n✅ Testing complete');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });






