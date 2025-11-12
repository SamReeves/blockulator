# Math Tools Changelog

## November 12, 2025 - Pure Functions Fix

### 🔧 Fixed: Gas Estimation for Cross-Contract Calls

**Issue:** Cross-contract calls to math tools failed with gas estimation errors.

**Solution:** Changed all function decorators from `@external @view` to `@external @pure`.

**Impact:**
- ✅ Gas estimation now works reliably
- ✅ Cross-contract calls succeed
- ✅ All 20 math tool contracts updated
- ✅ New interfaces provided for easy integration

**Details:** See [PURE_FUNCTIONS_FIX.md](../../PURE_FUNCTIONS_FIX.md)

---

## Files Changed

### Math Tools
- exp.vy, ln.vy, sqrt.vy, factorial.vy, ln_factorial.vy
- norm_cdf.vy, erf.vy, atan.vy
- sinh.vy, cosh.vy
- pow2.vy, pow10.vy, log2.vy, log10.vy

### Constants
- e.vy, pi.vy, tau.vy

### Trigonometry
- sin.vy, cos.vy, tanh.vy

### New Files
- `interfaces/IMathTools.vy` - Interface definitions
- `tests/math_tools_caller.vy` - Test contract
- `../../tests/test-pure-math-tools.js` - Test suite
- `../../deployments/compile-all-math-tools.sh` - Batch compilation

---

## Migration Guide

If you were using these contracts before this fix:

### JavaScript/Frontend
No changes needed - ABIs are compatible (only decorator changed, not signatures)

### Vyper Contracts
Update your interface definitions to use `pure`:

**Before:**
```vyper
interface ILn:
    def calculate(x: decimal) -> decimal: view  # ❌
```

**After:**
```vyper
interface ILn:
    def calculate(x: decimal) -> decimal: pure  # ✅
```

Or use the provided interfaces:
```vyper
from interfaces.IMathTools import ILn, IExp, ISqrt
```

---

## Testing

Run the test suite:
```bash
# Start local network (in separate terminal)
npx hardhat node

# Run tests
node tests/test-pure-math-tools.js
```

Expected output:
```
✅ Total Passed: 10
✅ Total Failed: 0
🎉 ALL TESTS PASSED!
```

---

## Deployment

Deploy all math tools:
```bash
cd contracts/deployments
PRIVATE_KEY=0x... node deploy-all-math-tools.js
```

Or compile only:
```bash
./compile-all-math-tools.sh
```

