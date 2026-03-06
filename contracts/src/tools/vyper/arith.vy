# @version 0.4.3
# @title Raw Vyper Arithmetic
# @notice Fixed18 (18-decimal) arithmetic using native Vyper int256

SCALE: constant(int256) = 10 ** 18

@external
@pure
def mul(a: int256, b: int256) -> int256:
    return (a * b) // SCALE

@external
@pure
def div(a: int256, b: int256) -> int256:
    return (a * SCALE) // b

@external
@pure
def add(a: int256, b: int256) -> int256:
    return a + b

@external
@pure
def sub(a: int256, b: int256) -> int256:
    return a - b
