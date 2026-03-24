#!/usr/bin/env python3
"""Generate massive benchmark test cases for crowded scatter plots.

Generates 800+ test cases across all operations with 100-digit precision
reference values computed via mpmath.

Output: Solidity code for ComprehensiveBench.t.sol
"""
import mpmath
import random
import hashlib

mpmath.mp.dps = 100
random.seed(42)  # Reproducible

WAD = mpmath.mpf(10)**18

# Mathematical constants
PI = mpmath.pi
E = mpmath.e
PHI = (1 + mpmath.sqrt(5)) / 2
SQRT2 = mpmath.sqrt(2)
SQRT3 = mpmath.sqrt(3)
SQRT5 = mpmath.sqrt(5)
LN2 = mpmath.log(2)
LN10 = mpmath.log(10)

def to_wad(val):
    """Convert mpmath value to WAD (1e18 fixed point)."""
    return int(val * WAD)

def safe_name(s):
    """Make a safe Solidity string name."""
    return s.replace("^", "pow").replace("/", "_div_").replace("*", "_mul_").replace("+", "_plus_").replace("-", "_minus_").replace("(", "").replace(")", "").replace(" ", "_").replace(".", "p")[:40]

# ═══════════════════════════════════════════════════════════════════════════════
# MULTIPLICATION CASES (200+)
# ═══════════════════════════════════════════════════════════════════════════════

mul_cases = []

def add_mul(name, a, b):
    try:
        result = a * b
        # Check WAD range (roughly ±1e59 for int256)
        if abs(to_wad(a)) < 2**200 and abs(to_wad(b)) < 2**200 and abs(to_wad(result)) < 2**200:
            mul_cases.append((name, a, b, result))
    except:
        pass

# Mathematical constant products
constants = [
    ("pi", PI), ("e", E), ("phi", PHI), ("sqrt2", SQRT2), 
    ("sqrt3", SQRT3), ("sqrt5", SQRT5), ("ln2", LN2), ("ln10", LN10),
    ("1", mpmath.mpf(1)), ("2", mpmath.mpf(2)), ("3", mpmath.mpf(3)),
    ("0.5", mpmath.mpf("0.5")), ("0.1", mpmath.mpf("0.1")),
]

for i, (n1, v1) in enumerate(constants):
    for j, (n2, v2) in enumerate(constants):
        if i <= j:
            add_mul(f"{n1}*{n2}", v1, v2)

# Inverse pairs (should equal 1)
for n, v in constants[:-2]:  # skip 0.5, 0.1
    if v != 0:
        add_mul(f"{n}*inv_{n}", v, 1/v)

# Powers of 2
for i in range(-20, 21):
    for j in range(-20, 21):
        if abs(i + j) < 40:  # Stay in range
            add_mul(f"2^{i}*2^{j}", mpmath.mpf(2)**i, mpmath.mpf(2)**j)

# Powers of 10  
for i in range(-15, 16):
    for j in range(-15, 16):
        if abs(i + j) < 30:
            add_mul(f"10^{i}*10^{j}", mpmath.mpf(10)**i, mpmath.mpf(10)**j)

# Fractions: 1/n * n = 1
for n in range(2, 50):
    add_mul(f"1/{n}*{n}", mpmath.mpf(1)/n, mpmath.mpf(n))

# Square roots: sqrt(n) * sqrt(n) = n
for n in range(2, 30):
    add_mul(f"sqrt{n}*sqrt{n}", mpmath.sqrt(n), mpmath.sqrt(n))

# Random samples
for _ in range(50):
    a = mpmath.mpf(random.uniform(0.001, 1000))
    b = mpmath.mpf(random.uniform(0.001, 1000))
    add_mul(f"rand_{len(mul_cases)}", a, b)

