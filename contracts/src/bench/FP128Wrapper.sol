// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FP128 Wrapper
/// @notice Wrapper for Huff fp128 implementation to match fixed18 interface
/// @dev Deploys and calls the Huff fp128 contract
contract FP128Wrapper {
    address public immutable huffContract;

    constructor(address _huffContract) {
        huffContract = _huffContract;
    }

    function mul(int256 a, int256 b) external view returns (int256) {
        (bool ok, bytes memory ret) = huffContract.staticcall(
            abi.encodeWithSignature("mul(uint256,uint256)", uint256(a), uint256(b))
        );
        require(ok, "mul failed");
        return _decodeInt(ret);
    }

    function div(int256 a, int256 b) external view returns (int256) {
        (bool ok, bytes memory ret) = huffContract.staticcall(
            abi.encodeWithSignature("div(uint256,uint256)", uint256(a), uint256(b))
        );
        require(ok, "div failed");
        return _decodeInt(ret);
    }

    function add(int256 a, int256 b) external view returns (int256) {
        (bool ok, bytes memory ret) = huffContract.staticcall(
            abi.encodeWithSignature("add(uint256,uint256)", uint256(a), uint256(b))
        );
        require(ok, "add failed");
        return _decodeInt(ret);
    }

    function sub(int256 a, int256 b) external view returns (int256) {
        (bool ok, bytes memory ret) = huffContract.staticcall(
            abi.encodeWithSignature("sub(uint256,uint256)", uint256(a), uint256(b))
        );
        require(ok, "sub failed");
        return _decodeInt(ret);
    }

    function _decodeInt(bytes memory data) internal pure returns (int256) {
        int256 v = int256(uint256(bytes32(data)));
        return v;
    }
}
