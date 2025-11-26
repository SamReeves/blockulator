# Zero-Fee Protocol Deployment Scripts

This directory contains all deployment scripts and documentation for the WhaleGames zero-fee protocol.

## 🚀 Quick Start

```bash
# 1. Check if you're ready
./pre-deploy-check.sh

# 2. Deploy everything
export PRIVATE_KEY="0x..."
node active/deploy-zero-fee-complete.js
```

That's it! See `QUICK_START.md` for details.

## 📁 Files in This Directory

### Deployment Scripts

| File | Purpose | What It Deploys |
|------|---------|-----------------|
| **`active/deploy-zero-fee-complete.js`** | Full protocol deployment | All 9 games + 4 factories + 4 blueprints |
| **`active/deploy-games-only.js`** | Games only deployment | Just the 9 game contracts |
| **`active/deploy-factory.js`** | Futures market only | Future Factory + Blueprint |
| **`active/deploy-discussions.js`** | Discussion board only | Board + Blueprint |
| **`active/deploy-content.js`** | Content system only | Content Factory + Blueprint |
| **`active/deploy-badges.js`** | Badge system only | Badge Factory + Blueprint |
| **`active/deploy-v3.js`** | V3 compression system | ImageContentV3 + ContentFactoryV3 |
| **`active/deploy-v4.js`** | V4 unified content | TextContentV4 + ImageContentV3 + ContentFactoryV4 |
| **`math-tools/deploy-all-math-tools.js`** | Math tools deployment | All 20 math tool contracts |

### Utilities

| File | Purpose |
|------|---------|
| **`pre-deploy-check.sh`** | Pre-deployment verification (run this first!) |
| **`compile-and-prepare.sh`** | Compile all Vyper contracts |
| **`utils/update-addresses.sh`** | Update address configuration files |
| **`utils/prepare-blueprint.js`** | Prepare blueprint contracts with EIP-5202 preamble |

### Documentation

| File | Content |
|------|---------|
| **`QUICK_START.md`** | 📖 Start here! Deploy in 5 minutes |
| **`DEPLOYMENT.md`** | 📚 Complete deployment guide |
| **`README.md`** | 📄 This file |

### Output Files (Generated)

After deployment, you'll see:
- `deployment-zero-fee-{network}-{timestamp}.json` - Full deployment details
- `addresses-{network}-{timestamp}.js` - Ready-to-use addresses
- `deployment-partial-{network}-{timestamp}.json` - If deployment fails midway

## 🎯 Common Tasks

### Deploy to Sepolia Testnet
```bash
export PRIVATE_KEY="0x..."
export NETWORK="sepolia"
node active/deploy-zero-fee-complete.js
```

### Deploy to Mainnet
```bash
export PRIVATE_KEY="0x..."
export NETWORK="mainnet"
export RPC_URL="https://eth.llamarpc.com"
node active/deploy-zero-fee-complete.js
```

### Deploy Only Games
```bash
export PRIVATE_KEY="0x..."
node active/deploy-games-only.js
```

### Check Before Deploying
```bash
./pre-deploy-check.sh
```

### Compile Contracts
```bash
./compile-and-prepare.sh
```

## 📋 Pre-Deployment Checklist

- [ ] Node.js and npm installed
- [ ] ethers.js installed (`npm install ethers@5.7.2`)
- [ ] Vyper installed
- [ ] Contracts compiled (`./compile-and-prepare.sh`)
- [ ] Private key set (`export PRIVATE_KEY="0x..."`)
- [ ] Sufficient ETH in deployer wallet
- [ ] Run pre-deployment check (`./pre-deploy-check.sh`)

## 🔍 What Gets Deployed

### Complete Deployment (17 contracts)

**Games (9):**
1. King of the Hill
2. Time to Make the Donuts
3. Last Call
4. Pissing Contest
5. Pay It Forward
6. Pay It Backward
7. Message Board
8. Dice Gods
9. Satan Moloch Baal

**Factories (4):**
1. Future Factory
2. Discussion Board
3. Content Factory
4. Badge Factory

**Blueprints (4):**
1. Eulerian Future Blueprint
2. Discussion Blueprint
3. Content Blueprint
4. Badge Blueprint

## 💰 Gas Estimates

| Deployment | Sepolia | Mainnet (30 gwei) |
|------------|---------|-------------------|
| Complete   | ~0.15 ETH | ~0.3-0.5 ETH |
| Games Only | ~0.05 ETH | ~0.1-0.15 ETH |
| Single Factory | ~0.02 ETH | ~0.05-0.08 ETH |

## ✅ Zero-Fee Guarantee

All deployed contracts have:
- ✅ **Zero owner extraction** - No fees go to deployer
- ✅ **Zero withdrawal functions** - Cannot extract later
- ✅ **100% payouts** - All value to players/users
- ✅ **Trustless** - No owner privileges
- ✅ **Permanent** - Cannot be changed

## 🆘 Troubleshooting

### Common Errors

**"PRIVATE_KEY not set"**
```bash
export PRIVATE_KEY="0x..."
```

**"ABI not found"**
```bash
./compile-and-prepare.sh
```

**"Insufficient funds"**
- Check wallet balance
- Get testnet ETH from faucet

**Deployment fails midway**
- Check `deployment-partial-*.json` 
- Note which contracts deployed
- Comment out completed sections
- Re-run deployment

### Getting Help

1. Read error message carefully
2. Check pre-deployment script output
3. Review `DEPLOYMENT.md` for details
4. Verify environment variables are set

## 📚 Documentation

- **Start Here**: `QUICK_START.md` - Deploy in 5 minutes
- **Complete Guide**: `DEPLOYMENT.md` - Full documentation
- **Implementation Summary**: `../ZERO_FEE_IMPLEMENTATION.md` - What changed

## 🔗 Network-Specific RPCs

### Testnets
```bash
# Sepolia
export RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"

# Goerli (deprecated)
export RPC_URL="https://ethereum-goerli-rpc.publicnode.com"
```

### Mainnets
```bash
# Ethereum
export RPC_URL="https://eth.llamarpc.com"

# Polygon
export RPC_URL="https://polygon-rpc.com"

# Arbitrum
export RPC_URL="https://arb1.arbitrum.io/rpc"

# Optimism
export RPC_URL="https://mainnet.optimism.io"
```

## 🎉 After Deployment

1. **Save addresses** - They're in `addresses-{network}-{timestamp}.js`
2. **Update frontend** - Copy to `js/infrastructure/config/contracts.js`
3. **Test thoroughly** - Try all features
4. **Verify zero-fee** - Check constants on Etherscan
5. **Celebrate!** - You've deployed a true public good 🎊

## 📞 Support

Need help?
1. Check `QUICK_START.md` first
2. Review `DEPLOYMENT.md` for details
3. Run `./pre-deploy-check.sh` for diagnostics
4. Check console output for specific errors

## 🔐 Security Reminders

- ⚠️ **Never commit private keys**
- ⚠️ Use environment variables only
- ⚠️ Test on testnet first
- ⚠️ Verify zero-fee constants after deployment
- ⚠️ Double-check addresses before using

---

**Zero-Fee Protocol** | **100% to Players** | **No Owner Extraction**

*Deploy with confidence!* 🚀

