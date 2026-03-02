// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/**
 * @title One Iteration Exp Test
 * @notice Test exactly one iteration of the exp product rule
 * @dev Level 2: Verify digit extraction, table lookup, and scaled multiply work together
 */
interface IOneIterExp {
    function calculate(uint256 x) external pure returns (uint256);
}

contract OneIterExpTest is Test {
    IOneIterExp public expCalculator;
    
    uint256 constant SCALE = 1e18;
    uint256 constant E = 2718281828459045235;
    
    function setUp() public {
        string memory hexBytecode = vm.readFile("contracts/build/huff/test_one_iter_exp.bin");
        
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
        
        expCalculator = IOneIterExp(deployed);
    }
    
    function test_OneIter_Zero() public {
        uint256 result = expCalculator.calculate(0);
        assertEq(result, SCALE, "e^0 should equal 1.0 (one iter)");
    }
    
    function test_OneIter_One() public {
        uint256 result = expCalculator.calculate(SCALE);
        assertEq(result, E, "e^1 should equal e (one iter)");
    }
    
    function test_OneIter_Two() public {
        uint256 expected = 7389056098930650227;
        uint256 result = expCalculator.calculate(2 * SCALE);
        assertEq(result, expected, "e^2 should be correct (one iter)");
    }
    
    function test_OneIter_Three() public {
        uint256 expected = 20085536923187667740;
        uint256 result = expCalculator.calculate(3 * SCALE);
        assertEq(result, expected, "e^3 should be correct (one iter)");
    }
    
    function test_OneIter_Nine() public {
        uint256 expected = 8103083927575384007709;
        uint256 result = expCalculator.calculate(9 * SCALE);
        assertEq(result, expected, "e^9 should be correct (one iter)");
    }
    
    function test_OneIter_Half() public {
        uint256 expected = SCALE; // One iteration can't handle 0.5, should return 1.0
        uint256 result = expCalculator.calculate(5e17);
        emit log_named_uint("Result", result);
        assertEq(result, expected, "e^0.5 with one iter should be 1.0 (d=0)");
    }
}
