# Deploy Discussion Board to Sepolia

Follow these steps to deploy the Discussion Board contracts to Sepolia testnet.

## Prerequisites
✅ MetaMask installed
✅ Connected to Sepolia network
✅ Have some Sepolia ETH (get from https://sepoliafaucet.com/)

## Deployment Steps

### Step 1: Deploy Discussion Blueprint (Factory)

1. **Open deployment page:**
   ```
   http://localhost:8000/contracts/deployments/deploy.html
   ```

2. **Connect MetaMask** (make sure it's on Sepolia!)

3. **The page should show:**
   - Contract: BOARD (from last compile)
   - Network: Sepolia Testnet

4. **We need to deploy DISCUSSION first**, so run this in browser console:
   ```javascript
   // Switch to discussion config
   fetch('deploy-config.json').then(r => r.json()).then(async (config) => {
       // Manually load discussion bytecode
       const discussionBlueprint = await fetch('../build/bytecode/discussion-blueprint.json').then(r => r.json());
       console.log('Discussion blueprint bytecode loaded');
       console.log('Copy this bytecode and paste in deploy field:');
       console.log(discussionBlueprint.bytecode);
   });
   ```

5. **Deploy the blueprint:**
   - Click "Deploy Contract"
   - Confirm in MetaMask
   - **SAVE THE DEPLOYED ADDRESS** (you'll need it for the Board)

### Step 2: Deploy Board Contract

1. **Refresh the page** (it will load BOARD config automatically)

2. **Before deploying, you need to encode constructor arguments:**
   - The Board needs 2 arguments:
     - `_discussion_blueprint`: Address from Step 1
     - `_owner`: Your wallet address

3. **In browser console, prepare deployment:**
   ```javascript
   // Replace these with your values:
   const blueprintAddress = '0xYOUR_BLUEPRINT_ADDRESS_FROM_STEP_1';
   const yourAddress = '0xYOUR_WALLET_ADDRESS';
   
   // This will show encoded constructor arguments
   const abiCoder = ethers.utils.defaultAbiCoder;
   const encoded = abiCoder.encode(
       ['address', 'address'],
       [blueprintAddress, yourAddress]
   );
   console.log('Constructor args (append to bytecode):', encoded.slice(2));
   ```

4. **Deploy the Board:**
   - Load board bytecode from `../build/bytecode/board.json`
   - Append the encoded constructor args
   - Click "Deploy Contract"
   - Confirm in MetaMask
   - **SAVE THE DEPLOYED ADDRESS**

### Step 3: Update Config Files

Once both contracts are deployed, run this in your terminal (I'll do this for you):

```bash
# Update with your actual addresses
BLUEPRINT_ADDRESS="0x..."
BOARD_ADDRESS="0x..."

# Update contracts.js
sed -i "s/DISCUSSION_BOARD: '0x[a-fA-F0-9]\\{40\\}'/DISCUSSION_BOARD: '$BOARD_ADDRESS'/" js/infrastructure/config/contracts.js
sed -i "s/DISCUSSION_BLUEPRINT: '0x[a-fA-F0-9]\\{40\\}'/DISCUSSION_BLUEPRINT: '$BLUEPRINT_ADDRESS'/" js/infrastructure/config/contracts.js

# Update addresses.js  
sed -i "s/DISCUSSION_BOARD: '0x[a-fA-F0-9]\\{40\\}'/DISCUSSION_BOARD: '$BOARD_ADDRESS'/" contracts/deployments/addresses.js
sed -i "s/DISCUSSION_BLUEPRINT: '0x[a-fA-F0-9]\\{40\\}'/DISCUSSION_BLUEPRINT: '$BLUEPRINT_ADDRESS'/" contracts/deployments/addresses.js
```

### Easier Alternative: Use Hardhat/Ethers Script

Actually, let me create a simpler script that you can run with your MetaMask private key...

