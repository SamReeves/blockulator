// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../base/IsolatedBenchBase.sol";
import "../../contracts/src/bench/SoladyWrapper.sol";

contract IsolatedBench_Solady is IsolatedBenchBase {
    SoladyWrapper solady;
    uint256 constant WAD = 1e18;

    function setUp() public {
        solady = new SoladyWrapper();
        // Warmup
        solady.mulRaw(WAD, WAD);
    }

    function _backendName() internal pure override returns (string memory) {
        return "solady";
    }

    function _mulOp(int256 a, int256 b) internal view override returns (uint256) {
        return solady.mulRaw(uint256(a), uint256(b));
    }

    function _divOp(int256 a, int256 b) internal view override returns (uint256) {
        return solady.divRaw(uint256(a), uint256(b));
    }

    function _expOp(int256 x) internal view override returns (uint256) {
        return uint256(solady.expRaw(x));
    }

    function _lnOp(int256 x) internal view override returns (uint256) {
        return uint256(solady.lnRaw(x));
    }

    function _sqrtOp(int256 x) internal view override returns (uint256) {
        return solady.sqrtRaw(uint256(x));
    }

    function _supportsAdd() internal pure override returns (bool) { return true; }
    function _supportsSub() internal pure override returns (bool) { return true; }

    function _addOp(int256 a, int256 b) internal pure override returns (uint256) {
        return uint256(a) + uint256(b);
    }

    function _subOp(int256 a, int256 b) internal pure override returns (uint256) {
        return uint256(a) - uint256(b);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        uint256 a = uint256(PI_WAD);
        uint256 b = uint256(E_WAD);
        uint256 g0 = gasleft();
        uint256 result = a + b;
        uint256 gas = g0 - gasleft();
        require(result > 0, "add result");
        console.log("ISOLATED_BENCH|solady|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        uint256 a = uint256(FIVE_WAD);
        uint256 b = uint256(THREE_WAD);
        uint256 g0 = gasleft();
        uint256 result = a - b;
        uint256 gas = g0 - gasleft();
        require(result > 0, "sub result");
        console.log("ISOLATED_BENCH|solady|5 - 3|sub|", gas);
    }
}
