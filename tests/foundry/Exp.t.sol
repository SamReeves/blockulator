// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/**
 * @title Exp Calculator Interface
 * @notice Interface for the Huff-based exponential calculator
 */
interface IExp {
    function calculate(uint256 x) external pure returns (uint256);
    function get_constant() external pure returns (uint256);
}

/**
 * @title ExpTest
 * @notice Tests for Huff FP-based exponential calculator
 * @dev Tests compare Huff output against high-precision Python calculations
 */
contract ExpTest is Test {
    IExp public expCalculator;
    
    // Fixed-point scale (18 decimals)
    uint256 constant SCALE = 1e18;
    
    // e constant in fixed18 format (2.718281828459045235)
    uint256 constant E = 2718281828459045235;
    
    // Tolerance for comparisons (0.01% = 1e14 out of 1e18)
    uint256 constant TOLERANCE = 1e14;
    
    function setUp() public {
        string memory hexBytecode = vm.readFile("contracts/build/huff/exp.bin");
        
        // Remove any whitespace/newlines
        bytes memory cleaned = bytes(hexBytecode);
        uint256 cleanLen = 0;
        for (uint256 i = 0; i < cleaned.length; i++) {
            if (cleaned[i] != 0x0a && cleaned[i] != 0x0d && cleaned[i] != 0x20) {
                cleaned[cleanLen++] = cleaned[i];
            }
        }
        
        // Resize
        bytes memory hexClean = new bytes(cleanLen);
        for (uint256 i = 0; i < cleanLen; i++) {
            hexClean[i] = cleaned[i];
        }
        
        bytes memory bytecode = vm.parseBytes(string(abi.encodePacked("0x", hexClean)));
        
        emit log_named_uint("Bytecode length", bytecode.length);
        
        address deployed;
        assembly {
            deployed := create(0, add(bytecode, 0x20), mload(bytecode))
        }
        require(deployed != address(0), "Huff contract deployment failed");
        
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(deployed)
        }
        emit log_named_uint("Deployed code size", codeSize);
        require(codeSize > 0, "Deployed contract has no code");
        
        expCalculator = IExp(deployed);
    }
    
    /**
     * @notice Helper to check if two values are approximately equal
     */
    function assertApproxEqual(uint256 actual, uint256 expected, uint256 tolerance, string memory message) internal {
        uint256 diff = actual > expected ? actual - expected : expected - actual;
        uint256 maxDiff = (expected * tolerance) / SCALE;
        
        if (diff > maxDiff) {
            emit log_named_uint("  Actual", actual);
            emit log_named_uint("  Expected", expected);
            emit log_named_uint("  Diff", diff);
            emit log_named_uint("  Max allowed diff", maxDiff);
            fail(message);
        }
    }
    
    /**
     * @notice Test e^0 = 1
     */
    function test_Exp_Zero() public {
        uint256 input = 0;
        uint256 expected = 1 * SCALE; // 1.0
        
        uint256 result = expCalculator.calculate(input);
        
        assertEq(result, expected, "e^0 should equal 1.0");
    }
    
    /**
     * @notice Test e^1 = e
     */
    function test_Exp_One() public {
        uint256 input = 1 * SCALE; // 1.0
        uint256 expected = E; // e = 2.718281828459045235
        
        uint256 result = expCalculator.calculate(input);
        
        assertApproxEqual(result, expected, TOLERANCE, "e^1 should equal e");
    }
    
    /**
     * @notice Test e^0.5
     */
    function test_Exp_Half() public {
        uint256 input = 5e17; // 0.5
        uint256 expected = 1648721270700128146; // e^0.5
        
        uint256 result = expCalculator.calculate(input);
        
        assertApproxEqual(result, expected, TOLERANCE, "e^0.5 should be approximately correct");
    }
    
    /**
     * @notice Test e^2
     */
    function test_Exp_Two() public {
        uint256 input = 2 * SCALE; // 2.0
        uint256 expected = 7389056098930650227; // e^2
        
        uint256 result = expCalculator.calculate(input);
        
        assertApproxEqual(result, expected, TOLERANCE, "e^2 should be approximately correct");
    }
    
    /**
     * @notice Test e^9.5 (high precision, needs all 19 iterations)
     */
    function test_Exp_NinePointFive() public {
        uint256 input = 95e17; // 9.5
        uint256 expected = 13359726829661872275901; // e^9.5
        
        uint256 result = expCalculator.calculate(input);
        
        assertApproxEqual(result, expected, TOLERANCE, "e^9.5 should be approximately correct");
    }
    
    /**
     * @notice Test get_constant returns e
     */
    function test_GetConstant() public {
        uint256 result = expCalculator.get_constant();
        
        assertApproxEqual(result, E, TOLERANCE, "get_constant should return e");
    }
    
    /**
     * @notice Comprehensive precision test across full input range
     * @dev Reference values computed to 60 decimal places with Python
     */
    function test_Exp_Comprehensive() public {
        uint256[2][] memory vectors = new uint256[2][](25);
        uint256 idx = 0;
        
        // Reference values computed to 60 decimal places
        vectors[idx++] = [uint256(0), 1000000000000000000]; // e^0
        vectors[idx++] = [uint256(1000000000000000), 1001000500166708341]; // e^0.001
        vectors[idx++] = [uint256(10000000000000000), 1010050167084168057]; // e^0.01
        vectors[idx++] = [uint256(100000000000000000), 1105170918075647624]; // e^0.1
        vectors[idx++] = [uint256(500000000000000000), 1648721270700128146]; // e^0.5
        vectors[idx++] = [uint256(990000000000000000), 2691234472349262289]; // e^0.99
        vectors[idx++] = [uint256(1000000000000000000), 2718281828459045235]; // e^1.0
        vectors[idx++] = [uint256(1500000000000000000), 4481689070338064822]; // e^1.5
        vectors[idx++] = [uint256(2000000000000000000), 7389056098930650227]; // e^2.0
        vectors[idx++] = [uint256(3000000000000000000), 20085536923187667740]; // e^3.0
        vectors[idx++] = [uint256(3141590000000000000), 23140631226954963164]; // e^3.14159
        vectors[idx++] = [uint256(5000000000000000000), 148413159102576603421]; // e^5.0
        vectors[idx++] = [uint256(7000000000000000000), 1096633158428458599263]; // e^7.0
        vectors[idx++] = [uint256(9000000000000000000), 8103083927575384007709]; // e^9.0
        vectors[idx++] = [uint256(9500000000000000000), 13359726829661872275901]; // e^9.5
        vectors[idx++] = [uint256(9900000000000000000), 19930370438230289490560]; // e^9.9
        vectors[idx++] = [uint256(9990000000000000000), 21807298798230126461500]; // e^9.99
        vectors[idx++] = [uint256(9999000000000000000), 22004450338574647157216]; // e^9.999
        vectors[idx++] = [uint256(9999900000000000000), 22024263258355893833482]; // e^9.9999
        vectors[idx++] = [uint256(9999990000000000000), 22026245531250088068464]; // e^9.99999
        vectors[idx++] = [uint256(9999999000000000000), 22026443768351934939467]; // e^9.999999
        vectors[idx++] = [uint256(9999999900000000000), 22026463592160247168611]; // e^9.9999999
        vectors[idx++] = [uint256(9999999990000000000), 22026465574542059670214]; // e^9.99999999
        vectors[idx++] = [uint256(9999999999000000000), 22026465772780250733164]; // e^9.999999999
        vectors[idx++] = [uint256(9999999999999999999), 22026465794806716494931]; // e^9.999999999999999999
        
        uint256 maxULP = 0;
        uint256 worstCaseInput = 0;
        
        for (uint256 i = 0; i < vectors.length; i++) {
            uint256 input = vectors[i][0];
            uint256 expected = vectors[i][1];
            
            uint256 result = expCalculator.calculate(input);
            
            uint256 ulpError = result > expected ? result - expected : expected - result;
            
            if (ulpError > maxULP) {
                maxULP = ulpError;
                worstCaseInput = input;
            }
            
            emit log_named_uint("Input (x*1e18)", input);
            emit log_named_uint("  Result", result);
            emit log_named_uint("  Expected", expected);
            emit log_named_uint("  ULP error", ulpError);
            
            // Assert within 10 ULP tolerance (adjustable based on findings)
            require(ulpError <= 10, string(abi.encodePacked("ULP error too high at index ", vm.toString(i))));
        }
        
        emit log_string("\n=== PRECISION SUMMARY ===");
        emit log_named_uint("Max ULP error", maxULP);
        emit log_named_uint("Worst case input", worstCaseInput);
    }
    
    /**
     * @notice Test that very small inputs don't cause issues
     */
    function test_Exp_VerySmall() public {
        uint256 input = 1e10; // 0.0000000001 (very small)
        uint256 expected = SCALE; // Should be approximately 1.0
        
        uint256 result = expCalculator.calculate(input);
        
        // Very small exponents should give result very close to 1
        assertApproxEqual(result, expected, 1e15, "e^(very small) should be approximately 1");
    }
}
