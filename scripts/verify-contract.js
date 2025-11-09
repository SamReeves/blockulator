#!/usr/bin/env node

/**
 * Contract Bytecode Verification Utility
 * 
 * Compares on-chain contract bytecode with locally compiled source code.
 * Supports both regular contracts and EIP-5202 blueprints.
 * 
 * Usage:
 *   node scripts/verify-contract.js <address> <source-file> [options]
 * 
 * Examples:
 *   node scripts/verify-contract.js 0x8cf41fb... contracts/src/market/future_factory.vy
 *   node scripts/verify-contract.js 0x2E942C3... contracts/src/market/eulerian_future.vy --blueprint
 *   node scripts/verify-contract.js 0x123... contracts/src/games/dice_gods.vy --network mainnet
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const ethers = require('ethers');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Network configurations
const NETWORKS = {
    sepolia: {
        chainId: 11155111,
        name: 'Sepolia Testnet',
        rpcEndpoints: [
            'https://sepolia.gateway.tenderly.co',
            'https://rpc.sepolia.org',
            'https://eth-sepolia.public.blastapi.io',
            'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
        ]
    },
    mainnet: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        rpcEndpoints: [
            'https://eth.llamarpc.com',
            'https://rpc.ankr.com/eth',
            'https://ethereum.publicnode.com'
        ]
    },
    localhost: {
        chainId: 1337,
        name: 'Local Development',
        rpcEndpoints: ['http://localhost:8545']
    }
};

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function parseArguments() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   CONTRACT BYTECODE VERIFICATION UTILITY                   ║
╚════════════════════════════════════════════════════════════════════════════╝

USAGE:
    node scripts/verify-contract.js <address> <source-file> [options]

ARGUMENTS:
    <address>       Contract address to verify (e.g., 0x8cf41fbE...)
    <source-file>   Path to Vyper source file (e.g., contracts/src/market/future_factory.vy)

OPTIONS:
    --network, -n   Network to verify on (sepolia, mainnet, localhost) [default: sepolia]
    --blueprint, -b Flag to compile as EIP-5202 blueprint
    --rpc           Custom RPC endpoint URL
    --verbose, -v   Show detailed output
    --help, -h      Show this help message

EXAMPLES:
    # Verify a regular contract on Sepolia
    node scripts/verify-contract.js 0x8cf41fbE9abE00e47fDed94FdbdC75C2d07f8193 \\
        contracts/src/market/future_factory.vy

    # Verify a blueprint contract
    node scripts/verify-contract.js 0x2E942C37B0ED14017E502E2aFB038E8657eD5F67 \\
        contracts/src/market/eulerian_future.vy --blueprint

    # Verify on mainnet with custom RPC
    node scripts/verify-contract.js 0x123... contracts/src/games/dice_gods.vy \\
        --network mainnet --rpc https://eth.llamarpc.com

    # Verbose output
    node scripts/verify-contract.js 0x123... contracts/src/market/factory.vy -v

NETWORKS:
    - sepolia   : Sepolia Testnet (Chain ID: 11155111)
    - mainnet   : Ethereum Mainnet (Chain ID: 1)
    - localhost : Local Development (Chain ID: 1337)

OUTPUT:
    - SHA-256 hashes of bytecode
    - Byte-by-byte comparison
    - Match percentage
    - Detailed analysis of differences
    - Final verdict (MATCH/DIFFER)
        `);
        process.exit(0);
    }
    
    if (args.length < 2) {
        console.error('❌ Error: Missing required arguments');
        console.error('Usage: node scripts/verify-contract.js <address> <source-file> [options]');
        console.error('Run with --help for more information');
        process.exit(1);
    }
    
    const config = {
        address: args[0],
        sourceFile: args[1],
        network: 'sepolia',
        blueprint: false,
        rpc: null,
        verbose: false
    };
    
    // Parse options
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--network' || arg === '-n') {
            config.network = args[++i];
        } else if (arg === '--blueprint' || arg === '-b') {
            config.blueprint = true;
        } else if (arg === '--rpc') {
            config.rpc = args[++i];
        } else if (arg === '--verbose' || arg === '-v') {
            config.verbose = true;
        }
    }
    
    // Validate address
    if (!ethers.utils.isAddress(config.address)) {
        console.error(`❌ Error: Invalid Ethereum address: ${config.address}`);
        process.exit(1);
    }
    
    // Validate source file
    if (!fs.existsSync(config.sourceFile)) {
        console.error(`❌ Error: Source file not found: ${config.sourceFile}`);
        process.exit(1);
    }
    
    // Validate network
    if (!NETWORKS[config.network]) {
        console.error(`❌ Error: Unknown network: ${config.network}`);
        console.error(`Available networks: ${Object.keys(NETWORKS).join(', ')}`);
        process.exit(1);
    }
    
    return config;
}

async function connectToNetwork(config) {
    const network = NETWORKS[config.network];
    const endpoints = config.rpc ? [config.rpc] : network.rpcEndpoints;
    
    if (config.verbose) {
        console.log(`\n🌐 Connecting to ${network.name}...`);
    }
    
    for (const rpcUrl of endpoints) {
        try {
            if (config.verbose) {
                console.log(`   Trying: ${rpcUrl}`);
            }
            
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Test connection with timeout
            const networkPromise = provider.getNetwork();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout (5s)')), 5000)
            );
            
            const detectedNetwork = await Promise.race([networkPromise, timeoutPromise]);
            
            if (detectedNetwork.chainId === network.chainId) {
                if (config.verbose) {
                    console.log(`   ✅ Connected (Chain ID: ${detectedNetwork.chainId})`);
                }
                return provider;
            }
        } catch (error) {
            if (config.verbose) {
                console.log(`   ⚠️  Failed: ${error.message}`);
            }
        }
    }
    
    throw new Error(`Could not connect to ${network.name}`);
}

async function compileSource(config) {
    const compileType = config.blueprint ? 'blueprint_bytecode' : 'bytecode_runtime';
    
    if (config.verbose) {
        console.log(`\n🔨 Compiling source as ${config.blueprint ? 'blueprint' : 'runtime'}...`);
    }
    
    try {
        const { stdout, stderr } = await execPromise(
            `vyper ${config.sourceFile} -f ${compileType}`
        );
        
        if (stderr && config.verbose) {
            console.log('   Compiler warnings:', stderr);
        }
        
        return stdout.trim();
    } catch (error) {
        throw new Error(`Compilation failed: ${error.message}`);
    }
}

function analyzeMatch(onChain, compiled, config) {
    const results = {
        identical: false,
        matchPercent: 0,
        firstDiffIndex: -1,
        verdict: ''
    };
    
    // Exact match
    if (onChain === compiled) {
        results.identical = true;
        results.matchPercent = 100;
        results.verdict = 'PERFECT_MATCH';
        return results;
    }
    
    // Find first difference
    const minLength = Math.min(onChain.length, compiled.length);
    for (let i = 0; i < minLength; i++) {
        if (onChain[i] !== compiled[i]) {
            results.firstDiffIndex = i;
            break;
        }
    }
    
    if (results.firstDiffIndex === -1) {
        results.matchPercent = (minLength / Math.max(onChain.length, compiled.length)) * 100;
        results.verdict = 'LENGTH_MISMATCH';
    } else {
        results.matchPercent = (results.firstDiffIndex / minLength) * 100;
        
        if (results.matchPercent > 98) {
            results.verdict = 'METADATA_DIFF';
        } else if (results.matchPercent > 90) {
            results.verdict = 'MINOR_DIFF';
        } else {
            results.verdict = 'MAJOR_DIFF';
        }
    }
    
    return results;
}

async function verifyContract(config) {
    console.log('\n' + '═'.repeat(80));
    console.log('🔬 CONTRACT BYTECODE VERIFICATION');
    console.log('═'.repeat(80));
    console.log(`   Contract Address: ${config.address}`);
    console.log(`   Source File:      ${config.sourceFile}`);
    console.log(`   Network:          ${NETWORKS[config.network].name}`);
    console.log(`   Type:             ${config.blueprint ? 'Blueprint (EIP-5202)' : 'Regular Contract'}`);
    console.log('═'.repeat(80));
    
    try {
        // Step 1: Connect to network
        const provider = await connectToNetwork(config);
        console.log(`✅ Connected to ${NETWORKS[config.network].name}`);
        
        // Step 2: Fetch on-chain bytecode
        console.log('\n📡 Fetching on-chain bytecode...');
        const onChainBytecode = await provider.getCode(config.address);
        
        if (onChainBytecode === '0x' || onChainBytecode === '0x0') {
            console.log('   ❌ No contract deployed at this address!');
            return false;
        }
        
        console.log(`   Length: ${onChainBytecode.length} chars (${onChainBytecode.length / 2} bytes)`);
        console.log(`   SHA-256: ${sha256(onChainBytecode)}`);
        
        if (config.verbose) {
            console.log(`   First 66 chars: ${onChainBytecode.substring(0, 66)}...`);
            console.log(`   Last 66 chars:  ...${onChainBytecode.substring(onChainBytecode.length - 66)}`);
        }
        
        // Step 3: Compile source
        console.log('\n🔨 Compiling source code...');
        const compiledBytecode = await compileSource(config);
        
        console.log(`   Length: ${compiledBytecode.length} chars (${compiledBytecode.length / 2} bytes)`);
        console.log(`   SHA-256: ${sha256(compiledBytecode)}`);
        
        if (config.verbose) {
            console.log(`   First 66 chars: ${compiledBytecode.substring(0, 66)}...`);
            console.log(`   Last 66 chars:  ...${compiledBytecode.substring(compiledBytecode.length - 66)}`);
        }
        
        // Step 4: Handle blueprint format
        let bytecodeToCompare = compiledBytecode;
        let onChainToCompare = onChainBytecode;
        
        if (config.blueprint) {
            // On-chain blueprint might be deployed (starts with 0xfe71)
            // Compiled blueprint might be full deployment code (includes init code)
            if (onChainBytecode.startsWith('0xfe71')) {
                // Extract blueprint from compiled code if present
                const fe71Index = compiledBytecode.indexOf('fe71');
                if (fe71Index > 0) {
                    bytecodeToCompare = '0x' + compiledBytecode.substring(fe71Index);
                    if (config.verbose) {
                        console.log('\n💡 Extracted blueprint from compiled output');
                        console.log(`   Blueprint starts at index: ${fe71Index}`);
                    }
                }
            }
        }
        
        // Step 5: Compare bytecodes
        console.log('\n🔍 Comparing bytecodes...');
        const analysis = analyzeMatch(onChainToCompare, bytecodeToCompare, config);
        
        console.log(`   Match: ${analysis.matchPercent.toFixed(2)}%`);
        
        if (analysis.identical) {
            console.log('   Status: ✅ EXACT MATCH - Bytecodes are identical');
        } else {
            console.log(`   Status: ${analysis.verdict}`);
            
            if (analysis.firstDiffIndex > 0) {
                console.log(`   First difference at position: ${analysis.firstDiffIndex}`);
                
                if (config.verbose) {
                    const start = analysis.firstDiffIndex;
                    console.log(`   On-chain: ${onChainToCompare.substring(start, start + 40)}...`);
                    console.log(`   Compiled: ${bytecodeToCompare.substring(start, start + 40)}...`);
                }
            }
        }
        
        // Step 6: Source file info
        console.log('\n📄 Source file information:');
        const sourceCode = fs.readFileSync(config.sourceFile, 'utf8');
        const lines = sourceCode.split('\n').length;
        const versionMatch = sourceCode.match(/# @version (.+)/);
        
        console.log(`   Lines: ${lines}`);
        console.log(`   Vyper version: ${versionMatch ? versionMatch[1] : 'Not specified'}`);
        
        // Final verdict
        console.log('\n' + '═'.repeat(80));
        console.log('📊 FINAL VERDICT');
        console.log('═'.repeat(80));
        
        if (analysis.identical) {
            console.log('✅ PERFECT MATCH');
            console.log('   Your local source code is IDENTICAL to the on-chain deployment.');
            return true;
        } else if (analysis.verdict === 'METADATA_DIFF') {
            console.log('✅ MATCH (metadata difference only)');
            console.log('   Your local source code matches on-chain (compiler metadata differs).');
            return true;
        } else if (analysis.verdict === 'LENGTH_MISMATCH') {
            console.log('⚠️  LENGTH MISMATCH');
            console.log('   Bytecodes have different lengths but matching prefixes.');
            console.log('   This may indicate a minor compiler difference.');
            return false;
        } else {
            console.log('❌ BYTECODE MISMATCH');
            console.log('   Your local source code differs from the on-chain deployment.');
            console.log('   Possible causes:');
            console.log('   - Code has been modified since deployment');
            console.log('   - Different compiler version or settings');
            console.log('   - Wrong source file for this contract');
            return false;
        }
        
    } catch (error) {
        console.error(`\n❌ Verification failed: ${error.message}`);
        if (config.verbose) {
            console.error(error.stack);
        }
        return false;
    } finally {
        console.log('═'.repeat(80) + '\n');
    }
}

// Main execution
if (require.main === module) {
    const config = parseArguments();
    
    verifyContract(config).then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { verifyContract, parseArguments };

