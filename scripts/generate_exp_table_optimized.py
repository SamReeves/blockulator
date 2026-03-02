#!/usr/bin/env python3
"""
Generate optimized exp lookup table for Huff FP implementation
Uses codecopy instead of jump table for efficiency
"""

from decimal import Decimal, getcontext
import sys

getcontext().prec = 50

MIN_MANTISSA = Decimal('10') ** 37
MAX_MANTISSA = Decimal('10') ** 38
EXP_BIAS = 16384


def fp_encode(value):
    """Encode a Decimal value into FP format"""
    if value == 0:
        return (0, 0, 0, "0x0000000000000000000000000000000000000000000000000000000000000000")
    
    if value < 0:
        sign = 1
        value = -value
    else:
        sign = 0
    
    exponent = 0
    mantissa = value
    
    while mantissa >= MAX_MANTISSA:
        mantissa = mantissa / 10
        exponent += 1
    
    while mantissa < MIN_MANTISSA and mantissa != 0:
        mantissa = mantissa * 10
        exponent -= 1
    
    mantissa_int = int(mantissa)
    biased_exp = exponent + EXP_BIAS
    packed = (sign << 255) | (biased_exp << 240) | mantissa_int
    hex_str = f"0x{packed:064x}"
    
    return (sign, exponent, mantissa_int, hex_str)


def generate_exp_table():
    """Generate the exp table using codecopy approach"""
    
    e = Decimal('2.7182818284590452353602874713526624977572470937')
    
    print("/// @title Exponential Function Lookup Table (Optimized)")
    print("/// @notice FP-encoded values for e^(d * 10^(-i))")
    print("/// @dev Generated with 50-digit precision, uses codecopy for efficient access")
    print()
    
    # Generate table as a data section
    print("/// Table data: 19 rows x 10 columns = 190 entries of 32 bytes each")
    print("#define table EXP_TABLE_DATA {")
    
    for i in range(19):
        for d in range(10):
            exponent_decimal = Decimal(d) * Decimal(10) ** (-i)
            value = e ** exponent_decimal
            sign, exp, mantissa, hex_str = fp_encode(value)
            print(f"    {hex_str}")  # Each entry is 32 bytes
    
    print("}")
    print()
    
    print("/// @notice Lookup macro using codecopy")
    print("/// @dev Stack input: [row, digit]")
    print("/// @dev Stack output: [fp_value]")
    print("#define macro EXP_TABLE_LOOKUP() = takes(2) returns(1) {")
    print("    // Input: [i, d]")
    print("    // Output: [EXP_TAB[i][d]]")
    print("    ")
    print("    // Calculate offset: (i * 10 + d) * 32")
    print("    0x0a mul              // [i * 10, d]")
    print("    add                   // [i * 10 + d]")
    print("    0x20 mul              // [index * 32]")
    print("    ")
    print("    // Load from table data using codecopy")
    print("    // codecopy(dest, offset, length)")
    print("    0x20                  // [length=32, offset]")
    print("    swap1                 // [offset, length]")
    print("    __tablesize(EXP_TABLE_DATA) // Get table code offset")
    print("    add                   // [table_start + offset, length]")
    print("    0x00                  // [dest=0, table_start + offset, length]")
    print("    codecopy              // Copy 32 bytes to memory[0]")
    print("    0x00 mload            // [value]")
    print("}")


if __name__ == "__main__":
    generate_exp_table()
