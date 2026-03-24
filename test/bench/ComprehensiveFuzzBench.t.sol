// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {ABDKMath64x64} from "../../lib/abdk-libraries-solidity/ABDKMath64x64.sol";
import {FixedPointMathLib} from "../../lib/solady/src/utils/FixedPointMathLib.sol";
import {UD60x18, ud, unwrap} from "../../lib/prb-math/src/UD60x18.sol";
import {
    mul as prbMul,
    div as prbDiv,
    exp as prbExp,
    exp2 as prbExp2,
    ln as prbLn,
    log2 as prbLog2,
    log10 as prbLog10,
    sqrt as prbSqrt,
    pow as prbPow,
    avg as prbAvg,
    ceil as prbCeil,
    floor as prbFloor,
    frac as prbFrac,
    gm as prbGm,
    inv as prbInv
} from "../../lib/prb-math/src/ud60x18/Math.sol";
import "../fp127/IFP127.sol";

/// @title ComprehensiveFuzzBench
/// @notice Fuzz tests ALL functions across FP127, ABDK, Solady, PRBMath against mpmath oracle
contract ComprehensiveFuzzBench is Test {
    using FixedPointMathLib for uint256;
    using FixedPointMathLib for int256;

    int256 constant WAD_I = 1e18;
    uint256 constant WAD = 1e18;
    string constant OUTPUT_FILE = "docs/benchmarks/fuzz_data.txt";

    IFP127 fp127;

    function setUp() public {
        string memory hex1 = vm.readFile("contracts/build/huff/test_fp127.runtime.bin");
        bytes memory code1 = vm.parseBytes(string.concat("0x", hex1));
        address a1 = makeAddr("fp127");
        vm.etch(a1, code1);
        fp127 = IFP127(a1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORACLE
    // ═══════════════════════════════════════════════════════════════════════════

    function _oracle2(string memory func, int256 a, int256 b) internal returns (int256) {
        string[] memory cmd = new string[](5);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp127/fp127_oracle.py";
        cmd[2] = string.concat("wad_", func);
        cmd[3] = vm.toString(a);
        cmd[4] = vm.toString(b);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (int256));
    }

    function _oracle1(string memory func, int256 x) internal returns (int256) {
        string[] memory cmd = new string[](4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp127/fp127_oracle.py";
        cmd[2] = string.concat("wad_", func);
        cmd[3] = vm.toString(x);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (int256));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function _absErr(int256 result, int256 expected) internal pure returns (uint256) {
        int256 diff = result - expected;
        return uint256(diff < 0 ? -diff : diff);
    }

    function _wadToAbdk(int256 wad) internal pure returns (int128) {
        return int128((wad << 64) / WAD_I);
    }

    function _abdkToWad(int128 abdk) internal pure returns (int256) {
        return (int256(abdk) * WAD_I) >> 64;
    }

    // Format: FUZZ_BENCH|op|fp127_gas|fp127_err|prb_gas|prb_err|abdk_gas|abdk_err|solady_gas|solady_err
    function _emitAll(string memory op, 
                      uint256 fp127_gas, uint256 fp127_err,
                      uint256 prb_gas, uint256 prb_err,
                      uint256 abdk_gas, uint256 abdk_err,
                      uint256 solady_gas, uint256 solady_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            vm.toString(prb_gas), "|", vm.toString(prb_err), "|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
            vm.toString(solady_gas), "|", vm.toString(solady_err)
        ));
    }

    function _emit(string memory op, uint256 fp127_gas, uint256 fp127_err, 
                   uint256 abdk_gas, uint256 abdk_err,
                   uint256 solady_gas, uint256 solady_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            "NA|NA|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
            vm.toString(solady_gas), "|", vm.toString(solady_err)
        ));
    }

    function _emitFp127Only(string memory op, uint256 fp127_gas, uint256 fp127_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            "NA|NA|NA|NA|NA|NA"
        ));
    }

    function _emitFp127Prb(string memory op, uint256 fp127_gas, uint256 fp127_err,
                           uint256 prb_gas, uint256 prb_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            vm.toString(prb_gas), "|", vm.toString(prb_err), "|",
            "NA|NA|NA|NA"
        ));
    }

    function _emitFp127Abdk(string memory op, uint256 fp127_gas, uint256 fp127_err,
                            uint256 abdk_gas, uint256 abdk_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            "NA|NA|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
            "NA|NA"
        ));
    }

    function _emitFp127AbdkPrb(string memory op, uint256 fp127_gas, uint256 fp127_err,
                               uint256 prb_gas, uint256 prb_err,
                               uint256 abdk_gas, uint256 abdk_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            vm.toString(prb_gas), "|", vm.toString(prb_err), "|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
            "NA|NA"
        ));
    }

    function _emitFp127Solady(string memory op, uint256 fp127_gas, uint256 fp127_err,
                              uint256 solady_gas, uint256 solady_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            "NA|NA|NA|NA|",
            vm.toString(solady_gas), "|", vm.toString(solady_err)
        ));
    }

    function _emitFp127PrbSolady(string memory op, uint256 fp127_gas, uint256 fp127_err,
                                  uint256 prb_gas, uint256 prb_err,
                                  uint256 solady_gas, uint256 solady_err) internal {
        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|", op, "|",
            vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
            vm.toString(prb_gas), "|", vm.toString(prb_err), "|",
            "NA|NA|",
            vm.toString(solady_gas), "|", vm.toString(solady_err)
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BASIC ARITHMETIC (all libs)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_mul(int256 a, int256 b) public {
        // ABDK 64.64 has ~9e18 max value, keep inputs in reasonable range
        a = bound(a, 1e18, 100e18);  // 1 to 100 WAD
        b = bound(b, 1e18, 100e18);
        int256 expected = _oracle2("mul", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.mul(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbMul(ud(uint256(a)), ud(uint256(b))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.mul(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r3 = FixedPointMathLib.mulWad(uint256(a), uint256(b)); solady_gas = g - gasleft();
        solady_err = _absErr(int256(r3), expected);

        _emitAll("mul", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    function testFuzz_div(int256 a, int256 b) public {
        // Keep inputs in reasonable range for all libraries
        a = bound(a, 1e18, 100e18);  // 1 to 100 WAD
        b = bound(b, 1e18, 100e18);
        int256 expected = _oracle2("div", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.div(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbDiv(ud(uint256(a)), ud(uint256(b))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.div(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r3 = FixedPointMathLib.divWad(uint256(a), uint256(b)); solady_gas = g - gasleft();
        solady_err = _absErr(int256(r3), expected);

        _emitAll("div", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSCENDENTALS (fp127, abdk, solady)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_exp(int256 x) public {
        // PRBMath exp max input is ~133e18, use conservative range
        x = bound(x, 1e17, 40e18);  // 0.1 to 40 for unsigned PRBMath
        int256 expected = _oracle1("exp", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.exp(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbExp(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.exp(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); int256 r3 = FixedPointMathLib.expWad(x); solady_gas = g - gasleft();
        solady_err = _absErr(r3, expected);

        _emitAll("exp", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    function testFuzz_exp2(int256 x) public {
        x = bound(x, 1e17, 60e18);  // 0.1 to 60 for unsigned PRBMath
        int256 expected = _oracle1("exp2", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.exp2(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbExp2(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.exp_2(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127AbdkPrb("exp2", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err);
    }

    function testFuzz_ln(int256 x) public {
        x = bound(x, 1e18, 1e30);  // PRBMath ln requires x >= 1e18
        int256 expected = _oracle1("ln", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.ln(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbLn(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.ln(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); int256 r3 = FixedPointMathLib.lnWad(x); solady_gas = g - gasleft();
        solady_err = _absErr(r3, expected);

        _emitAll("ln", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    function testFuzz_log2(int256 x) public {
        x = bound(x, 1e18, 1e30);  // PRBMath log2 requires x >= 1e18
        int256 expected = _oracle1("log2", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.log2(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbLog2(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.log_2(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127AbdkPrb("log2", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err);
    }

    function testFuzz_sqrt(int256 x) public {
        x = bound(x, 1e18, 1e36);  // Start from 1 WAD for PRBMath
        int256 expected = _oracle1("sqrt", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.sqrt(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbSqrt(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.sqrt(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r3 = FixedPointMathLib.sqrtWad(uint256(x)); solady_gas = g - gasleft();
        solady_err = _absErr(int256(r3), expected);

        _emitAll("sqrt", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    function testFuzz_cbrt(int256 x) public {
        x = bound(x, 0, 1e36);
        int256 expected = _oracle1("cbrt", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.cbrt(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r3 = FixedPointMathLib.cbrtWad(uint256(x)); solady_gas = g - gasleft();
        solady_err = _absErr(int256(r3), expected);

        _emit("cbrt", fp127_gas, fp127_err, 0, 0, solady_gas, solady_err);
    }

    function testFuzz_pow(int256 base, int256 exp_val) public {
        base = bound(base, 1e18, 10e18);  // 1 to 10 in WAD for PRBMath
        exp_val = bound(exp_val, 1e17, 3e18);  // 0.1 to 3
        int256 expected = _oracle2("pow", base, exp_val);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.pow(uint256(base), uint256(exp_val)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbPow(ud(uint256(base)), ud(uint256(exp_val))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 b64 = _wadToAbdk(base);
        uint256 exp_int = uint256(exp_val) / 1e18;
        if (exp_int > 0 && exp_int < 256) {
            g = gasleft(); int128 r2 = ABDKMath64x64.pow(b64, exp_int); abdk_gas = g - gasleft();
            abdk_err = _absErr(_abdkToWad(r2), expected);
        }

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); int256 r3 = FixedPointMathLib.powWad(base, exp_val); solady_gas = g - gasleft();
        solady_err = _absErr(r3, expected);

        _emitAll("pow", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS (fp127 + abdk where available)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_abs(int256 x) public {
        x = bound(x, -1e30, 1e30);
        int256 expected = x < 0 ? -x : x;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.abs(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.abs(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127Abdk("abs", fp127_gas, fp127_err, abdk_gas, abdk_err);
    }

    function testFuzz_neg(int256 x) public {
        x = bound(x, -1e30, 1e30);
        int256 expected = -x;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.neg(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.neg(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127Abdk("neg", fp127_gas, fp127_err, abdk_gas, abdk_err);
    }

    function testFuzz_inv(int256 x) public {
        x = bound(x, 1e15, 1e24);  // Positive, reasonable range
        int256 expected = _oracle1("inv", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.inv(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbInv(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 x64 = _wadToAbdk(x);
        g = gasleft(); int128 r2 = ABDKMath64x64.inv(x64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127AbdkPrb("inv", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err);
    }

    function testFuzz_avg(int256 a, int256 b) public {
        a = bound(a, 1e18, 1e24);  // PRBMath UD60x18 is unsigned
        b = bound(b, 1e18, 1e24);
        int256 expected = (a + b) / 2;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.avg(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbAvg(ud(uint256(a)), ud(uint256(b))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.avg(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127AbdkPrb("avg", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err);
    }

    function testFuzz_gavg(int256 a, int256 b) public {
        a = bound(a, 1e18, 1e24);  // PRBMath gm is unsigned
        b = bound(b, 1e18, 1e24);
        int256 expected = _oracle2("gavg", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.gavg(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbGm(ud(uint256(a)), ud(uint256(b))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.gavg(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127AbdkPrb("gavg", fp127_gas, fp127_err, prb_gas, prb_err, abdk_gas, abdk_err);
    }

    function testFuzz_min(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);
        int256 expected = a < b ? a : b;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.min(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("min", fp127_gas, fp127_err);
    }

    function testFuzz_max(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);
        int256 expected = a > b ? a : b;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.max(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("max", fp127_gas, fp127_err);
    }

    function testFuzz_dist(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);
        int256 expected = a > b ? a - b : b - a;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.dist(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("dist", fp127_gas, fp127_err);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FP127-ONLY ADVANCED FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_log10(int256 x) public {
        x = bound(x, 1e18, 1e30);  // PRBMath log10 requires x >= 1e18
        int256 expected = _oracle1("log10", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.log10(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbLog10(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        _emitFp127Prb("log10", fp127_gas, fp127_err, prb_gas, prb_err);
    }

    function testFuzz_exp10(int256 x) public {
        // Keep range reasonable: 10^0 to 10^18 (results 1 to 1e18 WAD)
        x = bound(x, 0, 18e18);
        int256 expected = _oracle1("exp10", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.exp10(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("exp10", fp127_gas, fp127_err);
    }

    function testFuzz_hypot(int256 a, int256 b) public {
        a = bound(a, -1e20, 1e20);
        b = bound(b, -1e20, 1e20);
        int256 expected = _oracle2("hypot", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.hypot(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("hypot", fp127_gas, fp127_err);
    }

    function testFuzz_floor(int256 x) public {
        x = bound(x, 1e18, 1e24);  // PRBMath UD60x18 is unsigned
        int256 expected = _oracle1("floor", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.floor(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbFloor(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        _emitFp127Prb("floor", fp127_gas, fp127_err, prb_gas, prb_err);
    }

    function testFuzz_ceil(int256 x) public {
        x = bound(x, 1e18, 1e24);  // PRBMath UD60x18 is unsigned
        int256 expected = _oracle1("ceil", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.ceil(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbCeil(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        _emitFp127Prb("ceil", fp127_gas, fp127_err, prb_gas, prb_err);
    }

    function testFuzz_frac(int256 x) public {
        x = bound(x, 1e18, 1e24);  // PRBMath UD60x18 is unsigned
        int256 expected = _oracle1("frac", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.frac(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 prb_gas; uint256 prb_err;
        g = gasleft(); UD60x18 r_prb = prbFrac(ud(uint256(x))); prb_gas = g - gasleft();
        prb_err = _absErr(int256(unwrap(r_prb)), expected);

        _emitFp127Prb("frac", fp127_gas, fp127_err, prb_gas, prb_err);
    }

    function testFuzz_round(int256 x) public {
        x = bound(x, -1e24, 1e24);
        int256 expected = _oracle1("round", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.round(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("round", fp127_gas, fp127_err);
    }

    function testFuzz_gcd(int256 a, int256 b) public {
        a = bound(a, 1e18, 1e24);
        b = bound(b, 1e18, 1e24);
        int256 expected = _oracle2("gcd", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.gcd(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("gcd", fp127_gas, fp127_err);
    }

    function testFuzz_factorial(int256 n) public {
        n = bound(n, 0, 20e18);  // factorial up to 20
        int256 expected = _oracle1("factorial", n);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.factorial(uint256(n)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("factorial", fp127_gas, fp127_err);
    }

    function testFuzz_lambertW0(int256 x) public {
        // FP127 safe range: 1-64 WAD, Solady safe range: ~3.3-256 WAD
        // Common safe range: 4-64 WAD
        x = bound(x, 4e18, 64e18);
        int256 expected = _oracle1("lambertw0", x);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft();
        uint256 r1 = fp127.lambertW0(uint256(x));
        fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft();
        int256 r2 = FixedPointMathLib.lambertW0Wad(x);
        solady_gas = g - gasleft();
        solady_err = _absErr(r2, expected);

        _emit("lambertw0", fp127_gas, fp127_err, 0, 0, solady_gas, solady_err);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADD/SUB (all libs)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_add(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);
        int256 expected = a + b;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.add(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.add(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127Abdk("add", fp127_gas, fp127_err, abdk_gas, abdk_err);
    }

    function testFuzz_sub(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);
        int256 expected = a - b;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.sub(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.sub(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        _emitFp127Abdk("sub", fp127_gas, fp127_err, abdk_gas, abdk_err);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL FP127 FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_clamp(int256 x, int256 lo, int256 hi) public {
        lo = bound(lo, -1e24, 0);
        hi = bound(hi, 0, 1e24);
        x = bound(x, -1e24, 1e24);
        
        int256 expected;
        if (x < lo) expected = lo;
        else if (x > hi) expected = hi;
        else expected = x;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.clamp(uint256(x), uint256(lo), uint256(hi)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("clamp", fp127_gas, fp127_err);
    }

    function testFuzz_zeroFloorSub(int256 a, int256 b) public {
        a = bound(a, 0, 1e24);
        b = bound(b, 0, 1e24);
        int256 expected = a > b ? a - b : int256(0);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.zeroFloorSub(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("zeroFloorSub", fp127_gas, fp127_err);
    }

    function testFuzz_lerp(int256 a, int256 b, int256 t) public {
        a = bound(a, -1e22, 1e22);
        b = bound(b, -1e22, 1e22);
        t = bound(t, 0, 1e18);  // t is 0 to 1 in WAD
        // lerp expected = a + (b-a)*t (exact formula, no oracle needed)
        int256 expected = a + ((b - a) * t) / WAD_I;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.lerp(uint256(a), uint256(b), uint256(t)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("lerp", fp127_gas, fp127_err);
    }

    function testFuzz_sign(int256 x) public {
        x = bound(x, -1e24, 1e24);
        int256 expected;
        if (x > 0) expected = 1e18;
        else if (x < 0) expected = -1e18;
        else expected = 0;

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.sign(uint256(x)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        _emitFp127Only("sign", fp127_gas, fp127_err);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL SOLADY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_sMul(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);
        int256 expected = _oracle2("mul", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.mul(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.mul(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); int256 r3 = FixedPointMathLib.sMulWad(a, b); solady_gas = g - gasleft();
        solady_err = _absErr(r3, expected);

        _emit("sMul", fp127_gas, fp127_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    function testFuzz_sDiv(int256 a, int256 b) public {
        // Keep bounds reasonable to avoid overflow/precision issues
        a = bound(a, -100e18, 100e18);  // -100 to 100 WAD
        b = bound(b, 1e18, 100e18);      // 1 to 100 WAD (positive divisor)
        int256 expected = _oracle2("div", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.div(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 abdk_gas; uint256 abdk_err;
        int128 a64 = _wadToAbdk(a); int128 b64 = _wadToAbdk(b);
        g = gasleft(); int128 r2 = ABDKMath64x64.div(a64, b64); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r2), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); int256 r3 = FixedPointMathLib.sDivWad(a, b); solady_gas = g - gasleft();
        solady_err = _absErr(r3, expected);

        _emit("sDiv", fp127_gas, fp127_err, abdk_gas, abdk_err, solady_gas, solady_err);
    }

    function testFuzz_mulWadUp(int256 a, int256 b) public {
        a = bound(a, 0, 1e24);
        b = bound(b, 0, 1e24);
        int256 expected = _oracle2("mul", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.mul(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r3 = FixedPointMathLib.mulWadUp(uint256(a), uint256(b)); solady_gas = g - gasleft();
        solady_err = _absErr(int256(r3), expected);

        _emitFp127Solady("mulWadUp", fp127_gas, fp127_err, solady_gas, solady_err);
    }

    function testFuzz_divWadUp(int256 a, int256 b) public {
        // Keep bounds reasonable - both in 1-100 WAD range
        a = bound(a, 1e18, 100e18);
        b = bound(b, 1e18, 100e18);
        int256 expected = _oracle2("div", a, b);

        uint256 g; uint256 fp127_gas; uint256 fp127_err;
        g = gasleft(); uint256 r1 = fp127.div(uint256(a), uint256(b)); fp127_gas = g - gasleft();
        fp127_err = _absErr(int256(r1), expected);

        uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r3 = FixedPointMathLib.divWadUp(uint256(a), uint256(b)); solady_gas = g - gasleft();
        solady_err = _absErr(int256(r3), expected);

        _emitFp127Solady("divWadUp", fp127_gas, fp127_err, solady_gas, solady_err);
    }

    // Solady integer log functions (not WAD-based, but useful to benchmark)
    function testFuzz_intLog2(int256 x) public {
        x = bound(x, 1, 1e30);
        uint256 ux = uint256(x);
        
        // For integer log2, expected is floor(log2(x))
        uint256 expected = 0;
        uint256 temp = ux;
        while (temp > 1) {
            temp >>= 1;
            expected++;
        }

        uint256 g; uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r = FixedPointMathLib.log2(ux); solady_gas = g - gasleft();
        solady_err = r > expected ? r - expected : expected - r;

        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|intLog2|NA|NA|NA|NA|NA|NA|",
            vm.toString(solady_gas), "|", vm.toString(solady_err)
        ));
    }

    function testFuzz_intLog10(int256 x) public {
        x = bound(x, 1, 1e30);
        uint256 ux = uint256(x);
        
        // For integer log10, expected is floor(log10(x))
        uint256 expected = 0;
        uint256 temp = ux;
        while (temp >= 10) {
            temp /= 10;
            expected++;
        }

        uint256 g; uint256 solady_gas; uint256 solady_err;
        g = gasleft(); uint256 r = FixedPointMathLib.log10(ux); solady_gas = g - gasleft();
        solady_err = r > expected ? r - expected : expected - r;

        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|intLog10|NA|NA|NA|NA|NA|NA|",
            vm.toString(solady_gas), "|", vm.toString(solady_err)
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADDITIONAL ABDK FUNCTIONS (muli, mulu, divi, divu)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_muli(int256 a, int256 b) public {
        a = bound(a, -1e20, 1e20);
        b = bound(b, -1e20, 1e20);
        
        // muli: multiply 64.64 by int256, return int256
        int128 a64 = _wadToAbdk(a);
        int256 expected = (int256(a64) * b) >> 64;

        uint256 g; uint256 abdk_gas; uint256 abdk_err;
        g = gasleft(); int256 r = ABDKMath64x64.muli(a64, b); abdk_gas = g - gasleft();
        abdk_err = _absErr(r, expected);

        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|muli|NA|NA|NA|NA|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|NA|NA"
        ));
    }

    function testFuzz_mulu(int256 a, int256 b) public {
        a = bound(a, 0, 1e20);
        b = bound(b, 0, 1e20);
        
        // mulu: multiply 64.64 by uint256, return uint256
        int128 a64 = _wadToAbdk(a);
        if (a64 < 0) return; // Skip negative
        uint256 expected = (uint256(int256(a64)) * uint256(b)) >> 64;

        uint256 g; uint256 abdk_gas; uint256 abdk_err;
        g = gasleft(); uint256 r = ABDKMath64x64.mulu(a64, uint256(b)); abdk_gas = g - gasleft();
        abdk_err = r > expected ? r - expected : expected - r;

        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|mulu|NA|NA|NA|NA|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|NA|NA"
        ));
    }

    function testFuzz_divi(int256 a, int256 b) public {
        a = bound(a, -1e24, 1e24);
        b = bound(b, 1e6, 1e24);
        
        // divi: divide int256 by int256, return 64.64
        int256 expected = _oracle2("div", a, b);

        uint256 g; uint256 abdk_gas; uint256 abdk_err;
        g = gasleft(); int128 r64 = ABDKMath64x64.divi(a, b); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r64), expected);

        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|divi|NA|NA|NA|NA|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|NA|NA"
        ));
    }

    function testFuzz_divu(int256 a, int256 b) public {
        a = bound(a, 0, 1e24);
        b = bound(b, 1e6, 1e24);
        
        // divu: divide uint256 by uint256, return 64.64
        int256 expected = _oracle2("div", a, b);

        uint256 g; uint256 abdk_gas; uint256 abdk_err;
        g = gasleft(); int128 r64 = ABDKMath64x64.divu(uint256(a), uint256(b)); abdk_gas = g - gasleft();
        abdk_err = _absErr(_abdkToWad(r64), expected);

        vm.writeLine(OUTPUT_FILE, string.concat(
            "FUZZ_BENCH|divu|NA|NA|NA|NA|",
            vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|NA|NA"
        ));
    }
}
