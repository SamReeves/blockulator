// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {ABDKMath64x64} from "../lib/abdk-libraries-solidity/ABDKMath64x64.sol";
import {FixedPointMathLib} from "../lib/solady/src/utils/FixedPointMathLib.sol";

interface IHuffArith {
    function add(uint256, uint256) external view returns (uint256);
    function sub(uint256, uint256) external view returns (uint256);
    function mul(uint256, uint256) external view returns (uint256);
    function div(uint256, uint256) external view returns (uint256);
    function exp(uint256) external view returns (uint256);
    function ln(uint256) external view returns (uint256);
    function sqrt(uint256) external view returns (uint256);
}

interface IVyperArith {
    function mul(int256, int256) external pure returns (int256);
    function div(int256, int256) external pure returns (int256);
    function add(int256, int256) external pure returns (int256);
    function sub(int256, int256) external pure returns (int256);
}

/// @title ArithBench
/// @notice Gas + precision benchmark for four arithmetic backends:
///   - fp127    (Huff 127.128 fixed-point, fixed18 I/O)
///   - vyper    (Vyper int256 18-decimal, fixed18 I/O)
///   - ABDK     (Solidity library, 64.64 fixed-point)
///   - Solady   (Solidity library, WAD 18-decimal)
/// All errors measured in WAD units against 100-digit mpmath reference values.
contract ArithBench is Test {
    using FixedPointMathLib for uint256;

    uint8 constant MUL = 0;
    uint8 constant DIV = 1;
    uint8 constant ADD = 2;
    uint8 constant SUB = 3;

    int256 constant WAD_I = 1e18;

    struct Case {
        string name;
        uint8 op;
        int256 a;        // fixed18 (WAD) signed
        int256 b;        // fixed18 (WAD) signed
        int256 expected; // fixed18 (WAD) signed, 100-digit reference
    }

    Case[] cases;
    IHuffArith fp127;
    IVyperArith vyper;
    uint256 _fp127Overhead;

    function setUp() public {
        // Deploy fp127 (127.128 fixed-point, fixed18 I/O)
        {
            string memory hex1 = vm.readFile("contracts/build/huff/test_fp127.runtime.bin");
            bytes memory code1 = vm.parseBytes(string.concat("0x", hex1));
            address a1 = makeAddr("fp127");
            vm.etch(a1, code1);
            fp127 = IHuffArith(a1);
        }

        // Deploy Vyper (int256 18-decimal, fixed18 I/O)
        {
            bytes memory code2 = vm.readFileBinary("contracts/build/vyper/arith.bin");
            address a2 = makeAddr("vyper");
            vm.etch(a2, code2);
            vyper = IVyperArith(a2);
        }

        // Measure call overhead for transcendental functions
        _fp127Overhead = _measureCallOverhead(address(fp127));
        
        _initCases();
        _initTransCases();
    }

    function _a(string memory n, uint8 op, int256 a, int256 b, int256 exp) internal {
        cases.push(Case(n, op, a, b, exp));
    }

    function _initCases() internal {
        // 52 benchmark cases generated at 100-digit precision via mpmath
        _a("pi * e", 0, 3141592653589793238, 2718281828459045235, 8539734222673567065);
        _a("sqrt2 * sqrt3", 0, 1414213562373095048, 1732050807568877293, 2449489742783178098);
        _a("phi * (1/phi)", 0, 1618033988749894848, 618033988749894848, 1000000000000000000);
        _a("1/3 * 3", 0, 333333333333333333, 3000000000000000000, 1000000000000000000);
        _a("1/7 * 7", 0, 142857142857142857, 7000000000000000000, 1000000000000000000);
        _a("1/13 * 13", 0, 76923076923076923, 13000000000000000000, 1000000000000000000);
        _a("e * e", 0, 2718281828459045235, 2718281828459045235, 7389056098930650227);
        _a("pi * pi", 0, 3141592653589793238, 3141592653589793238, 9869604401089358618);
        _a("0.1 * 0.1", 0, 100000000000000000, 100000000000000000, 10000000000000000);
        _a("1e-9 * 1e9", 0, 1000000000, 1000000000000000000000000000, 1000000000000000000);
        _a("ln2 * (1/ln2)", 0, 693147180559945309, 1442695040888963407, 1000000000000000000);
        _a("99.99 * 1.0001", 0, 99990000000000000000, 1000100000000000000, 99999999000000000000);
        _a("(-2) * 3", 0, -2000000000000000000, 3000000000000000000, -6000000000000000000);
        _a("(-pi) * (-e)", 0, -3141592653589793238, -2718281828459045235, 8539734222673567065);
        _a("pi / e", 1, 3141592653589793238, 2718281828459045235, 1155727349790921717);
        _a("e / pi", 1, 2718281828459045235, 3141592653589793238, 865255979432265087);
        _a("1 / 3", 1, 1000000000000000000, 3000000000000000000, 333333333333333333);
        _a("1 / 7", 1, 1000000000000000000, 7000000000000000000, 142857142857142857);
        _a("1 / 13", 1, 1000000000000000000, 13000000000000000000, 76923076923076923);
        _a("22 / 7", 1, 22000000000000000000, 7000000000000000000, 3142857142857142857);
        _a("sqrt2 / sqrt3", 1, 1414213562373095048, 1732050807568877293, 816496580927726032);
        _a("e^2 / e", 1, 7389056098930650227, 2718281828459045235, 2718281828459045235);
        _a("ln10 / ln2", 1, 2302585092994045684, 693147180559945309, 3321928094887362347);
        _a("phi / sqrt2", 1, 1618033988749894848, 1414213562373095048, 1144122805635368595);
        _a("100.001 / 100", 1, 100001000000000000000, 100000000000000000000, 1000010000000000000);
        _a("(-6) / 3", 1, -6000000000000000000, 3000000000000000000, -2000000000000000000);
        _a("pi + e", 2, 3141592653589793238, 2718281828459045235, 5859874482048838473);
        _a("1 + 1e-15", 2, 1000000000000000000, 1000, 1000000000000000999);
        _a("phi + (1/phi)", 2, 1618033988749894848, 618033988749894848, 2236067977499789696);
        _a("(-3) + 5", 2, -3000000000000000000, 5000000000000000000, 2000000000000000000);
        _a("(1+1e-15) - 1", 3, 1000000000000000999, 1000000000000000000, 1000);
        _a("phi^2 - phi", 3, 2618033988749894848, 1618033988749894848, 1000000000000000000);
        _a("sqrt2^2 - 2", 3, 2000000000000000000, 2000000000000000000, 0);
        _a("5 - 3", 3, 5000000000000000000, 3000000000000000000, 2000000000000000000);
        _a("(pi*e)/e", 1, 8539734222673567065, 2718281828459045235, 3141592653589793238);
        _a("(e/pi)*pi", 0, 865255979432265087, 3141592653589793238, 2718281828459045235);
        _a("sqrt(2)^2 via mul", 0, 1414213562373095048, 1414213562373095048, 2000000000000000000);
        _a("1e-15 * 1e-15", 0, 1000, 1000, 0);
        _a("1e-9 / 1e9", 1, 1000000000, 1000000000000000000000000000, 0);
        _a("1e-12 + 1e-12", 2, 1000000, 1000000, 2000000);
        _a("1e-10 - 0.5e-10", 3, 100000000, 50000000, 50000000);
        _a("1e15 * 1e2", 0, 1000000000000000000000000000000000, 100000000000000000000, 100000000000000000000000000000000000);
        _a("1e18 * 1e-3", 0, 1000000000000000000000000000000000000, 1000000000000000, 1000000000000000000000000000000000);
        _a("1e20 / 1e10", 1, 100000000000000000000000000000000000000, 10000000000000000000000000000, 10000000000000000000000000000);
        _a("1e30 / 1e15", 1, 1000000000000000000000000000000000000000000000000, 1000000000000000000000000000000000, 1000000000000000000000000000000000);
        _a("(1+1e-15)^2 - 1", 3, 1000000000000002000, 1000000000000000000, 2000);
        _a("(a+b)*(a-b)", 0, 2000000000000000000, 2000000000, 4000000000);
        _a("a^2 - b^2 direct", 3, 1000000002000000001, 999999998000000001, 4000000000);
        _a("(a*b)/(b*a)", 1, 8539734222673567065, 8539734222673567065, 1000000000000000000);
        _a("((a/b)*b)/a", 1, 3141592653589793238, 3141592653589793238, 1000000000000000000);
        _a("(1+2)*(3+4)", 0, 3000000000000000000, 7000000000000000000, 21000000000000000000);
        _a("10/(2+3)", 1, 10000000000000000000, 5000000000000000000, 2000000000000000000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BENCHMARK
    // ═══════════════════════════════════════════════════════════════════════

    function test_benchmark_all() public view {
        console.log("BENCH_START");
        
        // Measure call overhead for Huff contracts (for reference)
        uint256 overhead_fp127 = _measureCallOverhead(address(fp127));
        console.log(string.concat("OVERHEAD|fp127=", vm.toString(overhead_fp127)));
        
        for (uint256 i = 0; i < cases.length; i++) {
            _benchOne(cases[i]);
        }
        console.log("BENCH_END");
    }

    function _measureCallOverhead(address target) internal view returns (uint256) {
        // Call a no-op or minimal function to measure staticcall base cost
        uint256 g0 = gasleft();
        (bool ok,) = target.staticcall(abi.encodeWithSignature("add(uint256,uint256)", uint256(0), uint256(0)));
        uint256 g1 = gasleft();
        require(ok, "overhead measurement failed");
        return g0 - g1;
    }

    function _benchOne(Case memory c) internal view {
        // Run all four backends and collect [gas, err] pairs
        (uint256 fp127_gas, uint256 fp127_err)   = _runFp127(c);
        (uint256 vyper_gas, uint256 vyper_err)   = _runVyper(c);
        (uint256 abdk_gas, uint256 abdk_err)     = _runAbdk(c);

        string memory opStr;
        if (c.op == MUL)      opStr = "mul";
        else if (c.op == DIV) opStr = "div";
        else if (c.op == ADD) opStr = "add";
        else                  opStr = "sub";

        // Solady: unsigned only
        string memory solady_str;
        {
            bool sok = (c.a >= 0 && c.b >= 0);
            if (c.op == SUB && c.a < c.b) sok = false;
            if (sok) {
                (uint256 sg, uint256 se) = _runSolady(c);
                solady_str = string.concat(vm.toString(sg), "|", vm.toString(se));
            } else {
                solady_str = "NA|NA";
            }
        }

        // BENCH|name|op|expected|fp127_gas|fp127_err|vyper_gas|vyper_err|abdk_gas|abdk_err|solady_gas|solady_err
        console.log(
            string.concat(
                "BENCH|", c.name, "|", opStr, "|",
                vm.toString(c.expected), "|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                vm.toString(vyper_gas), "|", vm.toString(vyper_err), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                solady_str
            )
        );
    }

    function _runFp127(Case memory c) internal view returns (uint256 gas_, uint256 err_) {
        uint256 g0 = gasleft();
        uint256 raw;
        if (c.op == MUL)      raw = fp127.mul(uint256(c.a), uint256(c.b));
        else if (c.op == DIV) raw = fp127.div(uint256(c.a), uint256(c.b));
        else if (c.op == ADD) raw = fp127.add(uint256(c.a), uint256(c.b));
        else                  raw = fp127.sub(uint256(c.a), uint256(c.b));
        gas_ = g0 - gasleft();
        err_ = _absErr(int256(raw), c.expected);
    }

    function _runVyper(Case memory c) internal view returns (uint256 gas_, uint256 err_) {
        uint256 g0 = gasleft();
        int256 raw;
        if (c.op == MUL)      raw = vyper.mul(c.a, c.b);
        else if (c.op == DIV) raw = vyper.div(c.a, c.b);
        else if (c.op == ADD) raw = vyper.add(c.a, c.b);
        else                  raw = vyper.sub(c.a, c.b);
        gas_ = g0 - gasleft();
        err_ = _absErr(raw, c.expected);
    }

    function _runAbdk(Case memory c) internal view returns (uint256 gas_, uint256 err_) {
        int128 a64 = _wadToAbdk(c.a);
        int128 b64 = _wadToAbdk(c.b);

        int128 r64;
        uint256 g0 = gasleft();
        if (c.op == MUL)      r64 = ABDKMath64x64.mul(a64, b64);
        else if (c.op == DIV) r64 = ABDKMath64x64.div(a64, b64);
        else if (c.op == ADD) r64 = ABDKMath64x64.add(a64, b64);
        else                  r64 = ABDKMath64x64.sub(a64, b64);
        gas_ = g0 - gasleft();
        err_ = _absErr(_abdkToWad(r64), c.expected);
    }

    function _runSolady(Case memory c) internal view returns (uint256 gas_, uint256 err_) {
        uint256 ua = uint256(c.a);
        uint256 ub = uint256(c.b);
        uint256 sr;
        uint256 g0 = gasleft();
        if (c.op == MUL)      sr = FixedPointMathLib.mulWad(ua, ub);
        else if (c.op == DIV) sr = FixedPointMathLib.divWad(ua, ub);
        else if (c.op == ADD) sr = ua + ub;
        else                  sr = ua - ub;
        gas_ = g0 - gasleft();
        err_ = _absErr(int256(sr), c.expected);
    }


    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCENDENTAL BENCHMARK
    // ═══════════════════════════════════════════════════════════════════════

    uint8 constant EXP = 0;
    uint8 constant LN = 1;
    uint8 constant SQRT = 2;

    struct TransCase {
        string name;
        uint8 func;      // EXP, LN, or SQRT
        int256 x;        // fixed18 (WAD) signed input
        int256 expected; // fixed18 (WAD) signed, 100-digit reference
    }

    TransCase[] transCases;

    function _t(string memory n, uint8 func, int256 x, int256 exp) internal {
        transCases.push(TransCase(n, func, x, exp));
    }

    function _initTransCases() internal {
        // 27 transcendental cases generated at 100-digit precision via mpmath
        _t("exp(0)", 0, 0, 1000000000000000000);
        _t("exp(1)", 0, 1000000000000000000, 2718281828459045235);
        _t("exp(-1)", 0, -1000000000000000000, 367879441171442321);
        _t("exp(2)", 0, 2000000000000000000, 7389056098930650227);
        _t("exp(0.5)", 0, 500000000000000000, 1648721270700128146);
        _t("exp(-0.5)", 0, -500000000000000000, 606530659712633423);
        _t("exp(10)", 0, 10000000000000000000, 22026465794806716516957);
        _t("exp(-10)", 0, -10000000000000000000, 45399929762484);
        _t("exp(ln(2))", 0, 693147180559945309, 2000000000000000000);
        _t("exp(3.5)", 0, 3500000000000000000, 33115451958692313750);
        _t("ln(1)", 1, 1000000000000000000, 0);
        _t("ln(e)", 1, 2718281828459045235, 1000000000000000000);
        _t("ln(2)", 1, 2000000000000000000, 693147180559945309);
        _t("ln(10)", 1, 10000000000000000000, 2302585092994045684);
        _t("ln(0.5)", 1, 500000000000000000, -693147180559945309);
        _t("ln(100)", 1, 100000000000000000000, 4605170185988091368);
        _t("ln(e^2)", 1, 7389056098930650227, 2000000000000000000);
        _t("ln(0.1)", 1, 100000000000000000, -2302585092994045684);
        _t("sqrt(2)", 2, 2000000000000000000, 1414213562373095048);
        _t("sqrt(3)", 2, 3000000000000000000, 1732050807568877293);
        _t("sqrt(0.5)", 2, 500000000000000000, 707106781186547524);
        _t("sqrt(1)", 2, 1000000000000000000, 1000000000000000000);
        _t("sqrt(4)", 2, 4000000000000000000, 2000000000000000000);
        _t("sqrt(100)", 2, 100000000000000000000, 10000000000000000000);
        _t("sqrt(1e18)", 2, 1000000000000000000000000000000000000, 1000000000000000000000000000);
        _t("sqrt(pi)", 2, 3141592653589793238, 1772453850905516027);
        _t("sqrt(e)", 2, 2718281828459045235, 1648721270700128146);
    }

    function test_bench_transcendental() public view {
        console.log("TRANS_START");
        for (uint256 i = 0; i < transCases.length; i++) {
            _benchOneTrans(transCases[i]);
        }
        console.log("TRANS_END");
    }

    function _benchOneTrans(TransCase memory c) internal view {
        // Run three backends (Vyper doesn't support transcendentals)
        (uint256 fp127_gas, uint256 fp127_err) = _runFp127Trans(c);
        (uint256 abdk_gas, uint256 abdk_err) = _runAbdkTrans(c);
        (uint256 solady_gas, uint256 solady_err) = _runSoladyTrans(c);

        string memory funcStr;
        if (c.func == EXP)       funcStr = "exp";
        else if (c.func == LN)   funcStr = "ln";
        else                     funcStr = "sqrt";

        // TRANS|name|func|expected|fp127_gas|fp127_err|abdk_gas|abdk_err|solady_gas|solady_err
        console.log(
            string.concat(
                "TRANS|", c.name, "|", funcStr, "|",
                vm.toString(c.expected), "|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                vm.toString(solady_gas), "|", vm.toString(solady_err)
            )
        );
    }

    function _runFp127Trans(TransCase memory c) internal view returns (uint256 gas_, uint256 err_) {
        // FP127 uses fixed18 I/O
        uint256 r;
        uint256 g0 = gasleft();
        if (c.func == EXP)       r = fp127.exp(uint256(c.x));
        else if (c.func == LN)   r = fp127.ln(uint256(c.x));
        else                     r = fp127.sqrt(uint256(c.x));
        gas_ = g0 - gasleft();
        
        // Subtract call overhead for fair comparison
        gas_ = gas_ > _fp127Overhead ? gas_ - _fp127Overhead : 0;
        
        err_ = _absErr(int256(r), c.expected);
    }


    function _runAbdkTrans(TransCase memory c) internal view returns (uint256 gas_, uint256 err_) {
        int128 x64 = _wadToAbdk(c.x);
        int128 r64;
        uint256 g0 = gasleft();
        if (c.func == EXP)       r64 = ABDKMath64x64.exp(x64);
        else if (c.func == LN)   r64 = ABDKMath64x64.ln(x64);
        else                     r64 = ABDKMath64x64.sqrt(x64);
        gas_ = g0 - gasleft();
        err_ = _absErr(_abdkToWad(r64), c.expected);
    }

    function _runSoladyTrans(TransCase memory c) internal view returns (uint256 gas_, uint256 err_) {
        // Solady transcendental functions expect unsigned or signed differently
        if (c.func == EXP) {
            // expWad takes int256
            uint256 g0 = gasleft();
            int256 r = FixedPointMathLib.expWad(c.x);
            gas_ = g0 - gasleft();
            err_ = _absErr(r, c.expected);
        } else if (c.func == LN) {
            // lnWad takes int256
            uint256 g0 = gasleft();
            int256 r = FixedPointMathLib.lnWad(c.x);
            gas_ = g0 - gasleft();
            err_ = _absErr(r, c.expected);
        } else {
            // sqrtWad takes uint256
            uint256 ux = uint256(c.x);
            uint256 g0 = gasleft();
            uint256 r = FixedPointMathLib.sqrtWad(ux);
            gas_ = g0 - gasleft();
            err_ = _absErr(int256(r), c.expected);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    function _wadToAbdk(int256 wad) internal pure returns (int128) {
        int256 result = (wad << 64) / WAD_I;
        return int128(result);
    }

    function _abdkToWad(int128 abdk) internal pure returns (int256) {
        return (int256(abdk) * WAD_I) >> 64;
    }

    function _absErr(int256 result, int256 expected) internal pure returns (uint256) {
        int256 diff = result - expected;
        return uint256(diff < 0 ? -diff : diff);
    }
}
