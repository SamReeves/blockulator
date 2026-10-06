# Benchmarks

## Current

- [`gas.md`](gas.md) / [`gas.json`](gas.json): gas for every FP127 op across an input ladder, for the Huff baseline (Sepolia bytecode, `staticcall`), the Yul object (`staticcall`), `FP127Caller`, `FP127Lib` (inline), and ABDKMath64x64, Solady and PRBMath SD59x18 as internal library calls on the same inputs. Produced by `make bench` from `test/fp127/GasLadder.t.sol` via `scripts/fp127/gas_to_json.py`. The `versions` block in the JSON names the exact library tags and the FP127 commit measured.
- [`../fp127/precision.md`](../fp127/precision.md) / [`../fp127/precision.json`](../fp127/precision.json): correct bits of every op against mpmath at 200 digits over the committed vectors in `test/fp127/vectors/`. Produced by `make test` (`test/fp127/Precision.t.sol`) and `make precision-report`.

Library versions benchmarked on 2026-10-06: Solady v0.1.26 (latest release), PRBMath v4.2.0 (latest release), ABDKMath64x64 v3.2 (unchanged since 2023). To rerun after a bump, update the submodule, then `make bench`.

The competitor columns measure gas only. Their precision is bounded by their representation (about 60 fractional bits for WAD, 64 for ABDK) and will be shown next to FP127's on the terminal-precision ladder (project issue #23), not here.

## Huff-era artefacts

`fuzz_data.txt`, `precision_distribution.json`, `fuzz_*.png` and `fuzz_boxplots.png` were produced by the Huff-era fuzz benches, which have been deleted. They are kept only because `js/application/benchmark-app.js` still reads `precision_distribution.json`; they go when the site rewrite replaces that page.
