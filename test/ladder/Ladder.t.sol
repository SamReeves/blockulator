// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {FP127_ADDRESS, Scenario, Form} from "../../contracts/src/ladder/ILadder.sol";
import {LadderRunner} from "../../contracts/src/ladder/LadderRunner.sol";
import {LadderFP127} from "../../contracts/src/ladder/LadderFP127.sol";
import {LadderFP127Lib} from "../../contracts/src/ladder/LadderFP127Lib.sol";
import {LadderABDK} from "../../contracts/src/ladder/LadderABDK.sol";
import {LadderSolady} from "../../contracts/src/ladder/LadderSolady.sol";
import {LadderPRB} from "../../contracts/src/ladder/LadderPRB.sol";

/// @title Ladder
/// @notice Produces the terminal-precision dataset: every scenario, for every
///         input in scripts/ladder/inputs.json, through every form for every
///         N on the ladder, by calling the same LadderRunner that is deployed
///         on Sepolia. Prints
///         LADDER|scenario|input|form|N|ok|raw|reason|gasTotal
///         and scripts/ladder/ladder.py computes the mpmath truth and writes
///         docs/benchmarks/ladder.json. One test per scenario so forge runs
///         them in parallel.
///
/// The FP127 runtime from the build artifact is etched at its CREATE2 address,
/// so the "fp127" form exercises the deployed bytecode exactly as Sepolia does.
contract Ladder is Test {
    string constant INPUTS = "scripts/ladder/inputs.json";
    string[5] FORMS = ["fp127", "fp127lib", "abdk", "solady", "prb"];

    LadderRunner runner;
    string json;
    uint256[] ladder;

    function setUp() public {
        bytes memory runtime = vm.parseJsonBytes(vm.readFile("out/FP127.yul/FP127.json"), ".deployedBytecode.object");
        vm.etch(FP127_ADDRESS, runtime);
        runner = new LadderRunner(
            address(new LadderFP127()),
            address(new LadderFP127Lib()),
            address(new LadderABDK()),
            address(new LadderSolady()),
            address(new LadderPRB())
        );
        json = vm.readFile(INPUTS);
        ladder = vm.parseJsonUintArray(json, ".ladder");
    }

    function _scaleKey(uint8 f) internal pure returns (string memory) {
        if (f == Form.FP127 || f == Form.FP127LIB) return "fp127";
        if (f == Form.ABDK) return "abdk";
        return "wad";
    }

    function _params(uint256 cell, uint8 f) internal view returns (int256[] memory p) {
        string[] memory s = vm.parseJsonStringArray(json, string.concat(".cells[", vm.toString(cell), "].", _scaleKey(f)));
        p = new int256[](s.length);
        for (uint256 i; i < s.length; i++) p[i] = vm.parseInt(s[i]);
    }

    struct Inp { string id; string input; int256[] fp; int256[] abdk; int256[] wad; }

    function _cell(Inp memory x, uint8 s, uint8 f, uint32 n) internal view returns (bool ok, int256 raw) {
        int256[] memory p = f == Form.ABDK ? x.abdk : (f == Form.SOLADY || f == Form.PRB ? x.wad : x.fp);
        bytes4 reason;
        uint256 gas;
        (ok, raw, reason,, gas) = runner.run(s, f, n, p);
        console.log(string.concat(
            "LADDER|", x.id, "|", x.input, "|", FORMS[f], "|", vm.toString(n), "|", ok ? "1" : "0", "|",
            vm.toString(raw), "|", vm.toString(reason), "|", vm.toString(gas)
        ));
    }

    /// One input through every form and N, with the invariant that the
    /// deployed object and the inline library agree.
    function _input(Inp memory x, uint8 s) internal view {
        for (uint256 i; i < ladder.length; i++) {
            uint32 n = uint32(ladder[i]);
            (bool ok0, int256 r0) = _cell(x, s, Form.FP127, n);
            (bool ok1, int256 r1) = _cell(x, s, Form.FP127LIB, n);
            assertEq(ok0, ok1, string.concat(x.id, "/", x.input, ": fp127/fp127lib ok differ"));
            assertEq(r0, r1, string.concat(x.id, "/", x.input, ": fp127/fp127lib raw differ"));
            _cell(x, s, Form.ABDK, n);
            _cell(x, s, Form.SOLADY, n);
            _cell(x, s, Form.PRB, n);
        }
    }

    /// Every input of one scenario.
    function _scenario(uint8 s) internal view {
        uint256 count = vm.parseJsonUint(json, ".count");
        for (uint256 c; c < count; c++) {
            string memory base = string.concat(".cells[", vm.toString(c), "]");
            if (vm.parseJsonUint(json, string.concat(base, ".scenario")) != s) continue;
            Inp memory x = Inp({
                id: vm.parseJsonString(json, string.concat(base, ".id")),
                input: vm.parseJsonString(json, string.concat(base, ".input")),
                fp: _params(c, Form.FP127),
                abdk: _params(c, Form.ABDK),
                wad: _params(c, Form.SOLADY)
            });
            _input(x, s);
        }
    }

    function test_ladder_compound() public view { _scenario(Scenario.COMPOUND); }
    function test_ladder_compoundPow() public view { _scenario(Scenario.COMPOUND_POW); }
    function test_ladder_bondingSqrt() public view { _scenario(Scenario.BONDING_SQRT); }
    function test_ladder_roundtrip() public view { _scenario(Scenario.ROUNDTRIP); }
    function test_ladder_amortise() public view { _scenario(Scenario.AMORTISE); }
    function test_ladder_geoMean() public view { _scenario(Scenario.GEO_MEAN); }
    function test_ladder_blackScholesChain() public view { _scenario(Scenario.BLACK_SCHOLES_CHAIN); }
    function test_ladder_cumulativeProduct() public view { _scenario(Scenario.CUMULATIVE_PRODUCT); }
    function test_ladder_compoundAnnual() public view { _scenario(Scenario.COMPOUND_ANNUAL); }

    function test_runner_catches_reverts() public view {
        int256[] memory p = new int256[](1);
        (bool ok, int256 raw, bytes4 reason,, uint256 gas) = runner.run(99, Form.SOLADY, 1, p);
        assertFalse(ok);
        assertEq(raw, 0);
        assertEq(gas, 0);
        assertEq(reason, bytes4(keccak256("UnknownScenario(uint8)")));
    }

    function test_runner_bad_param_count() public view {
        int256[] memory p = new int256[](1);
        (bool ok,, bytes4 reason,,) = runner.run(Scenario.COMPOUND, Form.SOLADY, 1, p);
        assertFalse(ok);
        assertEq(reason, bytes4(keccak256("BadParamCount(uint8,uint256)")));
    }

    function test_abdk_param_out_of_range() public view {
        int256[] memory p = new int256[](2);
        p[0] = int256(1) << 130; // does not fit int128
        p[1] = 0;
        (bool ok,, bytes4 reason,,) = runner.run(Scenario.COMPOUND, Form.ABDK, 1, p);
        assertFalse(ok);
        assertEq(reason, bytes4(keccak256("ParamOutOfRange(uint256)")));
    }

    function test_runner_unknown_form() public {
        int256[] memory p = new int256[](0);
        vm.expectRevert(abi.encodeWithSignature("UnknownForm(uint8)", uint8(9)));
        runner.run(0, 9, 1, p);
    }
}
