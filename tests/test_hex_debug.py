#!/usr/bin/env python3
"""Debug hex arithmetic selectors"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from test_fp import HuffTester

tester = HuffTester()
bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_arithmetic.huff")
print(f"Compiled: {len(bytecode)} bytes\n")

selectors = tester.find_selectors(bytecode)
print(f"Found {len(selectors)} selectors:\n")

# Expected function names in order they appear in the contract
functions = ["add", "sub", "mul", "div", "mulRaw", "divRaw", "fromFixed18", "toFixed18"]

for i, sel in enumerate(selectors):
    hex_sel = sel.hex()
    print(f"[{i}] 0x{hex_sel}")
    if i < len(functions):
        print(f"    Expected: {functions[i]}")
    print()
