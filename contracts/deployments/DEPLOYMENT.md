# Zero-Fee Protocol Deployment Guide

This guide explains how to deploy the WhaleGames zero-fee protocol to any EVM-compatible network.

## Overview

The protocol consists of:
- **9 Game Contracts** - Standalone games with 100% winner payouts
- **Futures Market** - Factory + Blueprint system (0% fees)
- **Discussion Board** - Factory + Blueprint system (0% fees)
- **Content System** - Factory + Blueprint system (0% fees)
- **Badge System** - Factory + Blueprint system (0% fees)

## Prerequisites

### 1. Install Dependencies
```bash
npm install ethers@5.7.2
```

### 2. Compile Contracts
```bash
cd contracts
./deployments/compile-and-prepare.sh
```

This will compile all Vyper contracts and generate:
- ABIs in `build/abis/`
- Bytecode in `build/bytecode/`
- Blueprints with EIP-5202 preamble

### 3. Set Environment Variables

**Required:**
```bash
export PRIVATE_KEY="your_private_key_here"
```

**Optional:**
```bash
export RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"  # Default: Sepolia
export NETWORK="sepolia"  # Default: sepolia, Options: mainnet, sepolia, etc.
```

## Deployment Options

### Option 1: Complete Deployment (Recommended)

Deploy everything in one transaction batch:

```bash
node contracts/deployments/deploy-zero-fee-complete.js
```

**What it deploys:**
- All 9 game contracts
- Future Factory + Eulerian Future Blueprint
- Discussion Board + Discussion Blueprint
- Content Factory + Content Blueprint
- Badge Factory + Badge Blueprint

**Estimated time:** 5-10 minutes  
**Estimated gas (Sepolia):** ~0.15 ETH  
**Estimated gas (Mainnet):** Variable based on gas price

### Option 2: Games Only

Deploy just the 9 game contracts:

```bash
node contracts/deployments/deploy-games-only.js
```

**Estimated time:** 2-3 minutes  
**Estimated gas (Sepolia):** ~0.05 ETH

### Option 3: Individual Components

Deploy components separately using existing scripts:

```bash
# Future Factory
node contracts/deployments/deploy-factory.js

# Discussion Board
node contracts/deployments/deploy-discussions.js

# Content System
node contracts/deployments/deploy-content.js

# Badge System
node contracts/deployments/deploy-badges.js
```

## Post-Deployment

### 1. Verify Deployment

The script will output a summary with all contract addresses. Verify:
- ✅ All contracts deployed successfully
- ✅ Blueprint addresses match factory references
- ✅ All fees are set to 0%
- ✅ No withdrawal functions exist

### 2. Save Addresses

Deployment info is saved to:
```
deployment-zero-fee-{network}-{timestamp}.json
addresses-{network}-{timestamp}.js
```

### 3. Update Frontend Configuration

Copy addresses from `addresses-{network}-{timestamp}.js` to:
```
js/infrastructure/config/contracts.js
```

Example:
```javascript
const SEPOLIA_ADDRESSES = {
    // Games
    KING_OF_THE_HILL: '0x...',
    TIME_TO_MAKE_THE_DONUTS: '0x...',
    LAST_CALL: '0x...',
    // ... etc
};
```

### 4. Test Contracts

Visit your frontend and test each component:
1. Connect wallet
2. Try creating a future
3. Play a game
4. Post a message
5. Create content
6. Mint a badge

### 5. Verify on Etherscan (Optional)

If you want verified contracts on Etherscan:

```bash
# Install Hardhat verification plugin
npm install --save-dev @nomiclabs/hardhat-etherscan

# Verify each contract
npx hardhat verify --network sepolia <contract_address> <constructor_args>
```

For blueprints, verification requires special handling of the EIP-5202 preamble.

## Deployment Parameters

### Game Contracts

All games have zero fees built-in:
- **King of the Hill**: No parameters (winner takes all)
- **Time to Make the Donuts**: No parameters (winner gets 100%)
- **Last Call**: No parameters (winner gets 100%)
- **Pissing Contest**: Max donations (10), Min donation (0.001 ETH), 0 fee
- **Pay It Forward**: No parameters
- **Pay It Backward**: No parameters (first donation burns)
- **Message Board**: Min post fee (0.0001 ETH), Rate limit (60s)
- **Dice Gods**: No parameters
- **Satan Moloch Baal**: No parameters

