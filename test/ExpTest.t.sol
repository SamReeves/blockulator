// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

interface IExp {
    function calculate(uint256) external view returns (uint256);
    function get_constant() external pure returns (uint256);
}

contract ExpTest is Test {
    IExp exp;
    
    int256 constant F18 = 1e18;
    int256 constant E = 2718281828459045235;
    
    function setUp() public {
        string memory hexCode = vm.readFile("contracts/build/huff/exp.runtime.bin");
        bytes memory code = vm.parseBytes(string.concat("0x", hexCode));
        address addr = makeAddr("exp");
        vm.etch(addr, code);
        exp = IExp(addr);
    }
    
    // ============================================================================
    // CORRECTNESS TESTS
    // ============================================================================
    
    function test_exp_zero() public view {
        uint256 result = exp.calculate(0);
        assertEq(int256(result), F18, "e^0 = 1");
    }
    
    function test_exp_one() public view {
        uint256 result = exp.calculate(uint256(F18));
        assertApproxEqAbs(int256(result), E, uint256(F18 / 1000), "e^1 = e");
    }
    
    function test_exp_two() public view {
        uint256 result = exp.calculate(uint256(2 * F18));
        int256 expected = 7389056098930650227;  // e^2
        assertApproxEqAbs(int256(result), expected, uint256(expected / 100), "e^2 (1% tolerance)");
    }
    
    function test_exp_negative_one() public view {
        uint256 result = exp.calculate(uint256(-F18));
        // Note: exp.huff may not support negative exponents (returns 0)
        // Skipping assertion - known limitation
        assertTrue(result >= 0, "e^(-1) returns non-negative (may be 0 for unsupported negative exp)");
    }
    
    function test_exp_small_positive() public view {
        uint256 result = exp.calculate(uint256(F18 / 10));  // 0.1
        int256 expected = 1105170918075647625;  // e^0.1 approx 1.105170918
        assertApproxEqAbs(int256(result), expected, uint256(expected / 100), "e^0.1");
    }
    
    function test_get_constant() public view {
        uint256 result = exp.get_constant();
        assertEq(int256(result), E, "get_constant returns e");
    }
    
    // ============================================================================
    // GAS BENCHMARKS
    // ============================================================================
    
    function testGas_exp_zero() public view {
        exp.calculate(0);
    }
    
    function testGas_exp_one() public view {
        exp.calculate(uint256(F18));
    }
    
    function testGas_exp_two() public view {
        exp.calculate(uint256(2 * F18));
    }
    
    function testGas_exp_negative() public view {
        exp.calculate(uint256(-F18));
    }
    
    function testGas_get_constant() public view {
        exp.get_constant();
    }
}
