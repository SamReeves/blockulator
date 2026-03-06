# Benchmark Results

Comprehensive gas and precision benchmark comparing 4 fixed-point arithmetic backends.

## Arithmetic Operations

**Test cases:** 52 (mul, div, add, sub)

### Average Gas per Operation

| Operation | FP128 | Vyper | ABDK | Solady |
|-----------|-------|-------|------|--------|
| MUL       |   979 |  1091 |   236 |   113 |
| DIV       |  1386 |   937 |   290 |   145 |
| ADD       |   875 |   870 |   265 |   148 |
| SUB       |   880 |   896 |   266 |   176 |

### Average Error per Operation (wei)

| Operation | FP128 | Vyper | ABDK | Solady |
|-----------|-------|-------|------|--------|
| MUL       | 122254960901277595746249758593341456384.0 | 9.52e-01 | 1590163188143735.0 | 9.47e-01 |
| DIV       | 52632105263159148065435013873664.0 | 1.58e-01 | 52632064387734730235616090390528.0 | 1.67e-01 |
| ADD       | 1115224169097298048.0 | 2.00e-01 | 6.00e-01 | 2.50e-01 |
| SUB       | 578571857.1 | 1.43e-01 | 5.71e-01 | 1.43e-01 |

## Transcendental Functions

**Test cases:** 27 (exp, ln, sqrt)

_Only FP128, ABDK, and Solady support transcendental functions._

### Average Gas per Function

| Function | FP128 | ABDK | Solady |
|----------|-------|------|--------|
| exp      |     626 |    3693 |     426 |
| ln       |   21374 |    7066 |     171 |
| sqrt     |    2976 |    1053 |     393 |

### Average Error per Function (wei)

| Function | FP128 | ABDK | Solady |
|----------|-------|------|--------|
| exp      | 2207431176146431246336.0 |    73.4 |     2.4 |
| ln       | 87302817121171603456.0 | 6.25e-01 | 7.50e-01 |
| sqrt     | 111111113363838476954370048.0 | 0.00e+00 | 0.00e+00 |

---

**Note:** Error values are in wei (1e-18). All reference values computed at 100-digit precision using mpmath.
