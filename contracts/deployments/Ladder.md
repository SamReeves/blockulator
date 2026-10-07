# Ladder deployment record

The terminal-precision ladder (docs/benchmarks/ladder.md) is reproducible on
chain: `LadderRunner.run(scenario, form, n, p)` executes any cell with one
`eth_call`, where `p` is the input's parameters floored into that library's
representation (scripts/ladder/inputs.json, served at /data/ladder-inputs.json),
and returns the raw result in that representation plus the gas the scenario
consumed inside the adapter. The harness that produced the committed dataset
called this same code, so the two cannot disagree; `scripts/ladder/livecap.py`
re-runs every cell of every input through the live runner and records the
largest N the public RPC completes.

Version 2 (parameters in calldata, gas measured inside the adapter, 64 inputs)
is deployed with CREATE2 through the proxy
`0x4e59b44847b379578588920cA78FbF26c0B4956C` with salt `"FP127 ladder v2"`
(`0x4650313237206c61646465722076320000000000000000000000000000000000`).
Machine-readable copy: `Ladder.json`. Deployed 2026-10-07 by `make deploy-ladder-sepolia`.

| contract | address | tx | block | gas |
|---|---|---|---:|---:|
| `LadderFP127` | `0x7D7fe7F94C1eD74a86929253c793e6E1B402245D` | [`0x306b8dbc…`](https://sepolia.etherscan.io/tx/0x306b8dbc2367bdb2a23767cd2b4ca1e75be546d0274f39450b7ec2d13f5d38cb) | 11,860,435 | 4,103,006 |
| `LadderFP127Lib` | `0xeD61E01B4096ebA5D0795ef8Dd3a7037035827A9` | [`0x01cc72b1…`](https://sepolia.etherscan.io/tx/0x01cc72b1277f0376fe6487ddd06e095c829e6c221ec8263ab6446607f3d9055a) | 11,860,436 | 8,192,686 |
| `LadderABDK` | `0x7709b29Fb84b03e9E74E3c843256d4Ed9a57b980` | [`0x63032f2c…`](https://sepolia.etherscan.io/tx/0x63032f2ccd96a158205af6d84b480d08ded7324a8ce5aec2d0df9379ba558d28) | 11,860,437 | 9,120,028 |
| `LadderSolady` | `0xC75E4DEcBC9bBf13e6F2f9Dd674Ac1FFA738d17C` | [`0x79f7bd82…`](https://sepolia.etherscan.io/tx/0x79f7bd82470f92fbcc01ccaa88a1fe9b85964adbcf2a751c535e35922ed12850) | 11,860,438 | 5,935,658 |
| `LadderPRB` | `0xdD3407E027459cB1ec05947f1Fa5Ab9857312453` | [`0x5660386d…`](https://sepolia.etherscan.io/tx/0x5660386d91521eda60cd263257134f51eefa7834406ba8bc4457bbc68a54c47f) | 11,860,439 | 9,844,315 |
| `LadderRunner` | `0x2d741eC5d66D7559857da1c398AE384A389DdE17` | [`0x407e7587…`](https://sepolia.etherscan.io/tx/0x407e758766ef7b1aa64875ae24607fcbf8cd8ddf435cb21bf2362119f71ca607) | 11,860,440 | 2,644,656 |

`LadderRunner` is constructed with the five adapter addresses in that
order; `LadderFP127` staticcalls the FP127 object at
`0xA7Fb462A3733f24785a9AE8d7FbD4F87D8BC4c28`.

The version 1 contracts (salt `"FP127 ladder v1"`, runner
`0x3FD3461EE53F9C6f2322CbB3fF97A3EdA522d4a4`, `run(uint8,uint8,uint32)` with
the parameters compiled in) remain on Sepolia and still answer for the v1
dataset, which is in the repository history up to the ladder-inputs merge.

## Calling it

```
cast call 0x2d741eC5d66D7559857da1c398AE384A389DdE17 \
  "run(uint8,uint8,uint32,int256[])(bool,int256,bytes4,uint256,uint256)" \
  <scenario> <form> <n> "[<p0>,<p1>,...]" \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

Scenario ids are the `index` field in `scripts/ladder/scenarios.json`
(0 compound, 1 compound-pow, 2 bonding-sqrt, 3 roundtrip, 4 amortise,
5 geo-mean, 6 black-scholes-chain, 7 cumulative-product, 8 compound-annual);
forms are 0 fp127, 1 fp127lib, 2 abdk, 3 solady, 4 prb. `p` is the input's
`fp127`, `abdk` or `wad` array from `scripts/ladder/inputs.json` (forms 0 and
1 take `fp127`, 2 takes `abdk`, 3 and 4 take `wad`), in the scenario's
`order`. The returned `bool` is false when the library reverted, with the
selector in the `bytes4`; `BadParamCount` and `ParamOutOfRange` are the
adapter's own errors for a wrong-length or out-of-range `p`. Decode `int256`
by the form's scale (2^128, 2^128, 2^64, 1e18, 1e18). The last two values
are gas per step and total gas, measured inside the adapter around the
scenario function.

Example, the headline cell (compound, reference input, FP127, N = 365):

```
cast call 0x2d741eC5d66D7559857da1c398AE384A389DdE17 \
  "run(uint8,uint8,uint32,int256[])(bool,int256,bytes4,uint256,uint256)" 0 0 365 \
  "[3402823669209384634633746074317682114560000,93228045731763962592705371899114578]" \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

## Live cap

Public RPCs limit `eth_call`. Cells needing more than roughly 40M gas (the
transcendental scenarios at N = 10,000) fail with a bare revert from the
runner's try/catch, because the adapter ran out of gas inside it. The
largest N that completes for every input of a form is recorded as
`liveMaxN` in `ladder.json`; the page greys out verify above it. Anyone with
their own node can raise the cap and run every cell.

## Trust model

No storage, no owner, no upgrade path. The adapters are immutable in the
runner. A change to any scenario is a new source, new init code hashes,
new addresses and a new salt string, recorded here.

## Reproduce

```
make predict-ladder            # the addresses above, from the current source
make deploy-ladder-sepolia     # DEPLOYER_KEY in the environment; skips what is deployed
make verify-ladder-sepolia     # Sourcify (and Etherscan with ETHERSCAN_API_KEY)
uv run scripts/ladder/livecap.py   # every cell of every input against the live runner
```
