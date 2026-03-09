#!/usr/bin/env python3
"""
Precision Sweep Post-Processor

Parses SWEEP output from PrecisionSweep.t.sol and computes distribution statistics.

Usage:
    forge test --match-contract PrecisionSweep -vv | python3 scripts/generators/precision_sweep.py --json
    python3 scripts/generators/precision_sweep.py < sweep_output.txt
    forge test --match-contract PrecisionSweep -vv | python3 scripts/generators/precision_sweep.py --plot
"""

import sys
import json
from collections import defaultdict
from datetime import datetime
import numpy as np

def parse_sweep_lines(input_stream):
    """Parse SWEEP lines from forge test output."""
    samples = []
    for line in input_stream:
        line = line.strip()
        if not line.startswith("SWEEP|"):
            continue
        
        parts = line.split("|")
        if len(parts) != 8:
            continue
        
        _, lib, func, a_wad, b_wad, gas, digits, error_bits = parts
        
        samples.append({
            "lib": lib,
            "func": func,
            "a_wad": int(a_wad),
            "b_wad": int(b_wad) if b_wad != "0" else 0,
            "gas": int(gas),
            "digits": int(digits),
            "error_bits": int(error_bits)
        })
    
    return samples


def compute_percentiles(values):
    """Compute percentile statistics."""
    if not values:
        return {
            "min": 0, "p5": 0, "p25": 0, "median": 0,
            "p75": 0, "p95": 0, "max": 0, "mean": 0
        }
    
    arr = np.array(values)
    return {
        "min": float(np.min(arr)),
        "p5": float(np.percentile(arr, 5)),
        "p25": float(np.percentile(arr, 25)),
        "median": float(np.percentile(arr, 50)),
        "p75": float(np.percentile(arr, 75)),
        "p95": float(np.percentile(arr, 95)),
        "max": float(np.max(arr)),
        "mean": float(np.mean(arr))
    }


def analyze_samples(samples):
    """Group samples by library and function, compute stats and raw data."""
    
    # Group by lib and func
    groups = defaultdict(lambda: defaultdict(list))
    
    for sample in samples:
        lib = sample["lib"]
        func = sample["func"]
        groups[lib][func].append(sample)
    
    # Compute stats for each group
    stats = {}
    raw = {}
    
    for lib in groups:
        stats[lib] = {}
        raw[lib] = {}
        for func in groups[lib]:
            samples_list = groups[lib][func]
            
            gas_values = [s["gas"] for s in samples_list]
            digit_values = [s["digits"] for s in samples_list]
            error_bit_values = [s["error_bits"] for s in samples_list]
            
            stats[lib][func] = {
                "count": len(samples_list),
                "gas": compute_percentiles(gas_values),
                "digits": compute_percentiles(digit_values),
                "error_bits": compute_percentiles(error_bit_values)
            }
            
            # Store raw data points for box-whisker plots
            raw[lib][func] = [
                {
                    "gas": s["gas"],
                    "digits": s["digits"]
                }
                for s in samples_list
            ]
    
    return stats, raw


def print_summary_table(stats):
    """Print a summary table of distribution statistics."""
    print("\n" + "=" * 100, file=sys.stderr)
    print("PRECISION DISTRIBUTION SUMMARY", file=sys.stderr)
    print("=" * 100, file=sys.stderr)
    
    # Auto-discover functions from stats instead of hardcoding
    all_functions = set()
    for lib in stats.values():
        all_functions.update(lib.keys())
    functions = sorted(all_functions)
    libraries = sorted(stats.keys())
    
    for func in functions:
        print(f"\n{func.upper()}", file=sys.stderr)
        print("-" * 100, file=sys.stderr)
        
        # Header
        print(f"{'Library':<10} {'Count':<7} {'Gas (median)':<15} {'Digits (min/median/max)':<30} {'Error Bits (min/median/max)':<30}", file=sys.stderr)
        print("-" * 100, file=sys.stderr)
        
        for lib in libraries:
            if func not in stats[lib]:
                continue
            
            s = stats[lib][func]
            
            gas_str = f"{s['gas']['median']:.0f}"
            digits_str = f"{s['digits']['min']:.1f} / {s['digits']['median']:.1f} / {s['digits']['max']:.1f}"
            error_bits_str = f"{s['error_bits']['min']:.0f} / {s['error_bits']['median']:.0f} / {s['error_bits']['max']:.0f}"
            
            print(f"{lib:<10} {s['count']:<7} {gas_str:<15} {digits_str:<30} {error_bits_str:<30}", file=sys.stderr)
    
    print("\n" + "=" * 100, file=sys.stderr)


def print_detailed_percentiles(stats):
    """Print detailed percentile breakdown."""
    print("\n" + "=" * 100, file=sys.stderr)
    print("DETAILED PERCENTILE STATISTICS (Matching Digits)", file=sys.stderr)
    print("=" * 100, file=sys.stderr)
    
    # Auto-discover functions from stats instead of hardcoding
    all_functions = set()
    for lib in stats.values():
        all_functions.update(lib.keys())
    functions = sorted(all_functions)
    libraries = sorted(stats.keys())
    
    for func in functions:
        print(f"\n{func.upper()}", file=sys.stderr)
        print("-" * 100, file=sys.stderr)
        print(f"{'Library':<10} {'Count':<7} {'Min':<8} {'P5':<8} {'P25':<8} {'Median':<8} {'P75':<8} {'P95':<8} {'Max':<8} {'Mean':<8}", file=sys.stderr)
        print("-" * 100, file=sys.stderr)
        
        for lib in libraries:
            if func not in stats[lib]:
                continue
            
            s = stats[lib][func]
            d = s['digits']
            
            print(f"{lib:<10} {s['count']:<7} {d['min']:<8.1f} {d['p5']:<8.1f} {d['p25']:<8.1f} {d['median']:<8.1f} {d['p75']:<8.1f} {d['p95']:<8.1f} {d['max']:<8.1f} {d['mean']:<8.1f}", file=sys.stderr)


