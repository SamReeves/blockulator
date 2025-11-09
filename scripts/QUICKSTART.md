# Contract Verification - Quick Start

## 🚀 One-Line Usage

```bash
node scripts/verify-contract.js <ADDRESS> <SOURCE_FILE> [--blueprint]
```

---

## 📝 Common Commands

### Verify Your Deployed Contracts

```bash
# Future Factory
npm run verify:factory

# Eulerian Future Blueprint  
npm run verify:blueprint

# Discussion Board
npm run verify:board

# Discussion Blueprint
npm run verify:discussion
```

### Verify Any Contract

```bash
# Regular contract (auto-compiles as runtime bytecode)
node scripts/verify-contract.js 0xYourAddress contracts/src/path/to/contract.vy

# Blueprint contract (compiles as EIP-5202 blueprint)
node scripts/verify-contract.js 0xYourAddress contracts/src/path/to/contract.vy --blueprint

# On mainnet
node scripts/verify-contract.js 0xYourAddress contracts/src/path/to/contract.vy --network mainnet

# Verbose output
node scripts/verify-contract.js 0xYourAddress contracts/src/path/to/contract.vy -v
```

---

## 💡 Quick Examples

### Example 1: Verify a Game Contract
```bash
node scripts/verify-contract.js \
    0x483470B5B779360b70d4CD7e5253d4d6380aA07d \
    contracts/src/games/pissing_contest.vy
```

### Example 2: Verify a Calculator
```bash
node scripts/verify-contract.js \
    0xca9D2574655b0c414AD11b6F5A5969b5109c5EE4 \
    contracts/src/tools/math/ln.vy
```

### Example 3: Verify on Mainnet with Custom RPC
```bash
node scripts/verify-contract.js \
    0x123... \
    contracts/src/games/dice_gods.vy \
    --network mainnet \
    --rpc https://eth.llamarpc.com
```

---

## 🎯 What You'll See

### ✅ Success Output:
```
✅ Connected to Sepolia Testnet
📡 Fetching on-chain bytecode...
🔨 Compiling source code...
🔍 Comparing bytecodes...
   Match: 100.00%
   Status: ✅ EXACT MATCH

📊 FINAL VERDICT
✅ PERFECT MATCH
   Your local source code is IDENTICAL to the on-chain deployment.
```

### ❌ Mismatch Output:
```
❌ BYTECODE MISMATCH
   Your local source code differs from the on-chain deployment.
   Possible causes:
   - Code has been modified since deployment
   - Different compiler version or settings
   - Wrong source file for this contract
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Could not connect" | Try `--rpc https://rpc.ankr.com/eth_sepolia` |
| "No contract at address" | Check network with `--network sepolia` |
| "Compilation failed" | Install Vyper: `pip install vyper` |
| "Wrong source" | Double-check contract address and file path |

---

## 📚 Full Documentation

See [README.md](./README.md) for:
- Detailed options
- Network configuration
- Blueprint vs regular contracts
- CI/CD integration
- Advanced usage

---

## 🆘 Help

```bash
node scripts/verify-contract.js --help
```

---

**Quick Reference Card** | [Full README](./README.md) | [Project Root](../)


