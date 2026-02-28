# Blockulator Deployment Scripts

Clean, focused deployment setup for **Badges** and **Uploads** systems.

## Directory Structure

```
deployments/
├── compile-and-prepare.sh          # Compile any Vyper contract
├── deploy.html                     # Web UI for deployment
└── active/
    ├── deploy-badges.js            # Deploy badges to Sepolia
    ├── test-content-anvil.js       # Test uploads on Anvil
    └── deployment-content-v4-anvil.json  # Anvil deployment record
```

## Quick Start

### 1. Compile Contracts

**Badge System:**
```bash
./compile-and-prepare.sh ../src/identity/badge.vy BADGE
./compile-and-prepare.sh ../src/identity/badge_factory.vy BADGE_FACTORY
```

**Upload System:**
```bash
./compile-and-prepare.sh ../src/content/image_content_v3.vy IMAGE_CONTENT_V3
./compile-and-prepare.sh ../src/content/text_content_v4.vy TEXT_CONTENT_V4
./compile-and-prepare.sh ../src/content/content_factory_v4.vy CONTENT_FACTORY_V4
```

### 2. Test on Anvil

**Start Anvil:**
```bash
anvil
```

**Test Uploads (includes deployment):**
```bash
cd active
node test-content-anvil.js
```

This will:
- Deploy both blueprints (text + image)
- Deploy factory V4
- Test 5 different upload scenarios
- Save results to `deployment-content-v4-anvil.json`

### 3. Deploy to Sepolia

**Set environment:**
```bash
export PRIVATE_KEY="your_private_key"
export RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
```

**Deploy badges:**
```bash
cd active
node deploy-badges.js
```

## System Specifications

### Badge System ✅ (Working on Sepolia)
- **Size**: 32×32 pixels (3,072 bytes)
- **Features**: Editable, one per wallet
- **Factory**: `0x35e626194E0691FaA54EFA289D90CA0e6D610FA1`

### Upload System 🧪 (Testing on Anvil)
- **Max Image**: 73×73 pixels (15,987 bytes) - RGB only
- **Max Text**: 16KB (16,384 bytes)
- **Features**: Immutable, unlimited per creator
- **Factory V4**: Dual blueprint (text + image)

## Test Results (Anvil)

All 5 tests passing:
1. ✅ Tiny (2×2) - 12 bytes
2. ✅ Small (16×16) - 768 bytes  
3. ✅ Badge-sized (32×32) - 3,072 bytes
4. ✅ Maximum (73×73) - 15,987 bytes
5. ✅ Text - 16,384 bytes

## Next Steps

1. ✅ Badges working on Sepolia
2. ✅ Uploads tested and working on Anvil
3. 🎯 Deploy uploads to Sepolia
4. 🎯 Update frontend config with new addresses

## Built Artifacts

Located in `../build/`:
- `abis/` - Contract ABIs
- `bytecode/` - Compiled bytecode
- `bytecode/*-blueprint.json` - EIP-5202 blueprints
