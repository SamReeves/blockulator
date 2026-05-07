Show HN: FP127 – 128-bit fixed-point math for the EVM, in Huff

FP127 is a 127.128 signed fixed-point library written in pure Huff
and deployed as one callable contract: https://blockulator.com (Sepolia).
It exposes 34 ops including mul, div, exp, ln, sqrt, pow, log2,
log10, Lambert W₀, validated against mpmath at 100 decimal places.

I gave a talk on it at EthCC[9]:
https://www.youtube.com/watch?v=a_tL99NY-yc

What pushed me to build it: our fuzz suite shows ABDK 64x64,
Solady WAD, and PRBMath all have regions where precision collapses
to ~5 correct decimal digits on normal inputs. FP127 holds 38
digits across the same range. Scatter plots in docs/benchmarks/.

The reason isn't bugs in those libraries. WAD scales by 10^18
(~2^59.79), so ~60 bits go to the fraction; the remaining ~196
bits exist mostly to absorb the intermediate x*y before the
divide-by-WAD. You can't actually store values in them — try
a 10^40 value and the next mulWad reverts. FP127 spends the
budget as 128 fractional bits + 127 integer bits + sign, with
a 4-term schoolbook mul that keeps the full 512-bit intermediate.
Roughly twice the usable fractional bit depth of any WAD library.

Gas: add ~50, mul 1,027, div 518 (cheaper than Solady's 611),
exp ~21k, ln ~41k. Worth it for options pricing, prediction
markets, vault accounting — anywhere 18-decimal error compounds.
Don't use it for ERC20 transfers. I'm not 100% confident in
the gas consistency story across input ranges and would like
someone to sanity-check that.

Two questions I'd genuinely like answers to:

1. Huff vs hand-translated Yul/inline-asm Solidity. Huff lets
me count gas at the opcode level but most teams won't audit it,
and staticcall-per-op is rough in a hot loop. Inlining wins
gas but loses the "one address, agree by construction" property.

2. Trust model. CREATE2 with a published salt so the same
address lands on every chain is what I keep coming back to.
Multi-sig with freeze-after-audit? Append-only registry?
Curious how others have done shared infra.

