#!/usr/bin/env python3
"""
FFI Oracle for FP127 (127.128 fixed-point) precision testing.

Usage: python3 fp127_oracle.py <function> <arg1_hex> [arg2_hex]
Returns: ABI-encoded result to stdout (raw hex bytes, no 0x prefix)

Functions:
  exp <x_fp127_hex>           -- e^x
  ln <x_fp127_hex>            -- ln(x)
  sqrt <x_fp127_hex>          -- sqrt(x)
  mul <a_hex> <b_hex>         -- a * b
  div <a_hex> <b_hex>         -- a / b
  pow <base_hex> <exp_hex>    -- base^exp
  abs <x_hex>                 -- |x|
  neg <x_hex>                 -- -x
  inv <x_hex>                 -- 1/x
  min <a_hex> <b_hex>         -- min(a, b)
  max <a_hex> <b_hex>         -- max(a, b)
  clamp <x_hex> <lo_hex> <hi_hex> -- clamp(x, lo, hi)
  avg <a_hex> <b_hex>         -- (a + b) / 2
  dist <a_hex> <b_hex>        -- |a - b|
  gavg <a_hex> <b_hex>        -- sqrt(a * b)
  log10 <x_hex>               -- log10(x)
  exp10 <x_hex>               -- 10^x
  exp_range_reduce <x_hex>    -- (k_int, x_prime) for exp range reduction
  exp_bkm_only <rem_hex>      -- BKM loop simulation
"""

from mpmath import mp, mpf, log, exp as mp_exp, sqrt as mp_sqrt, power, floor, ceil, cbrt, lambertw, factorial as mp_factorial
from math import gcd as math_gcd
import sys
from math import gcd as math_gcd

# Set 100-digit precision for ground truth
mp.dps = 100

FP127_SCALE = mpf(2) ** 128
TWO = mpf(2)
LN2 = log(TWO)


def from_fp127(value_str):
    """Convert FP127 value (hex or decimal string) to mpf decimal value."""
    # Parse as hex if starts with 0x, otherwise decimal
    if value_str.startswith('0x'):
        value_int = int(value_str, 16)
    else:
        value_int = int(value_str, 10)
    
    # Handle two's complement for negative numbers
    if value_int >= (1 << 255):
        value_int = value_int - (1 << 256)
    
    return mpf(value_int) / FP127_SCALE


def to_fp127_int(value):
    """Convert mpf decimal to FP127 integer (256-bit)."""
    scaled = int(value * FP127_SCALE)
    
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
    """Compute e^x where x is FP127."""
    x = from_fp127(x_str)
    result = mp_exp(x)
    return abi_encode_uint256(to_fp127_int(result))


def compute_ln(x_str):
    """Compute ln(x) where x is FP127."""
    x = from_fp127(x_str)
    if x <= 0:
        # Return 0 for invalid input (ln undefined for x <= 0)
        return abi_encode_uint256(0)
    result = log(x)
    return abi_encode_uint256(to_fp127_int(result))


def compute_sqrt(x_str):
    """Compute sqrt(x) where x is FP127."""
    x = from_fp127(x_str)
    if x < 0:
        return abi_encode_uint256(0)
    result = mp_sqrt(x)
    return abi_encode_uint256(to_fp127_int(result))


def compute_pow(base_str, exp_str):
    """Compute base^exp where both are FP127."""
    base = from_fp127(base_str)
    exp_val = from_fp127(exp_str)
    
    # Handle edge cases
    if exp_val == 0:
        # x^0 = 1 for all x (including 0^0 = 1 by convention)
        return abi_encode_uint256(to_fp127_int(mpf(1)))
    if base == 0:
        # 0^y = 0 for y != 0
        return abi_encode_uint256(0)
    if base < 0:
        # Negative base with fractional exponent is undefined in reals
        return abi_encode_uint256(0)
    
    result = power(base, exp_val)
    return abi_encode_uint256(to_fp127_int(result))


def compute_mul(a_str, b_str):
    """Compute a * b where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    result = a * b
    return abi_encode_uint256(to_fp127_int(result))


def compute_div(a_str, b_str):
    """Compute a / b where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    if b == 0:
        return abi_encode_uint256(0)
    result = a / b
    return abi_encode_uint256(to_fp127_int(result))


