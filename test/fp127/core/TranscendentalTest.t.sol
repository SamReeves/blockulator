// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../base/FP127TestBase.sol";

contract TranscendentalTest is FP127TestBase {
    function setUp() public {
        _deployFP127();
    }

    // ============================================================================
    // EXP TESTS
    // ============================================================================

    function test_constant_helper() public view {
        uint256 result = fp127.testConstant();
        uint256 expected = 1 << 128;
        assertEq(result, expected, "testConstant should return ONE_FP127");
    }
    
    function test_exp_basic() public {
        uint256 result = fp127.exp(0);
        assertApproxEqAbs(result, 1e18, 1e12, "exp(0) should be 1.0");
    }

    function test_exp_one() public {
        uint256 result = fp127.exp(1e18);
        assertApproxEqAbs(result, 2718281828459045235, 1e12, "exp(1) should be ~2.718e18");
    }

    function test_exp_two() public {
        uint256 result = fp127.exp(2e18);
        assertApproxEqAbs(result, 7389056098930650227, 1e12, "exp(2) should be ~7.389e18");
    }

    function test_exp_half() public {
        uint256 result = fp127.exp(0.5e18);
        assertApproxEqAbs(result, 1648721270700128146, 1e12, "exp(0.5) should be ~1.6487");
    }

    function test_exp_three() public {
        uint256 result = fp127.exp(3e18);
        assertApproxEqAbs(result, 20085536923187667740, 1e12, "exp(3) should be ~20.086");
    }

    function test_exp_tenth() public {
        uint256 result = fp127.exp(0.1e18);
        assertApproxEqAbs(result, 1105170918075647624, 1e12, "exp(0.1) should be ~1.1052");
    }

    function test_exp_ten() public {
        uint256 result = fp127.exp(10e18);
        assertApproxEqAbs(result, 22026465794806716516957, 1e12, "exp(10) should be ~22026.47");
    }
    
    function test_exp_negative_one() public {
        uint256 result = fp127.exp(uint256(int256(-1e18)));
        assertApproxEqAbs(result, 367879441171442321, 1e12, "exp(-1) should be ~0.36788");
    }
    
    function test_exp_negative_two() public {
        uint256 result = fp127.exp(uint256(int256(-2e18)));
        assertApproxEqAbs(result, 135335283236612691, 1e12, "exp(-2) should be ~0.13534");
    }
    
    function test_exp_negative_half() public {
        uint256 result = fp127.exp(uint256(int256(-0.5e18)));
        assertApproxEqAbs(result, 606530659712633423, 1e12, "exp(-0.5) should be ~0.60653");
    }

    function test_exp2_negative_one() public view {
        uint256 NEG_ONE_FP127 = uint256(-int256(1 << 128));
        uint256 result = fp127.exp2Raw(NEG_ONE_FP127);
        assertApproxEqAbs(result, uint256(1) << 127, 1000, "exp2(-1) should be 0.5");
    }

    // ============================================================================
    // LN TESTS
    // ============================================================================

    function test_ln_basic() public {
        uint256 result = fp127.ln(1e18);
        assertApproxEqAbs(result, 0, 1e12, "ln(1) should be 0");
    }

    function test_ln_e() public {
        uint256 result = fp127.ln(2718281828459045235);
        assertApproxEqAbs(result, 1e18, 1e12, "ln(e) should be ~1.0");
    }
    
    function test_ln_two() public {
        uint256 result = fp127.ln(2e18);
        assertApproxEqAbs(result, 693147180559945309, 1e12, "ln(2) should be ~0.693e18");
    }
    
    function test_ln_half() public {
        uint256 result = fp127.ln(0.5e18);
        assertApproxEqAbs(int256(result), -693147180559945309, 1e12, "ln(0.5) should be -ln(2)");
    }
    
    function test_ln_tenth() public {
        uint256 result = fp127.ln(0.1e18);
        assertApproxEqAbs(int256(result), -2302585092994045684, 1e12, "ln(0.1) should be ~-2.3026");
    }
    
    function test_ln_quarter() public {
        uint256 result = fp127.ln(0.25e18);
        assertApproxEqAbs(int256(result), -1386294361119890618, 1e12, "ln(0.25) should be -2*ln(2)");
    }

    // ============================================================================
    // SQRT TESTS
    // ============================================================================

    function test_sqrt_basic() public view {
        uint256 result = fp127.sqrt(1e18);
        assertApproxEqAbs(result, 1e18, 10, "sqrt(1) should be 1.0");
    }

    function test_sqrt_four() public view {
        uint256 result = fp127.sqrt(4e18);
        assertApproxEqAbs(result, 2e18, 1, "sqrt(4) should be 2.0");
    }

    function test_sqrt_two() public view {
        uint256 result = fp127.sqrt(2e18);
        assertApproxEqAbs(result, 1414213562373095048, 1, "sqrt(2) should be ~1.41421");
    }

    function test_sqrt_nine() public view {
        uint256 result = fp127.sqrt(9e18);
        assertApproxEqAbs(result, 3e18, 1, "sqrt(9) should be 3.0");
    }

    function test_sqrt_hundred() public view {
        uint256 result = fp127.sqrt(100e18);
        assertApproxEqAbs(result, 10e18, 200000000, "sqrt(100) should be 10.0");
    }
    
    function test_sqrt_quarter() public view {
        uint256 result = fp127.sqrt(0.25e18);
        assertApproxEqAbs(result, 0.5e18, 1, "sqrt(0.25) should be 0.5");
    }
    
    function test_sqrt_tenth() public view {
        uint256 result = fp127.sqrt(0.1e18);
        assertApproxEqAbs(result, 316227766016837933, 1, "sqrt(0.1) should be ~0.31623");
    }
    
    function test_sqrt_half() public view {
        uint256 result = fp127.sqrt(0.5e18);
        assertApproxEqAbs(result, 707106781186547524, 1000, "sqrt(0.5) should be ~0.70711");
    }
    
    function test_sqrt_roundtrip() public view {
        uint256 x = 3e18;
        uint256 sqrtX = fp127.sqrt(x);
        uint256 result = fp127.mul(sqrtX, sqrtX);
        assertApproxEqAbs(result, x, 10, "sqrt(3)^2 should be ~3");
    }

    // ============================================================================
    // POW TESTS
    // ============================================================================

    function test_pow_2_to_3() public view {
        uint256 result = fp127.pow(2e18, 3e18);
        assertApproxEqAbs(result, 8e18, 1e12, "2^3 should be 8");
    }

    function test_pow_2_to_half() public view {
        uint256 result = fp127.pow(2e18, 0.5e18);
        assertApproxEqAbs(result, 1414213562373095048, 1e12, "2^0.5 should be sqrt(2)");
    }

    function test_pow_4_to_half() public view {
        uint256 result = fp127.pow(4e18, 0.5e18);
        assertApproxEqAbs(result, 2e18, 1e12, "4^0.5 should be 2");
    }

    function test_pow_e_to_1() public view {
        uint256 result = fp127.pow(uint256(E), 1e18);
        assertApproxEqAbs(result, uint256(E), 1e12, "e^1 should be e");
    }

    function test_pow_10_to_0() public view {
        uint256 result = fp127.pow(10e18, 0);
        assertApproxEqAbs(result, 1e18, 1, "10^0 should be 1");
    }

    function test_pow_0_to_5() public view {
        uint256 result = fp127.pow(0, 5e18);
        assertEq(result, 0, "0^5 should be 0");
    }

    function test_pow_1_to_anything() public view {
        uint256 result = fp127.pow(1e18, 12345e18);
        assertApproxEqAbs(result, 1e18, 1e12, "1^12345 should be 1");
    }

    function test_pow_8_to_third() public view {
        uint256 result = fp127.pow(8e18, uint256(int256(F18) / 3));
        assertApproxEqAbs(result, 2e18, 1e12, "8^(1/3) should be 2");
    }

    function test_pow_2_to_1point5() public view {
        uint256 result = fp127.pow(2e18, 1.5e18);
        assertApproxEqAbs(result, 2828427124746190097, 1e12, "2^1.5 should be ~2.828");
    }

    function test_pow_half_to_2() public view {
        uint256 result = fp127.pow(0.5e18, 2e18);
        assertApproxEqAbs(result, 0.25e18, 1e12, "0.5^2 should be 0.25");
    }

    function test_pow_cross_check_exp() public view {
        uint256 pow_result = fp127.pow(uint256(E), 2e18);
        uint256 exp_result = fp127.exp(2e18);
        assertApproxEqAbs(pow_result, exp_result, 1e12, "e^2 should match exp(2)");
    }

    function test_pow_cross_check_sqrt() public view {
        uint256 pow_result = fp127.pow(9e18, 0.5e18);
        uint256 sqrt_result = fp127.sqrt(9e18);
        assertApproxEqAbs(pow_result, sqrt_result, 1e12, "9^0.5 should match sqrt(9)");
    }

    // ============================================================================
    // SHORTCUT DISPATCH TESTS
    // ============================================================================

    function test_pow_cubing() public view {
        uint256 result = fp127.pow(3e18, 3e18);
        assertApproxEqAbs(result, 27e18, 1e12, "3^3 should be 27");
    }

    function test_pow_fourth_power() public view {
        uint256 result = fp127.pow(2e18, 4e18);
        assertApproxEqAbs(result, 16e18, 1e12, "2^4 should be 16");
    }

    function test_pow_negative_exponent() public view {
        uint256 result = fp127.pow(2e18, uint256(int256(-1e18)));
        assertApproxEqAbs(result, 0.5e18, 1e12, "2^(-1) should be 0.5");
    }

    function test_pow_quarter_exponent() public view {
        uint256 result = fp127.pow(16e18, 0.25e18);
        assertApproxEqAbs(result, 2e18, 1e12, "16^0.25 should be 2");
    }

    function test_pow_x_equals_2() public view {
        uint256 result = fp127.pow(2e18, 5e18);
        assertApproxEqAbs(result, 32e18, 1e12, "2^5 should be 32 via exp2 dispatch");
    }

    function test_pow_x_equals_10() public view {
        uint256 result = fp127.pow(10e18, 2e18);
        assertApproxEqAbs(result, 100e18, 1e12, "10^2 should be 100 via exp10 dispatch");
    }

    function test_log2_power_of_2() public view {
        uint256 result = fp127.log2(8e18);
        assertApproxEqAbs(result, 3e18, 1e12, "log2(8) should be 3");
    }

    function test_log2_power_of_2_large() public view {
        uint256 result = fp127.log2(1024e18);
        assertApproxEqAbs(result, 10e18, 1e12, "log2(1024) should be 10");
    }

    function test_cbrt_perfect_cube_8() public view {
        uint256 result = fp127.cbrt(8e18);
        assertApproxEqAbs(result, 2e18, 1e12, "cbrt(8) should be 2");
    }

    function test_cbrt_perfect_cube_27() public view {
        uint256 result = fp127.cbrt(27e18);
        assertApproxEqAbs(result, 3e18, 1e12, "cbrt(27) should be 3");
    }

    function test_cbrt_perfect_cube_64() public view {
        uint256 result = fp127.cbrt(64e18);
        assertApproxEqAbs(result, 4e18, 1e12, "cbrt(64) should be 4");
    }

    // ============================================================================
    // ROUNDTRIP TESTS
    // ============================================================================

    function test_roundtrip_exp_ln_one() public {
        uint256 e_val = fp127.exp(1e18);
        uint256 back = fp127.ln(e_val);
        assertApproxEqAbs(back, 1e18, 1e12, "ln(exp(1)) should be ~1.0");
    }

    function test_roundtrip_exp_ln_two() public {
        uint256 e_val = fp127.exp(2e18);
        uint256 back = fp127.ln(e_val);
        assertApproxEqAbs(back, 2e18, 1e12, "ln(exp(2)) should be ~2.0");
    }

    function test_roundtrip_exp_ln_half() public {
        uint256 e_val = fp127.exp(0.5e18);
        uint256 back = fp127.ln(e_val);
        assertApproxEqAbs(back, 0.5e18, 1e12, "ln(exp(0.5)) should be ~0.5");
    }

    function test_roundtrip_ln_exp() public {
        uint256 ln_val = fp127.ln(2e18);
        uint256 back = fp127.exp(ln_val);
        assertApproxEqAbs(back, 2e18, 1e12, "exp(ln(2)) should be ~2.0");
    }

    // ============================================================================
    // PRECISION TESTS (Raw FP127, Oracle-based)
    // ============================================================================

    function test_precision_exp_one() public {
        uint256 result = fp127.expRaw(ONE_FP127);
        uint256 expected = _oracle("exp", ONE_FP127);
        assertLt(_absDiff(result, expected), 256, "exp(1) within 256 ULP");
    }
    
    function test_precision_exp_two() public {
        uint256 TWO = 2 << 128;
        uint256 result = fp127.expRaw(TWO);
        uint256 expected = _oracle("exp", TWO);
        assertLt(_absDiff(result, expected), 256, "exp(2) within 256 ULP");
    }
    
    function test_precision_exp_half() public {
        uint256 HALF = 1 << 127;
        uint256 result = fp127.expRaw(HALF);
        uint256 expected = _oracle("exp", HALF);
        assertLt(_absDiff(result, expected), 256, "exp(0.5) within 256 ULP");
    }

    function test_precision_ln_two() public {
        uint256 TWO = 2 << 128;
        uint256 result = fp127.lnRaw(TWO);
        uint256 expected = _oracle("ln", TWO);
        assertLt(_absDiff(result, expected), 1024, "ln(2) within 1024 ULP");
    }
    
    function test_precision_ln_e() public {
        uint256 e_fp127 = _oracle("exp", ONE_FP127);
        uint256 result = fp127.lnRaw(e_fp127);
        assertLt(_absDiff(result, ONE_FP127), 1024, "ln(e) within 1024 ULP of 1.0");
    }

    function test_precision_roundtrip() public {
        uint256 THREE = 3 << 128;
        uint256 ln_val = fp127.lnRaw(THREE);
        uint256 back = fp127.expRaw(ln_val);
        assertLt(_absDiff(back, THREE), 4096, "exp(ln(3)) roundtrip within 4096 ULP");
    }

    function test_precision_pow_2_to_3() public {
        uint256 TWO = 2 << 128;
        uint256 THREE = 3 << 128;
        uint256 result = fp127.powRaw(TWO, THREE);
        uint256 expected = _oracle2("pow", TWO, THREE);
        assertLt(_absDiff(result, expected), 512, "pow(2, 3) within 512 ULP");
    }

    function test_precision_pow_e_to_2() public {
        uint256 TWO = 2 << 128;
        uint256 e_fp127 = _oracle("exp", ONE_FP127);
        uint256 result = fp127.powRaw(e_fp127, TWO);
        uint256 expected = _oracle2("pow", e_fp127, TWO);
        assertLt(_absDiff(result, expected), 1024, "pow(e, 2) within 1024 ULP");
    }

    function test_precision_pow_fractional() public {
        uint256 EIGHT = 8 << 128;
        uint256 THIRD = uint256(1 << 128) / 3;
        uint256 result = fp127.powRaw(EIGHT, THIRD);
        uint256 expected = _oracle2("pow", EIGHT, THIRD);
        assertLt(_absDiff(result, expected), 1024, "pow(8, 1/3) within 1024 ULP");
    }

    // ============================================================================
    // GAS BENCHMARKS
    // ============================================================================

    function testGas_exp() public view {
        fp127.exp(1e18);
    }

    function testGas_ln() public view {
        fp127.ln(2e18);
    }

    function testGas_sqrt() public view {
        fp127.sqrt(2e18);
    }

    function testGas_pow() public view {
        fp127.pow(2e18, 3e18);
    }

    // ============================================================================
    // FUZZ TESTS
    // ============================================================================
    
    function testFuzz_exp(uint256 x) public {
        x = bound(x, 0, uint256(87) << 128);
        uint256 result = fp127.expRaw(x);
        uint256 expected = _oracle("exp", x);
        uint256 magnitude = expected >> 128;
        uint256 tolerance = magnitude > 1 ? magnitude * 128 : 512;
        assertLt(_absDiff(result, expected), tolerance, "exp fuzz within scaled tolerance");
    }
    
    function testFuzz_ln(uint256 x) public {
        x = bound(x, (1 << 128) + 1, uint256(1000) << 128);
        uint256 result = fp127.lnRaw(x);
        uint256 expected = _oracle("ln", x);
        assertLt(_absDiff(result, expected), 2048, "ln fuzz within 2048 ULP");
    }

    function testFuzz_pow(uint256 base, uint256 exp_val) public {
        base = bound(base, uint256(1 << 128) / 100, uint256(100) << 128);
        exp_val = bound(exp_val, uint256(1 << 128) / 100, uint256(10) << 128);
        
        uint256 result = fp127.powRaw(base, exp_val);
        uint256 expected = _oracle2("pow", base, exp_val);
        
        uint256 magnitude = expected >> 128;
        uint256 tolerance = magnitude > 1 ? magnitude * 256 : 2048;
        assertLt(_absDiff(result, expected), tolerance, "pow fuzz within scaled tolerance");
    }
}
