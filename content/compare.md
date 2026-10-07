+++
title = "Compare"
description = "Gas and single-op precision for FP127 against ABDKMath64x64, Solady and PRBMath."
+++

The [ladder](/demo/) is the argument: precision over N steps, which is how protocols use a math library. This page is the per-op view behind it, measured by the same Foundry suites that CI runs on every commit.

## Gas per op

{{ <gastable /> }}

Multiplication and division cost about what they cost in WAD. The transcendentals cost more because they compute twice as many bits.

## Precision per op

{{ <precisiontable /> }}

Integer, rounding and comparison ops are bit-exact. The transcendentals hold 115 to 130 correct bits of 128 across their domains. The two Lambert W branches lose bits only within 2^-20 of the branch point at −1/e, where the slope is infinite and one ULP of input moves the output by 2^-63; everywhere else they measure 126 to 128 bits.
