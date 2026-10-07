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
/// @notice Produces the terminal-precision dataset: every scenario through
///         every form for every N on the ladder, by calling the same
///         LadderRunner that is deployed on Sepolia. Prints
///         LADDER|scenario|form|N|ok|raw|reason|gasPerStep; scripts/ladder/ladder.py
///         computes the mpmath truth and writes docs/benchmarks/ladder.json.
///
/// The FP127 runtime from the build artifact is etched at its CREATE2 address,
/// so the "fp127" form exercises the deployed bytecode exactly as Sepolia does.
contract Ladder is Test {
    LadderRunner runner;

    uint32[10] LADDER = [1, 2, 5, 10, 20, 50, 100, 365, 1000, 10000];
    string[9] SCENARIOS = ["compound", "compound-pow", "bonding-sqrt", "roundtrip", "amortise", "geo-mean", "black-scholes-chain", "cumulative-product", "compound-annual"];
    string[5] FORMS = ["fp127", "fp127lib", "abdk", "solady", "prb"];

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
    }

    function _cell(uint8 s, uint8 f, uint32 n) internal view returns (bool ok, int256 raw, bytes4 reason, uint256 gas) {
        (ok, raw, reason, gas) = runner.run(s, f, n);
        console.log(string.concat(
            "LADDER|", SCENARIOS[s], "|", FORMS[f], "|", vm.toString(n), "|", ok ? "1" : "0", "|",
            vm.toString(raw), "|", vm.toString(reason), "|", vm.toString(gas)
        ));
    }

    /// The whole dataset, plus the invariant that the deployed object and the
    /// inline library agree on every cell.
    function test_ladder_all() public view {
        for (uint8 s; s < Scenario.COUNT; s++) {
            for (uint256 i; i < LADDER.length; i++) {
                uint32 n = LADDER[i];
                (bool ok0, int256 r0,,) = _cell(s, Form.FP127, n);
                (bool ok1, int256 r1,,) = _cell(s, Form.FP127LIB, n);
                assertEq(ok0, ok1, string.concat(SCENARIOS[s], ": fp127/fp127lib ok differ"));
                assertEq(r0, r1, string.concat(SCENARIOS[s], ": fp127/fp127lib raw differ"));
                for (uint8 f = Form.ABDK; f < Form.COUNT; f++) _cell(s, f, n);
            }
        }
    }

    function test_runner_catches_reverts() public view {
        // ln of a negative balance is impossible, but an unknown scenario id reverts in the adapter
        (bool ok, int256 raw, bytes4 reason,) = runner.run(99, Form.SOLADY, 1);
        assertFalse(ok);
        assertEq(raw, 0);
        assertEq(reason, bytes4(keccak256("UnknownScenario(uint8)")));
    }

    function test_runner_unknown_form() public {
        vm.expectRevert(abi.encodeWithSignature("UnknownForm(uint8)", uint8(9)));
        runner.run(0, 9, 1);
    }
}
