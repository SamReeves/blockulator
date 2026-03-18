// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../base/FP127TestBase.sol";

contract ArithmeticTest is FP127TestBase {
    function setUp() public {
        _deployFP127();
    }
    
    // ============================================================================
    // CONVERSION TESTS
    // ============================================================================
    
    function test_conversion_one() public view {
        uint256 fp127Val = fp127.fromFixed18(uint256(F18));
        uint256 result = fp127.toFixed18(fp127Val);
        assertEq(int256(result), F18, "1.0 round-trip");
    }
    
    function test_conversion_e() public view {
        uint256 fp127Val = fp127.fromFixed18(uint256(E));
        uint256 result = fp127.toFixed18(fp127Val);
        assertApproxEqAbs(int256(result), E, 1, "e round-trip");
    }
    
    function test_conversion_zero() public view {
        uint256 fp127Val = fp127.fromFixed18(0);
        uint256 result = fp127.toFixed18(fp127Val);
        assertEq(result, 0, "0 round-trip");
    }
    
    function test_conversion_half() public view {
        uint256 fp127Val = fp127.fromFixed18(uint256(F18 / 2));
        uint256 result = fp127.toFixed18(fp127Val);
        assertApproxEqAbs(int256(result), F18 / 2, uint256(1), "0.5 round-trip");
    }
    
    function test_conversion_negative_one() public view {
        uint256 fp127Val = fp127.fromFixed18(uint256(-F18));
        uint256 result = fp127.toFixed18(fp127Val);
        assertEq(int256(result), -F18, "-1.0 round-trip");
    }
    
    function test_conversion_negative_half() public view {
        uint256 fp127Val = fp127.fromFixed18(uint256(-F18 / 2));
        uint256 result = fp127.toFixed18(fp127Val);
        assertApproxEqAbs(int256(result), -F18 / 2, uint256(1), "-0.5 round-trip");
    }
    
    // ============================================================================
    // ADDITION TESTS
    // ============================================================================
    
    function test_add_1_plus_2() public view {
        uint256 result = fp127.add(uint256(1 * F18), uint256(2 * F18));
        assertApproxEqAbs(int256(result), 3 * F18, 1, "1 + 2 = 3");
    }
    
    function test_add_half_plus_half() public view {
        uint256 result = fp127.add(uint256(F18 / 2), uint256(F18 / 2));
        assertApproxEqAbs(int256(result), F18, 1, "0.5 + 0.5 = 1");
    }
    
    function test_add_identity() public view {
        uint256 result = fp127.add(uint256(F18), 0);
        assertApproxEqAbs(int256(result), F18, 1, "1 + 0 = 1");
    }
    
    function test_add_zero_plus_zero() public view {
        uint256 result = fp127.add(0, 0);
        assertEq(result, 0, "0 + 0 = 0");
    }
    
    function test_add_large_numbers() public view {
        int256 a = 12345 * F18;
        int256 b = 67890 * F18;
        uint256 result = fp127.add(uint256(a), uint256(b));
        assertApproxEqAbs(int256(result), a + b, 2, "12345 + 67890 = 80235");
    }
    
    function test_add_negative_plus_positive() public view {
        uint256 result = fp127.add(uint256(-F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "-1 + 3 = 2");
    }
    
    function test_add_negative_plus_negative() public view {
        uint256 result = fp127.add(uint256(-F18), uint256(-2 * F18));
        assertApproxEqAbs(int256(result), -3 * F18, 1, "-1 + (-2) = -3");
    }
    
    function test_add_e_plus_pi() public view {
        int256 pi = 3141592653589793238;
        uint256 result = fp127.add(uint256(E), uint256(pi));
        assertApproxEqAbs(int256(result), E + pi, 2, "e + pi");
    }
    
    // ============================================================================
    // SUBTRACTION TESTS
    // ============================================================================
    
    function test_sub_3_minus_1() public view {
        uint256 result = fp127.sub(uint256(3 * F18), uint256(F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "3 - 1 = 2");
    }
    
    function test_sub_identity() public view {
        uint256 result = fp127.sub(uint256(F18), uint256(F18));
        assertApproxEqAbs(int256(result), 0, 1, "1 - 1 = 0");
    }
    
    function test_sub_negative_result() public view {
        uint256 result = fp127.sub(uint256(F18), uint256(2 * F18));
        assertApproxEqAbs(int256(result), -F18, 1, "1 - 2 = -1");
    }
    
    function test_sub_zero_minus_positive() public view {
        uint256 result = fp127.sub(0, uint256(5 * F18));
        assertApproxEqAbs(int256(result), -5 * F18, 1, "0 - 5 = -5");
    }
    
    function test_sub_decimals() public view {
        int256 a = (5 * F18) / 2;
        int256 b = (3 * F18) / 2;
        uint256 result = fp127.sub(uint256(a), uint256(b));
        assertApproxEqAbs(int256(result), F18, 1, "2.5 - 1.5 = 1");
    }
    
    function test_sub_positive_minus_negative() public view {
        uint256 result = fp127.sub(uint256(5 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), 8 * F18, 1, "5 - (-3) = 8");
    }
    
    function test_sub_negative_minus_positive() public view {
        uint256 result = fp127.sub(uint256(-10 * F18), uint256(5 * F18));
        assertApproxEqAbs(int256(result), -15 * F18, 1, "-10 - 5 = -15");
    }
    
    // ============================================================================
    // MULTIPLICATION TESTS
    // ============================================================================
    
    function test_mul_1_times_1() public view {
        uint256 result = fp127.mul(uint256(F18), uint256(F18));
        assertApproxEqAbs(int256(result), F18, 1, "1 * 1 = 1");
    }
    
    function test_mul_2_times_3() public view {
        uint256 result = fp127.mul(uint256(2 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), 6 * F18, 1, "2 * 3 = 6");
    }
    
    function test_mul_half_times_2() public view {
        uint256 result = fp127.mul(uint256(F18 / 2), uint256(2 * F18));
        assertApproxEqAbs(int256(result), F18, 1, "0.5 * 2 = 1");
    }
    
    function test_mul_decimals() public view {
        int256 a = F18 / 10;
        int256 b = F18 / 10;
        uint256 result = fp127.mul(uint256(a), uint256(b));
        assertApproxEqAbs(int256(result), F18 / 100, uint256(1), "0.1 * 0.1 = 0.01");
    }
    
    function test_mul_negative_times_positive() public view {
        uint256 result = fp127.mul(uint256(-2 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), -6 * F18, 1, "-2 * 3 = -6");
    }
    
    function test_mul_negative_times_negative() public view {
        uint256 result = fp127.mul(uint256(-2 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), 6 * F18, 1, "-2 * (-3) = 6");
    }
    
    function test_mul_by_zero() public view {
        uint256 result = fp127.mul(uint256(42 * F18), 0);
        assertEq(result, 0, "42 * 0 = 0");
    }
    
    function test_mul_identity() public view {
        int256 x = 31415926535897;
        uint256 result = fp127.mul(uint256(x), uint256(F18));
        assertApproxEqAbs(int256(result), x, 1, "x * 1 approx x");
    }
    
    // ============================================================================
    // DIVISION TESTS
    // ============================================================================
    
    function test_div_6_div_3() public view {
        uint256 result = fp127.div(uint256(6 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "6 / 3 = 2");
    }
    
    function test_div_1_div_2() public view {
        uint256 result = fp127.div(uint256(F18), uint256(2 * F18));
        assertApproxEqAbs(int256(result), F18 / 2, uint256(1), "1 / 2 = 0.5");
    }
    
    function test_div_1_div_3() public view {
        uint256 result = fp127.div(uint256(F18), uint256(3 * F18));
        int256 expected = F18 / 3;
        assertApproxEqAbs(int256(result), expected, uint256(1), "1 / 3 approx 0.333");
    }
    
    function test_div_negative_div_positive() public view {
        uint256 result = fp127.div(uint256(-6 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), -2 * F18, 1, "-6 / 3 = -2");
    }
    
    function test_div_positive_div_negative() public view {
        uint256 result = fp127.div(uint256(6 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), -2 * F18, 1, "6 / (-3) = -2");
    }
    
    function test_div_negative_div_negative() public view {
        uint256 result = fp127.div(uint256(-6 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "-6 / (-3) = 2");
    }
    
    function test_div_identity() public view {
        int256 x = 9876543210;
        uint256 result = fp127.div(uint256(x), uint256(F18));
        assertApproxEqAbs(int256(result), x, 1, "x / 1 approx x");
    }
    
    function test_div_zero_numerator() public view {
        uint256 result = fp127.div(0, uint256(42 * F18));
        assertEq(result, 0, "0 / 42 = 0");
    }
    
    // ============================================================================
    // RAW MUL/DIV TESTS
    // ============================================================================
    
    function test_mulRaw() public view {
        uint256 TWO_FP127 = 2 << 128;
        uint256 result = fp127.mulRaw(ONE_FP127, TWO_FP127);
        assertApproxEqAbs(int256(result), int256(TWO_FP127), 1, "1 * 2 = 2 (raw)");
    }
    
    function test_divRaw() public view {
        uint256 SIX_FP127 = 6 << 128;
        uint256 THREE_FP127 = 3 << 128;
        uint256 result = fp127.divRaw(SIX_FP127, THREE_FP127);
        uint256 TWO_FP127 = 2 << 128;
        assertApproxEqAbs(int256(result), int256(TWO_FP127), 1, "6 / 3 = 2 (raw)");
    }
    
    // ============================================================================
    // GAS BENCHMARKS
    // ============================================================================
    
    function testGas_add() public view {
        fp127.add(uint256(E), uint256(3141592653589793238));
    }
    
    function testGas_sub() public view {
        fp127.sub(uint256(3 * F18), uint256(F18));
    }
    
    function testGas_mul() public view {
        fp127.mul(uint256(E), uint256(3141592653589793238));
    }
    
    function testGas_div() public view {
        fp127.div(uint256(F18), uint256(3 * F18));
    }
    
    function testGas_fromFixed18() public view {
        fp127.fromFixed18(uint256(E));
    }
    
    function testGas_toFixed18() public view {
        uint256 fp127Val = fp127.fromFixed18(uint256(E));
        fp127.toFixed18(fp127Val);
    }
}
