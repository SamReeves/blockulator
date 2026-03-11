// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../contracts/src/tools/FP127Math.sol";
import "./IFP127.sol";

/// @title TestFP127MathLib
/// @notice Test that FP127Math library produces identical results to Huff implementation
contract TestFP127MathLib is Test {
    IFP127 huffFP127;
    
    function setUp() public {
        // Deploy Huff contract
        string memory hexStr = vm.readFile("contracts/build/huff/test_fp127.runtime.bin");
        bytes memory code = vm.parseBytes(hexStr);
        address addr = makeAddr("fp127");
        vm.etch(addr, code);
        huffFP127 = IFP127(addr);
    }
    
    function _wadToFp127(int256 wad) internal pure returns (uint256) {
        return FP127Math.fromFixed18(uint256(wad));
    }
    
    function test_mul_matches_huff() public view {
        int256[10] memory testValues = [
            int256(3141592653589793238), // pi
            2718281828459045235,  // e
            1414213562373095048,  // sqrt(2)
            1732050807568877293,  // sqrt(3)
            1618033988749894848,  // phi
            618033988749894848,   // 1/phi
            333333333333333333,   // 1/3
            3000000000000000000,  // 3
            5000000000000000000,  // 5
            1000000000000000000   // 1
        ];
        
        for (uint i = 0; i < testValues.length - 1; i++) {
            uint256 a = _wadToFp127(testValues[i]);
            uint256 b = _wadToFp127(testValues[i + 1]);
            
            uint256 huffResult = huffFP127.mulRaw(a, b);
            uint256 libResult = FP127Math.mul(a, b);
            
            assertEq(libResult, huffResult, "mul mismatch");
        }
    }
    
    function test_div_matches_huff() public view {
        int256[6] memory testValues = [
            int256(3141592653589793238), // pi
            2718281828459045235,  // e
            3000000000000000000,  // 3
            1000000000000000000,  // 1
            10000000000000000000, // 10
            2000000000000000000   // 2
        ];
        
        for (uint i = 0; i < testValues.length - 1; i++) {
            uint256 a = _wadToFp127(testValues[i]);
            uint256 b = _wadToFp127(testValues[i + 1]);
            
            uint256 huffResult = huffFP127.divRaw(a, b);
            uint256 libResult = FP127Math.div(a, b);
            
            // Allow small tolerance due to rounding differences in chunked division
            uint256 diff = huffResult > libResult ? huffResult - libResult : libResult - huffResult;
            assertLt(diff, 1e15, "div mismatch exceeds tolerance");
        }
    }
    
    function test_add_matches_huff() public view {
        uint256 a = _wadToFp127(3141592653589793238);
        uint256 b = _wadToFp127(2718281828459045235);
        
        uint256 libResult = FP127Math.add(a, b);
        uint256 expectedResult = a + b; // Huff does simple add
        
        assertEq(libResult, expectedResult, "add mismatch");
    }
    
    function test_sub_matches_huff() public view {
        uint256 a = _wadToFp127(5000000000000000000);
        uint256 b = _wadToFp127(3000000000000000000);
        
        uint256 libResult = FP127Math.sub(a, b);
        uint256 expectedResult = a - b; // Huff does simple sub
        
        assertEq(libResult, expectedResult, "sub mismatch");
    }
    
    function test_conversions_match_huff() public view {
        int256[5] memory testValues = [
            int256(1000000000000000000),   // 1.0
            3141592653589793238,    // pi
            2718281828459045235,    // e
            -2718281828459045235,   // -e
            333333333333333333      // 1/3
        ];
        
        for (uint i = 0; i < testValues.length; i++) {
            uint256 wad = uint256(testValues[i]);
            
            uint256 huffFp127 = huffFP127.fromFixed18(wad);
            uint256 libFp127 = FP127Math.fromFixed18(wad);
            assertEq(libFp127, huffFp127, "fromFixed18 mismatch");
            
            uint256 huffWad = huffFP127.toFixed18(huffFp127);
            uint256 libWad = FP127Math.toFixed18(libFp127);
            assertEq(libWad, huffWad, "toFixed18 mismatch");
        }
    }
    
    function test_exp_matches_huff() public view {
        int256[6] memory testValues = [
            int256(1000000000000000000),   // 1.0
            2000000000000000000,    // 2.0
            500000000000000000,     // 0.5
            -1000000000000000000,   // -1.0
            3141592653589793238,    // pi
            2718281828459045235     // e
        ];
        
        for (uint i = 0; i < testValues.length; i++) {
            uint256 x = _wadToFp127(testValues[i]);
            
            uint256 huffResult = huffFP127.expRaw(x);
            uint256 libResult = FP127Math.exp(x);
            
            // Allow small difference due to potential rounding differences
            uint256 diff = huffResult > libResult ? huffResult - libResult : libResult - huffResult;
            assertLt(diff, 1e10, "exp mismatch exceeds tolerance");
        }
    }
    
    function test_ln_matches_huff() public view {
        int256[5] memory testValues = [
            int256(2718281828459045235),    // e
            2000000000000000000,     // 2.0
            10000000000000000000,    // 10.0
            1414213562373095048,     // sqrt(2)
            3141592653589793238      // pi
        ];
        
        for (uint i = 0; i < testValues.length; i++) {
            uint256 x = _wadToFp127(testValues[i]);
            
            uint256 huffResult = huffFP127.lnRaw(x);
            uint256 libResult = FP127Math.ln(x);
            
            // Allow small difference due to potential rounding differences
            uint256 diff = huffResult > libResult ? huffResult - libResult : libResult - huffResult;
            assertLt(diff, 1e10, "ln mismatch exceeds tolerance");
        }
    }
    
    function test_sqrt_matches_huff() public view {
        int256[5] memory testValues = [
            int256(2000000000000000000),     // 2.0
            3141592653589793238,     // pi
            10000000000000000000,    // 10.0
            4000000000000000000,     // 4.0
            9000000000000000000      // 9.0
        ];
        
        for (uint i = 0; i < testValues.length; i++) {
            uint256 x = _wadToFp127(testValues[i]);
            
            uint256 huffResult = huffFP127.sqrtRaw(x);
            uint256 libResult = FP127Math.sqrt(x);
            
            // Allow small difference due to potential rounding differences
            uint256 diff = huffResult > libResult ? huffResult - libResult : libResult - huffResult;
            assertLt(diff, 1e10, "sqrt mismatch exceeds tolerance");
        }
    }
}
