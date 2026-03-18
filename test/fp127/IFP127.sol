// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFP127 {
    // Fixed18 arithmetic (converts to/from fp127 internally)
    function add(uint256, uint256) external view returns (uint256);
    function sub(uint256, uint256) external view returns (uint256);
    function mul(uint256, uint256) external view returns (uint256);
    function div(uint256, uint256) external view returns (uint256);

    // Raw FP127 arithmetic (no conversion)
    function mulRaw(uint256, uint256) external view returns (uint256);
    function divRaw(uint256, uint256) external view returns (uint256);
    function divUnsignedRaw(uint256, uint256) external view returns (uint256);

    // Format conversion
    function fromFixed18(uint256) external view returns (uint256);
    function toFixed18(uint256) external view returns (uint256);

    // Transcendental - Fixed18 I/O
    function exp(uint256) external view returns (uint256);
    function exp2(uint256) external view returns (uint256);
    function ln(uint256) external view returns (uint256);
    function log2(uint256) external view returns (uint256);
    function sqrt(uint256) external view returns (uint256);
    function pow(uint256, uint256) external view returns (uint256);

    // Transcendental - Raw FP127
    function expRaw(uint256) external view returns (uint256);
    function exp2Raw(uint256) external view returns (uint256);
    function lnRaw(uint256) external view returns (uint256);
    function log2Raw(uint256) external view returns (uint256);
    function sqrtRaw(uint256) external view returns (uint256);
    function powRaw(uint256, uint256) external view returns (uint256);

    // Debug/test helpers
    function expScale(uint256, uint256) external view returns (uint256);
    function expOverflowCheck(uint256) external view returns (uint256);
    function testConstant() external view returns (uint256);

    // Utility functions - Fixed18 I/O
    function abs(uint256) external view returns (uint256);
    function neg(uint256) external view returns (uint256);
    function inv(uint256) external view returns (uint256);
    function min(uint256, uint256) external view returns (uint256);
    function max(uint256, uint256) external view returns (uint256);
    function clamp(uint256, uint256, uint256) external view returns (uint256);
    function avg(uint256, uint256) external view returns (uint256);
    function zeroFloorSub(uint256, uint256) external view returns (uint256);
    function dist(uint256, uint256) external view returns (uint256);
    function gavg(uint256, uint256) external view returns (uint256);
    function log10(uint256) external view returns (uint256);
    function exp10(uint256) external view returns (uint256);
    function sign(uint256) external view returns (uint256);
    function floor(uint256) external view returns (uint256);
    function ceil(uint256) external view returns (uint256);
    function frac(uint256) external view returns (uint256);
    function cbrt(uint256) external view returns (uint256);
    function lerp(uint256, uint256, uint256) external view returns (uint256);
    function hypot(uint256, uint256) external view returns (uint256);
    function round(uint256) external view returns (uint256);
    function log2Up(uint256) external view returns (uint256);
    function gcd(uint256, uint256) external view returns (uint256);
    function factorial(uint256) external view returns (uint256);
    function lambertW0(uint256) external view returns (uint256);

    // Utility functions - Raw FP127
    function absRaw(uint256) external view returns (uint256);
    function negRaw(uint256) external view returns (uint256);
    function invRaw(uint256) external view returns (uint256);
    function minRaw(uint256, uint256) external view returns (uint256);
    function maxRaw(uint256, uint256) external view returns (uint256);
    function clampRaw(uint256, uint256, uint256) external view returns (uint256);
    function avgRaw(uint256, uint256) external view returns (uint256);
    function zeroFloorSubRaw(uint256, uint256) external view returns (uint256);
    function distRaw(uint256, uint256) external view returns (uint256);
    function gavgRaw(uint256, uint256) external view returns (uint256);
    function log10Raw(uint256) external view returns (uint256);
    function exp10Raw(uint256) external view returns (uint256);
    function signRaw(uint256) external view returns (uint256);
    function floorRaw(uint256) external view returns (uint256);
    function ceilRaw(uint256) external view returns (uint256);
    function fracRaw(uint256) external view returns (uint256);
    function cbrtRaw(uint256) external view returns (uint256);
    function lerpRaw(uint256, uint256, uint256) external view returns (uint256);
    function hypotRaw(uint256, uint256) external view returns (uint256);
    function roundRaw(uint256) external view returns (uint256);
    function log2UpRaw(uint256) external view returns (uint256);
    function gcdRaw(uint256, uint256) external view returns (uint256);
    function factorialRaw(uint256) external view returns (uint256);
    function lambertW0Raw(uint256) external view returns (uint256);

    // Lambert W0 debug helpers
    function lambertW0DbgFsc(uint256, uint256) external view returns (uint256, uint256);
    function lambertW0DbgIb(uint256, uint256) external view returns (uint256, uint256);
    function lambertW0DbgLutInterp(uint256) external view returns (uint256, uint256);
    function lambertW0DbgCarmack(uint256, uint256) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
}
