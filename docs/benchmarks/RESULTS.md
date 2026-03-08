# Benchmark Results

Comprehensive gas and precision benchmark comparing 4 fixed-point arithmetic backends.

## Arithmetic Operations

**Test cases:** 10 (mul, div, add, sub)

### Average Gas per Operation

| Operation | FP128 | ABDK | Solady |
|-----------|-------|------|--------|
| MUL       |  1786 |   214 |   113 |
| DIV       |  1248 |   289 |   200 |
| ADD       |   189 |   246 |   242 |
| SUB       |   190 |   247 |   243 |

### Average Matching Digits per Operation

| Operation | FP128 | ABDK | Solady |
|-----------|-------|------|--------|
| MUL       | 37.6 | 18.8 | 18.0 |
| DIV       | 38.0 | 19.0 | 18.0 |
| ADD       | 38.0 | 19.0 | 18.0 |
| SUB       | 38.0 | 19.0 | 18.0 |

## Transcendental Functions

**Test cases:** 15 (exp, ln, sqrt)

_Only FP128, ABDK, and Solady support transcendental functions._

### Average Gas per Function

| Function | FP128 | ABDK | Solady |
|----------|-------|------|--------|
| exp      |    4149 |    3769 |     441 |
| exp2     |    4044 |    2615 | N/A |
| ln       |    3780 |    6850 |     584 |
| log2     |    3661 |    6813 | N/A |
| sqrt     |    3813 |    1058 |     460 |

### Average Matching Digits per Function

| Function | FP128 | ABDK | Solady |
|----------|-------|------|--------|
| exp      | 37.7 | 19.0 | 18.0 |
| exp2     | 38.0 | 19.0 | N/A |
| ln       | 37.3 | 18.7 | 18.0 |
| log2     | 37.7 | 19.0 | N/A |
| sqrt     | 38.0 | 19.0 | 18.0 |

---

**Note:** Error values are in wei (1e-18). All reference values computed at 100-digit precision using mpmath.
