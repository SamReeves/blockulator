#!/usr/bin/env python3
"""
Verify factorial.vy lookup table values with exact integer math
"""

import math

def verify_factorials():
    """Verify factorial table values"""
    print("=" * 80)
    print("VERIFYING FACTORIAL.VY LOOKUP TABLE")
    print("=" * 80)
    print()
    
    # Expected values from factorial.vy
    expected_factorials = [
        1,                      # 0!
        1,                      # 1!
        2,                      # 2!
        6,                      # 3!
        24,                     # 4!
        120,                    # 5!
        720,                    # 6!
        5040,                   # 7!
        40320,                  # 8!
        362880,                 # 9!
        3628800,                # 10!
        39916800,               # 11!
        479001600,              # 12!
        6227020800,             # 13!
        87178291200,            # 14!
        1307674368000,          # 15!
        20922789888000,         # 16!
        355687428096000,        # 17!
        6402373705728000,       # 18!
        121645100408832000,     # 19!
        2432902008176640000     # 20!
    ]
    
    all_pass = True
    errors = []
    
    for n in range(21):
        calculated = math.factorial(n)
        expected = expected_factorials[n]
        
        match = "✓" if calculated == expected else "✗"
        
        if calculated != expected:
            all_pass = False
            errors.append((n, calculated, expected))
            print(f"[{match}] {n}! = {expected} (WRONG, should be {calculated})")
        else:
            print(f"[{match}] {n}! = {calculated:,}")
    
    print()
    print("=" * 80)
    if all_pass:
        print("✅ ALL FACTORIALS VERIFIED - Table is correct!")
    else:
        print(f"❌ ERRORS FOUND - {len(errors)} values need correction")
        for n, calc, exp in errors:
            print(f"  {n}!: change {exp} → {calc}")
    print("=" * 80)
    
    # Show what 21! would be (overflow territory)
    print()
    print("Beyond n=20 (would overflow uint256):")
    print(f"21! = {math.factorial(21):,}")
    print(f"uint256 max = {2**256 - 1:,}")
    print()
    
    return all_pass

def test_usage_examples():
    """Show some practical examples"""
    print("=" * 80)
    print("PRACTICAL EXAMPLES")
    print("=" * 80)
    print()
    
    # Binomial coefficients
    def binomial(n, k):
        return math.factorial(n) // (math.factorial(k) * math.factorial(n - k))
    
    print("Binomial coefficients (using factorials):")
    print(f"  C(10, 3) = {binomial(10, 3)}")
    print(f"  C(20, 10) = {binomial(20, 10):,}")
    print()
    
    # Permutations
    def permutation(n, k):
        return math.factorial(n) // math.factorial(n - k)
    
    print("Permutations:")
    print(f"  P(10, 3) = {permutation(10, 3)}")
    print(f"  P(20, 5) = {permutation(20, 5):,}")
    print()

if __name__ == "__main__":
    verify_factorials()
    test_usage_examples()

