#!/usr/bin/env python3
"""
FP128 Fuzz Testing: Random Test Generation with Decimal Oracle
Tests all 4 operations (add, sub, mul, div) against high-precision Python Decimal
"""

import sys
import os
import random
from decimal import Decimal, getcontext

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_fp import HuffTester

# Set high precision for reference calculations
getcontext().prec = 50

# Test configuration
TOLERANCE_ADD_SUB = 3  # 3 wei tolerance for add/sub (rounding in fixed18 conversion)
TOLERANCE_MUL_DIV = 2_000_000_000  # 2 gwei tolerance for mul/div (precision loss at large magnitudes)

class FuzzTester:
    def __init__(self):
        self.tester = HuffTester()
        self.huff_path = 'contracts/src/tools/huff/test_fp128_addsub.huff'
        
        print("Compiling Huff contract...")
        runtime = self.tester.compile_huff(self.huff_path)
        self.addr = self.tester.deploy(runtime)
        
        print("Finding selectors...")
        selectors = self.tester.find_selectors(runtime)
        self.sel_add = selectors[0]
        self.sel_sub = selectors[1]
        self.sel_mul = selectors[2]
        self.sel_div = selectors[3]
        
        print(f"Contract deployed at {self.addr}")
        print(f"Selectors: add={self.sel_add.hex()}, sub={self.sel_sub.hex()}, mul={self.sel_mul.hex()}, div={self.sel_div.hex()}")
        print()
    
    def to_fixed18(self, d):
        """Convert Decimal to fixed18 int"""
        return int(d * Decimal('1e18'))
    
    def from_fixed18(self, i):
        """Convert fixed18 int to Decimal"""
        return Decimal(i) / Decimal('1e18')
    
    def reference_op(self, a, b, op):
        """Compute reference result using Decimal"""
        if op == 'add':
            return a + b
        elif op == 'sub':
            return a - b
        elif op == 'mul':
            return a * b
        elif op == 'div':
            if b == 0:
                return None
            return a / b
        else:
            raise ValueError(f"Unknown op: {op}")
    
    def test_case(self, a_dec, b_dec, op, tolerance, label=""):
        """Test a single case: compare contract result against Decimal oracle"""
        ref_result = self.reference_op(a_dec, b_dec, op)
        
        if ref_result is None:
            return True, "skipped (div by zero)"
        
        # Convert to fixed18 for contract call
        a_fixed = self.to_fixed18(a_dec)
        b_fixed = self.to_fixed18(b_dec)
        
        # Call contract
        if op == 'add':
            result_fixed = self.tester.call(self.addr, self.sel_add, a_fixed, b_fixed, decode_signed=True)
        elif op == 'sub':
            result_fixed = self.tester.call(self.addr, self.sel_sub, a_fixed, b_fixed, decode_signed=True)
        elif op == 'mul':
            result_fixed = self.tester.call(self.addr, self.sel_mul, a_fixed, b_fixed, decode_signed=True)
        elif op == 'div':
            result_fixed = self.tester.call(self.addr, self.sel_div, a_fixed, b_fixed, decode_signed=True)
        
        # Convert back to Decimal
        result_dec = self.from_fixed18(result_fixed)
        
        # Compare
        error = abs(result_fixed - self.to_fixed18(ref_result))
        
        if error <= tolerance:
            status = "✓"
            passed = True
        else:
            status = "✗"
            passed = False
        
        if not passed or label.startswith("EDGE"):
            print(f"  {status} {label}")
            print(f"     a={a_dec}, b={b_dec}, op={op}")
            print(f"     Expected: {ref_result}")
            print(f"     Got:      {result_dec}")
            print(f"     Error:    {error} wei")
        
        return passed, error
    
    def run_fuzz_suite(self, op, num_tests, range_gen, label, tolerance):
        """Run a suite of random tests for one operation"""
        print(f"\n{'='*60}")
        print(f"{label} - {op.upper()} ({num_tests} tests)")
        print(f"{'='*60}")
        
        passed = 0
        failed = 0
        max_error = 0
        
        for i in range(num_tests):
            a, b = range_gen()
            success, error = self.test_case(a, b, op, tolerance, f"Test {i+1}")
            
            if success:
                passed += 1
            else:
                failed += 1
            
            max_error = max(max_error, error if isinstance(error, int) else 0)
        
        print(f"\nResults: {passed} passed, {failed} failed")
        if max_error > 0:
            print(f"Max error: {max_error} wei")
        
        return failed == 0


def random_positive():
    """Generate random positive pair in [0.001, 1e9]"""
    a = Decimal(random.uniform(0.001, 1e9))
    b = Decimal(random.uniform(0.001, 1e9))
    return a, b

