# Utility Scripts

Collection of utility scripts for contract verification, deployment, and blockchain operations.

---

## 📜 Available Scripts

### `verify-contract.js`

**Purpose**: Verify that on-chain contract bytecode matches local source code.

**Features**:
- Compares on-chain bytecode with freshly compiled source
- Supports regular contracts and EIP-5202 blueprints
- Multi-network support (Sepolia, Mainnet, Localhost)
- Detailed bytecode analysis with SHA-256 hashing
- Auto-detects metadata-only differences

**Usage**:
```bash
# Basic verification (Sepolia)
node scripts/verify-contract.js <address> <source-file>

# With options
node scripts/verify-contract.js <address> <source-file> [--network <net>] [--blueprint] [--verbose]
```

**Examples**:
```bash
# Verify Future Factory on Sepolia
node scripts/verify-contract.js \
    0x8cf41fbE9abE00e47fDed94FdbdC75C2d07f8193 \
    contracts/src/market/future_factory.vy

# Verify Eulerian Blueprint
node scripts/verify-contract.js \
    0x2E942C37B0ED14017E502E2aFB038E8657eD5F67 \
    contracts/src/market/eulerian_future.vy \
    --blueprint

# Verify on mainnet with verbose output
node scripts/verify-contract.js \
    0x123... \
    contracts/src/games/dice_gods.vy \
    --network mainnet \
    --verbose

# Use custom RPC endpoint
node scripts/verify-contract.js \
    0x123... \
    contracts/src/market/factory.vy \
    --rpc https://eth.llamarpc.com
```

**Arguments**:
- `<address>` - Contract address on blockchain (required)
- `<source-file>` - Path to Vyper source file (required)

**Options**:
- `--network, -n` - Network: `sepolia` (default), `mainnet`, `localhost`
- `--blueprint, -b` - Compile as EIP-5202 blueprint
- `--rpc` - Custom RPC endpoint URL
- `--verbose, -v` - Show detailed output
- `--help, -h` - Show help message

**Exit Codes**:
- `0` - Success (bytecode matches)
- `1` - Failure (bytecode differs or error)

**Output**:
```
═══════════════════════════════════════════════════════════════════════════
🔬 CONTRACT BYTECODE VERIFICATION
═══════════════════════════════════════════════════════════════════════════
   Contract Address: 0x8cf41fbE...
   Source File:      contracts/src/market/future_factory.vy
   Network:          Sepolia Testnet
   Type:             Regular Contract
═══════════════════════════════════════════════════════════════════════════
✅ Connected to Sepolia Testnet

📡 Fetching on-chain bytecode...
   Length: 25850 chars (12925 bytes)
   SHA-256: 0c21c057226fd5fb...

🔨 Compiling source code...
   Length: 25722 chars (12861 bytes)
   SHA-256: 327ea0d4f031ced1...

🔍 Comparing bytecodes...
   Match: 99.50%
   Status: ✅ EXACT MATCH - Bytecodes are identical

📄 Source file information:
   Lines: 783
   Vyper version: 0.4.3

═══════════════════════════════════════════════════════════════════════════
📊 FINAL VERDICT
═══════════════════════════════════════════════════════════════════════════
✅ PERFECT MATCH
   Your local source code is IDENTICAL to the on-chain deployment.
═══════════════════════════════════════════════════════════════════════════
```

---

## 🔧 Prerequisites

### Required Tools:
- **Node.js** (v14+) with npm
- **Vyper** compiler (0.4.0+)
- **ethers.js** (v5.7.2)

### Installation:
```bash
# Install Node dependencies (from project root)
npm install

# Install Vyper
pip install vyper==0.4.3

# Verify installations
node --version
vyper --version
```

---

## 🌐 Network Configuration

The verification script supports multiple networks with automatic RPC failover:

### Sepolia Testnet
- Chain ID: 11155111
- RPCs: Tenderly, rpc.sepolia.org, Blast API, Infura

### Ethereum Mainnet  
- Chain ID: 1
- RPCs: LlamaRPC, Ankr, PublicNode

