# Blockulator

High-precision on-chain math for the EVM, plus a frontend that calls the deployed contracts for every calculation it shows.

Live at [blockulator.com](https://blockulator.com) (Sepolia).

---

## FP127 — 128-bit fixed-point in pure Huff

The headline work in this repo is **FP127**, a 127.128 signed fixed-point math library for the EVM. It's deployed as a single callable contract that other contracts can `staticcall` for `mul`, `div`, `exp`, `ln`, `sqrt`, `pow`, `log2`, `log10`, `exp2`, `exp10`, `lambertW0`, plus the usual rounding and comparison ops. 34 operations total.

- Signed 127.128, two's complement, fits in one `uint256` word
- ~38 decimal digits of fractional precision (vs ~18 for WAD-style libraries)
- Validated against Python `mpmath` at 100 decimal places
- Fuzz-tested across the full input domain; benchmarked head-to-head against ABDKMath64x64, Solady WAD, and PRBMath
- Gas: add ~50, mul 1,027, div 518 (cheaper than Solady), exp ~21k, ln ~41k

**EthCC[9] talk:** https://www.youtube.com/watch?v=a_tL99NY-yc

**Deep dive:** [`docs/fp127/README_FIXEDPOINT127.md`](docs/fp127/README_FIXEDPOINT127.md)

**Sources:** [`contracts/src/tools/huff/fp127/`](contracts/src/tools/huff/fp127/)
**Tests:** [`test/fp127/`](test/fp127/)
**Generators:** [`scripts/fp127/generators/`](scripts/fp127/generators/)
**Benchmarks and fuzz scatter plots:** [`docs/benchmarks/`](docs/benchmarks/)

---

## What else is in the repo

The frontend at blockulator.com is a vanilla-JS SPA that exercises the deployed contracts directly. There's no client-side math anywhere; every result is an `eth_call` to a contract on Sepolia.

- **21 on-chain calculators** that read from deployed math contracts: π, e, τ, sin, cos, atan, √, 2^x, 10^x, e^x, ln, log₂, log₁₀, erf, Φ, φ, n!, ln(n!), C(n,k), z-score, Gaussian tail, sinh, cosh, tanh, gcd/lcm.
- **A handful of on-chain games** on Sepolia (King of the Hill, Dice Gods, Last Call, Time to Make the Donuts, Pay-It-Forward, and a few others) used as live examples of contracts that call the math library.
- **A small futures market** with linear, exponential, Gaussian, and uniform payouts, demonstrating the math library in a pricing context.

The games and markets are not the point of the project. They exist because the math library needed real callers to exercise it end-to-end.

---

## Architecture

- **Contracts.** Huff for FP127. Vyper for the higher-level calculator and game contracts. Solidity wrappers in `contracts/src/bench/` for benchmarking against ABDKMath, Solady, and PRBMath.
- **Frontend.** Vanilla JS, no build step, hash-based SPA routing. `index.html` loads design tokens from `vendor/sdr/lib/`, then `css/main.css`, then ES modules from `js/`.
- **Tests.** Foundry for Solidity/Huff. Node scripts for end-to-end contract integration. Python with `mpmath` for precision oracles.

```
blockulator/
├── contracts/
│   ├── src/
│   │   ├── tools/huff/fp127/        # FP127 (Huff)
│   │   ├── tools/{math,trig,constants}/  # Vyper math contracts
│   │   ├── games/                   # Game contracts
│   │   ├── market/                  # Futures market contracts
│   │   └── bench/                   # Wrappers for benchmark tests
│   ├── build/abis/                  # Committed ABIs
│   └── deployments/                 # Deployment scripts
├── test/fp127/                      # Foundry tests for FP127
├── scripts/fp127/generators/        # Constants and lookup-table generators
├── docs/fp127/                      # FP127 documentation
├── docs/benchmarks/                 # Fuzz scatter plots, precision data
├── js/                              # Frontend (SPA)
├── css/                             # Stylesheets
├── vendor/sdr/lib/                  # Vendored design tokens + particles
└── index.html                       # SPA entry point
```

---

## Build and test

FP127 is being ported from Huff to a single Yul source that generates both a
deployable object and an inlinable Solidity library. See
[`contracts/src/fp127/README.md`](contracts/src/fp127/README.md) for the
layout, the rules, and the gas table. Progress is tracked on the
[project board](https://github.com/users/SamReeves/projects/2).

```bash
git submodule update --init --recursive   # solady, prb-math, abdk, forge-std
uv sync                                   # mpmath + keccak for the oracle and generator

make gen-check   # generated FP127 files are current
make test        # FP127 equivalence, divergence and property tests
make bench       # gas: Huff baseline vs Yul object vs inline library
make bench       # gas ladder: Huff, Yul object, FP127Lib, ABDK, Solady, PRBMath
```

The Huff baseline used by the tests is the runtime bytecode fetched from
Sepolia (`make fetch-baseline`); no `huffc` is needed. Precision against
mpmath uses committed vectors (`test/fp127/vectors/`), so `make test` needs
no ffi. Results: [`docs/fp127/precision.md`](docs/fp127/precision.md) and
[`docs/benchmarks/gas.md`](docs/benchmarks/gas.md).

For the frontend, no build step:

```bash
python3 -m http.server 8000
```

## Design tokens

Styling uses tokens vendored from a separate design system in `vendor/sdr/`. Run `scripts/sync-sdr.sh` to refresh from upstream.

Literal hex colors and `rgb()`/`rgba()` outside `css/tokens.css` and `js/theme/sdr-palette.js` are rejected by `npm test` (`scripts/check-sdr-colors.mjs`).

---

## License

MIT.
