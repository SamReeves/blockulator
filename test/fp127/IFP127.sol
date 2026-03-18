// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFP127 {
    function add(uint256, uint256) external view returns (uint256);
    function sub(uint256, uint256) external view returns (uint256);
    function mul(uint256, uint256) external view returns (uint256);
    function div(uint256, uint256) external view returns (uint256);
    function mulRaw(uint256, uint256) external view returns (uint256);
    function divRaw(uint256, uint256) external view returns (uint256);
    function fromFixed18(uint256) external view returns (uint256);
    function toFixed18(uint256) external view returns (uint256);
    function exp(uint256) external view returns (uint256);
    function ln(uint256) external view returns (uint256);
    function sqrt(uint256) external view returns (uint256);
    function expRaw(uint256) external view returns (uint256);
    function exp2Raw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function sqrtRaw(uint256) external view returns (uint256);
    function log2Raw(uint256) external view returns (uint256);
    function testConstant() external view returns (uint256);
}
