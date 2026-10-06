// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FP127Harness} from "../base/FP127Harness.sol";
import {FP127Lib} from "../../contracts/src/fp127/FP127Lib.sol";
import {console} from "forge-std/console.sol";

/// @title Gas
/// @notice Side-by-side gas for the three forms of every op.
///
///   huff    legacy Huff via staticcall (the Sepolia bytecode)
///   obj     Yul object via staticcall
///   caller  FP127Caller harness, which adds one more external hop
///   lib     inline library, measured as an internal call in this contract
///
/// Numbers include the staticcall itself for huff, obj and caller (warm
/// address), so they are what an integrating contract actually pays.
/// Lines are printed as GAS|op|huff|obj|caller|lib for the PR table.
contract Gas is FP127Harness {
    int256 constant PI = 1068362306129446170624574138052468108800; // ~pi * 2^128
    int256 constant E  = 924983374546220337150911035843336795136;  // ~e * 2^128

    function setUp() public override {
        super.setUp();
        // warm every address so cold-access cost stays out of the numbers
        huff.mulRaw(uint256(ONE), uint256(ONE));
        obj.mul(ONE, ONE);
        caller.mul(ONE, ONE);
    }

    function _measure(address t, bytes memory data) internal view returns (uint256 gas) {
        uint256 g0 = gasleft();
        (bool ok,) = t.staticcall(data);
        gas = g0 - gasleft();
        require(ok, "measured call reverted");
    }

    function _row(string memory op, bytes memory newCall, bytes memory huffCall, uint256 libGas) internal view {
        uint256 h = _measure(address(huff), huffCall);
        uint256 o = _measure(address(obj), newCall);
        uint256 c = _measure(address(caller), newCall);
        console.log(string.concat("GAS|", op, "|"), h, o, c);
        console.log(string.concat("GAS_LIB|", op, "|"), libGas);
    }

    function test_gas_add() public view {
        uint256 g0 = gasleft();
        int256 r = FP127Lib.add(PI, E);
        uint256 l = g0 - gasleft();
        require(r != 0);
        _row("add", abi.encodeWithSignature("add(int256,int256)", PI, E),
             abi.encodeWithSignature("addRaw(uint256,uint256)", uint256(PI), uint256(E)), l);
    }

    function test_gas_sub() public view {
        uint256 g0 = gasleft();
        int256 r = FP127Lib.sub(PI, E);
        uint256 l = g0 - gasleft();
        require(r != 0);
        _row("sub", abi.encodeWithSignature("sub(int256,int256)", PI, E),
             abi.encodeWithSignature("subRaw(uint256,uint256)", uint256(PI), uint256(E)), l);
    }

    function test_gas_mul() public view {
        uint256 g0 = gasleft();
        int256 r = FP127Lib.mul(PI, E);
        uint256 l = g0 - gasleft();
        require(r != 0);
        _row("mul", abi.encodeWithSignature("mul(int256,int256)", PI, E),
             abi.encodeWithSignature("mulRaw(uint256,uint256)", uint256(PI), uint256(E)), l);
    }

    function test_gas_div() public view {
        uint256 g0 = gasleft();
        int256 r = FP127Lib.div(PI, E);
        uint256 l = g0 - gasleft();
        require(r != 0);
        _row("div", abi.encodeWithSignature("div(int256,int256)", PI, E),
             abi.encodeWithSignature("divRaw(uint256,uint256)", uint256(PI), uint256(E)), l);
    }

    function test_gas_fromFixed18() public view {
        uint256 g0 = gasleft();
        int256 r = FP127Lib.fromFixed18(3141592653589793238);
        uint256 l = g0 - gasleft();
        require(r != 0);
        _row("fromFixed18", abi.encodeWithSignature("fromFixed18(int256)", int256(3141592653589793238)),
             abi.encodeWithSignature("fromFixed18(uint256)", uint256(3141592653589793238)), l);
    }

    function test_gas_toFixed18() public view {
        uint256 g0 = gasleft();
        int256 r = FP127Lib.toFixed18(PI);
        uint256 l = g0 - gasleft();
        require(r != 0);
        _row("toFixed18", abi.encodeWithSignature("toFixed18(int256)", PI),
             abi.encodeWithSignature("toFixed18(uint256)", uint256(PI)), l);
    }

    function _row1(string memory op, int256 x, uint256 libGas) internal view {
        bytes memory newCall = abi.encodeWithSignature(string.concat(op, "(int256)"), x);
        bytes memory huffCall = abi.encodeWithSignature(string.concat(op, "Raw(uint256)"), uint256(x));
        uint256 h = _measure(address(huff), huffCall);
        uint256 o = _measure(address(obj), newCall);
        console.log(string.concat("GAS|", op, "|"), h, o);
        console.log(string.concat("GAS_LIB|", op, "|"), libGas);
    }

    function test_gas_exp() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.exp(ONE); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("exp", ONE, l);
    }
    function test_gas_exp2() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.exp2(ONE + ONE / 3); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("exp2", ONE + ONE / 3, l);
    }
    function test_gas_ln() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.ln(E); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("ln", E, l);
    }
    function test_gas_log2() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.log2(PI); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("log2", PI, l);
    }
    function test_gas_sqrt() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.sqrt(2 * ONE); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("sqrt", 2 * ONE, l);
    }
    function test_gas_cbrt() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.cbrt(10 * ONE); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("cbrt", 10 * ONE, l);
    }
    function test_gas_pow() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.pow(PI, E); uint256 l = g0 - gasleft(); require(r != 0);
        _row("pow", abi.encodeWithSignature("pow(int256,int256)", PI, E),
             abi.encodeWithSignature("powRaw(uint256,uint256)", uint256(PI), uint256(E)), l);
    }
    function test_gas_lambertW0() public view {
        uint256 g0 = gasleft(); int256 r = FP127Lib.lambertW0(10 * ONE); uint256 l = g0 - gasleft(); require(r != 0);
        _row1("lambertW0", 10 * ONE, l);
    }
}
