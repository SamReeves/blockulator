// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FP127Lib} from "fp127/FP127Lib.sol";

/// @notice The ten-line example on blockulator.com/library: take a WAD
///         principal and a WAD per-step rate, accrue N steps in 127.128,
///         hand back a WAD. The only conversions are at the edges.
contract CompoundExample {
    function accrue(int256 principalWad, int256 rateWad, uint256 steps) external pure returns (int256 balanceWad) {
        int256 b = FP127Lib.fromFixed18(principalWad);
        int256 growth = FP127Lib.add(FP127Lib.ONE, FP127Lib.fromFixed18(rateWad));
        for (uint256 i = 0; i < steps; i++) {
            b = FP127Lib.mul(b, growth);
        }
        return FP127Lib.toFixed18(b);
    }
}
