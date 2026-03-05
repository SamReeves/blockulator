#!/usr/bin/env python3
"""Test simple packing"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from test_fp import HuffTester

tester = HuffTester()
bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_simple.huff")
addr = tester.deploy(bytecode)

selectors = tester.find_selectors(bytecode)
sel_test = selectors[0]

result = tester.call(addr, sel_test)
print(f"Result: {result}")
print(f"Hex:    {hex(result)}")

# Unpack
sign = (result >> 255) & 1
exp = (result >> 247) & 0xFF
mantissa = result & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF

print(f"\nUnpacked:")
print(f"  Sign:     {sign}")
print(f"  Exponent: {exp} (0x{exp:02x})")
print(f"  Mantissa: {mantissa} (0x{mantissa:032x})")

# Expected
print(f"\nExpected:")
print(f"  Sign:     0")
print(f"  Exponent: 64 (0x40)")
print(f"  Mantissa: 18446744073709551616 (0x00000000000000010000000000000000)")
