// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {ABDKMath64x64} from "../../lib/abdk-libraries-solidity/ABDKMath64x64.sol";
import {FixedPointMathLib} from "../../lib/solady/src/utils/FixedPointMathLib.sol";
import {SD59x18} from "../../lib/prb-math/src/sd59x18/ValueType.sol";
import {wrap as prbWrap} from "../../lib/prb-math/src/sd59x18/Casting.sol";
import {abs as prbAbs, avg as prbAvg, ceil as prbCeil, div as prbDiv, exp as prbExp, exp2 as prbExp2, floor as prbFloor, frac as prbFrac, gm as prbGm, inv as prbInv, ln as prbLn, log10 as prbLog10, log2 as prbLog2, mul as prbMul, pow as prbPow, sqrt as prbSqrt} from "../../lib/prb-math/src/sd59x18/Math.sol";
import {add as prbAdd, sub as prbSub} from "../../lib/prb-math/src/sd59x18/Helpers.sol";

interface IFP128 {
    function mulRaw(uint256, uint256) external view returns (uint256);
    function divRaw(uint256, uint256) external view returns (uint256);
    function expRaw(uint256) external view returns (uint256);
    function exp2Raw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function log2Raw(uint256) external view returns (uint256);
    function sqrtRaw(uint256) external view returns (uint256);
    function powRaw(uint256, uint256) external view returns (uint256);
    function abs(uint256) external view returns (uint256);
    function neg(uint256) external view returns (uint256);
    function inv(uint256) external view returns (uint256);
    function min(uint256, uint256) external view returns (uint256);
    function max(uint256, uint256) external view returns (uint256);
    function avg(uint256, uint256) external view returns (uint256);
    function dist(uint256, uint256) external view returns (uint256);
    function gavg(uint256, uint256) external view returns (uint256);
    function log10(uint256) external view returns (uint256);
    function exp10(uint256) external view returns (uint256);
    function absRaw(uint256) external view returns (uint256);
    function negRaw(uint256) external view returns (uint256);
    function invRaw(uint256) external view returns (uint256);
    function minRaw(uint256, uint256) external view returns (uint256);
    function maxRaw(uint256, uint256) external view returns (uint256);
    function avgRaw(uint256, uint256) external view returns (uint256);
    function distRaw(uint256, uint256) external view returns (uint256);
    function gavgRaw(uint256, uint256) external view returns (uint256);
    function log10Raw(uint256) external view returns (uint256);
    function exp10Raw(uint256) external view returns (uint256);
    function signRaw(uint256) external view returns (uint256);
    function floorRaw(uint256) external view returns (uint256);
    function ceilRaw(uint256) external view returns (uint256);
    function fracRaw(uint256) external view returns (uint256);
    function cbrtRaw(uint256) external view returns (uint256);
    function lerpRaw(uint256,uint256,uint256) external view returns (uint256);
    function hypotRaw(uint256,uint256) external view returns (uint256);
    function roundRaw(uint256) external view returns (uint256);
    function log2UpRaw(uint256) external view returns (uint256);
    function gcdRaw(uint256,uint256) external view returns (uint256);
    function factorialRaw(uint256) external view returns (uint256);
    function lambertW0Raw(uint256) external view returns (uint256);
}

