# Zero-Fee Protocol - Quick Start Deployment

## TL;DR - Deploy Everything in 5 Minutes

```bash
# 1. Set your private key
export PRIVATE_KEY="0x..."

# 2. Run pre-deployment check
./contracts/deployments/pre-deploy-check.sh

# 3. Deploy everything
node contracts/deployments/active/deploy-zero-fee-complete.js

# Done! 🎉
```

## Step-by-Step

### 1️⃣ Prerequisites (One-time setup)

```bash
# Install Node.js dependencies
npm install ethers@5.7.2

# Install Vyper (if not installed)
# See: https://docs.vyperlang.org/en/stable/installing-vyper.html

# Compile contracts
cd contracts
./deployments/compile-and-prepare.sh
cd ..
```

### 2️⃣ Set Environment Variables

```bash
# Required
export PRIVATE_KEY="your_private_key_here"

# Optional (defaults shown)
export RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
export NETWORK="sepolia"
```

### 3️⃣ Pre-Deployment Check

```bash
./contracts/deployments/pre-deploy-check.sh
```

This verifies:
- ✅ Node.js and npm installed
- ✅ ethers.js installed
- ✅ Vyper installed
- ✅ Contracts compiled
- ✅ Environment variables set
- ✅ Zero-fee constants verified
- ✅ Withdrawal functions removed

### 4️⃣ Deploy

**Option A: Deploy Everything**
```bash
node contracts/deployments/active/deploy-zero-fee-complete.js
```

**Option B: Deploy Games Only**
```bash
node contracts/deployments/active/deploy-games-only.js
```

### 5️⃣ Update Frontend

Copy addresses from the generated `addresses-{network}-{timestamp}.js` file to:
```
js/infrastructure/config/contracts.js
```

## Network-Specific Commands

### Sepolia (Testnet)
```bash
export NETWORK="sepolia"
export RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
node contracts/deployments/active/deploy-zero-fee-complete.js
```

### Mainnet
```bash
export NETWORK="mainnet"
export RPC_URL="https://eth.llamarpc.com"
node contracts/deployments/active/deploy-zero-fee-complete.js
```

### Polygon
```bash
export NETWORK="polygon"
export RPC_URL="https://polygon-rpc.com"
node contracts/deployments/active/deploy-zero-fee-complete.js
```

### Arbitrum
```bash
export NETWORK="arbitrum"
export RPC_URL="https://arb1.arbitrum.io/rpc"
node contracts/deployments/active/deploy-zero-fee-complete.js
```

## What Gets Deployed

### Complete Deployment (active/deploy-zero-fee-complete.js)

1. **Games (9 contracts)**
   - King of the Hill
   - Time to Make the Donuts
   - Last Call
   - Pissing Contest
   - Pay It Forward
   - Pay It Backward
   - Message Board
   - Dice Gods
   - Satan Moloch Baal

2. **Futures Market**
   - Eulerian Future Blueprint
   - Future Factory

3. **Discussion Board**
   - Discussion Blueprint
   - Discussion Board

4. **Content System**
   - Content Blueprint
   - Content Factory

5. **Badge System**
   - Badge Blueprint
   - Badge Factory

**Total: 14 blueprints + 14 contracts = 28 deployments**

### Games Only Deployment (active/deploy-games-only.js)

Just the 9 game contracts (no factories/blueprints)

## Gas Estimates

| Deployment | Sepolia | Mainnet (30 gwei) |
|------------|---------|-------------------|
| Complete   | ~0.15 ETH | ~0.3-0.5 ETH |
| Games Only | ~0.05 ETH | ~0.1-0.15 ETH |

## Troubleshooting

### Error: "PRIVATE_KEY not set"
```bash
export PRIVATE_KEY="0x..."
```

### Error: "ABI not found"
```bash
cd contracts
./deployments/compile-and-prepare.sh
cd ..
```

### Error: "Insufficient funds"
Check balance:
```bash
# The script shows your balance before deploying
```

Get testnet ETH:
- Sepolia: https://sepoliafaucet.com/
- Goerli: https://goerlifaucet.com/

### Deployment Fails Midway
Check `deployment-partial-{network}-{timestamp}.json` for successfully deployed contracts.

## Output Files

After deployment, you'll get:

1. **deployment-zero-fee-{network}-{timestamp}.json**
   - Complete deployment details
   - All addresses
   - Transaction hashes
   - Gas usage

2. **addresses-{network}-{timestamp}.js**
   - Ready-to-use address constants
   - Copy to frontend config

## Verification Checklist

After deployment, verify:

```bash
# Check zero fees
✅ Future Factory: 0% creation fee, 0% trade fee
✅ Discussion Board: 0% board fee
✅ All games: 100% winner payouts
✅ No withdrawal functions in any factory

# Check deployment
✅ All contracts deployed
✅ Blueprint addresses match factory references
✅ All transactions confirmed
```

## Next Steps

1. **Update Frontend**
   ```bash
   # Copy addresses to:
   js/infrastructure/config/contracts.js
   ```

2. **Test Contracts**
   - Visit your frontend
   - Connect wallet
   - Test each game/feature

3. **Verify on Etherscan** (Optional)
   ```bash
   npx hardhat verify --network sepolia <address> <args>
   ```

4. **Announce Deployment**
   - Share contract addresses
   - Document on website
   - Update documentation

## Security Reminders

- ⚠️ Never commit private keys
- ⚠️ Use environment variables only
- ⚠️ Test on testnet first
- ⚠️ Verify zero fees after deployment
- ⚠️ Monitor first transactions

## Support

Need help? Check:
1. `DEPLOYMENT.md` - Full documentation
2. Pre-deployment check output
3. Console error messages
4. Network status

## Zero-Fee Guarantee

All deployed contracts have:
- ✅ ZERO owner extraction
- ✅ ZERO fees on transactions
- ✅ 100% value flows to players/users
- ✅ NO withdrawal functions
- ✅ Trustless and permanent

Deploy with confidence! 🚀

