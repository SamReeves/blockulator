# 📤 Uploads Feature Deployment Guide

## Overview
The uploads feature allows users to store images and text permanently on-chain using Vyper smart contracts.

## Status: ✅ Ready to Deploy

### What's Done
- ✅ Frontend app built (`js/uploads-app.js`)
- ✅ UI integrated in `index.html` (Uploads view)
- ✅ Contracts compiled (`content.vy`, `content_factory.vy`)
- ✅ Contracts registered in contract registry
- ✅ Deployment script created
- ✅ Master app routing configured

### What's Needed
1. Deploy smart contracts to Sepolia
2. Update contract addresses in registry
3. Deploy frontend to production

## Deployment Steps

### Step 1: Deploy Smart Contracts

```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Run deployment script
cd /home/s/whalegames
node contracts/deployments/deploy-content.js
```

The script will:
- Deploy Content Blueprint contract
- Deploy Content Factory contract
- Save deployment addresses
- Show you exactly what to update in the registry

### Step 2: Update Contract Registry

After deployment, the script will output addresses like:
```
Content Blueprint:  0x...
Content Factory:    0x...
```

Update `js/infrastructure/config/contract-registry.js`:

```javascript
'content-factory': {
    type: 'content',
    name: 'Content Factory',
    emoji: '🏭',
    description: 'Create on-chain images and text',
    addresses: {
        sepolia: '0xYOUR_FACTORY_ADDRESS_HERE',  // Update this
        mainnet: '0x0000000000000000000000000000000000000000'
    },
    source: 'contracts/src/content/content_factory.vy',
    abi: 'contracts/build/abis/content-factory.json'
},

'content-blueprint': {
    type: 'content',
    name: 'Content Blueprint',
    emoji: '📄',
    description: 'Content contract blueprint',
    addresses: {
        sepolia: '0xYOUR_BLUEPRINT_ADDRESS_HERE',  // Update this
        mainnet: '0x0000000000000000000000000000000000000000'
    },
    source: 'contracts/src/content/content.vy',
    abi: 'contracts/build/abis/content.json'
}
```

### Step 3: Build and Deploy Frontend

```bash
# Build
./scripts/build.sh

# The dist/ folder will contain all files ready for deployment
# Deploy using your usual method (it will auto-deploy if using App Platform)
```

### Step 4: Test the Feature

1. Go to https://whalegames.net/#/uploads
2. Connect wallet
3. Try uploading:
   - A small image (16x16 or 32x32 recommended for lower gas)
   - Some text (up to 16KB)
4. Browse recent uploads

## Features

### Image Uploads
- Upload pixel art directly to blockchain
- Stored permanently on-chain
- Viewable by anyone
- Max recommended size: 64x64 pixels (for reasonable gas costs)

### Text Uploads
- Upload text documents to blockchain
- Stored permanently on-chain
- Max size: 16KB
- UTF-8 encoded

## Contract Architecture

```
ContentFactory
├── Creates new Content contracts via EIP-5202 blueprint
├── Tracks all created content
└── Provides content browsing

Content (Blueprint)
├── Stores either image or text data
├── Image: RGB pixel data + dimensions
└── Text: UTF-8 byte array
```

## Gas Costs

**Rough estimates on Sepolia:**
- Small image (16x16): ~50,000 gas
- Medium image (32x32): ~150,000 gas  
- Large image (64x64): ~500,000 gas
- Text (1KB): ~100,000 gas
- Text (16KB): ~1,500,000 gas

*Actual costs vary with network congestion*

## Navigation

Once deployed, users can access uploads via:
- Main navigation: "Uploads" button in header
- Direct URL: `/#/uploads`

## Security Notes

- Content is permanent and cannot be deleted
- Anyone can upload (if they pay gas)
- All uploads are public
- No moderation system implemented

## Support

If deployment fails:
- Check private key is set correctly
- Ensure sufficient ETH balance (>0.01 ETH recommended)
- Check RPC endpoint is responding
- Review deployment logs for specific errors

---

**Ready to go live?** Run the deployment script and follow the steps above! 🚀

