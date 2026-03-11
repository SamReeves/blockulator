// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FP127Math Wrapper
/// @notice Wrapper library that delegates to Huff-compiled FP127 contract
library FP127Math {
    address constant FP127_ADDRESS = address(0x4650313238); // "FP127" in hex
    
    function mul(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("mulRaw(uint256,uint256)", a, b)
        );
        require(success, "mul failed");
        return abi.decode(data, (uint256));
    }
    
    function div(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("divRaw(uint256,uint256)", a, b)
        );
        require(success, "div failed");
        return abi.decode(data, (uint256));
    }
    
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }
    
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }
    
    function exp(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("expRaw(uint256)", x)
        );
        require(success, "exp failed");
        return abi.decode(data, (uint256));
    }
    
    function exp2(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("exp2Raw(uint256)", x)
        );
        require(success, "exp2 failed");
        return abi.decode(data, (uint256));
    }
    
    function ln(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("lnRaw(uint256)", x)
        );
        require(success, "ln failed");
        return abi.decode(data, (uint256));
    }
    
    function sqrt(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("sqrtRaw(uint256)", x)
        );
        require(success, "sqrt failed");
        return abi.decode(data, (uint256));
    }
    
    function log2(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("log2Raw(uint256)", x)
        );
        require(success, "log2 failed");
        return abi.decode(data, (uint256));
    }
    
    function pow(uint256 x, uint256 y) internal view returns (uint256) {
        (bool success, bytes memory data) = FP127_ADDRESS.staticcall(
            abi.encodeWithSignature("powRaw(uint256,uint256)", x, y)
        );
        require(success, "pow failed");
        return abi.decode(data, (uint256));
    }
    
    function fromFixed18(uint256 wad) internal pure returns (uint256) {
        // (wad << 128) / 1e18
        return (wad << 128) / 1e18;
    }
    
    function toFixed18(uint256 fp) internal pure returns (uint256) {
        // Split to avoid overflow: (fp_hi * 1e18) + ((fp_lo * 1e18) >> 128)
        uint256 hi = fp >> 128;
        uint256 lo = fp & ((1 << 128) - 1);
        return (hi * 1e18) + ((lo * 1e18) >> 128);
    }
}