def compute_abs(x_str):
    """Compute |x| where x is FP127."""
    x = from_fp127(x_str)
    result = abs(x)
    return abi_encode_uint256(to_fp127_int(result))


def compute_neg(x_str):
    """Compute -x where x is FP127."""
    x = from_fp127(x_str)
    result = -x
    return abi_encode_uint256(to_fp127_int(result))


def compute_inv(x_str):
    """Compute 1/x where x is FP127."""
    x = from_fp127(x_str)
    if x == 0:
        return abi_encode_uint256(0)
    result = mpf(1) / x
    return abi_encode_uint256(to_fp127_int(result))


def compute_min(a_str, b_str):
    """Compute min(a, b) where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    result = min(a, b)
    return abi_encode_uint256(to_fp127_int(result))


def compute_max(a_str, b_str):
    """Compute max(a, b) where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    result = max(a, b)
    return abi_encode_uint256(to_fp127_int(result))


def compute_clamp(x_str, lo_str, hi_str):
    """Compute clamp(x, lo, hi) where all are FP127."""
    x = from_fp127(x_str)
    lo = from_fp127(lo_str)
    hi = from_fp127(hi_str)
    result = max(lo, min(x, hi))
    return abi_encode_uint256(to_fp127_int(result))


def compute_avg(a_str, b_str):
    """Compute (a + b) / 2 where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    result = (a + b) / mpf(2)
    return abi_encode_uint256(to_fp127_int(result))


def compute_dist(a_str, b_str):
    """Compute |a - b| where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    result = abs(a - b)
    return abi_encode_uint256(to_fp127_int(result))


def compute_gavg(a_str, b_str):
    """Compute sqrt(a * b) where both are FP127."""
    a = from_fp127(a_str)
    b = from_fp127(b_str)
    if a < 0 or b < 0:
        return abi_encode_uint256(0)
    result = mp_sqrt(a * b)
    return abi_encode_uint256(to_fp127_int(result))


def compute_log10(x_str):
    """Compute log10(x) where x is FP127."""
    x = from_fp127(x_str)
    if x <= 0:
        return abi_encode_uint256(0)
    result = log(x, 10)
    return abi_encode_uint256(to_fp127_int(result))


def compute_exp10(x_str):
    """Compute 10^x where x is FP127."""
    x = from_fp127(x_str)
    result = power(mpf(10), x)
    return abi_encode_uint256(to_fp127_int(result))


def compute_exp_range_reduce(x_str):
    """
    Compute exp range reduction: k_int = floor(x / ln2), x' = x - k_int * ln2.
    Returns: (k_int, x_prime) as two uint256 values.
    """
    x = from_fp127(x_str)
    
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
    x_prime_fp127 = to_fp127_int(x_prime)
    
    return abi_encode_two_uint256(k_int_encoded, x_prime_fp127)


def compute_exp_bkm_only(rem_str):
    """
    Simulate BKM loop: given remainder, compute accumulator.
    Uses exact mpmath arithmetic to simulate the BKM algorithm.
    """
    rem = from_fp127(rem_str)
    acc = mpf(1)
    
    # BKM loop: for k = 0 to 127
    for k in range(128):
        # L[k] = ln(1 + 2^-k)
        lk = log(mpf(1) + TWO ** (-k))
        
        if rem >= lk:
            # acc *= (1 + 2^-k)
            acc = acc * (mpf(1) + TWO ** (-k))
            rem = rem - lk
    
    return abi_encode_uint256(to_fp127_int(acc))


def compute_ln_bkm_only(x_reduced_str):
    """
    Simulate LN BKM loop: given x_reduced in [1,2), compute ln(x_reduced).
    Uses exact mpmath arithmetic to simulate the BKM algorithm.
    """
    x_reduced = from_fp127(x_reduced_str)
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
    
    return abi_encode_uint256(to_fp127_int(result))


def from_wad(wad_str):
    """Convert WAD (18-decimal) string to mpf decimal value."""
    wad_int = int(wad_str, 10)
    if wad_int >= (1 << 255):
        wad_int = wad_int - (1 << 256)
    return mpf(wad_int) / mpf(10**18)


def to_wad_int(val):
    """Convert mpf to WAD integer (signed, 256-bit two's complement)."""
    scaled = int(val * mpf(10**18))
    if scaled < 0:
        scaled = (1 << 256) + scaled
    return scaled % (1 << 256)


