// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/**
 * @title Table Lookup Test
 * @notice Test EXP_TABLE_LOOKUP macro with regenerated scaled-integer table
 * @dev Level 1: Verify table data and lookup mechanism work correctly
 */
interface ITableLookup {
    function lookup(uint256 i, uint256 d) external pure returns (uint256);
}

contract TableLookupTest is Test {
    ITableLookup public tableLookup;
    
    // SCALE = 10^36
    uint256 constant SCALE = 1000000000000000000000000000000000000;
    
    function setUp() public {
        string memory hexBytecode = vm.readFile("contracts/build/huff/test_table_lookup.bin");
        
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
        
        tableLookup = ITableLookup(deployed);
    }
    
    function test_Lookup_0_0() public {
        uint256 result = tableLookup.lookup(0, 0);
        assertEq(result, SCALE, "TABLE[0][0] should be 1e36 (e^0)");
    }
    
    function test_Lookup_0_1() public {
        uint256 expected = 2718281828459045235360287471352662497;
        uint256 result = tableLookup.lookup(0, 1);
        assertEq(result, expected, "TABLE[0][1] should be ~2.718e36 (e^1)");
    }
    
    function test_Lookup_0_2() public {
        uint256 expected = 7389056098930650227230427460575007813;
        uint256 result = tableLookup.lookup(0, 2);
        assertEq(result, expected, "TABLE[0][2] should be ~7.389e36 (e^2)");
    }
    
    function test_Lookup_1_5() public {
        uint256 expected = 1648721270700128146848650787814163571;
        uint256 result = tableLookup.lookup(1, 5);
        assertEq(result, expected, "TABLE[1][5] should be ~1.6487e36 (e^0.5)");
    }
    
    function test_Lookup_0_9() public {
        uint256 expected = 8103083927575384007709996689432759965011;
        uint256 result = tableLookup.lookup(0, 9);
        assertEq(result, expected, "TABLE[0][9] should be ~8.103e36 (e^9)");
    }
    
    function test_Lookup_18_0() public {
        uint256 result = tableLookup.lookup(18, 0);
        assertEq(result, SCALE, "TABLE[18][0] should be 1e36 (e^0)");
    }
    
    function test_Lookup_18_9() public {
        uint256 expected = 1000000000000000009000000000000000040;
        uint256 result = tableLookup.lookup(18, 9);
        assertEq(result, expected, "TABLE[18][9] should be ~1e36 * (1 + 9e-18)");
    }
}
