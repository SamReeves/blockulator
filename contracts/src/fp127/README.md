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
make vectors          # regenerate the mpmath vectors in test/fp127/vectors/
make vectors-check    # fail if they are stale (CI runs this)
make test             # gen-check + vectors-check + equivalence, behaviour, precision
make precision-report # docs/fp127/precision.md from the last test run
make bench            # gas ladder for every op and form -> docs/benchmarks/
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
every input where the Huff computed a defined answer. `Behaviour.t.sol`
holds the known values, identities and shortcut-dispatch checks a reader
can verify by hand; `Precision.t.sol` holds the oracle comparison.

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

`make test` runs every op over the committed mpmath vectors in
`test/fp127/vectors/` (generated by `scripts/fp127/oracle.py`, which uses
exact integer arithmetic for the integer ops and mpmath at 200 digits for
the rest, with the same rounding and domain as the Yul) and writes
[`docs/fp127/precision.json`](../../../docs/fp127/precision.json);
`make precision-report` renders
[`docs/fp127/precision.md`](../../../docs/fp127/precision.md). Every
integer op is bit-exact. Transcendentals hold 115 bits or better at every
tested input, most of them exact. The one place precision is structurally
lower is Lambert W at the branch point −1/e, where the function has infinite
slope and one ULP of input resolution limits any answer to about 63 bits.

## Gas

`make bench` runs `test/fp127/GasLadder.t.sol` over an input ladder per op
and writes [`docs/benchmarks/gas.json`](../../../docs/benchmarks/gas.json)
and [`docs/benchmarks/gas.md`](../../../docs/benchmarks/gas.md), with the
Huff baseline, the Yul object, `FP127Caller`, `FP127Lib`, and ABDK, Solady
and PRBMath side by side. The Yul object costs about the same as the Huff
through a `staticcall`; the inline library removes the call overhead.
Lambert W is the one op that got dearer, buying 126+ bits where the Huff had
50 to 100.

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

## Legacy baseline

`contracts/archive/huff/fp127.sepolia.runtime.hex` is the runtime bytecode
of the Huff contract at `0xfae694D0c2c44181791F838c54Ed64C3151FfE30`,
fetched at Sepolia block 11,857,616 with `make fetch-baseline`. keccak256
of the hex text: `0x74946c4dd85b8bbbab56d77d34defdf4e66ea15c0647993ea445f0b95591d10b`.
The equivalence suites etch it, so no Huff toolchain is needed. The Huff
sources still live under `contracts/src/tools/huff/` until #19 retires them;
the Huff-era test suites were replaced by the files above.