### Factory Contracts

All factories have zero fees:
- **Future Factory**: `CREATION_FEE_PERCENT = 0`, `MARKET_FEE_PERCENT = 0`
- **Discussion Board**: `BOARD_FEE_PERCENT = 0`
- **Content Factory**: `creation_fee = 0`, `creation_cooldown = 300`
- **Badge Factory**: `creation_fee = 0`, `creation_cooldown = 300`

## Gas Estimates

### Sepolia (Testnet)
- Complete deployment: ~0.15 ETH
- Games only: ~0.05 ETH
- Single factory: ~0.02-0.03 ETH

### Mainnet (Approximate at 30 gwei)
- Complete deployment: ~0.3-0.5 ETH
- Games only: ~0.1-0.15 ETH
- Single factory: ~0.05-0.08 ETH

**Note:** Gas prices vary significantly. Always check current gas prices before deploying to mainnet.

## Troubleshooting

### "Private key not set"
```bash
export PRIVATE_KEY="0x..."
```

### "ABI not found"
Run the compile script first:
```bash
cd contracts
./deployments/compile-and-prepare.sh
```

### "Insufficient funds"
Ensure your deployer address has enough ETH. Check balance:
```bash
# The script will show your balance before deploying
```

### "Gas estimation failed"
Try increasing the gas limit in the script:
```javascript
gasLimit: 5000000  // Increase if needed
```

### Deployment Fails Midway

If deployment fails partway through, a `deployment-partial-{network}-{timestamp}.json` file will be saved with addresses of successfully deployed contracts. You can:
1. Note which contracts deployed successfully
2. Comment out those sections in the script
3. Re-run to deploy remaining contracts

## Security Considerations

### Before Mainnet Deployment

1. **Audit Contracts**: Have contracts professionally audited
2. **Test Thoroughly**: Deploy to testnet and test all functions
3. **Verify Zero Fees**: Confirm all fee percentages are 0
4. **Check Withdrawal Functions**: Ensure none exist (except blueprint patterns)
5. **Review Immutables**: Double-check immutable addresses after deployment

### Private Key Security

- **Never commit** private keys to git
- Use environment variables only
- Consider using a hardware wallet for mainnet
- Use a dedicated deployment address
- Revoke deployer privileges after deployment if applicable

## Network-Specific Notes

### Sepolia (Recommended for Testing)
- Free testnet ETH from faucets
- Fast block times
- Good for testing

### Mainnet
- Double-check all addresses before deployment
- Monitor gas prices (aim for < 30 gwei)
- Deploy during low-traffic periods
- Consider deploying in stages if gas is high

### Other Networks (Polygon, Arbitrum, etc.)
The contracts are EVM-compatible and should work on any EVM chain:
1. Update RPC_URL to your target network
2. Update NETWORK variable
3. Ensure you have native tokens for gas

## Contract Addresses

After deployment, update these files:
- `js/infrastructure/config/contracts.js` - Frontend configuration
- `contracts/deployments/addresses.js` - Central address registry

## Support

If you encounter issues:
1. Check the console output for specific errors
2. Verify all prerequisites are met
3. Ensure contracts are compiled
4. Check network connectivity
5. Review gas estimates and balance

## Zero-Fee Verification Checklist

After deployment, verify:
- [ ] No `withdraw()` functions in any factory
- [ ] `CREATION_FEE_PERCENT = 0` in future_factory.vy
- [ ] `MARKET_FEE_PERCENT = 0` in future_factory.vy
- [ ] `BOARD_FEE_PERCENT = 0` in board.vy
- [ ] `WINNER_PERCENTAGE = 100` in time_to_make_the_donuts.vy
- [ ] `WINNER_PERCENTAGE = 100` in last_call.vy
- [ ] No `fee_basis_points` in pissing_contest.vy
- [ ] Pay It Backward sends first donation to burn address
- [ ] Message Board has no withdrawal function

## License

All contracts are deployed with zero extraction, making them true public goods.

