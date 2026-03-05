# Huff Contracts

On-chain math implementations in pure Huff assembly.

## Quick Links

- [FP128 Arithmetic](#fp128-arithmetic-calculator) - Production-ready 128.128 fixed-point
- [Hex Arithmetic](#hex-arithmetic-experimental) - Experimental S/360-inspired hex float
- [Exponential Calculator](#exponential-calculator) - High-precision e^x

## FP128 Arithmetic Calculator

Signed 128.128 fixed-point arithmetic: add, subtract, multiply, divide.

- **Format**: One `uint256` word, 128 integer bits + 128 fractional bits, two's complement signed
- **Precision**: ~38 decimal digits
- **Range**: approximately ±1.7 × 10^38

### Files

```
fp128.huff              # Arithmetic library (ADD, SUB, MUL, DIV, conversions)
fp128_constants.huff    # Constants (FRAC_BITS, ONE_FP128, MASK128, etc.)
test_fp128_addsub.huff  # Deployable contract exposing all operations
```

### Interface

All functions accept and return `fixed18` values (value × 10^18):

- `add(uint256, uint256) → uint256`
- `sub(uint256, uint256) → uint256`
- `mul(uint256, uint256) → uint256`
- `div(uint256, uint256) → uint256`
- `fromFixed18(uint256) → uint256` — convert to internal fp128 format
- `toFixed18(uint256) → uint256` — convert from internal fp128 format

### How it works

Internally, inputs are converted from fixed18 to 128.128 format: `fp128 = (fixed18 × 2^128) / 10^18`. Addition and subtraction are single EVM opcodes. Multiplication uses 4-term schoolbook decomposition to avoid overflow. Division uses 64-bit chunked shift-and-divide. Results are converted back to fixed18 for output.

## Hex Arithmetic (Experimental)

**Status: In Development** - Core design complete, needs macro debugging

IBM System/360-inspired hexadecimal floating-point arithmetic with base-16 exponent.

- **Format**: 1-bit sign + 8-bit base-16 exponent + 128-bit 64.64 mantissa (256 bits total)
- **Precision**: 64.64 (~2^-64, same as standard 64.64 fixed-point)
- **Range**: 16^127 (massive improvement over plain 64.64)
- **Advantages**: 
  - Nibble normalization (4-bit shifts) instead of bit-by-bit
  - Same mul/div cost as 64.64, better than 128.128
  - 4× exponent range per bit vs base-2

### Files

```
hex_fp_constants.huff       # Format constants and bit masks
hex_fp.huff                 # Core arithmetic operations
test_hex_arithmetic.huff    # Test contract (in development)
HEX_ARITHMETIC_STATUS.md    # Detailed status and design notes
```

### Design Highlights

Value representation: `sign × (mantissa_64_64 / 2^64) × 16^(exponent - 64)`

Mantissa normalized so leading nibble is in [1..F], enabling bounded normalization (0-4 bit shift max).

See [HEX_ARITHMETIC_STATUS.md](HEX_ARITHMETIC_STATUS.md) for full implementation details.

## Exponential Calculator

Computes `e^x` using a product-rule decomposition with precomputed lookup tables.

### Files

```
exp.huff                # Main exp calculator
fp_constants.huff       # Constants (SCALE, FIXED18_SCALE, TEN)
tables/
  exp_table.huff        # 19×10 lookup table (scaled integers)
```

### Interface

- `calculate(uint256) → uint256` — compute e^x, input/output in fixed18
- Valid input range: `[0, 10)`

### Algorithm

Decomposes the exponent digit-by-digit: `e^x = ∏ e^(dᵢ × 10^(-i))` for 19 iterations. Each factor is looked up from a 190-entry precomputed table. Internal arithmetic uses 36-decimal scaled integers for precision.

## Building

```bash
huffc --evm-version paris contracts/src/tools/huff/test_fp128_addsub.huff -r
huffc --evm-version paris contracts/src/tools/huff/exp.huff -r
```

## Testing

```bash
python3 tests/test_fp128_addsub.py    # 18 add/sub/conversion tests
python3 tests/test_fp128_muldiv.py    # 16 mul/div tests
python3 tests/test_fp128_fuzz.py      # 500+ randomized tests against Python Decimal
```
