#!/usr/bin/env python3
"""Generate high-precision reference values for ArithBench and TransBench.

Uses mpmath at 100-digit precision to compute ground-truth results.
Outputs _a() calls using signed fixed18 (WAD, 1e18 scale) values.
"""
import mpmath
mpmath.mp.dps = 100

WAD = 10**18

def to_wad_signed(val):
    """Convert mpmath value to signed fixed18 (WAD)."""
    return int(val * mpmath.mpf(10)**18)

def to_wad_unsigned(val):
    """Convert mpmath value to unsigned fixed18 (WAD)."""
    return int(val * mpmath.mpf(10)**18)

pi  = mpmath.pi
e   = mpmath.e
phi = (1 + mpmath.sqrt(5)) / 2
sqrt2 = mpmath.sqrt(2)
sqrt3 = mpmath.sqrt(3)
ln2 = mpmath.log(2)
ln10 = mpmath.log(10)

cases = []

def add_case(name, op, a, b, expected):
    cases.append((name, op, a, b, expected))

# ── Multiplication ──────────────────────────────────────────────────
add_case("pi * e",             "mul", pi, e, pi * e)
add_case("sqrt2 * sqrt3",     "mul", sqrt2, sqrt3, sqrt2 * sqrt3)
add_case("phi * (1/phi)",     "mul", phi, 1/phi, mpmath.mpf(1))
add_case("1/3 * 3",           "mul", mpmath.mpf(1)/3, mpmath.mpf(3), mpmath.mpf(1))
add_case("1/7 * 7",           "mul", mpmath.mpf(1)/7, mpmath.mpf(7), mpmath.mpf(1))
add_case("1/13 * 13",         "mul", mpmath.mpf(1)/13, mpmath.mpf(13), mpmath.mpf(1))
add_case("e * e",             "mul", e, e, e**2)
add_case("pi * pi",           "mul", pi, pi, pi**2)
add_case("0.1 * 0.1",         "mul", mpmath.mpf("0.1"), mpmath.mpf("0.1"), mpmath.mpf("0.01"))
add_case("1e-9 * 1e9",        "mul", mpmath.mpf("1e-9"), mpmath.mpf("1e9"), mpmath.mpf(1))
add_case("ln2 * (1/ln2)",     "mul", ln2, 1/ln2, mpmath.mpf(1))
add_case("99.99 * 1.0001",    "mul", mpmath.mpf("99.99"), mpmath.mpf("1.0001"),
         mpmath.mpf("99.99") * mpmath.mpf("1.0001"))
add_case("(-2) * 3",          "mul", mpmath.mpf(-2), mpmath.mpf(3), mpmath.mpf(-6))
add_case("(-pi) * (-e)",      "mul", -pi, -e, pi * e)

# ── Division ────────────────────────────────────────────────────────
add_case("pi / e",             "div", pi, e, pi / e)
add_case("e / pi",             "div", e, pi, e / pi)
add_case("1 / 3",              "div", mpmath.mpf(1), mpmath.mpf(3), mpmath.mpf(1)/3)
add_case("1 / 7",              "div", mpmath.mpf(1), mpmath.mpf(7), mpmath.mpf(1)/7)
add_case("1 / 13",             "div", mpmath.mpf(1), mpmath.mpf(13), mpmath.mpf(1)/13)
add_case("22 / 7",             "div", mpmath.mpf(22), mpmath.mpf(7), mpmath.mpf(22)/7)
add_case("sqrt2 / sqrt3",     "div", sqrt2, sqrt3, sqrt2 / sqrt3)
add_case("e^2 / e",            "div", e**2, e, e)
add_case("ln10 / ln2",         "div", ln10, ln2, ln10 / ln2)
add_case("phi / sqrt2",        "div", phi, sqrt2, phi / sqrt2)
add_case("100.001 / 100",      "div", mpmath.mpf("100.001"), mpmath.mpf("100"),
         mpmath.mpf("100.001") / 100)
add_case("(-6) / 3",           "div", mpmath.mpf(-6), mpmath.mpf(3), mpmath.mpf(-2))

# ── Addition ────────────────────────────────────────────────────────
add_case("pi + e",             "add", pi, e, pi + e)
add_case("1 + 1e-15",          "add", mpmath.mpf(1), mpmath.mpf("1e-15"),
         mpmath.mpf(1) + mpmath.mpf("1e-15"))
