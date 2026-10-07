#!/usr/bin/env python3
"""Build docs/benchmarks/ladder.json and ladder.md from the harness output.

    forge test --match-path "test/ladder/*" -vv | uv run scripts/ladder/ladder.py
    forge test --match-path "test/ladder/*" -vv | uv run scripts/ladder/ladder.py --check

Input lines (test/ladder/Ladder.t.sol):
    LADDER|<scenario>|<form>|<N>|<ok 0/1>|<raw int>|<reason bytes4>|<gasPerStep>

For every scenario and N the truth is the same loop run in exact real
arithmetic with mpmath at 200 digits, from the parameters in
scenarios.json. Each raw value is decoded by its form's scale and compared:
    digits  correct leading significant digits, floor(-log10(|v - t| / |t|)),
            60 (the cap) when v == t
    relErr  |v - t| / |t|
    ulp     |v - t| in units of the form's last place
`--check` ignores the generated date and the fp127 commit and fails if the
rest of the JSON differs from the committed file.
"""
from __future__ import annotations

import json
import sys
from fractions import Fraction
from pathlib import Path

from mpmath import mp, mpf, log, exp, sqrt, nstr, floor as mfloor_

mp.dps = 200
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "fp127"))
sys.path.insert(0, str(ROOT / "scripts" / "ladder"))
from gas_to_json import versions  # noqa: E402
from gen_params import resolve  # noqa: E402

SPEC = ROOT / "scripts" / "ladder" / "scenarios.json"
OUT_JSON = ROOT / "docs" / "benchmarks" / "ladder.json"
OUT_MD = ROOT / "docs" / "benchmarks" / "ladder.md"
DIGITS_CAP = 60
SIG = 42  # significant digits kept for value/truth strings


# ---------------------------------------------------------------------------
# Truth: the scenario loops in exact real arithmetic
# ---------------------------------------------------------------------------

def truth(scn: dict, n: int):
    p = resolve(scn)
    sid = scn["id"]
    if sid in ("compound", "compound-annual"):
        return p["principal"] * (1 + p["rate"]) ** n
    if sid == "compound-pow":
        return p["principal"] * (1 + p["rate"]) ** n
    if sid == "bonding-sqrt":
        s, cost = p["supply"], mpf(0)
        for _ in range(n):
            cost += sqrt(s)
            s += p["unit"]
        return cost
    if sid == "roundtrip":
        return p["x0"]
    if sid == "amortise":
        b, g, pay = p["principal"], 1 + p["rate"], p["payment"]
        for _ in range(n):
            b = b * g - pay
        return b
    if sid == "geo-mean":
        return (mpf(n + 2) / 2) ** (mpf(1) / n)
    if sid == "black-scholes-chain":
        S, K, sig, T, r, tick = (p[k] for k in ("spot", "strike", "sigma", "T", "r", "tick"))
        drift = (r + sig * sig / 2) * T
        denom = sig * sqrt(T)
        acc = mpf(0)
        for _ in range(n):
            acc += (log(S / K) + drift) / denom
            S += tick
        return acc
    if sid == "cumulative-product":
        e = p["eps"]
        odd = (n + 1) // 2
        even = n // 2
        return (1 + e) ** odd * (1 - e) ** even
    raise KeyError(sid)


# ---------------------------------------------------------------------------
# Decoding and metrics
# ---------------------------------------------------------------------------

def scale_of(expr: str) -> int:
    base, exp_ = expr.split("**")
    return int(base) ** int(exp_)


def metrics(raw: int, scale: int, t):
    v = mpf(raw) / scale
    if t == 0:
        err = abs(v)
        rel = None
    else:
        err = abs(v - t)
        rel = err / abs(t)
    if err == 0:
        digits = DIGITS_CAP
    elif rel is None:
        digits = 0
    else:
        digits = max(0, int(mfloor_(-log(rel, 10))))
        digits = min(digits, DIGITS_CAP)
    return {
        "value": nstr(v, SIG),
        "digits": digits,
        "exact": digits >= DIGITS_CAP,
        "relErr": None if rel is None else float(nstr(rel, 6)),
        "ulp": float(nstr(err * scale, 6)),
    }


def parse_lines(stream) -> dict:
    cells: dict = {}
    for line in stream:
        if "LADDER|" not in line:
            continue
        parts = line[line.index("LADDER|"):].strip().split("|")
        if len(parts) != 8:
            continue
        _, scn, form, n, ok, raw, reason, gas = parts
        cells.setdefault(scn, {}).setdefault(form, {})[int(n)] = {
            "ok": ok == "1", "raw": int(raw), "reason": reason[:10], "gas": int(gas),
        }
    return cells


