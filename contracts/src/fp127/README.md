# FP127 in Yul

Signed 127.128 fixed-point arithmetic for the EVM. One `int256` per value,
`value = raw / 2^128`, so `ONE = 2^128`. Range about ±1.7e38, 128 fractional
bits, about 38 decimal digits.

This directory holds **one hand-written file** and four generated ones.

| file | role |
|---|---|
| `FP127.yul.src` | the source of truth: Yul function bodies only |
| `FP127.yul` | generated: deployable object with a selector dispatcher |
| `FP127Lib.sol` | generated: Solidity library, one `assembly` block per op |
| `IFP127.sol` | generated: interface and custom errors of the deployed object |
| `abi.json` | generated: ABI of the deployed object |
| `FP127Caller.sol` | hand-written: thin `staticcall` harness around a deployed object |

```
make gen              # regenerate the four outputs
make gen-check        # fail if they are stale (CI runs this)
make test             # gen-check + equivalence, divergence and property tests
make test-precision   # correct bits of every op against mpmath at 100 digits
make test-legacy-yul  # the Huff-era suites, run against the Yul object
make bench            # gas for every form of every op
make size             # deployed runtime size against the 24,576-byte limit
```

## Two forms, one source

The same Yul function bodies are emitted twice.

**Deployed object.** `FP127.yul` wraps the bodies in a `switch` on the
4-byte selector. Deploy it once per chain (CREATE2 with a published salt is
the plan) and every contract that `staticcall`s it runs identical bytecode.
`FP127Caller.sol` is the minimal Solidity wrapper for that path; it bubbles
revert data unchanged.

**Inline library.** `FP127Lib.sol` puts each body, plus the transitive
closure of helpers it calls, inside a `("memory-safe")` assembly block. No
external call, no shared address, cheapest per op. This is the form Austin
Griffith and Hadrien Croubois suggested.

`test/fp127/Equivalence.t.sol` and `EquivalenceOps.t.sol` prove the two
agree on the full `int256` domain, including which inputs revert and with
what data, and prove both agree with the Huff bytecode live on Sepolia on
every input where the Huff computed a defined answer.

## Rules the source must obey

The generator (`scripts/fp127/gen.py`) rejects a source that breaks any of
these, because the inline-assembly dialect is a strict subset of Yul and
because a library must not trample its caller's memory or shadow its own
members.

1. Top level holds only comments and `function` definitions.
2. No `object`, `code`, `datacopy`, `dataoffset`, `datasize`, `codecopy`,
   `calldataload`, `calldatasize`, `return(`, `pc()`, `jump`, storage ops,
   external calls, or logs. The dispatcher and the library wrapper own
   calldata and returndata.
3. The only literal memory addresses are `0x00` and `0x20` (Solidity scratch
   space). Anything else must be `mload(0x40)`-relative.
4. Yul identifiers never start with `_`. The library wrapper names its
   Solidity parameters `_a`, `_b`, `_r` so nothing can shadow.
5. No Yul identifier may equal an export's Solidity name, since every
   assembly block shares scope with the library's members.
6. No recursion.
7. Exported functions carry `/// @export name(type a, ...) returns (type r)`.
   Parameter names in the annotation must match the Yul parameters. Helpers
   have no annotation and are not dispatched.
8. Reverts go through `rev(sel)` with a selector declared by
   `/// @error Name() 0xselector`. The generator checks every selector
   against keccak and every `rev(...)` literal against the declared list.

## ABI

Native 127.128 only. There is no `Raw` suffix and no 18-decimal flavour of
each op; `fromFixed18` and `toFixed18` are the bridge. All parameters are
`int256`. Errors are `Overflow()`, `DivisionByZero()`, `OutOfRange()`.

| op | semantics | reverts |
|---|---|---|
| `add`, `sub` | exact | `Overflow` |
| `mul(a, b)` | floor(a·b / 2^128) | `Overflow` |
| `div(a, b)` | trunc(a·2^128 / b) | `DivisionByZero`, `Overflow` |
| `fromFixed18(x)` | trunc(x·2^128 / 10^18) | `OutOfRange` if \|x\| ≥ 2^127 |
| `toFixed18(x)` | floor(x·10^18 / 2^128) | never |
| `exp(x)` | e^x; 0 below −88 | `Overflow` above 88 |
| `exp2(x)` | 2^x; 0 below −128 | `Overflow` at or above 127 |
| `exp10(x)` | 10^x | `Overflow` |
| `ln`, `log2`, `log10` | x > 0 | `OutOfRange` |
| `log2Up(x)` | ceil(log2 x), exact for powers of two | `OutOfRange` |
| `sqrt(x)` | x ≥ 0 | `OutOfRange` |
| `cbrt(x)` | all x, odd | `Overflow` only at −2^255 |
| `pow(x, y)` | x^y for x ≥ 0; 0^0 = 1; exact for y ∈ {1,2,3,4,½,¼,−1} and x ∈ {2,10} | `OutOfRange` for x < 0 |
| `inv(x)` | 1/x | `DivisionByZero`, `Overflow` |
| `abs`, `neg` | | `Overflow` at −2^255 |
| `sign`, `min`, `max`, `clamp`, `avg`, `floor`, `frac` | exact, never revert | |
| `ceil`, `round` | exact | `Overflow` at the top of the range |
| `zeroFloorSub`, `dist`, `lerp`, `hypot`, `gavg` | checked compositions | `Overflow`, `OutOfRange` |
| `gcd(a, b)` | gcd of \|floor a\|, \|floor b\| | never |
| `factorial(n)` | floor(n)! for 0 ≤ n < 34 | `OutOfRange` |
| `lambertW0(x)` | W(x) for x ≥ −1/e | `OutOfRange` |

