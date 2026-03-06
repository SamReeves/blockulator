#!/usr/bin/env python3
"""
FFI Oracle for FP128 (128.128 fixed-point) precision testing.

Usage: python3 fp128_oracle.py <function> <arg1_hex> [arg2_hex]
Returns: ABI-encoded result to stdout (raw hex bytes, no 0x prefix)

Functions:
  exp <x_fp128_hex>           -- e^x
  ln <x_fp128_hex>            -- ln(x)
  sqrt <x_fp128_hex>          -- sqrt(x)
  mul <a_hex> <b_hex>         -- a * b
  div <a_hex> <b_hex>         -- a / b
  exp_range_reduce <x_hex>    -- (k_int, x_prime) for exp range reduction
  exp_bkm_only <rem_hex>      -- BKM loop simulation
"""

from mpmath import mp, mpf, log, exp as mp_exp, sqrt as mp_sqrt
import sys

# Set 100-digit precision for ground truth
mp.dps = 100

FP128_SCALE = mpf(2) ** 128
TWO = mpf(2)
LN2 = log(TWO)


def from_fp128(value_str):
    """Convert FP128 value (hex or decimal string) to mpf decimal value."""
    # Parse as hex if starts with 0x, otherwise decimal
    if value_str.startswith('0x'):
        value_int = int(value_str, 16)
    else:
        value_int = int(value_str, 10)
    
    # Handle two's complement for negative numbers
    if value_int >= (1 << 255):
        value_int = value_int - (1 << 256)
    
    return mpf(value_int) / FP128_SCALE


def to_fp128_int(value):
    """Convert mpf decimal to FP128 integer (256-bit)."""
    scaled = int(value * FP128_SCALE)
    
    # Handle two's complement for negative numbers
    if scaled < 0:
        scaled = (1 << 256) + scaled
    
    return scaled


def abi_encode_uint256(value_int):
    """Encode a 256-bit integer as ABI uint256 (hex string with 0x prefix)."""
    # Ensure value fits in 256 bits (handle overflow)
    value_int = value_int % (1 << 256)
    return f"0x{value_int:064x}"


def abi_encode_two_uint256(val1, val2):
    """Encode two uint256 values (hex string with 0x prefix, no spaces/newlines)."""
    val1 = val1 % (1 << 256)
    val2 = val2 % (1 << 256)
    # Return concatenated hex without any separators
    return f"0x{val1:064x}{val2:064x}"


def compute_exp(x_str):
    """Compute e^x where x is FP128."""
    x = from_fp128(x_str)
    result = mp_exp(x)
    return abi_encode_uint256(to_fp128_int(result))


def compute_ln(x_str):
    """Compute ln(x) where x is FP128."""
    x = from_fp128(x_str)
    if x <= 0:
        # Return 0 for invalid input (ln undefined for x <= 0)
        return abi_encode_uint256(0)
    result = log(x)
    return abi_encode_uint256(to_fp128_int(result))


def compute_sqrt(x_str):
    """Compute sqrt(x) where x is FP128."""
    x = from_fp128(x_str)
    if x < 0:
        return abi_encode_uint256(0)
    result = mp_sqrt(x)
    return abi_encode_uint256(to_fp128_int(result))


def compute_mul(a_str, b_str):
    """Compute a * b where both are FP128."""
    a = from_fp128(a_str)
    b = from_fp128(b_str)
    result = a * b
    return abi_encode_uint256(to_fp128_int(result))


def compute_div(a_str, b_str):
    """Compute a / b where both are FP128."""
    a = from_fp128(a_str)
    b = from_fp128(b_str)
    if b == 0:
        return abi_encode_uint256(0)
    result = a / b
    return abi_encode_uint256(to_fp128_int(result))


def compute_exp_range_reduce(x_str):
    """
    Compute exp range reduction: k_int = floor(x / ln2), x' = x - k_int * ln2.
    Returns: (k_int, x_prime) as two uint256 values.
    """
    x = from_fp128(x_str)
    
    # k_int = floor(x / ln2)
    k_int_mpf = mp.floor(x / LN2)
    k_int = int(k_int_mpf)
    
    # Handle two's complement for k_int
    if k_int < 0:
        k_int_encoded = (1 << 256) + k_int
    else:
        k_int_encoded = k_int
    
    # x' = x - k_int * ln2
    x_prime = x - k_int_mpf * LN2
    x_prime_fp128 = to_fp128_int(x_prime)
    
    return abi_encode_two_uint256(k_int_encoded, x_prime_fp128)


def compute_exp_bkm_only(rem_str):
    """
    Simulate BKM loop: given remainder, compute accumulator.
    Uses exact mpmath arithmetic to simulate the BKM algorithm.
    """
    rem = from_fp128(rem_str)
    acc = mpf(1)
    
    # BKM loop: for k = 0 to 127
    for k in range(128):
        # L[k] = ln(1 + 2^-k)
        lk = log(mpf(1) + TWO ** (-k))
        
        if rem >= lk:
            # acc *= (1 + 2^-k)
            acc = acc * (mpf(1) + TWO ** (-k))
            rem = rem - lk
    
    return abi_encode_uint256(to_fp128_int(acc))


def compute_ln_bkm_only(x_reduced_str):
    """
    Simulate LN BKM loop: given x_reduced in [1,2), compute ln(x_reduced).
    Uses exact mpmath arithmetic to simulate the BKM algorithm.
    """
    x_reduced = from_fp128(x_reduced_str)
    acc = mpf(1)
    result = mpf(0)
    
    # BKM loop: for k = 0 to 127
    for k in range(128):
        # trial = acc + (acc >> k) = acc * (1 + 2^-k)
        trial = acc * (mpf(1) + TWO ** (-k))
        
        if trial <= x_reduced:
            # L[k] = ln(1 + 2^-k)
            lk = log(mpf(1) + TWO ** (-k))
            acc = trial
            result = result + lk
    
    return abi_encode_uint256(to_fp128_int(result))


def main():
    if len(sys.argv) < 2:
        print("Usage: fp128_oracle.py <function> <arg1_hex> [arg2_hex]", file=sys.stderr)
        sys.exit(1)
    
    func = sys.argv[1]
    
    try:
        if func == "exp":
            result = compute_exp(sys.argv[2])
        elif func == "ln":
            result = compute_ln(sys.argv[2])
        elif func == "sqrt":
            result = compute_sqrt(sys.argv[2])
        elif func == "mul":
            result = compute_mul(sys.argv[2], sys.argv[3])
        elif func == "div":
            result = compute_div(sys.argv[2], sys.argv[3])
        elif func == "exp_range_reduce":
            result = compute_exp_range_reduce(sys.argv[2])
        elif func == "exp_bkm_only":
            result = compute_exp_bkm_only(sys.argv[2])
        elif func == "ln_bkm_only":
            result = compute_ln_bkm_only(sys.argv[2])
        else:
            print(f"Unknown function: {func}", file=sys.stderr)
            sys.exit(1)
        
        # Write hex string to stdout (no trailing newline)
        sys.stdout.write(result)
        sys.stdout.flush()
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
