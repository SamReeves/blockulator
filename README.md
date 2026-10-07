# Blockulator

High-precision on-chain math for the EVM, plus a frontend that calls the
deployed contracts for every calculation it shows.

Live at [blockulator.com](https://blockulator.com) (Sepolia).

---

## FP127: 127.128 fixed point in one Yul source

The headline work in this repo is **FP127**, a signed 127.128 fixed-point
math library for the EVM. One Yul source, `contracts/src/fp127/FP127.yul.src`,
generates two forms that are proven to agree bit for bit:

- a **deployed object** (`FP127.yul`) that any contract can `staticcall`,
  at a CREATE2 address with a published salt:
  `0xA7Fb462A3733f24785a9AE8d7FbD4F87D8BC4c28` on Sepolia
  ([deployment record](contracts/deployments/FP127.md));
- an **inline library** (`FP127Lib.sol`) with the same bodies in
  `memory-safe` assembly blocks, for contracts that want no external call.

37 operations: `add`, `sub`, `mul`, `div`, `exp`, `exp2`, `exp10`, `ln`,
`log2`, `log10`, `sqrt`, `cbrt`, `pow`, `lambertW0`, `lambertWm1`, and the
usual rounding, comparison and conversion ops. Every argument and result
is an `int256` holding `value * 2^128`.

- 128 fractional bits, about 38 decimal digits, against 18 for WAD libraries
- Integer and rounding ops bit-exact; transcendentals 115 to 130 correct bits
  against mpmath at 200 decimal places ([`docs/fp127/precision.md`](docs/fp127/precision.md))
- Checked: out-of-domain inputs revert with `Overflow()`, `DivisionByZero()`
  or `OutOfRange()`
- Gas ladder against ABDKMath64x64, Solady and PRBMath for every op
  ([`docs/benchmarks/gas.md`](docs/benchmarks/gas.md))

**EthCC[9] talk:** https://www.youtube.com/watch?v=a_tL99NY-yc

**Library README:** [`contracts/src/fp127/README.md`](contracts/src/fp127/README.md)
(layout, source rules, rounding policy, what changed from the Huff)
**History:** [`docs/fp127/HISTORY.md`](docs/fp127/HISTORY.md)
**Tests:** [`test/fp127/`](test/fp127/)

FP127 was first written in Huff; that implementation is archived under
[`contracts/archive/huff/`](contracts/archive/huff/) and its Sepolia
bytecode is the baseline the equivalence suites still compare against.

---

## What else is in the repo

The frontend at blockulator.com is a vanilla-JS SPA that exercises the
deployed contracts directly. There is no client-side math; every result
is an `eth_call` to a contract on Sepolia.

- **21 on-chain calculators** that read from deployed Vyper math contracts:
  π, e, τ, sin, cos, atan, √, 2^x, 10^x, e^x, ln, log₂, log₁₀, erf, Φ, φ,
  n!, ln(n!), C(n,k), z-score, Gaussian tail, sinh, cosh, tanh, gcd/lcm.
- **On-chain games** on Sepolia (King of the Hill, Dice Gods, Last Call,
  Time to Make the Donuts, Pay-It-Forward, and a few others), live examples
  of contracts that call the math library.
- **A small futures market** with linear, exponential, Gaussian and uniform
  payouts.

The games and markets are not the point of the project. They exist because
the math library needed real callers.

---

## Layout

```
blockulator/
├── contracts/
│   ├── src/fp127/                   # FP127: FP127.yul.src and the generated files
│   ├── src/tools/{math,trig,constants}/  # Vyper math contracts
│   ├── src/games/, src/market/      # Game and market contracts
│   ├── archive/huff/                # The Huff implementation and its Sepolia bytecode
│   ├── deployments/FP127.md         # CREATE2 deployment record
│   └── build/abis/                  # Committed ABIs for the Vyper contracts
├── script/DeployFP127.s.sol         # CREATE2 deploy script
├── scripts/fp127/                   # generator, mpmath oracle, verification tooling
├── test/fp127/                      # equivalence, behaviour, precision, gas ladder
├── docs/fp127/                      # precision tables, history
├── docs/benchmarks/                 # gas ladder tables
├── js/, css/, index.html            # Frontend (SPA)
└── vendor/sdr/lib/                  # Vendored design tokens
```

---

## Build and test

Needs `forge` (solc 0.8.24 is installed on first build) and `uv`. No Huff
toolchain, no ffi.

```bash
git submodule update --init --recursive   # solady, prb-math, abdk, forge-std
uv sync                                   # mpmath + keccak for the oracle and generator

make gen           # regenerate FP127.yul, FP127Lib.sol, IFP127.sol, abi.json
make test          # gen-check + vectors-check + equivalence, behaviour, precision suites
make bench         # gas ladder: Huff baseline, Yul object, FP127Lib, ABDK, Solady, PRBMath
make size          # runtime bytes against the 24,576 limit
make predict       # the CREATE2 address of the current object
```

Precision against mpmath uses committed vectors (`test/fp127/vectors/`),
regenerated with `make vectors`. The Huff baseline is the runtime bytecode
fetched from Sepolia (`make fetch-baseline`).

Deploying and verifying a new version: `make deploy-sepolia`,
`make verify-sepolia`, `make smoke-sepolia`; the procedure is in
[`contracts/deployments/FP127.md`](contracts/deployments/FP127.md).

For the frontend, no build step:

```bash
python3 -m http.server 8000
```

## Design tokens

Styling uses tokens vendored from a separate design system in `vendor/sdr/`.
Run `scripts/sync-sdr.sh` to refresh from upstream. Literal hex colors and
`rgb()`/`rgba()` outside `css/tokens.css` and `js/theme/sdr-palette.js` are
rejected by `deno task test` (`scripts/check-sdr-colors.mjs`).

---

## License

MIT.