# Signed multiplications
add_mul("neg2*3", mpmath.mpf(-2), mpmath.mpf(3))
add_mul("neg_pi*neg_e", -PI, -E)
add_mul("neg_sqrt2*sqrt3", -SQRT2, SQRT3)
for i in range(20):
    a = mpmath.mpf(random.uniform(-100, 100))
    b = mpmath.mpf(random.uniform(-100, 100))
    add_mul(f"signed_{len(mul_cases)}", a, b)

print(f"Generated {len(mul_cases)} multiplication cases")

# ═══════════════════════════════════════════════════════════════════════════════
# DIVISION CASES (200+)
# ═══════════════════════════════════════════════════════════════════════════════

div_cases = []

def add_div(name, a, b):
    try:
        if b == 0:
            return
        result = a / b
        if abs(to_wad(a)) < 2**200 and abs(to_wad(b)) < 2**200 and abs(to_wad(result)) < 2**200:
            div_cases.append((name, a, b, result))
    except:
        pass

# Constant divisions
for i, (n1, v1) in enumerate(constants):
    for j, (n2, v2) in enumerate(constants):
        if v2 != 0:
            add_div(f"{n1}/{n2}", v1, v2)

# Unit fractions 1/n
for n in range(2, 100):
    add_div(f"1/{n}", mpmath.mpf(1), mpmath.mpf(n))

# Approximations of pi
add_div("22/7", mpmath.mpf(22), mpmath.mpf(7))
add_div("355/113", mpmath.mpf(355), mpmath.mpf(113))
add_div("103993/33102", mpmath.mpf(103993), mpmath.mpf(33102))

# Powers of 2
for i in range(-15, 16):
    for j in range(-15, 16):
        if j != 0 and abs(i - j) < 30:
            add_div(f"2^{i}/2^{j}", mpmath.mpf(2)**i, mpmath.mpf(2)**j)

# Powers of 10
for i in range(-12, 13):
    for j in range(-12, 13):
        if j != 0 and abs(i - j) < 24:
            add_div(f"10^{i}/10^{j}", mpmath.mpf(10)**i, mpmath.mpf(10)**j)

# Self-division (should equal 1)
for n, v in constants:
    if v != 0:
        add_div(f"{n}/{n}", v, v)

# Random samples
for _ in range(50):
    a = mpmath.mpf(random.uniform(0.01, 1000))
    b = mpmath.mpf(random.uniform(0.01, 1000))
    add_div(f"rand_{len(div_cases)}", a, b)

# Signed divisions
for i in range(20):
    a = mpmath.mpf(random.uniform(-100, 100))
    b = mpmath.mpf(random.uniform(0.1, 100)) * (1 if random.random() > 0.5 else -1)
    add_div(f"signed_{len(div_cases)}", a, b)

print(f"Generated {len(div_cases)} division cases")

# ═══════════════════════════════════════════════════════════════════════════════
# ADDITION CASES (150+)
# ═══════════════════════════════════════════════════════════════════════════════

add_cases = []

def add_add(name, a, b):
    try:
        result = a + b
        if abs(to_wad(a)) < 2**200 and abs(to_wad(b)) < 2**200 and abs(to_wad(result)) < 2**200:
            add_cases.append((name, a, b, result))
    except:
        pass

# Constant additions
for i, (n1, v1) in enumerate(constants):
    for j, (n2, v2) in enumerate(constants):
        if i <= j:
            add_add(f"{n1}+{n2}", v1, v2)

# phi + 1/phi = sqrt(5)
add_add("phi+inv_phi", PHI, 1/PHI)

# Small additions (precision tests)
for exp in range(-15, 0):
    add_add(f"1+10^{exp}", mpmath.mpf(1), mpmath.mpf(10)**exp)

# Powers of 2
for i in range(-10, 11):
    for j in range(-10, 11):
        add_add(f"2^{i}+2^{j}", mpmath.mpf(2)**i, mpmath.mpf(2)**j)

# Signed additions
for i in range(30):
    a = mpmath.mpf(random.uniform(-100, 100))
    b = mpmath.mpf(random.uniform(-100, 100))
    add_add(f"signed_{len(add_cases)}", a, b)

