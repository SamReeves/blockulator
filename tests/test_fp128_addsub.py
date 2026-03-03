#!/usr/bin/env python3
"""
Test 128.128 Fixed-Point Add/Sub Calculator
Tests conversion between fixed18 and fp128, and add/sub operations
"""

import sys
sys.path.insert(0, '/home/s/blockulator/tests')
from test_fp import HuffTester


def test_fp128_conversions():
    """Test conversion between fixed18 and 128.128 format"""
    tester = HuffTester()
    
    # Compile and deploy
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    print(f"Compiled test_fp128_addsub.huff: {len(bytecode)} bytes")
    
    addr = tester.deploy(bytecode)
    print(f"Deployed to: {addr}\n")
    
    # Find selectors
    selectors = tester.find_selectors(bytecode)
    print(f"Found {len(selectors)} selectors")
    
    # Map selectors (order: add, sub, mul, div, fromFixed18, toFixed18)
    sel_add = selectors[0]
    sel_sub = selectors[1]
    sel_mul = selectors[2]
    sel_div = selectors[3]
    sel_from = selectors[4]
    sel_to = selectors[5]
    
    print("\n=== Conversion Round-Trip Tests ===")
    
    # Test 1: 1.0 round-trip
    fixed18_one = 10**18
    fp128_one = tester.call(addr, sel_from, fixed18_one)
    print(f"fromFixed18(1e18) = {fp128_one:#x}")
    result = tester.call(addr, sel_to, fp128_one, decode_signed=True)
    tester.assert_eq(result, fixed18_one, "1.0 round-trip")
    
    # Test 2: e round-trip
    fixed18_e = 2718281828459045235
    fp128_e = tester.call(addr, sel_from, fixed18_e)
    result = tester.call(addr, sel_to, fp128_e, decode_signed=True)
    tester.assert_approx(result, fixed18_e, tolerance=1, msg="e round-trip")
    
    # Test 3: 0 round-trip
    fp128_zero = tester.call(addr, sel_from, 0)
    result = tester.call(addr, sel_to, fp128_zero, decode_signed=True)
    tester.assert_eq(result, 0, "0 round-trip")
    
    # Test 4: 0.5 round-trip
    fixed18_half = 5 * 10**17
    fp128_half = tester.call(addr, sel_from, fixed18_half)
    result = tester.call(addr, sel_to, fp128_half, decode_signed=True)
    tester.assert_eq(result, fixed18_half, "0.5 round-trip")
    
    print("\n✓ All conversion tests passed!")


def test_fp128_addition():
    """Test 128.128 addition"""
    tester = HuffTester()
    
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    addr = tester.deploy(bytecode)
    selectors = tester.find_selectors(bytecode)
    sel_add = selectors[0]
    
    print("\n=== Addition Tests ===")
    
    # Test 1: 1 + 2 = 3
    result = tester.call(addr, sel_add, 10**18, 2 * 10**18, decode_signed=True)
    tester.assert_eq(result, 3 * 10**18, "1 + 2 = 3")
    
    # Test 2: 0.5 + 0.5 = 1
    result = tester.call(addr, sel_add, 5 * 10**17, 5 * 10**17, decode_signed=True)
    tester.assert_eq(result, 10**18, "0.5 + 0.5 = 1")
    
    # Test 3: 1 + 0 = 1 (identity)
    result = tester.call(addr, sel_add, 10**18, 0, decode_signed=True)
    tester.assert_eq(result, 10**18, "1 + 0 = 1")
    
    # Test 4: 0 + 0 = 0
    result = tester.call(addr, sel_add, 0, 0, decode_signed=True)
    tester.assert_eq(result, 0, "0 + 0 = 0")
    
    # Test 5: Large numbers
    result = tester.call(addr, sel_add, 12345 * 10**18, 67890 * 10**18, decode_signed=True)
    tester.assert_eq(result, 80235 * 10**18, "12345 + 67890 = 80235")
    
    print("\n✓ All addition tests passed!")


def test_fp128_subtraction():
    """Test 128.128 subtraction including negative results"""
    tester = HuffTester()
    
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    addr = tester.deploy(bytecode)
    selectors = tester.find_selectors(bytecode)
    sel_sub = selectors[1]
    
    print("\n=== Subtraction Tests ===")
    
    # Test 1: 3 - 1 = 2
    result = tester.call(addr, sel_sub, 3 * 10**18, 10**18, decode_signed=True)
    tester.assert_eq(result, 2 * 10**18, "3 - 1 = 2")
    
    # Test 2: 1 - 1 = 0
    result = tester.call(addr, sel_sub, 10**18, 10**18, decode_signed=True)
    tester.assert_eq(result, 0, "1 - 1 = 0")
    
    # Test 3: 1 - 2 = -1 (negative result)
    result = tester.call(addr, sel_sub, 10**18, 2 * 10**18, decode_signed=True)
    tester.assert_eq(result, -10**18, "1 - 2 = -1")
    
    # Test 4: 0 - 5 = -5
    result = tester.call(addr, sel_sub, 0, 5 * 10**18, decode_signed=True)
    tester.assert_eq(result, -5 * 10**18, "0 - 5 = -5")
    
    # Test 5: 2.5 - 1.5 = 1
    result = tester.call(addr, sel_sub, 25 * 10**17, 15 * 10**17, decode_signed=True)
    tester.assert_eq(result, 10**18, "2.5 - 1.5 = 1")
    
    print("\n✓ All subtraction tests passed!")


def test_fp128_signed_operations():
    """Test operations with negative inputs"""
    tester = HuffTester()
    
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    addr = tester.deploy(bytecode)
    selectors = tester.find_selectors(bytecode)
    sel_add = selectors[0]
    sel_sub = selectors[1]
    
    print("\n=== Signed Operations Tests ===")
    
    # Encode negative fixed18 values using two's complement
    neg_one = -10**18
    neg_two = -2 * 10**18
    
    # Test 1: -1 + 3 = 2
    result = tester.call(addr, sel_add, neg_one, 3 * 10**18, decode_signed=True)
    tester.assert_eq(result, 2 * 10**18, "-1 + 3 = 2")
    
    # Test 2: -1 + (-2) = -3
    result = tester.call(addr, sel_add, neg_one, neg_two, decode_signed=True)
    tester.assert_eq(result, -3 * 10**18, "-1 + (-2) = -3")
    
    # Test 3: 5 - (-3) = 8
    result = tester.call(addr, sel_sub, 5 * 10**18, -3 * 10**18, decode_signed=True)
    tester.assert_eq(result, 8 * 10**18, "5 - (-3) = 8")
    
    # Test 4: -10 - 5 = -15
    result = tester.call(addr, sel_sub, -10 * 10**18, 5 * 10**18, decode_signed=True)
    tester.assert_eq(result, -15 * 10**18, "-10 - 5 = -15")
    
    print("\n✓ All signed operations tests passed!")


if __name__ == "__main__":
    test_fp128_conversions()
    test_fp128_addition()
    test_fp128_subtraction()
    test_fp128_signed_operations()
    print("\n" + "="*50)
    print("✓✓✓ ALL TESTS PASSED ✓✓✓")
    print("="*50)
