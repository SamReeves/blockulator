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
    function powRaw(uint256, uint256) external view returns (uint256);
}

/// @title PrecisionSweep
/// @notice Comprehensive precision distribution test across hundreds of inputs per function
/// @dev Emits SWEEP lines for post-processing by scripts/generators/precision_sweep.py
contract PrecisionSweep is Test {
    using FixedPointMathLib for uint256;
    
    IFP128 fp128;
    uint256 _fp128Overhead;
    
    int256 constant WAD = 1e18;
    uint256 constant ONE_FP128 = uint256(1) << 128;
    
    function setUp() public {
        // Deploy fp128
        string memory hex1 = vm.readFile("contracts/build/huff/test_fp128.runtime.bin");
        bytes memory code1 = vm.parseBytes(string.concat("0x", hex1));
        address a1 = makeAddr("fp128");
        vm.etch(a1, code1);
        fp128 = IFP128(a1);
        
        // Measure call overhead
        _fp128Overhead = _measureCallOverhead(address(fp128));
    }
    
    function _measureCallOverhead(address target) internal view returns (uint256) {
        uint256 g0 = gasleft();
        (bool ok,) = target.staticcall(abi.encodeWithSignature("mulRaw(uint256,uint256)", uint256(0), uint256(0)));
        uint256 g1 = gasleft();
        require(ok, "overhead measurement failed");
        return g0 - g1;
    }
    
    /// @notice Split sweep into separate tests to avoid gas limits
    function test_sweep_mul() public {
        console.log("SWEEP_START");
        _sweepMul();
        console.log("SWEEP_END");
    }
    
    function test_sweep_div() public {
        console.log("SWEEP_START");
        _sweepDiv();
        console.log("SWEEP_END");
    }
    
    function test_sweep_add() public {
        console.log("SWEEP_START");
        _sweepAdd();
        console.log("SWEEP_END");
    }
    
    function test_sweep_sub() public {
        console.log("SWEEP_START");
        _sweepSub();
        console.log("SWEEP_END");
    }
    
    function test_sweep_exp() public {
        console.log("SWEEP_START");
        _sweepExp();
        console.log("SWEEP_END");
    }
    
    function test_sweep_exp2() public {
        console.log("SWEEP_START");
        _sweepExp2();
        console.log("SWEEP_END");
    }
    
    function test_sweep_ln() public {
        console.log("SWEEP_START");
        _sweepLn();
        console.log("SWEEP_END");
    }
    
    function test_sweep_log2() public {
        console.log("SWEEP_START");
        _sweepLog2();
        console.log("SWEEP_END");
    }
    
    function test_sweep_sqrt() public {
        console.log("SWEEP_START");
        _sweepSqrt();
        console.log("SWEEP_END");
    }
    
    // ============================================================================
    // SWEEP IMPLEMENTATIONS
    // ============================================================================
    
    function _sweepMul() internal {
        // Minimal representative samples to stay within gas limits
        int256[] memory vals = new int256[](7);
        vals[0] = 1000; // Small
        vals[1] = WAD / 2; // 0.5
        vals[2] = WAD; // 1.0
        vals[3] = 314 * WAD / 100; // pi
        vals[4] = 10 * WAD; // 10
        vals[5] = 100 * WAD; // 100
        vals[6] = 1e28; // Large
        
        for (uint256 i = 0; i < vals.length; i++) {
            for (uint256 j = i; j < vals.length; j++) {
                _runSample("mul", vals[i], vals[j]);
            }
        }
    }
    
    function _sweepDiv() internal {
        // Minimal representative samples
        int256[] memory vals = new int256[](7);
        vals[0] = 1000; // Small
        vals[1] = WAD / 2; // 0.5
        vals[2] = WAD; // 1.0
        vals[3] = 314 * WAD / 100; // pi
        vals[4] = 10 * WAD; // 10
        vals[5] = 100 * WAD; // 100
        vals[6] = 1e28; // Large
        
        for (uint256 i = 0; i < vals.length; i++) {
            for (uint256 j = 0; j < vals.length; j++) {
                _runSample("div", vals[i], vals[j]);
            }
        }
    }
    
    function _sweepAdd() internal {
        int256[] memory vals = _getInterestingValues();
        
        for (uint256 i = 0; i < vals.length; i++) {
            for (uint256 j = 0; j < vals.length; j++) {
                if (vals[i] < 0 || vals[j] < 0) continue;
                _runSample("add", vals[i], vals[j]);
            }
        }
    }
    
    function _sweepSub() internal {
        int256[] memory vals = _getInterestingValues();
        
        for (uint256 i = 0; i < vals.length; i++) {
            for (uint256 j = 0; j < vals.length; j++) {
                if (vals[i] < 0 || vals[j] < 0) continue;
                if (vals[i] < vals[j]) continue; // Skip negative results
                _runSample("sub", vals[i], vals[j]);
            }
        }
    }
    
    function _sweepExp() internal {
        // Key points in exp range
        int256[] memory expVals = new int256[](15);
        expVals[0] = -87 * WAD; // Near underflow
        expVals[1] = -50 * WAD;
        expVals[2] = -20 * WAD;
        expVals[3] = -10 * WAD;
        expVals[4] = -5 * WAD;
        expVals[5] = -2 * WAD;
        expVals[6] = -WAD;
        expVals[7] = 0;
        expVals[8] = WAD;
        expVals[9] = 2 * WAD;
        expVals[10] = 5 * WAD;
        expVals[11] = 10 * WAD;
        expVals[12] = 20 * WAD;
        expVals[13] = 50 * WAD;
        expVals[14] = 87 * WAD; // Near overflow

        for (uint256 i = 0; i < expVals.length; i++) {
            _runSample("exp", expVals[i], 0);
        }
    }

    function _sweepExp2() internal {
        // Shared range across all libraries (ABDK 64.64 caps at ~63)
        int256[] memory exp2Vals = new int256[](13);
        exp2Vals[0] = -60 * WAD;
        exp2Vals[1] = -32 * WAD;
        exp2Vals[2] = -16 * WAD;
        exp2Vals[3] = -8 * WAD;
        exp2Vals[4] = -4 * WAD;
        exp2Vals[5] = -WAD;
        exp2Vals[6] = 0;
        exp2Vals[7] = WAD;
        exp2Vals[8] = 4 * WAD;
        exp2Vals[9] = 8 * WAD;
        exp2Vals[10] = 16 * WAD;
        exp2Vals[11] = 32 * WAD;
        exp2Vals[12] = 60 * WAD;

        for (uint256 i = 0; i < exp2Vals.length; i++) {
            _runSample("exp2", exp2Vals[i], 0);
        }
    }

    function _sweepLn() internal {
        // Log-spaced samples in [1e-15, 1e20] WAD
        int256[] memory logVals = _getLogSpacedValues();
        
        for (uint256 i = 0; i < logVals.length; i++) {
            if (logVals[i] <= 0) continue;
            _runSample("ln", logVals[i], 0);
        }
        
        // Extra samples near boundaries
        _runSample("ln", WAD, 0); // ln(1) = 0
        _runSample("ln", 2 * WAD, 0); // ln(2) - range reduction boundary
        _runSample("ln", 4 * WAD, 0); // ln(4) = 2*ln(2)
    }
    
    function _sweepLog2() internal {
        // Log-spaced samples in [1e-15, 1e20] WAD
        int256[] memory logVals = _getLogSpacedValues();
        
        for (uint256 i = 0; i < logVals.length; i++) {
            if (logVals[i] <= 0) continue;
            _runSample("log2", logVals[i], 0);
        }
        
        // Special values
        _runSample("log2", 2 * WAD, 0); // log2(2) = 1
        _runSample("log2", 2718281828459045235, 0); // log2(e)
    }
    
    function _sweepSqrt() internal {
        // Log-spaced samples
        int256[] memory logVals = _getLogSpacedValues();
        
        for (uint256 i = 0; i < logVals.length; i++) {
            if (logVals[i] <= 0) continue;
            _runSample("sqrt", logVals[i], 0);
        }
        
        // Perfect squares
        _runSample("sqrt", 4 * WAD, 0);
        _runSample("sqrt", 9 * WAD, 0);
        _runSample("sqrt", 16 * WAD, 0);
        _runSample("sqrt", 100 * WAD, 0);
    }
    
    // ============================================================================
    // INPUT GENERATORS
    // ============================================================================
    
    function _getInterestingValues() internal pure returns (int256[] memory) {
        int256[] memory vals = new int256[](12);
        vals[0] = 1e3;           // 1e-15 WAD
        vals[1] = 1e6;           // 1e-12 WAD
        vals[2] = 1e12;          // 1e-6 WAD
        vals[3] = 1e15;          // 0.001 WAD
        vals[4] = 5e17;          // 0.5 WAD
        vals[5] = WAD;           // 1.0 WAD
        vals[6] = 3141592653589793238;  // pi
        vals[7] = 2718281828459045235;  // e
        vals[8] = 10 * WAD;      // 10
        vals[9] = 100 * WAD;     // 100
        vals[10] = 1e10 * WAD;   // 1e10
        vals[11] = 1e15 * WAD;   // 1e15
        return vals;
    }
    
    function _getLogSpacedValues() internal pure returns (int256[] memory) {
        int256[] memory vals = new int256[](25);
        
        // Log-spaced from 1e-15 to 1e20
        vals[0] = 1e3;
        vals[1] = 1e5;
        vals[2] = 1e7;
        vals[3] = 1e9;
        vals[4] = 1e11;
        vals[5] = 1e13;
        vals[6] = 1e15;
        vals[7] = 1e16;
        vals[8] = 5e16;
        vals[9] = 1e17;
        vals[10] = 5e17;
        vals[11] = WAD;
        vals[12] = 2 * WAD;
        vals[13] = 5 * WAD;
        vals[14] = 10 * WAD;
        vals[15] = 50 * WAD;
        vals[16] = 100 * WAD;
        vals[17] = 1e3 * WAD;
        vals[18] = 1e4 * WAD;
        vals[19] = 1e6 * WAD;
        vals[20] = 1e8 * WAD;
        vals[21] = 1e10 * WAD;
        vals[22] = 1e12 * WAD;
        vals[23] = 1e15 * WAD;
        vals[24] = 1e18 * WAD;
        
        return vals;
    }
    
    // ============================================================================
    // SAMPLE RUNNER
    // ============================================================================
    
    function _runSample(string memory func, int256 a_wad, int256 b_wad) internal {
        // Get oracle values
        (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp) = _oracleMulti(func, a_wad, b_wad);
        
        // Run FP128
        (uint256 fp128_gas, uint256 fp128_digits, int256 fp128_error_bits) = _runFp128(func, a_wad, b_wad, fp128_exp);
        
        // Run ABDK
        (uint256 abdk_gas, uint256 abdk_digits, int256 abdk_error_bits) = _runAbdk(func, a_wad, b_wad, abdk_exp);
        
        // Run Solady
        (uint256 solady_gas, uint256 solady_digits, int256 solady_error_bits) = _runSolady(func, a_wad, b_wad, wad_exp);
        
        // Emit SWEEP lines
        _emitSweep("fp128", func, a_wad, b_wad, fp128_gas, fp128_digits, fp128_error_bits);
        _emitSweep("abdk", func, a_wad, b_wad, abdk_gas, abdk_digits, abdk_error_bits);
        _emitSweep("solady", func, a_wad, b_wad, solady_gas, solady_digits, solady_error_bits);
    }
    
    function _emitSweep(
        string memory lib,
        string memory func,
        int256 a_wad,
        int256 b_wad,
        uint256 gas_,
        uint256 digits,
        int256 error_bits
    ) internal view {
        // SWEEP|<lib>|<func>|<input_a_wad>|<input_b_wad>|<gas>|<digits>|<error_bits>
        string memory b_str = b_wad == 0 ? "0" : vm.toString(b_wad);
        console.log(
            string.concat(
                "SWEEP|", lib, "|", func, "|",
                vm.toString(a_wad), "|", b_str, "|",
                vm.toString(gas_), "|",
                vm.toString(digits), "|",
                vm.toString(error_bits)
            )
        );
    }
    
    // ============================================================================
    // LIBRARY RUNNERS
    // ============================================================================
    
    function _runFp128(string memory func, int256 a_wad, int256 b_wad, uint256 exp_fp128)
        internal view returns (uint256 gas_, uint256 digits_, int256 error_bits_)
    {
        uint256 a_fp128 = _wadToFp128(a_wad);
        uint256 b_fp128 = _wadToFp128(b_wad);
        
        uint256 g0 = gasleft();
        uint256 result_fp128;
        
        bytes32 funcHash = keccak256(bytes(func));
        if (funcHash == keccak256("mul")) {
            result_fp128 = fp128.mulRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("div")) {
            result_fp128 = fp128.divRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("add")) {
            result_fp128 = a_fp128 + b_fp128;
        } else if (funcHash == keccak256("sub")) {
            result_fp128 = a_fp128 - b_fp128;
        } else if (funcHash == keccak256("exp")) {
            result_fp128 = fp128.expRaw(a_fp128);
        } else if (funcHash == keccak256("exp2")) {
            result_fp128 = fp128.exp2Raw(a_fp128);
        } else if (funcHash == keccak256("ln")) {
            result_fp128 = fp128.lnRaw(a_fp128);
        } else if (funcHash == keccak256("log2")) {
            result_fp128 = fp128.log2Raw(a_fp128);
        } else if (funcHash == keccak256("sqrt")) {
            result_fp128 = fp128.sqrtRaw(a_fp128);
        }
        
        gas_ = g0 - gasleft();
        
        // Subtract overhead for external calls
        if (funcHash != keccak256("add") && funcHash != keccak256("sub")) {
            gas_ = gas_ > _fp128Overhead ? gas_ - _fp128Overhead : 0;
        }
        
        digits_ = _matchingDigits(result_fp128, exp_fp128, 38);
        error_bits_ = _errorBits(result_fp128, exp_fp128);
    }
    
    function _runAbdk(string memory func, int256 a_wad, int256 b_wad, uint256 exp_abdk)
        internal view returns (uint256 gas_, uint256 digits_, int256 error_bits_)
    {
        int128 a64 = _wadToAbdk(a_wad);
        int128 b64 = _wadToAbdk(b_wad);
        int128 exp64 = int128(int256(exp_abdk));
        
        uint256 g0 = gasleft();
        int128 result64;
        
        bytes32 funcHash = keccak256(bytes(func));
        if (funcHash == keccak256("mul")) {
            result64 = ABDKMath64x64.mul(a64, b64);
        } else if (funcHash == keccak256("div")) {
            result64 = ABDKMath64x64.div(a64, b64);
        } else if (funcHash == keccak256("add")) {
            result64 = ABDKMath64x64.add(a64, b64);
        } else if (funcHash == keccak256("sub")) {
            result64 = ABDKMath64x64.sub(a64, b64);
        } else if (funcHash == keccak256("exp")) {
            result64 = ABDKMath64x64.exp(a64);
        } else if (funcHash == keccak256("exp2")) {
            result64 = ABDKMath64x64.exp_2(a64);
        } else if (funcHash == keccak256("ln")) {
            result64 = ABDKMath64x64.ln(a64);
        } else if (funcHash == keccak256("log2")) {
            result64 = ABDKMath64x64.log_2(a64);
        } else if (funcHash == keccak256("sqrt")) {
            result64 = ABDKMath64x64.sqrt(a64);
        }
        
        gas_ = g0 - gasleft();
        
        digits_ = _matchingDigitsAbdk(result64, exp64, 19);
        error_bits_ = _errorBitsAbdk(result64, exp64);
    }
    
    function _runSolady(string memory func, int256 a_wad, int256 b_wad, uint256 exp_wad)
        internal view returns (uint256 gas_, uint256 digits_, int256 error_bits_)
    {
        uint256 ua = uint256(a_wad);
        uint256 ub = uint256(b_wad);
        
        uint256 g0 = gasleft();
        uint256 result;
        
        bytes32 funcHash = keccak256(bytes(func));
        if (funcHash == keccak256("mul")) {
            result = FixedPointMathLib.mulWad(ua, ub);
        } else if (funcHash == keccak256("div")) {
            result = FixedPointMathLib.divWad(ua, ub);
        } else if (funcHash == keccak256("add")) {
            result = ua + ub;
        } else if (funcHash == keccak256("sub")) {
            result = ua - ub;
        } else if (funcHash == keccak256("exp")) {
            result = uint256(FixedPointMathLib.expWad(a_wad));
        } else if (funcHash == keccak256("exp2")) {
            // Solady doesn't have exp2, return 0
            result = 0;
        } else if (funcHash == keccak256("ln")) {
            result = uint256(FixedPointMathLib.lnWad(a_wad));
        } else if (funcHash == keccak256("log2")) {
            // Solady doesn't have log2, return 0
            result = 0;
        } else if (funcHash == keccak256("sqrt")) {
            result = FixedPointMathLib.sqrtWad(ua);
        }
        
        gas_ = g0 - gasleft();
        
        digits_ = _matchingDigits(result, exp_wad, 18);
        error_bits_ = _errorBits(result, exp_wad);
    }
    
    // ============================================================================
    // ORACLE
    // ============================================================================
    
    function _oracleMulti(string memory func, int256 a_wad, int256 b_wad)
        internal returns (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp)
    {
        string[] memory cmd = new string[](b_wad == 0 ? 4 : 5);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = string.concat("multi_", func);
        cmd[3] = vm.toString(a_wad);
        if (b_wad != 0) {
            cmd[4] = vm.toString(b_wad);
        }
        bytes memory out = vm.ffi(cmd);
        (fp128_exp, wad_exp, abdk_exp) = abi.decode(out, (uint256, uint256, uint256));
    }
    
    // ============================================================================
    // PRECISION METRICS
    // ============================================================================
    
    function _matchingDigits(uint256 result, uint256 expected, uint256 maxDigits) internal pure returns (uint256) {
        if (result == expected) return maxDigits;
        if (expected == 0) return 0;
        
        uint256 diff = result > expected ? result - expected : expected - result;
        if (diff == 0) return maxDigits;
        
        uint256 ratio = expected / diff;
        if (ratio == 0) return 0;
        
        uint256 log2ratio = _log2(ratio);
        uint256 digits = (log2ratio * 100) / 332;
        return digits > maxDigits ? maxDigits : digits;
    }
    
    function _matchingDigitsAbdk(int128 result, int128 expected, uint256 maxDigits) internal pure returns (uint256) {
        if (result == expected) return maxDigits;
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
    
    function _errorBits(uint256 result, uint256 expected) internal pure returns (int256) {
        if (result == expected) return 256; // Exact match
        if (expected == 0) return 0;
        
        uint256 diff = result > expected ? result - expected : expected - result;
        if (diff == 0) return 256;
        
        uint256 ratio = expected / diff;
        if (ratio == 0) return 0;
        
        return int256(_log2(ratio));
    }
    
    function _errorBitsAbdk(int128 result, int128 expected) internal pure returns (int256) {
        if (result == expected) return 128;
        if (expected == 0) return 0;
        
        int128 diff = result > expected ? result - expected : expected - result;
        if (diff == 0) return 128;
        
        int128 abs_exp = expected < 0 ? -expected : expected;
        uint256 ratio = uint256(uint128(abs_exp)) / uint256(uint128(diff));
        if (ratio == 0) return 0;
        
        return int256(_log2(ratio));
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
    
    // ============================================================================
    // CONVERSIONS
    // ============================================================================
    
    function _wadToFp128(int256 wad) internal pure returns (uint256) {
        bool negative = wad < 0;
        uint256 abs_wad = uint256(negative ? -wad : wad);
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
}
