// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {ABDKMath64x64} from "../../lib/abdk-libraries-solidity/ABDKMath64x64.sol";
import {FixedPointMathLib} from "../../lib/solady/src/utils/FixedPointMathLib.sol";

interface IFP128 {
    function mulRaw(uint256, uint256) external view returns (uint256);
    function divRaw(uint256, uint256) external view returns (uint256);
    function expRaw(uint256) external view returns (uint256);
    function exp2Raw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function log2Raw(uint256) external view returns (uint256);
    function sqrtRaw(uint256) external view returns (uint256);
}

/// @title NativePrecisionBench
/// @notice Benchmark testing each backend at its native bit depth
/// @dev Each system is tested at full precision:
///      - fp128: 128-bit fractional (raw 256-bit values)
///      - ABDK: 64-bit fractional (int128 64.64)
///      - Solady: 18-decimal WAD (uint256)
contract NativePrecisionBench is Test {
    using FixedPointMathLib for uint256;

    uint8 constant MUL = 0;
    uint8 constant DIV = 1;
    uint8 constant ADD = 2;
    uint8 constant SUB = 3;
    uint8 constant EXP = 4;
    uint8 constant EXP2 = 5;
    uint8 constant LN = 6;
    uint8 constant LOG2 = 7;
    uint8 constant SQRT = 8;

    int256 constant WAD_I = 1e18;
    uint256 constant ONE_FP128 = uint256(1) << 128;

    // FFI Oracle: compute true expected values in all native formats (binary ops)
    function _oracleMulti(string memory op, int256 a_wad, int256 b_wad)
        internal returns (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp)
    {
        string[] memory cmd = new string[](5);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = string.concat("multi_", op);
        cmd[3] = vm.toString(a_wad);
        cmd[4] = vm.toString(b_wad);
        bytes memory out = vm.ffi(cmd);
        (fp128_exp, wad_exp, abdk_exp) = abi.decode(out, (uint256, uint256, uint256));
    }

    // FFI Oracle: compute true expected values in all native formats (unary ops)
    function _oracleMulti1(string memory op, int256 a_wad)
        internal returns (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp)
    {
        string[] memory cmd = new string[](4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = string.concat("multi_", op);
        cmd[3] = vm.toString(a_wad);
        bytes memory out = vm.ffi(cmd);
        (fp128_exp, wad_exp, abdk_exp) = abi.decode(out, (uint256, uint256, uint256));
    }

    struct Case {
        string name;
        uint8 op;
        int256 a_wad;        // Input in WAD for easy reading
        int256 b_wad;        // For binary ops (mul, div, add, sub); unused for unary (exp, ln, sqrt)
    }

    Case[] cases;
    Case[] transCases;
    IFP128 fp128;

    function setUp() public {
        // Deploy fp128 (128.128 fixed-point)
        {
            string memory hex1 = vm.readFile("contracts/build/huff/test_fp128.runtime.bin");
            bytes memory code1 = vm.parseBytes(string.concat("0x", hex1));
            address a1 = makeAddr("fp128");
            vm.etch(a1, code1);
            fp128 = IFP128(a1);
        }
        
        _initCases();
    }

    function _a(string memory n, uint8 op, int256 a, int256 b) internal {
        cases.push(Case(n, op, a, b));
    }

    function _t(string memory n, uint8 op, int256 a) internal {
        transCases.push(Case(n, op, a, 0));
    }

    function _initCases() internal {
        // Arithmetic cases (inputs in WAD for readability, expected values from oracle at runtime)
        _a("pi * e", MUL, 3141592653589793238, 2718281828459045235);
        _a("sqrt2 * sqrt3", MUL, 1414213562373095048, 1732050807568877293);
        _a("phi * (1/phi)", MUL, 1618033988749894848, 618033988749894848);
        _a("1/3 * 3", MUL, 333333333333333333, 3000000000000000000);
        _a("e * e", MUL, 2718281828459045235, 2718281828459045235);
        _a("pi / e", DIV, 3141592653589793238, 2718281828459045235);
        _a("e / pi", DIV, 2718281828459045235, 3141592653589793238);
        _a("1 / 3", DIV, 1000000000000000000, 3000000000000000000);
        _a("pi + e", ADD, 3141592653589793238, 2718281828459045235);
        _a("5 - 3", SUB, 5000000000000000000, 3000000000000000000);
        
        // Transcendental cases
        _t("exp(1)", EXP, 1000000000000000000);
        _t("exp(2)", EXP, 2000000000000000000);
        _t("exp(0.5)", EXP, 500000000000000000);
        _t("exp2(1)", EXP2, 1000000000000000000);
        _t("exp2(0.5)", EXP2, 500000000000000000);
        _t("exp2(3.5)", EXP2, 3500000000000000000);
        _t("ln(e)", LN, 2718281828459045235);
        _t("ln(2)", LN, 2000000000000000000);
        _t("ln(10)", LN, 10000000000000000000);
        _t("log2(2)", LOG2, 2000000000000000000);
        _t("log2(e)", LOG2, 2718281828459045235);
        _t("log2(10)", LOG2, 10000000000000000000);
        _t("sqrt(2)", SQRT, 2000000000000000000);
        _t("sqrt(pi)", SQRT, 3141592653589793238);
        _t("sqrt(10)", SQRT, 10000000000000000000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BENCHMARK
    // ═══════════════════════════════════════════════════════════════════════

    function test_benchmark_native() public {
        console.log("NATIVE_BENCH_START");
        
        for (uint256 i = 0; i < cases.length; i++) {
            _benchOneNative(cases[i]);
        }
        
        for (uint256 i = 0; i < transCases.length; i++) {
            _benchOneTrans(transCases[i]);
        }
        
        console.log("NATIVE_BENCH_END");
    }

    function _benchOneNative(Case memory c) internal {
        string memory opStr;
        if (c.op == MUL)      opStr = "mul";
        else if (c.op == DIV) opStr = "div";
        else if (c.op == ADD) opStr = "add";
        else                  opStr = "sub";

        // Get true expected values from 100-digit oracle in all native formats
        (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp) = _oracleMulti(opStr, c.a_wad, c.b_wad);
        
        // Run all backends at native precision with oracle expected values
        (uint256 fp128_gas, uint256 fp128_digits) = _runFp128Native(c, fp128_exp);
        (uint256 abdk_gas, uint256 abdk_digits) = _runAbdkNative(c, abdk_exp);
        (uint256 solady_gas, uint256 solady_digits) = _runSoladyNative(c, wad_exp);

        // NATIVE_BENCH|name|op|expected_wad|fp128_gas|fp128_digits|abdk_gas|abdk_digits|solady_gas|solady_digits
        console.log(
            string.concat(
                "NATIVE_BENCH|", c.name, "|", opStr, "|",
                vm.toString(wad_exp), "|",
                vm.toString(fp128_gas), "|", vm.toString(fp128_digits), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_digits), "|",
                vm.toString(solady_gas), "|", vm.toString(solady_digits)
            )
        );
    }

    function _benchOneTrans(Case memory c) internal {
        string memory opStr;
        if (c.op == EXP)       opStr = "exp";
        else if (c.op == EXP2) opStr = "exp2";
        else if (c.op == LN)   opStr = "ln";
        else if (c.op == LOG2) opStr = "log2";
        else                   opStr = "sqrt";

        // Get true expected values from 100-digit oracle in all native formats
        (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp) = _oracleMulti1(opStr, c.a_wad);
        
        // Run all backends at native precision with oracle expected values
        (uint256 fp128_gas, uint256 fp128_digits) = _runFp128Trans(c, fp128_exp);
        (uint256 abdk_gas, uint256 abdk_digits) = _runAbdkTrans(c, abdk_exp);

        // Solady: no exp2/log2
        string memory solady_str;
        {
            (uint256 sg, uint256 sd) = _runSoladyTrans(c, wad_exp);
            solady_str = sg > 0 ? string.concat(vm.toString(sg), "|", vm.toString(sd)) : "NA|NA";
        }

        // NATIVE_BENCH|name|func|expected_wad|fp128_gas|fp128_digits|abdk_gas|abdk_digits|solady_gas|solady_digits
        console.log(
            string.concat(
                "NATIVE_BENCH|", c.name, "|", opStr, "|",
                vm.toString(wad_exp), "|",
                vm.toString(fp128_gas), "|", vm.toString(fp128_digits), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_digits), "|",
                solady_str
            )
        );
    }

    function _runFp128Native(Case memory c, uint256 exp_fp128) internal view returns (uint256 gas_, uint256 digits_) {
        // Convert WAD to fp128 for inputs
        uint256 a_fp128 = _wadToFp128(c.a_wad);
        uint256 b_fp128 = _wadToFp128(c.b_wad);
        
        uint256 g0 = gasleft();
        uint256 result_fp128;
        if (c.op == MUL)      result_fp128 = fp128.mulRaw(a_fp128, b_fp128);
        else if (c.op == DIV) result_fp128 = fp128.divRaw(a_fp128, b_fp128);
        else if (c.op == ADD) result_fp128 = a_fp128 + b_fp128;
        else                  result_fp128 = a_fp128 - b_fp128;
        gas_ = g0 - gasleft();
        
        // Compute matching digits (fp128 has ~38 digit precision ceiling)
        digits_ = _matchingDigits(result_fp128, exp_fp128, 38);
    }

    function _runAbdkNative(Case memory c, uint256 exp_abdk) internal view returns (uint256 gas_, uint256 digits_) {
        int128 a64 = _wadToAbdk(c.a_wad);
        int128 b64 = _wadToAbdk(c.b_wad);
        int128 exp64 = int128(int256(exp_abdk));

        int128 r64;
        uint256 g0 = gasleft();
        if (c.op == MUL)      r64 = ABDKMath64x64.mul(a64, b64);
        else if (c.op == DIV) r64 = ABDKMath64x64.div(a64, b64);
        else if (c.op == ADD) r64 = ABDKMath64x64.add(a64, b64);
        else                  r64 = ABDKMath64x64.sub(a64, b64);
        gas_ = g0 - gasleft();
        
        // Compute matching digits in 64.64 space (ABDK has ~19 digit precision ceiling)
        digits_ = _matchingDigitsAbdk(r64, exp64, 19);
    }

    function _runSoladyNative(Case memory c, uint256 exp_wad) internal view returns (uint256 gas_, uint256 digits_) {
        uint256 ua = uint256(c.a_wad);
        uint256 ub = uint256(c.b_wad);
        
        uint256 sr;
        uint256 g0 = gasleft();
        if (c.op == MUL)      sr = FixedPointMathLib.mulWad(ua, ub);
        else if (c.op == DIV) sr = FixedPointMathLib.divWad(ua, ub);
        else if (c.op == ADD) sr = ua + ub;
        else                  sr = ua - ub;
        gas_ = g0 - gasleft();
        
        // Compute matching digits in WAD space (WAD has 18 digit precision ceiling)
        digits_ = _matchingDigits(sr, exp_wad, 18);
    }


    function _runFp128Trans(Case memory c, uint256 exp_fp128) internal view returns (uint256 gas_, uint256 digits_) {
        uint256 a_fp128 = _wadToFp128(c.a_wad);
        
        uint256 g0 = gasleft();
        uint256 result_fp128;
        if (c.op == EXP)        result_fp128 = fp128.expRaw(a_fp128);
        else if (c.op == EXP2)  result_fp128 = fp128.exp2Raw(a_fp128);
        else if (c.op == LN)    result_fp128 = fp128.lnRaw(a_fp128);
        else if (c.op == LOG2)  result_fp128 = fp128.log2Raw(a_fp128);
        else                    result_fp128 = fp128.sqrtRaw(a_fp128);
        gas_ = g0 - gasleft();
        digits_ = _matchingDigits(result_fp128, exp_fp128, 38);
    }

    function _runAbdkTrans(Case memory c, uint256 exp_abdk) internal view returns (uint256 gas_, uint256 digits_) {
        int128 a64 = _wadToAbdk(c.a_wad);
        int128 exp64 = int128(int256(exp_abdk));

        int128 r64;
        uint256 g0 = gasleft();
        if (c.op == EXP)        r64 = ABDKMath64x64.exp(a64);
        else if (c.op == EXP2)  r64 = ABDKMath64x64.exp_2(a64);
        else if (c.op == LN)    r64 = ABDKMath64x64.ln(a64);
        else if (c.op == LOG2)  r64 = ABDKMath64x64.log_2(a64);
        else                    r64 = ABDKMath64x64.sqrt(a64);
        gas_ = g0 - gasleft();
        
        digits_ = _matchingDigitsAbdk(r64, exp64, 19);
    }

    function _runSoladyTrans(Case memory c, uint256 exp_wad) internal view returns (uint256 gas_, uint256 digits_) {
        // Solady doesn't have exp2/log2 as WAD operations
        if (c.op == EXP2 || c.op == LOG2) {
            return (0, 0);
        }

        int256 ia = c.a_wad;
        
        int256 sr_signed;
        uint256 g0 = gasleft();
        if (c.op == EXP)       sr_signed = FixedPointMathLib.expWad(ia);
        else if (c.op == LN)   sr_signed = FixedPointMathLib.lnWad(ia);
        else                   sr_signed = int256(FixedPointMathLib.sqrtWad(uint256(ia)));
        gas_ = g0 - gasleft();
        
        uint256 sr = uint256(sr_signed);
        digits_ = _matchingDigits(sr, exp_wad, 18);
    }


    // ═══════════════════════════════════════════════════════════════════════
    // Conversion Helpers
    // ═══════════════════════════════════════════════════════════════════════

    function _wadToFp128(int256 wad) internal pure returns (uint256) {
        // fp128 = (wad << 128) / 1e18
        // To avoid overflow, use: (wad * 2^128) / 1e18
        // Since 2^128 / 1e18 ≈ 3.4e20, and max wad is ~1e38, result fits in 256 bits
        bool negative = wad < 0;
        uint256 abs_wad = uint256(negative ? -wad : wad);
        
        // Compute (abs_wad << 128) / 1e18 using mulDiv-like approach
        uint256 result = (abs_wad << 128) / 1e18;
        
        if (negative) {
            return uint256(-int256(result));
        }
        return result;
    }

    function _wadToAbdk(int256 wad) internal pure returns (int128) {
        int256 result = (wad << 64) / int256(1e18);
        return int128(result);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Matching Digits Calculation
    // ═══════════════════════════════════════════════════════════════════════

    function _matchingDigits(uint256 result, uint256 expected, uint256 maxDigits) internal pure returns (uint256) {
        if (result == expected) return maxDigits; // Exact match at this format's precision ceiling
        if (expected == 0) return 0;
        
        uint256 diff = result > expected ? result - expected : expected - result;
        if (diff == 0) return maxDigits;
        
        // digits = -log10(diff / expected) = log10(expected / diff)
        // Approximate: log10(x) ≈ log2(x) / 3.32
        uint256 ratio = expected / diff;
        if (ratio == 0) return 0;
        
        uint256 log2ratio = _log2(ratio);
        uint256 digits = (log2ratio * 100) / 332; // log10(ratio) * 100 for 2 decimal places
        return digits > maxDigits ? maxDigits : digits;
    }

    function _matchingDigitsAbdk(int128 result, int128 expected, uint256 maxDigits) internal pure returns (uint256) {
        if (result == expected) return maxDigits; // Exact match at this format's precision ceiling
        if (expected == 0) return 0;
        
        int128 diff = result > expected ? result - expected : expected - result;
        if (diff == 0) return maxDigits;
        
        int128 abs_exp = expected < 0 ? -expected : expected;
        uint256 ratio = uint256(uint128(abs_exp)) / uint256(uint128(diff));
        if (ratio == 0) return 0;
        
        uint256 log2ratio = _log2(ratio);
        uint256 digits = (log2ratio * 100) / 332;
        return digits > maxDigits ? maxDigits : digits;
    }


    function _log2(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 n = 0;
        if (x >= 2**128) { n += 128; x >>= 128; }
        if (x >= 2**64) { n += 64; x >>= 64; }
        if (x >= 2**32) { n += 32; x >>= 32; }
        if (x >= 2**16) { n += 16; x >>= 16; }
        if (x >= 2**8) { n += 8; x >>= 8; }
        if (x >= 2**4) { n += 4; x >>= 4; }
        if (x >= 2**2) { n += 2; x >>= 2; }
        if (x >= 2**1) { n += 1; }
        return n;
    }
}
