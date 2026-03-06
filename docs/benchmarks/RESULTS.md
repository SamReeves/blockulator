# Benchmark Results

Comprehensive gas and precision benchmark comparing 4 fixed-point arithmetic backends.

## Arithmetic Operations

**Test cases:** 10 (mul, div, add, sub)

### Average Gas per Operation

| Operation | FP128 | Vyper | ABDK | Solady |
|-----------|-------|-------|------|--------|
| MUL       |  1905 |  2516 |   216 |   126 |
| DIV       |  1105 |  1646 |   270 |   155 |
| ADD       |   199 |  1634 |   261 |   125 |
| SUB       |   200 |  1635 |   232 |   126 |

### Average Matching Digits per Operation

| Operation | FP128 | Vyper | ABDK | Solady |
|-----------|-------|-------|------|--------|
| MUL       | 37.6 | 9.6 | 18.8 | 18.0 |
| DIV       | 28.0 | 10.0 | 19.0 | 18.0 |
| ADD       | 38.0 | 10.0 | 19.0 | 18.0 |
| SUB       | 38.0 | 10.0 | 19.0 | 18.0 |

## Transcendental Functions

**Test cases:** 8 (exp, ln, sqrt)

_Only FP128, ABDK, and Solady support transcendental functions._

### Average Gas per Function

| Function | FP128 | ABDK | Solady |
|----------|-------|------|--------|
| exp      |   17025 |    5433 |    3834 |     450 |
| ln       |   13029 |   88060 |    7009 |     605 |
| sqrt     |    2414 |    9384 |    1145 |     469 |

### Average Matching Digits per Function

| Function | FP128 | ABDK | Solady |
|----------|-------|------|--------|
| exp      | 36.7 | 10.0 | 19.0 | 18.0 |
| ln       | 37.7 | 9.0 | 18.7 | 18.0 |
| sqrt     | 18.0 | 10.0 | 19.0 | 18.0 |

---

**Note:** Error values are in wei (1e-18). All reference values computed at 100-digit precision using mpmath.
