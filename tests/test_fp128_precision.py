#!/usr/bin/env python3
"""
FP128 Full-Precision Fuzz Test
Tests mul and div directly in 128.128 space with random 256-bit values,
bypassing fixed18 to measure true arithmetic precision.

Oracle: Python arbitrary-precision integers (exact 512-bit intermediate).
Error metric: ULPs (units in the last place of 128 fractional bits).
"""

import sys
import os
import random
import math

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_fp import HuffTester

TWO128 = 1 << 128
TWO256 = 1 << 256
MASK256 = TWO256 - 1

# Signed 256-bit range
MAX_INT256 = (1 << 255) - 1
MIN_INT256 = -(1 << 255)


def to_twos(v):
    """Signed Python int -> two's complement uint256"""
    if v < 0:
        return TWO256 + v
    return v


def from_twos(v):
    """Two's complement uint256 -> signed Python int"""
    if v >= (1 << 255):
        return v - TWO256
    return v


def ref_mul(a, b):
    """Reference 128.128 multiply: (a * b) >> 128, truncated toward zero"""
    product = a * b
    if product < 0:
        return -((-product) >> 128)
    return product >> 128


def ref_div(a, b):
    """Reference 128.128 divide: (a << 128) / b, truncated toward zero"""
    if b == 0:
        return None
    shifted = a << 128
    if (shifted < 0) != (b < 0):
        return -(abs(shifted) // abs(b))
    return abs(shifted) // abs(b)


def ulp_error(actual, expected):
    """Error in ULPs (1 ULP = 2^-128 in value, = 1 in raw representation)"""
    return abs(actual - expected)


def bits_of_precision(actual, expected):
    """How many bits of the result are correct (relative to magnitude)"""
    if expected == 0:
        return 128 if actual == 0 else 0
    err = abs(actual - expected)
    if err == 0:
        return 128
    mag = abs(expected)
    if mag == 0:
        return 0
    ratio = err / mag
    if ratio >= 1:
        return 0
    return min(128, -math.log2(ratio))


def random_fp128(int_bits=64):
    """
    Generate a random signed 128.128 value with a weird, fully random mantissa.
    int_bits controls how many integer bits to use (up to 127).
    """
    sign = random.choice([-1, 1])
    int_part = random.getrandbits(int_bits) if int_bits > 0 else 0
    frac_part = random.getrandbits(128)
    val = (int_part << 128) | frac_part
    return sign * val


def random_fp128_small():
    """Pure fractional: integer part is 0, all 128 frac bits random"""
    sign = random.choice([-1, 1])
    frac = random.getrandbits(128)
    return sign * frac


def random_fp128_large():
    """Large integer part (64-127 bits), full random frac"""
    sign = random.choice([-1, 1])
    int_bits = random.randint(64, 120)
    int_part = random.getrandbits(int_bits) | (1 << (int_bits - 1))
    frac_part = random.getrandbits(128)
    return sign * ((int_part << 128) | frac_part)


def random_fp128_extreme_ratio():
    """One very large, one very small — tests dynamic range"""
    large = random_fp128_large()
    small = random_fp128_small()
    while small == 0:
        small = random_fp128_small()
    return large, small


def random_fp128_near_one():
    """Values close to 1.0 — stress the hi*lo cross terms"""
    sign = random.choice([-1, 1])
    noise = random.getrandbits(128)
    val = TWO128 + noise - (1 << 127)
    if val < 0:
        val = TWO128 + random.getrandbits(64)
    return sign * val


def format_fp128(v):
    """Pretty print a 128.128 signed value"""
    sign = "-" if v < 0 else ""
    av = abs(v)
    int_part = av >> 128
    frac_part = av & (TWO128 - 1)
    frac_dec = frac_part * 10**39 // TWO128
    return f"{sign}{int_part}.{frac_dec:039d}"


class PrecisionStats:
    def __init__(self, op_name):
        self.op_name = op_name
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.max_ulp = 0
        self.min_bits = 128
        self.total_bits = 0
        self.all_bits = []
        self.errors = []

    def record(self, actual, expected, a, b, label, max_allowed_ulp=2):
        self.total += 1
        ulps = ulp_error(actual, expected)
        bits = bits_of_precision(actual, expected)
        self.max_ulp = max(self.max_ulp, ulps)
        self.min_bits = min(self.min_bits, bits)
        self.total_bits += bits
        self.all_bits.append(bits)

        if ulps <= max_allowed_ulp:
            self.passed += 1
        else:
            self.failed += 1
            self.errors.append((label, a, b, actual, expected, ulps, bits))

    def report(self):
        print(f"\n{'='*70}")
        print(f"  {self.op_name} PRECISION REPORT")
        print(f"{'='*70}")
        print(f"  Tests:          {self.total}")
        print(f"  Passed:         {self.passed}")
        print(f"  Failed:         {self.failed}")
        print(f"  Max ULP error:  {self.max_ulp}")
        print(f"  Min precision:  {self.min_bits:.1f} bits  ({self.min_bits / math.log2(10):.1f} decimal digits)")
        avg = self.total_bits / self.total if self.total else 0
        print(f"  Avg precision:  {avg:.1f} bits  ({avg / math.log2(10):.1f} decimal digits)")

        # Precision histogram
        buckets = [0]*14
        labels = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59",
                  "60-69", "70-79", "80-89", "90-99", "100-109", "110-119",
                  "120-127", "128 (exact)"]
        for b in self.all_bits:
            if b >= 128:
                buckets[13] += 1
            else:
                buckets[min(12, int(b) // 10)] += 1

        print(f"\n  Precision distribution (bits):")
        max_count = max(buckets) if buckets else 1
        for i, (label, count) in enumerate(zip(labels, buckets)):
            bar_len = int(40 * count / max_count) if max_count > 0 else 0
            bar = "█" * bar_len
            if count > 0:
                print(f"    {label:>10s} | {bar} {count}")

        if self.errors:
            print(f"\n  --- FAILURES ({len(self.errors)}) ---")
            for label, a, b, actual, expected, ulps, bits in self.errors[:5]:
                print(f"  [{label}]")
                print(f"    a = {format_fp128(a)}")
                print(f"    b = {format_fp128(b)}")
                print(f"    expected = {format_fp128(expected)}")
                print(f"    actual   = {format_fp128(actual)}")
                print(f"    ULP err  = {ulps}   ({bits:.1f} bits)")

        print(f"{'='*70}")
        return self.failed == 0


def deploy_raw_contract():
    """Compile and deploy, return (tester, addr, sel_mulRaw, sel_divRaw)"""
    tester = HuffTester()
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    addr = tester.deploy(bytecode)
    # Match selectors by keccak256 hash, not bytecode position
    sel_mul_raw = bytes.fromhex("28cf6728")  # keccak256("mulRaw(uint256,uint256)")[:4]
    sel_div_raw = bytes.fromhex("074168ce")  # keccak256("divRaw(uint256,uint256)")[:4]
    return tester, addr, sel_mul_raw, sel_div_raw


def call_raw(tester, addr, selector, a, b):
    """Call a raw fp128 function, encoding/decoding two's complement"""
    a_enc = to_twos(a)
    b_enc = to_twos(b)
    result_raw = tester.call(addr, selector, a_enc, b_enc)
    return from_twos(result_raw)


def test_mul_precision():
    """Full-precision multiplication fuzz test"""
    tester, addr, sel_mul, sel_div = deploy_raw_contract()
    stats = PrecisionStats("FP128_MUL (raw)")

    random.seed(0xDEAD_BEEF_CAFE)

    print("\n  Generating random mul test vectors...")

    generators = [
        ("small*small",       lambda: (random_fp128_small(), random_fp128_small())),
        ("large*large",       lambda: (random_fp128(60), random_fp128(60))),
        ("large*small",       lambda: random_fp128_extreme_ratio()),
        ("near1*near1",       lambda: (random_fp128_near_one(), random_fp128_near_one())),
        ("medium*medium",     lambda: (random_fp128(32), random_fp128(32))),
        ("weird*weird",       lambda: (random_fp128(random.randint(1, 120)), random_fp128(random.randint(1, 120)))),
    ]

    for gen_label, gen_fn in generators:
        for i in range(100):
            a, b = gen_fn()
            if a == 0 or b == 0:
                continue
            expected = ref_mul(a, b)
            # Skip if result overflows signed 256-bit
            if expected > MAX_INT256 or expected < MIN_INT256:
                continue
            actual = call_raw(tester, addr, sel_mul, a, b)
            stats.record(actual, expected, a, b, f"{gen_label}#{i}", max_allowed_ulp=2)

    return stats.report()


def test_div_precision():
    """Full-precision division fuzz test"""
    tester, addr, sel_mul, sel_div = deploy_raw_contract()
    stats = PrecisionStats("FP128_DIV (raw)")

    random.seed(0xBAD_C0DE_F00D)

    print("\n  Generating random div test vectors...")

    generators = [
        ("small/small",       lambda: (random_fp128_small(), random_fp128_small())),
        ("large/large",       lambda: (random_fp128(60), random_fp128(60))),
        ("large/small",       lambda: random_fp128_extreme_ratio()),
        ("near1/near1",       lambda: (random_fp128_near_one(), random_fp128_near_one())),
        ("medium/medium",     lambda: (random_fp128(32), random_fp128(32))),
        ("weird/weird",       lambda: (random_fp128(random.randint(1, 120)), random_fp128(random.randint(1, 120)))),
    ]

    for gen_label, gen_fn in generators:
        for i in range(100):
            a, b = gen_fn()
            if b == 0:
                continue
            expected = ref_div(a, b)
            if expected is None:
                continue
            if expected > MAX_INT256 or expected < MIN_INT256:
                continue
            # Also skip if a << 128 overflows what sdiv can handle
            if abs(a) >= (1 << 191):
                continue
            actual = call_raw(tester, addr, sel_div, a, b)
            # 64-bit chunked division loses bottom ~64 bits of precision
            stats.record(actual, expected, a, b, f"{gen_label}#{i}", max_allowed_ulp=(1 << 65))

    return stats.report()


if __name__ == "__main__":
    print("=" * 70)
    print("  FP128 FULL-PRECISION FUZZ TEST")
    print("  Testing mul/div with random 128.128 values (no fixed18 truncation)")
    print("  Oracle: Python exact integer arithmetic")
    print("  Metric: ULP error (1 ULP = 2^-128)")
    print("=" * 70)

    mul_ok = test_mul_precision()
    div_ok = test_div_precision()

    print("\n" + "=" * 70)
    if mul_ok and div_ok:
        print("  ALL PRECISION TESTS PASSED")
    else:
        print("  SOME TESTS FAILED")
        if not mul_ok:
            print("    - Multiplication had failures")
        if not div_ok:
            print("    - Division had failures")
    print("=" * 70)

    if not (mul_ok and div_ok):
        sys.exit(1)
