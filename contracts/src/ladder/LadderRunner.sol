// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ILadderAdapter, Form} from "./ILadder.sol";

/// @title LadderRunner
/// @notice One eth_call re-verifies any cell of the terminal-precision ladder
///         (docs/benchmarks/ladder.json): run(scenario, form, n) executes the
///         scenario for n steps through the chosen library's adapter and
///         returns the raw result in that library's representation. A revert
///         inside the library is caught and returned as its selector, so the
///         caller sees `reverts` instead of a failed call. No storage, no
///         owner; the adapter addresses are immutable.
contract LadderRunner {
    error UnknownForm(uint8 form);

    address public immutable fp127;
    address public immutable fp127lib;
    address public immutable abdk;
    address public immutable solady;
    address public immutable prb;

    constructor(address fp127_, address fp127lib_, address abdk_, address solady_, address prb_) {
        fp127 = fp127_;
        fp127lib = fp127lib_;
        abdk = abdk_;
        solady = solady_;
        prb = prb_;
    }

    function adapter(uint8 form) public view returns (address) {
        if (form == Form.FP127) return fp127;
        if (form == Form.FP127LIB) return fp127lib;
        if (form == Form.ABDK) return abdk;
        if (form == Form.SOLADY) return solady;
        if (form == Form.PRB) return prb;
        revert UnknownForm(form);
    }

    /// @return ok          false if the library reverted
    /// @return raw         the result in the library's representation (0 when !ok)
    /// @return reason      the first four bytes of the revert data (0 when ok)
    /// @return gasPerStep  gas consumed by the adapter call divided by n, including
    ///                     the loop and the external call overhead amortised over n
    function run(uint8 scenario, uint8 form, uint32 n)
        external
        view
        returns (bool ok, int256 raw, bytes4 reason, uint256 gasPerStep)
    {
        ILadderAdapter a = ILadderAdapter(adapter(form));
        uint256 g0 = gasleft();
        try a.run(scenario, n) returns (int256 r) {
            ok = true;
            raw = r;
        } catch (bytes memory err) {
            if (err.length >= 4) reason = bytes4(err);
        }
        uint256 used = g0 - gasleft();
        gasPerStep = n == 0 ? used : used / n;
    }
}