add_case("phi + (1/phi)",      "add", phi, 1/phi, phi + 1/phi)
add_case("(-3) + 5",           "add", mpmath.mpf(-3), mpmath.mpf(5), mpmath.mpf(2))

# ── Subtraction ─────────────────────────────────────────────────────
add_case("(1+1e-15) - 1",      "sub", mpmath.mpf(1) + mpmath.mpf("1e-15"), mpmath.mpf(1),
         mpmath.mpf("1e-15"))
add_case("phi^2 - phi",        "sub", phi**2, phi, mpmath.mpf(1))
add_case("sqrt2^2 - 2",        "sub", sqrt2**2, mpmath.mpf(2), mpmath.mpf(0))
add_case("5 - 3",              "sub", mpmath.mpf(5), mpmath.mpf(3), mpmath.mpf(2))

# ── Compound (error accumulation) ──────────────────────────────────
add_case("(pi*e)/e",            "div", pi * e, e, pi)
add_case("(e/pi)*pi",           "mul", e/pi, pi, e)
add_case("sqrt(2)^2 via mul",   "mul", sqrt2, sqrt2, mpmath.mpf(2))

# ── Edge cases: Very small numbers ─────────────────────────────────
add_case("1e-15 * 1e-15",      "mul", mpmath.mpf("1e-15"), mpmath.mpf("1e-15"), mpmath.mpf("1e-30"))
add_case("1e-9 / 1e9",         "div", mpmath.mpf("1e-9"), mpmath.mpf("1e9"), mpmath.mpf("1e-18"))
add_case("1e-12 + 1e-12",      "add", mpmath.mpf("1e-12"), mpmath.mpf("1e-12"), mpmath.mpf("2e-12"))
add_case("1e-10 - 0.5e-10",    "sub", mpmath.mpf("1e-10"), mpmath.mpf("0.5e-10"), mpmath.mpf("0.5e-10"))

# ── Edge cases: Very large numbers ─────────────────────────────────
add_case("1e15 * 1e2",         "mul", mpmath.mpf("1e15"), mpmath.mpf("1e2"), mpmath.mpf("1e17"))
add_case("1e18 * 1e-3",        "mul", mpmath.mpf("1e18"), mpmath.mpf("1e-3"), mpmath.mpf("1e15"))
add_case("1e20 / 1e10",        "div", mpmath.mpf("1e20"), mpmath.mpf("1e10"), mpmath.mpf("1e10"))
add_case("1e30 / 1e15",        "div", mpmath.mpf("1e30"), mpmath.mpf("1e15"), mpmath.mpf("1e15"))

# ── Precision killers (catastrophic cancellation) ──────────────────
# (1 + 1e-15)^2 - 1 should give 2e-15 + 1e-30 ≈ 2e-15
one_plus_eps = mpmath.mpf(1) + mpmath.mpf("1e-15")
add_case("(1+1e-15)^2 - 1",    "sub", one_plus_eps**2, mpmath.mpf(1), one_plus_eps**2 - 1)

# (a+b)*(a-b) vs a^2 - b^2 (both should equal a^2-b^2 but different paths)
a_test = mpmath.mpf("1.000000001")
b_test = mpmath.mpf("0.999999999")
add_case("(a+b)*(a-b)",        "mul", a_test + b_test, a_test - b_test, a_test**2 - b_test**2)
add_case("a^2 - b^2 direct",   "sub", a_test**2, b_test**2, a_test**2 - b_test**2)

# ── More compound operations ───────────────────────────────────────
add_case("(a*b)/(b*a)",        "div", pi * e, e * pi, mpmath.mpf(1))
add_case("((a/b)*b)/a",        "div", (pi / e) * e, pi, mpmath.mpf(1))

# ── Mixed operations ───────────────────────────────────────────────
add_case("(1+2)*(3+4)",        "mul", mpmath.mpf(3), mpmath.mpf(7), mpmath.mpf(21))
add_case("10/(2+3)",           "div", mpmath.mpf(10), mpmath.mpf(5), mpmath.mpf(2))

op_map = {"mul": 0, "div": 1, "add": 2, "sub": 3}

