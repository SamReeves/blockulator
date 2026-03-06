// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../../lib/solady/src/utils/FixedPointMathLib.sol";

/// @title Solady Wrapper
/// @notice Wrapper for Solady's FixedPointMathLib to match fp128 interface
/// @dev Uses WAD (18 decimals) for fixed-point arithmetic
contract SoladyWrapper {
    using FixedPointMathLib for uint256;
    
    int256 constant FIXED18_SCALE = 1e18;
    
    /// @notice Multiply two fixed18 values using Solady
    function mul(int256 a, int256 b) public pure returns (int256) {
        // Solady's mulWad handles the scaling automatically
        // For signed values, we need to handle signs manually
        bool negative = (a < 0) != (b < 0);
        uint256 absA = uint256(a < 0 ? -a : a);
        uint256 absB = uint256(b < 0 ? -b : b);
        
        uint256 result = absA.mulWad(absB);
        
        return negative ? -int256(result) : int256(result);
    }
    
    /// @notice Divide two fixed18 values using Solady
    function div(int256 a, int256 b) public pure returns (int256) {
        require(b != 0, "Division by zero");
        
        // Solady's divWad handles the scaling automatically
        bool negative = (a < 0) != (b < 0);
        uint256 absA = uint256(a < 0 ? -a : a);
        uint256 absB = uint256(b < 0 ? -b : b);
        
        uint256 result = absA.divWad(absB);
        
        return negative ? -int256(result) : int256(result);
    }
    
    /// @notice Multiply using raw mulDiv for comparison
    function mulRaw(uint256 a, uint256 b) public pure returns (uint256) {
        return FixedPointMathLib.mulDiv(a, b, uint256(FIXED18_SCALE));
    }
    
    /// @notice Divide using raw mulDiv for comparison
    function divRaw(uint256 a, uint256 b) public pure returns (uint256) {
        return FixedPointMathLib.mulDiv(a, uint256(FIXED18_SCALE), b);
    }

    /// @notice Add two fixed18 values
    function add(int256 a, int256 b) public pure returns (int256) {
        return a + b;
    }

    /// @notice Subtract two fixed18 values
    function sub(int256 a, int256 b) public pure returns (int256) {
        return a - b;
    }
}
