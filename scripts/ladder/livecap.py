#!/usr/bin/env python3
"""Measure how far up the ladder the public RPC's eth_call will go, and that
the live runner agrees with the committed dataset.

    uv run scripts/ladder/livecap.py [rpc]

For every scenario and form, calls LadderRunner.run(scenario, form, n) on
Sepolia for each N on the ladder, compares the raw result with
docs/benchmarks/ladder.json, and records the largest N the RPC executed as
`liveMaxN` in the JSON (the demo page greys out "verify" above it).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LADDER = ROOT / "docs" / "benchmarks" / "ladder.json"
RECORD = ROOT / "contracts" / "deployments" / "Ladder.json"
SPEC = ROOT / "scripts" / "ladder" / "scenarios.json"
DEFAULT_RPC = "https://ethereum-sepolia-rpc.publicnode.com"
FORMS = ["fp127", "fp127lib", "abdk", "solady", "prb"]


def call(rpc: str, runner: str, s: int, f: int, n: int):
    r = subprocess.run(["cast", "call", runner, "run(uint8,uint8,uint32)(bool,int256,bytes4,uint256)", str(s), str(f), str(n),
                        "--gas-limit", "1000000000", "--rpc-url", rpc], capture_output=True, text=True)
    if r.returncode != 0:
        return None, r.stderr.strip().splitlines()[-1][:120] if r.stderr.strip() else "call failed"
    ok, raw, reason, gas = [x.strip() for x in r.stdout.strip().splitlines()[:4]]
    return {"ok": ok == "true", "raw": int(raw.split()[0]), "reason": reason, "gas": int(gas.split()[0])}, None


def main(argv: list[str]) -> int:
    rpc = argv[0] if argv else DEFAULT_RPC
    runner = json.loads(RECORD.read_text())["contracts"]["LadderRunner"]["address"]
    doc = json.loads(LADDER.read_text())
    spec = {s["id"]: s["index"] for s in json.loads(SPEC.read_text())["scenarios"]}
    mismatches = 0
    for sid, scn in doc["scenarios"].items():
        live_max = {}
        for fi, form in enumerate(FORMS):
            best = 0
            for n in doc["ladder"]:
                cell = scn["libraries"].get(form, {}).get(str(n))
                if cell is None:
                    continue
                res, err = call(rpc, runner, spec[sid], fi, n)
                if res is None:
                    print(f"{sid:20} {form:9} N={n:<6} RPC refused: {err}")
                    break
                if cell.get("reverted"):
                    agree = not res["ok"] and res["reason"] == cell["reason"]
                else:
                    agree = res["ok"] and str(res["raw"]) == cell["raw"]
                    if not res["ok"] and res["reason"] == "0x00000000":
                        # The adapter ran out of gas inside the runner's try/catch:
                        # the RPC's eth_call gas cap, not a disagreement.
                        print(f"{sid:20} {form:9} N={n:<6} out of gas at the RPC cap (needs about {cell['gas'] * n:,})")
                        break
                if not agree:
                    mismatches += 1
                    print(f"{sid:20} {form:9} N={n:<6} MISMATCH live={res} committed={cell.get('raw', 'reverted')}")
                    break
                best = n
            live_max[form] = best
            print(f"{sid:20} {form:9} liveMaxN={best}")
        scn["liveMaxN"] = live_max
    doc["liveRunner"] = runner
    doc["liveNote"] = "liveMaxN is the largest N on the ladder that the public Sepolia RPC's eth_call completed for that cell. Above it the runner reports a bare revert because the adapter ran out of gas under the RPC's eth_call limits (measured: calls needing more than about 40M gas, or a few seconds of execution, fail); the demo page greys out verify above it."

    LADDER.write_text(json.dumps(doc, indent=1) + "\n")
    print(f"updated {LADDER.relative_to(ROOT)}; mismatches: {mismatches}")
    return 1 if mismatches else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