def build(cells: dict) -> dict:
    spec = json.loads(SPEC.read_text())
    scales = {f: scale_of(v["scale"]) for f, v in spec["forms"].items()}
    out_scn = {}
    for scn in spec["scenarios"]:
        sid = scn["id"]
        if sid not in cells:
            continue
        ns = sorted({n for form in cells[sid].values() for n in form})
        truths = {n: truth(scn, n) for n in ns}
        libs = {}
        for form in spec["forms"]:
            col = {}
            for n in ns:
                c = cells[sid].get(form, {}).get(n)
                if c is None:
                    continue
                if not c["ok"]:
                    col[str(n)] = {"reverted": True, "reason": c["reason"], "gas": c["gas"]}
                    continue
                m = metrics(c["raw"], scales[form], truths[n])
                m["raw"] = str(c["raw"])
                m["gas"] = c["gas"]
                col[str(n)] = m
            libs[form] = col
        out_scn[sid] = {
            "title": scn["title"], "step": scn["step"], "result": scn["result"], "why": scn["why"],
            "demo": scn["demo"], "params": scn.get("params", {}), "derived": scn.get("derived", {}),
            "resolved": {k: nstr(v, SIG) for k, v in resolve(scn).items()},
            "truth": {str(n): nstr(truths[n], SIG) for n in ns},
            "libraries": libs,
        }
    return {
        "generated": __import__("datetime").date.today().isoformat(),
        "description": "Terminal precision: each scenario is N identical steps run through each library in its native representation, against the same loop in exact arithmetic (mpmath, 200 digits). digits = correct leading significant digits (60 = bit-identical to the rounded truth, i.e. exact); gas = per step, measured through LadderRunner and including the amortised call overhead.",
        "versions": versions(),
        "ladder": spec["ladder"],
        "forms": spec["forms"],
        "digitsCap": DIGITS_CAP,
        "scenarios": out_scn,
    }


def short(s: str) -> str:
    return nstr(mpf(s), 16)


def render_md(doc: dict) -> str:
    forms = list(doc["forms"])
    L = ["# Terminal precision ladder", "",
         f"Generated {doc['generated']} by `make ladder`. Versions: " + ", ".join(f"{k} {v}" for k, v in doc["versions"].items()) + ".", "",
         f"Each cell is correct significant digits / gas per step. Digits are leading significant digits of the decoded result that agree with the truth; `exact` means agreement to {doc['digitsCap']} digits, which for a WAD library means the truth happened to be representable. `reverts` gives the revert selector (`0x00000000` is a bare `require`). Gas is per step through LadderRunner, so the external-call overhead is amortised over N and the N = 1 column carries it in full. Full-precision values are in ladder.json.", ""]
    for sid, s in doc["scenarios"].items():
        L += [f"## {sid}: {s['title']}", "", f"Step: `{s['step']}`. Result: {s['result']}.", "", s["why"], ""]
        if s["resolved"]:
            L += ["Parameters: " + ", ".join(f"{k} = {v if len(v) < 24 else v[:24] + '…'}" for k, v in s["resolved"].items()), ""]
        L += ["| N | truth | " + " | ".join(forms) + " |", "|---:|---|" + "---:|" * len(forms)]
        for n, t in s["truth"].items():
            cells = []
            for f in forms:
                c = s["libraries"].get(f, {}).get(n)
                if c is None:
                    cells.append("—")
                elif c.get("reverted"):
                    cells.append(f"reverts `{c['reason']}`")
                else:
                    cells.append(("exact" if c["exact"] else str(c["digits"])) + f" / {c['gas']:,}")
            L.append(f"| {n} | `{short(t)}` | " + " | ".join(cells) + " |")
        L.append("")
    ca = doc["scenarios"].get("compound-annual")
    if ca and "10" in ca["truth"]:
        L += ["## README claim check", "",
              "The Huff-era README asserted \"$25,937.42 true vs $25,932.38 Solady\" for ten years of 10% annual compounding on $10,000 with no source. From this dataset (`compound-annual`, N = 10):", "",
              "| form | value | digits |", "|---|---|---:|", f"| truth | `{ca['truth']['10']}` | |"]
        for f in forms:
            c = ca["libraries"][f].get("10", {})
            if c.get("reverted"):
                L.append(f"| {f} | reverts | |")
            else:
                L.append(f"| {f} | `{c['value']}` | {'exact' if c['exact'] else c['digits']} |")
        L.append("")
    return "\n".join(L)


def strip_volatile(doc: dict) -> dict:
    """The part of the document that must be reproducible anywhere: the data.
    The date and the tool versions (forge build, FP127 commit) are not."""
    d = json.loads(json.dumps(doc))
    return {k: d.get(k) for k in ("ladder", "forms", "digitsCap", "scenarios")}


def first_difference(a, b, path="") -> str:
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                return f"{path}/{k}: only in {'committed' if k in a else 'regenerated'}"
            r = first_difference(a[k], b[k], f"{path}/{k}")
            if r:
                return r
        return ""
    if a != b:
        return f"{path}: committed {a!r} != regenerated {b!r}"
    return ""


def main(argv: list[str]) -> int:
    doc = build(parse_lines(sys.stdin))
    if "--check" in argv:
        if not OUT_JSON.exists():
            print("ladder.json missing")
            return 1
        committed = json.loads(OUT_JSON.read_text())
        if strip_volatile(committed) == strip_volatile(doc):
            print(f"ladder ok: {len(doc['scenarios'])} scenarios")
            return 0
        print("ladder.json is stale; run `make ladder`")
        print("first difference: " + first_difference(strip_volatile(committed), strip_volatile(doc)))
        return 1
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(doc, indent=1) + "\n")
    OUT_MD.write_text(render_md(doc))
    print(f"wrote {OUT_JSON.relative_to(ROOT)} and {OUT_MD.relative_to(ROOT)}: {len(doc['scenarios'])} scenarios")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