/// @title PrecisionSweep
/// @notice Comprehensive precision distribution test across hundreds of inputs per function
/// @dev Emits SWEEP lines for post-processing by scripts/generators/precision_sweep.py
contract PrecisionSweep is Test {
    using FixedPointMathLib for uint256;
    
    IFP128 fp128;
    
    int256 constant WAD = 1e18;
    uint256 constant ONE_FP128 = uint256(1) << 128;
    
    function setUp() public {
        // Deploy fp128
        string memory hex1 = vm.readFile("contracts/build/huff/test_fp128.runtime.bin");
        bytes memory code1 = vm.parseBytes(string.concat("0x", hex1));
        address a1 = makeAddr("fp128");
        vm.etch(a1, code1);
        fp128 = IFP128(a1);
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
    
    function test_sweep_abs() public {
        console.log("SWEEP_START");
        _sweepAbs();
        console.log("SWEEP_END");
    }
    
    function test_sweep_inv() public {
        console.log("SWEEP_START");
        _sweepInv();
        console.log("SWEEP_END");
    }
    
    function test_sweep_min() public {
        console.log("SWEEP_START");
        _sweepMin();
        console.log("SWEEP_END");
    }
    
    function test_sweep_max() public {
        console.log("SWEEP_START");
        _sweepMax();
        console.log("SWEEP_END");
    }
    
    function test_sweep_avg() public {
        console.log("SWEEP_START");
        _sweepAvg();
        console.log("SWEEP_END");
    }
    
    function test_sweep_dist() public {
        console.log("SWEEP_START");
        _sweepDist();
        console.log("SWEEP_END");
    }
    
    function test_sweep_gavg() public {
        console.log("SWEEP_START");
        _sweepGavg();
        console.log("SWEEP_END");
    }
    
    function test_sweep_log10() public {
        console.log("SWEEP_START");
        _sweepLog10();
        console.log("SWEEP_END");
    }
    
    function test_sweep_exp10() public {
        console.log("SWEEP_START");
        _sweepExp10();
        console.log("SWEEP_END");
    }
    
    function test_sweep_sign() public {
        console.log("SWEEP_START");
        _sweepSign();
        console.log("SWEEP_END");
    }
    
    function test_sweep_floor() public {
        console.log("SWEEP_START");
        _sweepFloor();
        console.log("SWEEP_END");
    }
    
    function test_sweep_ceil() public {
        console.log("SWEEP_START");
        _sweepCeil();
        console.log("SWEEP_END");
    }
    
    function test_sweep_frac() public {
        console.log("SWEEP_START");
        _sweepFrac();
        console.log("SWEEP_END");
    }
    
    function test_sweep_cbrt() public {
        console.log("SWEEP_START");
        _sweepCbrt();
        console.log("SWEEP_END");
    }
    
    function test_sweep_lerp() public {
        console.log("SWEEP_START");
        _sweepLerp();
        console.log("SWEEP_END");
    }
    
    function test_sweep_hypot() public {
        console.log("SWEEP_START");
        _sweepHypot();
        console.log("SWEEP_END");
    }
    
    function test_sweep_round() public {
        console.log("SWEEP_START");
        _sweepRound();
        console.log("SWEEP_END");
    }
    
    function test_sweep_log2up() public {
        console.log("SWEEP_START");
        _sweepLog2Up();
        console.log("SWEEP_END");
    }
    
    function test_sweep_gcd() public {
        console.log("SWEEP_START");
        _sweepGcd();
        console.log("SWEEP_END");
    }
    
    function test_sweep_factorial() public {
        console.log("SWEEP_START");
        _sweepFactorial();
        console.log("SWEEP_END");
    }
    
    function test_sweep_lambertw0() public {
        console.log("SWEEP_START");
        _sweepLambertW0();
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
        a[47] = 5e17; b[47] = 1e16;
        a[48] = 1e18; b[48] = 1e15;
        a[49] = 1e18; b[49] = 1e14;
        
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
    
    function _sweepAbs() internal {
        int256[50] memory vals;
        
        // Positive values (25)
        vals[0] = WAD / 1000;
        vals[1] = WAD / 100;
        vals[2] = WAD / 10;
        vals[3] = WAD / 2;
        vals[4] = WAD;
        vals[5] = 2 * WAD;
        vals[6] = 5 * WAD;
        vals[7] = 10 * WAD;
        vals[8] = 100 * WAD;
        vals[9] = 1000 * WAD;
        vals[10] = 1e20;
        vals[11] = 1e22;
        vals[12] = 1e24;
        vals[13] = 1e26;
        vals[14] = 1e28;
        vals[15] = 1e30;
        vals[16] = 1e32;
        vals[17] = 1e34;
        vals[18] = 1e35;
        vals[19] = 1e36;
        vals[20] = 3141592653589793238;
        vals[21] = 2718281828459045235;
        vals[22] = 1618033988749894848;
        vals[23] = 2236067977499789696;
        vals[24] = 1414213562373095048;
        
        // Negative values (25)
        vals[25] = -WAD / 1000;
        vals[26] = -WAD / 100;
        vals[27] = -WAD / 10;
        vals[28] = -WAD / 2;
        vals[29] = -WAD;
        vals[30] = -2 * WAD;
        vals[31] = -5 * WAD;
        vals[32] = -10 * WAD;
        vals[33] = -100 * WAD;
        vals[34] = -1000 * WAD;
        vals[35] = -1e20;
        vals[36] = -1e22;
        vals[37] = -1e24;
        vals[38] = -1e26;
        vals[39] = -1e28;
        vals[40] = -1e30;
        vals[41] = -1e32;
        vals[42] = -1e34;
        vals[43] = -1e35;
        vals[44] = -1e36;
        vals[45] = -3141592653589793238;
        vals[46] = -2718281828459045235;
        vals[47] = -1618033988749894848;
        vals[48] = -2236067977499789696;
        vals[49] = -1414213562373095048;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("abs", vals[i], 0);
        }
    }
    
    function _sweepInv() internal {
        int256[50] memory vals;
        
        // Small values (10)
        vals[0] = WAD / 1000;
        vals[1] = WAD / 100;
        vals[2] = WAD / 10;
        vals[3] = WAD / 5;
        vals[4] = WAD / 3;
        vals[5] = WAD / 2;
        vals[6] = 2 * WAD / 3;
        vals[7] = 3 * WAD / 4;
        vals[8] = 9 * WAD / 10;
        vals[9] = 99 * WAD / 100;
        
        // Around 1 (10)
        vals[10] = WAD;
        vals[11] = 11 * WAD / 10;
        vals[12] = 12 * WAD / 10;
        vals[13] = 13 * WAD / 10;
        vals[14] = 15 * WAD / 10;
        vals[15] = 2 * WAD;
        vals[16] = 3 * WAD;
        vals[17] = 4 * WAD;
        vals[18] = 5 * WAD;
        vals[19] = 10 * WAD;
        
        // Large values (20)
        vals[20] = 100 * WAD;
        vals[21] = 1000 * WAD;
        vals[22] = 1e20;
        vals[23] = 1e21;
        vals[24] = 1e22;
        vals[25] = 1e23;
        vals[26] = 1e24;
        vals[27] = 1e25;
        vals[28] = 1e26;
        vals[29] = 1e27;
        vals[30] = 1e28;
        vals[31] = 1e29;
        vals[32] = 1e30;
        vals[33] = 1e31;
        vals[34] = 1e32;
        vals[35] = 1e33;
        vals[36] = 1e34;
        vals[37] = 1e35;
        vals[38] = 1e36;
        vals[39] = 1e37;
        
        // Special values (10)
        vals[40] = 3141592653589793238;
        vals[41] = 2718281828459045235;
        vals[42] = 1618033988749894848;
        vals[43] = 2236067977499789696;
        vals[44] = 1414213562373095048;
        vals[45] = 7071067811865475244;
        vals[46] = 5772156649015328606;
        vals[47] = 6931471805599453094;
        vals[48] = 4342944819032518276;
        vals[49] = 3010299956639811952;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("inv", vals[i], 0);
        }
    }
    
    function _sweepMin() internal {
        int256[50] memory a;
        int256[50] memory b;
        
        // Both positive (15)
        a[0] = WAD; b[0] = 2 * WAD;
        a[1] = 2 * WAD; b[1] = WAD;
        a[2] = 5 * WAD; b[2] = 10 * WAD;
        a[3] = 10 * WAD; b[3] = 5 * WAD;
        a[4] = 100 * WAD; b[4] = 1000 * WAD;
        a[5] = 1e20; b[5] = 1e22;
        a[6] = 1e24; b[6] = 1e26;
        a[7] = 1e28; b[7] = 1e30;
        a[8] = 3141592653589793238; b[8] = 2718281828459045235;
        a[9] = WAD / 2; b[9] = WAD / 3;
        a[10] = WAD / 10; b[10] = WAD / 100;
        a[11] = 1e6; b[11] = 1e9;
        a[12] = 1e12; b[12] = 1e15;
        a[13] = 1e18; b[13] = 1e21;
        a[14] = 1e24; b[14] = 1e27;
        
        // Both negative (15)
        a[15] = -WAD; b[15] = -2 * WAD;
        a[16] = -2 * WAD; b[16] = -WAD;
        a[17] = -5 * WAD; b[17] = -10 * WAD;
        a[18] = -10 * WAD; b[18] = -5 * WAD;
        a[19] = -100 * WAD; b[19] = -1000 * WAD;
        a[20] = -1e20; b[20] = -1e22;
        a[21] = -1e24; b[21] = -1e26;
        a[22] = -1e28; b[22] = -1e30;
        a[23] = -3141592653589793238; b[23] = -2718281828459045235;
        a[24] = -WAD / 2; b[24] = -WAD / 3;
        a[25] = -WAD / 10; b[25] = -WAD / 100;
        a[26] = -1e6; b[26] = -1e9;
        a[27] = -1e12; b[27] = -1e15;
        a[28] = -1e18; b[28] = -1e21;
        a[29] = -1e24; b[29] = -1e27;
        
        // Mixed signs (20)
        a[30] = WAD; b[30] = -WAD;
        a[31] = -WAD; b[31] = WAD;
        a[32] = 5 * WAD; b[32] = -2 * WAD;
        a[33] = -5 * WAD; b[33] = 2 * WAD;
        a[34] = 100 * WAD; b[34] = -100 * WAD;
        a[35] = -100 * WAD; b[35] = 100 * WAD;
        a[36] = 1e20; b[36] = -1e20;
        a[37] = -1e20; b[37] = 1e20;
        a[38] = 1e24; b[38] = -1e22;
        a[39] = -1e24; b[39] = 1e22;
        a[40] = WAD / 2; b[40] = -WAD / 3;
        a[41] = -WAD / 2; b[41] = WAD / 3;
        a[42] = 1e6; b[42] = -1e9;
        a[43] = -1e6; b[43] = 1e9;
        a[44] = 1e12; b[44] = -1e15;
        a[45] = -1e12; b[45] = 1e15;
        a[46] = 1e18; b[46] = -1e21;
        a[47] = -1e18; b[47] = 1e21;
        a[48] = 1e24; b[48] = -1e27;
        a[49] = -1e24; b[49] = 1e27;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("min", a[i], b[i]);
        }
    }
    
    function _sweepMax() internal {
        // Use same test cases as min
        int256[50] memory a;
        int256[50] memory b;
        
        // Both positive (15)
        a[0] = WAD; b[0] = 2 * WAD;
        a[1] = 2 * WAD; b[1] = WAD;
        a[2] = 5 * WAD; b[2] = 10 * WAD;
        a[3] = 10 * WAD; b[3] = 5 * WAD;
        a[4] = 100 * WAD; b[4] = 1000 * WAD;
        a[5] = 1e20; b[5] = 1e22;
        a[6] = 1e24; b[6] = 1e26;
        a[7] = 1e28; b[7] = 1e30;
        a[8] = 3141592653589793238; b[8] = 2718281828459045235;
        a[9] = WAD / 2; b[9] = WAD / 3;
        a[10] = WAD / 10; b[10] = WAD / 100;
        a[11] = 1e6; b[11] = 1e9;
        a[12] = 1e12; b[12] = 1e15;
        a[13] = 1e18; b[13] = 1e21;
        a[14] = 1e24; b[14] = 1e27;
        
        // Both negative (15)
        a[15] = -WAD; b[15] = -2 * WAD;
        a[16] = -2 * WAD; b[16] = -WAD;
        a[17] = -5 * WAD; b[17] = -10 * WAD;
        a[18] = -10 * WAD; b[18] = -5 * WAD;
        a[19] = -100 * WAD; b[19] = -1000 * WAD;
        a[20] = -1e20; b[20] = -1e22;
        a[21] = -1e24; b[21] = -1e26;
        a[22] = -1e28; b[22] = -1e30;
        a[23] = -3141592653589793238; b[23] = -2718281828459045235;
        a[24] = -WAD / 2; b[24] = -WAD / 3;
        a[25] = -WAD / 10; b[25] = -WAD / 100;
        a[26] = -1e6; b[26] = -1e9;
        a[27] = -1e12; b[27] = -1e15;
        a[28] = -1e18; b[28] = -1e21;
        a[29] = -1e24; b[29] = -1e27;
        
        // Mixed signs (20)
        a[30] = WAD; b[30] = -WAD;
        a[31] = -WAD; b[31] = WAD;
        a[32] = 5 * WAD; b[32] = -2 * WAD;
        a[33] = -5 * WAD; b[33] = 2 * WAD;
        a[34] = 100 * WAD; b[34] = -100 * WAD;
        a[35] = -100 * WAD; b[35] = 100 * WAD;
        a[36] = 1e20; b[36] = -1e20;
        a[37] = -1e20; b[37] = 1e20;
        a[38] = 1e24; b[38] = -1e22;
        a[39] = -1e24; b[39] = 1e22;
        a[40] = WAD / 2; b[40] = -WAD / 3;
        a[41] = -WAD / 2; b[41] = WAD / 3;
        a[42] = 1e6; b[42] = -1e9;
        a[43] = -1e6; b[43] = 1e9;
        a[44] = 1e12; b[44] = -1e15;
        a[45] = -1e12; b[45] = 1e15;
        a[46] = 1e18; b[46] = -1e21;
        a[47] = -1e18; b[47] = 1e21;
        a[48] = 1e24; b[48] = -1e27;
        a[49] = -1e24; b[49] = 1e27;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("max", a[i], b[i]);
        }
    }
    
    function _sweepAvg() internal {
        // Use same test cases as min/max
        int256[50] memory a;
        int256[50] memory b;
        
        // Both positive (20)
        a[0] = WAD; b[0] = 2 * WAD;
        a[1] = 2 * WAD; b[1] = WAD;
        a[2] = 5 * WAD; b[2] = 10 * WAD;
        a[3] = 10 * WAD; b[3] = 5 * WAD;
        a[4] = 100 * WAD; b[4] = 1000 * WAD;
        a[5] = 1e20; b[5] = 1e22;
        a[6] = 1e24; b[6] = 1e26;
        a[7] = 1e28; b[7] = 1e30;
        a[8] = 3141592653589793238; b[8] = 2718281828459045235;
        a[9] = WAD / 2; b[9] = WAD / 3;
        a[10] = WAD / 10; b[10] = WAD / 100;
        a[11] = 1e6; b[11] = 1e9;
        a[12] = 1e12; b[12] = 1e15;
        a[13] = 1e18; b[13] = 1e21;
        a[14] = 1e24; b[14] = 1e27;
        a[15] = 1e30; b[15] = 1e32;
        a[16] = 1e34; b[16] = 1e36;
        a[17] = 1e37; b[17] = 1e37;
        a[18] = 1e36; b[18] = 1e35;
        a[19] = 1e35; b[19] = 1e34;
        
        // Both negative (15)
        a[20] = -WAD; b[20] = -2 * WAD;
        a[21] = -2 * WAD; b[21] = -WAD;
        a[22] = -5 * WAD; b[22] = -10 * WAD;
        a[23] = -10 * WAD; b[23] = -5 * WAD;
        a[24] = -100 * WAD; b[24] = -1000 * WAD;
        a[25] = -1e20; b[25] = -1e22;
        a[26] = -1e24; b[26] = -1e26;
        a[27] = -1e28; b[27] = -1e30;
        a[28] = -3141592653589793238; b[28] = -2718281828459045235;
        a[29] = -WAD / 2; b[29] = -WAD / 3;
        a[30] = -WAD / 10; b[30] = -WAD / 100;
        a[31] = -1e6; b[31] = -1e9;
        a[32] = -1e12; b[32] = -1e15;
        a[33] = -1e18; b[33] = -1e21;
        a[34] = -1e24; b[34] = -1e27;
        
        // Mixed signs (15)
        a[35] = WAD; b[35] = -WAD;
        a[36] = -WAD; b[36] = WAD;
        a[37] = 5 * WAD; b[37] = -2 * WAD;
        a[38] = -5 * WAD; b[38] = 2 * WAD;
        a[39] = 100 * WAD; b[39] = -100 * WAD;
        a[40] = -100 * WAD; b[40] = 100 * WAD;
        a[41] = 1e20; b[41] = -1e20;
        a[42] = -1e20; b[42] = 1e20;
        a[43] = 1e24; b[43] = -1e22;
        a[44] = -1e24; b[44] = 1e22;
        a[45] = WAD / 2; b[45] = -WAD / 3;
        a[46] = -WAD / 2; b[46] = WAD / 3;
        a[47] = 1e6; b[47] = -1e9;
        a[48] = -1e6; b[48] = 1e9;
        a[49] = 0; b[49] = 0;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("avg", a[i], b[i]);
        }
    }
    
    function _sweepDist() internal {
        // Use same test cases as min/max
        int256[50] memory a;
        int256[50] memory b;
        
        // Both positive (15)
        a[0] = WAD; b[0] = 2 * WAD;
        a[1] = 2 * WAD; b[1] = WAD;
        a[2] = 5 * WAD; b[2] = 10 * WAD;
        a[3] = 10 * WAD; b[3] = 5 * WAD;
        a[4] = 100 * WAD; b[4] = 1000 * WAD;
        a[5] = 1e20; b[5] = 1e22;
        a[6] = 1e24; b[6] = 1e26;
        a[7] = 1e28; b[7] = 1e30;
        a[8] = 3141592653589793238; b[8] = 2718281828459045235;
        a[9] = WAD / 2; b[9] = WAD / 3;
        a[10] = WAD / 10; b[10] = WAD / 100;
        a[11] = 1e6; b[11] = 1e9;
        a[12] = 1e12; b[12] = 1e15;
        a[13] = 1e18; b[13] = 1e21;
        a[14] = 1e24; b[14] = 1e27;
        
        // Both negative (15)
        a[15] = -WAD; b[15] = -2 * WAD;
        a[16] = -2 * WAD; b[16] = -WAD;
        a[17] = -5 * WAD; b[17] = -10 * WAD;
        a[18] = -10 * WAD; b[18] = -5 * WAD;
        a[19] = -100 * WAD; b[19] = -1000 * WAD;
        a[20] = -1e20; b[20] = -1e22;
        a[21] = -1e24; b[21] = -1e26;
        a[22] = -1e28; b[22] = -1e30;
        a[23] = -3141592653589793238; b[23] = -2718281828459045235;
        a[24] = -WAD / 2; b[24] = -WAD / 3;
        a[25] = -WAD / 10; b[25] = -WAD / 100;
        a[26] = -1e6; b[26] = -1e9;
        a[27] = -1e12; b[27] = -1e15;
        a[28] = -1e18; b[28] = -1e21;
        a[29] = -1e24; b[29] = -1e27;
        
        // Mixed signs (20)
        a[30] = WAD; b[30] = -WAD;
        a[31] = -WAD; b[31] = WAD;
        a[32] = 5 * WAD; b[32] = -2 * WAD;
        a[33] = -5 * WAD; b[33] = 2 * WAD;
        a[34] = 100 * WAD; b[34] = -100 * WAD;
        a[35] = -100 * WAD; b[35] = 100 * WAD;
        a[36] = 1e20; b[36] = -1e20;
        a[37] = -1e20; b[37] = 1e20;
        a[38] = 1e24; b[38] = -1e22;
        a[39] = -1e24; b[39] = 1e22;
        a[40] = WAD / 2; b[40] = -WAD / 3;
        a[41] = -WAD / 2; b[41] = WAD / 3;
        a[42] = 1e6; b[42] = -1e9;
        a[43] = -1e6; b[43] = 1e9;
        a[44] = 1e12; b[44] = -1e15;
        a[45] = -1e12; b[45] = 1e15;
        a[46] = 1e18; b[46] = -1e21;
        a[47] = -1e18; b[47] = 1e21;
        a[48] = 1e24; b[48] = -1e27;
        a[49] = -1e24; b[49] = 1e27;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("dist", a[i], b[i]);
        }
    }
    
    function _sweepGavg() internal {
        int256[50] memory a;
        int256[50] memory b;
        
        // Small * small (10)
        a[0] = WAD / 100; b[0] = WAD / 50;
        a[1] = WAD / 10; b[1] = WAD / 5;
        a[2] = WAD / 5; b[2] = WAD / 3;
        a[3] = WAD / 3; b[3] = WAD / 2;
        a[4] = WAD / 2; b[4] = WAD;
        a[5] = WAD; b[5] = WAD / 10;
        a[6] = 2 * WAD; b[6] = WAD / 2;
        a[7] = 5 * WAD; b[7] = WAD / 5;
        a[8] = 10 * WAD; b[8] = WAD / 10;
        a[9] = 4 * WAD; b[9] = 9 * WAD;
        
        // Typical * typical (20)
        a[10] = WAD; b[10] = WAD;
        a[11] = 2 * WAD; b[11] = 3 * WAD;
        a[12] = 5 * WAD; b[12] = 7 * WAD;
        a[13] = 10 * WAD; b[13] = 10 * WAD;
        a[14] = WAD / 2; b[14] = WAD / 3;
        a[15] = 3141592653589793238; b[15] = 2718281828459045235;
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
        
        // Large * large (10)
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
        
        // Perfect squares (10)
        a[40] = WAD; b[40] = 4 * WAD;
        a[41] = 4 * WAD; b[41] = 9 * WAD;
        a[42] = 9 * WAD; b[42] = 16 * WAD;
        a[43] = 16 * WAD; b[43] = 25 * WAD;
        a[44] = 25 * WAD; b[44] = 36 * WAD;
        a[45] = 36 * WAD; b[45] = 49 * WAD;
        a[46] = 49 * WAD; b[46] = 64 * WAD;
        a[47] = 64 * WAD; b[47] = 81 * WAD;
        a[48] = 81 * WAD; b[48] = 100 * WAD;
        a[49] = 100 * WAD; b[49] = 121 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("gavg", a[i], b[i]);
        }
    }
    
    function _sweepLog10() internal {
        int256[50] memory vals;
        
        // Small values (10)
        vals[0] = WAD / 1000;
        vals[1] = WAD / 100;
        vals[2] = WAD / 10;
        vals[3] = WAD / 5;
        vals[4] = WAD / 3;
        vals[5] = WAD / 2;
        vals[6] = 2 * WAD / 3;
        vals[7] = 3 * WAD / 4;
        vals[8] = 9 * WAD / 10;
        vals[9] = 99 * WAD / 100;
        
        // Around 1 (10)
        vals[10] = WAD;
        vals[11] = 11 * WAD / 10;
        vals[12] = 12 * WAD / 10;
        vals[13] = 15 * WAD / 10;
        vals[14] = 2 * WAD;
        vals[15] = 3 * WAD;
        vals[16] = 5 * WAD;
        vals[17] = 7 * WAD;
        vals[18] = 9 * WAD;
        vals[19] = 10 * WAD;
        
        // Powers of 10 (10)
        vals[20] = 10 * WAD;
        vals[21] = 100 * WAD;
        vals[22] = 1000 * WAD;
        vals[23] = 1e22;
        vals[24] = 1e23;
        vals[25] = 1e24;
        vals[26] = 1e25;
        vals[27] = 1e26;
        vals[28] = 1e27;
        vals[29] = 1e28;
        
        // Large values (10)
        vals[30] = 1e29;
        vals[31] = 1e30;
        vals[32] = 1e31;
        vals[33] = 1e32;
        vals[34] = 1e33;
        vals[35] = 1e34;
        vals[36] = 1e35;
        vals[37] = 1e36;
        vals[38] = 1e37;
        vals[39] = 1e38;
        
        // Special values (10)
        vals[40] = 3141592653589793238;
        vals[41] = 2718281828459045235;
        vals[42] = 1618033988749894848;
        vals[43] = 2236067977499789696;
        vals[44] = 1414213562373095048;
        vals[45] = 7071067811865475244;
        vals[46] = 5772156649015328606;
        vals[47] = 6931471805599453094;
        vals[48] = 4342944819032518276;
        vals[49] = 3010299956639811952;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("log10", vals[i], 0);
        }
    }
    
    function _sweepExp10() internal {
        int256[50] memory vals;
        
        // Negative exponents (15)
        vals[0] = -10 * WAD;
        vals[1] = -9 * WAD;
        vals[2] = -8 * WAD;
        vals[3] = -7 * WAD;
        vals[4] = -6 * WAD;
        vals[5] = -5 * WAD;
        vals[6] = -4 * WAD;
        vals[7] = -3 * WAD;
        vals[8] = -2 * WAD;
        vals[9] = -WAD;
        vals[10] = -WAD / 2;
        vals[11] = -WAD / 3;
        vals[12] = -WAD / 5;
        vals[13] = -WAD / 10;
        vals[14] = -WAD / 100;
        
        // Around zero (10)
        vals[15] = 0;
        vals[16] = WAD / 100;
        vals[17] = WAD / 10;
        vals[18] = WAD / 5;
        vals[19] = WAD / 3;
        vals[20] = WAD / 2;
        vals[21] = 2 * WAD / 3;
        vals[22] = 3 * WAD / 4;
        vals[23] = 9 * WAD / 10;
        vals[24] = 99 * WAD / 100;
        
        // Positive exponents (25)
        vals[25] = WAD;
        vals[26] = 11 * WAD / 10;
        vals[27] = 12 * WAD / 10;
        vals[28] = 15 * WAD / 10;
        vals[29] = 2 * WAD;
        vals[30] = 3 * WAD;
        vals[31] = 4 * WAD;
        vals[32] = 5 * WAD;
        vals[33] = 6 * WAD;
        vals[34] = 7 * WAD;
        vals[35] = 8 * WAD;
        vals[36] = 9 * WAD;
        vals[37] = 10 * WAD;
        vals[38] = 11 * WAD;
        vals[39] = 12 * WAD;
        vals[40] = 13 * WAD;
        vals[41] = 14 * WAD;
        vals[42] = 15 * WAD;
        vals[43] = 16 * WAD;
        vals[44] = 17 * WAD;
        vals[45] = 18 * WAD;
        vals[46] = 19 * WAD;
        vals[47] = 20 * WAD;
        vals[48] = 18 * WAD;
        vals[49] = 19 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("exp10", vals[i], 0);
        }
    }
    
    function _sweepSign() internal {
        // 50 representative values including negative, zero, and positive
        int256[50] memory vals;
        
        // Negative values (20)
        vals[0] = -1000 * WAD;
        vals[1] = -100 * WAD;
        vals[2] = -50 * WAD;
        vals[3] = -20 * WAD;
        vals[4] = -10 * WAD;
        vals[5] = -5 * WAD;
        vals[6] = -3 * WAD;
        vals[7] = -2 * WAD;
        vals[8] = -WAD;
        vals[9] = -WAD / 2;
        vals[10] = -WAD / 3;
        vals[11] = -WAD / 5;
        vals[12] = -WAD / 10;
        vals[13] = -WAD / 100;
        vals[14] = -WAD / 1000;
        vals[15] = -WAD / 10000;
        vals[16] = -WAD / 100000;
        vals[17] = -WAD / 1000000;
        vals[18] = -1;
        vals[19] = -2;
        
        // Zero (1)
        vals[20] = 0;
        
        // Positive values (29)
        vals[21] = 1;
        vals[22] = 2;
        vals[23] = WAD / 1000000;
        vals[24] = WAD / 100000;
        vals[25] = WAD / 10000;
        vals[26] = WAD / 1000;
        vals[27] = WAD / 100;
        vals[28] = WAD / 10;
        vals[29] = WAD / 5;
        vals[30] = WAD / 3;
        vals[31] = WAD / 2;
        vals[32] = WAD;
        vals[33] = 2 * WAD;
        vals[34] = 3 * WAD;
        vals[35] = 5 * WAD;
        vals[36] = 10 * WAD;
        vals[37] = 20 * WAD;
        vals[38] = 50 * WAD;
        vals[39] = 100 * WAD;
        vals[40] = 1000 * WAD;
        vals[41] = 10000 * WAD;
        vals[42] = 100000 * WAD;
        vals[43] = 1000000 * WAD;
        vals[44] = 10000000 * WAD;
        vals[45] = 100000000 * WAD;
        vals[46] = 1000000000 * WAD;
        vals[47] = 10000000000 * WAD;
        vals[48] = 100000000000 * WAD;
        vals[49] = 1000000000000 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("sign", vals[i], 0);
        }
    }
    
    function _sweepFloor() internal {
        // 50 representative values with various fractional parts
        int256[50] memory vals;
        
        // Negative with fractions (15)
        vals[0] = -10 * WAD - WAD / 2;
        vals[1] = -10 * WAD - WAD / 3;
        vals[2] = -10 * WAD - WAD / 4;
        vals[3] = -5 * WAD - WAD / 2;
        vals[4] = -5 * WAD - WAD / 10;
        vals[5] = -3 * WAD - 7 * WAD / 10;
        vals[6] = -2 * WAD - WAD / 2;
        vals[7] = -WAD - WAD / 2;
        vals[8] = -WAD - WAD / 3;
        vals[9] = -WAD - WAD / 10;
        vals[10] = -WAD / 2;
        vals[11] = -WAD / 3;
        vals[12] = -WAD / 10;
        vals[13] = -WAD / 100;
        vals[14] = -1;
        
        // Zero and near-zero (5)
        vals[15] = 0;
        vals[16] = 1;
        vals[17] = WAD / 100;
        vals[18] = WAD / 10;
        vals[19] = WAD / 3;
        
        // Positive with fractions (30)
        vals[20] = WAD / 2;
        vals[21] = WAD + WAD / 10;
        vals[22] = WAD + WAD / 3;
        vals[23] = WAD + WAD / 2;
        vals[24] = 2 * WAD + WAD / 2;
        vals[25] = 3 * WAD + 7 * WAD / 10;
        vals[26] = 5 * WAD + WAD / 10;
        vals[27] = 5 * WAD + WAD / 2;
        vals[28] = 10 * WAD + WAD / 4;
        vals[29] = 10 * WAD + WAD / 3;
        vals[30] = 10 * WAD + WAD / 2;
        vals[31] = 100 * WAD + WAD / 2;
        vals[32] = 1000 * WAD + WAD / 2;
        vals[33] = 12345 * WAD / 1000;
        vals[34] = 67890 * WAD / 1000;
        vals[35] = 11111 * WAD / 1000;
        vals[36] = 22222 * WAD / 1000;
        vals[37] = 33333 * WAD / 1000;
        vals[38] = 44444 * WAD / 1000;
        vals[39] = 55555 * WAD / 1000;
        vals[40] = 66666 * WAD / 1000;
        vals[41] = 77777 * WAD / 1000;
        vals[42] = 88888 * WAD / 1000;
        vals[43] = 99999 * WAD / 1000;
        vals[44] = 123456 * WAD / 10000;
        vals[45] = 234567 * WAD / 10000;
        vals[46] = 345678 * WAD / 10000;
        vals[47] = 456789 * WAD / 10000;
        vals[48] = 567890 * WAD / 10000;
        vals[49] = 678901 * WAD / 10000;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("floor", vals[i], 0);
        }
    }
    
    function _sweepCeil() internal {
        // Same test values as floor (ceil and floor are related)
        int256[50] memory vals;
        
        vals[0] = -10 * WAD - WAD / 2;
        vals[1] = -10 * WAD - WAD / 3;
        vals[2] = -10 * WAD - WAD / 4;
        vals[3] = -5 * WAD - WAD / 2;
        vals[4] = -5 * WAD - WAD / 10;
        vals[5] = -3 * WAD - 7 * WAD / 10;
        vals[6] = -2 * WAD - WAD / 2;
        vals[7] = -WAD - WAD / 2;
        vals[8] = -WAD - WAD / 3;
        vals[9] = -WAD - WAD / 10;
        vals[10] = -WAD / 2;
        vals[11] = -WAD / 3;
        vals[12] = -WAD / 10;
        vals[13] = -WAD / 100;
        vals[14] = -1;
        vals[15] = 0;
        vals[16] = 1;
        vals[17] = WAD / 100;
        vals[18] = WAD / 10;
        vals[19] = WAD / 3;
        vals[20] = WAD / 2;
        vals[21] = WAD + WAD / 10;
        vals[22] = WAD + WAD / 3;
        vals[23] = WAD + WAD / 2;
        vals[24] = 2 * WAD + WAD / 2;
        vals[25] = 3 * WAD + 7 * WAD / 10;
        vals[26] = 5 * WAD + WAD / 10;
        vals[27] = 5 * WAD + WAD / 2;
        vals[28] = 10 * WAD + WAD / 4;
        vals[29] = 10 * WAD + WAD / 3;
        vals[30] = 10 * WAD + WAD / 2;
        vals[31] = 100 * WAD + WAD / 2;
        vals[32] = 1000 * WAD + WAD / 2;
        vals[33] = 12345 * WAD / 1000;
        vals[34] = 67890 * WAD / 1000;
        vals[35] = 11111 * WAD / 1000;
        vals[36] = 22222 * WAD / 1000;
        vals[37] = 33333 * WAD / 1000;
        vals[38] = 44444 * WAD / 1000;
        vals[39] = 55555 * WAD / 1000;
        vals[40] = 66666 * WAD / 1000;
        vals[41] = 77777 * WAD / 1000;
        vals[42] = 88888 * WAD / 1000;
        vals[43] = 99999 * WAD / 1000;
        vals[44] = 123456 * WAD / 10000;
        vals[45] = 234567 * WAD / 10000;
        vals[46] = 345678 * WAD / 10000;
        vals[47] = 456789 * WAD / 10000;
        vals[48] = 567890 * WAD / 10000;
        vals[49] = 678901 * WAD / 10000;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("ceil", vals[i], 0);
        }
    }
    
    function _sweepFrac() internal {
        // Same test values as floor/ceil
        int256[50] memory vals;
        
        vals[0] = -10 * WAD - WAD / 2;
        vals[1] = -10 * WAD - WAD / 3;
        vals[2] = -10 * WAD - WAD / 4;
        vals[3] = -5 * WAD - WAD / 2;
        vals[4] = -5 * WAD - WAD / 10;
        vals[5] = -3 * WAD - 7 * WAD / 10;
        vals[6] = -2 * WAD - WAD / 2;
        vals[7] = -WAD - WAD / 2;
        vals[8] = -WAD - WAD / 3;
        vals[9] = -WAD - WAD / 10;
        vals[10] = -WAD / 2;
        vals[11] = -WAD / 3;
        vals[12] = -WAD / 10;
        vals[13] = -WAD / 100;
        vals[14] = -1;
        vals[15] = 0;
        vals[16] = 1;
        vals[17] = WAD / 100;
        vals[18] = WAD / 10;
        vals[19] = WAD / 3;
        vals[20] = WAD / 2;
        vals[21] = WAD + WAD / 10;
        vals[22] = WAD + WAD / 3;
        vals[23] = WAD + WAD / 2;
        vals[24] = 2 * WAD + WAD / 2;
        vals[25] = 3 * WAD + 7 * WAD / 10;
        vals[26] = 5 * WAD + WAD / 10;
        vals[27] = 5 * WAD + WAD / 2;
        vals[28] = 10 * WAD + WAD / 4;
        vals[29] = 10 * WAD + WAD / 3;
        vals[30] = 10 * WAD + WAD / 2;
        vals[31] = 100 * WAD + WAD / 2;
        vals[32] = 1000 * WAD + WAD / 2;
        vals[33] = 12345 * WAD / 1000;
        vals[34] = 67890 * WAD / 1000;
        vals[35] = 11111 * WAD / 1000;
        vals[36] = 22222 * WAD / 1000;
        vals[37] = 33333 * WAD / 1000;
        vals[38] = 44444 * WAD / 1000;
        vals[39] = 55555 * WAD / 1000;
        vals[40] = 66666 * WAD / 1000;
        vals[41] = 77777 * WAD / 1000;
        vals[42] = 88888 * WAD / 1000;
        vals[43] = 99999 * WAD / 1000;
        vals[44] = 123456 * WAD / 10000;
        vals[45] = 234567 * WAD / 10000;
        vals[46] = 345678 * WAD / 10000;
        vals[47] = 456789 * WAD / 10000;
        vals[48] = 567890 * WAD / 10000;
        vals[49] = 678901 * WAD / 10000;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("frac", vals[i], 0);
        }
    }
    
    function _sweepCbrt() internal {
        // 50 representative values for cube root
        int256[50] memory vals;
        
        // Negative values (10)
        vals[0] = -1000 * WAD;
        vals[1] = -100 * WAD;
        vals[2] = -27 * WAD;
        vals[3] = -8 * WAD;
        vals[4] = -WAD;
        vals[5] = -WAD / 8;
        vals[6] = -WAD / 27;
        vals[7] = -WAD / 100;
        vals[8] = -WAD / 1000;
        vals[9] = -WAD / 10000;
        
        // Zero (1)
        vals[10] = 0;
        
        // Small positive (9)
        vals[11] = WAD / 10000;
        vals[12] = WAD / 1000;
        vals[13] = WAD / 100;
        vals[14] = WAD / 27;
        vals[15] = WAD / 8;
        vals[16] = WAD / 2;
        vals[17] = 2 * WAD / 3;
        vals[18] = 9 * WAD / 10;
        vals[19] = 99 * WAD / 100;
        
        // Around 1 (5)
        vals[20] = WAD;
        vals[21] = 11 * WAD / 10;
        vals[22] = 12 * WAD / 10;
        vals[23] = 15 * WAD / 10;
        vals[24] = 2 * WAD;
        
        // Perfect cubes (10)
        vals[25] = 8 * WAD;
        vals[26] = 27 * WAD;
        vals[27] = 64 * WAD;
        vals[28] = 125 * WAD;
        vals[29] = 216 * WAD;
        vals[30] = 343 * WAD;
        vals[31] = 512 * WAD;
        vals[32] = 729 * WAD;
        vals[33] = 1000 * WAD;
        vals[34] = 1331 * WAD;
        
        // Large values (15)
        vals[35] = 10000 * WAD;
        vals[36] = 100000 * WAD;
        vals[37] = 1000000 * WAD;
        vals[38] = 10000000 * WAD;
        vals[39] = 100000000 * WAD;
        vals[40] = 1000000000 * WAD;
        vals[41] = 10000000000 * WAD;
        vals[42] = 100000000000 * WAD;
        vals[43] = 1000000000000 * WAD;
        vals[44] = 10000000000000 * WAD;
        vals[45] = 100000000000000 * WAD;
        vals[46] = 1000000000000000 * WAD;
        vals[47] = 10000000000000000 * WAD;
        vals[48] = 100000000000000000 * WAD;
        vals[49] = 1000000000000000000 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("cbrt", vals[i], 0);
        }
    }
    
    function _sweepLerp() internal {
        // 50 representative (a, b) pairs with t=0.5
        int256[50] memory a;
        int256[50] memory b;
        
        // Various ranges
        a[0] = 0; b[0] = WAD;
        a[1] = 0; b[1] = 10 * WAD;
        a[2] = 0; b[2] = 100 * WAD;
        a[3] = WAD; b[3] = 2 * WAD;
        a[4] = WAD; b[4] = 10 * WAD;
        a[5] = 10 * WAD; b[5] = 20 * WAD;
        a[6] = 10 * WAD; b[6] = 100 * WAD;
        a[7] = 100 * WAD; b[7] = 200 * WAD;
        a[8] = -WAD; b[8] = WAD;
        a[9] = -10 * WAD; b[9] = 10 * WAD;
        a[10] = -100 * WAD; b[10] = 100 * WAD;
        a[11] = -WAD; b[11] = 0;
        a[12] = -10 * WAD; b[12] = 0;
        a[13] = -100 * WAD; b[13] = 0;
        a[14] = -10 * WAD; b[14] = -WAD;
        a[15] = -100 * WAD; b[15] = -10 * WAD;
        a[16] = WAD / 10; b[16] = WAD;
        a[17] = WAD / 100; b[17] = WAD / 10;
        a[18] = WAD / 1000; b[18] = WAD / 100;
        a[19] = WAD; b[19] = 10 * WAD;
        a[20] = 2 * WAD; b[20] = 3 * WAD;
        a[21] = 5 * WAD; b[21] = 10 * WAD;
        a[22] = 10 * WAD; b[22] = 15 * WAD;
        a[23] = 20 * WAD; b[23] = 30 * WAD;
        a[24] = 50 * WAD; b[24] = 100 * WAD;
        a[25] = 100 * WAD; b[25] = 150 * WAD;
        a[26] = 100 * WAD; b[26] = 1000 * WAD;
        a[27] = 1000 * WAD; b[27] = 2000 * WAD;
        a[28] = 1000 * WAD; b[28] = 10000 * WAD;
        a[29] = 10000 * WAD; b[29] = 20000 * WAD;
        a[30] = -5 * WAD; b[30] = 5 * WAD;
        a[31] = -50 * WAD; b[31] = 50 * WAD;
        a[32] = -500 * WAD; b[32] = 500 * WAD;
        a[33] = -1000 * WAD; b[33] = 1000 * WAD;
        a[34] = -2 * WAD; b[34] = 3 * WAD;
        a[35] = -20 * WAD; b[35] = 30 * WAD;
        a[36] = -200 * WAD; b[36] = 300 * WAD;
        a[37] = WAD / 2; b[37] = 3 * WAD / 2;
        a[38] = WAD / 3; b[38] = 2 * WAD / 3;
        a[39] = WAD / 4; b[39] = 3 * WAD / 4;
        a[40] = WAD / 5; b[40] = 4 * WAD / 5;
        a[41] = 3 * WAD; b[41] = 7 * WAD;
        a[42] = 11 * WAD; b[42] = 13 * WAD;
        a[43] = 17 * WAD; b[43] = 19 * WAD;
        a[44] = 23 * WAD; b[44] = 29 * WAD;
        a[45] = 31 * WAD; b[45] = 37 * WAD;
        a[46] = 41 * WAD; b[46] = 43 * WAD;
        a[47] = 47 * WAD; b[47] = 53 * WAD;
        a[48] = 59 * WAD; b[48] = 61 * WAD;
        a[49] = 67 * WAD; b[49] = 71 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("lerp", a[i], b[i]);
        }
    }
    
    function _sweepHypot() internal {
        // 50 representative (a, b) pairs for hypotenuse
        int256[50] memory a;
        int256[50] memory b;
        
        // Pythagorean triples and variations
        a[0] = 3 * WAD; b[0] = 4 * WAD;
        a[1] = 5 * WAD; b[1] = 12 * WAD;
        a[2] = 8 * WAD; b[2] = 15 * WAD;
        a[3] = 7 * WAD; b[3] = 24 * WAD;
        a[4] = 20 * WAD; b[4] = 21 * WAD;
        a[5] = 9 * WAD; b[5] = 40 * WAD;
        a[6] = 12 * WAD; b[6] = 35 * WAD;
        a[7] = 11 * WAD; b[7] = 60 * WAD;
        a[8] = 13 * WAD; b[8] = 84 * WAD;
        a[9] = 36 * WAD; b[9] = 77 * WAD;
        
        // Equal values
        a[10] = WAD; b[10] = WAD;
        a[11] = 2 * WAD; b[11] = 2 * WAD;
        a[12] = 5 * WAD; b[12] = 5 * WAD;
        a[13] = 10 * WAD; b[13] = 10 * WAD;
        a[14] = 100 * WAD; b[14] = 100 * WAD;
        
        // One zero
        a[15] = 0; b[15] = WAD;
        a[16] = WAD; b[16] = 0;
        a[17] = 0; b[17] = 10 * WAD;
        a[18] = 10 * WAD; b[18] = 0;
        a[19] = 0; b[19] = 100 * WAD;
        
        // Small values
        a[20] = WAD / 100; b[20] = WAD / 100;
        a[21] = WAD / 10; b[21] = WAD / 10;
        a[22] = WAD / 5; b[22] = WAD / 5;
        a[23] = WAD / 3; b[23] = WAD / 3;
        a[24] = WAD / 2; b[24] = WAD / 2;
        
        // Large values
        a[25] = 100 * WAD; b[25] = 100 * WAD;
        a[26] = 1000 * WAD; b[26] = 1000 * WAD;
        a[27] = 10000 * WAD; b[27] = 10000 * WAD;
        a[28] = 100000 * WAD; b[28] = 100000 * WAD;
        a[29] = 1000000 * WAD; b[29] = 1000000 * WAD;
        
        // Negative values (should work due to squaring)
        a[30] = -3 * WAD; b[30] = 4 * WAD;
        a[31] = 3 * WAD; b[31] = -4 * WAD;
        a[32] = -3 * WAD; b[32] = -4 * WAD;
        a[33] = -5 * WAD; b[33] = 12 * WAD;
        a[34] = 5 * WAD; b[34] = -12 * WAD;
        
        // Mixed scales
        a[35] = WAD / 10; b[35] = 10 * WAD;
        a[36] = WAD / 100; b[36] = 100 * WAD;
        a[37] = WAD; b[37] = 10 * WAD;
        a[38] = WAD; b[38] = 100 * WAD;
        a[39] = 10 * WAD; b[39] = 100 * WAD;
        
        // Random pairs
        a[40] = 7 * WAD; b[40] = 11 * WAD;
        a[41] = 13 * WAD; b[41] = 17 * WAD;
        a[42] = 19 * WAD; b[42] = 23 * WAD;
        a[43] = 29 * WAD; b[43] = 31 * WAD;
        a[44] = 37 * WAD; b[44] = 41 * WAD;
        a[45] = 43 * WAD; b[45] = 47 * WAD;
        a[46] = 53 * WAD; b[46] = 59 * WAD;
        a[47] = 61 * WAD; b[47] = 67 * WAD;
        a[48] = 71 * WAD; b[48] = 73 * WAD;
        a[49] = 79 * WAD; b[49] = 83 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("hypot", a[i], b[i]);
        }
    }
    
    function _sweepRound() internal {
        // 50 representative values for rounding
        int256[50] memory vals;
        
        // Values near integers
        vals[0] = 1 * WAD + WAD / 10;  // 1.1
        vals[1] = 1 * WAD + WAD / 4;   // 1.25
        vals[2] = 1 * WAD + WAD / 3;   // 1.33...
        vals[3] = 1 * WAD + WAD / 2;   // 1.5
        vals[4] = 1 * WAD + 3 * WAD / 4; // 1.75
        vals[5] = 2 * WAD + WAD / 10;  // 2.1
        vals[6] = 2 * WAD + WAD / 2;   // 2.5
        vals[7] = 2 * WAD + 9 * WAD / 10; // 2.9
        vals[8] = 3 * WAD + WAD / 2;   // 3.5
        vals[9] = 10 * WAD + WAD / 2;  // 10.5
        
        // Negative values
        vals[10] = -1 * WAD - WAD / 10;
        vals[11] = -1 * WAD - WAD / 2;
        vals[12] = -2 * WAD - WAD / 2;
        vals[13] = -3 * WAD - WAD / 4;
        vals[14] = -10 * WAD - WAD / 2;
        
        // Small fractional values
        vals[15] = WAD / 10;
        vals[16] = WAD / 4;
        vals[17] = WAD / 3;
        vals[18] = WAD / 2;
        vals[19] = 3 * WAD / 4;
        
        // Large values
        vals[20] = 100 * WAD + WAD / 2;
        vals[21] = 1000 * WAD + WAD / 2;
        vals[22] = 10000 * WAD + WAD / 2;
        vals[23] = 100000 * WAD + WAD / 2;
        vals[24] = 1000000 * WAD + WAD / 2;
        
        // Edge cases
        vals[25] = 0;
        vals[26] = WAD;
        vals[27] = -WAD;
        vals[28] = 2 * WAD;
        vals[29] = -2 * WAD;
        
        // More fractional values
        vals[30] = 5 * WAD + WAD / 10;
        vals[31] = 5 * WAD + WAD / 5;
        vals[32] = 5 * WAD + 3 * WAD / 10;
        vals[33] = 5 * WAD + 2 * WAD / 5;
        vals[34] = 5 * WAD + WAD / 2;
        vals[35] = 5 * WAD + 3 * WAD / 5;
        vals[36] = 5 * WAD + 7 * WAD / 10;
        vals[37] = 5 * WAD + 4 * WAD / 5;
        vals[38] = 5 * WAD + 9 * WAD / 10;
        vals[39] = 6 * WAD;
        
        // Negative fractional values
        vals[40] = -5 * WAD - WAD / 10;
        vals[41] = -5 * WAD - WAD / 5;
        vals[42] = -5 * WAD - 3 * WAD / 10;
        vals[43] = -5 * WAD - 2 * WAD / 5;
        vals[44] = -5 * WAD - WAD / 2;
        vals[45] = -5 * WAD - 3 * WAD / 5;
        vals[46] = -5 * WAD - 7 * WAD / 10;
        vals[47] = -5 * WAD - 4 * WAD / 5;
        vals[48] = -5 * WAD - 9 * WAD / 10;
        vals[49] = -6 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("round", vals[i], 0);
        }
    }
    
    function _sweepLog2Up() internal {
        // 50 representative values for log2 ceiling
        int256[50] memory vals;
        
        // Powers of 2
        vals[0] = WAD / 2;       // 0.5 -> log2 = -1
        vals[1] = WAD;           // 1 -> log2 = 0
        vals[2] = 2 * WAD;       // 2 -> log2 = 1
        vals[3] = 4 * WAD;       // 4 -> log2 = 2
        vals[4] = 8 * WAD;       // 8 -> log2 = 3
        vals[5] = 16 * WAD;      // 16 -> log2 = 4
        vals[6] = 32 * WAD;      // 32 -> log2 = 5
        vals[7] = 64 * WAD;      // 64 -> log2 = 6
        vals[8] = 128 * WAD;     // 128 -> log2 = 7
        vals[9] = 256 * WAD;     // 256 -> log2 = 8
        
        // Non-powers of 2 (should round up)
        vals[10] = 3 * WAD;      // 3 -> log2 ~ 1.58 -> ceil = 2
        vals[11] = 5 * WAD;      // 5 -> log2 ~ 2.32 -> ceil = 3
        vals[12] = 6 * WAD;      // 6 -> log2 ~ 2.58 -> ceil = 3
        vals[13] = 7 * WAD;      // 7 -> log2 ~ 2.81 -> ceil = 3
        vals[14] = 9 * WAD;      // 9 -> log2 ~ 3.17 -> ceil = 4
        vals[15] = 10 * WAD;     // 10 -> log2 ~ 3.32 -> ceil = 4
        vals[16] = 15 * WAD;     // 15 -> log2 ~ 3.91 -> ceil = 4
        vals[17] = 17 * WAD;     // 17 -> log2 ~ 4.09 -> ceil = 5
        vals[18] = 20 * WAD;     // 20 -> log2 ~ 4.32 -> ceil = 5
        vals[19] = 100 * WAD;    // 100 -> log2 ~ 6.64 -> ceil = 7
        
        // Small values
        vals[20] = WAD / 4;      // 0.25 -> log2 = -2
        vals[21] = WAD / 8;      // 0.125 -> log2 = -3
        vals[22] = WAD / 16;     // 0.0625 -> log2 = -4
        vals[23] = WAD / 32;     // 0.03125 -> log2 = -5
        vals[24] = WAD / 64;     // 0.015625 -> log2 = -6
        
        // Non-power-of-2 small values
        vals[25] = WAD / 3;      // 0.333... -> log2 ~ -1.58 -> ceil = -1
        vals[26] = WAD / 5;      // 0.2 -> log2 ~ -2.32 -> ceil = -2
        vals[27] = WAD / 10;     // 0.1 -> log2 ~ -3.32 -> ceil = -3
        vals[28] = WAD / 100;    // 0.01 -> log2 ~ -6.64 -> ceil = -6
        vals[29] = WAD / 1000;   // 0.001 -> log2 ~ -9.97 -> ceil = -9
        
        // Large values
        vals[30] = 1000 * WAD;   // 1000 -> log2 ~ 9.97 -> ceil = 10
        vals[31] = 10000 * WAD;  // 10000 -> log2 ~ 13.29 -> ceil = 14
        vals[32] = 100000 * WAD; // 100000 -> log2 ~ 16.61 -> ceil = 17
        vals[33] = 1000000 * WAD; // 1000000 -> log2 ~ 19.93 -> ceil = 20
        
        // More non-powers
        vals[34] = 11 * WAD;
        vals[35] = 12 * WAD;
        vals[36] = 13 * WAD;
        vals[37] = 14 * WAD;
        vals[38] = 18 * WAD;
        vals[39] = 19 * WAD;
        vals[40] = 21 * WAD;
        vals[41] = 22 * WAD;
        vals[42] = 23 * WAD;
        vals[43] = 24 * WAD;
        vals[44] = 25 * WAD;
        vals[45] = 30 * WAD;
        vals[46] = 40 * WAD;
        vals[47] = 50 * WAD;
        vals[48] = 60 * WAD;
        vals[49] = 70 * WAD;
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("log2up", vals[i], 0);
        }
    }
    
    function _sweepGcd() internal {
        // 50 representative (a, b) pairs for GCD
        int256[50] memory a;
        int256[50] memory b;
        
        // Classic GCD pairs
        a[0] = 48 * WAD; b[0] = 18 * WAD;  // gcd = 6
        a[1] = 54 * WAD; b[1] = 24 * WAD;  // gcd = 6
        a[2] = 100 * WAD; b[2] = 50 * WAD; // gcd = 50
        a[3] = 120 * WAD; b[3] = 80 * WAD; // gcd = 40
        a[4] = 144 * WAD; b[4] = 60 * WAD; // gcd = 12
        
        // Coprime pairs
        a[5] = 17 * WAD; b[5] = 19 * WAD;  // gcd = 1
        a[6] = 23 * WAD; b[6] = 29 * WAD;  // gcd = 1
        a[7] = 31 * WAD; b[7] = 37 * WAD;  // gcd = 1
        a[8] = 41 * WAD; b[8] = 43 * WAD;  // gcd = 1
        a[9] = 47 * WAD; b[9] = 53 * WAD;  // gcd = 1
        
        // One is zero
        a[10] = 42 * WAD; b[10] = 0;       // gcd = 42
        a[11] = 0; b[11] = 42 * WAD;       // gcd = 42
        a[12] = 100 * WAD; b[12] = 0;      // gcd = 100
        a[13] = 0; b[13] = 100 * WAD;      // gcd = 100
        a[14] = 1 * WAD; b[14] = 0;        // gcd = 1
        
        // Same values
        a[15] = 10 * WAD; b[15] = 10 * WAD; // gcd = 10
        a[16] = 25 * WAD; b[16] = 25 * WAD; // gcd = 25
        a[17] = 100 * WAD; b[17] = 100 * WAD; // gcd = 100
        a[18] = 1 * WAD; b[18] = 1 * WAD;   // gcd = 1
        a[19] = 7 * WAD; b[19] = 7 * WAD;   // gcd = 7
        
        // Powers of 2
        a[20] = 16 * WAD; b[20] = 8 * WAD;  // gcd = 8
        a[21] = 32 * WAD; b[21] = 16 * WAD; // gcd = 16
        a[22] = 64 * WAD; b[22] = 32 * WAD; // gcd = 32
        a[23] = 128 * WAD; b[23] = 64 * WAD; // gcd = 64
        a[24] = 256 * WAD; b[24] = 128 * WAD; // gcd = 128
        
        // Large values
        a[25] = 1000 * WAD; b[25] = 500 * WAD; // gcd = 500
        a[26] = 10000 * WAD; b[26] = 5000 * WAD; // gcd = 5000
        a[27] = 100000 * WAD; b[27] = 50000 * WAD; // gcd = 50000
        a[28] = 999 * WAD; b[28] = 666 * WAD; // gcd = 333
        a[29] = 1024 * WAD; b[29] = 512 * WAD; // gcd = 512
        
        // Small values
        a[30] = 2 * WAD; b[30] = 1 * WAD;   // gcd = 1
        a[31] = 3 * WAD; b[31] = 2 * WAD;   // gcd = 1
        a[32] = 4 * WAD; b[32] = 2 * WAD;   // gcd = 2
        a[33] = 5 * WAD; b[33] = 3 * WAD;   // gcd = 1
        a[34] = 6 * WAD; b[34] = 3 * WAD;   // gcd = 3
        
        // Fibonacci pairs (coprime)
        a[35] = 21 * WAD; b[35] = 13 * WAD; // gcd = 1
        a[36] = 34 * WAD; b[36] = 21 * WAD; // gcd = 1
        a[37] = 55 * WAD; b[37] = 34 * WAD; // gcd = 1
        a[38] = 89 * WAD; b[38] = 55 * WAD; // gcd = 1
        a[39] = 144 * WAD; b[39] = 89 * WAD; // gcd = 1
        
        // Random pairs
        a[40] = 36 * WAD; b[40] = 24 * WAD; // gcd = 12
        a[41] = 45 * WAD; b[41] = 30 * WAD; // gcd = 15
        a[42] = 56 * WAD; b[42] = 42 * WAD; // gcd = 14
        a[43] = 63 * WAD; b[43] = 49 * WAD; // gcd = 7
        a[44] = 72 * WAD; b[44] = 54 * WAD; // gcd = 18
        a[45] = 81 * WAD; b[45] = 63 * WAD; // gcd = 9
        a[46] = 90 * WAD; b[46] = 75 * WAD; // gcd = 15
        a[47] = 96 * WAD; b[47] = 84 * WAD; // gcd = 12
        a[48] = 105 * WAD; b[48] = 91 * WAD; // gcd = 7
        a[49] = 108 * WAD; b[49] = 96 * WAD; // gcd = 12
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("gcd", a[i], b[i]);
        }
    }
    
    function _sweepFactorial() internal {
        // 34 values for factorial (0! through 33!)
        int256[50] memory vals;
        
        // Factorials 0-33 (34! overflows uint256)
        for (uint256 i = 0; i <= 33; i++) {
            vals[i] = int256(i) * WAD;
        }
        
        // Fill remaining slots with edge cases
        vals[34] = 0;  // 0! = 1
        vals[35] = WAD;  // 1! = 1
        vals[36] = 2 * WAD;  // 2! = 2
        vals[37] = 3 * WAD;  // 3! = 6
        vals[38] = 4 * WAD;  // 4! = 24
        vals[39] = 5 * WAD;  // 5! = 120
        vals[40] = 10 * WAD; // 10! = 3628800
        vals[41] = 15 * WAD; // 15!
        vals[42] = 20 * WAD; // 20!
        vals[43] = 25 * WAD; // 25!
        vals[44] = 30 * WAD; // 30!
        vals[45] = 31 * WAD; // 31!
        vals[46] = 32 * WAD; // 32!
        vals[47] = 33 * WAD; // 33!
        vals[48] = 12 * WAD; // 12!
        vals[49] = 7 * WAD;  // 7!
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("factorial", vals[i], 0);
        }
    }
    
    function _sweepLambertW0() internal {
        // 50 representative values for Lambert W0
        int256[50] memory vals;
        
        // Domain: x >= -1/e ≈ -0.3679
        // Near lower bound
        vals[0] = -367879441 * WAD / 1000000000;  // -1/e
        vals[1] = -350000000 * WAD / 1000000000;  // -0.35
        vals[2] = -300000000 * WAD / 1000000000;  // -0.30
        vals[3] = -250000000 * WAD / 1000000000;  // -0.25
        vals[4] = -200000000 * WAD / 1000000000;  // -0.20
        
        // Small negative values
        vals[5] = -100000000 * WAD / 1000000000;  // -0.1
        vals[6] = -50000000 * WAD / 1000000000;   // -0.05
        vals[7] = -10000000 * WAD / 1000000000;   // -0.01
        vals[8] = -1000000 * WAD / 1000000000;    // -0.001
        vals[9] = -100000 * WAD / 1000000000;     // -0.0001
        
        // Zero and small positive
        vals[10] = 0;                              // W(0) = 0
        vals[11] = 100000 * WAD / 1000000000;     // 0.0001
        vals[12] = 1000000 * WAD / 1000000000;    // 0.001
        vals[13] = 10000000 * WAD / 1000000000;   // 0.01
        vals[14] = 50000000 * WAD / 1000000000;   // 0.05
        
        // Around 0.1 to 1
        vals[15] = 100000000 * WAD / 1000000000;  // 0.1
        vals[16] = 200000000 * WAD / 1000000000;  // 0.2
        vals[17] = 300000000 * WAD / 1000000000;  // 0.3
        vals[18] = 500000000 * WAD / 1000000000;  // 0.5
        vals[19] = WAD;                            // 1.0, W(1) ≈ 0.5671
        
        // Around e
        vals[20] = 2 * WAD;                        // 2.0
        vals[21] = 2718281828459045235;           // e, W(e) = 1
        vals[22] = 3 * WAD;                        // 3.0
        vals[23] = 4 * WAD;                        // 4.0
        vals[24] = 5 * WAD;                        // 5.0
        
        // Larger values
        vals[25] = 10 * WAD;                       // 10
        vals[26] = 20 * WAD;                       // 20
        vals[27] = 50 * WAD;                       // 50
        vals[28] = 100 * WAD;                      // 100
        vals[29] = 200 * WAD;                      // 200
        
        // Very large values
        vals[30] = 500 * WAD;                      // 500
        vals[31] = 1000 * WAD;                     // 1000
        vals[32] = 2000 * WAD;                     // 2000
        vals[33] = 5000 * WAD;                     // 5000
        vals[34] = 10000 * WAD;                    // 10000
        
        // More intermediate values
        vals[35] = WAD / 2;                        // 0.5
        vals[36] = WAD / 4;                        // 0.25
        vals[37] = 3 * WAD / 4;                    // 0.75
        vals[38] = WAD + WAD / 2;                  // 1.5
        vals[39] = 2 * WAD + WAD / 2;              // 2.5
        
        // Around special values
        vals[40] = 6 * WAD;                        // 6
        vals[41] = 7 * WAD;                        // 7
        vals[42] = 8 * WAD;                        // 8
        vals[43] = 9 * WAD;                        // 9
        vals[44] = 15 * WAD;                       // 15
        vals[45] = 25 * WAD;                       // 25
        vals[46] = 30 * WAD;                       // 30
        vals[47] = 40 * WAD;                       // 40
        vals[48] = 60 * WAD;                       // 60
        vals[49] = 80 * WAD;                       // 80
        
        for (uint256 i = 0; i < 50; i++) {
            _runSample("lambertw0", vals[i], 0);
        }
    }
    
    // ============================================================================
    // SAMPLE RUNNER
    // ============================================================================
    
    function _runSample(string memory func, int256 a_wad, int256 b_wad) internal {
        // Get oracle values
        (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp) = _oracleMulti(func, a_wad, b_wad);
        
        // Run FP128
        (uint256 fp128_gas, uint256 fp128_digits, int256 fp128_error_bits) = _runFp128(func, a_wad, b_wad, fp128_exp);
        _emitSweep("fp128", func, a_wad, b_wad, fp128_gas, fp128_digits, fp128_error_bits);
        
        // Run ABDK (try-catch to handle overflow/unsupported inputs)
        try this.runAbdkExternal(func, a_wad, b_wad, abdk_exp) returns (uint256 ag, uint256 ad, int256 ae) {
            _emitSweep("abdk", func, a_wad, b_wad, ag, ad, ae);
        } catch {}
        
        // Run Solady (try-catch to handle overflow/unsupported inputs)
        try this.runSoladyExternal(func, a_wad, b_wad, wad_exp) returns (uint256 sg, uint256 sd_, int256 se) {
            _emitSweep("solady", func, a_wad, b_wad, sg, sd_, se);
        } catch {}

        // Run PRBMath (try-catch to handle overflow/unsupported inputs)
        try this.runPrbExternal(func, a_wad, b_wad, wad_exp) returns (uint256 pg, uint256 pd, int256 pe) {
            _emitSweep("prb", func, a_wad, b_wad, pg, pd, pe);
        } catch {}
    }
    
    function runAbdkExternal(string calldata func, int256 a_wad, int256 b_wad, uint256 exp_abdk)
        external view returns (uint256, uint256, int256)
    {
        return _runAbdk(func, a_wad, b_wad, exp_abdk);
    }
    
    function runSoladyExternal(string calldata func, int256 a_wad, int256 b_wad, uint256 exp_wad)
        external view returns (uint256, uint256, int256)
    {
        return _runSolady(func, a_wad, b_wad, exp_wad);
    }

    function runPrbExternal(string calldata func, int256 a_wad, int256 b_wad, uint256 exp_wad)
        external view returns (uint256, uint256, int256)
    {
        return _runPrb(func, a_wad, b_wad, exp_wad);
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
        } else if (funcHash == keccak256("abs")) {
            result_fp128 = fp128.absRaw(a_fp128);
        } else if (funcHash == keccak256("inv")) {
            result_fp128 = fp128.invRaw(a_fp128);
        } else if (funcHash == keccak256("min")) {
            result_fp128 = fp128.minRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("max")) {
            result_fp128 = fp128.maxRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("avg")) {
            result_fp128 = fp128.avgRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("dist")) {
            result_fp128 = fp128.distRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("gavg")) {
            result_fp128 = fp128.gavgRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("log10")) {
            result_fp128 = fp128.log10Raw(a_fp128);
        } else if (funcHash == keccak256("exp10")) {
            result_fp128 = fp128.exp10Raw(a_fp128);
        } else if (funcHash == keccak256("sign")) {
            result_fp128 = fp128.signRaw(a_fp128);
        } else if (funcHash == keccak256("floor")) {
            result_fp128 = fp128.floorRaw(a_fp128);
        } else if (funcHash == keccak256("ceil")) {
            result_fp128 = fp128.ceilRaw(a_fp128);
        } else if (funcHash == keccak256("frac")) {
            result_fp128 = fp128.fracRaw(a_fp128);
        } else if (funcHash == keccak256("cbrt")) {
            result_fp128 = fp128.cbrtRaw(a_fp128);
        } else if (funcHash == keccak256("lerp")) {
            uint256 half_fp128 = uint256(1) << 127;
            result_fp128 = fp128.lerpRaw(a_fp128, b_fp128, half_fp128);
        } else if (funcHash == keccak256("hypot")) {
            result_fp128 = fp128.hypotRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("round")) {
            result_fp128 = fp128.roundRaw(a_fp128);
        } else if (funcHash == keccak256("log2up")) {
            result_fp128 = fp128.log2UpRaw(a_fp128);
        } else if (funcHash == keccak256("gcd")) {
            result_fp128 = fp128.gcdRaw(a_fp128, b_fp128);
        } else if (funcHash == keccak256("factorial")) {
            result_fp128 = fp128.factorialRaw(a_fp128);
        } else if (funcHash == keccak256("lambertw0")) {
            result_fp128 = fp128.lambertW0Raw(a_fp128);
        }
        
        gas_ = g0 - gasleft();
        
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
        } else if (funcHash == keccak256("abs")) {
            result64 = ABDKMath64x64.abs(a64);
        } else if (funcHash == keccak256("inv")) {
            result64 = ABDKMath64x64.inv(a64);
        } else if (funcHash == keccak256("min")) {
            result64 = a64 < b64 ? a64 : b64;
        } else if (funcHash == keccak256("max")) {
            result64 = a64 > b64 ? a64 : b64;
        } else if (funcHash == keccak256("avg")) {
            result64 = ABDKMath64x64.avg(a64, b64);
        } else if (funcHash == keccak256("dist")) {
            result64 = ABDKMath64x64.abs(ABDKMath64x64.sub(a64, b64));
        } else if (funcHash == keccak256("gavg")) {
            result64 = ABDKMath64x64.gavg(a64, b64);
        } else if (funcHash == keccak256("log10")) {
            result64 = ABDKMath64x64.div(ABDKMath64x64.log_2(a64), ABDKMath64x64.log_2(int128(10 << 64)));
        } else if (funcHash == keccak256("exp10")) {
            result64 = ABDKMath64x64.exp_2(ABDKMath64x64.mul(a64, ABDKMath64x64.log_2(int128(10 << 64))));
        } else if (funcHash == keccak256("sign")) {
            // ABDK doesn't have sign, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("floor")) {
            // ABDK doesn't have floor, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("ceil")) {
            // ABDK doesn't have ceil, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("frac")) {
            // ABDK doesn't have frac, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("cbrt")) {
            // ABDK doesn't have cbrt, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("lerp")) {
            // ABDK doesn't have lerp, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("hypot")) {
            // ABDK doesn't have hypot, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("round")) {
            // ABDK doesn't have round, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("log2up")) {
            // ABDK doesn't have log2up, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("gcd")) {
            // ABDK doesn't have gcd, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("factorial")) {
            // ABDK doesn't have factorial, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        } else if (funcHash == keccak256("lambertw0")) {
            // ABDK doesn't have lambertW0, return 0
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
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
        } else if (funcHash == keccak256("abs")) {
            result = uint256(FixedPointMathLib.abs(a_wad));
        } else if (funcHash == keccak256("inv")) {
            result = FixedPointMathLib.divWad(uint256(WAD), ua);
        } else if (funcHash == keccak256("min")) {
            result = uint256(FixedPointMathLib.min(a_wad, b_wad));
        } else if (funcHash == keccak256("max")) {
            result = uint256(FixedPointMathLib.max(a_wad, b_wad));
        } else if (funcHash == keccak256("avg")) {
            result = uint256(FixedPointMathLib.avg(a_wad, b_wad));
        } else if (funcHash == keccak256("dist")) {
            result = uint256(FixedPointMathLib.dist(a_wad, b_wad));
        } else if (funcHash == keccak256("gavg")) {
            result = FixedPointMathLib.sqrtWad(FixedPointMathLib.mulWad(ua, ub));
        } else if (funcHash == keccak256("log10")) {
            // Solady log10 is integer-only (floor), not fixed-point. Use ln(x)/ln(10) instead.
            int256 ln10 = 2302585092994045684;
            result = uint256(FixedPointMathLib.lnWad(a_wad) * WAD / ln10);
        } else if (funcHash == keccak256("exp10")) {
            // Solady doesn't have exp10, use exp10(x) = exp(x * ln(10))
            int256 ln10 = 2302585092994045684; // ln(10) in WAD
            result = uint256(FixedPointMathLib.expWad((a_wad * ln10) / WAD));
        } else if (funcHash == keccak256("sign")) {
            // Solady doesn't have sign, return 0
            result = 0;
        } else if (funcHash == keccak256("floor")) {
            // Solady doesn't have floor for WAD, return 0
            result = 0;
        } else if (funcHash == keccak256("ceil")) {
            // Solady doesn't have ceil for WAD, return 0
            result = 0;
        } else if (funcHash == keccak256("frac")) {
            // Solady doesn't have frac, return 0
            result = 0;
        } else if (funcHash == keccak256("cbrt")) {
            // Solady has cbrtWad
            result = FixedPointMathLib.cbrtWad(ua);
        } else if (funcHash == keccak256("lerp")) {
            // Solady lerp has different signature (5 params), return 0
            result = 0;
        } else if (funcHash == keccak256("hypot")) {
            // Solady doesn't have hypot, return 0
            result = 0;
        } else if (funcHash == keccak256("round")) {
            // Solady doesn't have round for WAD, return 0
            result = 0;
        } else if (funcHash == keccak256("log2up")) {
            // Solady has log2Up but it's integer-only
            result = 0;
        } else if (funcHash == keccak256("gcd")) {
            // Solady has gcd
            result = uint256(FixedPointMathLib.gcd(uint256(a_wad / WAD), uint256(b_wad / WAD))) * uint256(WAD);
        } else if (funcHash == keccak256("factorial")) {
            // Solady has factorial
            uint256 n = uint256(a_wad / WAD);
            result = FixedPointMathLib.factorial(n) * uint256(WAD);
        } else if (funcHash == keccak256("lambertw0")) {
            // Solady has lambertW0Wad
            result = uint256(FixedPointMathLib.lambertW0Wad(a_wad));
        }
        
        gas_ = g0 - gasleft();
        
        digits_ = _matchingDigits(result, exp_wad, 18);
        error_bits_ = _errorBits(result, exp_wad);
    }

    function _runPrb(string memory func, int256 a_wad, int256 b_wad, uint256 exp_wad)
        internal view returns (uint256 gas_, uint256 digits_, int256 error_bits_)
    {
        SD59x18 a = prbWrap(a_wad);
        SD59x18 b = prbWrap(b_wad);

        uint256 g0 = gasleft();
        int256 resultInt;

        bytes32 funcHash = keccak256(bytes(func));
        if (funcHash == keccak256("mul")) {
            resultInt = prbMul(a, b).unwrap();
        } else if (funcHash == keccak256("div")) {
            resultInt = prbDiv(a, b).unwrap();
        } else if (funcHash == keccak256("add")) {
            resultInt = prbAdd(a, b).unwrap();
        } else if (funcHash == keccak256("sub")) {
            resultInt = prbSub(a, b).unwrap();
        } else if (funcHash == keccak256("exp")) {
            resultInt = prbExp(a).unwrap();
        } else if (funcHash == keccak256("exp2")) {
            resultInt = prbExp2(a).unwrap();
        } else if (funcHash == keccak256("ln")) {
            resultInt = prbLn(a).unwrap();
        } else if (funcHash == keccak256("log2")) {
            resultInt = prbLog2(a).unwrap();
        } else if (funcHash == keccak256("sqrt")) {
            resultInt = prbSqrt(a).unwrap();
        } else if (funcHash == keccak256("pow")) {
            resultInt = prbPow(a, b).unwrap();
        } else if (funcHash == keccak256("abs")) {
            resultInt = prbAbs(a).unwrap();
        } else if (funcHash == keccak256("inv")) {
            resultInt = prbInv(a).unwrap();
        } else if (funcHash == keccak256("avg")) {
            resultInt = prbAvg(a, b).unwrap();
        } else if (funcHash == keccak256("gavg")) {
            resultInt = prbGm(a, b).unwrap();
        } else if (funcHash == keccak256("log10")) {
            resultInt = prbLog10(a).unwrap();
        } else if (funcHash == keccak256("floor")) {
            resultInt = prbFloor(a).unwrap();
        } else if (funcHash == keccak256("ceil")) {
            resultInt = prbCeil(a).unwrap();
        } else if (funcHash == keccak256("frac")) {
            resultInt = prbFrac(a).unwrap();
        } else {
            gas_ = 0;
            digits_ = 0;
            error_bits_ = 0;
            return (gas_, digits_, error_bits_);
        }

        gas_ = g0 - gasleft();
        uint256 result = uint256(resultInt);

        digits_ = _matchingDigits(result, exp_wad, 18);
        error_bits_ = _errorBits(result, exp_wad);
    }
    
    // ============================================================================
    // ORACLE
    // ============================================================================
    
    function _oracleMulti(string memory func, int256 a_wad, int256 b_wad)
        internal returns (uint256 fp128_exp, uint256 wad_exp, uint256 abdk_exp)
    {
        bytes32 funcHash = keccak256(bytes(func));
        bool isBinary = (
            funcHash == keccak256("mul") || funcHash == keccak256("div") ||
            funcHash == keccak256("add") || funcHash == keccak256("sub") ||
            funcHash == keccak256("pow") || funcHash == keccak256("min") ||
            funcHash == keccak256("max") || funcHash == keccak256("avg") ||
            funcHash == keccak256("dist") || funcHash == keccak256("gavg") ||
            funcHash == keccak256("lerp") || funcHash == keccak256("hypot") ||
            funcHash == keccak256("gcd")
        );
        string[] memory cmd = new string[](isBinary ? 5 : 4);
        cmd[0] = "python3";
        cmd[1] = "scripts/fp128_oracle.py";
        cmd[2] = string.concat("multi_", func);
        cmd[3] = vm.toString(a_wad);
        if (isBinary) {
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
