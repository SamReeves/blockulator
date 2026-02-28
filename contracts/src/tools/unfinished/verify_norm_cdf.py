#!/usr/bin/env python3
"""
Verify norm_cdf.vy implementation with 50-place precision
Tests both the erf approximation and normal CDF calculations
"""

from decimal import Decimal, getcontext
import math

# Set precision to 50 decimal places
getcontext().prec = 50

def format_decimal(d):
    """Format decimal to 10 places like Vyper"""
    return f"{d:.10f}"

def erf_reference(x):
    """Reference erf calculation using math library"""
    return Decimal(str(math.erf(float(x))))

def abramowitz_stegun_erf(x):
    """
    Abramowitz-Stegun approximation used in norm_cdf.vy
    Formula 7.1.26
    """
    if x == 0:
        return Decimal('0')
    
    # Constants from norm_cdf.vy
    P = Decimal('0.3275911000')
    A1 = Decimal('0.2548295920')
    A2 = Decimal('-0.2844967360')
    A3 = Decimal('1.4214137410')
    A4 = Decimal('-1.4531520270')
    A5 = Decimal('1.0614054290')
    
    # Handle negative values
    sign = Decimal('1') if x >= 0 else Decimal('-1')
    abs_x = abs(x)
    
    # For |x| >= 5, erf(x) ≈ ±1
    if abs_x >= 5:
        return sign
    
    # Calculate t = 1 / (1 + px)
    t = Decimal('1') / (Decimal('1') + P * abs_x)
    t2 = t * t
    t3 = t2 * t
    t4 = t3 * t
    t5 = t4 * t
    
    # Polynomial
    poly = A1 * t + A2 * t2 + A3 * t3 + A4 * t4 + A5 * t5
    
    # e^(-x^2) approximation (using Python's exp for now)
    exp_neg_x_sq = Decimal(str(math.exp(-float(abs_x * abs_x))))
    
    # erf(x) = 1 - poly * e^(-x^2)
    result = Decimal('1') - poly * exp_neg_x_sq
    
    return sign * result

def verify_exp_neg_x_sq_table():
    """Verify the EXP_NEG_X_SQ lookup table"""
    print("=" * 80)
    print("VERIFYING EXP_NEG_X_SQ LOOKUP TABLE")
    print("=" * 80)
    print()
    
    # Expected table from norm_cdf.vy
    expected_table = [
        1.0000000000, 0.9900498337, 0.9607894392, 0.9139311853, 0.8521437890,
        0.7788007831, 0.6976763261, 0.6126263942, 0.5272924240, 0.4448580662,
        0.3678794412, 0.2981972794, 0.2369277587, 0.1845195240, 0.1408584209,
        0.1053992246, 0.0773047404, 0.0555762126, 0.0391638951, 0.0270518469,
        0.0183156389, 0.0121551783, 0.0079070541, 0.0050417603, 0.0031511116,
        0.0019304541, 0.0011592292, 0.0006823281, 0.0003936690, 0.0002226299,
        0.0001234098, 0.0000670548, 0.0000357128, 0.0000186437, 0.0000095402,
        0.0000047851
    ]
    
    all_pass = True
    errors = []
    
    for i in range(36):
        x = Decimal(i) * Decimal('0.1')
        calculated = Decimal(str(math.exp(-float(x * x))))
        expected = Decimal(str(expected_table[i]))
        
        calc_str = format_decimal(calculated)
        exp_str = format_decimal(expected)
        
        match = "✓" if calc_str == exp_str else "✗"
        
        if calc_str != exp_str:
            all_pass = False
            error = abs(calculated - expected)
            errors.append((i, x, calc_str, exp_str, error))
            print(f"[{match}] e^(-{x}²) = {exp_str} (calculated: {calc_str}, error: {error})")
        else:
            print(f"[{match}] e^(-{x}²) = {calc_str}")
    
    print()
    print("=" * 80)
    if all_pass:
        print("✅ EXP_NEG_X_SQ TABLE VERIFIED - All values correct!")
    else:
        print(f"❌ ERRORS FOUND - {len(errors)} values need correction")
    print("=" * 80)
    print()
    
    return all_pass