def random_signed():
    """Generate random signed pair in [-1e9, 1e9]"""
    a = Decimal(random.uniform(-1e9, 1e9))
    b = Decimal(random.uniform(-1e9, 1e9))
    return a, b

def random_small():
    """Generate small values near zero in [1e-15, 1e-3]"""
    a = Decimal(random.uniform(1e-15, 1e-3))
    b = Decimal(random.uniform(1e-15, 1e-3))
    return a, b

def random_large():
    """Generate large values in [1e6, 1e9]"""
    a = Decimal(random.uniform(1e6, 1e9))
    b = Decimal(random.uniform(1e6, 1e9))
    return a, b

def random_mixed():
    """Generate mixed magnitude: one large, one small"""
    a = Decimal(random.uniform(1e-10, 1e-3))
    b = Decimal(random.uniform(1e6, 1e9))
    if random.random() < 0.5:
        a, b = b, a
    return a, b


def test_addition_fuzz():
    """Fuzz test addition with random inputs"""
    tester = FuzzTester()
    
    all_passed = True
    
    # Edge cases first
    print("\n" + "="*60)
    print("EDGE CASES - ADDITION")
    print("="*60)
    
    edge_cases = [
        (Decimal('0'), Decimal('0'), 'add', "EDGE: 0 + 0"),
        (Decimal('1'), Decimal('0'), 'add', "EDGE: 1 + 0"),
        (Decimal('0'), Decimal('1'), 'add', "EDGE: 0 + 1"),
        (Decimal('-1'), Decimal('1'), 'add', "EDGE: -1 + 1"),
        (Decimal('1000000'), Decimal('-1000000'), 'add', "EDGE: 1M + (-1M)"),
    ]
    
    for a, b, op, label in edge_cases:
        success, _ = tester.test_case(a, b, op, TOLERANCE_ADD_SUB, label)
        if not success:
            all_passed = False
    
    # Random positive
    all_passed &= tester.run_fuzz_suite('add', 50, random_positive, "Random Positive Values", TOLERANCE_ADD_SUB)
    
    # Random signed
    all_passed &= tester.run_fuzz_suite('add', 50, random_signed, "Random Signed Values", TOLERANCE_ADD_SUB)
    
    # Small values
    all_passed &= tester.run_fuzz_suite('add', 20, random_small, "Small Values Near Zero", TOLERANCE_ADD_SUB)
    
    # Large values
    all_passed &= tester.run_fuzz_suite('add', 20, random_large, "Large Values", TOLERANCE_ADD_SUB)
    
    print("\n" + "="*60)
    print(f"ADDITION FUZZ TEST: {'PASSED ✓' if all_passed else 'FAILED ✗'}")
    print("="*60)
    
    assert all_passed, "Addition fuzz tests failed"


def test_subtraction_fuzz():
    """Fuzz test subtraction with random inputs"""
    tester = FuzzTester()
    
    all_passed = True
    
    # Edge cases
    print("\n" + "="*60)
    print("EDGE CASES - SUBTRACTION")
    print("="*60)
    
    edge_cases = [
        (Decimal('0'), Decimal('0'), 'sub', "EDGE: 0 - 0"),
        (Decimal('1'), Decimal('1'), 'sub', "EDGE: 1 - 1"),
        (Decimal('5'), Decimal('3'), 'sub', "EDGE: 5 - 3"),
        (Decimal('3'), Decimal('5'), 'sub', "EDGE: 3 - 5 (negative)"),
        (Decimal('-10'), Decimal('5'), 'sub', "EDGE: -10 - 5"),
    ]
    
    for a, b, op, label in edge_cases:
        success, _ = tester.test_case(a, b, op, TOLERANCE_ADD_SUB, label)
        if not success:
            all_passed = False
    
    # Random tests
    all_passed &= tester.run_fuzz_suite('sub', 50, random_positive, "Random Positive Values", TOLERANCE_ADD_SUB)
    all_passed &= tester.run_fuzz_suite('sub', 50, random_signed, "Random Signed Values", TOLERANCE_ADD_SUB)
    all_passed &= tester.run_fuzz_suite('sub', 20, random_small, "Small Values", TOLERANCE_ADD_SUB)
    
    print("\n" + "="*60)
    print(f"SUBTRACTION FUZZ TEST: {'PASSED ✓' if all_passed else 'FAILED ✗'}")
    print("="*60)
    
    assert all_passed, "Subtraction fuzz tests failed"


