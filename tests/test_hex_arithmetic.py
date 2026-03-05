#!/usr/bin/env python3
"""
Test Hex Arithmetic (IBM S/360 inspired)
Tests conversion between fixed18 and hex float, and basic operations
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from test_fp import HuffTester

def test_hex_conversions():
    """Test conversion between fixed18 and hex float format"""
    print("\n" + "="*60)
    print("TEST: HEX FLOAT CONVERSIONS")
    print("="*60)
    
    tester = HuffTester()
    
    # Compile the hex arithmetic contract
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_arithmetic.huff")
    print(f"Compiled test_hex_arithmetic.huff: {len(bytecode)} bytes")
    
    # Deploy
    addr = tester.deploy(bytecode)
    print(f"Deployed at: {addr}\n")
    
    # Find selectors (order: add, sub, mul, div, mulRaw, divRaw, fromFixed18, toFixed18)
    selectors = tester.find_selectors(bytecode)
    print(f"Found {len(selectors)} selectors\n")
    sel_from = selectors[6]  # fromFixed18
    sel_to = selectors[7]    # toFixed18
    
    # Test 1: Convert 1.0
    print("Test 1: 1.0")
    fixed18_one = 10**18
    hex_one = tester.call(addr, sel_from, fixed18_one)
    print(f"fromFixed18(1e18) = {hex_one:#x}")
    result = tester.call(addr, sel_to, hex_one, decode_signed=True)
    print(f"toFixed18(hex) = {result} (expected: {fixed18_one})")
    tester.assert_approx(result, fixed18_one, tolerance=10**9, msg="1.0 round-trip")
    print("✓ PASS\n")
    
    # Test 2: Convert e ≈ 2.718281828
    print("Test 2: e ≈ 2.718281828")
    fixed18_e = 2718281828459045235
    hex_e = tester.call(addr, sel_from, fixed18_e)
    result = tester.call(addr, sel_to, hex_e, decode_signed=True)
    print(f"Input: {fixed18_e}")
    print(f"Roundtrip: {result}")
    tester.assert_approx(result, fixed18_e, tolerance=10**12, msg="e round-trip")
    print("✓ PASS\n")
    
    # Test 3: Convert 0
    print("Test 3: 0.0")
    hex_zero = tester.call(addr, sel_from, 0)
    result = tester.call(addr, sel_to, hex_zero, decode_signed=True)
    print(f"Result: {result}")
    tester.assert_eq(result, 0, "0 round-trip")
    print("✓ PASS\n")
    
    # Test 4: Convert -3.14
    print("Test 4: -3.14")
    fixed18_neg = -3140000000000000000
    hex_neg = tester.call(addr, sel_from, fixed18_neg)
    result = tester.call(addr, sel_to, hex_neg, decode_signed=True)
    print(f"Input: {fixed18_neg}")
    print(f"Roundtrip: {result}")
    tester.assert_approx(result, fixed18_neg, tolerance=10**12, msg="-3.14 round-trip")
    print("✓ PASS\n")
    
    print("="*60)
    print("✓ ALL CONVERSION TESTS PASSED")
    print("="*60)

def test_hex_addition():
    """Test hex float addition"""
    print("\n" + "="*60)
    print("TEST: HEX FLOAT ADDITION")
    print("="*60)
    
    tester = HuffTester()
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_arithmetic.huff")
    addr = tester.deploy(bytecode)
    
    selectors = tester.find_selectors(bytecode)
    sel_add = selectors[0]  # add
    
    tolerance = 10**12  # Higher tolerance for 64.64 mantissa precision
    
    # Test 1: 2 + 3 = 5
    print("Test 1: 2 + 3")
    a, b = 2 * 10**18, 3 * 10**18
    result = tester.call(addr, sel_add, a, b, decode_signed=True)
    expected = 5 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: 5.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="2 + 3 = 5")
    print("✓ PASS\n")
    
    # Test 2: 1.5 + 2.75 = 4.25
    print("Test 2: 1.5 + 2.75")
    a, b = int(1.5 * 10**18), int(2.75 * 10**18)
    result = tester.call(addr, sel_add, a, b, decode_signed=True)
    expected = int(4.25 * 10**18)
    print(f"Result: {result / 10**18:.6f} (expected: 4.25)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="1.5 + 2.75 = 4.25")
    print("✓ PASS\n")
    
    # Test 3: 100 + (-50) = 50
    print("Test 3: 100 + (-50)")
    a, b = 100 * 10**18, -50 * 10**18
    result = tester.call(addr, sel_add, a, b, decode_signed=True)
    expected = 50 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: 50.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="100 + (-50) = 50")
    print("✓ PASS\n")
    
    print("="*60)
    print("✓ ALL ADDITION TESTS PASSED")
    print("="*60)

def test_hex_multiplication():
    """Test hex float multiplication"""
    print("\n" + "="*60)
    print("TEST: HEX FLOAT MULTIPLICATION")
    print("="*60)
    
    tester = HuffTester()
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_arithmetic.huff")
    addr = tester.deploy(bytecode)
    
    selectors = tester.find_selectors(bytecode)
    sel_mul = selectors[2]  # mul
    
    tolerance = 10**12  # Higher tolerance for mul due to 64.64 precision loss
    
    # Test 1: 2 * 3 = 6
    print("Test 1: 2 * 3")
    a, b = 2 * 10**18, 3 * 10**18
    result = tester.call(addr, sel_mul, a, b, decode_signed=True)
    expected = 6 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: 6.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="2 * 3 = 6")
    print("✓ PASS\n")
    
    # Test 2: 1.5 * 2.0 = 3.0
    print("Test 2: 1.5 * 2.0")
    a, b = int(1.5 * 10**18), 2 * 10**18
    result = tester.call(addr, sel_mul, a, b, decode_signed=True)
    expected = 3 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: 3.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="1.5 * 2.0 = 3.0")
    print("✓ PASS\n")
    
    # Test 3: 0.5 * 4.0 = 2.0
    print("Test 3: 0.5 * 4.0")
    a, b = int(0.5 * 10**18), 4 * 10**18
    result = tester.call(addr, sel_mul, a, b, decode_signed=True)
    expected = 2 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: 2.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="0.5 * 4.0 = 2.0")
    print("✓ PASS\n")
    
    # Test 4: -2 * 3 = -6
    print("Test 4: -2 * 3")
    a, b = -2 * 10**18, 3 * 10**18
    result = tester.call(addr, sel_mul, a, b, decode_signed=True)
    expected = -6 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: -6.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="-2 * 3 = -6")
    print("✓ PASS\n")
    
    print("="*60)
    print("✓ ALL MULTIPLICATION TESTS PASSED")
    print("="*60)

def test_hex_division():
    """Test hex float division"""
    print("\n" + "="*60)
    print("TEST: HEX FLOAT DIVISION")
    print("="*60)
    
    tester = HuffTester()
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_hex_arithmetic.huff")
    addr = tester.deploy(bytecode)
    
    selectors = tester.find_selectors(bytecode)
    sel_div = selectors[3]  # div
    
    tolerance = 10**12  # Higher tolerance for div
    
    # Test 1: 6 / 2 = 3
    print("Test 1: 6 / 2")
    a, b = 6 * 10**18, 2 * 10**18
    result = tester.call(addr, sel_div, a, b, decode_signed=True)
    expected = 3 * 10**18
    print(f"Result: {result / 10**18:.6f} (expected: 3.0)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="6 / 2 = 3")
    print("✓ PASS\n")
    
    # Test 2: 10 / 4 = 2.5
    print("Test 2: 10 / 4")
    a, b = 10 * 10**18, 4 * 10**18
    result = tester.call(addr, sel_div, a, b, decode_signed=True)
    expected = int(2.5 * 10**18)
    print(f"Result: {result / 10**18:.6f} (expected: 2.5)")
    tester.assert_approx(result, expected, tolerance=tolerance, msg="10 / 4 = 2.5")
    print("✓ PASS\n")
    
    # Test 3: 1 / 3 ≈ 0.333...
    print("Test 3: 1 / 3")
    a, b = 1 * 10**18, 3 * 10**18
    result = tester.call(addr, sel_div, a, b, decode_signed=True)
    expected = 333333333333333333  # 0.333...
    print(f"Result: {result / 10**18:.6f} (expected: ~0.333)")
    # More lenient tolerance for repeating decimals
    tester.assert_approx(result, expected, tolerance=10**15, msg="1 / 3 ≈ 0.333")
    print("✓ PASS\n")
    
    print("="*60)
    print("✓ ALL DIVISION TESTS PASSED")
    print("="*60)

if __name__ == "__main__":
    try:
        test_hex_conversions()
        test_hex_addition()
        test_hex_multiplication()
        test_hex_division()
        
        print("\n" + "="*60)
        print("🎉 ALL HEX ARITHMETIC TESTS PASSED!")
        print("="*60)
        print("\nHex float format:")
        print("  - 1-bit sign")
        print("  - 8-bit base-16 exponent (biased by 64)")
        print("  - 128-bit mantissa in 64.64 fixed-point")
        print("  - Inspired by IBM System/360 architecture")
        print("="*60)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