# ═══════════════════════════════════════════════════════════════════════════════
# WAD-NATIVE FUNCTIONS (for direct comparison across all libraries)
# Input/output in WAD format (1e18 scale, signed int256)
# ═══════════════════════════════════════════════════════════════════════════════

def compute_wad_mul(a_str, b_str):
    """Compute a * b in WAD format."""
    a = from_wad(a_str)
    b = from_wad(b_str)
    result = a * b
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_div(a_str, b_str):
    """Compute a / b in WAD format."""
    a = from_wad(a_str)
    b = from_wad(b_str)
    if b == 0:
        return abi_encode_uint256(0)
    result = a / b
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_exp(x_str):
    """Compute e^x where x is WAD."""
    x = from_wad(x_str)
    result = mp_exp(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_ln(x_str):
    """Compute ln(x) where x is WAD."""
    x = from_wad(x_str)
    if x <= 0:
        return abi_encode_uint256(0)
    result = log(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_sqrt(x_str):
    """Compute sqrt(x) where x is WAD."""
    x = from_wad(x_str)
    if x < 0:
        return abi_encode_uint256(0)
    result = mp_sqrt(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_exp2(x_str):
    """Compute 2^x where x is WAD."""
    x = from_wad(x_str)
    result = power(mpf(2), x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_log2(x_str):
    """Compute log2(x) where x is WAD."""
    x = from_wad(x_str)
    if x <= 0:
        return abi_encode_uint256(0)
    result = log(x) / LN2
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_cbrt(x_str):
    """Compute cbrt(x) where x is WAD."""
    x = from_wad(x_str)
    if x < 0:
        result = -cbrt(-x)
    else:
        result = cbrt(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_pow(base_str, exp_str):
    """Compute base^exp where both are WAD."""
    base = from_wad(base_str)
    exp_val = from_wad(exp_str)
    if base <= 0:
        return abi_encode_uint256(0)
    result = power(base, exp_val)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_inv(x_str):
    """Compute 1/x where x is WAD."""
    x = from_wad(x_str)
    if x == 0:
        return abi_encode_uint256(0)
    result = mpf(1) / x
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_gavg(a_str, b_str):
    """Compute sqrt(a*b) where both are WAD."""
    a = from_wad(a_str)
    b = from_wad(b_str)
    if a < 0 or b < 0:
        return abi_encode_uint256(0)
    result = mp_sqrt(a * b)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_log10(x_str):
    """Compute log10(x) where x is WAD."""
    x = from_wad(x_str)
    if x <= 0:
        return abi_encode_uint256(0)
    result = log(x, 10)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_exp10(x_str):
    """Compute 10^x where x is WAD."""
    x = from_wad(x_str)
    result = power(mpf(10), x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_hypot(a_str, b_str):
    """Compute sqrt(a^2 + b^2) where both are WAD."""
    a = from_wad(a_str)
    b = from_wad(b_str)
    result = mp_sqrt(a*a + b*b)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_floor(x_str):
    """Compute floor(x) where x is WAD."""
    x = from_wad(x_str)
    result = floor(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_ceil(x_str):
    """Compute ceil(x) where x is WAD."""
    x = from_wad(x_str)
    result = ceil(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_frac(x_str):
    """Compute frac(x) = x - floor(x) where x is WAD."""
    x = from_wad(x_str)
    result = x - floor(x)
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_round(x_str):
    """Compute round(x) where x is WAD."""
    x = from_wad(x_str)
    result = floor(x + mpf(0.5))
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_gcd(a_str, b_str):
    """Compute gcd(a, b) where both are WAD (operates on integer parts)."""
    a = from_wad(a_str)
    b = from_wad(b_str)
    a_int = int(floor(abs(a)))
    b_int = int(floor(abs(b)))
    result = mpf(math_gcd(a_int, b_int))
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_factorial(n_str):
    """Compute n! where n is WAD (uses integer part)."""
    n = from_wad(n_str)
    n_int = int(floor(n))
    if n_int < 0 or n_int > 33:
        return abi_encode_uint256(0)
    result = mpf(mp_factorial(n_int))
    return abi_encode_uint256(to_wad_int(result))


def compute_wad_lambertw0(x_str):
    """Compute Lambert W0(x) where x is WAD."""
    x = from_wad(x_str)
    if x < -1/mp_exp(1):
        return abi_encode_uint256(0)
    result = lambertw(x, 0)
    return abi_encode_uint256(to_wad_int(mpf(result.real)))


def _compute_wad_sqrt_internal(x_str):
    result = mp_sqrt(x)
    return abi_encode_uint256(to_wad_int(result))


def wad_to_fp127_exact(wad_int):
    """
    Convert WAD integer to FP127 integer using exact Solidity arithmetic.
    Matches: (abs_wad << 128) / 1e18, with sign handling.
    """
    negative = wad_int < 0
    abs_wad = -wad_int if negative else wad_int
    fp127_int = (abs_wad << 128) // (10**18)
    if negative:
        fp127_int = (1 << 256) - fp127_int
    return fp127_int


def fp127_int_to_mpf(fp127_int):
    """Convert FP127 integer to mpf for oracle computation."""
    if fp127_int >= (1 << 255):
        fp127_int -= (1 << 256)
    return mpf(fp127_int) / FP127_SCALE


def to_wad_int(value):
    """Convert mpf decimal to WAD integer (signed int256)."""
    scaled = int(value * mpf(10**18))
    if scaled < 0:
        scaled = (1 << 256) + scaled
    return scaled


def from_abdk(abdk_str):
    """Convert ABDK 64.64 fixed-point string to mpf decimal value."""
    abdk_int = int(abdk_str, 10)
    if abdk_int >= (1 << 127):
        abdk_int = abdk_int - (1 << 128)
    return mpf(abdk_int) / mpf(2**64)


def to_abdk_int(value):
    """Convert mpf decimal to ABDK 64.64 integer (signed int128)."""
    scaled = int(value * mpf(2**64))
    if scaled < 0:
        scaled = (1 << 128) + scaled
    return scaled


def wad_to_abdk_exact(wad_int):
    """
    Convert WAD integer to ABDK 64.64 integer using exact Solidity arithmetic.
    Matches: (wad << 64) / 1e18 (signed).
    """
    # Handle two's complement for negative WAD
    if wad_int >= (1 << 255):
        wad_int -= (1 << 256)
    
    # Perform the shift and division
    abdk_int = (wad_int << 64) // (10**18)
    
    # Convert back to unsigned representation for negative values
    if abdk_int < 0:
        abdk_int = (1 << 128) + abdk_int
    
    return abdk_int


def abdk_int_to_mpf(abdk_int):
    """Convert ABDK 64.64 integer to mpf for oracle computation."""
    if abdk_int >= (1 << 127):
        abdk_int -= (1 << 128)
    return mpf(abdk_int) / mpf(2**64)


def _compute_func(func_name, a, b=None):
    """
    Compute a function on mpf inputs and return mpf result.
    This is the core computation logic used by all format paths.
    """
    if func_name == "mul":
        result = a * b if b else mpf(0)
    elif func_name == "div":
        result = a / b if b and b != 0 else mpf(0)
    elif func_name == "add":
        result = a + b if b else a
    elif func_name == "sub":
        result = a - b if b else a
    elif func_name == "exp":
        result = mp_exp(a)
    elif func_name == "exp2":
        result = power(TWO, a)
    elif func_name == "ln":
        result = log(a) if a > 0 else mpf(0)
    elif func_name == "log2":
        result = log(a) / LN2 if a > 0 else mpf(0)
    elif func_name == "sqrt":
        result = mp_sqrt(a) if a >= 0 else mpf(0)
    elif func_name == "pow":
        if b is None or a <= 0:
            result = mpf(0)
        else:
            result = power(a, b)
    elif func_name == "abs":
        result = abs(a)
    elif func_name == "neg":
        result = -a
    elif func_name == "inv":
        result = mpf(1) / a if a != 0 else mpf(0)
    elif func_name == "min":
        result = min(a, b) if b is not None else a
    elif func_name == "max":
        result = max(a, b) if b is not None else a
    elif func_name == "avg":
        result = (a + b) / mpf(2) if b is not None else a
    elif func_name == "dist":
        result = abs(a - b) if b is not None else abs(a)
    elif func_name == "gavg":
        result = mp_sqrt(a * b) if b is not None and a >= 0 and b >= 0 else mpf(0)
    elif func_name == "log10":
        result = log(a, 10) if a > 0 else mpf(0)
    elif func_name == "exp10":
        result = power(mpf(10), a)
    elif func_name == "sign":
        if a > 0:
            result = mpf(1)
        elif a < 0:
            result = mpf(-1)
        else:
            result = mpf(0)
    elif func_name == "floor":
        result = floor(a)
    elif func_name == "ceil":
        result = ceil(a)
    elif func_name == "frac":
        result = a - floor(a)
    elif func_name == "cbrt":
        if a < 0:
            result = -cbrt(-a)
        else:
            result = cbrt(a)
    elif func_name == "lerp":
        # lerp(a, b, t) = a + t * (b - a)
        # For now, we'll use a fixed t=0.5 for sweeps (like clamp)
        # But the oracle should support full 3-arg if needed
        t = from_wad(b_str) if b_str else mpf(0.5)
        # Actually, for lerp we need 3 args. Let's handle it as: a is first arg, b is second, and we'll need to extend this later
        # For now, let's just compute lerp(a, b, 0.5) as a simple case
        result = a + mpf(0.5) * (b - a) if b is not None else a
    elif func_name == "hypot":
        result = mp_sqrt(a * a + b * b) if b is not None else abs(a)
    elif func_name == "round":
        result = floor(a + mpf(0.5))
    elif func_name == "log2up":
        if a <= 0:
            result = mpf(0)
        else:
            # Check if a is a power of 2 (exactly one bit set in FP127 representation)
            # For FP127 127.128 format, powers of 2 have exact log2 values
            a_int = int(a * FP127_SCALE)
            if a_int > 0 and (a_int & (a_int - 1)) == 0:
                # Exact power of 2: compute log2 directly from bit position
                bit_pos = a_int.bit_length() - 1
                result = mpf(bit_pos - 128)
            else:
                # Not a power of 2: use polynomial approximation + ceil
                log2_val = log(a) / LN2
                result = ceil(log2_val)
    elif func_name == "gcd":
        # GCD operates on integers
        a_int = int(floor(abs(a)))
        b_int = int(floor(abs(b))) if b is not None else 0
        result = mpf(math_gcd(a_int, b_int))
    elif func_name == "factorial":
        n = int(floor(a))
        if n < 0 or n > 33:
            result = mpf(0)  # Out of range
        else:
            result = mpf(mp_factorial(n))
    elif func_name == "lambertw0":
        # Lambert W0 function (principal branch)
        if a < mpf(-1) / mp_exp(mpf(1)):  # Domain: x >= -1/e
            result = mpf(0)
        else:
            result = lambertw(a, k=0)
    else:
        result = mpf(0)
    
    return result


def compute_multi_format(func_name, a_str, b_str=None):
    """
    Compute operation and return results in multiple formats.
    Returns: (fp127_wad, wad, abdk_wad) - all in WAD format for direct comparison.
    Each library gets its own ground truth computed from its exact input format,
    then converted back to WAD.
    """
    # Parse WAD inputs
    wad_int_a = int(a_str, 10)
    wad_int_b = int(b_str, 10) if b_str else None
    
    # --- FP127 path: use FP127-exact conversion, return as WAD ---
    # Simulates: WAD input -> FP127 -> operation -> FP127 result -> WAD output
    a_fp127 = fp127_int_to_mpf(wad_to_fp127_exact(wad_int_a))
    b_fp127 = fp127_int_to_mpf(wad_to_fp127_exact(wad_int_b)) if wad_int_b is not None else None
    result_fp127 = _compute_func(func_name, a_fp127, b_fp127)
    # Convert FP127 result back to WAD (simulating toFixed18)
    fp127_wad_val = to_wad_int(result_fp127)
    
    # --- WAD path: use exact WAD decimal (no truncation) ---
    a_wad = from_wad(a_str)
    b_wad = from_wad(b_str) if b_str else None
    result_wad = _compute_func(func_name, a_wad, b_wad)
    wad_val = to_wad_int(result_wad)
    
    # --- ABDK path: use ABDK-exact conversion, return as WAD ---
    # Simulates: WAD input -> ABDK -> operation -> ABDK result -> WAD output
    a_abdk = abdk_int_to_mpf(wad_to_abdk_exact(wad_int_a))
    b_abdk = abdk_int_to_mpf(wad_to_abdk_exact(wad_int_b)) if wad_int_b is not None else None
    result_abdk = _compute_func(func_name, a_abdk, b_abdk)
    # Convert ABDK result back to WAD
    abdk_wad_val = to_wad_int(result_abdk)
    
    # Return as hex tuple (3 uint256 values, all in WAD format)
    return f"0x{fp127_wad_val:064x}{wad_val:064x}{abdk_wad_val:064x}"


def main():
    if len(sys.argv) < 2:
        print("Usage: fp127_oracle.py <function> <arg1_hex> [arg2_hex]", file=sys.stderr)
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
        elif func == "pow":
            result = compute_pow(sys.argv[2], sys.argv[3])
        elif func == "abs":
            result = compute_abs(sys.argv[2])
        elif func == "neg":
            result = compute_neg(sys.argv[2])
        elif func == "inv":
            result = compute_inv(sys.argv[2])
        elif func == "min":
            result = compute_min(sys.argv[2], sys.argv[3])
        elif func == "max":
            result = compute_max(sys.argv[2], sys.argv[3])
        elif func == "clamp":
            result = compute_clamp(sys.argv[2], sys.argv[3], sys.argv[4])
        elif func == "avg":
            result = compute_avg(sys.argv[2], sys.argv[3])
        elif func == "dist":
            result = compute_dist(sys.argv[2], sys.argv[3])
        elif func == "gavg":
            result = compute_gavg(sys.argv[2], sys.argv[3])
        elif func == "log10":
            result = compute_log10(sys.argv[2])
        elif func == "exp10":
            result = compute_exp10(sys.argv[2])
        elif func == "exp_range_reduce":
            result = compute_exp_range_reduce(sys.argv[2])
        elif func == "exp_bkm_only":
            result = compute_exp_bkm_only(sys.argv[2])
        elif func == "ln_bkm_only":
            result = compute_ln_bkm_only(sys.argv[2])
        elif func.startswith("multi_"):
            # Multi-format output: multi_mul, multi_div, etc.
            op_name = func[6:]  # Strip "multi_" prefix
            b_str = sys.argv[3] if len(sys.argv) > 3 else None
            result = compute_multi_format(op_name, sys.argv[2], b_str)
        elif func.startswith("wad_"):
            # WAD-format functions for benchmark comparison
            op = func[4:]  # Strip "wad_" prefix
            if op == "mul":
                result = compute_wad_mul(sys.argv[2], sys.argv[3])
            elif op == "div":
                result = compute_wad_div(sys.argv[2], sys.argv[3])
            elif op == "exp":
                result = compute_wad_exp(sys.argv[2])
            elif op == "exp2":
                result = compute_wad_exp2(sys.argv[2])
            elif op == "ln":
                result = compute_wad_ln(sys.argv[2])
            elif op == "log2":
                result = compute_wad_log2(sys.argv[2])
            elif op == "sqrt":
                result = compute_wad_sqrt(sys.argv[2])
            elif op == "cbrt":
                result = compute_wad_cbrt(sys.argv[2])
            elif op == "pow":
                result = compute_wad_pow(sys.argv[2], sys.argv[3])
            elif op == "inv":
                result = compute_wad_inv(sys.argv[2])
            elif op == "gavg":
                result = compute_wad_gavg(sys.argv[2], sys.argv[3])
            elif op == "log10":
                result = compute_wad_log10(sys.argv[2])
            elif op == "exp10":
                result = compute_wad_exp10(sys.argv[2])
            elif op == "hypot":
                result = compute_wad_hypot(sys.argv[2], sys.argv[3])
            elif op == "floor":
                result = compute_wad_floor(sys.argv[2])
            elif op == "ceil":
                result = compute_wad_ceil(sys.argv[2])
            elif op == "frac":
                result = compute_wad_frac(sys.argv[2])
            elif op == "round":
                result = compute_wad_round(sys.argv[2])
            elif op == "gcd":
                result = compute_wad_gcd(sys.argv[2], sys.argv[3])
            elif op == "factorial":
                result = compute_wad_factorial(sys.argv[2])
            elif op == "lambertw0":
                result = compute_wad_lambertw0(sys.argv[2])
            else:
                print(f"Unknown wad function: {func}", file=sys.stderr)
                sys.exit(1)
        elif func.startswith("bench_"):
            # Unified benchmark oracle: returns (fp127_expected, wad_expected, abdk_expected)
            op_name = func[6:]  # Strip "bench_" prefix
            b_str = sys.argv[3] if len(sys.argv) > 3 else None
            result = compute_multi_format(op_name, sys.argv[2], b_str)
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
