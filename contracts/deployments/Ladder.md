# Ladder deployment record

The terminal-precision ladder (docs/benchmarks/ladder.md) is reproducible on
chain: `LadderRunner.run(scenario, form, n)` executes any cell with one
`eth_call` and returns the raw result in that library's representation,
which is what the demo page's verify button calls. The harness that
produced the committed dataset called this same code, so the two cannot
disagree; `scripts/ladder/livecap.py` re-ran every cell through the live
runner on 2026-10-07 with zero mismatches.

All six contracts were deployed with CREATE2 through the proxy
`0x4e59b44847b379578588920cA78FbF26c0B4956C` with salt `"FP127 ladder v1"`
(`0x4650313237206c61646465722076310000000000000000000000000000000000`) and are verified on Sourcify
(`exact_match`). Machine-readable copy: `Ladder.json`.

| contract | address | tx | block | gas |
|---|---|---|---:|---:|
| `LadderFP127` | `0x3a2cF1ce83e6eBCc51DBCDEA66f452378D42017E` | [`0x9b0ce2f4…`](https://sepolia.etherscan.io/tx/0x9b0ce2f477d32114a8b4c75b12b8011c81421f4b5c7fc253f0c7f42f22d074c3) | 11,859,498 | 4,259,232 |
| `LadderFP127Lib` | `0x9d40f7431CCAfbcE8E78Eae4CC30d89171A8d835` | [`0xb1776d21…`](https://sepolia.etherscan.io/tx/0xb1776d21c6dcc71563c52cd4fad6619e188c79200b743e183fd6565626951fc4) | 11,859,499 | 8,348,902 |
| `LadderABDK` | `0x3B70Ad30E629E9350A7F5Fddc3B146F0445b51b6` | [`0x62d733bc…`](https://sepolia.etherscan.io/tx/0x62d733bc67d9074a20cb86137c027880b5705131dca015c2eb401c8741a9be74) | 11,859,500 | 9,166,076 |
| `LadderSolady` | `0xdE7e3579f96b0967399922484535C599EbAB7D94` | [`0xdd032e4a…`](https://sepolia.etherscan.io/tx/0xdd032e4acf2de54454ab31c6c8ae05fd379b732a36e9343b53c6798b57eaf2bd) | 11,859,501 | 6,049,768 |
| `LadderPRB` | `0x539eA6147E7d28D3D8f155AB7C592Db269155FEe` | [`0x7e4aca0a…`](https://sepolia.etherscan.io/tx/0x7e4aca0a3e315918a6b4febaf82469590fbef56f2812c5fde967fa6d7bb494c0) | 11,859,502 | 9,955,333 |
| `LadderRunner` | `0x3FD3461EE53F9C6f2322CbB3fF97A3EdA522d4a4` | [`0x35cfe9ef…`](https://sepolia.etherscan.io/tx/0x35cfe9ef2ef62217b987910d59291224488b464e538df08b1d542d1dc4c8f5b4) | 11,859,503 | 2,400,251 |

`LadderRunner` was constructed with the five adapter addresses in that
order; `LadderFP127` staticcalls the FP127 object at
`0xA7Fb462A3733f24785a9AE8d7FbD4F87D8BC4c28`.

## Calling it

```
cast call 0x3FD3461EE53F9C6f2322CbB3fF97A3EdA522d4a4 \
  "run(uint8,uint8,uint32)(bool,int256,bytes4,uint256)" <scenario> <form> <n> \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

Scenario ids are the `index` field in `scripts/ladder/scenarios.json`
(0 compound, 1 compound-pow, 2 bonding-sqrt, 3 roundtrip, 4 amortise,
5 geo-mean, 6 black-scholes-chain, 7 cumulative-product, 8 compound-annual);
forms are 0 fp127, 1 fp127lib, 2 abdk, 3 solady, 4 prb. The returned
`bool` is false when the library reverted, with the selector in the
`bytes4`. Decode `int256` by the form's scale (2^128, 2^128, 2^64, 1e18,
1e18). The last value is gas per step.

## Live cap

Public RPCs limit `eth_call`. Cells needing more than roughly 40M gas (the
transcendental scenarios at N = 10,000) fail with a bare revert from the
runner's try/catch, because the adapter ran out of gas inside it. The
largest N that completes per cell is recorded as `liveMaxN` in
`ladder.json`; the page greys out verify above it. Anyone with their own
node can raise the cap and run every cell.

## Trust model

No storage, no owner, no upgrade path. The adapters are immutable in the
runner. A change to any scenario is a new source, new init code hashes,
new addresses and a new salt string, recorded here.

## Reproduce

```
make predict-ladder                    # the six addresses from the artifacts alone
make deploy-ladder-sepolia             # idempotent; needs DEPLOYER_KEY
make verify-ladder-sepolia             # Sourcify, plus Etherscan with ETHERSCAN_API_KEY
uv run scripts/ladder/livecap.py       # every cell through the live runner
```
