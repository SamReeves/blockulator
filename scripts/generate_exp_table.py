#!/usr/bin/env python3
"""
Generate exp lookup table for Huff scaled-integer implementation.

Produces a code table (raw bytecode data) containing 190 entries (19 rows x 10 digits)
of e^(d * 10^(-i)) as scaled integers with SCALE = 10^36.

Lookup is arithmetic: offset = (i * 10 + d) * 32, then codecopy 32 bytes.
"""

from decimal import Decimal, getcontext
import sys

getcontext().prec = 50

# Scaled integer with 36 decimal places (18 digits of output + 18 guard digits)
SCALE = Decimal('10') ** 36


def encode_scaled(value):
    """
    Encode a Decimal value as a scaled integer (value * 10^36).
    Returns (scaled_int, hex_str).
    """
    if value == 0:
        return (0, "0" * 64)
    
    scaled_int = int(value * SCALE)
    hex_str = f"{scaled_int:064x}"
    return (scaled_int, hex_str)


def generate():
    e = Decimal('2.7182818284590452353602874713526624977572470937')

    print("/// @title Exponential Function Lookup Table")
    print("/// @notice 19x10 table of e^(d * 10^(-i)) stored as a code table")
    print("/// @dev Scaled integer with SCALE = 10^36 (36-digit precision)")
    print("///      Total size: 190 entries * 32 bytes = 6080 bytes")
    print()

    # Emit raw data table: each entry is exactly 32 bytes (64 hex chars)
    print("#define table EXP_TABLE_DATA {")
    for i in range(19):
        for d in range(10):
            exp_dec = Decimal(d) * Decimal(10) ** (-i)
            val = e ** exp_dec
            scaled_int, hex_str = encode_scaled(val)
            print(f"    0x{hex_str}")
    print("}")
    print()

    # Emit the lookup macro
    # Memory slot 0xc0 is used as scratch space
    print("/// @notice Load EXP_TABLE_DATA[i][d] via codecopy")
    print("/// @dev takes(2) returns(1)")
    print("/// Stack input: [i, d]   (i = row 0-18, d = digit 0-9)")
    print("/// Stack output: [scaled_value]  (value * 10^36)")
    print("/// Uses memory at 0xc0 as scratch")
    print("#define macro EXP_TABLE_LOOKUP() = takes(2) returns(1) {")
    print("    // offset = (i * 10 + d) * 32")
    print("    swap1                       // [d, i]")
    print("    swap1 0x0a mul              // [i*10, d]")
    print("    add                         // [i*10 + d]")
    print("    0x20 mul                    // [byte_offset]")
    print()
    print("    // codecopy(destOffset, offset, size)")
    print("    0x20                        // [size=32, byte_offset]")
    print("    swap1                       // [byte_offset, size]")
    print("    __tablestart(EXP_TABLE_DATA)")
    print("    add                         // [code_offset, size]")
    print("    0xc0                        // [dest=0xc0, code_offset, size]")
    print("    codecopy                    // []")
    print("    0xc0 mload                  // [scaled_value]")
    print("}")

    # Verification on stderr
    print("\n/// Verification:", file=sys.stderr)
    tests = [
        (0, 0, "e^0 = 1"),
        (0, 1, "e^1 = e"),
        (0, 2, "e^2"),
        (1, 1, "e^0.1"),
        (1, 5, "e^0.5"),
        (18, 9, "e^(9e-18) ~ 1"),
    ]
    for i, d, desc in tests:
        exp_dec = Decimal(d) * Decimal(10) ** (-i)
        val = e ** exp_dec
        scaled_int, hex_str = encode_scaled(val)
        print(f"  {desc}: scaled={scaled_int} hex=0x{hex_str}", file=sys.stderr)


if __name__ == "__main__":
    generate()
