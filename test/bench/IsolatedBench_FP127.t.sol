// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

interface IFP127 {
    function mulRaw(uint256, uint256) external view returns (uint256);
    function divRaw(uint256, uint256) external view returns (uint256);
    function expRaw(uint256) external view returns (uint256);
    function exp2Raw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function sqrtRaw(uint256) external view returns (uint256);
    function powRaw(uint256, uint256) external view returns (uint256);
}

/// @title Isolated Gas Benchmark for FP127
/// @notice Measures FP127 operations via external calls for fair comparison
contract IsolatedBench_FP127 is Test {
    IFP127 fp127;
    uint256 constant ONE_FP127 = uint256(1) << 128;

    function setUp() public {
        // Deploy fp127 Huff contract
        string memory hexStr = vm.readFile("contracts/build/huff/test_fp127.runtime.bin");
        bytes memory code = vm.parseBytes(string.concat("0x", hexStr));
        address addr = makeAddr("fp127");
        vm.etch(addr, code);
        fp127 = IFP127(addr);
        
        // Warmup: pay cold address cost outside measurement
        fp127.mulRaw(ONE_FP127, ONE_FP127);
    }

    // Helper: Convert WAD to fp127
    function _wadToFp127(int256 wad) internal pure returns (uint256) {
        bool negative = wad < 0;
        uint256 abs_wad = uint256(negative ? -wad : wad);
        uint256 result = (abs_wad << 128) / 1e18;
        if (negative) {
            return uint256(-int256(result));
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTIPLICATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_mul_pi_times_e() public view {
        uint256 a = _wadToFp127(3141592653589793238);
        uint256 b = _wadToFp127(2718281828459045235);
        uint256 g0 = gasleft();
        fp127.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|pi * e|mul|", gas);
    }

    function test_mul_sqrt2_times_sqrt3() public view {
        uint256 a = _wadToFp127(1414213562373095048);
        uint256 b = _wadToFp127(1732050807568877293);
        uint256 g0 = gasleft();
        fp127.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|sqrt2 * sqrt3|mul|", gas);
    }

    function test_mul_phi_times_inv_phi() public view {
        uint256 a = _wadToFp127(1618033988749894848);
        uint256 b = _wadToFp127(618033988749894848);
        uint256 g0 = gasleft();
        fp127.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|phi * (1/phi)|mul|", gas);
    }

    function test_mul_third_times_3() public view {
        uint256 a = _wadToFp127(333333333333333333);
        uint256 b = _wadToFp127(3000000000000000000);
        uint256 g0 = gasleft();
        fp127.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|1/3 * 3|mul|", gas);
    }

    function test_mul_e_times_e() public view {
        uint256 a = _wadToFp127(2718281828459045235);
        uint256 b = _wadToFp127(2718281828459045235);
        uint256 g0 = gasleft();
        fp127.mulRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|e * e|mul|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIVISION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_div_pi_div_e() public view {
        uint256 a = _wadToFp127(3141592653589793238);
        uint256 b = _wadToFp127(2718281828459045235);
        uint256 g0 = gasleft();
        fp127.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|pi / e|div|", gas);
    }

    function test_div_e_div_pi() public view {
        uint256 a = _wadToFp127(2718281828459045235);
        uint256 b = _wadToFp127(3141592653589793238);
        uint256 g0 = gasleft();
        fp127.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|e / pi|div|", gas);
    }

    function test_div_1_div_3() public view {
        uint256 a = _wadToFp127(1000000000000000000);
        uint256 b = _wadToFp127(3000000000000000000);
        uint256 g0 = gasleft();
        fp127.divRaw(a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|1 / 3|div|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        uint256 a = _wadToFp127(3141592653589793238);
        uint256 b = _wadToFp127(2718281828459045235);
        uint256 g0 = gasleft();
        uint256 result = a + b;
        uint256 gas = g0 - gasleft();
        // Prevent compiler optimization
        require(result > 0, "add result");
        console.log("ISOLATED_BENCH|fp127|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        uint256 a = _wadToFp127(5000000000000000000);
        uint256 b = _wadToFp127(3000000000000000000);
        uint256 g0 = gasleft();
        uint256 result = a - b;
        uint256 gas = g0 - gasleft();
        // Prevent compiler optimization
        require(result > 0, "sub result");
        console.log("ISOLATED_BENCH|fp127|5 - 3|sub|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCENDENTAL TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_exp_1() public view {
        uint256 a = _wadToFp127(1000000000000000000);
        uint256 g0 = gasleft();
        fp127.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|exp(1)|exp|", gas);
    }

    function test_exp_2() public view {
        uint256 a = _wadToFp127(2000000000000000000);
        uint256 g0 = gasleft();
        fp127.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|exp(2)|exp|", gas);
    }

    function test_exp_half() public view {
        uint256 a = _wadToFp127(500000000000000000);
        uint256 g0 = gasleft();
        fp127.expRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|exp(0.5)|exp|", gas);
    }

    function test_ln_e() public view {
        uint256 a = _wadToFp127(2718281828459045235);
        uint256 g0 = gasleft();
        fp127.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|ln(e)|ln|", gas);
    }

    function test_ln_2() public view {
        uint256 a = _wadToFp127(2000000000000000000);
        uint256 g0 = gasleft();
        fp127.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|ln(2)|ln|", gas);
    }

    function test_ln_10() public view {
        uint256 a = _wadToFp127(10000000000000000000);
        uint256 g0 = gasleft();
        fp127.lnRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|ln(10)|ln|", gas);
    }

    function test_sqrt_2() public view {
        uint256 a = _wadToFp127(2000000000000000000);
        uint256 g0 = gasleft();
        fp127.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|sqrt(2)|sqrt|", gas);
    }

    function test_sqrt_pi() public view {
        uint256 a = _wadToFp127(3141592653589793238);
        uint256 g0 = gasleft();
        fp127.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|sqrt(pi)|sqrt|", gas);
    }

    function test_sqrt_10() public view {
        uint256 a = _wadToFp127(10000000000000000000);
        uint256 g0 = gasleft();
        fp127.sqrtRaw(a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|fp127|sqrt(10)|sqrt|", gas);
    }
}
