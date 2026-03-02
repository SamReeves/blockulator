#!/usr/bin/env python3
"""
Python FP Simulator - Bit-accurate simulation of Huff FP operations
Mirrors the exact encoding and arithmetic used in fp.huff
"""

from decimal import Decimal, getcontext
getcontext().prec = 50

# Constants matching fp_constants.huff (24-digit precision)
MIN_MANTISSA = 10 ** 23
MAX_MANTISSA = 10 ** 24
EXP_BIAS = 16384
MANTISSA_MASK = (1 << 240) - 1
EXP_MASK = 0x7FFF
SIGN_MASK = 1 << 255


class FPNumber:
    """Represents a floating-point number in our custom format"""
    
    def __init__(self, sign, exponent, mantissa):
        """
        Initialize FP number
        sign: 0 or 1
        exponent: signed integer (unbiased)
        mantissa: integer in range [MIN_MANTISSA, MAX_MANTISSA)
        
        value = ((-1)^sign) * mantissa * 10^exponent
        """
        self.sign = sign
        self.exponent = exponent
        self.mantissa = mantissa
    
    def pack(self):
        """Pack into uint256"""
        biased_exp = self.exponent + EXP_BIAS
        if biased_exp < 0 or biased_exp > EXP_MASK:
            raise ValueError(f"Exponent {self.exponent} out of range")
        
        packed = (self.sign << 255) | (biased_exp << 240) | self.mantissa
        return packed
    
    @staticmethod
    def unpack(packed):
        """Unpack from uint256"""
        sign = (packed >> 255) & 1
        biased_exp = (packed >> 240) & EXP_MASK
        exponent = biased_exp - EXP_BIAS
        # Handle two's complement for negative exponents
        if exponent > (EXP_MASK // 2):
            exponent = exponent - (EXP_MASK + 1)
        mantissa = packed & MANTISSA_MASK
        return FPNumber(sign, exponent, mantissa)
    
    def to_decimal(self):
        """Convert to Python Decimal"""
        if self.mantissa == 0:
            return Decimal(0)
        value = Decimal(self.mantissa) * (Decimal(10) ** self.exponent)
        if self.sign:
            value = -value
        return value
    
    @staticmethod
    def from_decimal(value):
        """Convert from Python Decimal"""
        if value == 0:
            return FPNumber(0, 0, 0)
        
        sign = 1 if value < 0 else 0
        if sign:
            value = -value
        
        # Normalize to [MIN_MANTISSA, MAX_MANTISSA)
        exponent = 0
        mantissa = value
        
        while mantissa >= MAX_MANTISSA:
            mantissa = mantissa / 10
            exponent += 1
        
        while mantissa < MIN_MANTISSA and mantissa != 0:
            mantissa = mantissa * 10
            exponent -= 1
        
        mantissa_int = int(mantissa)
        return FPNumber(sign, exponent, mantissa_int)
    
    def __repr__(self):
        return f"FP(sign={self.sign}, exp={self.exponent}, mant={self.mantissa})"


def fp_normalize(exponent, mantissa):
    """Normalize mantissa to [MIN_MANTISSA, MAX_MANTISSA)"""
    if mantissa == 0:
        return exponent, mantissa
    
    # Normalize down
    while mantissa >= MAX_MANTISSA:
        mantissa = mantissa // 10
        exponent += 1
    
    # Normalize up
    while mantissa < MIN_MANTISSA and mantissa != 0:
        mantissa = mantissa * 10
        exponent -= 1
    
    return exponent, mantissa


def fp_mul(a_packed, b_packed):
    """Multiply two FP numbers"""
    a = FPNumber.unpack(a_packed)
    b = FPNumber.unpack(b_packed)
    
    # Result sign = sign_a XOR sign_b
    result_sign = a.sign ^ b.sign
    
    # Result exponent = exp_a + exp_b + 23 (compensate for mantissa scaling)
    result_exp = a.exponent + b.exponent + 23
    
    # Result mantissa = (mant_a * mant_b) / 1e23
    result_mant = (a.mantissa * b.mantissa) // MIN_MANTISSA
    
    # Normalize
    result_exp, result_mant = fp_normalize(result_exp, result_mant)
    
    return FPNumber(result_sign, result_exp, result_mant).pack()


def fp_div(a_packed, b_packed):
    """Divide two FP numbers"""
    a = FPNumber.unpack(a_packed)
    b = FPNumber.unpack(b_packed)
    
    # Result sign = sign_a XOR sign_b
    result_sign = a.sign ^ b.sign
    
    # Result exponent = exp_a - exp_b - 23 (compensate for mantissa scaling)
    result_exp = a.exponent - b.exponent - 23
    
    # Result mantissa = (mant_a * 1e23) / mant_b
    result_mant = (a.mantissa * MIN_MANTISSA) // b.mantissa
    
    # Normalize
    result_exp, result_mant = fp_normalize(result_exp, result_mant)
    
    return FPNumber(result_sign, result_exp, result_mant).pack()


def fp_add(a_packed, b_packed):
    """Add two FP numbers"""
    a = FPNumber.unpack(a_packed)
    b = FPNumber.unpack(b_packed)
    
    # Align exponents
    if a.exponent > b.exponent:
        shift = a.exponent - b.exponent
        b_mant_aligned = b.mantissa // (10 ** shift)
        result_exp = a.exponent
        a_mant = a.mantissa
        b_mant = b_mant_aligned
    else:
        shift = b.exponent - a.exponent
        a_mant_aligned = a.mantissa // (10 ** shift)
        result_exp = b.exponent
        a_mant = a_mant_aligned
        b_mant = b.mantissa
    
    # Add or subtract mantissas based on signs
    if a.sign == b.sign:
        # Same sign: add
        result_mant = a_mant + b_mant
        result_sign = a.sign
    else:
        # Different signs: subtract
        if a_mant >= b_mant:
            result_mant = a_mant - b_mant
            result_sign = a.sign
        else:
            result_mant = b_mant - a_mant
            result_sign = b.sign
    
    # Normalize
    result_exp, result_mant = fp_normalize(result_exp, result_mant)
    
    return FPNumber(result_sign, result_exp, result_mant).pack()


def fp_sub(a_packed, b_packed):
    """Subtract two FP numbers"""
    # Flip sign of b and add
    b_negated = b_packed ^ SIGN_MASK
    return fp_add(a_packed, b_negated)


def fp_from_uint(value):
    """Convert uint to FP"""
    if value == 0:
        return 0
    
    exponent, mantissa = fp_normalize(0, value)
    return FPNumber(0, exponent, mantissa).pack()


def fp_from_fixed18(fixed18):
    """Convert 18-decimal fixed-point to FP"""
    if fixed18 == 0:
        return 0
    
    # Start with exp = -18, mantissa = fixed18, then normalize
    # Use two's complement representation for -18
    exp_neg18 = -18
    exponent, mantissa = fp_normalize(exp_neg18, fixed18)
    return FPNumber(0, exponent, mantissa).pack()


def fp_to_fixed18(fp_packed):
    """Convert FP to 18-decimal fixed-point"""
    fp = FPNumber.unpack(fp_packed)
    
    # Calculate mantissa * 10^(exp + 18)
    shift = fp.exponent + 18
    
    if shift >= 0:
        # Multiply
        result = fp.mantissa * (10 ** shift)
    else:
        # Divide
        result = fp.mantissa // (10 ** (-shift))
    
    return result


def fp_floor_digit(fp_packed):
    """Extract integer digit (0-9) from FP number"""
    fp = FPNumber.unpack(fp_packed)
    
    # value = mantissa * 10^exp
    # For mantissa in [10^19, 10^20), we want floor(value)
    # floor(mantissa * 10^exp) = mantissa // 10^(-exp) when exp < 0
    
    # If exp < -23, value < 1, digit is 0
    if fp.exponent < -23:
        return 0
    
    # digit = mantissa // 10**(-exp)
    # For exp = -23: digit = mantissa // 1e23
    # For exp = -22: digit = mantissa // 1e22
    shift = -fp.exponent
    digit = fp.mantissa // (10 ** shift)
    
    # Cap at 9
    if digit > 9:
        digit = 9
    
    return digit


def load_exp_table():
    """Load exp table from generated file"""
    import sys
    import os
    
    # Import the table generation to get values
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
    from generate_exp_table import fp_encode
    
    # High-precision e
    e = Decimal('2.7182818284590452353602874713526624977572470937')
    
    table = []
    for i in range(19):
        row = []
        for d in range(10):
            exponent_decimal = Decimal(d) * Decimal(10) ** (-i)
            value = e ** exponent_decimal
            sign, exp, mantissa, hex_str = fp_encode(value)
            packed = int(hex_str, 16)
            row.append(packed)
        table.append(row)
    
    return table


def simulate_exp(x_fixed18, verbose=False):
    """Simulate the exp product-rule algorithm"""
    if x_fixed18 == 0:
        return 10 ** 18  # 1.0 in fixed18
    
    # Load table
    table = load_exp_table()
    
    # Convert to FP
    x_fp = fp_from_fixed18(x_fixed18)
    if verbose:
        x_dec = FPNumber.unpack(x_fp).to_decimal()
        print(f"Input: {x_fixed18} (fixed18) = {x_dec} (decimal)")
    
    # Initialize y = 1.0
    fp_one = FPNumber(0, -23, MIN_MANTISSA).pack()
    y_fp = fp_one
    
    # 19 iterations
    for i in range(19):
        # Extract digit
        d = fp_floor_digit(x_fp)
        
        # Lookup table
        factor = table[i][d]
        
        if verbose:
            factor_dec = FPNumber.unpack(factor).to_decimal()
            x_dec = FPNumber.unpack(x_fp).to_decimal()
            y_dec = FPNumber.unpack(y_fp).to_decimal()
            print(f"Iter {i}: d={d}, x={x_dec:.20f}, y={y_dec:.20f}, factor={factor_dec:.20f}")
        
        # Multiply y by factor
        y_fp = fp_mul(y_fp, factor)
        
        # Convert d to FP and subtract from x
        d_fp = fp_from_uint(d)
        x_fp = fp_sub(x_fp, d_fp)
        
        # Multiply x by 10
        fp_ten = FPNumber(0, -22, MIN_MANTISSA).pack()
        x_fp = fp_mul(x_fp, fp_ten)
    
    # Convert result to fixed18
    result = fp_to_fixed18(y_fp)
    
    if verbose:
        y_dec = FPNumber.unpack(y_fp).to_decimal()
        print(f"Final y: {y_dec}")
        print(f"Result (fixed18): {result}")
    
    return result


if __name__ == "__main__":
    print("FP Simulator Test")
    print("=" * 80)
    
    # Test FP operations
    print("\n1. Testing FP_MUL: 2.0 * 3.0")
    fp_two = FPNumber.from_decimal(Decimal('2')).pack()
    fp_three = FPNumber.from_decimal(Decimal('3')).pack()
    result = fp_mul(fp_two, fp_three)
    result_dec = FPNumber.unpack(result).to_decimal()
    print(f"   Result: {result_dec} (expected 6.0)")
    assert abs(result_dec - Decimal('6')) < Decimal('1e-30'), "FP_MUL failed"
    
    print("\n2. Testing FP_DIV: 6.0 / 2.0")
    fp_six = FPNumber.from_decimal(Decimal('6')).pack()
    result = fp_div(fp_six, fp_two)
    result_dec = FPNumber.unpack(result).to_decimal()
    print(f"   Result: {result_dec} (expected 3.0)")
    assert abs(result_dec - Decimal('3')) < Decimal('1e-30'), "FP_DIV failed"
    
    print("\n3. Testing FP_ADD: 2.5 + 3.7")
    fp_2_5 = FPNumber.from_decimal(Decimal('2.5')).pack()
    fp_3_7 = FPNumber.from_decimal(Decimal('3.7')).pack()
    result = fp_add(fp_2_5, fp_3_7)
    result_dec = FPNumber.unpack(result).to_decimal()
    print(f"   Result: {result_dec} (expected 6.2)")
    assert abs(result_dec - Decimal('6.2')) < Decimal('1e-30'), "FP_ADD failed"
    
    print("\n4. Testing FP_SUB: 6.2 - 3.7")
    fp_6_2 = FPNumber.from_decimal(Decimal('6.2')).pack()
    result = fp_sub(fp_6_2, fp_3_7)
    result_dec = FPNumber.unpack(result).to_decimal()
    print(f"   Result: {result_dec} (expected 2.5)")
    assert abs(result_dec - Decimal('2.5')) < Decimal('1e-30'), "FP_SUB failed"
    
    print("\n5. Testing exp simulator on multiple values")
    print("-" * 80)
    
    e_reference = Decimal('2.7182818284590452353602874713526624977572470937')
    
    test_cases = [
        (0, "e^0 = 1"),
        (0.5, "e^0.5"),
        (1, "e^1 = e"),
        (2, "e^2"),
        (0.1, "e^0.1"),
        (3.5, "e^3.5"),
    ]
    
    max_error = Decimal(0)
    
    for x, desc in test_cases:
        x_fixed18 = int(Decimal(str(x)) * Decimal(10 ** 18))
        result_fixed18 = simulate_exp(x_fixed18, verbose=False)
        result_decimal = Decimal(result_fixed18) / Decimal(10 ** 18)
        
        expected = e_reference ** Decimal(str(x))
        expected_18 = Decimal(int(expected * Decimal(10 ** 18))) / Decimal(10 ** 18)
        
        error = abs(result_decimal - expected_18)
        max_error = max(max_error, error)
        
        match = "✓" if error < Decimal('1e-16') else "✗"
        print(f"{match} {desc:<20} result={result_decimal:.18f}, expected={expected_18:.18f}, error={error}")
    
    print("-" * 80)
    print(f"Maximum error: {max_error}")
    print()
    
    if max_error < Decimal('1e-16'):
        print("✓ All FP simulator tests passed!")
    else:
        print("✗ Some tests had significant errors")
        import sys
        sys.exit(1)
