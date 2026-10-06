// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IFP127} from "../../contracts/src/fp127/IFP127.sol";

/// @title LegacyShim
/// @notice Presents the legacy Huff ABI (uint256 everywhere, fixed18 and Raw
///         flavours of every op) on top of the new Yul object, so the
///         Huff-era precision suites can run unchanged against the port.
///         Select it with FP127_TARGET=yul. Debug helpers that only existed
///         in test_fp127.huff revert.
/// @dev GENERATED-STYLE FILE: the body is mechanical. The fixed18 flavour
///      converts every argument with fromFixed18 and the result with
///      toFixed18, exactly as the Huff dispatcher did.
contract LegacyShim {
    IFP127 public immutable target;

    error LegacyDebugHelperUnavailable();

    constructor(IFP127 t) { target = t; }

    function _f(uint256 x) internal view returns (int256) { return target.fromFixed18(int256(x)); }
    function _t(int256 x) internal view returns (uint256) { return uint256(target.toFixed18(x)); }

    function fromFixed18(uint256 x) external view returns (uint256) { return uint256(target.fromFixed18(int256(x))); }
    function toFixed18(uint256 x) external view returns (uint256) { return uint256(target.toFixed18(int256(x))); }

    function exp(uint256 x) external view returns (uint256) { return _t(target.exp(_f(x))); }
    function expRaw(uint256 x) external view returns (uint256) { return uint256(target.exp(int256(x))); }
    function exp2(uint256 x) external view returns (uint256) { return _t(target.exp2(_f(x))); }
    function exp2Raw(uint256 x) external view returns (uint256) { return uint256(target.exp2(int256(x))); }
    function ln(uint256 x) external view returns (uint256) { return _t(target.ln(_f(x))); }
    function lnRaw(uint256 x) external view returns (uint256) { return uint256(target.ln(int256(x))); }
    function log2(uint256 x) external view returns (uint256) { return _t(target.log2(_f(x))); }
    function log2Raw(uint256 x) external view returns (uint256) { return uint256(target.log2(int256(x))); }
    function sqrt(uint256 x) external view returns (uint256) { return _t(target.sqrt(_f(x))); }
    function sqrtRaw(uint256 x) external view returns (uint256) { return uint256(target.sqrt(int256(x))); }
    function abs(uint256 x) external view returns (uint256) { return _t(target.abs(_f(x))); }
    function absRaw(uint256 x) external view returns (uint256) { return uint256(target.abs(int256(x))); }
    function neg(uint256 x) external view returns (uint256) { return _t(target.neg(_f(x))); }
    function negRaw(uint256 x) external view returns (uint256) { return uint256(target.neg(int256(x))); }
    function inv(uint256 x) external view returns (uint256) { return _t(target.inv(_f(x))); }
    function invRaw(uint256 x) external view returns (uint256) { return uint256(target.inv(int256(x))); }
    function log10(uint256 x) external view returns (uint256) { return _t(target.log10(_f(x))); }
    function log10Raw(uint256 x) external view returns (uint256) { return uint256(target.log10(int256(x))); }
    function exp10(uint256 x) external view returns (uint256) { return _t(target.exp10(_f(x))); }
    function exp10Raw(uint256 x) external view returns (uint256) { return uint256(target.exp10(int256(x))); }
    function sign(uint256 x) external view returns (uint256) { return _t(target.sign(_f(x))); }
    function signRaw(uint256 x) external view returns (uint256) { return uint256(target.sign(int256(x))); }
    function floor(uint256 x) external view returns (uint256) { return _t(target.floor(_f(x))); }
    function floorRaw(uint256 x) external view returns (uint256) { return uint256(target.floor(int256(x))); }
    function ceil(uint256 x) external view returns (uint256) { return _t(target.ceil(_f(x))); }
    function ceilRaw(uint256 x) external view returns (uint256) { return uint256(target.ceil(int256(x))); }
    function frac(uint256 x) external view returns (uint256) { return _t(target.frac(_f(x))); }
    function fracRaw(uint256 x) external view returns (uint256) { return uint256(target.frac(int256(x))); }
    function cbrt(uint256 x) external view returns (uint256) { return _t(target.cbrt(_f(x))); }
    function cbrtRaw(uint256 x) external view returns (uint256) { return uint256(target.cbrt(int256(x))); }
    function round(uint256 x) external view returns (uint256) { return _t(target.round(_f(x))); }
    function roundRaw(uint256 x) external view returns (uint256) { return uint256(target.round(int256(x))); }
    function log2Up(uint256 x) external view returns (uint256) { return _t(target.log2Up(_f(x))); }
    function log2UpRaw(uint256 x) external view returns (uint256) { return uint256(target.log2Up(int256(x))); }
    function factorial(uint256 x) external view returns (uint256) { return _t(target.factorial(_f(x))); }
    function factorialRaw(uint256 x) external view returns (uint256) { return uint256(target.factorial(int256(x))); }
    function lambertW0(uint256 x) external view returns (uint256) { return _t(target.lambertW0(_f(x))); }
    function lambertW0Raw(uint256 x) external view returns (uint256) { return uint256(target.lambertW0(int256(x))); }
    function add(uint256 a, uint256 b) external view returns (uint256) { return _t(target.add(_f(a), _f(b))); }
    function addRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.add(int256(a), int256(b))); }
    function sub(uint256 a, uint256 b) external view returns (uint256) { return _t(target.sub(_f(a), _f(b))); }
    function subRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.sub(int256(a), int256(b))); }
    function mul(uint256 a, uint256 b) external view returns (uint256) { return _t(target.mul(_f(a), _f(b))); }
    function mulRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.mul(int256(a), int256(b))); }
    function div(uint256 a, uint256 b) external view returns (uint256) { return _t(target.div(_f(a), _f(b))); }
    function divRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.div(int256(a), int256(b))); }
    function pow(uint256 a, uint256 b) external view returns (uint256) { return _t(target.pow(_f(a), _f(b))); }
    function powRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.pow(int256(a), int256(b))); }
    function min(uint256 a, uint256 b) external view returns (uint256) { return _t(target.min(_f(a), _f(b))); }
    function minRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.min(int256(a), int256(b))); }
    function max(uint256 a, uint256 b) external view returns (uint256) { return _t(target.max(_f(a), _f(b))); }
    function maxRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.max(int256(a), int256(b))); }
    function avg(uint256 a, uint256 b) external view returns (uint256) { return _t(target.avg(_f(a), _f(b))); }
    function avgRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.avg(int256(a), int256(b))); }
    function zeroFloorSub(uint256 a, uint256 b) external view returns (uint256) { return _t(target.zeroFloorSub(_f(a), _f(b))); }
    function zeroFloorSubRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.zeroFloorSub(int256(a), int256(b))); }
    function dist(uint256 a, uint256 b) external view returns (uint256) { return _t(target.dist(_f(a), _f(b))); }
    function distRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.dist(int256(a), int256(b))); }
    function gavg(uint256 a, uint256 b) external view returns (uint256) { return _t(target.gavg(_f(a), _f(b))); }
    function gavgRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.gavg(int256(a), int256(b))); }
    function hypot(uint256 a, uint256 b) external view returns (uint256) { return _t(target.hypot(_f(a), _f(b))); }
    function hypotRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.hypot(int256(a), int256(b))); }
    function gcd(uint256 a, uint256 b) external view returns (uint256) { return _t(target.gcd(_f(a), _f(b))); }
    function gcdRaw(uint256 a, uint256 b) external view returns (uint256) { return uint256(target.gcd(int256(a), int256(b))); }
    function clamp(uint256 a, uint256 b, uint256 c) external view returns (uint256) { return _t(target.clamp(_f(a), _f(b), _f(c))); }
    function clampRaw(uint256 a, uint256 b, uint256 c) external view returns (uint256) { return uint256(target.clamp(int256(a), int256(b), int256(c))); }
    function lerp(uint256 a, uint256 b, uint256 c) external view returns (uint256) { return _t(target.lerp(_f(a), _f(b), _f(c))); }
    function lerpRaw(uint256 a, uint256 b, uint256 c) external view returns (uint256) { return uint256(target.lerp(int256(a), int256(b), int256(c))); }

    function expScale(uint256, uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function expOverflowCheck(uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function testConstant() external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function lambertW0DbgFsc(uint256, uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function lambertW0DbgIb(uint256, uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function lambertW0DbgLutInterp(uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function lambertW0DbgCarmack(uint256, uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
    function divUnsignedRaw(uint256, uint256) external pure returns (uint256) { revert LegacyDebugHelperUnavailable(); }
}
