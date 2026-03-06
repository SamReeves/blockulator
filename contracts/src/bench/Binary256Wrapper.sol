// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Binary256 Wrapper
/// @notice Wrapper for binary256 Huff contract to match fixed18 interface
/// @dev Converts between fixed18 (1e18 scale) and fixed32 (1e32 scale) for the Huff contract
contract Binary256Wrapper {
    address public immutable huffContract;

    int256 constant FIXED18_TO_32 = 1e14;

    constructor(address _huffContract) {
        huffContract = _huffContract;
    }

    function _callHuff(string memory sig, int256 a32, int256 b32) internal view returns (int256) {
        (bool ok, bytes memory ret) = huffContract.staticcall(
            abi.encodeWithSelector(bytes4(keccak256(bytes(sig))), uint256(a32), uint256(b32))
        );
        require(ok, "huff call failed");
        uint256 raw = abi.decode(ret, (uint256));
        return raw > type(uint256).max / 2 ? int256(raw) : int256(raw);
    }

    function mul(int256 a, int256 b) external view returns (int256) {
        return _callHuff("mul(uint256,uint256)", a * FIXED18_TO_32, b * FIXED18_TO_32) / FIXED18_TO_32;
    }

    function div(int256 a, int256 b) external view returns (int256) {
        return _callHuff("div(uint256,uint256)", a * FIXED18_TO_32, b * FIXED18_TO_32) / FIXED18_TO_32;
    }

    function add(int256 a, int256 b) external view returns (int256) {
        return _callHuff("add(uint256,uint256)", a * FIXED18_TO_32, b * FIXED18_TO_32) / FIXED18_TO_32;
    }

    function sub(int256 a, int256 b) external view returns (int256) {
        return _callHuff("sub(uint256,uint256)", a * FIXED18_TO_32, b * FIXED18_TO_32) / FIXED18_TO_32;
    }
}
