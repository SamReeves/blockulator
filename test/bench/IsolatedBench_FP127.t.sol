// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../base/IsolatedBenchBase.sol";
import "../fp127/IFP127.sol";

contract IsolatedBench_FP127 is IsolatedBenchBase {
    IFP127 fp127;
    uint256 constant ONE_FP127 = uint256(1) << 128;

    function setUp() public {
        string memory hexStr = vm.readFile("contracts/build/huff/test_fp127.runtime.bin");
        bytes memory code = vm.parseBytes(string.concat("0x", hexStr));
        address addr = makeAddr("fp127");
        vm.etch(addr, code);
        fp127 = IFP127(addr);
        
        // Warmup: pay cold address cost outside measurement
        fp127.mulRaw(ONE_FP127, ONE_FP127);
    }

    function _backendName() internal pure override returns (string memory) {
        return "fp127";
    }

    function _wadToFp127(int256 wad) internal pure returns (uint256) {
        bool negative = wad < 0;
        uint256 abs_wad = uint256(negative ? -wad : wad);
        uint256 result = (abs_wad << 128) / 1e18;
        if (negative) {
            return uint256(-int256(result));
        }
        return result;
    }

    function _mulOp(int256 a, int256 b) internal view override returns (uint256) {
        return fp127.mulRaw(_wadToFp127(a), _wadToFp127(b));
    }

    function _divOp(int256 a, int256 b) internal view override returns (uint256) {
        return fp127.divRaw(_wadToFp127(a), _wadToFp127(b));
    }

    function _expOp(int256 x) internal view override returns (uint256) {
        return fp127.expRaw(_wadToFp127(x));
    }

    function _lnOp(int256 x) internal view override returns (uint256) {
        return fp127.lnRaw(_wadToFp127(x));
    }

    function _sqrtOp(int256 x) internal view override returns (uint256) {
        return fp127.sqrtRaw(_wadToFp127(x));
    }

    function _supportsAdd() internal pure override returns (bool) { return true; }
    function _supportsSub() internal pure override returns (bool) { return true; }

    function _addOp(int256 a, int256 b) internal pure override returns (uint256) {
        return _wadToFp127(a) + _wadToFp127(b);
    }

    function _subOp(int256 a, int256 b) internal pure override returns (uint256) {
        return _wadToFp127(a) - _wadToFp127(b);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITION TESTS (FP127-specific, uses native add)
    // ═══════════════════════════════════════════════════════════════════════

    function test_add_pi_plus_e() public view {
        uint256 a = _wadToFp127(PI_WAD);
        uint256 b = _wadToFp127(E_WAD);
        uint256 g0 = gasleft();
        uint256 result = a + b;
        uint256 gas = g0 - gasleft();
        require(result > 0, "add result");
        console.log("ISOLATED_BENCH|fp127|pi + e|add|", gas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBTRACTION TESTS (FP127-specific, uses native sub)
    // ═══════════════════════════════════════════════════════════════════════

    function test_sub_5_minus_3() public view {
        uint256 a = _wadToFp127(FIVE_WAD);
        uint256 b = _wadToFp127(THREE_WAD);
        uint256 g0 = gasleft();
        uint256 result = a - b;
        uint256 gas = g0 - gasleft();
        require(result > 0, "sub result");
        console.log("ISOLATED_BENCH|fp127|5 - 3|sub|", gas);
    }
}
