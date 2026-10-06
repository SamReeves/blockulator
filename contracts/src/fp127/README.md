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
make gen          # regenerate the four outputs
make gen-check    # fail if they are stale (CI runs this)
make test         # gen-check + equivalence and property tests
make bench        # gas for every form of every op
make size         # deployed runtime size against the 24,576-byte limit
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

`test/fp127/Equivalence.t.sol` proves the two agree on the full `int256`
domain, including which inputs revert and with what data, and proves both
agree with the Huff bytecode live on Sepolia on every input where the Huff
did not wrap.

## Rules the source must obey

The generator (`scripts/fp127/gen.py`) rejects a source that breaks any of
these, because the inline-assembly dialect is a strict subset of Yul and
because a library must not trample its caller's memory.

1. Top level holds only comments and `function` definitions.
2. No `object`, `code`, `datacopy`, `dataoffset`, `datasize`, `codecopy`,
   `calldataload`, `calldatasize`, `return(`, `pc()`, `jump`, storage ops,
   external calls, or logs. The dispatcher and the library wrapper own
   calldata and returndata.
3. The only literal memory addresses are `0x00` and `0x20` (Solidity scratch
   space). Anything else must be `mload(0x40)`-relative.
4. Yul identifiers never start with `_`. The library wrapper names its
   Solidity parameters `_a`, `_b`, `_r` so nothing can shadow.
5. No recursion.
6. Exported functions carry `/// @export name(type a, ...) returns (type r)`.
   Parameter names in the annotation must match the Yul parameters. Helpers
   have no annotation and are not dispatched.
7. Reverts go through `rev(sel)` with a selector declared by
   `/// @error Name() 0xselector`. The generator checks every selector
   against keccak and every `rev(...)` literal against the declared list.

## ABI

Native 127.128 only. There is no `Raw` suffix and no 18-decimal flavour of
each op; `fromFixed18` and `toFixed18` are the bridge. All parameters are
`int256`. Errors are `Overflow()`, `DivisionByZero()`, `OutOfRange()`.

| op | semantics | rounding | reverts |
|---|---|---|---|
| `add(a, b)` | a + b | exact | `Overflow` |
| `sub(a, b)` | a − b | exact | `Overflow` |
| `mul(a, b)` | a·b / 2^128 | floor (toward −∞) | `Overflow` |
| `div(a, b)` | a·2^128 / b | truncate (toward 0) | `DivisionByZero`, `Overflow` |
| `fromFixed18(x)` | x·2^128 / 10^18 | truncate | `OutOfRange` if \|x\| ≥ 2^127 |
| `toFixed18(x)` | x·10^18 / 2^128 | floor | never |

Rounding directions are inherited from the Huff and preserved exactly.
`mul` floors because it is the middle 256 bits of the exact 512-bit two's
complement product; `div` truncates because it strips signs, divides, and
re-signs.

## What changed from the Huff

The Huff had no guards: `add`, `sub`, `mul` wrapped mod 2^256,
`fromFixed18` lost its top bit above 2^127, and `div` by zero returned
`(|a| >> 128) * 128` (observed live: `divRaw(2.0, 0) == 256`). The Yul
reverts in every one of those cases. Everything else is bit-identical, and
`test_divergence_*` in the equivalence suite records each change with the
Huff's old answer.

`mul` is implemented differently but computes the same function. The Huff
used a 4-term schoolbook split on 128-bit halves. The Yul forms the exact
512-bit product with `mul` and `mulmod(a, b, not(0))`, corrects the high word
for signs, and takes the middle 256 bits. That is cheaper and gives the
overflow check for free: the high word must be the sign extension of the
result.

`div` was already a full-precision Bloemen `mulDiv` with a 2^128 multiplier
in the Huff. The old README's "~62-bit two-step chunking" text described an
earlier version and was wrong about the deployed code. The Yul ports the
mulDiv verbatim and adds the two guards it was missing.

## Gas

Measured by `test/fp127/Gas.t.sol` on π × e style inputs. The first three
columns include the `staticcall` itself (warm address) and the Solidity
ABI encoding around it, which is what an integrating contract pays. The
last column is the inline library as an internal call.

| op | Huff (staticcall) | Yul object (staticcall) | FP127Caller | FP127Lib (inline) |
|---|---:|---:|---:|---:|
| add | 3,290 | 3,347 | 4,671 | 155 |
| sub | 3,315 | 3,369 | 4,715 | 155 |
| mul | 3,489 | 3,491 | 4,848 | 282 |
| div | 3,850 | 3,683 | 5,008 | 677 |
| fromFixed18 | 3,346 | 3,233 | 4,450 | 159 |
| toFixed18 | 3,394 | 3,241 | 4,413 | 128 |

The Yul object costs the same as the Huff to within noise, with checks
added. The inline library removes the call overhead entirely, which is the
whole argument for shipping it.

Deployed runtime: 519 bytes for these six ops.

## Legacy baseline

`contracts/archive/huff/fp127.sepolia.runtime.hex` is the runtime bytecode
of the Huff contract at `0xfae694D0c2c44181791F838c54Ed64C3151FfE30`,
fetched at Sepolia block 11,857,616 with `make fetch-baseline`. keccak256
of the hex text: `0x74946c4dd85b8bbbab56d77d34defdf4e66ea15c0647993ea445f0b95591d10b`.
Tests etch it, so no Huff toolchain is needed to run the comparison. The
Huff sources themselves still live under `contracts/src/tools/huff/` until
the port is complete.
