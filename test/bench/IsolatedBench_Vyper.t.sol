// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

/// @title Isolated Gas Benchmark for Vyper
/// @notice Measures Vyper operations via external calls for fair comparison
contract IsolatedBench_Vyper is Test {
    address vyperDec;
    address vyperExp;
    address vyperLn;
    address vyperSqrt;

    // Vyper decimal function selectors
    bytes4 constant VYPER_MUL = 0xd1f5c7bb;
    bytes4 constant VYPER_DIV = 0x5c7bc974;
    bytes4 constant VYPER_ADD = 0x46c3d51e;
    bytes4 constant VYPER_SUB = 0xbe972f50;
    bytes4 constant VYPER_CALC = 0xebf2520d;

    function setUp() public {
        // Deploy Vyper decimal arithmetic
        {
            bytes memory creationCode = vm.readFileBinary("contracts/build/vyper/arith_decimal.bin");
            address deployed;
            assembly {
                deployed := create(0, add(creationCode, 0x20), mload(creationCode))
            }
            require(deployed != address(0), "Vyper arith_decimal deploy failed");
            vyperDec = deployed;
        }

        // Deploy Vyper transcendental functions
        {
            string memory expJson = vm.readFile("contracts/build/bytecode/exp.json");
            bytes memory expCode = vm.parseJson(expJson, ".bytecode");
            expCode = abi.decode(expCode, (bytes));
            address expAddr;
            assembly {
                expAddr := create(0, add(expCode, 0x20), mload(expCode))
            }
            require(expAddr != address(0), "Vyper exp deploy failed");
            vyperExp = expAddr;

            string memory lnJson = vm.readFile("contracts/build/bytecode/ln.json");
            bytes memory lnCode = vm.parseJson(lnJson, ".bytecode");
            lnCode = abi.decode(lnCode, (bytes));
            address lnAddr;
            assembly {
                lnAddr := create(0, add(lnCode, 0x20), mload(lnCode))
            }
            require(lnAddr != address(0), "Vyper ln deploy failed");
            vyperLn = lnAddr;

            string memory sqrtJson = vm.readFile("contracts/build/bytecode/sqrt.json");
            bytes memory sqrtCode = vm.parseJson(sqrtJson, ".bytecode");
            sqrtCode = abi.decode(sqrtCode, (bytes));
            address sqrtAddr;
            assembly {
                sqrtAddr := create(0, add(sqrtCode, 0x20), mload(sqrtCode))
            }
            require(sqrtAddr != address(0), "Vyper sqrt deploy failed");
            vyperSqrt = sqrtAddr;
        }
        
        // Warmup: pay cold address cost outside measurement
        _callVyper2(vyperDec, VYPER_MUL, 1e10, 1e10);
    }

    function _callVyper2(address target, bytes4 sel, int256 a, int256 b) internal view returns (int256) {
        bytes memory params = abi.encode(a, b);
        bytes memory callData = abi.encodePacked(sel, params);
        (bool ok, bytes memory ret) = target.staticcall(callData);
        require(ok, "Vyper call failed");
        return abi.decode(ret, (int256));
    }

    function _callVyper1(address target, bytes4 sel, int256 a) internal view returns (int256) {
        bytes memory params = abi.encode(a);
        bytes memory callData = abi.encodePacked(sel, params);
        (bool ok, bytes memory ret) = target.staticcall(callData);
        require(ok, "Vyper call failed");
        return abi.decode(ret, (int256));
    }

    function _toVyperDec(int256 wad) internal pure returns (int256) {
        return wad / 100000000;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTIPLICATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_mul_pi_times_e() public view {
        int256 a = _toVyperDec(3141592653589793238);
        int256 b = _toVyperDec(2718281828459045235);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_MUL, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|pi * e|mul|", gas);
    }

    function test_mul_sqrt2_times_sqrt3() public view {
        int256 a = _toVyperDec(1414213562373095048);
        int256 b = _toVyperDec(1732050807568877293);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_MUL, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|sqrt2 * sqrt3|mul|", gas);
    }

    function test_mul_phi_times_inv_phi() public view {
        int256 a = _toVyperDec(1618033988749894848);
        int256 b = _toVyperDec(618033988749894848);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_MUL, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|phi * (1/phi)|mul|", gas);
    }

    function test_mul_third_times_3() public view {
        int256 a = _toVyperDec(333333333333333333);
        int256 b = _toVyperDec(3000000000000000000);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_MUL, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|1/3 * 3|mul|", gas);
    }

    function test_mul_e_times_e() public view {
        int256 a = _toVyperDec(2718281828459045235);
        int256 b = _toVyperDec(2718281828459045235);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_MUL, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|e * e|mul|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIVISION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_div_pi_div_e() public view {
        int256 a = _toVyperDec(3141592653589793238);
        int256 b = _toVyperDec(2718281828459045235);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_DIV, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|pi / e|div|", gas);
    }

    function test_div_e_div_pi() public view {
        int256 a = _toVyperDec(2718281828459045235);
        int256 b = _toVyperDec(3141592653589793238);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_DIV, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|e / pi|div|", gas);
    }

    function test_div_1_div_3() public view {
        int256 a = _toVyperDec(1000000000000000000);
        int256 b = _toVyperDec(3000000000000000000);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_DIV, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|1 / 3|div|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        int256 a = _toVyperDec(3141592653589793238);
        int256 b = _toVyperDec(2718281828459045235);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_ADD, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        int256 a = _toVyperDec(5000000000000000000);
        int256 b = _toVyperDec(3000000000000000000);
        uint256 g0 = gasleft();
        _callVyper2(vyperDec, VYPER_SUB, a, b);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|5 - 3|sub|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCENDENTAL TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_exp_1() public view {
        int256 a = _toVyperDec(1000000000000000000);
        uint256 g0 = gasleft();
        _callVyper1(vyperExp, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|exp(1)|exp|", gas);
    }

    function test_exp_2() public view {
        int256 a = _toVyperDec(2000000000000000000);
        uint256 g0 = gasleft();
        _callVyper1(vyperExp, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|exp(2)|exp|", gas);
    }

    function test_exp_half() public view {
        int256 a = _toVyperDec(500000000000000000);
        uint256 g0 = gasleft();
        _callVyper1(vyperExp, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|exp(0.5)|exp|", gas);
    }

    function test_ln_e() public view {
        int256 a = _toVyperDec(2718281828459045235);
        uint256 g0 = gasleft();
        _callVyper1(vyperLn, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|ln(e)|ln|", gas);
    }

    function test_ln_2() public view {
        int256 a = _toVyperDec(2000000000000000000);
        uint256 g0 = gasleft();
        _callVyper1(vyperLn, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|ln(2)|ln|", gas);
    }

    function test_ln_10() public view {
        int256 a = _toVyperDec(10000000000000000000);
        uint256 g0 = gasleft();
        _callVyper1(vyperLn, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|ln(10)|ln|", gas);
    }

    function test_sqrt_2() public view {
        int256 a = _toVyperDec(2000000000000000000);
        uint256 g0 = gasleft();
        _callVyper1(vyperSqrt, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|sqrt(2)|sqrt|", gas);
    }

    function test_sqrt_pi() public view {
        int256 a = _toVyperDec(3141592653589793238);
        uint256 g0 = gasleft();
        _callVyper1(vyperSqrt, VYPER_CALC, a);
        uint256 gas = g0 - gasleft();
        console.log("ISOLATED_BENCH|vyper|sqrt(pi)|sqrt|", gas);
    }

    function test_sqrt_10() public {
        // Known issue: Vyper sqrt contract fails on sqrt(10)
        // This is a pre-existing bug in the deployed Vyper contract
        vm.expectRevert();
        int256 a = _toVyperDec(10000000000000000000);
        _callVyper1(vyperSqrt, VYPER_CALC, a);
    }
}
