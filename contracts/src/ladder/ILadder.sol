// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// @notice The FP127 Yul object's CREATE2 address (contracts/deployments/FP127.md).
//         Tests etch the artifact's runtime here, so the same adapter code runs
//         in the harness and on Sepolia.
address constant FP127_ADDRESS = 0xD8688E72dD6745719484da894C63Cd2685fD7E71;

/// @notice Scenario ids. Mirrors "index" in scripts/ladder/scenarios.json.
library Scenario {
    uint8 constant COMPOUND = 0;
    uint8 constant COMPOUND_POW = 1;
    uint8 constant BONDING_SQRT = 2;
    uint8 constant ROUNDTRIP = 3;
    uint8 constant AMORTISE = 4;
    uint8 constant GEO_MEAN = 5;
    uint8 constant BLACK_SCHOLES_CHAIN = 6;
    uint8 constant CUMULATIVE_PRODUCT = 7;
    uint8 constant COMPOUND_ANNUAL = 8;
    uint8 constant COUNT = 9;
}

/// @notice Library (form) ids, in the order of LadderRunner's constructor.
library Form {
    uint8 constant FP127 = 0;
    uint8 constant FP127LIB = 1;
    uint8 constant ABDK = 2;
    uint8 constant SOLADY = 3;
    uint8 constant PRB = 4;
    uint8 constant COUNT = 5;
}

/// @notice One adapter per library. `run` executes a scenario for n steps in
///         the library's native representation and returns the raw result in
///         that representation, plus the gas the scenario function consumed
///         (measured inside the adapter, so the external call to it is not
///         included). `p` holds the scenario's parameters already floored
///         into the adapter's representation, in the order scenarios.json
///         declares (scripts/ladder/inputs.json carries them). Reverts
///         propagate; the runner catches them.
interface ILadderAdapter {
    function run(uint8 scenario, uint32 n, int256[] calldata p) external view returns (int256 raw, uint256 gasUsed);
}

/// @notice Raised by an adapter when `p` has the wrong length for the scenario.
error BadParamCount(uint8 scenario, uint256 got);
/// @notice Raised by an adapter whose representation cannot hold p[i].
error ParamOutOfRange(uint256 i);