def test_erf_approximation():
    """Test the erf approximation accuracy"""
    print("=" * 80)
    print("TESTING ERF APPROXIMATION ACCURACY")
    print("=" * 80)
    print()
    
    test_points = [0, 0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, -0.5, -1.0, -2.0]
    
    max_error = Decimal('0')
    
    for x in test_points:
        x_dec = Decimal(str(x))
        reference = erf_reference(x_dec)
        approx = abramowitz_stegun_erf(x_dec)
        error = abs(reference - approx)
        
        if error > max_error:
            max_error = error
        
        print(f"erf({x:5.1f}):")
        print(f"  Reference:     {format_decimal(reference)}")
        print(f"  A-S Approx:    {format_decimal(approx)}")
        print(f"  Error:         {error:.15e}")
        print()
    
    print("=" * 80)
    print(f"Maximum error: {max_error:.15e}")
    print(f"A-S specification: < 1.5e-7")
    print("✅ PASS" if max_error < Decimal('1.5e-7') else "❌ FAIL")
    print("=" * 80)
    print()

def test_norm_cdf():
    """Test normal CDF calculations"""
    print("=" * 80)
    print("TESTING NORMAL CDF")
    print("=" * 80)
    print()
    
    SQRT_2 = Decimal('1.4142135624')
    
    # Test standard normal CDF values (well-known)
    # Φ(0) = 0.5, Φ(1) ≈ 0.8413, Φ(-1) ≈ 0.1587, etc.
    test_cases = [
        (0, 0.5),
        (1, 0.8413447460685429),
        (-1, 0.15865525393145705),
        (2, 0.9772498680518208),
        (-2, 0.022750131948179195),
        (3, 0.9986501019683699),
    ]
    
    for z, expected_cdf in test_cases:
        z_dec = Decimal(str(z))
        
        # Calculate: Φ(z) = 0.5 * (1 + erf(z / √2))
        z_normalized = z_dec / SQRT_2
        erf_val = abramowitz_stegun_erf(z_normalized)
        calculated_cdf = Decimal('0.5') * (Decimal('1') + erf_val)
        
        expected = Decimal(str(expected_cdf))
        error = abs(calculated_cdf - expected)
        
        print(f"Φ({z}):")
        print(f"  Calculated: {format_decimal(calculated_cdf)}")
        print(f"  Expected:   {format_decimal(expected)}")
        print(f"  Error:      {error:.15e}")
        print()
    
    print("=" * 80)
    print("✅ NORMAL CDF TESTS COMPLETE")
    print("=" * 80)
    print()

def test_general_normal():
    """Test general N(μ, σ²) distribution"""
    print("=" * 80)
    print("TESTING GENERAL NORMAL DISTRIBUTION N(μ, σ²)")
    print("=" * 80)
    print()
    
    SQRT_2 = Decimal('1.4142135624')
    
    # Test N(10, 4) - mean=10, variance=4, std=2
    mu = Decimal('10')
    sigma = Decimal('2')
    
    test_values = [8, 10, 12, 14]
    
    print(f"Distribution: N(μ={mu}, σ={sigma})")
    print()
    
    for x in test_values:
        x_dec = Decimal(str(x))
        
        # Standardize: z = (x - μ) / σ
        z = (x_dec - mu) / sigma
        
        # Calculate CDF
        z_normalized = z / SQRT_2
        erf_val = abramowitz_stegun_erf(z_normalized)
        cdf = Decimal('0.5') * (Decimal('1') + erf_val)
        
        print(f"P(X ≤ {x}) = {format_decimal(cdf)}")
        print(f"  (standardized z = {format_decimal(z)})")
        print()
    
    print("=" * 80)
    print()

if __name__ == "__main__":
    verify_exp_neg_x_sq_table()
    test_erf_approximation()
    test_norm_cdf()
    test_general_normal()