print("    // ═══════════════════════════════════════════════════════════════════════")
print("    // ARITHMETIC CASES")
print("    // ═══════════════════════════════════════════════════════════════════════")
print(f"    function _initArithCases() internal {{")
print(f"        // {len(cases)} benchmark cases generated at {mpmath.mp.dps}-digit precision via mpmath")
for name, op, a, b, expected in cases:
    a_w = to_wad_signed(a)
    b_w = to_wad_signed(b)
    e_w = to_wad_signed(expected)
    print(f'        _a("{name}", {op_map[op]}, {a_w}, {b_w}, {e_w});')
print("    }")
print()

# ═══════════════════════════════════════════════════════════════════════
# TRANSCENDENTAL FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

trans_cases = []

def add_trans(name, func, x, expected):
    """Add a transcendental test case."""
    trans_cases.append((name, func, x, expected))

# ── exp() ───────────────────────────────────────────────────────────
add_trans("exp(0)",            "exp", mpmath.mpf(0), mpmath.exp(0))
add_trans("exp(1)",            "exp", mpmath.mpf(1), mpmath.exp(1))
add_trans("exp(-1)",           "exp", mpmath.mpf(-1), mpmath.exp(-1))
add_trans("exp(2)",            "exp", mpmath.mpf(2), mpmath.exp(2))
add_trans("exp(0.5)",          "exp", mpmath.mpf("0.5"), mpmath.exp(mpmath.mpf("0.5")))
add_trans("exp(-0.5)",         "exp", mpmath.mpf("-0.5"), mpmath.exp(mpmath.mpf("-0.5")))
add_trans("exp(10)",           "exp", mpmath.mpf(10), mpmath.exp(10))
add_trans("exp(-10)",          "exp", mpmath.mpf(-10), mpmath.exp(-10))
add_trans("exp(ln(2))",        "exp", ln2, mpmath.mpf(2))
add_trans("exp(3.5)",          "exp", mpmath.mpf("3.5"), mpmath.exp(mpmath.mpf("3.5")))

# ── ln() ────────────────────────────────────────────────────────────
add_trans("ln(1)",             "ln",  mpmath.mpf(1), mpmath.log(1))
add_trans("ln(e)",             "ln",  e, mpmath.mpf(1))
add_trans("ln(2)",             "ln",  mpmath.mpf(2), mpmath.log(2))
add_trans("ln(10)",            "ln",  mpmath.mpf(10), mpmath.log(10))
add_trans("ln(0.5)",           "ln",  mpmath.mpf("0.5"), mpmath.log(mpmath.mpf("0.5")))
add_trans("ln(100)",           "ln",  mpmath.mpf(100), mpmath.log(100))
add_trans("ln(e^2)",           "ln",  e**2, mpmath.mpf(2))
add_trans("ln(0.1)",           "ln",  mpmath.mpf("0.1"), mpmath.log(mpmath.mpf("0.1")))

# ── sqrt() ──────────────────────────────────────────────────────────
add_trans("sqrt(2)",           "sqrt", mpmath.mpf(2), mpmath.sqrt(2))
add_trans("sqrt(3)",           "sqrt", mpmath.mpf(3), mpmath.sqrt(3))
add_trans("sqrt(0.5)",         "sqrt", mpmath.mpf("0.5"), mpmath.sqrt(mpmath.mpf("0.5")))
add_trans("sqrt(1)",           "sqrt", mpmath.mpf(1), mpmath.mpf(1))
add_trans("sqrt(4)",           "sqrt", mpmath.mpf(4), mpmath.mpf(2))
add_trans("sqrt(100)",         "sqrt", mpmath.mpf(100), mpmath.mpf(10))
add_trans("sqrt(1e18)",        "sqrt", mpmath.mpf("1e18"), mpmath.mpf("1e9"))
add_trans("sqrt(pi)",          "sqrt", pi, mpmath.sqrt(pi))
add_trans("sqrt(e)",           "sqrt", e, mpmath.sqrt(e))

func_map = {"exp": 0, "ln": 1, "sqrt": 2}

print("    // ═══════════════════════════════════════════════════════════════════════")
print("    // TRANSCENDENTAL CASES")
print("    // ═══════════════════════════════════════════════════════════════════════")
print(f"    function _initTransCases() internal {{")
print(f"        // {len(trans_cases)} transcendental cases generated at {mpmath.mp.dps}-digit precision via mpmath")
for name, func, x, expected in trans_cases:
    x_w = to_wad_signed(x)
    e_w = to_wad_signed(expected)
    print(f'        _t("{name}", {func_map[func]}, {x_w}, {e_w});')
print("    }")
