// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FP127Harness} from "../base/FP127Harness.sol";
import {IFP127} from "../../contracts/src/fp127/IFP127.sol";
import {console} from "forge-std/console.sol";

/// @title Precision
/// @notice Correct bits of every transcendental op against mpmath at 100
///         decimal places, through the oracle's generic fp_ path. Prints
///         PREC|op|input|bits for every point and asserts a floor per op.
///         Needs ffi and uv. Run with: forge test --match-contract Precision -vv
contract Precision is FP127Harness {
    function _oracle(string memory op, int256 a) internal returns (int256) {
        string[] memory cmd = new string[](6);
        cmd[0] = "uv"; cmd[1] = "run"; cmd[2] = "python";
        cmd[3] = "scripts/fp127/fp127_oracle.py";
        cmd[4] = string.concat("fp_", op);
        cmd[5] = vm.toString(uint256(a));
        return int256(abi.decode(vm.ffi(cmd), (uint256)));
    }

    function _oracle2(string memory op, int256 a, int256 b) internal returns (int256) {
        string[] memory cmd = new string[](7);
        cmd[0] = "uv"; cmd[1] = "run"; cmd[2] = "python";
        cmd[3] = "scripts/fp127/fp127_oracle.py";
        cmd[4] = string.concat("fp_", op);
        cmd[5] = vm.toString(uint256(a));
        cmd[6] = vm.toString(uint256(b));
        return int256(abi.decode(vm.ffi(cmd), (uint256)));
    }

    function _msb(uint256 x) internal pure returns (uint256 r) {
        while (x > 1) { x >>= 1; r++; }
    }

    /// Relative correct bits: msb(|truth|) - msb(|truth - got|). 256 if exact.
    function _bits(int256 got, int256 truth) internal pure returns (uint256) {
        uint256 d = uint256(got > truth ? got - truth : truth - got);
        if (d == 0) return 256;
        uint256 t = uint256(truth < 0 ? -truth : truth);
        uint256 mt = _msb(t);
        uint256 md = _msb(d);
        return mt > md ? mt - md : 0;
    }

    function _check1(string memory op, int256 x, uint256 floorBits) internal returns (uint256 bits) {
        (bool ok, bytes memory out) = address(obj).staticcall(abi.encodeWithSignature(string.concat(op, "(int256)"), x));
        require(ok, string.concat(op, " reverted"));
        int256 got = abi.decode(out, (int256));
        int256 truth = _oracle(op, x);
        bits = _bits(got, truth);
        console.log(string.concat("PREC|", op, "|", vm.toString(x), "|"), bits);
        assertGe(bits, floorBits, string.concat(op, " precision floor"));
    }

    function _check2(string memory op, int256 a, int256 b, uint256 floorBits) internal returns (uint256 bits) {
        (bool ok, bytes memory out) = address(obj).staticcall(abi.encodeWithSignature(string.concat(op, "(int256,int256)"), a, b));
        require(ok, string.concat(op, " reverted"));
        int256 got = abi.decode(out, (int256));
        int256 truth = _oracle2(op, a, b);
        bits = _bits(got, truth);
        console.log(string.concat("PREC|", op, "|", vm.toString(a), ",", vm.toString(b), "|"), bits);
        assertGe(bits, floorBits, string.concat(op, " precision floor"));
    }

    function test_precision_exp() public {
        int256[12] memory xs = [-80 * ONE, -20 * ONE, -5 * ONE, -ONE, -ONE / 2, ONE / 1000, ONE / 2, ONE, 2 * ONE, 5 * ONE, 20 * ONE, 80 * ONE];
        for (uint256 i; i < xs.length; i++) _check1("exp", xs[i], 110);
    }

    function test_precision_exp2() public {
        int256[7] memory xs = [-100 * ONE, -10 * ONE, -ONE / 2, ONE / 2, 3 * ONE + ONE / 3, 50 * ONE, 126 * ONE + ONE / 2];
        for (uint256 i; i < xs.length; i++) _check1("exp2", xs[i], 110);
    }

    function test_precision_exp10() public {
        int256[6] memory xs = [-30 * ONE, -3 * ONE, ONE / 2, ONE, 7 * ONE + ONE / 4, 37 * ONE];
        for (uint256 i; i < xs.length; i++) _check1("exp10", xs[i], 110);
    }

    function test_precision_logs() public {
        int256[9] memory xs = [int256(1) << 30, ONE / 1000, ONE / 2, ONE - ONE / 1000, ONE + ONE / 2, 2 * ONE, 10 * ONE, 1000000 * ONE, ONE << 100];
        for (uint256 i; i < xs.length; i++) {
            _check1("ln", xs[i], 110);
            _check1("log2", xs[i], 110);
            _check1("log10", xs[i], 110);
        }
    }

    function test_precision_roots() public {
        int256[6] memory xs = [ONE / 2, 2 * ONE, 3 * ONE, ONE >> 60, ONE << 100, 123456789 * ONE];
        for (uint256 i; i < xs.length; i++) {
            _check1("sqrt", xs[i], 120);
            _check1("cbrt", xs[i], 105);
        }
        _check1("cbrt", -10 * ONE, 105);
    }

    function test_precision_pow() public {
        _check2("pow", ONE + ONE / 2, 2 * ONE + ONE / 2, 105);
        _check2("pow", 10 * ONE, ONE / 2, 105);
        _check2("pow", ONE / 2, -3 * ONE, 105);
        _check2("pow", 3 * ONE, 7 * ONE + ONE / 4, 105);
        _check2("pow", ONE + ONE / 100, 365 * ONE, 105);
    }

    function test_precision_misc2() public {
        _check2("hypot", 3 * ONE, 4 * ONE, 120);
        _check2("gavg", 2 * ONE, 8 * ONE, 120);
        _check2("gavg", 3 * ONE, 7 * ONE, 120);
    }

    /// Lambert W across the branch point, the origin, the old table range and beyond.
    function test_precision_lambertW0() public {
        int256 invE = int256(0x5e2d58d8b3bcdf1abadec7829054f90d);
        int256[17] memory xs = [
            -invE + ONE / 1000, -ONE / 3, -ONE / 4, -ONE / 10, -ONE / 100,
            ONE / 1000, ONE / 10, ONE / 2, ONE + ONE / 2, 10 * ONE, 50 * ONE,
            63 * ONE + ONE * 9 / 10, 64 * ONE, 100 * ONE, 1000000 * ONE, ONE << 66, ONE << 100
        ];
        // 115 not 128: the metric is relative to the result, and W(0.001) is
        // small enough that one ULP of absolute error costs ten bits of it
        for (uint256 i; i < xs.length; i++) _check1("lambertW0", xs[i], 115);
    }
}
