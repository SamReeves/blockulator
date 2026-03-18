// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

abstract contract IsolatedBenchBase is Test {
    // Math constants in WAD (1e18)
    int256 constant PI_WAD = 3141592653589793238;
    int256 constant E_WAD = 2718281828459045235;
    int256 constant SQRT2_WAD = 1414213562373095048;
    int256 constant SQRT3_WAD = 1732050807568877293;
    int256 constant PHI_WAD = 1618033988749894848;
    int256 constant INV_PHI_WAD = 618033988749894848;
    int256 constant THIRD_WAD = 333333333333333333;
    int256 constant THREE_WAD = 3000000000000000000;
    int256 constant ONE_WAD = 1000000000000000000;
    int256 constant TWO_WAD = 2000000000000000000;
    int256 constant FIVE_WAD = 5000000000000000000;
    int256 constant HALF_WAD = 500000000000000000;
    int256 constant TEN_WAD = 10000000000000000000;
    
    function _backendName() internal pure virtual returns (string memory);
    
    function _mulOp(int256 a, int256 b) internal view virtual returns (uint256);
    function _divOp(int256 a, int256 b) internal view virtual returns (uint256);
    function _expOp(int256 x) internal view virtual returns (uint256);
    function _lnOp(int256 x) internal view virtual returns (uint256);
    function _sqrtOp(int256 x) internal view virtual returns (uint256);
    
    function _supportsAdd() internal pure virtual returns (bool) { return false; }
    function _supportsSub() internal pure virtual returns (bool) { return false; }
    function _addOp(int256 a, int256 b) internal view virtual returns (uint256) { return 0; }
    function _subOp(int256 a, int256 b) internal view virtual returns (uint256) { return 0; }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTIPLICATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_mul_pi_times_e() public view {
        uint256 g0 = gasleft();
        _mulOp(PI_WAD, E_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|pi * e|mul|"), gas);
    }

    function test_mul_sqrt2_times_sqrt3() public view {
        uint256 g0 = gasleft();
        _mulOp(SQRT2_WAD, SQRT3_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|sqrt2 * sqrt3|mul|"), gas);
    }

    function test_mul_phi_times_inv_phi() public view {
        uint256 g0 = gasleft();
        _mulOp(PHI_WAD, INV_PHI_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|phi * (1/phi)|mul|"), gas);
    }

    function test_mul_third_times_3() public view {
        uint256 g0 = gasleft();
        _mulOp(THIRD_WAD, THREE_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|1/3 * 3|mul|"), gas);
    }

    function test_mul_e_times_e() public view {
        uint256 g0 = gasleft();
        _mulOp(E_WAD, E_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|e * e|mul|"), gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIVISION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_div_pi_div_e() public view {
        uint256 g0 = gasleft();
        _divOp(PI_WAD, E_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|pi / e|div|"), gas);
    }

    function test_div_e_div_pi() public view {
        uint256 g0 = gasleft();
        _divOp(E_WAD, PI_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|e / pi|div|"), gas);
    }

    function test_div_1_div_3() public view {
        uint256 g0 = gasleft();
        _divOp(ONE_WAD, THREE_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|1 / 3|div|"), gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCENDENTAL TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_exp_1() public view {
        uint256 g0 = gasleft();
        _expOp(ONE_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|exp(1)|exp|"), gas);
    }

    function test_exp_2() public view {
        uint256 g0 = gasleft();
        _expOp(TWO_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|exp(2)|exp|"), gas);
    }

    function test_exp_half() public view {
        uint256 g0 = gasleft();
        _expOp(HALF_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|exp(0.5)|exp|"), gas);
    }

    function test_ln_e() public view {
        uint256 g0 = gasleft();
        _lnOp(E_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|ln(e)|ln|"), gas);
    }

    function test_ln_2() public view {
        uint256 g0 = gasleft();
        _lnOp(TWO_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|ln(2)|ln|"), gas);
    }

    function test_ln_10() public view {
        uint256 g0 = gasleft();
        _lnOp(TEN_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|ln(10)|ln|"), gas);
    }

    function test_sqrt_2() public view {
        uint256 g0 = gasleft();
        _sqrtOp(TWO_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|sqrt(2)|sqrt|"), gas);
    }

    function test_sqrt_pi() public view {
        uint256 g0 = gasleft();
        _sqrtOp(PI_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|sqrt(pi)|sqrt|"), gas);
    }

    function test_sqrt_10() public view {
        uint256 g0 = gasleft();
        _sqrtOp(TEN_WAD);
        uint256 gas = g0 - gasleft();
        console.log(string.concat("ISOLATED_BENCH|", _backendName(), "|sqrt(10)|sqrt|"), gas);
    }
}
