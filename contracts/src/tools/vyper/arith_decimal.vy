#pragma enable-decimals
# @version 0.4.3
# @title Vyper Decimal Arithmetic
# @notice Native decimal (10-digit fixed-point) arithmetic using Vyper's decimal type

@external
@pure
def mul(a: decimal, b: decimal) -> decimal:
    """
    @notice Multiply two decimal values
    @param a First value (10-digit precision)
    @param b Second value (10-digit precision)
    @return Product a * b
    """
    return a * b

@external
@pure
def div(a: decimal, b: decimal) -> decimal:
    """
    @notice Divide two decimal values
    @param a Numerator (10-digit precision)
    @param b Denominator (10-digit precision)
    @return Quotient a / b
    """
    assert b != 0.0, "Division by zero"
    return a / b

@external
@pure
def add(a: decimal, b: decimal) -> decimal:
    """
    @notice Add two decimal values
    @param a First value (10-digit precision)
    @param b Second value (10-digit precision)
    @return Sum a + b
    """
    return a + b

@external
@pure
def sub(a: decimal, b: decimal) -> decimal:
    """
    @notice Subtract two decimal values
    @param a First value (10-digit precision)
    @param b Second value (10-digit precision)
    @return Difference a - b
    """
    return a - b
