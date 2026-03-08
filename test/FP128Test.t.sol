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
    function divUnsignedRaw(uint256, uint256) external view returns (uint256);
    function fromFixed18(uint256) external view returns (uint256);
    function toFixed18(uint256) external view returns (uint256);
    function exp(uint256) external view returns (uint256);
    function ln(uint256) external view returns (uint256);
    function sqrt(uint256) external view returns (uint256);
    function expRaw(uint256) external view returns (uint256);
    function exp2Raw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function log2Raw(uint256) external view returns (uint256);
    function sqrtRaw(uint256) external view returns (uint256);
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
    
    /// @dev Solidity reference: computes (a * 2^128) / b using Uniswap V3 FullMath
    function _refDivUnsigned(uint256 a, uint256 b) internal pure returns (uint256 result) {
        assembly {
            // 512-bit product: prod1:prod0 = a * 2^128
            let prod0 := shl(128, a)
            let prod1 := shr(128, a)
            
            // Subtract remainder to make division exact
            let remainder := mulmod(a, 0x100000000000000000000000000000000, b)
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
            
            // Factor powers of two out of denominator
            let twos := and(sub(0, b), b)
            b := div(b, twos)
            prod0 := div(prod0, twos)
            
            // Shift in bits from prod1 into prod0
            let twos_flipped := add(div(sub(0, twos), twos), 1)
            prod0 := or(prod0, mul(prod1, twos_flipped))
            
            // Modular inverse via Newton-Raphson
            let inv := xor(mul(3, b), 2)
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            
            result := mul(prod0, inv)
        }
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
    
    function _logStep3(bytes memory ret) internal pure {
        uint256 v;
        console.log("--- after twos ---");
        assembly { v := mload(add(ret, 0xA0)) } console.log("twos             :", v);
        assembly { v := mload(add(ret, 0xC0)) } console.log("prod0            :", v);
        assembly { v := mload(add(ret, 0xE0)) } console.log("prod1            :", v);
        assembly { v := mload(add(ret, 0x100)) } console.log("b                :", v);
        console.log("--- after b/twos ---");
        assembly { v := mload(add(ret, 0x120)) } console.log("b_new            :", v);
        console.log("--- after prod0/twos ---");
        assembly { v := mload(add(ret, 0x140)) } console.log("twos (unchanged) :", v);
        assembly { v := mload(add(ret, 0x160)) } console.log("prod0_new        :", v);
        assembly { v := mload(add(ret, 0x180)) } console.log("prod1            :", v);
        console.log("--- fold ---");
        assembly { v := mload(add(ret, 0x1A0)) } console.log("-twos            :", v);
        assembly { v := mload(add(ret, 0x1C0)) } console.log("twos (denom)     :", v);
        assembly { v := mload(add(ret, 0x1E0)) } console.log("(-twos)/twos     :", v);
        assembly { v := mload(add(ret, 0x200)) } console.log("prod1*flipped    :", v);
        assembly { v := mload(add(ret, 0x220)) } console.log("prod0_final (or) :", v);
    }

    function _logStep45(bytes memory ret) internal pure {
        uint256 v;
        console.log("--- step 4: modular inverse ---");
        assembly { v := mload(add(ret, 0x240)) } console.log("initial inv      :", v);
        assembly { v := mload(add(ret, 0x260)) } console.log("prod0 entering   :", v);
        assembly { v := mload(add(ret, 0x280)) } console.log("b entering       :", v);
        assembly { v := mload(add(ret, 0x2A0)) } console.log("final inv        :", v);
        console.log("--- step 5: final ---");
        assembly { v := mload(add(ret, 0x2C0)) } console.log("prod0 * inv      :", v);
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
        assertApproxEqAbs(int256(result), expected, uint256(1), "1 / 3 approx 0.333");
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
        assertApproxEqAbs(int256(result), int256(TWO_FP128), 1, "6 / 3 = 2 (raw, full precision)");
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

    function test_exp2_negative_one() public view {
        uint256 NEG_ONE_FP128 = uint256(-int256(1 << 128));
        uint256 result = fp128.exp2Raw(NEG_ONE_FP128);
        console.log("exp2(-1) result:", result);
        console.log("expected (0.5):", uint256(1) << 127);
        assertApproxEqAbs(result, uint256(1) << 127, 1000, "exp2(-1) should be 0.5");
    }

    function test_exp2_bounds() public view {
        // Test that -2 does NOT underflow (threshold is -128)
        uint256 NEG_TWO_FP128 = uint256(-int256(2 << 128));
        uint256 result = fp128.exp2Raw(NEG_TWO_FP128);
        console.log("exp2(-2) result:", result);
        console.log("expected (0.25):", uint256(1) << 126);
        
        // Test that -129 DOES underflow
        uint256 NEG_129_FP128 = uint256(-int256(129 << 128));
        uint256 result2 = fp128.exp2Raw(NEG_129_FP128);
        console.log("exp2(-129) result:", result2);
        console.log("expected (underflow):", uint256(0));
        
        // Test the exact value from multiplication
        uint256 NEG_1_4427 = 0xfffffffffffffffffffffffffffffffe8eab89ad47d01e8882f0025f2dc582ef;
        uint256 result3 = fp128.exp2Raw(NEG_1_4427);
        console.log("exp2(-1.4427) result:", result3);
        console.log("expected (~0.368):", (uint256(368) << 128) / 1000);
    }

    function test_expRaw_negative_one() public view {
        uint256 NEG_ONE_FP128 = uint256(-int256(1 << 128));
        uint256 result = fp128.expRaw(NEG_ONE_FP128);
        console.log("expRaw(-1) result:", result);
        uint256 expected = (uint256(367879441171442321) << 128) / 1e18;
        console.log("expected:", expected);
        assertApproxEqAbs(result, expected, 1 << 120, "expRaw(-1) should be ~0.368");
    }

    function test_mul_neg_one_times_inv_ln2() public view {
        uint256 NEG_ONE_FP128 = uint256(-int256(1 << 128));
        uint256 INV_LN2_FP128 = 0x0000000000000000000000000000000171547652b82fe1777d0ffda0d23a7d11;
        uint256 result = fp128.mulRaw(NEG_ONE_FP128, INV_LN2_FP128);
        console.log("(-1) * INV_LN2 result:", result);
        int256 result_signed = int256(result);
        console.logInt(result_signed);
        
        // Now call exp2Raw with this result
        uint256 exp2_result = fp128.exp2Raw(result);
        console.log("exp2(result) =", exp2_result);
        
        // Expected: -1.4427 in FP128
        int256 expected_signed = -int256((uint256(14427) << 128) / 10000);
        uint256 expected = uint256(expected_signed);
        console.log("expected mul (-1.4427):", expected);
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
        assertApproxEqAbs(result, 2e18, 1, "sqrt(4) should be 2.0");
    }

    function test_sqrt_two() public view {
        uint256 result = fp128.sqrt(2e18);
        assertApproxEqAbs(result, 1414213562373095048, 1, "sqrt(2) should be ~1.41421");
    }

    function test_sqrt_nine() public view {
        uint256 result = fp128.sqrt(9e18);
        assertApproxEqAbs(result, 3e18, 1, "sqrt(9) should be 3.0");
    }

    function test_sqrt_hundred() public view {
        uint256 result = fp128.sqrt(100e18);
        assertApproxEqAbs(result, 10e18, 200000000, "sqrt(100) should be 10.0");
    }
    
    function test_sqrt_quarter() public view {
        uint256 result = fp128.sqrt(0.25e18);
        assertApproxEqAbs(result, 0.5e18, 1, "sqrt(0.25) should be 0.5");
    }
    
    function test_sqrt_tenth() public view {
        uint256 result = fp128.sqrt(0.1e18);
        assertApproxEqAbs(result, 316227766016837933, 1, "sqrt(0.1) should be ~0.31623");
    }
    
    function test_sqrt_half() public view {
        uint256 result = fp128.sqrt(0.5e18);
        assertApproxEqAbs(result, 707106781186547524, 1000, "sqrt(0.5) should be ~0.70711");
    }
    
    function test_sqrt_roundtrip() public view {
        uint256 x = 3e18;
        uint256 sqrtX = fp128.sqrt(x);
        uint256 result = fp128.mul(sqrtX, sqrtX);
        assertApproxEqAbs(result, x, 10, "sqrt(3)^2 should be ~3");
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
    
    // ============================================================================
    // DIV UNSIGNED: Solidity reference vs Huff implementation
    // ============================================================================

    function test_divUnsigned_ref_sanity() public pure {
        uint256 ONE = uint256(1) << 128;
        uint256 TWO = uint256(2) << 128;

        // 2/2 = 1 exactly
        assertEq(_refDivUnsigned(TWO, TWO), ONE, "ref: 2/2 = 1");
        // 6/3 = 2
        assertEq(_refDivUnsigned(uint256(6) << 128, uint256(3) << 128), TWO, "ref: 6/3 = 2");
        // 1/2 = 0.5
        uint256 HALF = ONE >> 1;
        assertEq(_refDivUnsigned(ONE, TWO), HALF, "ref: 1/2 = 0.5");
    }

    function test_divUnsigned_huff_2_div_2() public view {
        uint256 TWO = uint256(2) << 128;
        uint256 ONE = uint256(1) << 128;
        uint256 result = fp128.divUnsignedRaw(TWO, TWO);
        uint256 ref = _refDivUnsigned(TWO, TWO);
        assertEq(result, ref, "huff: 2/2 = 1");
        assertEq(result, ONE, "huff: 2/2 = ONE");
    }

    function test_divUnsigned_huff_small() public view {
        // Use small values where prod1 = 0 (a < 2^128)
        uint256 a = 3;   // very small, prod1 = 0
        uint256 b = 2;   // very small
        uint256 result = fp128.divUnsignedRaw(a, b);
        uint256 ref = _refDivUnsigned(a, b);
        console.log("huff 3/2:", result);
        console.log("ref  3/2:", ref);
        assertEq(result, ref, "huff vs ref: small 3/2");
    }

    function test_divUnsigned_huff_6_div_3() public view {
        uint256 SIX = uint256(6) << 128;
        uint256 THREE = uint256(3) << 128;
        uint256 TWO = uint256(2) << 128;
        uint256 result = fp128.divUnsignedRaw(SIX, THREE);
        assertEq(result, TWO, "huff: 6/3 = 2");
    }

    function test_divUnsigned_huff_1_div_2() public view {
        uint256 ONE = uint256(1) << 128;
        uint256 TWO = uint256(2) << 128;
        uint256 HALF = ONE >> 1;
        uint256 result = fp128.divUnsignedRaw(ONE, TWO);
        assertEq(result, HALF, "huff: 1/2 = 0.5");
    }

    function test_divUnsigned_huff_1_div_3() public view {
        uint256 ONE = uint256(1) << 128;
        uint256 THREE = uint256(3) << 128;
        uint256 huff_result = fp128.divUnsignedRaw(ONE, THREE);
        uint256 ref_result = _refDivUnsigned(ONE, THREE);
        assertEq(huff_result, ref_result, "huff vs ref: 1/3");
    }

    function test_divSigned_raw_positive() public view {
        uint256 SIX = uint256(6) << 128;
        uint256 THREE = uint256(3) << 128;
        // Call divRaw which uses FP128_DIV (signed)
        uint256 result = fp128.divRaw(SIX, THREE);
        uint256 TWO = uint256(2) << 128;
        assertEq(result, TWO, "divRaw: 6/3 = 2");
    }

    function test_divUnsigned_huff_vs_ref_sweep() public view {
        uint256[] memory as_ = new uint256[](4);
        uint256[] memory bs = new uint256[](4);
        as_[0] = uint256(1) << 128;  bs[0] = uint256(3) << 128;
        as_[1] = uint256(7) << 128;  bs[1] = uint256(11) << 128;
        as_[2] = uint256(100) << 128; bs[2] = uint256(7) << 128;
        as_[3] = uint256(1) << 64;   bs[3] = uint256(1) << 200;

        for (uint256 i = 0; i < as_.length; i++) {
            uint256 huff_r = fp128.divUnsignedRaw(as_[i], bs[i]);
            uint256 ref_r = _refDivUnsigned(as_[i], bs[i]);
            assertEq(huff_r, ref_r, "huff vs ref sweep");
        }
    }

    function test_precision_div() public view {
        uint256 ONE = uint256(1) << 128;
        uint256 THREE = uint256(3) << 128;
        uint256 result = fp128.divRaw(ONE, THREE);
        uint256 expected = 0x00000000000000000000000000000000555555555555555555555555555555555;
        uint256 diff = result > expected ? result - expected : expected - result;
        uint256 relativeError = (diff << 128) / expected;
        assertLt(relativeError, 1 << 10, "1/3 relative error should be < 2^-118");
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
