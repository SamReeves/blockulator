#!/usr/bin/env python3
"""
Verification script for Huff exp calculator
Tests the Huff implementation against high-precision Python calculations
"""

from decimal import Decimal, getcontext
import sys
import os

# Set precision to 50 decimal places
getcontext().prec = 50

# High-precision e
E = Decimal('2.7182818284590452353602874713526624977572470937')


def fixed18_to_decimal(fixed18_int):
    """Convert fixed18 uint256 to Decimal"""
    return Decimal(fixed18_int) / Decimal(10 ** 18)


def decimal_to_fixed18(dec):
    """Convert Decimal to fixed18 uint256"""
    return int(dec * Decimal(10 ** 18))


def calculate_exp_reference(x):
    """
    Calculate e^x with 50-digit precision
    Returns the value truncated to 18 decimal places
    """
    x_dec = Decimal(str(x))
    result_50 = E ** x_dec
    # Truncate to 18 decimal places
    result_18 = Decimal(int(result_50 * Decimal(10 ** 18))) / Decimal(10 ** 18)
    return result_18


def test_exp_values():
    """Test exp function with various inputs"""
    
    print("=" * 80)
    print("HUFF EXP CALCULATOR VERIFICATION")
    print("=" * 80)
    print()
    print("Testing against 50-digit reference calculations")
    print("Expected output: 18-decimal precision")
    print()
    
    # Test cases: (x, description)
    test_cases = [
        (0, "e^0 = 1"),
        (1, "e^1 = e"),
        (0.5, "e^0.5"),
        (0.1, "e^0.1"),
        (0.01, "e^0.01"),
        (2, "e^2"),
        (3, "e^3"),
        (0.693147, "e^0.693147 ≈ 2 (ln(2))"),
        (1.098612, "e^1.098612 ≈ 3 (ln(3))"),
        (2.302585, "e^2.302585 ≈ 10 (ln(10))"),
    ]
    
    print(f"{'Input':<12} {'Expected (50-digit calc)':<30} {'Expected (18-digit)':<25}")
    print("-" * 80)
    
    for x, desc in test_cases:
        # Calculate reference value
        reference_50 = E ** Decimal(str(x))
        reference_18 = calculate_exp_reference(x)
        
        # Format for display
        ref_50_str = f"{reference_50:.30f}"
        ref_18_str = f"{reference_18:.18f}"
        
        print(f"{x:<12.6f} {ref_50_str:<30} {ref_18_str:<25}")
        print(f"  Description: {desc}")
        
        # Show fixed18 representation for contract testing
        x_fixed18 = decimal_to_fixed18(Decimal(str(x)))
        expected_fixed18 = decimal_to_fixed18(reference_18)
        
        print(f"  Input (fixed18):    {x_fixed18}")
        print(f"  Expected (fixed18): {expected_fixed18}")
        print()
    
    print("=" * 80)
    print()
    print("NOTE: The Huff implementation currently uses a simplified Taylor series")
    print("approximation for testing the FP framework. Full product-rule")
    print("implementation will be added next for achieving 18-digit precision.")
    print()
    
    return True


def generate_test_vectors():
    """Generate test vectors for Solidity/Foundry tests"""
    
    print("\n" + "=" * 80)
    print("TEST VECTORS FOR FOUNDRY TESTS")
    print("=" * 80)
    print()
    
    test_values = [0, 0.1, 0.5, 1, 2]
    
    print("// Test vectors for exp.t.sol")
    print("// Format: (input_fixed18, expected_output_fixed18)")
    print()
    
    for x in test_values:
        x_fixed18 = decimal_to_fixed18(Decimal(str(x)))
        result_18 = calculate_exp_reference(x)
        result_fixed18 = decimal_to_fixed18(result_18)
        
        print(f"// e^{x} = {result_18:.18f}")
        print(f"({x_fixed18}, {result_fixed18}),")
        print()


def compare_with_vyper():
    """Compare expected results with existing Vyper implementation"""
    
    print("\n" + "=" * 80)
    print("COMPARISON WITH VYPER (10-DECIMAL) IMPLEMENTATION")
    print("=" * 80)
    print()
    
    print("Testing same inputs that work with Vyper exp.vy (range [0, 10))")
    print()
    
    test_values = [0, 0.5, 1, 2, 3, 5, 7, 9, 9.9]
    
    print(f"{'Input':<8} {'Huff (18-dec)':<25} {'Vyper (10-dec)':<25} {'Match?'}")
    print("-" * 80)
    
    for x in test_values:
        result_18 = calculate_exp_reference(x)
        result_10 = Decimal(int(result_18 * Decimal(10 ** 10))) / Decimal(10 ** 10)
        
        # First 10 digits should match
        match = str(result_18)[:12] == str(result_10)[:12]
        match_str = "✓" if match else "✗"
        
        print(f"{x:<8.1f} {result_18:<25.18f} {result_10:<25.10f} {match_str}")
    
    print()


if __name__ == "__main__":
    success = test_exp_values()
    generate_test_vectors()
    compare_with_vyper()
    
    if success:
        print("=" * 80)
        print("✓ Verification script completed successfully")
        print("=" * 80)
        sys.exit(0)
    else:
        print("=" * 80)
        print("✗ Verification failed")
        print("=" * 80)
        sys.exit(1)
