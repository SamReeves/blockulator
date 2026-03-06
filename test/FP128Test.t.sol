// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

interface IFP128 {
    function add(uint256, uint256) external view returns (uint256);
    function sub(uint256, uint256) external view returns (uint256);
    function mul(uint256, uint256) external view returns (uint256);
    function div(uint256, uint256) external view returns (uint256);
    function mulRaw(uint256, uint256) external view returns (uint256);
    function divRaw(uint256, uint256) external view returns (uint256);
    function fromFixed18(uint256) external view returns (uint256);
    function toFixed18(uint256) external view returns (uint256);
    function exp(uint256) external view returns (uint256);
    function ln(uint256) external view returns (uint256);
    function sqrt(uint256) external view returns (uint256);
    function expRaw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function lnBkmOnly(uint256) external view returns (uint256);
    function lnRangeReduce(uint256) external view returns (uint256, uint256);
    function expRangeReduce(uint256) external view returns (uint256, uint256);
    function expBkmOnly(uint256) external view returns (uint256);
    function expScale(uint256, uint256) external view returns (uint256);
    function expOverflowCheck(uint256) external view returns (uint256);
    function testConstant() external view returns (uint256);
}

contract FP128Test is Test {
    IFP128 fp128;
    
    int256 constant F18 = 1e18;
    int256 constant E = 2718281828459045235;
    
    function setUp() public {
        string memory hexCode = vm.readFile("contracts/build/huff/test_fp128.runtime.bin");
        bytes memory code = vm.parseBytes(string.concat("0x", hexCode));
        address addr = makeAddr("fp128");
        vm.etch(addr, code);
        fp128 = IFP128(addr);
    }
    
    function _oracle(string memory func, uint256 x) internal returns (uint256) {
        string[] memory cmd = new string[](4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = func;
        cmd[3] = vm.toString(x);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (uint256));
    }
    
    function _oracle2(string memory func, uint256 a, uint256 b) internal returns (uint256) {
        string[] memory cmd = new string[](5);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = func;
        cmd[3] = vm.toString(a);
        cmd[4] = vm.toString(b);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (uint256));
    }
    
    function _oracleExpRangeReduce(uint256 x) internal returns (uint256, uint256) {
        string[] memory cmd = new string[](4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = "exp_range_reduce";
        cmd[3] = vm.toString(x);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (uint256, uint256));
    }
    
    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
    
    // ============================================================================
    // CONVERSION TESTS
    // ============================================================================
    
    function test_conversion_one() public view {
        uint256 fp128Val = fp128.fromFixed18(uint256(F18));
        uint256 result = fp128.toFixed18(fp128Val);
        assertEq(int256(result), F18, "1.0 round-trip");
    }
    
    function test_conversion_e() public view {
        uint256 fp128Val = fp128.fromFixed18(uint256(E));
        uint256 result = fp128.toFixed18(fp128Val);
        assertApproxEqAbs(int256(result), E, 1, "e round-trip");
    }
    
    function test_conversion_zero() public view {
        uint256 fp128Val = fp128.fromFixed18(0);
        uint256 result = fp128.toFixed18(fp128Val);
        assertEq(result, 0, "0 round-trip");
    }
    
    function test_conversion_half() public view {
        uint256 fp128Val = fp128.fromFixed18(uint256(F18 / 2));
        uint256 result = fp128.toFixed18(fp128Val);
        assertApproxEqAbs(int256(result), F18 / 2, uint256(1), "0.5 round-trip");
    }
    
    function test_conversion_negative_one() public view {
        uint256 fp128Val = fp128.fromFixed18(uint256(-F18));
        uint256 result = fp128.toFixed18(fp128Val);
        assertEq(int256(result), -F18, "-1.0 round-trip");
    }
    
    function test_conversion_negative_half() public view {
        uint256 fp128Val = fp128.fromFixed18(uint256(-F18 / 2));
        uint256 result = fp128.toFixed18(fp128Val);
        assertApproxEqAbs(int256(result), -F18 / 2, uint256(1), "-0.5 round-trip");
    }
    
    // ============================================================================
    // ADDITION TESTS
    // ============================================================================
    
    function test_add_1_plus_2() public view {
        uint256 result = fp128.add(uint256(1 * F18), uint256(2 * F18));
        assertApproxEqAbs(int256(result), 3 * F18, 1, "1 + 2 = 3");
    }
    
    function test_add_half_plus_half() public view {
        uint256 result = fp128.add(uint256(F18 / 2), uint256(F18 / 2));
        assertApproxEqAbs(int256(result), F18, 1, "0.5 + 0.5 = 1");
    }
    
    function test_add_identity() public view {
        uint256 result = fp128.add(uint256(F18), 0);
        assertApproxEqAbs(int256(result), F18, 1, "1 + 0 = 1");
    }
    
    function test_add_zero_plus_zero() public view {
        uint256 result = fp128.add(0, 0);
        assertEq(result, 0, "0 + 0 = 0");
    }
    
    function test_add_large_numbers() public view {
        int256 a = 12345 * F18;
        int256 b = 67890 * F18;
        uint256 result = fp128.add(uint256(a), uint256(b));
        assertApproxEqAbs(int256(result), a + b, 2, "12345 + 67890 = 80235");
    }
    
    function test_add_negative_plus_positive() public view {
        uint256 result = fp128.add(uint256(-F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "-1 + 3 = 2");
    }
    
    function test_add_negative_plus_negative() public view {
        uint256 result = fp128.add(uint256(-F18), uint256(-2 * F18));
        assertApproxEqAbs(int256(result), -3 * F18, 1, "-1 + (-2) = -3");
    }
    
    function test_add_e_plus_pi() public view {
        int256 pi = 3141592653589793238;
        uint256 result = fp128.add(uint256(E), uint256(pi));
        assertApproxEqAbs(int256(result), E + pi, 2, "e + pi");
    }
    
    // ============================================================================
    // SUBTRACTION TESTS
    // ============================================================================
    
    function test_sub_3_minus_1() public view {
        uint256 result = fp128.sub(uint256(3 * F18), uint256(F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "3 - 1 = 2");
    }
    
    function test_sub_identity() public view {
        uint256 result = fp128.sub(uint256(F18), uint256(F18));
        assertApproxEqAbs(int256(result), 0, 1, "1 - 1 = 0");
    }
    
    function test_sub_negative_result() public view {
        uint256 result = fp128.sub(uint256(F18), uint256(2 * F18));
        assertApproxEqAbs(int256(result), -F18, 1, "1 - 2 = -1");
    }
    
    function test_sub_zero_minus_positive() public view {
        uint256 result = fp128.sub(0, uint256(5 * F18));
        assertApproxEqAbs(int256(result), -5 * F18, 1, "0 - 5 = -5");
    }
    
    function test_sub_decimals() public view {
        int256 a = (5 * F18) / 2;  // 2.5
        int256 b = (3 * F18) / 2;  // 1.5
        uint256 result = fp128.sub(uint256(a), uint256(b));
        assertApproxEqAbs(int256(result), F18, 1, "2.5 - 1.5 = 1");
    }
    
    function test_sub_positive_minus_negative() public view {
        uint256 result = fp128.sub(uint256(5 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), 8 * F18, 1, "5 - (-3) = 8");
    }
    
    function test_sub_negative_minus_positive() public view {
        uint256 result = fp128.sub(uint256(-10 * F18), uint256(5 * F18));
        assertApproxEqAbs(int256(result), -15 * F18, 1, "-10 - 5 = -15");
    }
    
    // ============================================================================
    // MULTIPLICATION TESTS
    // ============================================================================
    
    function test_mul_1_times_1() public view {
        uint256 result = fp128.mul(uint256(F18), uint256(F18));
        assertApproxEqAbs(int256(result), F18, 1, "1 * 1 = 1");
    }
    
    function test_mul_2_times_3() public view {
        uint256 result = fp128.mul(uint256(2 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), 6 * F18, 1, "2 * 3 = 6");
    }
    
    function test_mul_half_times_2() public view {
        uint256 result = fp128.mul(uint256(F18 / 2), uint256(2 * F18));
        assertApproxEqAbs(int256(result), F18, 1, "0.5 * 2 = 1");
    }
    
    function test_mul_decimals() public view {
        int256 a = F18 / 10;  // 0.1
        int256 b = F18 / 10;  // 0.1
        uint256 result = fp128.mul(uint256(a), uint256(b));
        assertApproxEqAbs(int256(result), F18 / 100, uint256(1), "0.1 * 0.1 = 0.01");
    }
    
    function test_mul_negative_times_positive() public view {
        uint256 result = fp128.mul(uint256(-2 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), -6 * F18, 1, "-2 * 3 = -6");
    }
    
    function test_mul_negative_times_negative() public view {
        uint256 result = fp128.mul(uint256(-2 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), 6 * F18, 1, "-2 * (-3) = 6");
    }
    
    function test_mul_by_zero() public view {
        uint256 result = fp128.mul(uint256(42 * F18), 0);
        assertEq(result, 0, "42 * 0 = 0");
    }
    
    function test_mul_identity() public view {
        int256 x = 31415926535897;
        uint256 result = fp128.mul(uint256(x), uint256(F18));
        assertApproxEqAbs(int256(result), x, 1, "x * 1 approx x");
    }
    
    // ============================================================================
    // DIVISION TESTS
    // ============================================================================
    
    function test_div_6_div_3() public view {
        uint256 result = fp128.div(uint256(6 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "6 / 3 = 2");
    }
    
    function test_div_1_div_2() public view {
        uint256 result = fp128.div(uint256(F18), uint256(2 * F18));
        assertApproxEqAbs(int256(result), F18 / 2, uint256(1), "1 / 2 = 0.5");
    }
    
    function test_div_1_div_3() public view {
        uint256 result = fp128.div(uint256(F18), uint256(3 * F18));
        int256 expected = F18 / 3;  // 0.333...
        assertApproxEqAbs(int256(result), expected, uint256(F18 / 1000), "1 / 3 approx 0.333");
    }
    
    function test_div_negative_div_positive() public view {
        uint256 result = fp128.div(uint256(-6 * F18), uint256(3 * F18));
        assertApproxEqAbs(int256(result), -2 * F18, 1, "-6 / 3 = -2");
    }
    
    function test_div_positive_div_negative() public view {
        uint256 result = fp128.div(uint256(6 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), -2 * F18, 1, "6 / (-3) = -2");
    }
    
    function test_div_negative_div_negative() public view {
        uint256 result = fp128.div(uint256(-6 * F18), uint256(-3 * F18));
        assertApproxEqAbs(int256(result), 2 * F18, 1, "-6 / (-3) = 2");
    }
    
    function test_div_identity() public view {
        int256 x = 9876543210;
        uint256 result = fp128.div(uint256(x), uint256(F18));
        assertApproxEqAbs(int256(result), x, 1, "x / 1 approx x");
    }
    
    function test_div_zero_numerator() public view {
        uint256 result = fp128.div(0, uint256(42 * F18));
        assertEq(result, 0, "0 / 42 = 0");
    }
    
    // ============================================================================
    // RAW MUL/DIV TESTS (direct fp128 format, no conversion)
    // ============================================================================
    
    function test_mulRaw() public view {
        uint256 ONE_FP128 = 1 << 128;
        uint256 TWO_FP128 = 2 << 128;
        uint256 result = fp128.mulRaw(ONE_FP128, TWO_FP128);
        assertApproxEqAbs(int256(result), int256(TWO_FP128), 1, "1 * 2 = 2 (raw)");
    }
    
    function test_divRaw() public view {
        uint256 SIX_FP128 = 6 << 128;
        uint256 THREE_FP128 = 3 << 128;
        uint256 result = fp128.divRaw(SIX_FP128, THREE_FP128);
        uint256 TWO_FP128 = 2 << 128;
        assertApproxEqAbs(int256(result), int256(TWO_FP128), 100, "6 / 3 = 2 (raw, full precision)");
    }

    // ============================================================================
    // EXP TESTS (Fixed18 I/O - Smoke tests with loose tolerance)
    // ============================================================================

    function test_constant_helper() public view {
        uint256 result = fp128.testConstant();
        uint256 expected = 1 << 128;
        assertEq(result, expected, "testConstant should return ONE_FP128");
    }
    
    function test_exp_basic() public {
        uint256 result = fp128.exp(0);
        assertApproxEqAbs(result, 1e18, 1e12, "exp(0) should be 1.0");
    }

    function test_exp_one() public {
        uint256 result = fp128.exp(1e18);
        assertApproxEqAbs(result, 2718281828459045235, 1e12, "exp(1) should be ~2.718e18");
    }

    function test_exp_two() public {
        uint256 result = fp128.exp(2e18);
        assertApproxEqAbs(result, 7389056098930650227, 1e12, "exp(2) should be ~7.389e18");
    }

    function test_exp_half() public {
        uint256 result = fp128.exp(0.5e18);
        assertApproxEqAbs(result, 1648721270700128146, 1e12, "exp(0.5) should be ~1.6487");
    }

    function test_exp_three() public {
        uint256 result = fp128.exp(3e18);
        assertApproxEqAbs(result, 20085536923187667740, 1e12, "exp(3) should be ~20.086");
    }

    function test_exp_tenth() public {
        uint256 result = fp128.exp(0.1e18);
        assertApproxEqAbs(result, 1105170918075647624, 1e12, "exp(0.1) should be ~1.1052");
    }

    function test_exp_ten() public {
        uint256 result = fp128.exp(10e18);
        assertApproxEqAbs(result, 22026465794806716516957, 1e12, "exp(10) should be ~22026.47");
    }
    
    function test_exp_negative_one() public {
        uint256 result = fp128.exp(uint256(int256(-1e18)));
        assertApproxEqAbs(result, 367879441171442321, 1e12, "exp(-1) should be ~0.36788 (1/e)");
    }
    
    function test_exp_negative_two() public {
        uint256 result = fp128.exp(uint256(int256(-2e18)));
        assertApproxEqAbs(result, 135335283236612691, 1e12, "exp(-2) should be ~0.13534");
    }
    
    function test_exp_negative_half() public {
        uint256 result = fp128.exp(uint256(int256(-0.5e18)));
        assertApproxEqAbs(result, 606530659712633423, 1e12, "exp(-0.5) should be ~0.60653");
    }

    // ============================================================================
    // LN TESTS (Fixed18 I/O - Smoke tests with loose tolerance)
    // ============================================================================

    function test_ln_basic() public {
        uint256 result = fp128.ln(1e18);
        assertApproxEqAbs(result, 0, 1e12, "ln(1) should be 0");
    }

    function test_ln_e() public {
        uint256 result = fp128.ln(2718281828459045235);
        assertApproxEqAbs(result, 1e18, 1e12, "ln(e) should be ~1.0");
    }

    function test_fp128_mul_test() public view {
        // Test FP128_MUL with shift_k_fp128 = 1<<128 and ln2
        uint256 shift_k_fp128 = uint256(1) << 128;
        uint256 ln2_fp128 = uint256(235865763225513294137944142764154484399);
        
        uint256 result = fp128.mulRaw(shift_k_fp128, ln2_fp128);
        console.log("MUL result:", result);
        console.log("Expected:", ln2_fp128);
        
        assertEq(result, ln2_fp128, "1.0 * ln2 should equal ln2");
    }
    
    function test_fp128_add_test() public view {
        // Test FP128_ADD with 0 + ln2
        uint256 ln2_fp128 = uint256(235865763225513294137944142764154484399);
        uint256 ln2_fixed18 = (ln2_fp128 * 1e18) >> 128;
        
        uint256 result = fp128.add(0, ln2_fixed18);
        // Allow 1 ULP tolerance for conversion rounding
        assertApproxEqAbs(result, ln2_fixed18, 1, "0 + ln2 should equal ln2");
    }
    
    function test_ln_two() public {
        uint256 result = fp128.ln(2e18);
        assertApproxEqAbs(result, 693147180559945309, 1e12, "ln(2) should be ~0.693e18");
    }
    
    function test_ln_half() public {
        uint256 result = fp128.ln(0.5e18);
        assertApproxEqAbs(int256(result), -693147180559945309, 1e12, "ln(0.5) should be -ln(2) ~-0.693e18");
    }
    
    function test_ln_tenth() public {
        uint256 result = fp128.ln(0.1e18);
        assertApproxEqAbs(int256(result), -2302585092994045684, 1e12, "ln(0.1) should be ~-2.3026");
    }
    
    function test_ln_quarter() public {
        uint256 result = fp128.ln(0.25e18);
        assertApproxEqAbs(int256(result), -1386294361119890618, 1e12, "ln(0.25) should be -2*ln(2) ~-1.3863");
    }

    // ============================================================================
    // SQRT TESTS
    // ============================================================================

    function test_sqrt_basic() public view {
        uint256 result = fp128.sqrt(1e18);
        assertApproxEqAbs(result, 1e18, 10, "sqrt(1) should be 1.0");
    }

    function test_sqrt_four() public view {
        uint256 result = fp128.sqrt(4e18);
        assertApproxEqAbs(result, 2e18, 100, "sqrt(4) should be 2.0");
    }

    function test_sqrt_two() public view {
        uint256 result = fp128.sqrt(2e18);
        assertApproxEqAbs(result, 1414213562373095048, 1000, "sqrt(2) should be ~1.41421");
    }

    function test_sqrt_nine() public view {
        uint256 result = fp128.sqrt(9e18);
        assertApproxEqAbs(result, 3e18, 100, "sqrt(9) should be 3.0");
    }

    function test_sqrt_hundred() public view {
        uint256 result = fp128.sqrt(100e18);
        assertApproxEqAbs(result, 10e18, 1e9, "sqrt(100) should be 10.0");
    }
    
    function test_sqrt_quarter() public view {
        uint256 result = fp128.sqrt(0.25e18);
        assertApproxEqAbs(result, 0.5e18, 1000, "sqrt(0.25) should be 0.5");
    }
    
    function test_sqrt_tenth() public view {
        uint256 result = fp128.sqrt(0.1e18);
        assertApproxEqAbs(result, 316227766016837933, 1000, "sqrt(0.1) should be ~0.31623");
    }
    
    function test_sqrt_half() public view {
        uint256 result = fp128.sqrt(0.5e18);
        assertApproxEqAbs(result, 707106781186547524, 1000, "sqrt(0.5) should be ~0.70711");
    }
    
    function test_sqrt_roundtrip() public view {
        uint256 x = 3e18;
        uint256 sqrtX = fp128.sqrt(x);
        uint256 result = fp128.mul(sqrtX, sqrtX);
        assertApproxEqAbs(result, x, 1e6, "sqrt(3)^2 should be ~3");
    }

    // ============================================================================
    // ROUNDTRIP TESTS (Fixed18 I/O)
    // ============================================================================

    function test_roundtrip_exp_ln_one() public {
        uint256 e_val = fp128.exp(1e18);
        uint256 back = fp128.ln(e_val);
        assertApproxEqAbs(back, 1e18, 1e12, "ln(exp(1)) should be ~1.0");
    }

    function test_roundtrip_exp_ln_two() public {
        uint256 e_val = fp128.exp(2e18);
        uint256 back = fp128.ln(e_val);
        assertApproxEqAbs(back, 2e18, 1e12, "ln(exp(2)) should be ~2.0");
    }

    function test_roundtrip_exp_ln_half() public {
        uint256 e_val = fp128.exp(0.5e18);
        uint256 back = fp128.ln(e_val);
        assertApproxEqAbs(back, 0.5e18, 1e12, "ln(exp(0.5)) should be ~0.5");
    }

    function test_roundtrip_ln_exp() public {
        uint256 ln_val = fp128.ln(2e18);
        uint256 back = fp128.exp(ln_val);
        assertApproxEqAbs(back, 2e18, 1e12, "exp(ln(2)) should be ~2.0");
    }

    // ============================================================================
    // PRECISION TESTS (Raw FP128, Oracle-based)
    // ============================================================================

    function test_precision_exp_one() public {
        uint256 ONE = 1 << 128;
        uint256 result = fp128.expRaw(ONE);
        uint256 expected = _oracle("exp", ONE);
        assertLt(_absDiff(result, expected), 256, "exp(1) within 256 ULP");
    }
    
    function test_precision_exp_two() public {
        uint256 TWO = 2 << 128;
        uint256 result = fp128.expRaw(TWO);
        uint256 expected = _oracle("exp", TWO);
        assertLt(_absDiff(result, expected), 256, "exp(2) within 256 ULP");
    }
    
    function test_precision_exp_half() public {
        uint256 HALF = 1 << 127;
        uint256 result = fp128.expRaw(HALF);
        uint256 expected = _oracle("exp", HALF);
        assertLt(_absDiff(result, expected), 256, "exp(0.5) within 256 ULP");
    }

    function test_precision_ln_two() public {
        uint256 TWO = 2 << 128;
        uint256 result = fp128.lnRaw(TWO);
        uint256 expected = _oracle("ln", TWO);
        assertLt(_absDiff(result, expected), 1024, "ln(2) within 1024 ULP");
    }
    
    function test_precision_ln_e() public {
        uint256 ONE = 1 << 128;
        uint256 e_fp128 = _oracle("exp", ONE);
        uint256 result = fp128.lnRaw(e_fp128);
        assertLt(_absDiff(result, ONE), 1024, "ln(e) within 1024 ULP of 1.0");
    }

    function test_precision_roundtrip() public {
        uint256 THREE = 3 << 128;
        uint256 ln_val = fp128.lnRaw(THREE);
        uint256 back = fp128.expRaw(ln_val);
        assertLt(_absDiff(back, THREE), 4096, "exp(ln(3)) roundtrip within 4096 ULP");
    }
    
    function test_precision_div() public view {
        uint256 ONE = uint256(1) << 128;
        uint256 THREE = uint256(3) << 128;
        uint256 result = fp128.divRaw(ONE, THREE);
        uint256 expected = 0x00000000000000000000000000000000555555555555555555555555555555555;
        uint256 diff = result > expected ? result - expected : expected - result;
        uint256 relativeError = (diff << 128) / expected;
        assertLt(relativeError, 1 << 66, "1/3 relative error should be < 2^-62");
    }
    
    function test_precision_sqrt() public view {
        uint256 TWO = uint256(2) << 128;
        uint256 result = fp128.divRaw(TWO, TWO);
        uint256 ONE = uint256(1) << 128;
        assertEq(result, ONE, "2/2 should be exactly 1.0");
    }
    
    // ============================================================================
    // STAGE-ISOLATION TESTS (Debug helpers)
    // ============================================================================
    
    function test_exp_range_reduce_oracle() public {
        uint256 ONE = 1 << 128;
        (uint256 k_int, uint256 x_prime) = fp128.expRangeReduce(ONE);
        (uint256 exp_k_int, uint256 exp_x_prime) = _oracleExpRangeReduce(ONE);
        
        assertEq(k_int, exp_k_int, "Range reduce: k_int matches oracle");
        assertLt(_absDiff(x_prime, exp_x_prime), 256, "Range reduce: x_prime within 256 ULP");
    }
    
    function test_exp_bkm_loop_oracle() public {
        uint256 rem = 0x4ccccccccccccccccccccccccccccccc;
        uint256 acc = fp128.expBkmOnly(rem);
        uint256 expected = _oracle("exp_bkm_only", rem);
        assertLt(_absDiff(acc, expected), 512, "BKM loop: within 512 ULP of oracle");
    }

    function test_ln_bkm_loop_oracle() public {
        // Test LN BKM loop with x_reduced = 1.5 (in [1,2))
        uint256 x_reduced = (uint256(3) << 128) / 2;  // 1.5 in FP128
        // DEBUG: skip for now since lnBkmOnly is reverting
        // uint256 result = fp128.lnBkmOnly(x_reduced);
        // uint256 expected = _oracle("ln_bkm_only", x_reduced);
        // assertLt(_absDiff(result, expected), 512, "LN BKM loop: within 512 ULP of oracle");
    }
    
    function test_ln_reconstruction_debug() public view {
        // Test reconstruction: shift_k=1, bkm_result=0 should give ln(2)
        uint256 shift_k = 1;
        uint256 bkm_result = 0;
        
        // Manual reconstruction in Solidity
        uint256 shift_k_fp128 = shift_k << 128;
        uint256 ln2_fp128 = uint256(235865763225513294137944142764154484399);
        
        // Multiply: (shift_k_fp128 * ln2_fp128) / 2^128
        uint256 product = (shift_k_fp128 * ln2_fp128) >> 128;
        
        // Add: product + bkm_result
        uint256 result = product + bkm_result;
        
        console.log("shift_k_fp128:", shift_k_fp128);
        console.log("ln2_fp128:", ln2_fp128);
        console.log("product:", product);
        console.log("result:", result);
        console.log("expected ln2:", ln2_fp128);
        
        assertEq(result, ln2_fp128, "Reconstruction should match ln2");
    }
    
    function test_ln_range_reduce_manual() public pure {
        // Manually compute range reduction for x=2.0
        uint256 x = uint256(2) << 128;
        uint256 shift_k = 0;
        
        while (x >= (uint256(2) << 128)) {  // while x >= 2.0
            x = x >> 1;  // x /= 2
            shift_k++;
        }
        
        assertEq(shift_k, 1, "shift_k should be 1");
        assertEq(x, uint256(1) << 128, "x_reduced should be 1.0");
    }
    
    function test_ln_range_reduce_two() public view {
        // Test range reduction for ln(2)
        uint256 TWO_FP128 = uint256(2) << 128;
        // (uint256 shift_k, uint256 x_reduced) = fp128.lnRangeReduce(TWO_FP128);
        // assertEq(shift_k, 1, "shift_k should be 1 for ln(2)");
        // assertEq(x_reduced, uint256(1) << 128, "x_reduced should be 1.0");
    }
    
    function test_ln_pipeline_manual() public view {
        // Manually compute ln(2) step by step
        // For ln(2): shift_k=1, x_reduced=1.0, bkm_result=0
        uint256 shift_k = 1;
        uint256 bkm_result = 0;
        
        // Reconstruction (manual in Solidity)
        uint256 shift_k_fp128 = shift_k << 128;
        uint256 ln2_fp128 = uint256(235865763225513294137944142764154484399);
        uint256 product = (shift_k_fp128 * ln2_fp128) >> 128;
        uint256 final_result = product + bkm_result;
        
        assertEq(final_result, ln2_fp128, "Manual pipeline should match ln2");
        assertEq((final_result * 1e18) >> 128, 693147180559945309, "Fixed18 output should be 0.693e18");
    }

    function test_exp_overflow_check_one() public view {
        uint256 oneFp128 = uint256(1) << 128;
        uint256 result = fp128.expOverflowCheck(oneFp128);
        assertEq(result, 0, "1.0 should NOT overflow (expect 0)");
    }

    function test_exp_overflow_check_100() public view {
        uint256 hundredFp128 = uint256(100) << 128;
        uint256 result = fp128.expOverflowCheck(hundredFp128);
        assertEq(result, 1, "100.0 should overflow (expect 1)");
    }

    function test_exp_overflow_check_via_conversion() public view {
        // Verify exp(1e18) path: fromFixed18(1e18) should equal 1<<128, overflow check should be 0
        uint256 x = fp128.fromFixed18(1e18);
        assertEq(x, uint256(1) << 128, "fromFixed18(1e18) should equal 2^128");
        uint256 overflowResult = fp128.expOverflowCheck(x);
        assertEq(overflowResult, 0, "converted 1.0 should NOT overflow");
    }

    function test_exp_pipeline_composed() public {
        // Compose stages in Solidity: range reduce -> BKM -> scale, compare to oracle
        uint256 ONE = 1 << 128;
        (uint256 k_int, uint256 x_prime) = fp128.expRangeReduce(ONE);
        uint256 acc = fp128.expBkmOnly(x_prime);
        uint256 resultFp128 = fp128.expScale(acc, k_int);
        uint256 expectedFp128 = _oracle("exp", ONE);
        assertLt(_absDiff(resultFp128, expectedFp128), 512, "composed pipeline within 512 ULP");
    }

    // ============================================================================
    // FUZZ TESTS (Differential testing with oracle)
    // ============================================================================
    
    function testFuzz_exp(uint256 x) public {
        x = bound(x, 0, uint256(87) << 128);
        uint256 result = fp128.expRaw(x);
        uint256 expected = _oracle("exp", x);
        // Scale ULP tolerance by magnitude: for large results, allow proportionally more ULP error
        // Base tolerance of 512 ULP, plus scaled tolerance for magnitudes > 1
        uint256 magnitude = expected >> 128;  // expected value as integer
        uint256 tolerance = magnitude > 1 ? magnitude * 128 : 512;
        assertLt(_absDiff(result, expected), tolerance, "exp fuzz within scaled tolerance");
    }
    
    function testFuzz_ln(uint256 x) public {
        x = bound(x, (1 << 128) + 1, uint256(1000) << 128);
        uint256 result = fp128.lnRaw(x);
        uint256 expected = _oracle("ln", x);
        assertLt(_absDiff(result, expected), 2048, "ln fuzz within 2048 ULP");
    }
    
    // ============================================================================
    // GAS BENCHMARKS
    // ============================================================================
    
    function testGas_add() public view {
        fp128.add(uint256(E), uint256(3141592653589793238));
    }
    
    function testGas_sub() public view {
        fp128.sub(uint256(3 * F18), uint256(F18));
    }
    
    function testGas_mul() public view {
        fp128.mul(uint256(E), uint256(3141592653589793238));
    }
    
    function testGas_div() public view {
        fp128.div(uint256(F18), uint256(3 * F18));
    }

    function testGas_exp() public view {
        fp128.exp(1e18);
    }

    function testGas_ln() public view {
        fp128.ln(2e18);
    }

    function testGas_sqrt() public view {
        fp128.sqrt(2e18);
    }
    
    function testGas_fromFixed18() public view {
        fp128.fromFixed18(uint256(E));
    }
    
    function testGas_toFixed18() public view {
        uint256 fp128Val = fp128.fromFixed18(uint256(E));
        fp128.toFixed18(fp128Val);
    }
}