def export_to_json(stats, raw, output_path="docs/benchmarks/precision_distribution.json"):
    """Export raw data points to JSON. Stats are computed by frontend."""
    data = {
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "description": "Raw benchmark data points - all stats computed by frontend",
        "raw": raw
    }
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nExported raw data to: {output_path}", file=sys.stderr)


def plot_distributions(samples, stats):
    """Generate distribution plots (requires matplotlib)."""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not available, skipping plots", file=sys.stderr)
        return
    
    # Auto-discover functions from stats instead of hardcoding
    all_functions = set()
    for lib in stats.values():
        all_functions.update(lib.keys())
    functions = sorted(all_functions)
    libraries = sorted(stats.keys())
    colors = {"fp128": "#2196F3", "abdk": "#FF9800", "solady": "#9C27B0", "prb": "#4CAF50"}
    
    # Group samples by lib and func
    grouped = defaultdict(lambda: defaultdict(list))
    for s in samples:
        grouped[s["lib"]][s["func"]].append(s)
    
    # Create plots
    fig, axes = plt.subplots(len(functions), 2, figsize=(16, 4 * len(functions)))
    
    for i, func in enumerate(functions):
        # Digits distribution (histogram)
        ax_digits = axes[i][0]
        for lib in libraries:
            if func in grouped[lib]:
                digits = [s["digits"] for s in grouped[lib][func]]
                ax_digits.hist(digits, bins=20, alpha=0.5, label=lib, color=colors.get(lib, "#999"))
        
        ax_digits.set_xlabel("Matching Digits")
        ax_digits.set_ylabel("Count")
        ax_digits.set_title(f"{func.upper()} - Precision Distribution")
        ax_digits.legend()
        ax_digits.grid(alpha=0.3)
        
        # Precision vs input scatter
        ax_scatter = axes[i][1]
        for lib in libraries:
            if func in grouped[lib]:
                samples_list = grouped[lib][func]
                inputs = [s["a_wad"] / 1e18 for s in samples_list]
                digits = [s["digits"] for s in samples_list]
                ax_scatter.scatter(inputs, digits, alpha=0.5, s=10, label=lib, color=colors.get(lib, "#999"))
        
        ax_scatter.set_xlabel("Input (WAD)")
        ax_scatter.set_ylabel("Matching Digits")
        ax_scatter.set_title(f"{func.upper()} - Precision vs Input")
        ax_scatter.set_xscale('log')
        ax_scatter.legend()
        ax_scatter.grid(alpha=0.3)
    
    plt.tight_layout()
    plt.savefig("docs/benchmarks/precision_distribution.png", dpi=150, bbox_inches='tight')
    print("Saved plot: docs/benchmarks/precision_distribution.png", file=sys.stderr)


def merge_into_benchmark_data(stats, benchmark_path="docs/benchmarks/benchmark-data.json"):
    """Merge sweep distribution stats into benchmark-data.json for the site."""
    try:
        with open(benchmark_path) as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Warning: {benchmark_path} not found, skipping merge", file=sys.stderr)
        return
    
    for lib, funcs in stats.items():
        if lib not in data.get("libraries", {}):
            continue
        if "distribution" not in data["libraries"][lib]:
            data["libraries"][lib]["distribution"] = {}
        for func, s in funcs.items():
            d = s.get("digits", {})
            data["libraries"][lib]["distribution"][func] = {
                "min": int(round(d.get("min", 0))),
                "p5": int(round(d.get("p5", 0))),
                "median": int(round(d.get("median", 0))),
                "p95": int(round(d.get("p95", 0))),
                "max": int(round(d.get("max", 0))),
            }
    
    with open(benchmark_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Merged distribution into {benchmark_path}", file=sys.stderr)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Precision sweep post-processor")
    parser.add_argument("--plot", action="store_true", help="Generate distribution plots")
    parser.add_argument("--json", action="store_true", help="Export to JSON")
    parser.add_argument("--merge", action="store_true", help="Merge into benchmark-data.json for site")
    args = parser.parse_args()
    
    print("Parsing SWEEP output...", file=sys.stderr)
    samples = parse_sweep_lines(sys.stdin)
    
    if not samples:
        print("No SWEEP lines found in input", file=sys.stderr)
        sys.exit(1)
    
    print(f"Parsed {len(samples)} samples", file=sys.stderr)
    
    print("\nAnalyzing distributions...", file=sys.stderr)
    stats, raw = analyze_samples(samples)
    
    print_summary_table(stats)
    print_detailed_percentiles(stats)
    
    if args.json:
        export_to_json(stats, raw)
    
    if args.plot:
        plot_distributions(samples, stats)
    
    if args.merge:
        merge_into_benchmark_data(stats)


if __name__ == "__main__":
    main()
