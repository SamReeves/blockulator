// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/**
 * @title Two Iteration Exp Test
 * @notice Test exactly two iterations of the exp product rule
 * @dev Level 3: Verify digit extraction works for second iteration
 */
interface ITwoIterExp {
    function calculate(uint256 x) external pure returns (uint256);
}

contract TwoIterExpTest is Test {
    ITwoIterExp public expCalculator;
    
    uint256 constant SCALE = 1e18;
    uint256 constant E = 2718281828459045235;
    
    function setUp() public {
        string memory hexBytecode = vm.readFile("contracts/build/huff/test_two_iter_exp.bin");
        
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
        
        expCalculator = ITwoIterExp(deployed);
    }
    
    function test_TwoIter_Zero() public {
        uint256 result = expCalculator.calculate(0);
        assertEq(result, SCALE, "e^0 should equal 1.0");
    }
    
    function test_TwoIter_One() public {
        uint256 result = expCalculator.calculate(SCALE);
        assertEq(result, E, "e^1 should equal e (two iter)");
    }
    
    function test_TwoIter_Two() public {
        uint256 expected = 7389056098930650227;
        uint256 result = expCalculator.calculate(2 * SCALE);
        emit log_named_uint("Result", result);
        assertEq(result, expected, "e^2 should be correct (two iter)");
    }
    
    function test_TwoIter_Three() public {
        uint256 expected = 20085536923187667740;
        uint256 result = expCalculator.calculate(3 * SCALE);
        assertEq(result, expected, "e^3 should be correct (two iter)");
    }
    
    function test_TwoIter_Four() public {
        uint256 expected = 54598150033144239078;
        uint256 result = expCalculator.calculate(4 * SCALE);
        assertEq(result, expected, "e^4 should be correct (two iter)");
    }
}