# Random samples
for _ in range(30):
    a = mpmath.mpf(random.uniform(0.001, 1000))
    b = mpmath.mpf(random.uniform(0.001, 1000))
    add_add(f"rand_{len(add_cases)}", a, b)

print(f"Generated {len(add_cases)} addition cases")

# ═══════════════════════════════════════════════════════════════════════════════
# SUBTRACTION CASES (150+)
# ═══════════════════════════════════════════════════════════════════════════════

sub_cases = []

def add_sub(name, a, b):
    try:
        result = a - b
        if abs(to_wad(a)) < 2**200 and abs(to_wad(b)) < 2**200 and abs(to_wad(result)) < 2**200:
            sub_cases.append((name, a, b, result))
    except:
        pass

# Constant subtractions
for i, (n1, v1) in enumerate(constants):
    for j, (n2, v2) in enumerate(constants):
        add_sub(f"{n1}-{n2}", v1, v2)

# phi^2 - phi = 1
add_sub("phi2-phi", PHI**2, PHI)

# Near cancellation (precision killers)
for exp in range(-15, -5):
    one_plus_eps = mpmath.mpf(1) + mpmath.mpf(10)**exp
    add_sub(f"(1+10^{exp})-1", one_plus_eps, mpmath.mpf(1))

# sqrt(n)^2 - n = 0
for n in range(2, 20):
    add_sub(f"sqrt{n}^2-{n}", mpmath.sqrt(n)**2, mpmath.mpf(n))

# Powers of 2
for i in range(-8, 9):
    for j in range(-8, 9):
        add_sub(f"2^{i}-2^{j}", mpmath.mpf(2)**i, mpmath.mpf(2)**j)

# Signed subtractions
for i in range(30):
    a = mpmath.mpf(random.uniform(-100, 100))
    b = mpmath.mpf(random.uniform(-100, 100))
    add_sub(f"signed_{len(sub_cases)}", a, b)

# Random samples
for _ in range(30):
    a = mpmath.mpf(random.uniform(0.001, 1000))
    b = mpmath.mpf(random.uniform(0.001, 1000))
    add_sub(f"rand_{len(sub_cases)}", a, b)

print(f"Generated {len(sub_cases)} subtraction cases")

# ═══════════════════════════════════════════════════════════════════════════════
# EXP CASES (150+)
# ═══════════════════════════════════════════════════════════════════════════════

exp_cases = []

def add_exp(name, x):
    try:
        result = mpmath.exp(x)
        # exp() can overflow, check bounds
        if abs(to_wad(x)) < 2**100 and abs(to_wad(result)) < 2**200:
            exp_cases.append((name, x, result))
    except:
        pass

# Standard values
for i in range(-20, 21):
    add_exp(f"exp({i})", mpmath.mpf(i))

# Fractional values
for num in range(-50, 51):
    add_exp(f"exp({num}/10)", mpmath.mpf(num) / 10)

# exp(ln(n)) = n
for n in [2, 3, 5, 7, 10, 100]:
    add_exp(f"exp(ln({n}))", mpmath.log(n))

# Small values near 0
for exp in range(-10, 0):
    add_exp(f"exp(10^{exp})", mpmath.mpf(10)**exp)
    add_exp(f"exp(-10^{exp})", -mpmath.mpf(10)**exp)

# Constants
add_exp("exp(pi)", PI)
add_exp("exp(-pi)", -PI)
add_exp("exp(e)", E)
add_exp("exp(ln2)", LN2)
add_exp("exp(phi)", PHI)

# Random samples
for _ in range(30):
    x = mpmath.mpf(random.uniform(-10, 20))
    add_exp(f"exp_rand_{len(exp_cases)}", x)

print(f"Generated {len(exp_cases)} exp cases")

# ═══════════════════════════════════════════════════════════════════════════════
# LN CASES (150+)
# ═══════════════════════════════════════════════════════════════════════════════