def test_multiplication_fuzz():
    """Fuzz test multiplication with random inputs"""
    tester = FuzzTester()
    
    all_passed = True
    
    # Edge cases
    print("\n" + "="*60)
    print("EDGE CASES - MULTIPLICATION")
    print("="*60)
    
    edge_cases = [
        (Decimal('0'), Decimal('0'), 'mul', "EDGE: 0 * 0"),
        (Decimal('1'), Decimal('1'), 'mul', "EDGE: 1 * 1"),
        (Decimal('2'), Decimal('3'), 'mul', "EDGE: 2 * 3"),
        (Decimal('0.5'), Decimal('2'), 'mul', "EDGE: 0.5 * 2"),
        (Decimal('-2'), Decimal('3'), 'mul', "EDGE: -2 * 3"),
        (Decimal('-2'), Decimal('-3'), 'mul', "EDGE: -2 * -3"),
        (Decimal('1000000'), Decimal('1'), 'mul', "EDGE: 1M * 1"),
    ]
    
    for a, b, op, label in edge_cases:
        success, _ = tester.test_case(a, b, op, TOLERANCE_MUL_DIV, label)
        if not success:
            all_passed = False
    
    # Random tests
    all_passed &= tester.run_fuzz_suite('mul', 50, random_positive, "Random Positive Values", TOLERANCE_MUL_DIV)
    all_passed &= tester.run_fuzz_suite('mul', 50, random_signed, "Random Signed Values", TOLERANCE_MUL_DIV)
    all_passed &= tester.run_fuzz_suite('mul', 20, random_small, "Small Values", TOLERANCE_MUL_DIV)
    all_passed &= tester.run_fuzz_suite('mul', 20, random_large, "Large Values", TOLERANCE_MUL_DIV)
    
    print("\n" + "="*60)
    print(f"MULTIPLICATION FUZZ TEST: {'PASSED ✓' if all_passed else 'FAILED ✗'}")
    print("="*60)
    
    assert all_passed, "Multiplication fuzz tests failed"


def test_division_fuzz():
    """Fuzz test division with random inputs"""
    tester = FuzzTester()
    
    all_passed = True
    
    # Edge cases
    print("\n" + "="*60)
    print("EDGE CASES - DIVISION")
    print("="*60)
    
    edge_cases = [
        (Decimal('0'), Decimal('1'), 'div', "EDGE: 0 / 1"),
        (Decimal('1'), Decimal('1'), 'div', "EDGE: 1 / 1"),
        (Decimal('6'), Decimal('3'), 'div', "EDGE: 6 / 3"),
        (Decimal('1'), Decimal('2'), 'div', "EDGE: 1 / 2"),
        (Decimal('1'), Decimal('3'), 'div', "EDGE: 1 / 3 (repeating)"),
        (Decimal('-6'), Decimal('3'), 'div', "EDGE: -6 / 3"),
        (Decimal('6'), Decimal('-3'), 'div', "EDGE: 6 / -3"),
        (Decimal('-6'), Decimal('-3'), 'div', "EDGE: -6 / -3"),
    ]
    
    for a, b, op, label in edge_cases:
        success, _ = tester.test_case(a, b, op, TOLERANCE_MUL_DIV, label)
        if not success:
            all_passed = False
    
    # Random tests (filter out b near zero)
    def random_positive_no_zero():
        a = Decimal(random.uniform(0.001, 1e15))
        b = Decimal(random.uniform(0.1, 1e15))  # Avoid very small divisors
        return a, b
    
    def random_signed_no_zero():
        a = Decimal(random.uniform(-1e15, 1e15))
        b_val = random.uniform(-1e15, 1e15)
        while abs(b_val) < 0.1:  # Avoid near-zero divisors
            b_val = random.uniform(-1e15, 1e15)
        b = Decimal(b_val)
        return a, b
    
    all_passed &= tester.run_fuzz_suite('div', 50, random_positive_no_zero, "Random Positive Values", TOLERANCE_MUL_DIV)
    all_passed &= tester.run_fuzz_suite('div', 50, random_signed_no_zero, "Random Signed Values", TOLERANCE_MUL_DIV)
    
    print("\n" + "="*60)
    print(f"DIVISION FUZZ TEST: {'PASSED ✓' if all_passed else 'FAILED ✗'}")
    print("="*60)
    
    assert all_passed, "Division fuzz tests failed"


def test_all_operations():
    """Run comprehensive fuzz tests for all operations"""
    print("\n" + "█"*60)
    print("FP128 COMPREHENSIVE FUZZ TEST SUITE")
    print("Using Python Decimal as reference oracle")
    print("█"*60)
    
    try:
        test_addition_fuzz()
        test_subtraction_fuzz()
        test_multiplication_fuzz()
        test_division_fuzz()
        
        print("\n" + "█"*60)
        print("ALL FUZZ TESTS PASSED ✓")
        print("█"*60 + "\n")
        
    except AssertionError as e:
        print("\n" + "█"*60)
        print(f"FUZZ TESTS FAILED: {e}")
        print("█"*60 + "\n")
        raise


if __name__ == "__main__":
    # Set random seed for reproducibility (comment out for truly random)
    random.seed(42)
    
    test_all_operations()
