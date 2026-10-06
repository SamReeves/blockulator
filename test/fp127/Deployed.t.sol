// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Precision} from "./Precision.t.sol";
import {IFP127} from "../../contracts/src/fp127/IFP127.sol";

/// @title Deployed
/// @notice Post-deploy smoke test: every committed vector against the live
///         FP127 object recorded in contracts/deployments/FP127.json.
///
///   make smoke-sepolia      (forge test --match-contract Deployed --fork-url <sepolia rpc>)
///
/// Skips itself unless the fork is Sepolia, so `make test` never touches
/// the network.
contract Deployed is Precision {
    uint256 constant SEPOLIA = 11155111;

    function _out() internal pure override returns (string memory) { return ""; }

    function setUp() public override {
        super.setUp();
        if (block.chainid == SEPOLIA) {
            string memory json = vm.readFile("contracts/deployments/FP127.json");
            address live = vm.parseJsonAddress(json, ".address");
            require(live.code.length > 0, "no code at the recorded address");
            obj = IFP127(live);
        }
    }

    function test_precision_all() public override {
        vm.skip(block.chainid != SEPOLIA);
        super.test_precision_all();
    }
}
