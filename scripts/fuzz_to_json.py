#!/usr/bin/env python3
"""Convert fuzz_data.txt to precision_distribution.json format for the benchmark page."""

import json
import math
from datetime import datetime
from collections import defaultdict

# Library format precision limits
LIB_MAX_DIGITS = {
    'fp127': 38,   # 127.128 fixed-point = ~38 decimal digits
    'abdk': 19,    # 64.64 fixed-point = ~19 decimal digits
    'solady': 18,  # WAD = 18 decimal digits
    'prb': 18,     # WAD = 18 decimal digits (PRBMath UD60x18)
}

def error_to_digits(error_wei, lib):
    """Convert error in wei to matching decimal digits.
    
    The number of matching digits is based on:
    - Error of 0-1 wei = matches the library's max precision (conversion rounding)
    - Error > 1 = 18 - log10(error), capped at library's max
    """
    max_digits = LIB_MAX_DIGITS.get(lib, 18)
    
    # Error of 0-1 wei is essentially perfect (just conversion/rounding)
    if error_wei <= 1:
        return max_digits
    if error_wei < 0:
        return 0
    
    try:
        # digits = 18 - log10(error)
        # Error of 10 wei = 17 digits
        # Error of 1e6 wei = 12 digits
        # Error of 1e18 wei = 0 digits
        digits = 18 - math.log10(error_wei)
        return max(0, min(max_digits, digits))
    except:
        return 0

def parse_fuzz_data(filepath):
    """Parse FUZZ_BENCH lines from fuzz_data.txt
    
    Format: FUZZ_BENCH|op|fp127_gas|fp127_err|prb_gas|prb_err|abdk_gas|abdk_err|solady_gas|solady_err
    """
    data = defaultdict(lambda: defaultdict(list))
    
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line.startswith('FUZZ_BENCH|'):
                continue
            
            parts = line.split('|')
            if len(parts) != 10:
                continue
            
            _, op, fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err = parts
            
            # FP127
            if fp127_gas != 'NA':
                gas = int(fp127_gas)
                err = int(fp127_err)
                digits = error_to_digits(err, 'fp127')
                data['fp127'][op].append({'gas': gas, 'digits': round(digits, 1), 'error_wei': err})
            
            # PRBMath (skip entries with 0 gas - means function wasn't available)
            if prb_gas != 'NA':
                gas = int(prb_gas)
                if gas > 0:  # Filter out non-existent functions
                    err = int(prb_err)
                    digits = error_to_digits(err, 'prb')
                    data['prb'][op].append({'gas': gas, 'digits': round(digits, 1), 'error_wei': err})
            
            # ABDK (skip entries with 0 gas - means function wasn't available)
            if abdk_gas != 'NA':
                gas = int(abdk_gas)
                if gas > 0:  # Filter out non-existent functions
                    err = int(abdk_err)
                    digits = error_to_digits(err, 'abdk')
                    data['abdk'][op].append({'gas': gas, 'digits': round(digits, 1), 'error_wei': err})
            
            # Solady
            if solady_gas != 'NA':
                gas = int(solady_gas)
                if gas > 0:  # Filter out non-existent functions
                    err = int(solady_err)
                    digits = error_to_digits(err, 'solady')
                    data['solady'][op].append({'gas': gas, 'digits': round(digits, 1), 'error_wei': err})
    
    return data

def main():
    import sys
    
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'docs/benchmarks/fuzz_data.txt'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'docs/benchmarks/precision_distribution.json'
    
    print(f"Reading fuzz data from {input_file}...")
    fuzz_data = parse_fuzz_data(input_file)
    
    # Convert to output format (remove error_wei, keep gas and digits)
    output = {
        'generated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'description': 'Fuzz benchmark data - 1000 runs per operation against mpmath oracle',
        'raw': {}
    }
    
    for lib in ['fp127', 'prb', 'abdk', 'solady']:
        output['raw'][lib] = {}
        for op, entries in fuzz_data[lib].items():
            # Remove error_wei from output, just keep gas and digits
            output['raw'][lib][op] = [{'gas': e['gas'], 'digits': e['digits']} for e in entries]
    
    # Print summary
    print("\nData summary:")
    for lib in ['fp127', 'prb', 'abdk', 'solady']:
        print(f"\n{lib}:")
        for op in sorted(fuzz_data[lib].keys()):
            entries = fuzz_data[lib][op]
            if entries:
                avg_gas = sum(e['gas'] for e in entries) / len(entries)
                avg_digits = sum(e['digits'] for e in entries) / len(entries)
                print(f"  {op}: {len(entries)} samples, avg gas={avg_gas:.0f}, avg digits={avg_digits:.1f}")
    
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print("Done!")

if __name__ == '__main__':
    main()
