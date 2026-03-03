#!/usr/bin/env python3
"""
Test 128.128 fixed-point multiply and divide operations.
"""
import sys
import os

# Add parent directory to path to import test_fp
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_fp import HuffTester

def test_multiplication():
    """Test FP128 multiplication with various inputs."""
    tester = HuffTester()
    
    # Compile and deploy
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    addr = tester.deploy(bytecode)
    selectors = tester.find_selectors(bytecode)
    
    # Map selectors (order: add, sub, mul, div, fromFixed18, toFixed18)
    sel_mul = selectors[2]
    
    # Helper to call mul
    def mul(a, b):
        return tester.call(addr, sel_mul, a, b, decode_signed=True)
    
    # Test cases
    print("Testing multiplication...")
    
    # 1 * 1 = 1
    result = mul(10**18, 10**18)
    assert result == 10**18, f"1 * 1 failed: got {result}"
    print("✓ 1 * 1 = 1")
    
    # 2 * 3 = 6
    result = mul(2 * 10**18, 3 * 10**18)
    assert result == 6 * 10**18, f"2 * 3 failed: got {result}"
    print("✓ 2 * 3 = 6")
    
    # 0.5 * 2 = 1
    result = mul(5 * 10**17, 2 * 10**18)
    assert result == 10**18, f"0.5 * 2 failed: got {result}"
    print("✓ 0.5 * 2 = 1")
    
    # 0.1 * 0.1 = 0.01
    result = mul(10**17, 10**17)
    expected = 10**16
    assert abs(result - expected) <= 1, f"0.1 * 0.1 failed: got {result}, expected {expected}"
    print("✓ 0.1 * 0.1 = 0.01")
    
    # -2 * 3 = -6
    result = mul(-2 * 10**18, 3 * 10**18)
    assert result == -6 * 10**18, f"-2 * 3 failed: got {result}"
    print("✓ -2 * 3 = -6")
    
    # -2 * -3 = 6
    result = mul(-2 * 10**18, -3 * 10**18)
    assert result == 6 * 10**18, f"-2 * -3 failed: got {result}"
    print("✓ -2 * -3 = 6")
    
    # x * 0 = 0
    result = mul(42 * 10**18, 0)
    assert result == 0, f"42 * 0 failed: got {result}"
    print("✓ 42 * 0 = 0")
    
    # x * 1 = x (identity, allow small rounding error)
    x = 123456789 * 10**9
    result = mul(x, 10**18)
    assert abs(result - x) <= 1000, f"x * 1 failed: got {result}, expected {x}"
    print("✓ x * 1 ≈ x (identity)")
    
    print("All multiplication tests passed!")

def test_division():
    """Test FP128 division with various inputs."""
    tester = HuffTester()
    
    # Compile and deploy
    bytecode = tester.compile_huff("contracts/src/tools/huff/test_fp128_addsub.huff")
    addr = tester.deploy(bytecode)
    selectors = tester.find_selectors(bytecode)
    
    # Map selectors (order: add, sub, mul, div, fromFixed18, toFixed18)
    sel_div = selectors[3]
    
    # Helper to call div
    def div(a, b):
        return tester.call(addr, sel_div, a, b, decode_signed=True)
    
    # Helper for approximate equality
    def assert_approx(actual, expected, tolerance=10, label=""):
        diff = abs(actual - expected)
        assert diff <= tolerance, f"{label} failed: got {actual}, expected {expected}, diff {diff}"
    
    print("\nTesting division...")
    
    # 6 / 3 = 2
    result = div(6 * 10**18, 3 * 10**18)
    assert result == 2 * 10**18, f"6 / 3 failed: got {result}"
    print("✓ 6 / 3 = 2")
    
    # 1 / 2 = 0.5
    result = div(10**18, 2 * 10**18)
    assert result == 5 * 10**17, f"1 / 2 failed: got {result}"
    print("✓ 1 / 2 = 0.5")
    
    # 1 / 3 ≈ 0.333...
    result = div(10**18, 3 * 10**18)
    expected = 333333333333333333  # 0.333...e18
    assert_approx(result, expected, tolerance=1000, label="1 / 3")
    print(f"✓ 1 / 3 ≈ 0.333... (got {result / 10**18:.18f})")
    
    # -6 / 3 = -2
    result = div(-6 * 10**18, 3 * 10**18)
    assert result == -2 * 10**18, f"-6 / 3 failed: got {result}"
    print("✓ -6 / 3 = -2")
    
    # 6 / -3 = -2
    result = div(6 * 10**18, -3 * 10**18)
    assert result == -2 * 10**18, f"6 / -3 failed: got {result}"
    print("✓ 6 / -3 = -2")
    
    # -6 / -3 = 2
    result = div(-6 * 10**18, -3 * 10**18)
    assert result == 2 * 10**18, f"-6 / -3 failed: got {result}"
    print("✓ -6 / -3 = 2")
    
    # x / 1 = x (identity, allow small rounding error from 64-bit chunking)
    x = 123456789 * 10**9
    result = div(x, 10**18)
    assert abs(result - x) <= 1000, f"x / 1 failed: got {result}, expected {x}"
    print("✓ x / 1 ≈ x (identity)")
    
    # 0 / x = 0
    result = div(0, 42 * 10**18)
    assert result == 0, f"0 / 42 failed: got {result}"
    print("✓ 0 / 42 = 0")
    
    print("All division tests passed!")

if __name__ == "__main__":
    test_multiplication()
    test_division()
    print("\n✓ All tests passed!")
