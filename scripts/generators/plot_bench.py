#!/usr/bin/env python3
"""Parse ArithBench output and generate precision vs gas plots.

Usage:
    python3 scripts/plot_bench.py          # runs forge automatically
    forge test ... -vv | python3 scripts/plot_bench.py --stdin
    python3 scripts/plot_bench.py --json   # also generate JSON
"""
import subprocess
import sys
import math
import json
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

LIBS = ["fp128", "abdk", "solady"]
# Colorblind-friendly palette
COLORS = {"fp128": "#2196F3", "abdk": "#FF9800", "solady": "#9C27B0"}
LABELS = {"fp128": "FP128 (Huff 128.128)", "abdk": "ABDK (64.64)", "solady": "Solady (WAD)"}
MARKERS = {"fp128": "o", "abdk": "^", "solady": "v"}


def run_benchmark():
    # Try NativePrecisionBench first (new format), fall back to ArithBench (old format)
    r = subprocess.run(
        ["forge", "test", "--match-contract", "NativePrecisionBench", "-vv"],
        capture_output=True, text=True, cwd="."
    )
    output = r.stdout + r.stderr
    
    # If no native bench output, try old ArithBench
    if "NATIVE_BENCH|" not in output:
        r = subprocess.run(
            ["forge", "test", "--match-contract", "ArithBench", "-vv"],
            capture_output=True, text=True, cwd="."
        )
        output = r.stdout + r.stderr
    
    return output


def parse(output):
    """Parse BENCH| lines (old format with raw error).
    Format: BENCH|name|op|expected|fp128_gas|fp128_err|abdk_gas|abdk_err|solady_gas|solady_err
    """
    cases = []
    for line in output.split("\n"):
        line = line.strip()
        if not line.startswith("BENCH|") or line in ("BENCH_START", "BENCH_END"):
            continue
        parts = line.split("|")
        if len(parts) != 10:
            continue
        _, name, op, expected, *vals = parts
        entry = {"name": name, "op": op, "expected": int(expected)}
        lib_fields = [("fp128", 0, 1), ("abdk", 2, 3), ("solady", 4, 5)]
        for lib, gi, ei in lib_fields:
            g, e = vals[gi], vals[ei]
            if g == "NA":
                entry[f"{lib}_gas"] = None
                entry[f"{lib}_err"] = None
            else:
                entry[f"{lib}_gas"] = int(g)
                entry[f"{lib}_err"] = int(e)
        cases.append(entry)
    return cases


def parse_native(output):
    """Parse NATIVE_BENCH| lines (new format with matching digits).
    Format: NATIVE_BENCH|name|op_or_func|expected_wad|fp128_gas|fp128_digits|abdk_gas|abdk_digits|solady_gas|solady_digits
    """
    cases = []
    trans_cases = []
    for line in output.split("\n"):
        line = line.strip()
        if not line.startswith("NATIVE_BENCH|") or line in ("NATIVE_BENCH_START", "NATIVE_BENCH_END"):
            continue
        parts = line.split("|")
        if len(parts) != 10:
            continue
        _, name, op_or_func, expected, *vals = parts
        
        # Determine if this is transcendental or arithmetic
        is_trans = op_or_func in ['exp', 'exp2', 'ln', 'log2', 'sqrt', 'pow']
        entry = {"name": name, "func" if is_trans else "op": op_or_func, "expected": int(expected)}
        
        lib_fields = [("fp128", 0, 1), ("abdk", 2, 3), ("solady", 4, 5)]
        for lib, gi, di in lib_fields:
            g, d = vals[gi], vals[di]
            if g == "NA":
                entry[f"{lib}_gas"] = None
                entry[f"{lib}_digits"] = None
            else:
                entry[f"{lib}_gas"] = int(g)
                entry[f"{lib}_digits"] = int(d)
        
        if is_trans:
            trans_cases.append(entry)
        else:
            cases.append(entry)
    return cases, trans_cases