ln_cases = []

def add_ln(name, x):
    try:
        if x <= 0:
            return
        result = mpmath.log(x)
        if abs(to_wad(x)) < 2**200 and to_wad(x) > 0 and abs(to_wad(result)) < 2**200:
            ln_cases.append((name, x, result))
    except:
        pass

# Standard values
add_ln("ln(1)", mpmath.mpf(1))
add_ln("ln(e)", E)
add_ln("ln(e^2)", E**2)
add_ln("ln(e^3)", E**3)

# Integers
for n in range(1, 101):
    add_ln(f"ln({n})", mpmath.mpf(n))

# Powers of 2
for i in range(-20, 21):
    if 2**i > 0:
        add_ln(f"ln(2^{i})", mpmath.mpf(2)**i)

# Powers of 10
for i in range(-15, 16):
    if 10**i > 0:
        add_ln(f"ln(10^{i})", mpmath.mpf(10)**i)

# Fractions
for n in range(2, 20):
    add_ln(f"ln(1/{n})", mpmath.mpf(1) / n)

# Near 1 (precision tests)
for exp in range(-10, 0):
    add_ln(f"ln(1+10^{exp})", mpmath.mpf(1) + mpmath.mpf(10)**exp)
    add_ln(f"ln(1-10^{exp})", mpmath.mpf(1) - mpmath.mpf(10)**exp)

# Constants
add_ln("ln(pi)", PI)
add_ln("ln(phi)", PHI)
add_ln("ln(sqrt2)", SQRT2)
add_ln("ln(sqrt5)", SQRT5)

# Random samples
for _ in range(30):
    x = mpmath.mpf(random.uniform(0.01, 1000))
    add_ln(f"ln_rand_{len(ln_cases)}", x)

print(f"Generated {len(ln_cases)} ln cases")

# ═══════════════════════════════════════════════════════════════════════════════
# SQRT CASES (150+)
# ═══════════════════════════════════════════════════════════════════════════════

sqrt_cases = []

def add_sqrt(name, x):
    try:
        if x < 0:
            return
        result = mpmath.sqrt(x)
        if abs(to_wad(x)) < 2**200 and to_wad(x) >= 0 and abs(to_wad(result)) < 2**200:
            sqrt_cases.append((name, x, result))
    except:
        pass

# Perfect squares
for n in range(1, 101):
    add_sqrt(f"sqrt({n}^2)", mpmath.mpf(n)**2)

# Integers
for n in range(1, 101):
    add_sqrt(f"sqrt({n})", mpmath.mpf(n))

# Powers of 2
for i in range(0, 40):
    add_sqrt(f"sqrt(2^{i})", mpmath.mpf(2)**i)

# Powers of 10
for i in range(0, 30):
    add_sqrt(f"sqrt(10^{i})", mpmath.mpf(10)**i)

# Fractions
for n in range(1, 20):
    add_sqrt(f"sqrt(1/{n})", mpmath.mpf(1) / n)

# Constants
add_sqrt("sqrt(pi)", PI)
add_sqrt("sqrt(e)", E)
add_sqrt("sqrt(phi)", PHI)
add_sqrt("sqrt(ln2)", LN2)

# Random samples
for _ in range(30):
    x = mpmath.mpf(random.uniform(0.001, 10000))
    add_sqrt(f"sqrt_rand_{len(sqrt_cases)}", x)

print(f"Generated {len(sqrt_cases)} sqrt cases")

# ═══════════════════════════════════════════════════════════════════════════════
# LIMIT TO AVOID SOLIDITY COMPILATION ISSUES
# ═══════════════════════════════════════════════════════════════════════════════

# Limit each category to keep compilation reasonable
MAX_MUL = 200
MAX_DIV = 200
MAX_ADD = 150
MAX_SUB = 150
MAX_EXP = 150
MAX_LN = 150
MAX_SQRT = 150

