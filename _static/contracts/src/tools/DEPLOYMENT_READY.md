# Mathematical Tools - Deployment Ready

All contracts verified with 50-place precision and compiled successfully.

## Tier 1: MUST HAVE (Ready for Deployment)

### 1. exp.vy - General Exponential Function
- **Size**: 1,883 bytes
- **Description**: e^x for x ∈ [0, 10)
- **Implementation**: 11×10 lookup table with digit-by-digit multiplication
- **Verification**: ✅ All 110 values verified
- **Deploy**: `PRIVATE_KEY=0x... node deploy-exp.js`

### 2. factorial.vy - Factorial Function
- **Size**: 519 bytes (tiny!)
- **Description**: n! for n ∈ [0, 20]
- **Implementation**: Simple 21-constant lookup table
- **Verification**: ✅ All 21 values verified
- **Deploy**: `PRIVATE_KEY=0x... node deploy-factorial.js`

### 3. norm_cdf.vy - Normal Distribution CDF
- **Size**: 2,942 bytes
- **Description**: Φ(x) for N(μ, σ²)
- **Implementation**: Inlined erf with Abramowitz-Stegun approximation
- **Verification**: ✅ All 36 exp(-x²) values verified, erf error < 1.5e-7
- **Deploy**: `PRIVATE_KEY=0x... node deploy-norm-cdf.js`

## Tier 2: HIGH VALUE (Ready for Deployment)

### 4. ln_factorial.vy - Log Factorial
- **Size**: 538 bytes
- **Description**: ln(n!) for n ∈ [0, 20]
- **Implementation**: 21-constant lookup table
- **Verification**: ✅ All 21 values verified
- **Use Case**: Binomial coefficients, Poisson distributions

### 5. atan.vy - Arctangent
- **Size**: 10,346 bytes
- **Description**: atan(x) for any x, returns angle in [-π/2, π/2]
- **Implementation**: 500-element table for [0,1], uses identity for x>1
- **Verification**: ✅ All identities verified
- **Use Case**: Completes inverse trig suite, angle calculations

### 6. sinh.vy - Hyperbolic Sine
- **Size**: 2,072 bytes
- **Description**: sinh(x) = (e^x - e^(-x))/2 for x ∈ [-10, 10]
- **Implementation**: Composed from exp (no additional tables)
- **Verification**: ✅ Values and identities verified
- **Use Case**: Catenary curves, option pricing

### 7. cosh.vy - Hyperbolic Cosine
- **Size**: 1,987 bytes
- **Description**: cosh(x) = (e^x + e^(-x))/2 for x ∈ [-10, 10]
- **Implementation**: Composed from exp (no additional tables)
- **Verification**: ✅ Values and identities verified
- **Use Case**: Catenary curves, even function complements sinh

## Total Contract Sizes

**Tier 1**: 5,344 bytes (3 contracts)
**Tier 2**: 14,943 bytes (4 contracts)
**Total**: 20,287 bytes (7 new contracts)

All contracts well under the 24KB limit!

## Verification Summary

✅ **exp.vy** - 110 table values verified with 50-place precision
✅ **factorial.vy** - 21 exact values verified  
✅ **norm_cdf.vy** - 36 exp(-x²) values + erf approximation verified
✅ **ln_factorial.vy** - 21 ln(n!) values verified
✅ **atan.vy** - 500 table values + mathematical identities verified
✅ **sinh.vy** - Composition logic + hyperbolic identities verified
✅ **cosh.vy** - Composition logic + hyperbolic identities verified

## Deployment Instructions

### Deploy All at Once:

```bash
cd /home/s/whalegames/contracts/deployments

# Tier 1
PRIVATE_KEY=0x... node deploy-exp.js
PRIVATE_KEY=0x... node deploy-factorial.js
PRIVATE_KEY=0x... node deploy-norm-cdf.js

# Tier 2  
# (Compile first - already done!)
# PRIVATE_KEY=0x... node deploy-ln-factorial.js
# PRIVATE_KEY=0x... node deploy-atan.js
# PRIVATE_KEY=0x... node deploy-sinh.js
# PRIVATE_KEY=0x... node deploy-cosh.js
```

Note: Deployment scripts for Tier 2 need to be created (follow pattern from Tier 1)

## Mathematical Properties

All implementations maintain:
- **Determinism**: Identical results every time
- **Precision**: 10 decimal places (Vyper fixed-point)
- **Vyper Constraints**: Only multiplication and addition (no native exponentiation)
- **Gas Efficiency**: Pure functions marked @view (FREE to call)

## Use Cases for Gaming/Betting

1. **exp.vy** - Exponential growth, decay, probability distributions
2. **factorial.vy** - Combinatorics, lottery odds, permutations
3. **norm_cdf.vy** - Z-tests, confidence intervals, Gaussian betting
4. **ln_factorial.vy** - Large combinatorial calculations without overflow
5. **atan.vy** - Angle calculations, geometry-based games
6. **sinh/cosh.vy** - Advanced probability distributions, option pricing

## Architecture Highlights

This implementation follows the **slide rule principle**:
- Complex operations broken into lookup tables
- Digit-by-digit extraction methods
- Composition of simple functions for complex results
- No dependencies on external contracts (all self-contained)

## Next Steps

1. Deploy all contracts to testnet
2. Update `contracts/deployments/addresses.js` with deployed addresses
3. Update `js/infrastructure/config/contracts.js` with addresses
4. Create frontend calculators for each tool
5. Add to tools page at `/#/tools`

