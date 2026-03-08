// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/src/bench/ABDKWrapper.sol";

/// @title Isolated Gas Benchmark for ABDK
/// @notice Measures ABDK operations via external calls for fair comparison
contract IsolatedBench_ABDK is Test {
    ABDKWrapper abdk;

    function setUp() public {
        // Deploy ABDK wrapper
        abdk = new ABDKWrapper();
        
        // Warmup: pay cold address cost outside measurement
        abdk.mulRaw(int128(1 << 64), int128(1 << 64));
    }

    // Helper: Convert WAD to ABDK 64.64
    function _wadToAbdk(int256 wad) internal pure returns (int128) {
        int256 result = (wad << 64) / int256(1e18);
        return int128(result);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTIPLICATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_mul_pi_times_e() public view {
        int128 a = _wadToAbdk(3141592653589793238);
        int128 b = _wadToAbdk(2718281828459045235);
        uint256 g0 = gasleft();
        abdk.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|pi * e|mul|", gas);
    }

    function test_mul_sqrt2_times_sqrt3() public view {
        int128 a = _wadToAbdk(1414213562373095048);
        int128 b = _wadToAbdk(1732050807568877293);
        uint256 g0 = gasleft();
        abdk.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|sqrt2 * sqrt3|mul|", gas);
    }

    function test_mul_phi_times_inv_phi() public view {
        int128 a = _wadToAbdk(1618033988749894848);
        int128 b = _wadToAbdk(618033988749894848);
        uint256 g0 = gasleft();
        abdk.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|phi * (1/phi)|mul|", gas);
    }

    function test_mul_third_times_3() public view {
        int128 a = _wadToAbdk(333333333333333333);
        int128 b = _wadToAbdk(3000000000000000000);
        uint256 g0 = gasleft();
        abdk.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|1/3 * 3|mul|", gas);
    }

    function test_mul_e_times_e() public view {
        int128 a = _wadToAbdk(2718281828459045235);
        int128 b = _wadToAbdk(2718281828459045235);
        uint256 g0 = gasleft();
        abdk.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|e * e|mul|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIVISION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_div_pi_div_e() public view {
        int128 a = _wadToAbdk(3141592653589793238);
        int128 b = _wadToAbdk(2718281828459045235);
        uint256 g0 = gasleft();
        abdk.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|pi / e|div|", gas);
    }

    function test_div_e_div_pi() public view {
        int128 a = _wadToAbdk(2718281828459045235);
        int128 b = _wadToAbdk(3141592653589793238);
        uint256 g0 = gasleft();
        abdk.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|e / pi|div|", gas);
    }

    function test_div_1_div_3() public view {
        int128 a = _wadToAbdk(1000000000000000000);
        int128 b = _wadToAbdk(3000000000000000000);
        uint256 g0 = gasleft();
        abdk.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|1 / 3|div|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        int128 a = _wadToAbdk(3141592653589793238);
        int128 b = _wadToAbdk(2718281828459045235);
        uint256 g0 = gasleft();
        int128 result = a + b;
        uint256 gas = g0 - gasleft();
        // Prevent compiler optimization
        require(result > 0, "add result");
        console.log("ISOLATED_BENCH|abdk|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        int128 a = _wadToAbdk(5000000000000000000);
        int128 b = _wadToAbdk(3000000000000000000);
        uint256 g0 = gasleft();
        int128 result = a - b;
        uint256 gas = g0 - gasleft();
        // Prevent compiler optimization
        require(result > 0, "sub result");
        console.log("ISOLATED_BENCH|abdk|5 - 3|sub|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCENDENTAL TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_exp_1() public view {
        int128 a = _wadToAbdk(1000000000000000000);
        uint256 g0 = gasleft();
        abdk.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|exp(1)|exp|", gas);
    }

    function test_exp_2() public view {
        int128 a = _wadToAbdk(2000000000000000000);
        uint256 g0 = gasleft();
        abdk.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|exp(2)|exp|", gas);
    }

    function test_exp_half() public view {
        int128 a = _wadToAbdk(500000000000000000);
        uint256 g0 = gasleft();
        abdk.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|exp(0.5)|exp|", gas);
    }

    function test_ln_e() public view {
        int128 a = _wadToAbdk(2718281828459045235);
        uint256 g0 = gasleft();
        abdk.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|ln(e)|ln|", gas);
    }

    function test_ln_2() public view {
        int128 a = _wadToAbdk(2000000000000000000);
        uint256 g0 = gasleft();
        abdk.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|ln(2)|ln|", gas);
    }

    function test_ln_10() public view {
        int128 a = _wadToAbdk(10000000000000000000);
        uint256 g0 = gasleft();
        abdk.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|ln(10)|ln|", gas);
    }

    function test_sqrt_2() public view {
        int128 a = _wadToAbdk(2000000000000000000);
        uint256 g0 = gasleft();
        abdk.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|sqrt(2)|sqrt|", gas);
    }

    function test_sqrt_pi() public view {
        int128 a = _wadToAbdk(3141592653589793238);
        uint256 g0 = gasleft();
        abdk.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|sqrt(pi)|sqrt|", gas);
    }

    function test_sqrt_10() public view {
        int128 a = _wadToAbdk(10000000000000000000);
        uint256 g0 = gasleft();
        abdk.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|abdk|sqrt(10)|sqrt|", gas);
    }
}
