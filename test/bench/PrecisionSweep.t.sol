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
    
    function test_sweep_pow() public {
        console.log("SWEEP_START");
        _sweepPow();
        console.log("SWEEP_END");
    }
    
    // ============================================================================
    // SWEEP IMPLEMENTATIONS (50 samples each)
    // ============================================================================
    
    function _sweepMul() internal {
        // 50 representative (a,b) pairs
        int256[50] memory a;
        int256[50] memory b;
        
        // Small * small (10 pairs)
        a[0] = WAD / 1000; b[0] = WAD / 500;
        a[1] = WAD / 100; b[1] = WAD / 50;
        a[2] = WAD / 10; b[2] = WAD / 5;
        a[3] = WAD / 5; b[3] = WAD / 3;
        a[4] = WAD / 3; b[4] = WAD / 2;
        a[5] = WAD / 2; b[5] = WAD;
        a[6] = WAD; b[6] = WAD / 10;
        a[7] = 2 * WAD; b[7] = WAD / 2;
        a[8] = 5 * WAD; b[8] = WAD / 5;
        a[9] = 10 * WAD; b[9] = WAD / 10;
        
        // Typical * typical (20 pairs)
        a[10] = WAD; b[10] = WAD;
        a[11] = 2 * WAD; b[11] = 3 * WAD;
        a[12] = 5 * WAD; b[12] = 7 * WAD;
        a[13] = 10 * WAD; b[13] = 10 * WAD;
        a[14] = WAD / 2; b[14] = WAD / 3;
        a[15] = 3141592653589793238; b[15] = 2718281828459045235; // pi * e
        a[16] = 100 * WAD; b[16] = WAD / 100;
        a[17] = 1000 * WAD; b[17] = WAD / 1000;
        a[18] = 1e6; b[18] = 1e12;
        a[19] = 1e9; b[19] = 1e9;
        a[20] = 1e12; b[20] = 1e6;
        a[21] = 1e15; b[21] = 1e3;
        a[22] = 1e16; b[22] = 1e2;
        a[23] = 1e17; b[23] = 1e1;
        a[24] = 5e17; b[24] = 2e17;
        a[25] = 1e20; b[25] = 1e18;
        a[26] = 1e22; b[26] = 1e16;
        a[27] = 1e24; b[27] = 1e14;
        a[28] = 1e26; b[28] = 1e12;
        a[29] = 1e28; b[29] = 1e10;
        
        // Large * large (10 pairs)
        a[30] = 1e20; b[30] = 1e20;
        a[31] = 1e22; b[31] = 1e18;
        a[32] = 1e24; b[32] = 1e16;
        a[33] = 1e26; b[33] = 1e14;
        a[34] = 1e28; b[34] = 1e12;
        a[35] = 1e30; b[35] = 1e10;
        a[36] = 1e32; b[36] = 1e8;
        a[37] = 1e34; b[37] = 1e6;
        a[38] = 1e35; b[38] = 1e5;
        a[39] = 1e36; b[39] = 1e4;
        
        // Edge cases (10 pairs)
        a[40] = WAD; b[40] = 2 * WAD;
        a[41] = 2 * WAD; b[41] = 2 * WAD;
        a[42] = 3 * WAD; b[42] = 3 * WAD;
        a[43] = 4 * WAD; b[43] = 4 * WAD;
        a[44] = 5 * WAD; b[44] = 5 * WAD;
        a[45] = 10 * WAD; b[45] = 10 * WAD;
        a[46] = 100 * WAD; b[46] = 100 * WAD;
        a[47] = 1000 * WAD; b[47] = 1000 * WAD;
        a[48] = 1e6; b[48] = 1e6;
        a[49] = 1e9; b[49] = 1e9;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("mul", a[i], b[i]);
        }
    }
    
    function _sweepDiv() internal {
        // 50 representative (a,b) pairs for division
        int256[50] memory a;
        int256[50] memory b;
        
        // Small / small (10 pairs)
        a[0] = WAD; b[0] = WAD / 2;
        a[1] = WAD; b[1] = WAD / 3;
        a[2] = WAD; b[2] = WAD / 5;
        a[3] = WAD; b[3] = WAD / 10;
        a[4] = WAD / 2; b[4] = WAD / 3;
        a[5] = WAD / 3; b[5] = WAD / 4;
        a[6] = WAD / 5; b[6] = WAD / 10;
        a[7] = 2 * WAD; b[7] = WAD;
        a[8] = 5 * WAD; b[8] = 2 * WAD;
        a[9] = 10 * WAD; b[9] = 3 * WAD;
        
        // Typical values (20 pairs)
        a[10] = 3141592653589793238; b[10] = 2718281828459045235; // pi / e
        a[11] = 2718281828459045235; b[11] = 3141592653589793238; // e / pi
        a[12] = 100 * WAD; b[12] = 10 * WAD;
        a[13] = 1000 * WAD; b[13] = 100 * WAD;
        a[14] = 1e6; b[14] = 1e3;
        a[15] = 1e9; b[15] = 1e6;
        a[16] = 1e12; b[16] = 1e9;
        a[17] = 1e15; b[17] = 1e12;
        a[18] = 1e18; b[18] = 1e15;
        a[19] = 1e20; b[19] = 1e18;
        a[20] = 1e22; b[20] = 1e20;
        a[21] = 1e24; b[21] = 1e22;
        a[22] = 1e26; b[22] = 1e24;
        a[23] = 1e28; b[23] = 1e26;
        a[24] = 1e30; b[24] = 1e28;
        a[25] = 1e32; b[25] = 1e30;
        a[26] = 1e34; b[26] = 1e32;
        a[27] = 1e36; b[27] = 1e34;
        a[28] = 1e38; b[28] = 1e36;
        a[29] = WAD; b[29] = 1e3;
        
        // Large / small (10 pairs)
        a[30] = 1e30; b[30] = WAD;
        a[31] = 1e28; b[31] = 1e3;
        a[32] = 1e26; b[32] = 1e6;
        a[33] = 1e24; b[33] = 1e9;
        a[34] = 1e22; b[34] = 1e12;
        a[35] = 1e20; b[35] = 1e15;
        a[36] = 1e18; b[36] = 1e16;
        a[37] = 1e16; b[37] = 1e17;
        a[38] = 1e15; b[38] = 5e17;
        a[39] = 1e14; b[39] = 1e18;
        
        // Edge cases (10 pairs)
        a[40] = WAD; b[40] = WAD;
        a[41] = 2 * WAD; b[41] = WAD;
        a[42] = 3 * WAD; b[42] = WAD;
        a[43] = 10 * WAD; b[43] = WAD;
        a[44] = 100 * WAD; b[44] = WAD;
        a[45] = 1000 * WAD; b[45] = WAD;
        a[46] = WAD; b[46] = 2 * WAD;
        a[47] = WAD; b[47] = 3 * WAD;
        a[48] = WAD; b[48] = 10 * WAD;
        a[49] = WAD; b[49] = 100 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("div", a[i], b[i]);
        }
    }
    
    function _sweepAdd() internal {
        // 50 representative (a,b) pairs for addition
        int256[50] memory a;
        int256[50] memory b;
        
        // Similar magnitudes (25 pairs)
        a[0] = WAD; b[0] = WAD;
        a[1] = 2 * WAD; b[1] = 3 * WAD;
        a[2] = 5 * WAD; b[2] = 7 * WAD;
        a[3] = 10 * WAD; b[3] = 10 * WAD;
        a[4] = 100 * WAD; b[4] = 100 * WAD;
        a[5] = 1000 * WAD; b[5] = 1000 * WAD;
        a[6] = 1e6; b[6] = 1e6;
        a[7] = 1e9; b[7] = 1e9;
        a[8] = 1e12; b[8] = 1e12;
        a[9] = 1e15; b[9] = 1e15;
        a[10] = 1e18; b[10] = 1e18;
        a[11] = 1e20; b[11] = 1e20;
        a[12] = 1e22; b[12] = 1e22;
        a[13] = 1e24; b[13] = 1e24;
        a[14] = 1e26; b[14] = 1e26;
        a[15] = 1e28; b[15] = 1e28;
        a[16] = 1e30; b[16] = 1e30;
        a[17] = 1e32; b[17] = 1e32;
        a[18] = 1e34; b[18] = 1e34;
        a[19] = 1e36; b[19] = 1e36;
        a[20] = WAD / 2; b[20] = WAD / 3;
        a[21] = WAD / 5; b[21] = WAD / 7;
        a[22] = WAD / 10; b[22] = WAD / 100;
        a[23] = 1e6; b[23] = 1e3;
        a[24] = 1e12; b[24] = 1e9;
        
        // Different magnitudes (15 pairs)
        a[25] = 1e30; b[25] = WAD;
        a[26] = 1e28; b[26] = 1e3;
        a[27] = 1e26; b[27] = 1e6;
        a[28] = 1e24; b[28] = 1e9;
        a[29] = 1e22; b[29] = 1e12;
        a[30] = 1e20; b[30] = 1e15;
        a[31] = 1e18; b[31] = 1e16;
        a[32] = 1e16; b[32] = 1e17;
        a[33] = 1e15; b[33] = 5e17;
        a[34] = 1e14; b[34] = 1e18;
        a[35] = WAD; b[35] = 1e30;
        a[36] = 1e3; b[36] = 1e28;
        a[37] = 1e6; b[37] = 1e26;
        a[38] = 1e9; b[38] = 1e24;
        a[39] = 1e12; b[39] = 1e22;
        
        // Edge cases (10 pairs)
        a[40] = 3141592653589793238; b[40] = 2718281828459045235;
        a[41] = WAD; b[41] = 1e3;
        a[42] = 1e3; b[42] = WAD;
        a[43] = 1e38; b[43] = 1e38;
        a[44] = 1e36; b[44] = 1e36;
        a[45] = 1e34; b[45] = 1e34;
        a[46] = 1e32; b[46] = 1e32;
        a[47] = 1e30; b[47] = 1e30;
        a[48] = 1e28; b[48] = 1e28;
        a[49] = 1e26; b[49] = 1e26;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("add", a[i], b[i]);
        }
    }
    
    function _sweepSub() internal {
        // 50 representative (a,b) pairs for subtraction (a >= b)
        int256[50] memory a;
        int256[50] memory b;
        
        // Close values (cancellation cases - 20 pairs)
        a[0] = WAD; b[0] = WAD - WAD / 10;
        a[1] = WAD; b[1] = WAD - WAD / 100;
        a[2] = WAD; b[2] = WAD - WAD / 1000;
        a[3] = 2 * WAD; b[3] = 2 * WAD - WAD / 10;
        a[4] = 10 * WAD; b[4] = 10 * WAD - WAD;
        a[5] = 100 * WAD; b[5] = 100 * WAD - WAD;
        a[6] = 1000 * WAD; b[6] = 1000 * WAD - 10 * WAD;
        a[7] = 1e6; b[7] = 1e6 - 1e3;
        a[8] = 1e9; b[8] = 1e9 - 1e6;
        a[9] = 1e12; b[9] = 1e12 - 1e9;
        a[10] = 1e15; b[10] = 1e15 - 1e12;
        a[11] = 1e18; b[11] = 1e18 - 1e15;
        a[12] = 1e20; b[12] = 1e20 - 1e18;
        a[13] = 1e22; b[13] = 1e22 - 1e20;
        a[14] = 1e24; b[14] = 1e24 - 1e22;
        a[15] = 1e26; b[15] = 1e26 - 1e24;
        a[16] = 1e28; b[16] = 1e28 - 1e26;
        a[17] = 1e30; b[17] = 1e30 - 1e28;
        a[18] = 1e32; b[18] = 1e32 - 1e30;
        a[19] = 1e34; b[19] = 1e34 - 1e32;
        
        // Moderate differences (20 pairs)
        a[20] = 10 * WAD; b[20] = WAD;
        a[21] = 20 * WAD; b[21] = 2 * WAD;
        a[22] = 30 * WAD; b[22] = 3 * WAD;
        a[23] = 50 * WAD; b[23] = 5 * WAD;
        a[24] = 100 * WAD; b[24] = 10 * WAD;
        a[25] = 1000 * WAD; b[25] = 100 * WAD;
        a[26] = 1e6; b[26] = 1e5;
        a[27] = 1e9; b[27] = 1e8;
        a[28] = 1e12; b[28] = 1e11;
        a[29] = 1e15; b[29] = 1e14;
        a[30] = 1e18; b[30] = 1e17;
        a[31] = 1e20; b[31] = 1e19;
        a[32] = 1e22; b[32] = 1e21;
        a[33] = 1e24; b[33] = 1e23;
        a[34] = 1e26; b[34] = 1e25;
        a[35] = 1e28; b[35] = 1e27;
        a[36] = 1e30; b[36] = 1e29;
        a[37] = 1e32; b[37] = 1e31;
        a[38] = 1e34; b[38] = 1e33;
        a[39] = 1e36; b[39] = 1e35;
        
        // Large differences (10 pairs)
        a[40] = 1e30; b[40] = WAD;
        a[41] = 1e28; b[41] = 1e6;
        a[42] = 1e26; b[42] = 1e9;
        a[43] = 1e24; b[43] = 1e12;
        a[44] = 1e22; b[44] = 1e15;
        a[45] = 1e20; b[45] = 1e16;
        a[46] = 1e18; b[46] = 1e17;
        a[47] = 1e16; b[47] = 5e17;
        a[48] = 1e15; b[48] = 1e18;
        a[49] = 1e14; b[49] = 1e18;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("sub", a[i], b[i]);
        }
    }
    
    function _sweepExp() internal {
        // 50 samples covering exp range [-87, 87]
        int256[50] memory vals;
        
        // Negative range: -87 to -1 (25 samples)
        for (uint256 i = 0; i < 25; i++) {
            vals[i] = -87 * WAD + int256(i) * 86 * WAD / 24;
        }
        
        // Positive range: 0 to 87 (25 samples)
        for (uint256 i = 0; i < 25; i++) {
            vals[25 + i] = int256(i) * 87 * WAD / 24;
        }
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("exp", vals[i], 0);
        }
    }

    function _sweepExp2() internal {
        // 50 samples covering exp2 range [-60, 60] (ABDK limit)
        int256[50] memory vals;
        
        // Negative range: -60 to -1 (25 samples)
        for (uint256 i = 0; i < 25; i++) {
            vals[i] = -60 * WAD + int256(i) * 59 * WAD / 24;
        }
        
        // Positive range: 0 to 60 (25 samples)
        for (uint256 i = 0; i < 25; i++) {
            vals[25 + i] = int256(i) * 60 * WAD / 24;
        }
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("exp2", vals[i], 0);
        }
    }

    function _sweepLn() internal {
        // 50 log-spaced samples in [1e-15, 1e20]
        int256[50] memory vals;
        
        // Log-spaced from 1e-15 to 1e20 (50 points)
        for (uint256 i = 0; i < 50; i++) {
            // log10(x) ranges from -15 to 20, so 35 decades / 49 steps
            int256 log10_val = -15 + int256(i) * 35 / 49;
            // x = 10^log10_val in WAD
            vals[i] = _pow10(log10_val);
        }
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("ln", vals[i], 0);
        }
    }
    
    function _sweepLog2() internal {
        // 50 log-spaced samples in [1e-15, 1e20]
        int256[50] memory vals;
        
        for (uint256 i = 0; i < 50; i++) {
            int256 log10_val = -15 + int256(i) * 35 / 49;
            vals[i] = _pow10(log10_val);
        }
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("log2", vals[i], 0);
        }
    }
    
    function _sweepSqrt() internal {
        // 50 log-spaced samples in [1e-15, 1e20]
        int256[50] memory vals;
        
        for (uint256 i = 0; i < 50; i++) {
            int256 log10_val = -15 + int256(i) * 35 / 49;
            vals[i] = _pow10(log10_val);
        }
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("sqrt", vals[i], 0);
        }
    }
    
    function _sweepPow() internal {
        // 50 representative (base, exponent) pairs
        int256[50] memory bases;
        int256[50] memory exps;
        
        // Small bases with varied exponents (10 pairs)
        bases[0] = WAD / 10; exps[0] = 2 * WAD;
        bases[1] = WAD / 5; exps[1] = 3 * WAD;
        bases[2] = WAD / 3; exps[2] = WAD / 2;
        bases[3] = WAD / 2; exps[3] = 2 * WAD;
        bases[4] = WAD / 2; exps[4] = WAD / 3;
        bases[5] = WAD / 2; exps[5] = -WAD;
        bases[6] = WAD / 3; exps[6] = 3 * WAD;
        bases[7] = WAD / 4; exps[7] = 4 * WAD;
        bases[8] = WAD / 5; exps[8] = 5 * WAD;
        bases[9] = WAD / 10; exps[9] = 10 * WAD;
        
        // Typical bases (2, e, 10) with varied exponents (20 pairs)
        bases[10] = 2 * WAD; exps[10] = -3 * WAD;
        bases[11] = 2 * WAD; exps[11] = -2 * WAD;
        bases[12] = 2 * WAD; exps[12] = -WAD;
        bases[13] = 2 * WAD; exps[13] = 0;
        bases[14] = 2 * WAD; exps[14] = WAD / 2;
        bases[15] = 2 * WAD; exps[15] = WAD;
        bases[16] = 2 * WAD; exps[16] = 2 * WAD;
        bases[17] = 2 * WAD; exps[17] = 3 * WAD;
        bases[18] = 2 * WAD; exps[18] = 5 * WAD;
        bases[19] = 2 * WAD; exps[19] = 10 * WAD;
        bases[20] = 2718281828459045235; exps[20] = -2 * WAD;
        bases[21] = 2718281828459045235; exps[21] = -WAD;
        bases[22] = 2718281828459045235; exps[22] = 0;
        bases[23] = 2718281828459045235; exps[23] = WAD;
        bases[24] = 2718281828459045235; exps[24] = 2 * WAD;
        bases[25] = 10 * WAD; exps[25] = -2 * WAD;
        bases[26] = 10 * WAD; exps[26] = -WAD;
        bases[27] = 10 * WAD; exps[27] = 0;
        bases[28] = 10 * WAD; exps[28] = WAD / 2;
        bases[29] = 10 * WAD; exps[29] = WAD;
        
        // Large bases with varied exponents (10 pairs)
        bases[30] = 100 * WAD; exps[30] = WAD / 2;
        bases[31] = 100 * WAD; exps[31] = WAD;
        bases[32] = 100 * WAD; exps[32] = 2 * WAD;
        bases[33] = 1000 * WAD; exps[33] = WAD / 3;
        bases[34] = 1000 * WAD; exps[34] = WAD / 2;
        bases[35] = 1000 * WAD; exps[35] = WAD;
        bases[36] = 1e6; exps[36] = WAD / 2;
        bases[37] = 1e9; exps[37] = WAD / 3;
        bases[38] = 1e12; exps[38] = WAD / 4;
        bases[39] = 1e15; exps[39] = WAD / 5;
        
        // Fractional exponents (10 pairs)
        bases[40] = 4 * WAD; exps[40] = WAD / 2;  // sqrt(4) = 2
        bases[41] = 8 * WAD; exps[41] = WAD / 3;  // cbrt(8) = 2
        bases[42] = 16 * WAD; exps[42] = WAD / 4;
        bases[43] = 27 * WAD; exps[43] = WAD / 3;
        bases[44] = 64 * WAD; exps[44] = WAD / 6;
        bases[45] = 125 * WAD; exps[45] = WAD / 3;
        bases[46] = 3 * WAD; exps[46] = 3 * WAD / 2;
        bases[47] = 5 * WAD; exps[47] = 5 * WAD / 2;
        bases[48] = 7 * WAD; exps[48] = 7 * WAD / 3;
        bases[49] = 11 * WAD; exps[49] = 11 * WAD / 5;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("pow", bases[i], exps[i]);
        }
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
        } else if (funcHash == keccak256("pow")) {
            result_fp128 = fp128.powRaw(a_fp128, b_fp128);
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
        } else if (funcHash == keccak256("pow")) {
            // ABDK pow only supports integer exponents (uint256)
            // For fractional exponents, skip (return 0)
            if (b_wad >= 0 && b_wad % WAD == 0) {
                uint256 exp_uint = uint256(b_wad / WAD);
                result64 = ABDKMath64x64.pow(a64, exp_uint);
            } else {
                // Fractional or negative exponent - ABDK doesn't support
                gas_ = 0;
                digits_ = 0;
                error_bits_ = 0;
                return (gas_, digits_, error_bits_);
            }
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
        } else if (funcHash == keccak256("pow")) {
            result = uint256(FixedPointMathLib.powWad(a_wad, b_wad));
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
    
    function _pow10(int256 exponent) internal pure returns (int256) {
        // Compute 10^exponent in WAD
        // For exponent in range [-15, 20]
        if (exponent >= 0) {
            return int256(10 ** uint256(exponent)) * WAD;
        } else {
            // Negative exponent: 10^(-n) = WAD / 10^n
            uint256 abs_exp = uint256(-exponent);
            if (abs_exp > 18) {
                // For very small values, use WAD / (10^abs_exp / 1e18)
                return WAD / int256(10 ** (abs_exp - 18));
            }
            return WAD / int256(10 ** abs_exp);
        }
    }
}