def parse_trans(output):
    """Parse TRANS| lines.
    Format: TRANS|name|func|expected|fp128_gas|fp128_err|abdk_gas|abdk_err|solady_gas|solady_err
    """
    cases = []
    for line in output.split("\n"):
        line = line.strip()
        if not line.startswith("TRANS|") or line in ("TRANS_START", "TRANS_END"):
            continue
        parts = line.split("|")
        if len(parts) != 10:
            continue
        _, name, func, expected, *vals = parts
        entry = {"name": name, "func": func, "expected": int(expected)}
        lib_fields = [("fp128", 0, 1), ("abdk", 2, 3), ("solady", 4, 5)]
        for lib, gi, ei in lib_fields:
            g, e = vals[gi], vals[ei]
            if g == "NA":
                entry[f"{lib}_gas"] = None
                entry[f"{lib}_err"] = None
            else:
                entry[f"{lib}_gas"] = int(g)
                entry[f"{lib}_err"] = int(e)
        cases.append(entry)
    return cases


def avg(lst):
    return sum(lst) / len(lst) if lst else float('nan')

def generate_markdown_summary(cases, trans_cases, output_path="docs/benchmarks/RESULTS.md"):
    """Generate a comprehensive markdown summary of benchmark results."""
    lines = []
    lines.append("# Benchmark Results")
    lines.append("")
    lines.append("Comprehensive gas and precision benchmark comparing 4 fixed-point arithmetic backends.")
    lines.append("")
    
    # Detect format
    use_digits = cases and f"{LIBS[0]}_digits" in cases[0]
    metric_key = "digits" if use_digits else "err"
    metric_label = "Matching Digits" if use_digits else "Error (wei)"
    
    # ── Arithmetic Summary ──
    lines.append("## Arithmetic Operations")
    lines.append("")
    lines.append(f"**Test cases:** {len(cases)} (mul, div, add, sub)")
    lines.append("")
    
    ops = ["mul", "div", "add", "sub"]
    op_data = {op: {lib: {"gas": [], metric_key: []} for lib in LIBS} for op in ops}
    
    for c in cases:
        op = c["op"]
        for lib in LIBS:
            g = c[f"{lib}_gas"]
            m = c.get(f"{lib}_{metric_key}")
            if g is not None and m is not None:
                op_data[op][lib]["gas"].append(g)
                op_data[op][lib][metric_key].append(m)
    
    lines.append("### Average Gas per Operation")
    lines.append("")
    lines.append("| Operation | FP128 | ABDK | Solady |")
    lines.append("|-----------|-------|------|--------|")
    
    for op in ops:
        row = f"| {op.upper():<9} |"
        for lib in LIBS:
            g = avg(op_data[op][lib]["gas"])
            row += f" {g:>5.0f} |" if not math.isnan(g) else " N/A |"
        lines.append(row)
    
    lines.append("")
    lines.append(f"### Average {metric_label} per Operation")
    lines.append("")
    lines.append("| Operation | FP128 | ABDK | Solady |")
    lines.append("|-----------|-------|------|--------|")
    
    for op in ops:
        row = f"| {op.upper():<9} |"
        for lib in LIBS:
            m = avg(op_data[op][lib][metric_key])
            if not math.isnan(m):
                if use_digits or m < 1:
                    row += f" {m:.1f} |"
                else:
                    row += f" {m:>5.1f} |"
            else:
                row += " N/A |"
        lines.append(row)
    
    # ── Transcendental Summary ──
    if trans_cases:
        lines.append("")
        lines.append("## Transcendental Functions")
        lines.append("")
        lines.append(f"**Test cases:** {len(trans_cases)} (exp, ln, sqrt, pow)")
        lines.append("")
        lines.append("_Only FP128, ABDK, and Solady support transcendental functions._")
        lines.append("")
        
        funcs = ["exp", "exp2", "ln", "log2", "sqrt", "pow"]
        trans_libs = ["fp128", "abdk", "solady"]
        trans_metric_key = "digits" if (trans_cases and f"{trans_libs[0]}_digits" in trans_cases[0]) else "err"
        func_data = {f: {lib: {"gas": [], trans_metric_key: []} for lib in trans_libs} for f in funcs}
        
        for c in trans_cases:
            func = c["func"]
            for lib in trans_libs:
                g = c[f"{lib}_gas"]
                m = c.get(f"{lib}_{trans_metric_key}")
                if g is not None and m is not None:
                    func_data[func][lib]["gas"].append(g)
                    func_data[func][lib][trans_metric_key].append(m)
        
        lines.append("### Average Gas per Function")
        lines.append("")
        lines.append("| Function | FP128 | ABDK | Solady |")
        lines.append("|----------|-------|------|--------|")
        
        for func in funcs:
            row = f"| {func:<8} |"
            for lib in trans_libs:
                g = avg(func_data[func][lib]["gas"])
                row += f" {g:>7.0f} |" if not math.isnan(g) else " N/A |"
            lines.append(row)
        
        lines.append("")
        trans_metric_label = "Matching Digits" if trans_metric_key == "digits" else "Error (wei)"
        lines.append(f"### Average {trans_metric_label} per Function")
        lines.append("")
        lines.append("| Function | FP128 | ABDK | Solady |")
        lines.append("|----------|-------|------|--------|")
        
        for func in funcs:
            row = f"| {func:<8} |"
            for lib in trans_libs:
                m = avg(func_data[func][lib][trans_metric_key])
                if not math.isnan(m):
                    if trans_metric_key == "digits" or m < 1:
                        row += f" {m:.1f} |"
                    else:
                        row += f" {m:>7.1f} |"
                else:
                    row += " N/A |"
            lines.append(row)
    
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("**Note:** Error values are in wei (1e-18). All reference values computed at 100-digit precision using mpmath.")
    lines.append("")
    
    # Write to file
    with open(output_path, 'w') as f:
        f.write('\n'.join(lines))
    
    return output_path


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--stdin":
        output = sys.stdin.read()
    else:
        print("Running forge benchmark...")
        output = run_benchmark()

    # Try to parse native format first (with digits), fall back to old format (with raw error)
    cases, trans_cases = parse_native(output)
    if not cases:
        cases = parse(output)
        trans_cases = parse_trans(output)
    
    if not cases and not trans_cases:
        print("No BENCH, NATIVE_BENCH, or TRANS lines found.")
        sys.exit(1)

    # Determine format type
    use_digits = cases and f"{LIBS[0]}_digits" in cases[0]
    print(f"Parsed {len(cases)} arithmetic cases, {len(trans_cases)} transcendental cases")
    print(f"Format: {'matching digits' if use_digits else 'raw error (wei)'}\n")

    # ─── Table ─────────────────────────────────────────────────────────
    hdr = f"{'Case':<25} {'Op':<4}"
    metric_label = "digits" if use_digits else "err"
    for lib in LIBS:
        hdr += f"  {lib:>8} {metric_label:>10}"
    print(hdr)
    print("-" * len(hdr))

    for c in cases:
        row = f"{c['name']:<25} {c['op']:<4}"
        for lib in LIBS:
            g = c[f"{lib}_gas"]
            metric_key = f"{lib}_digits" if use_digits else f"{lib}_err"
            m = c.get(metric_key)
            if g is None:
                row += f"  {'N/A':>8} {'N/A':>10}"
            else:
                row += f"  {g:>8} {m:>10}"
        print(row)

    # ─── Summary by operation ──────────────────────────────────────────
    ops = ["mul", "div", "add", "sub"]
    metric_key = "digits" if use_digits else "err"
    op_data = {op: {lib: {"gas": [], metric_key: []} for lib in LIBS} for op in ops}

    for c in cases:
        op = c["op"]
        for lib in LIBS:
            g = c[f"{lib}_gas"]
            m = c.get(f"{lib}_{metric_key}")
            if g is not None:
                op_data[op][lib]["gas"].append(g)
                op_data[op][lib][metric_key].append(m)

    print("\n" + "=" * 100)
    print("SUMMARY BY OPERATION (averages)")
    print("=" * 100)
    hdr2 = f"{'Op':<6}"
    for lib in LIBS:
        hdr2 += f"  {lib+' gas':>12} {lib+' '+metric_key:>12}"
    print(hdr2)
    print("-" * len(hdr2))

    for op in ops:
        row = f"{op:<6}"
        for lib in LIBS:
            d = op_data[op][lib]
            g = avg(d["gas"])
            m = avg(d[metric_key])
            gs = f"{g:>12.0f}" if not math.isnan(g) else f"{'N/A':>12}"
            ms = f"{m:>12.1f}" if not math.isnan(m) else f"{'N/A':>12}"
            row += f"  {gs} {ms}"
        print(row)

    # ─── Plot 1: Gas by operation (grouped bar) ───────────────────────
    fig, axes = plt.subplots(1, 2, figsize=(18, 7))
    ax = axes[0]
    x_labels = [op for op in ops if op_data[op]["fp128"]["gas"]]
    x = list(range(len(x_labels)))
    n_libs = len(LIBS)
    width = 0.8 / n_libs

    for j, lib in enumerate(LIBS):
        means = [avg(op_data[op][lib]["gas"]) if op_data[op][lib]["gas"] else 0 for op in x_labels]
        offset = (j - n_libs / 2 + 0.5) * width
        bars = ax.bar([xi + offset for xi in x], means, width,
                      label=LABELS[lib], color=COLORS[lib], edgecolor='white')
        for bar in bars:
            h = bar.get_height()
            if h > 0:
                ax.annotate(f'{h:.0f}', xy=(bar.get_x() + bar.get_width()/2, h),
                           xytext=(0, 3), textcoords="offset points",
                           ha='center', va='bottom', fontsize=7)

    ax.set_xlabel('Operation', fontsize=12)
    ax.set_ylabel('Gas (avg)', fontsize=12)
    ax.set_title('Gas Cost by Operation\n(Huff = external call; ABDK & Solady = inline)', fontsize=12, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(x_labels, fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='y', alpha=0.3)

    # ─── Plot 1b: Precision by operation ──────────────────────────────────
    ax = axes[1]
    for j, lib in enumerate(LIBS):
        if metric_key == "digits":
            means = [max(avg(op_data[op][lib]["digits"]), 1) if op_data[op][lib]["digits"] else 1
                     for op in x_labels]
        else:
            means = [min(max(avg(op_data[op][lib]["err"]), 0.01), 1e18) if op_data[op][lib]["err"] else 0.01
                     for op in x_labels]
        offset = (j - n_libs / 2 + 0.5) * width
        ax.bar([xi + offset for xi in x], means, width,
               label=LABELS[lib], color=COLORS[lib], edgecolor='white')

    ax.set_xlabel('Operation', fontsize=12)
    if metric_key == "digits":
        ax.set_ylabel('Matching Decimal Digits', fontsize=12)
        ax.set_title('Precision by Operation (higher = better)\nNative bit depth comparison', fontsize=12, fontweight='bold')
    else:
        ax.set_ylabel('Avg Error (wei, log scale)', fontsize=12)
        ax.set_title('Precision by Operation (lower = better)\n1 wei = 1e-18', fontsize=12, fontweight='bold')
        ax.set_yscale('log')
    ax.set_xticks(x)
    ax.set_xticklabels(x_labels, fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig('docs/benchmarks/bench_gas_precision.png', dpi=150, bbox_inches='tight')
    print(f"\nSaved: docs/benchmarks/bench_gas_precision.png")

    # ─── Plot 2: Scatter — Gas vs Precision ──────────────────────────────
    fig, ax = plt.subplots(figsize=(13, 8))

    for lib in LIBS:
        if metric_key == "digits":
            pts = [(c[f"{lib}_gas"], max(c.get(f"{lib}_digits", 1), 1))
                   for c in cases if c[f"{lib}_gas"] is not None]
        else:
            pts = [(c[f"{lib}_gas"], min(max(c.get(f"{lib}_err", 0.1), 0.1), 1e18))
                   for c in cases if c[f"{lib}_gas"] is not None]
        if pts:
            ax.scatter([p[0] for p in pts], [p[1] for p in pts],
                       s=70, alpha=0.7, label=LABELS[lib], color=COLORS[lib],
                       marker=MARKERS[lib], edgecolors='black', linewidths=0.4)

    ax.set_xlabel('Gas Cost', fontsize=12)
    if metric_key == "digits":
        ax.set_ylabel('Matching Decimal Digits', fontsize=12)
        ax.set_title(f'Gas vs Precision ({len(cases)} cases, 4 backends)\nNative bit depth comparison', fontsize=13, fontweight='bold')
    else:
        ax.set_ylabel('Error (wei, log scale)', fontsize=12)
        ax.set_title(f'Gas vs Precision ({len(cases)} cases, 4 backends)\n1 wei = 1e-18', fontsize=13, fontweight='bold')
        ax.set_yscale('log')
    ax.legend(fontsize=10, loc='upper right')
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('docs/benchmarks/bench_scatter.png', dpi=150, bbox_inches='tight')
    print(f"Saved: docs/benchmarks/bench_scatter.png")

    # ─── Plot 3: Per-case breakdown ──────────────────────────────────
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(18, 16))
    names = [c["name"] for c in cases]
    y = list(range(len(names)))
    n = len(LIBS)
    bw = 0.8 / n

    for j, lib in enumerate(LIBS):
        offset = (j - n / 2 + 0.5) * bw
        vals = [c[f"{lib}_gas"] if c[f"{lib}_gas"] else 0 for c in cases]
        ax1.barh([yi + offset for yi in y], vals, bw,
                 label=LABELS[lib], color=COLORS[lib])
    ax1.set_yticks(y)
    ax1.set_yticklabels(names, fontsize=7)
    ax1.set_xlabel('Gas', fontsize=11)
    ax1.set_title('Gas Cost Per Case', fontsize=12, fontweight='bold')
    ax1.legend(fontsize=8, loc='lower right')
    ax1.grid(axis='x', alpha=0.3)
    ax1.invert_yaxis()

    for j, lib in enumerate(LIBS):
        offset = (j - n / 2 + 0.5) * bw
        if metric_key == "digits":
            vals = [max(c.get(f"{lib}_digits", 1), 1) if c[f"{lib}_gas"] else 1 for c in cases]
        else:
            ERR_CAP = 1e18
            vals = [min(max(c.get(f"{lib}_err", 0.1), 0.1), ERR_CAP) if c[f"{lib}_gas"] else 0.1 for c in cases]
        ax2.barh([yi + offset for yi in y], vals, bw,
                 label=LABELS[lib], color=COLORS[lib])
    ax2.set_yticks(y)
    ax2.set_yticklabels(names, fontsize=7)
    if metric_key == "digits":
        ax2.set_xlabel('Matching Decimal Digits', fontsize=11)
        ax2.set_title('Precision Per Case (higher = better)', fontsize=12, fontweight='bold')
    else:
        ax2.set_xlabel('Error (wei, log scale)', fontsize=11)
        ax2.set_title('Precision Error Per Case (lower = better)', fontsize=12, fontweight='bold')
        ax2.set_xscale('log')
    ax2.legend(fontsize=8, loc='lower right')
    ax2.grid(axis='x', alpha=0.3)
    ax2.invert_yaxis()

    plt.tight_layout()
    plt.savefig('docs/benchmarks/bench_per_case.png', dpi=150, bbox_inches='tight')
    print(f"Saved: docs/benchmarks/bench_per_case.png")

    # ─── Transcendental Plots ───────────────────────────────────────────
    if trans_cases:
        trans_libs = ["fp128", "abdk", "solady"]
        trans_colors = {lib: COLORS[lib] for lib in trans_libs}
        trans_labels = {lib: LABELS[lib] for lib in trans_libs}
        
        fig, axes = plt.subplots(1, 2, figsize=(16, 7))
        
        # Group by function
        funcs = ["exp", "exp2", "ln", "log2", "sqrt", "pow"]
        trans_metric_key = "digits" if (trans_cases and f"{trans_libs[0]}_digits" in trans_cases[0]) else "err"
        func_data = {f: {lib: {"gas": [], trans_metric_key: []} for lib in trans_libs} for f in funcs}
        
        for c in trans_cases:
            func = c["func"]
            for lib in trans_libs:
                g = c[f"{lib}_gas"]
                m = c.get(f"{lib}_{trans_metric_key}")
                if g is not None and m is not None:
                    func_data[func][lib]["gas"].append(g)
                    func_data[func][lib][trans_metric_key].append(m)
        
        # Plot 1: Gas by function
        ax = axes[0]
        x_labels = funcs
        x = list(range(len(x_labels)))
        n_libs = len(trans_libs)
        width = 0.8 / n_libs
        
        for j, lib in enumerate(trans_libs):
            means = [avg(func_data[f][lib]["gas"]) if func_data[f][lib]["gas"] else 0 for f in x_labels]
            offset = (j - n_libs / 2 + 0.5) * width
            bars = ax.bar([xi + offset for xi in x], means, width,
                          label=trans_labels[lib], color=trans_colors[lib], edgecolor='white')
            for bar in bars:
                h = bar.get_height()
                if h > 0:
                    ax.annotate(f'{h:.0f}', xy=(bar.get_x() + bar.get_width()/2, h),
                               xytext=(0, 3), textcoords="offset points",
                               ha='center', va='bottom', fontsize=8)
        
        ax.set_xlabel('Function', fontsize=12)
        ax.set_ylabel('Gas (avg)', fontsize=12)
        ax.set_title('Gas Cost by Transcendental Function', fontsize=12, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(x_labels, fontsize=11)
        ax.legend(fontsize=9)
        ax.grid(axis='y', alpha=0.3)
        
        # Plot 2: Precision by function
        ax = axes[1]
        for j, lib in enumerate(trans_libs):
            if trans_metric_key == "digits":
                means = [max(avg(func_data[f][lib]["digits"]), 1) if func_data[f][lib]["digits"] else 1
                         for f in x_labels]
            else:
                means = [min(max(avg(func_data[f][lib]["err"]), 0.01), 1e18) if func_data[f][lib]["err"] else 0.01
                         for f in x_labels]
            offset = (j - n_libs / 2 + 0.5) * width
            ax.bar([xi + offset for xi in x], means, width,
                   label=trans_labels[lib], color=trans_colors[lib], edgecolor='white')
        
        ax.set_xlabel('Function', fontsize=12)
        if trans_metric_key == "digits":
            ax.set_ylabel('Matching Decimal Digits', fontsize=12)
            ax.set_title('Precision by Transcendental Function (higher = better)', fontsize=12, fontweight='bold')
        else:
            ax.set_ylabel('Avg Error (wei, log scale)', fontsize=12)
            ax.set_title('Precision by Transcendental Function', fontsize=12, fontweight='bold')
            ax.set_yscale('log')
        ax.set_xticks(x)
        ax.set_xticklabels(x_labels, fontsize=11)
        ax.legend(fontsize=9)
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('docs/benchmarks/bench_transcendental.png', dpi=150, bbox_inches='tight')
        print(f"Saved: docs/benchmarks/bench_transcendental.png")

    # ─── Generate Markdown Summary ──────────────────────────────────────
    md_path = generate_markdown_summary(cases, trans_cases)
    print(f"Saved: {md_path}")
    
    # ─── Generate JSON (if requested) ────────────────────────────────────
    if "--json" in sys.argv:
        json_data = generate_json(cases, trans_cases)
        json_path = "docs/benchmarks/benchmark-data.json"
        with open(json_path, 'w') as f:
            json.dump(json_data, f, indent=2)
        print(f"Saved: {json_path}")


def generate_json(cases, trans_cases):
    """Generate JSON data for the benchmark website."""
    data = {
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "libraries": {
            "fp128": {
                "name": "FP128",
                "format": "128.128 fixed-point",
                "lang": "Huff",
                "range": "±1.7e38"
            },
            "abdk": {
                "name": "ABDK",
                "format": "64.64 fixed-point",
                "lang": "Solidity",
                "range": "±9.2e18"
            },
            "solady": {
                "name": "Solady",
                "format": "WAD 18-decimal",
                "lang": "Solidity (asm)",
                "range": "±5.8e58"
            }
        },
        "arithmetic": [],
        "transcendental": []
    }
    
    # Detect if we have digits data (new format) or error data (old format)
    use_digits = cases and f"{LIBS[0]}_digits" in cases[0]
    
    # Convert cases to JSON format
    for c in cases:
        case_data = {
            "name": c["name"],
            "op": c["op"],
            "expected": str(c["expected"]),
            "results": {}
        }
        for lib in LIBS:
            if c[f"{lib}_gas"] is not None:
                result_data = {"gas": c[f"{lib}_gas"]}
                if use_digits:
                    result_data["digits"] = c.get(f"{lib}_digits")
                else:
                    result_data["error"] = c.get(f"{lib}_err")
                case_data["results"][lib] = result_data
        data["arithmetic"].append(case_data)
    
    # Convert transcendental cases
    trans_use_digits = trans_cases and "fp128_digits" in trans_cases[0]
    for c in trans_cases:
        case_data = {
            "name": c["name"],
            "func": c["func"],
            "expected": str(c["expected"]),
            "results": {}
        }
        for lib in LIBS:
            if c[f"{lib}_gas"] is not None:
                result_data = {"gas": c[f"{lib}_gas"]}
                if trans_use_digits:
                    result_data["digits"] = c.get(f"{lib}_digits")
                else:
                    result_data["error"] = c.get(f"{lib}_err")
                case_data["results"][lib] = result_data
        data["transcendental"].append(case_data)
    
    # Compute per-library stats
    for lib in LIBS:
        arith_stats = _compute_stats(cases, lib)
        trans_stats = _compute_stats(trans_cases, lib)
        
        # Overall stats
        all_cases = [c for c in cases if c[f"{lib}_gas"] is not None]
        all_trans = [c for c in trans_cases if c[f"{lib}_gas"] is not None]
        overall_stats = _compute_stats(all_cases + all_trans, lib)
        
        data["libraries"][lib]["stats"] = {
            "arithmetic": arith_stats,
            "transcendental": trans_stats,
            "overall": overall_stats
        }
    
    return data


def _compute_stats(cases, lib):
    """Compute stats for a library across a set of cases."""
    import math
    
    # Check if we have digits-first data (new format) or error-based (old format)
    use_digits = cases and f"{lib}_digits" in cases[0]
    
    errors = []
    digits = []
    zero_count = 0
    max_error = 0
    min_digits = 100
    
    for c in cases:
        if c.get(f"{lib}_gas") is None:
            continue
        
        if use_digits:
            # New format: digits are directly available
            d = c.get(f"{lib}_digits", 0)
            digits.append(d)
            if d >= 100:
                zero_count += 1
            if d < min_digits:
                min_digits = d
        else:
            # Old format: compute digits from error
            err = c.get(f"{lib}_err", 0)
            expected = abs(c["expected"])
            
            errors.append(err)
            if err > max_error:
                max_error = err
            
            if err == 0:
                zero_count += 1
            elif expected > 0 and err > 0:
                # Compute matching digits: floor(log10(|expected| / error))
                matching = math.floor(math.log10(expected / err))
                digits.append(max(0, matching))
    
    avg_error = sum(errors) / len(errors) if errors else 0
    avg_digits = sum(digits) / len(digits) if digits else 18
    
    return {
        "avgError": round(avg_error, 2),
        "maxError": max_error,
        "avgDigits": round(avg_digits, 1),
        "minDigits": round(min_digits, 1) if use_digits else 0,
        "zeroCount": zero_count,
        "total": len([c for c in cases if c.get(f"{lib}_gas") is not None])
    }


if __name__ == "__main__":
    main()
