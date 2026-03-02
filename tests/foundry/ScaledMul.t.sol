// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/**
 * @title Scaled Multiply Test
 * @notice Test basic scaled multiplication (a * b) / SCALE
 * @dev Level 0: Verify SCALE constant and division semantics are correct
 */
interface IScaledMul {
    function calculate(uint256 a, uint256 b) external pure returns (uint256);
}

contract ScaledMulTest is Test {
    IScaledMul public scaledMul;
    
    // SCALE = 10^36
    uint256 constant SCALE = 1000000000000000000000000000000000000;
    
    function setUp() public {
        string memory hexBytecode = vm.readFile("contracts/build/huff/test_basic_math.bin");
        
        bytes memory cleaned = bytes(hexBytecode);
        uint256 cleanLen = 0;
        for (uint256 i = 0; i < cleaned.length; i++) {
            if (cleaned[i] != 0x0a && cleaned[i] != 0x0d && cleaned[i] != 0x20) {
                cleaned[cleanLen++] = cleaned[i];
            }
        }
        
        bytes memory hexClean = new bytes(cleanLen);
        for (uint256 i = 0; i < cleanLen; i++) {
            hexClean[i] = cleaned[i];
        }
        
        bytes memory bytecode = vm.parseBytes(string(abi.encodePacked("0x", hexClean)));
        
        address deployed;
        assembly {
            deployed := create(0, add(bytecode, 0x20), mload(bytecode))
        }
        require(deployed != address(0), "Deployment failed");
        
        scaledMul = IScaledMul(deployed);
    }
    
    function test_Mul_OneOne() public {
        uint256 result = scaledMul.calculate(SCALE, SCALE);
        assertEq(result, SCALE, "1.0 * 1.0 should equal 1.0");
    }
    
    function test_Mul_OneTwo() public {
        uint256 result = scaledMul.calculate(SCALE, 2 * SCALE);
        assertEq(result, 2 * SCALE, "1.0 * 2.0 should equal 2.0");
    }
    
    function test_Mul_TwoTwo() public {
        uint256 result = scaledMul.calculate(2 * SCALE, 2 * SCALE);
        assertEq(result, 4 * SCALE, "2.0 * 2.0 should equal 4.0");
    }
    
    function test_Mul_EScale() public {
        uint256 e_scaled36 = 2718281828459045235360287471352662497757;
        uint256 result = scaledMul.calculate(e_scaled36, SCALE);
        assertEq(result, e_scaled36, "e * 1.0 should equal e");
    }
    
    function test_Mul_ScaleE() public {
        uint256 e_scaled36 = 2718281828459045235360287471352662497757;
        uint256 result = scaledMul.calculate(SCALE, e_scaled36);
        assertEq(result, e_scaled36, "1.0 * e should equal e");
    }
}
