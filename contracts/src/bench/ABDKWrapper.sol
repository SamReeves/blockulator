// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../../lib/abdk-libraries-solidity/ABDKMath64x64.sol";

/// @title ABDK Math Wrapper
/// @notice Wrapper for ABDKMath64x64 to match fp127 interface
/// @dev Converts between fixed18 and 64.64 fixed-point format
contract ABDKWrapper {
    using ABDKMath64x64 for int128;
    
    int256 constant FIXED18_SCALE = 1e18;
    
    /// @notice Convert fixed18 to ABDK 64.64 format
    function fromFixed18(int256 value) public pure returns (int128) {
        // Convert fixed18 to 64.64: divide by 10^18, multiply by 2^64
        // = (value * 2^64) / 10^18
        return ABDKMath64x64.fromInt(value) / int128(FIXED18_SCALE);
    }
    
    /// @notice Convert ABDK 64.64 to fixed18 format
    function toFixed18(int128 value) public pure returns (int256) {
        // Convert 64.64 to fixed18: divide by 2^64, multiply by 10^18
        return int256(value) * FIXED18_SCALE / (1 << 64);
    }
    
    /// @notice Multiply two ABDK 64.64 values
    function mulRaw(int128 a, int128 b) public pure returns (int128) {
        return ABDKMath64x64.mul(a, b);
    }
    
    /// @notice Divide two ABDK 64.64 values
    function divRaw(int128 a, int128 b) public pure returns (int128) {
        return ABDKMath64x64.div(a, b);
    }
    
    /// @notice Multiply two fixed18 values
    function mul(int256 a, int256 b) public pure returns (int256) {
        int128 aAbdk = fromFixed18(a);
        int128 bAbdk = fromFixed18(b);
        int128 result = ABDKMath64x64.mul(aAbdk, bAbdk);
        return toFixed18(result);
    }
    
    /// @notice Divide two fixed18 values
    function div(int256 a, int256 b) public pure returns (int256) {
        int128 aAbdk = fromFixed18(a);
        int128 bAbdk = fromFixed18(b);
        int128 result = ABDKMath64x64.div(aAbdk, bAbdk);
        return toFixed18(result);
    }

    /// @notice Add two fixed18 values
    function add(int256 a, int256 b) public pure returns (int256) {
        return a + b;
    }

    /// @notice Subtract two fixed18 values
    function sub(int256 a, int256 b) public pure returns (int256) {
        return a - b;
    }

    /// @notice Exponential function (raw ABDK format)
    function expRaw(int128 x) public pure returns (int128) {
        return ABDKMath64x64.exp(x);
    }

    /// @notice Natural logarithm (raw ABDK format)
    function lnRaw(int128 x) public pure returns (int128) {
        return ABDKMath64x64.ln(x);
    }

    /// @notice Square root (raw ABDK format)
    function sqrtRaw(int128 x) public pure returns (int128) {
        return ABDKMath64x64.sqrt(x);
    }
}
