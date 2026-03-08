// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/src/bench/SoladyWrapper.sol";

/// @title Isolated Gas Benchmark for Solady
/// @notice Measures Solady operations via external calls for fair comparison
contract IsolatedBench_Solady is Test {
    SoladyWrapper solady;
    uint256 constant WAD = 1e18;

    function setUp() public {
        // Deploy Solady wrapper
        solady = new SoladyWrapper();
        
        // Warmup: pay cold address cost outside measurement
        solady.mulRaw(WAD, WAD);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTIPLICATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_mul_pi_times_e() public view {
        uint256 a = uint256(3141592653589793238);
        uint256 b = uint256(2718281828459045235);
        uint256 g0 = gasleft();
        solady.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|pi * e|mul|", gas);
    }

    function test_mul_sqrt2_times_sqrt3() public view {
        uint256 a = uint256(1414213562373095048);
        uint256 b = uint256(1732050807568877293);
        uint256 g0 = gasleft();
        solady.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|sqrt2 * sqrt3|mul|", gas);
    }

    function test_mul_phi_times_inv_phi() public view {
        uint256 a = uint256(1618033988749894848);
        uint256 b = uint256(618033988749894848);
        uint256 g0 = gasleft();
        solady.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|phi * (1/phi)|mul|", gas);
    }

    function test_mul_third_times_3() public view {
        uint256 a = uint256(333333333333333333);
        uint256 b = uint256(3000000000000000000);
        uint256 g0 = gasleft();
        solady.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|1/3 * 3|mul|", gas);
    }

    function test_mul_e_times_e() public view {
        uint256 a = uint256(2718281828459045235);
        uint256 b = uint256(2718281828459045235);
        uint256 g0 = gasleft();
        solady.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|e * e|mul|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIVISION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_div_pi_div_e() public view {
        uint256 a = uint256(3141592653589793238);
        uint256 b = uint256(2718281828459045235);
        uint256 g0 = gasleft();
        solady.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|pi / e|div|", gas);
    }

    function test_div_e_div_pi() public view {
        uint256 a = uint256(2718281828459045235);
        uint256 b = uint256(3141592653589793238);
        uint256 g0 = gasleft();
        solady.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|e / pi|div|", gas);
    }

    function test_div_1_div_3() public view {
        uint256 a = uint256(1000000000000000000);
        uint256 b = uint256(3000000000000000000);
        uint256 g0 = gasleft();
        solady.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|1 / 3|div|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        uint256 a = uint256(3141592653589793238);
        uint256 b = uint256(2718281828459045235);
        uint256 g0 = gasleft();
        uint256 result = a + b;
        uint256 gas = g0 - gasleft();
        // Prevent compiler optimization
        require(result > 0, "add result");
        console.log("ISOLATED_BENCH|solady|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        uint256 a = uint256(5000000000000000000);
        uint256 b = uint256(3000000000000000000);
        uint256 g0 = gasleft();
        uint256 result = a - b;
        uint256 gas = g0 - gasleft();
        // Prevent compiler optimization
        require(result > 0, "sub result");
        console.log("ISOLATED_BENCH|solady|5 - 3|sub|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCENDENTAL TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_exp_1() public view {
        int256 a = int256(1000000000000000000);
        uint256 g0 = gasleft();
        solady.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|exp(1)|exp|", gas);
    }

    function test_exp_2() public view {
        int256 a = int256(2000000000000000000);
        uint256 g0 = gasleft();
        solady.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|exp(2)|exp|", gas);
    }

    function test_exp_half() public view {
        int256 a = int256(500000000000000000);
        uint256 g0 = gasleft();
        solady.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|exp(0.5)|exp|", gas);
    }

    function test_ln_e() public view {
        int256 a = int256(2718281828459045235);
        uint256 g0 = gasleft();
        solady.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|ln(e)|ln|", gas);
    }

    function test_ln_2() public view {
        int256 a = int256(2000000000000000000);
        uint256 g0 = gasleft();
        solady.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|ln(2)|ln|", gas);
    }

    function test_ln_10() public view {
        int256 a = int256(10000000000000000000);
        uint256 g0 = gasleft();
        solady.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|ln(10)|ln|", gas);
    }

    function test_sqrt_2() public view {
        uint256 a = uint256(2000000000000000000);
        uint256 g0 = gasleft();
        solady.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|sqrt(2)|sqrt|", gas);
    }

    function test_sqrt_pi() public view {
        uint256 a = uint256(3141592653589793238);
        uint256 g0 = gasleft();
        solady.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|sqrt(pi)|sqrt|", gas);
    }

    function test_sqrt_10() public view {
        uint256 a = uint256(10000000000000000000);
        uint256 g0 = gasleft();
        solady.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|solady|sqrt(10)|sqrt|", gas);
    }
}
