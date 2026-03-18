// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../base/IsolatedBenchBase.sol";
import "../../contracts/src/bench/ABDKWrapper.sol";

contract IsolatedBench_ABDK is IsolatedBenchBase {
    ABDKWrapper abdk;

    function setUp() public {
        abdk = new ABDKWrapper();
        // Warmup
        abdk.mulRaw(int128(1 << 64), int128(1 << 64));
    }

    function _backendName() internal pure override returns (string memory) {
        return "abdk";
    }

    function _wadToAbdk(int256 wad) internal pure returns (int128) {
        int256 result = (wad << 64) / int256(1e18);
        return int128(result);
    }

    function _mulOp(int256 a, int256 b) internal view override returns (uint256) {
        return uint256(uint128(abdk.mulRaw(_wadToAbdk(a), _wadToAbdk(b))));
    }

    function _divOp(int256 a, int256 b) internal view override returns (uint256) {
        return uint256(uint128(abdk.divRaw(_wadToAbdk(a), _wadToAbdk(b))));
    }

    function _expOp(int256 x) internal view override returns (uint256) {
        return uint256(uint128(abdk.expRaw(_wadToAbdk(x))));
    }

    function _lnOp(int256 x) internal view override returns (uint256) {
        return uint256(uint128(abdk.lnRaw(_wadToAbdk(x))));
    }

    function _sqrtOp(int256 x) internal view override returns (uint256) {
        return uint256(uint128(abdk.sqrtRaw(_wadToAbdk(x))));
    }

    function _supportsAdd() internal pure override returns (bool) { return true; }
    function _supportsSub() internal pure override returns (bool) { return true; }

    function _addOp(int256 a, int256 b) internal pure override returns (uint256) {
        return uint256(uint128(_wadToAbdk(a) + _wadToAbdk(b)));
    }

    function _subOp(int256 a, int256 b) internal pure override returns (uint256) {
        return uint256(uint128(_wadToAbdk(a) - _wadToAbdk(b)));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        int128 a = _wadToAbdk(PI_WAD);
        int128 b = _wadToAbdk(E_WAD);
        uint256 g0 = gasleft();
        int128 result = a + b;
        uint256 gas = g0 - gasleft();
        require(result > 0, "add result");
        console.log("ISOLATED_BENCH|abdk|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        int128 a = _wadToAbdk(FIVE_WAD);
        int128 b = _wadToAbdk(THREE_WAD);
        uint256 g0 = gasleft();
        int128 result = a - b;
        uint256 gas = g0 - gasleft();
        require(result > 0, "sub result");
        console.log("ISOLATED_BENCH|abdk|5 - 3|sub|", gas);
    }
}