Rounding directions are inherited from the Huff and preserved exactly:
`mul` floors because it is the middle 256 bits of the exact 512-bit two's
complement product; `div` truncates because it strips signs, divides, and
re-signs; every polynomial Horner step floors.

## Precision

`make test-precision` prints correct bits per input against mpmath at 100
decimal places. Measured on this build, relative to the result:

| op | bits | notes |
|---|---|---|
| exp, exp2, exp10 | 123 – exact | 123 at x = 80, where 2^128 ULP is coarse against e^80 |
| ln, log2, log10 | 125 – exact | 115 at ln(0.999), where the result itself is 2^-10 |
| sqrt | exact | all tested inputs bit-exact |
| cbrt | 124 – exact | via pow |
| pow | 119 – exact | 119 at 1.01^365 |
| hypot, gavg | exact | |
| lambertW0 | 118 – 130 | 118 at x = 0.001, where the result is small |

## Gas

Measured by `test/fp127/Gas.t.sol`. Columns one and two include the
`staticcall` itself (warm address) and the ABI encoding around it; the third
is `FP127Caller`, one more hop; the last is the inline library as an
internal call.

| op | Huff | Yul object | Caller | FP127Lib |
|---|---:|---:|---:|---:|
| add | 3,290 | 3,765 | 5,089 | 155 |
| sub | 3,315 | 3,787 | 5,133 | 155 |
| mul | 3,489 | 3,978 | 5,335 | 282 |
| div | 3,850 | 3,838 | 5,163 | 665 |
| fromFixed18 | 3,346 | 3,607 | 4,824 | 159 |
| toFixed18 | 3,394 | 3,659 | 4,831 | 140 |
| exp | 8,406 | 7,357 | | 4,758 |
| exp2 | 8,248 | 7,203 | | 4,793 |
| ln | 7,108 | 6,671 | | 4,106 |
| log2 | 7,081 | 7,030 | | 4,058 |
| sqrt | 6,877 | 6,221 | | 3,455 |
| cbrt | 12,853 | 6,152 | | 5,553 |
| lambertW0 | 23,621 | 35,327 | | 41,069 |

The arithmetic core costs about 400 gas more through the object than in the
previous PR because the dispatcher now has 36 cases. Transcendentals are
cheaper than the Huff. Lambert W is the one op that got dearer: two more
refinement steps buy 126+ bits where the Huff had 50 to 100.

Deployed runtime: 6,178 bytes.

## What changed from the Huff

**Guards.** The Huff had none: `add`/`sub`/`mul` wrapped, `fromFixed18` lost
its top bit above 2^127, `div` by zero returned `(|a| >> 128) * 128`
(observed live: `divRaw(2.0, 0) == 256`), `exp` above 88 and `factorial`
above 33 returned `MAX_UINT256`, `exp2(127)` wrapped to the minimum,
`log2(x ≤ 0)` returned 0, `sqrt(x < 0)` and `log2Up(x ≤ 0)` read garbage,
`lambertW0` below −1/e returned 0. The Yul reverts in every one of those
cases, and `test_divergence_*` records each old answer.

**`mul`.** Same function, different construction: the exact 512-bit product
from `mul` and `mulmod(a, b, not(0))`, corrected for signs, middle 256 bits
taken. Cheaper, and the overflow check falls out of it.

**`div`.** Was already a full-precision Bloemen `mulDiv` with a 2^128
multiplier. The old README's "~62-bit two-step chunking" described an
earlier version. Ported verbatim plus the two missing guards.

**`gcd`.** The Huff extracted integer parts with a logical shift and then
tested the sign bit of the shifted word, so negatives were mishandled. The
Yul uses an arithmetic shift and absolute values.

**`factorial`.** Computed by exact integer multiplication instead of a
34-entry jump table. Identical values.

**`lambertW0`.** Redesigned. The Huff seeded from a 64-entry interpolation
table and ran two FSC steps and an IB finisher, documented as quartic.
Measured, each FSC step in this arithmetic roughly doubles the correct bits
(7, 14, 29, 58, 117), so that recipe delivered 50 to 100 bits on (0, 64),
under 40 bits near 0, read past the table above 64 and ran out of gas below
0. The Yul seeds to five to eight bits (Winitzki's approximation for x > 0,
the origin series for −¼ < x < 0, the branch-point series down to −1/e),
runs four FSC steps and one IB step, and measures 118 to 130 bits across the
domain. W(1..5) are still exact table values. The 64-entry table is gone,
which is where most of the bytecode saving came from.

**Shortcuts.** `pow`, `cbrt` and `lambertW0` keep the exact shortcuts from
`shortcut_constants.huff`. The bytecode on Sepolia predates that file (its
W(2) is the iterated value, 3 ULP from the table), so the equivalence
suite compares those paths to the Huff within a tolerance rather than to
the bit.

## Legacy baseline and suites

`contracts/archive/huff/fp127.sepolia.runtime.hex` is the runtime bytecode
of the Huff contract at `0xfae694D0c2c44181791F838c54Ed64C3151FfE30`,
fetched at Sepolia block 11,857,616 with `make fetch-baseline`. keccak256
of the hex text: `0x74946c4dd85b8bbbab56d77d34defdf4e66ea15c0647993ea445f0b95591d10b`.

`test/fp127/LegacyShim.sol` presents the old ABI on top of the Yul object,
so the Huff-era suites run unchanged against the port with
`FP127_TARGET=yul`: 412 of 431 pass; the 19 failures are debug helpers that
only ever existed in `test_fp127.huff`. The Huff sources themselves still
live under `contracts/src/tools/huff/` until #19 retires them.
