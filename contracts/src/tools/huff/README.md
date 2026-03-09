# Huff Contracts

On-chain math implementations in pure Huff assembly, organized by number system.

## Directory Structure

```
huff/
├── fp128/              # 128.128 fixed-point arithmetic
│   ├── constants.huff         # Core constants (ONE_FP128, FRAC_BITS, etc.)
│   ├── arithmetic.huff        # Add, sub, mul, div, conversions
│   ├── tables.huff            # Lookup tables for exp/ln (generated)
│   ├── transcendental.huff    # exp, ln, sqrt
│   └── test_fp128.huff        # Deployable test contract
├── binary256/          # IEEE 754 binary256 floating-point
│   ├── constants.huff         # Format constants and bit masks
│   ├── arithmetic.huff        # Core operations (pack, unpack, normalize, add, sub, mul, div)
│   ├── transcendental.huff    # exp, ln, sqrt (placeholders)
│   └── test_binary256.huff    # Deployable test contract
└── README.md           # This file
```

## FP128: 128.128 Fixed-Point Arithmetic

Signed 128.128 fixed-point: 128 integer bits + 128 fractional bits, two's complement.

- **Precision**: ~38 decimal digits
- **Range**: approximately ±1.7 × 10^38
- **Format**: One `uint256` word

### Files

| File | Purpose |
|------|---------|
| `constants.huff` | Core constants (FRAC_BITS, ONE_FP128, MASK128, etc.) |
| `arithmetic.huff` | Basic operations (add, sub, mul, div) and conversions (to/from fixed18) |
| `tables.huff` | Bit-level lookup tables for exp/ln (135 entries each, ~8.6 KB total) |
| `transcendental.huff` | exp, ln, sqrt using binary digit-by-digit table method |
| `test_fp128.huff` | Deployable test contract exposing all operations |

### Interface

All functions in `test_fp128.huff` accept and return `fixed18` values (value × 10^18):

- `add(uint256, uint256) → uint256`
- `sub(uint256, uint256) → uint256`
- `mul(uint256, uint256) → uint256`
- `div(uint256, uint256) → uint256`
- `exp(uint256) → uint256`
- `ln(uint256) → uint256`
- `sqrt(uint256) → uint256`
- `fromFixed18(uint256) → uint256` — convert to internal fp128 format
- `toFixed18(uint256) → uint256` — convert from internal fp128 format
- `expRaw(uint256) → uint256` — raw fp128 input/output
- `lnRaw(uint256) → uint256` — raw fp128 input/output
- `mulRaw(uint256, uint256) → uint256` — raw fp128 multiply
- `divRaw(uint256, uint256) → uint256` — raw fp128 divide

### How It Works

Internally, inputs are converted from fixed18 to 128.128 format: `fp128 = (fixed18 × 2^128) / 10^18`.

- **Add/Sub**: Single EVM opcodes (`ADD`, `SUB`)
- **Mul**: 4-term schoolbook decomposition to avoid overflow
- **Div**: 64-bit chunked shift-and-divide (~62-bit precision)
- **Exp/Ln**: Binary digit-by-digit table method using precomputed `e^(2^(k-128))` values
- **Sqrt**: Implemented as `exp(ln(x) / 2)` to reuse exp/ln logic

Results are converted back to fixed18 for output.

## Binary256: IEEE 754 Octuple Precision

IEEE 754 binary256 (octuple precision) floating-point arithmetic.

- **Format**: 1-bit sign + 19-bit exponent + 236-bit significand (256 bits total)
- **Precision**: ~71 decimal digits (236 bits)
- **Range**: 2^(±262143) (vastly exceeds fixedpoint128)

### Files

| File | Purpose |
|------|---------|
| `constants.huff` | Format constants (SIGN_BIT, EXP_*, SIGNIFICAND_*, special values) |
| `arithmetic.huff` | Core operations (pack, unpack, normalize, add, sub, mul, div) |
| `transcendental.huff` | exp, ln, sqrt (currently placeholders) |
| `test_binary256.huff` | Deployable test contract |

### Design Highlights

Value representation (normal): `(-1)^sign × 2^(exp - 262143) × 1.significand`

Significand normalized to [2^236, 2^237) with implicit leading 1. Binary CLZ (count leading zeros) enables O(log n) normalization.

### Advantages

- Native support for special values (±0, ±Inf, NaN)
- Binary CLZ normalization (O(log n) vs O(n))
- Exponent field enables efficient transcendentals

## Building

```bash
# Compile all Huff contracts
./contracts/deployments/compile-huff.sh

# Or compile individual contracts
huffc --evm-version paris contracts/src/tools/huff/fp128/test_fp128.huff -r
huffc --evm-version paris contracts/src/tools/huff/binary256/test_binary256.huff -r
```

Output: `contracts/build/huff/*.bin` and `contracts/build/huff/*.runtime.bin`

## Testing

```bash
# Foundry tests
forge test --match-contract FP128Test     # FP128 arithmetic + transcendentals
forge test --match-contract HexFPTest     # Binary256 operations

# Benchmarks
forge test --match-contract ArithBench          # Gas + precision comparison
forge test --match-contract UnifiedBenchmark    # Cross-library benchmarks
```

## Table Generation

FP128 lookup tables are generated using Python with `mpmath` for high precision:

```bash
# Generate exp/ln tables (135 entries each)
python3 scripts/generators/generate_fp128_tables.py > contracts/src/tools/huff/fp128/tables.huff

# Generate transcendental constants
python3 scripts/generators/generate_fp128_coefficients.py >> contracts/src/tools/huff/fp128/constants.huff
```

## Performance

FP128 is optimized for gas efficiency:
- `add`: ~50 gas
- `mul`: ~140 gas (full precision) or ~125 gas (fast, 1 ULP error for small fractional parts)
- `exp`: ~21k gas
- `ln`: ~41k gas
- `sqrt`: ~63k gas (via exp/ln)

Binary256 provides vastly greater range but at higher gas cost due to normalization overhead.
