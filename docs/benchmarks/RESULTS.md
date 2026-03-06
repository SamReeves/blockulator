# Benchmark Results

Comprehensive gas and precision benchmark comparing 5 fixed-point/floating-point arithmetic backends.

## Arithmetic Operations

**Test cases:** 52 (mul, div, add, sub)

### Average Gas per Operation

| Operation | FP128 | Binary256 | PRBMath | ABDK | Solady |
|-----------|-------|-----------|---------|------|--------|
| MUL       |   764 |  7752 |   438 |   186 |   113 |
| DIV       |   772 |  8166 |   519 |   245 |   145 |
| ADD       |   665 |  6365 |   218 |   234 |   148 |
| SUB       |   670 |  6315 |   208 |   235 |   176 |

### Average Error per Operation (wei)

| Operation | FP128 | Binary256 | PRBMath | ABDK | Solady |
|-----------|-------|-----------|---------|------|--------|
| MUL       |   1.3 | 4809759514603152403711136983154688.0 | 9.52e-01 | 1590163188143735.0 | 9.47e-01 |
| DIV       | 52632064387974916210943013683200.0 | 52632105265243945397738109140992.0 | 1.58e-01 | 52632064387734730235616090390528.0 | 1.67e-01 |
| ADD       | 6.00e-01 | 123605346775974848.0 | 2.00e-01 | 6.00e-01 | 2.50e-01 |
| SUB       | 5.71e-01 | 13126008.3 | 1.43e-01 | 5.71e-01 | 1.43e-01 |

## Transcendental Functions

**Test cases:** 27 (exp, ln, sqrt)

_Only PRBMath, ABDK, and Solady support transcendental functions._

### Average Gas per Function

| Function | PRBMath | ABDK | Solady |
|----------|---------|------|--------|
| exp      |    2706 |    3735 |     426 |
| ln       |    4643 |    6798 |     272 |
| sqrt     |    1040 |    1049 |     393 |

### Average Error per Function (wei)

| Function | PRBMath | ABDK | Solady |
|----------|---------|------|--------|
| exp      |  5528.4 |    73.4 |     2.4 |
| ln       |     6.1 | 6.25e-01 | 7.50e-01 |
| sqrt     | 0.00e+00 | 0.00e+00 | 0.00e+00 |

---

**Note:** Error values are in wei (1e-18). All reference values computed at 100-digit precision using mpmath.
