# Huff Contracts

Two on-chain math implementations in pure Huff assembly.

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