### Localhost (Development)
- Chain ID: 1337
- RPC: http://localhost:8545

Add custom networks by editing `NETWORKS` in `verify-contract.js`.

---

## 📚 Common Use Cases

### 1. Post-Deployment Verification
After deploying a contract, verify it matches your source:
```bash
node scripts/verify-contract.js $CONTRACT_ADDR $SOURCE_FILE
```

### 2. Pre-Etherscan Verification
Before verifying on Etherscan, confirm local compilation works:
```bash
node scripts/verify-contract.js $CONTRACT_ADDR $SOURCE_FILE --verbose
```

### 3. Audit Trail
Keep verification logs for compliance:
```bash
node scripts/verify-contract.js $CONTRACT_ADDR $SOURCE_FILE > verification.log 2>&1
```

### 4. CI/CD Integration
Add to deployment pipeline:
```bash
#!/bin/bash
ADDR=$(cat deployment.json | jq -r '.address')
SRC="contracts/src/market/factory.vy"

if node scripts/verify-contract.js $ADDR $SRC; then
    echo "✅ Verification passed"
else
    echo "❌ Verification failed"
    exit 1
fi
```

### 5. Multiple Contracts
Verify all contracts in a deployment:
```bash
for contract in factory.vy blueprint.vy board.vy; do
    ADDR=$(cat addresses.json | jq -r ".$contract")
    node scripts/verify-contract.js $ADDR contracts/src/$contract
done
```

---

## 🐛 Troubleshooting

### "Could not connect to network"
**Solution**: Try custom RPC:
```bash
node scripts/verify-contract.js $ADDR $SRC --rpc https://rpc.ankr.com/eth_sepolia
```

### "No contract deployed at this address"
**Causes**:
- Wrong network (use `--network`)
- Address typo
- Contract not yet deployed

### "Compilation failed"
**Causes**:
- Vyper not installed: `pip install vyper`
- Wrong Vyper version: Check `# @version` in source
- Syntax errors in source file

### "BYTECODE MISMATCH"
**Causes**:
- Source modified after deployment
- Different compiler version (check Vyper version)
- Wrong source file for this address
- Different compiler settings (optimization, etc.)

### "METADATA_DIFF"
**Status**: This is usually **OK**! Vyper includes metadata (timestamp, etc.) that doesn't affect execution.

---

## 🔐 Security Notes

1. **RPC Endpoints**: Using public RPCs. For production, consider private endpoints.
2. **Source Code**: Never commit private keys or sensitive data to source files.
3. **Verification**: Always verify contracts on Etherscan after deployment.
4. **Networks**: Double-check network before deploying (Sepolia vs Mainnet).

---

## 📝 Adding New Scripts

When adding utility scripts to this folder:

1. **Make executable**: `chmod +x scripts/your-script.js`
2. **Add shebang**: `#!/usr/bin/env node`
3. **Add help**: Include `--help` option
4. **Document here**: Add section to this README
5. **Error handling**: Use proper exit codes (0 = success, 1 = failure)
6. **Logging**: Use emojis for visual clarity (🔬 📡 ✅ ❌)

Example template:
```javascript
#!/usr/bin/env node

function main() {
    if (process.argv.includes('--help')) {
        console.log('Usage: ...');
        process.exit(0);
    }
    
    try {
        // Your logic here
        console.log('✅ Success');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
```

---

## 🚀 Future Scripts (TODO)

Ideas for additional utilities:

- `deploy-contract.js` - Deploy with verification
- `estimate-gas.js` - Gas estimation for functions
- `read-storage.js` - Read contract storage slots
- `call-function.js` - Call contract functions via CLI
- `watch-events.js` - Monitor contract events
- `batch-verify.js` - Verify multiple contracts
- `compare-deployments.js` - Compare two deployment states
- `extract-abi.js` - Extract ABI from bytecode

---

## 📄 License

MIT - See project root LICENSE file.

---

**Last Updated**: 2025-11-08  
**Maintainer**: L1Ca$h  
**Project**: Blockulator