mul_cases = mul_cases[:MAX_MUL]
div_cases = div_cases[:MAX_DIV]
add_cases = add_cases[:MAX_ADD]
sub_cases = sub_cases[:MAX_SUB]
exp_cases = exp_cases[:MAX_EXP]
ln_cases = ln_cases[:MAX_LN]
sqrt_cases = sqrt_cases[:MAX_SQRT]

total_arith = len(mul_cases) + len(div_cases) + len(add_cases) + len(sub_cases)
total_trans = len(exp_cases) + len(ln_cases) + len(sqrt_cases)
print(f"\nTotal arithmetic: {total_arith}")
print(f"Total transcendental: {total_trans}")
print(f"Grand total: {total_arith + total_trans}")

# ═══════════════════════════════════════════════════════════════════════════════
# OUTPUT SOLIDITY CODE
# ═══════════════════════════════════════════════════════════════════════════════

output = []

output.append("    function _initCases() internal {")
output.append(f"        // {total_arith} arithmetic cases generated via mpmath at {mpmath.mp.dps}-digit precision")
output.append("")

# Multiplication
output.append(f"        // ═══ MULTIPLICATION ({len(mul_cases)} cases) ═══")
for name, a, b, result in mul_cases:
    a_wad = to_wad(a)
    b_wad = to_wad(b)
    r_wad = to_wad(result)
    output.append(f'        _a("{safe_name(name)}", 0, {a_wad}, {b_wad}, {r_wad});')

output.append("")

# Division
output.append(f"        // ═══ DIVISION ({len(div_cases)} cases) ═══")
for name, a, b, result in div_cases:
    a_wad = to_wad(a)
    b_wad = to_wad(b)
    r_wad = to_wad(result)
    output.append(f'        _a("{safe_name(name)}", 1, {a_wad}, {b_wad}, {r_wad});')

output.append("")

# Addition
output.append(f"        // ═══ ADDITION ({len(add_cases)} cases) ═══")
for name, a, b, result in add_cases:
    a_wad = to_wad(a)
    b_wad = to_wad(b)
    r_wad = to_wad(result)
    output.append(f'        _a("{safe_name(name)}", 2, {a_wad}, {b_wad}, {r_wad});')

output.append("")

# Subtraction
output.append(f"        // ═══ SUBTRACTION ({len(sub_cases)} cases) ═══")
for name, a, b, result in sub_cases:
    a_wad = to_wad(a)
    b_wad = to_wad(b)
    r_wad = to_wad(result)
    output.append(f'        _a("{safe_name(name)}", 3, {a_wad}, {b_wad}, {r_wad});')

output.append("    }")
output.append("")

# Transcendental
output.append("    function _initTransCases() internal {")
output.append(f"        // {total_trans} transcendental cases generated via mpmath at {mpmath.mp.dps}-digit precision")
output.append("")

# Exp
output.append(f"        // ═══ EXP ({len(exp_cases)} cases) ═══")
for name, x, result in exp_cases:
    x_wad = to_wad(x)
    r_wad = to_wad(result)
    output.append(f'        _t("{safe_name(name)}", 0, {x_wad}, {r_wad});')

output.append("")

# Ln
output.append(f"        // ═══ LN ({len(ln_cases)} cases) ═══")
for name, x, result in ln_cases:
    x_wad = to_wad(x)
    r_wad = to_wad(result)
    output.append(f'        _t("{safe_name(name)}", 1, {x_wad}, {r_wad});')

output.append("")

# Sqrt
output.append(f"        // ═══ SQRT ({len(sqrt_cases)} cases) ═══")
for name, x, result in sqrt_cases:
    x_wad = to_wad(x)
    r_wad = to_wad(result)
    output.append(f'        _t("{safe_name(name)}", 2, {x_wad}, {r_wad});')

output.append("    }")

# Write to file
with open("scripts/generators/massive_bench_cases.sol.txt", "w") as f:
    f.write("\n".join(output))

print(f"\nWritten to scripts/generators/massive_bench_cases.sol.txt")
