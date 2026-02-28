#!/usr/bin/env python3
"""
Verify exp.vy lookup table values with 50-place precision
"""

from decimal import Decimal, getcontext

# Set precision to 50 decimal places
getcontext().prec = 50

def format_decimal(d):
    """Format decimal to 10 places like Vyper"""
    return f"{d:.10f}"

def generate_exp_table():
    """Generate e^(d * 10^(-i)) table for exp.vy"""
    print("=" * 80)
    print("VERIFYING EXP.VY LOOKUP TABLE")
    print("=" * 80)
    print()
    
    # Expected table from exp.vy
    expected_table = [
        [1.0000000000, 2.7182818285, 7.3890560989, 20.0855369232, 54.5981500331, 148.4131591026, 403.4287934927, 1096.6331584285, 2980.9579870417, 8103.0839275754],
        [1.0000000000, 1.1051709181, 1.2214027582, 1.3498588076, 1.4918246976, 1.6487212707, 1.8221188004, 2.0137527075, 2.2255409285, 2.4596031112],
        [1.0000000000, 1.0100501671, 1.0202013400, 1.0304545340, 1.0408107742, 1.0512710964, 1.0618365465, 1.0725081813, 1.0832870677, 1.0941742837],
        [1.0000000000, 1.0010005002, 1.0020020013, 1.0030045045, 1.0040080107, 1.0050125209, 1.0060180361, 1.0070245573, 1.0080320855, 1.0090406218],
        [1.0000000000, 1.0001000050, 1.0002000200, 1.0003000450, 1.0004000800, 1.0005001250, 1.0006001800, 1.0007002451, 1.0008003201, 1.0009004051],
        [1.0000000000, 1.0000100001, 1.0000200002, 1.0000300005, 1.0000400008, 1.0000500013, 1.0000600018, 1.0000700025, 1.0000800032, 1.0000900041],
        [1.0000000000, 1.0000010000, 1.0000020000, 1.0000030000, 1.0000040000, 1.0000050000, 1.0000060000, 1.0000070000, 1.0000080000, 1.0000090000],
        [1.0000000000, 1.0000001000, 1.0000002000, 1.0000003000, 1.0000004000, 1.0000005000, 1.0000006000, 1.0000007000, 1.0000008000, 1.0000009000],
        [1.0000000000, 1.0000000100, 1.0000000200, 1.0000000300, 1.0000000400, 1.0000000500, 1.0000000600, 1.0000000700, 1.0000000800, 1.0000000900],
        [1.0000000000, 1.0000000010, 1.0000000020, 1.0000000030, 1.0000000040, 1.0000000050, 1.0000000060, 1.0000000070, 1.0000000080, 1.0000000090],
        [1.0000000000, 1.0000000001, 1.0000000002, 1.0000000003, 1.0000000004, 1.0000000005, 1.0000000006, 1.0000000007, 1.0000000008, 1.0000000009]
    ]
    
    e = Decimal('2.7182818284590452353602874713526624977572470937')
    
    all_pass = True
    total_errors = []
    
    for i in range(11):
        print(f"Row {i} (e^(d * 10^(-{i}))):")
        row_errors = []
        for d in range(10):
            # Calculate e^(d * 10^(-i))
            exponent = Decimal(d) * Decimal(10) ** (-i)
            calculated = e ** exponent
            
            expected = Decimal(str(expected_table[i][d]))
            error = abs(calculated - expected)
            
            # Format for display
            calc_str = format_decimal(calculated)
            exp_str = format_decimal(expected)
            
            match = "✓" if calc_str == exp_str else "✗"
            
            if calc_str != exp_str:
                all_pass = False
                row_errors.append((d, calc_str, exp_str, error))
                print(f"  [{match}] d={d}: calculated={calc_str}, expected={exp_str}, error={error}")
            else:
                print(f"  [{match}] d={d}: {calc_str}")
        
        if row_errors:
            total_errors.extend(row_errors)
        print()
    
    print("=" * 80)
    if all_pass:
        print("✅ ALL VALUES VERIFIED - Table is correct!")
    else:
        print(f"❌ ERRORS FOUND - {len(total_errors)} values need correction")
        print("\nValues that need updating:")
        for d, calc, exp, err in total_errors:
            print(f"  Position {d}: change {exp} → {calc} (error: {err})")
    print("=" * 80)
    
    return all_pass

def test_exp_function():
    """Test the exp function with known values"""
    print("\n" + "=" * 80)
    print("TESTING EXP FUNCTION")
    print("=" * 80)
    print()
    
    e = Decimal('2.7182818284590452353602874713526624977572470937')
    
    test_cases = [
        (Decimal('0'), Decimal('1')),
        (Decimal('1'), e),
        (Decimal('2'), e ** 2),
        (Decimal('0.5'), e ** Decimal('0.5')),
        (Decimal('3.14159'), e ** Decimal('3.14159')),
    ]
    
    for x, expected in test_cases:
        print(f"e^{x} = {format_decimal(expected)}")
        print(f"  Expected: {expected}")
        print()

if __name__ == "__main__":
    generate_exp_table()
    test_exp_function()

