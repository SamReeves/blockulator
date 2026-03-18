// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FP127Math Wrapper
/// @notice Wrapper library that delegates to Huff-compiled FP127 contract
library FP127Math {
    // Storage slot for the FP127 contract address (EIP-1967 style)
    bytes32 private constant FP127_ADDRESS_SLOT = 
        bytes32(uint256(keccak256("fp127.address")) - 1);
    
    /// @notice Set the address of the FP127 Huff contract
    /// @dev Must be called before using any functions that require external calls
    function setAddress(address fp127) internal {
        bytes32 slot = FP127_ADDRESS_SLOT;
        assembly {
            sstore(slot, fp127)
        }
    }
    
    /// @notice Get the configured FP127 contract address
    function getAddress() internal view returns (address) {
        bytes32 slot = FP127_ADDRESS_SLOT;
        address addr;
        assembly {
            addr := sload(slot)
        }
        require(addr != address(0), "FP127 address not set");
        return addr;
    }
    
    function mul(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("mulRaw(uint256,uint256)", a, b)
        );
        require(success, "mul failed");
        return abi.decode(data, (uint256));
    }
    
    function div(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
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
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("expRaw(uint256)", x)
        );
        require(success, "exp failed");
        return abi.decode(data, (uint256));
    }
    
    function exp2(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("exp2Raw(uint256)", x)
        );
        require(success, "exp2 failed");
        return abi.decode(data, (uint256));
    }
    
    function ln(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("lnRaw(uint256)", x)
        );
        require(success, "ln failed");
        return abi.decode(data, (uint256));
    }
    
    function sqrt(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("sqrtRaw(uint256)", x)
        );
        require(success, "sqrt failed");
        return abi.decode(data, (uint256));
    }
    
    function log2(uint256 x) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("log2Raw(uint256)", x)
        );
        require(success, "log2 failed");
        return abi.decode(data, (uint256));
    }
    
    function pow(uint256 x, uint256 y) internal view returns (uint256) {
        (bool success, bytes memory data) = getAddress().staticcall(
            abi.encodeWithSignature("powRaw(uint256,uint256)", x, y)
        );
        require(success, "pow failed");
        return abi.decode(data, (uint256));
    }
    
    /// @notice Convert signed fixed18 to 127.128 format
    /// @dev Uses signed division to match Huff implementation
    function fromFixed18(uint256 wad) internal pure returns (uint256) {
        // Use assembly to match Huff's sdiv behavior
        uint256 result;
        assembly {
            result := sdiv(shl(128, wad), 1000000000000000000)
        }
        return result;
    }
    
    /// @notice Convert 127.128 format to signed fixed18
    /// @dev Uses signed arithmetic to match Huff implementation exactly
    function toFixed18(uint256 fp) internal pure returns (uint256) {
        // Match Huff's implementation exactly using assembly
        uint256 result;
        assembly {
            // fp127_hi = fp >> 128 (signed)
            let hi := sar(128, fp)
            // fp127_hi * 1e18
            let hiPart := mul(hi, 1000000000000000000)
            
            // fp127_lo = fp & MASK128
            let lo := and(fp, sub(shl(128, 1), 1))
            // (fp127_lo * 1e18) >> 128 (unsigned)
            let loPart := shr(128, mul(lo, 1000000000000000000))
            
            // result = hiPart + loPart
            result := add(hiPart, loPart)
        }
        return result;
    }
}
