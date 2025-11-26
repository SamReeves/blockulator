# Math Tools Deployment Checklist

## ✅ Pre-Deployment Verification

- [x] All 20 contracts updated to `@pure`
- [x] Version specs updated to 0.4.3
- [x] All contracts compiled successfully
- [x] ABIs and bytecode generated
- [x] Test contract compiled
- [x] Interfaces created

## 🚀 Ready to Deploy

### What's Being Deployed
- 14 Math tool contracts
- 3 Constant contracts  
- 3 Trigonometry contracts

**Total: 20 contracts with @pure decorators**

### Network
- **Target**: Sepolia Testnet
- **Chain ID**: 11155111

### Requirements
- ✅ Private key with Sepolia ETH
- ✅ Minimum balance: 0.01 ETH recommended
- ✅ RPC endpoint (Alchemy/Infura)

---

## 🔑 Deployment Command

```bash
cd /home/s/whalegames/contracts/deployments
PRIVATE_KEY=0x... node math-tools/deploy-all-math-tools.js
```

Or with custom RPC:
```bash
SEPOLIA_RPC=https://your-rpc-url PRIVATE_KEY=0x... node math-tools/deploy-all-math-tools.js
```

---

## 📝 Expected Output

Each contract will show:
```
🚀 Deploying CONTRACT_NAME...
📦 Contract size: XXXX bytes
⏳ Sending transaction...
   Tx: 0x...
⏳ Waiting for confirmation...

✅ Deployed!
📍 Address: 0x...
⛽ Gas Used: XXXXX

🧪 Testing...
   get_constant(): X.XXXXXXXXXX
   calculate(X): Y.YYYYYYYYYY
   ✅ Tests passed!
```

---

## 📊 After Deployment

The script will create:
`deployment-math-tools-sepolia-[TIMESTAMP].json`

Example:
```json
{
  "network": "sepolia",
  "timestamp": "2025-11-12T...",
  "deployer": "0x...",
  "contracts": [
    {
      "name": "EXP",
      "address": "0x...",
      "tx": "0x...",
      "gasUsed": "..."
    },
    ...
  ]
}
```

---

## 🔄 Next Steps

1. **Save Addresses**: Copy contract addresses from output
2. **Update Config**: Update `js/infrastructure/config/contracts.js`
3. **Verify on Etherscan**: Optional but recommended
4. **Test Cross-Contract**: Deploy test caller and verify calls work
5. **Update Frontend**: New ABIs should work (backward compatible)

---

## ⚠️ Troubleshooting

### "Insufficient balance"
- Get more Sepolia ETH from faucet: https://sepolia-faucet.pk910.de/

### "Connection timeout"
- Use a different RPC endpoint
- Try: `SEPOLIA_RPC=https://eth-sepolia.public.blastapi.io`

### "Nonce too high"
- Wait a few seconds between deployments
- Script includes 2s delay between contracts

---

## 🎯 Success Criteria

All deployments should show:
- ✅ Transaction confirmed
- ✅ Contract address received
- ✅ Tests passed
- ✅ Gas used reasonable (<1M per contract)

**Total estimated gas**: ~30-40M gas (0.003-0.004 ETH at 100 gwei)

