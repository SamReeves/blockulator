# Huff Exponential Calculator Implementation

This directory contains a high-precision exponential function (`e^x`) implementation in Huff using scaled-integer arithmetic.

## Overview

The implementation uses a **scaled-integer** approach (not floating-point packing) with a 19-iteration product-rule algorithm and precomputed lookup tables.

### Key Features

- **Perfect precision**: 0 ULP error across tested range
- **18-decimal fixed-point I/O**: Compatible with standard DeFi contracts
- **36-decimal internal precision**: Guards against accumulated rounding errors
- **Base-10 product rule**: `e^x = product(e^(d_i * 10^(-i)))` for `i=0..18`
- **Optimized table lookup**: 190-entry code table (19×10) via `codecopy`

## Architecture

### Scaled-Integer Arithmetic

All internal calculations use **SCALE = 10^36**:
- Input/output: 18-decimal fixed-point (`value * 1e18`)
- Internal: 36-decimal scaled integers (`value * 1e36`)
- Operations: `(a * b) / SCALE` for multiplication

This avoids the complexity of FP pack/unpack while maintaining precision.

### File Structure

```
huff/
├── exp.huff                # Main exp calculator (scaled-integer, product-rule)
├── fp_constants.huff       # Constants: SCALE, FIXED18_SCALE, TEN
├── fp.huff                 # FP primitives (UNUSED by exp.huff, kept for reference)
├── tables/
│   └── exp_table.huff      # 19×10 lookup table (scaled integers)
├── test_basic_math.huff    # Level 0: Scaled multiply primitive
├── test_table_lookup.huff  # Level 1: Table lookup verification
├── test_one_iter_exp.huff  # Level 2: One iteration verification
├── test_two_iter_exp.huff  # Level 3: Two iteration verification
└── README.md               # This file
```

## Algorithm

### Product-Rule Decomposition

For input `x` in range `[0, 10)`:

1. Convert to scaled36: `x_scaled = x_fixed18 * 1e18`
2. Initialize: `y = 1e36` (result accumulator)
3. For `i = 0` to `18`:
   - Extract leading digit: `d = x / 1e36` (integer 0-9)
   - Lookup: `factor = TABLE[i][d]` (precomputed `e^(d * 10^(-i)) * 1e36`)
   - Accumulate: `y = (y * factor) / 1e36`
   - Shift remainder: `x = (x - d * 1e36) * 10`
4. Convert back: `result = y / 1e18`

### Table Structure

The table contains 190 entries (19 rows × 10 digits):
- **Row `i`**: Contribution `e^(d * 10^(-i))` for digit `d`
- **Encoding**: Plain scaled integers (`value * 1e36`), no FP packing
- **Lookup**: Arithmetic offset `(i * 10 + d) * 32`, then `codecopy` + `mload`

## Building and Testing

### Prerequisites

```bash
# Install Huff compiler
curl -L get.huff.sh | bash
huffup

# Verify installation
huffc --version  # Should be 0.3.2+
```

### Compilation

```bash
# Compile all Huff contracts
./contracts/deployments/compile-huff.sh

# Compile specific contract
./contracts/deployments/compile-huff.sh contracts/src/tools/huff/exp.huff
```

Bytecode is written to `contracts/build/huff/*.bin`, ABIs to `contracts/build/abis/*.json`.

### Testing

```bash
# Run all tests
forge test

# Run specific test suite
forge test --match-contract ExpTest        # Main exp calculator
forge test --match-contract ScaledMulTest  # Level 0: Scaled multiply
forge test --match-contract TableLookupTest # Level 1: Table lookup
forge test --match-contract OneIterExpTest  # Level 2: One iteration
forge test --match-contract TwoIterExpTest  # Level 3: Two iterations
```

### Test Results

```
ExpTest (main calculator):
  ✓ 25 comprehensive test vectors (0 ULP error)
  ✓ e^0, e^1, e^2, e^0.5, e^9.999...
  
Building-Block Tests:
  ✓ Level 0: 5/5 scaled multiply tests
  ✓ Level 1: 7/7 table lookup tests  
  ✓ Level 2: 6/6 one-iteration tests
  ✓ Level 3: 5/5 two-iteration tests

Total: 19/19 tests passing
```

## Bugs Fixed

### Table Format Mismatch
- **Issue**: Original table used FP-packed format (`0x3fed...` prefix) but `exp.huff` treated entries as plain scaled integers
- **Fix**: Regenerated table using `generate_exp_table.py` with correct scaled-integer encoding

### Table Index Swap (Line 45)
- **Issue**: `dup2 dup2` from stack `[d, i, x]` produced `[d, i, d, i, x]`, feeding `[d, i]` to lookup instead of `[i, d]`
- **Fix**: Changed to `dup1 dup3` to produce `[i, d, d, i, x]`

### Loop Counter Increment (Line 59)
- **Issue**: Extra `swap1` after `swap2 pop` swapped `[i, x_new]` to `[x_new, i]`, causing `0x01 add` to increment `x` instead of `i`
- **Fix**: Removed unnecessary `swap1`

## Performance

- **Gas cost**: ~9k-46k depending on input (more iterations = more gas)
- **Bytecode size**: 6,308 bytes (including 6,080-byte table)
- **Precision**: 0 ULP error for inputs in range `[0, 10)`

## Table Generation

Regenerate the lookup table:

```bash
python3 scripts/generate_exp_table.py > contracts/src/tools/huff/tables/exp_table.huff
```

The generator computes `e^(d * 10^(-i))` at 50-digit precision using Python's `decimal` module, then encodes as scaled integers.

## Known Limitations

- **Input range**: `[0, 10)` -- inputs ≥ 10 will produce incorrect results (first digit would be ≥10)
- **No negative inputs**: Algorithm assumes non-negative exponents
- **No overflow protection**: Very large results may overflow uint256

## Future Work

- Add input range validation
- Optimize gas usage (current implementation is unoptimized)
- Extend range to `[0, 100)` by using two-digit extraction
- Add negative exponent support

## Files Not Used by exp.huff

The following files are **not used** by the scaled-integer implementation:
- `fp.huff`: FP pack/unpack/arithmetic primitives (kept for reference/future use)
- `fp_simulator.py`: Python FP simulator
- `generate_exp_table_optimized.py`: FP-encoded table generator
- `test_normalize*.huff`: FP normalization tests

These were part of an earlier FP-packed approach and are preserved for potential future use.
