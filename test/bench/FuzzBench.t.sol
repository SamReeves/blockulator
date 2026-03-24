// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {ABDKMath64x64} from "../../lib/abdk-libraries-solidity/ABDKMath64x64.sol";
import {FixedPointMathLib} from "../../lib/solady/src/utils/FixedPointMathLib.sol";
import "../fp127/IFP127.sol";

interface IVyperArith {
    function mul(int256, int256) external pure returns (int256);
    function div(int256, int256) external pure returns (int256);
    function add(int256, int256) external pure returns (int256);
    function sub(int256, int256) external pure returns (int256);
}

/// @title FuzzBench
/// @notice Fuzz testing for 4 fixed-point libraries with gas + precision tracking
/// @dev Writes FUZZ_BENCH| lines to file for scatter plot generation
contract FuzzBench is Test {
    using FixedPointMathLib for uint256;

    int256 constant WAD_I = 1e18;
    uint256 constant WAD = 1e18;
    string constant OUTPUT_FILE = "docs/benchmarks/fuzz_data.txt";

    IFP127 fp127;
    IVyperArith vyper;

    function setUp() public {
        // Deploy fp127 (Huff) - full interface with Fixed18 I/O
        {
            string memory hex1 = vm.readFile("contracts/build/huff/test_fp127.runtime.bin");
            bytes memory code1 = vm.parseBytes(string.concat("0x", hex1));
            address a1 = makeAddr("fp127");
            vm.etch(a1, code1);
            fp127 = IFP127(a1);
        }

        // Deploy Vyper
        {
            bytes memory code2 = vm.readFileBinary("contracts/build/vyper/arith.bin");
            address a2 = makeAddr("vyper");
            vm.etch(a2, code2);
            vyper = IVyperArith(a2);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORACLE (calls Python mpmath for ground truth)
    // ═══════════════════════════════════════════════════════════════════════════

    function _oracleWad2(string memory func, int256 a, int256 b) internal returns (int256) {
        string[] memory cmd = new string[](5);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp127/fp127_oracle.py";
        cmd[2] = string.concat("wad_", func);
        cmd[3] = vm.toString(a);
        cmd[4] = vm.toString(b);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (int256));
    }

    function _oracleWad1(string memory func, int256 x) internal returns (int256) {
        string[] memory cmd = new string[](4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp127/fp127_oracle.py";
        cmd[2] = string.concat("wad_", func);
        cmd[3] = vm.toString(x);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (int256));
    }

    /// @dev Returns (fp127_expected, wad_expected, abdk_expected) - each in its native format
    function _oracleBench2(string memory func, int256 a, int256 b) internal returns (int256, int256, int256) {
        string[] memory cmd = new string[](5);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp127/fp127_oracle.py";
        cmd[2] = string.concat("bench_", func);
        cmd[3] = vm.toString(a);
        cmd[4] = vm.toString(b);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (int256, int256, int256));
    }

    /// @dev Returns (fp127_expected, wad_expected, abdk_expected) for single-arg functions
    function _oracleBench1(string memory func, int256 x) internal returns (int256, int256, int256) {
        string[] memory cmd = new string[](4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp127/fp127_oracle.py";
        cmd[2] = string.concat("bench_", func);
        cmd[3] = vm.toString(x);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (int256, int256, int256));
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

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: MULTIPLICATION
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_mul(int256 a, int256 b) public {
        // Bound to avoid overflow
        a = bound(a, -1e24, 1e24);
        b = bound(b, -1e24, 1e24);

        // Get single WAD ground truth from mpmath (mathematically correct answer)
        int256 expected = _oracleWad2("mul", a, b);

        // FP127 - compare against ground truth
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.mul(uint256(a), uint256(b));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // Vyper - compare against ground truth
        uint256 vyper_gas;
        uint256 vyper_err;
        {
            uint256 g0 = gasleft();
            int256 result = vyper.mul(a, b);
            vyper_gas = g0 - gasleft();
            vyper_err = _absErr(result, expected);
        }

        // ABDK - compare against ground truth
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 a64 = _wadToAbdk(a);
            int128 b64 = _wadToAbdk(b);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.mul(a64, b64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady - compare against ground truth (unsigned only)
        string memory solady_str;
        if (a >= 0 && b >= 0) {
            uint256 g0 = gasleft();
            uint256 result = FixedPointMathLib.mulWad(uint256(a), uint256(b));
            uint256 solady_gas = g0 - gasleft();
            uint256 solady_err = _absErr(int256(result), expected);
            solady_str = string.concat(vm.toString(solady_gas), "|", vm.toString(solady_err));
        } else {
            solady_str = "NA|NA";
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|mul|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                vm.toString(vyper_gas), "|", vm.toString(vyper_err), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                solady_str
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: DIVISION
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_div(int256 a, int256 b) public {
        // Bound to avoid overflow and div by zero
        a = bound(a, -1e24, 1e24);
        b = bound(b, 1e6, 1e24); // positive divisor to avoid issues

        // Get WAD ground truth from mpmath (100-digit precision)
        int256 expected = _oracleWad2("div", a, b);

        // FP127
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.div(uint256(a), uint256(b));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // Vyper
        uint256 vyper_gas;
        uint256 vyper_err;
        {
            uint256 g0 = gasleft();
            int256 result = vyper.div(a, b);
            vyper_gas = g0 - gasleft();
            vyper_err = _absErr(result, expected);
        }

        // ABDK
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 a64 = _wadToAbdk(a);
            int128 b64 = _wadToAbdk(b);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.div(a64, b64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady (unsigned only)
        string memory solady_str;
        if (a >= 0 && b > 0) {
            uint256 g0 = gasleft();
            uint256 result = FixedPointMathLib.divWad(uint256(a), uint256(b));
            uint256 solady_gas = g0 - gasleft();
            uint256 solady_err = _absErr(int256(result), expected);
            solady_str = string.concat(vm.toString(solady_gas), "|", vm.toString(solady_err));
        } else {
            solady_str = "NA|NA";
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|div|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                vm.toString(vyper_gas), "|", vm.toString(vyper_err), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                solady_str
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: ADDITION
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_add(int256 a, int256 b) public {
        a = bound(a, -1e30, 1e30);
        b = bound(b, -1e30, 1e30);

        int256 expected = a + b; // Simple addition, no oracle needed

        // FP127
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.add(uint256(a), uint256(b));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // Vyper
        uint256 vyper_gas;
        uint256 vyper_err;
        {
            uint256 g0 = gasleft();
            int256 result = vyper.add(a, b);
            vyper_gas = g0 - gasleft();
            vyper_err = _absErr(result, expected);
        }

        // ABDK
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 a64 = _wadToAbdk(a);
            int128 b64 = _wadToAbdk(b);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.add(a64, b64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady (native addition)
        string memory solady_str;
        if (a >= 0 && b >= 0) {
            uint256 g0 = gasleft();
            uint256 result = uint256(a) + uint256(b);
            uint256 solady_gas = g0 - gasleft();
            uint256 solady_err = _absErr(int256(result), expected);
            solady_str = string.concat(vm.toString(solady_gas), "|", vm.toString(solady_err));
        } else {
            solady_str = "NA|NA";
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|add|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                vm.toString(vyper_gas), "|", vm.toString(vyper_err), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                solady_str
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: SUBTRACTION
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_sub(int256 a, int256 b) public {
        a = bound(a, -1e30, 1e30);
        b = bound(b, -1e30, 1e30);

        int256 expected = a - b;

        // FP127
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.sub(uint256(a), uint256(b));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // Vyper
        uint256 vyper_gas;
        uint256 vyper_err;
        {
            uint256 g0 = gasleft();
            int256 result = vyper.sub(a, b);
            vyper_gas = g0 - gasleft();
            vyper_err = _absErr(result, expected);
        }

        // ABDK
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 a64 = _wadToAbdk(a);
            int128 b64 = _wadToAbdk(b);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.sub(a64, b64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady (native subtraction)
        string memory solady_str;
        if (a >= 0 && b >= 0 && a >= b) {
            uint256 g0 = gasleft();
            uint256 result = uint256(a) - uint256(b);
            uint256 solady_gas = g0 - gasleft();
            uint256 solady_err = _absErr(int256(result), expected);
            solady_str = string.concat(vm.toString(solady_gas), "|", vm.toString(solady_err));
        } else {
            solady_str = "NA|NA";
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|sub|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                vm.toString(vyper_gas), "|", vm.toString(vyper_err), "|",
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                solady_str
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: EXP (transcendental - fp127, abdk, solady only)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_exp(int256 x) public {
        // Bound to valid exp range for all libraries
        // ABDK 64.64 has a more limited range than WAD: roughly [-43, 43] in integer terms
        // To be safe, use [-20, 40] in WAD
        vm.assume(x >= -20e18 && x <= 40e18);

        // Get WAD ground truth from mpmath (100-digit precision)
        int256 expected = _oracleWad1("exp", x);

        // FP127 - uses Fixed18 I/O
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.exp(uint256(x));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // ABDK
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 x64 = _wadToAbdk(x);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.exp(x64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady
        uint256 solady_gas;
        uint256 solady_err;
        {
            uint256 g0 = gasleft();
            int256 result = FixedPointMathLib.expWad(x);
            solady_gas = g0 - gasleft();
            solady_err = _absErr(result, expected);
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|exp|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                "NA|NA|", // Vyper doesn't have exp
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                vm.toString(solady_gas), "|", vm.toString(solady_err)
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: LN (transcendental - fp127, abdk, solady only)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_ln(int256 x) public {
        // Bound to positive values for ln
        x = bound(x, 1e6, 1e30); // min ~1e-12 WAD to max ~1e12 WAD

        // Get WAD ground truth from mpmath (100-digit precision)
        int256 expected = _oracleWad1("ln", x);

        // FP127 - uses Fixed18 I/O
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.ln(uint256(x));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // ABDK
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 x64 = _wadToAbdk(x);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.ln(x64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady
        uint256 solady_gas;
        uint256 solady_err;
        {
            uint256 g0 = gasleft();
            int256 result = FixedPointMathLib.lnWad(x);
            solady_gas = g0 - gasleft();
            solady_err = _absErr(result, expected);
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|ln|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                "NA|NA|", // Vyper doesn't have ln
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                vm.toString(solady_gas), "|", vm.toString(solady_err)
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUZZ: SQRT (transcendental - fp127, abdk, solady only)
    // ═══════════════════════════════════════════════════════════════════════════

    function testFuzz_sqrt(int256 x) public {
        // Bound to non-negative values
        x = bound(x, 0, 1e36);

        // Get WAD ground truth from mpmath (100-digit precision)
        int256 expected = _oracleWad1("sqrt", x);

        // FP127 - uses Fixed18 I/O
        uint256 fp127_gas;
        uint256 fp127_err;
        {
            uint256 g0 = gasleft();
            uint256 result = fp127.sqrt(uint256(x));
            fp127_gas = g0 - gasleft();
            fp127_err = _absErr(int256(result), expected);
        }

        // ABDK
        uint256 abdk_gas;
        uint256 abdk_err;
        {
            int128 x64 = _wadToAbdk(x);
            uint256 g0 = gasleft();
            int128 r64 = ABDKMath64x64.sqrt(x64);
            abdk_gas = g0 - gasleft();
            abdk_err = _absErr(_abdkToWad(r64), expected);
        }

        // Solady
        uint256 solady_gas;
        uint256 solady_err;
        {
            uint256 g0 = gasleft();
            uint256 result = FixedPointMathLib.sqrtWad(uint256(x));
            solady_gas = g0 - gasleft();
            solady_err = _absErr(int256(result), expected);
        }

        vm.writeLine(
            OUTPUT_FILE,
            string.concat(
                "FUZZ_BENCH|sqrt|",
                vm.toString(fp127_gas), "|", vm.toString(fp127_err), "|",
                "NA|NA|", // Vyper doesn't have sqrt
                vm.toString(abdk_gas), "|", vm.toString(abdk_err), "|",
                vm.toString(solady_gas), "|", vm.toString(solady_err)
            )
        );
    }
}
