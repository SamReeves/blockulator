#!/usr/bin/env python3
"""Minimal hex test to debug conversion"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from test_fp import HuffTester

tester = HuffTester()
bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_arithmetic.huff")
addr = tester.deploy(bytecode)

selectors = tester.find_selectors(bytecode)
sel_from = selectors[6]  # fromFixed18

print("Testing fromFixed18 conversion:\n")

# Test with 1.0 (1e18)
fixed18_one = 10**18
print(f"Input (fixed18):  {fixed18_one}")
print(f"Input (hex):      {hex(fixed18_one)}")
print()

result = tester.call(addr, sel_from, fixed18_one)
print(f"Result (decimal): {result}")
print(f"Result (hex):     {hex(result)}")
print(f"Result (binary):  {bin(result)}")
print()

# Break down the result
sign_bit = (result >> 255) & 1
exp_field = (result >> 247) & 0xFF
mantissa = result & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF

print("Unpacked fields:")
print(f"  Sign bit:  {sign_bit}")
print(f"  Exponent:  {exp_field} (0x{exp_field:02x})")
print(f"  Mantissa:  {mantissa} (0x{mantissa:032x})")
print()

# What we expect:
# fixed18 = 1e18
# mantissa_64_64 = (1e18 * 2^64) / 1e18 = 2^64 = 0x10000000000000000
# exponent = 64 (bias)
# sign = 0

expected_mantissa = 2**64
print("Expected:")
print(f"  Sign:      0")
print(f"  Exponent:  64 (0x40)")
print(f"  Mantissa:  {expected_mantissa} (0x{expected_mantissa:032x})")
