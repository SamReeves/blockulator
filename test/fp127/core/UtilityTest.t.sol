// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../base/FP127TestBase.sol";

contract UtilityTest is FP127TestBase {
    function setUp() public {
        _deployFP127();
    }

    // ============================================================================
    // ABS TESTS
    // ============================================================================
    
    function test_abs_positive() public view {
        uint256 result = fp127.abs(uint256(5e18));
        assertEq(result, uint256(5e18), "abs(5) = 5");
    }
    
    function test_abs_negative() public view {
        int256 negFive = -5e18;
        uint256 result = fp127.abs(uint256(negFive));
        assertEq(result, uint256(5e18), "abs(-5) = 5");
    }
    
    function test_abs_zero() public view {
        uint256 result = fp127.abs(0);
        assertEq(result, 0, "abs(0) = 0");
    }
    
    function test_precision_abs() public {
        uint256 NEG_PI = uint256(-int256((uint256(3141592653589793238) << 128) / 1e18));
        uint256 result = fp127.absRaw(NEG_PI);
        uint256 expected = _oracle("abs", NEG_PI);
        assertEq(result, expected, "abs raw should be exact (0 ULP)");
    }
    
    function testFuzz_abs(int256 x) public view {
        x = bound(x, -1e27, 1e27);
        uint256 x_fixed18 = uint256(x);
        uint256 result = fp127.abs(x_fixed18);
        uint256 expected = uint256(x < 0 ? -x : x);
        assertApproxEqAbs(result, expected, 1, "abs fuzz");
    }

    // ============================================================================
    // NEG TESTS
    // ============================================================================
    
    function test_neg_positive() public view {
        uint256 result = fp127.neg(uint256(5e18));
        assertEq(result, uint256(int256(-5e18)), "neg(5) = -5");
    }
    
    function test_neg_negative() public view {
        int256 negFive = -5e18;
        uint256 result = fp127.neg(uint256(negFive));
        assertEq(result, uint256(5e18), "neg(-5) = 5");
    }
    
    function test_neg_zero() public view {
        uint256 result = fp127.neg(0);
        assertEq(result, 0, "neg(0) = 0");
    }
    
    function test_neg_double_negation() public view {
        uint256 result1 = fp127.neg(uint256(42e18));
        uint256 result2 = fp127.neg(result1);
        assertEq(result2, uint256(42e18), "neg(neg(42)) = 42");
    }

    // ============================================================================
    // INV TESTS
    // ============================================================================
    
    function test_inv_two() public view {
        uint256 result = fp127.inv(uint256(2e18));
        assertApproxEqAbs(result, 5e17, 1e12, "inv(2) approx 0.5");
    }
    
    function test_inv_half() public view {
        uint256 result = fp127.inv(uint256(5e17));
        assertApproxEqAbs(result, 2e18, 1e12, "inv(0.5) approx 2");
    }
    
    function test_inv_one() public view {
        uint256 result = fp127.inv(uint256(1e18));
        assertApproxEqAbs(result, 1e18, 1e12, "inv(1) approx 1");
    }

    // ============================================================================
    // MIN/MAX TESTS
    // ============================================================================
    
    function test_min_basic() public view {
        uint256 result = fp127.min(uint256(3e18), uint256(5e18));
        assertEq(result, uint256(3e18), "min(3, 5) = 3");
    }
    
    function test_min_negative_vs_positive() public view {
        int256 negFive = -5e18;
        uint256 result = fp127.min(uint256(3e18), uint256(negFive));
        assertEq(result, uint256(negFive), "min(3, -5) = -5");
    }
    
    function test_max_basic() public view {
        uint256 result = fp127.max(uint256(3e18), uint256(5e18));
        assertEq(result, uint256(5e18), "max(3, 5) = 5");
    }
    
    function test_max_negative_vs_positive() public view {
        int256 negFive = -5e18;
        uint256 result = fp127.max(uint256(3e18), uint256(negFive));
        assertEq(result, uint256(3e18), "max(3, -5) = 3");
    }

    // ============================================================================
    // CLAMP TESTS
    // ============================================================================
    
    function test_clamp_within_range() public view {
        uint256 result = fp127.clamp(uint256(5e18), uint256(3e18), uint256(7e18));
        assertEq(result, uint256(5e18), "clamp(5, 3, 7) = 5");
    }
    
    function test_clamp_below_range() public view {
        uint256 result = fp127.clamp(uint256(1e18), uint256(3e18), uint256(7e18));
        assertEq(result, uint256(3e18), "clamp(1, 3, 7) = 3");
    }
    
    function test_clamp_above_range() public view {
        uint256 result = fp127.clamp(uint256(10e18), uint256(3e18), uint256(7e18));
        assertEq(result, uint256(7e18), "clamp(10, 3, 7) = 7");
    }

    // ============================================================================
    // AVG TESTS
    // ============================================================================
    
    function test_avg_basic() public view {
        uint256 result = fp127.avg(uint256(4e18), uint256(6e18));
        assertEq(result, uint256(5e18), "avg(4, 6) = 5");
    }
    
    function test_avg_equal() public view {
        uint256 result = fp127.avg(uint256(7e18), uint256(7e18));
        assertEq(result, uint256(7e18), "avg(7, 7) = 7");
    }

    // ============================================================================
    // DIST TESTS
    // ============================================================================
    
    function test_dist_positive_order() public view {
        uint256 result = fp127.dist(uint256(5e18), uint256(3e18));
        assertEq(result, uint256(2e18), "dist(5, 3) = 2");
    }
    
    function test_dist_reverse_order() public view {
        uint256 result = fp127.dist(uint256(3e18), uint256(5e18));
        assertEq(result, uint256(2e18), "dist(3, 5) = 2");
    }

    // ============================================================================
    // GAVG TESTS
    // ============================================================================
    
    function test_gavg_basic() public view {
        uint256 result = fp127.gavg(uint256(4e18), uint256(9e18));
        assertApproxEqAbs(result, uint256(6e18), 1e14, "gavg(4, 9) approx 6");
    }

    // ============================================================================
    // LOG10/EXP10 TESTS
    // ============================================================================
    
    function test_log10_ten() public view {
        uint256 result = fp127.log10(uint256(10e18));
        assertApproxEqAbs(result, uint256(1e18), 1e14, "log10(10) approx 1");
    }
    
    function test_exp10_one() public view {
        uint256 result = fp127.exp10(uint256(1e18));
        assertApproxEqAbs(result, uint256(10e18), 1e15, "exp10(1) approx 10");
    }

    // ============================================================================
    // SIGN TESTS
    // ============================================================================
    
    function test_sign_positive() public view {
        uint256 result = fp127.sign(uint256(5e18));
        assertEq(result, uint256(1e18), "sign(5) = 1");
    }
    
    function test_sign_negative() public view {
        uint256 result = fp127.sign(uint256(-int256(5e18)));
        assertEq(result, uint256(-int256(1e18)), "sign(-5) = -1");
    }
    
    function test_sign_zero() public view {
        uint256 result = fp127.sign(0);
        assertEq(result, 0, "sign(0) = 0");
    }

    // ============================================================================
    // FLOOR/CEIL/FRAC TESTS
    // ============================================================================
    
    function test_floor_positive_fractional() public view {
        uint256 result = fp127.floor(uint256(5.7e18));
        assertEq(result, uint256(5e18), "floor(5.7) = 5");
    }
    
    function test_ceil_positive_fractional() public view {
        uint256 result = fp127.ceil(uint256(5.3e18));
        assertEq(result, uint256(6e18), "ceil(5.3) = 6");
    }
    
    function test_frac_positive_fractional() public view {
        uint256 result = fp127.frac(uint256(5.7e18));
        assertApproxEqAbs(result, uint256(0.7e18), 1e15, "frac(5.7) ~ 0.7");
    }

    // ============================================================================
    // CBRT TESTS
    // ============================================================================
    
    function test_cbrt_eight() public view {
        uint256 result = fp127.cbrt(uint256(8e18));
        assertApproxEqAbs(result, uint256(2e18), 1e15, "cbrt(8) ~ 2");
    }
    
    function test_cbrt_twentyseven() public view {
        uint256 result = fp127.cbrt(uint256(27e18));
        assertApproxEqAbs(result, uint256(3e18), 1e15, "cbrt(27) ~ 3");
    }

    // ============================================================================
    // LERP TESTS
    // ============================================================================
    
    function test_lerp_at_zero() public view {
        uint256 result = fp127.lerp(uint256(10e18), uint256(20e18), 0);
        assertEq(result, uint256(10e18), "lerp(10, 20, 0) = 10");
    }
    
    function test_lerp_at_half() public view {
        uint256 result = fp127.lerp(uint256(10e18), uint256(20e18), uint256(0.5e18));
        assertApproxEqAbs(result, uint256(15e18), 1e15, "lerp(10, 20, 0.5) ~ 15");
    }

    // ============================================================================
    // HYPOT TESTS
    // ============================================================================
    
    function test_hypot_three_four() public view {
        uint256 result = fp127.hypot(uint256(3e18), uint256(4e18));
        assertApproxEqAbs(result, uint256(5e18), 1e15, "hypot(3, 4) ~ 5");
    }

    // ============================================================================
    // ROUND TESTS
    // ============================================================================
    
    function test_round_positive() public view {
        uint256 result = fp127.round(uint256(2.3e18));
        assertEq(result, uint256(2e18), "round(2.3) = 2");
    }
    
    function test_round_half_up() public view {
        uint256 result = fp127.round(uint256(2.5e18));
        assertEq(result, uint256(3e18), "round(2.5) = 3");
    }

    // ============================================================================
    // GCD TESTS
    // ============================================================================
    
    function test_gcd_basic() public view {
        uint256 result = fp127.gcd(uint256(48e18), uint256(18e18));
        assertEq(result, uint256(6e18), "gcd(48, 18) = 6");
    }
    
    function test_gcd_coprime() public view {
        uint256 result = fp127.gcd(uint256(17e18), uint256(19e18));
        assertEq(result, uint256(1e18), "gcd(17, 19) = 1");
    }

    // ============================================================================
    // FACTORIAL TESTS
    // ============================================================================
    
    function test_factorial_zero() public view {
        uint256 result = fp127.factorial(0);
        assertEq(result, uint256(1e18), "0! = 1");
    }
    
    function test_factorial_five() public view {
        uint256 result = fp127.factorial(uint256(5e18));
        assertEq(result, uint256(120e18), "5! = 120");
    }

    // ============================================================================
    // LAMBERT W0 TESTS
    // ============================================================================
    
    function test_lambertw0_zero() public view {
        uint256 result = fp127.lambertW0(0);
        assertEq(result, 0, "W(0) = 0");
    }
    
    function test_lambertw0_one() public view {
        uint256 result = fp127.lambertW0(uint256(1e18));
        assertApproxEqAbs(result, uint256(0.567143290409783873e18), 1e15, "W(1) ~ 0.5671");
    }
    
    function test_lambertw0_e() public view {
        uint256 result = fp127.lambertW0(uint256(E));
        assertApproxEqAbs(result, uint256(1e18), 1e15, "W(e) ~ 1");
    }
}
