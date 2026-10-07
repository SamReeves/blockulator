// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ILadderAdapter, Scenario} from "./ILadder.sol";
import {LadderParams as P} from "./LadderParams.sol";

/// @title LadderBase
/// @notice The scenario loops, written once against seven virtual ops and a
///         parameter accessor. Each adapter supplies the ops in its library's
///         representation; the loops never convert between steps.
///
/// Every scenario is N identical steps. Parameters enter already floored into
/// the adapter's representation (LadderParams), results leave raw.
abstract contract LadderBase is ILadderAdapter {
    error UnknownScenario(uint8 scenario);

    // ---- the representation, supplied by each adapter ---------------------

    function _one() internal pure virtual returns (int256);
    function _fromUint(uint256 u) internal pure virtual returns (int256);
    function _param(uint8 id) internal pure virtual returns (int256);
    function _add(int256 a, int256 b) internal pure virtual returns (int256);
    function _sub(int256 a, int256 b) internal pure virtual returns (int256);
    function _mul(int256 a, int256 b) internal view virtual returns (int256);
    function _div(int256 a, int256 b) internal view virtual returns (int256);
    function _exp(int256 x) internal view virtual returns (int256);
    function _ln(int256 x) internal view virtual returns (int256);
    function _sqrt(int256 x) internal view virtual returns (int256);
    function _pow(int256 x, int256 y) internal view virtual returns (int256);

    // ---- dispatch ----------------------------------------------------------

    function run(uint8 scenario, uint32 n) external view returns (int256) {
        if (scenario == Scenario.COMPOUND) return _compound(P.COMPOUND_PRINCIPAL, P.COMPOUND_RATE, n);
        if (scenario == Scenario.COMPOUND_POW) return _compoundPow(n);
        if (scenario == Scenario.BONDING_SQRT) return _bondingSqrt(n);
        if (scenario == Scenario.ROUNDTRIP) return _roundtrip(n);
        if (scenario == Scenario.AMORTISE) return _amortise(n);
        if (scenario == Scenario.GEO_MEAN) return _geoMean(n);
        if (scenario == Scenario.BLACK_SCHOLES_CHAIN) return _blackScholesChain(n);
        if (scenario == Scenario.CUMULATIVE_PRODUCT) return _cumulativeProduct(n);
        if (scenario == Scenario.COMPOUND_ANNUAL) return _compound(P.COMPOUND_ANNUAL_PRINCIPAL, P.COMPOUND_ANNUAL_RATE, n);
        revert UnknownScenario(scenario);
    }

    // ---- scenarios ---------------------------------------------------------

    /// b = b * (1 + r), N times.
    function _compound(uint8 principal, uint8 rate, uint32 n) internal view returns (int256 b) {
        b = _param(principal);
        int256 g = _add(_one(), _param(rate));
        for (uint32 i; i < n; i++) b = _mul(b, g);
    }

    /// b0 * (1 + r)^N with a real-exponent pow.
    function _compoundPow(uint32 n) internal view returns (int256) {
        int256 g = _add(_one(), _param(P.COMPOUND_POW_RATE));
        return _mul(_param(P.COMPOUND_POW_PRINCIPAL), _pow(g, _fromUint(n)));
    }

    /// cost += sqrt(s); s += unit, N times.
    function _bondingSqrt(uint32 n) internal view returns (int256 cost) {
        int256 s = _param(P.BONDING_SQRT_SUPPLY);
        int256 unit = _param(P.BONDING_SQRT_UNIT);
        for (uint32 i; i < n; i++) {
            cost = _add(cost, _sqrt(s));
            s = _add(s, unit);
        }
    }

    /// x = exp(ln(x)), N times.
    function _roundtrip(uint32 n) internal view returns (int256 x) {
        x = _param(P.ROUNDTRIP_X0);
        for (uint32 i; i < n; i++) x = _exp(_ln(x));
    }

    /// b = b * (1 + r) - payment, N times.
    function _amortise(uint32 n) internal view returns (int256 b) {
        b = _param(P.AMORTISE_PRINCIPAL);
        int256 g = _add(_one(), _param(P.AMORTISE_RATE));
        int256 pay = _param(P.AMORTISE_PAYMENT);
        for (uint32 i; i < n; i++) b = _sub(_mul(b, g), pay);
    }

    /// L += ln((i + 2) / (i + 1)) for i = 1..N; g = exp(L / N).
    function _geoMean(uint32 n) internal view returns (int256) {
        int256 L;
        for (uint32 i = 1; i <= n; i++) {
            L = _add(L, _ln(_div(_fromUint(uint256(i) + 2), _fromUint(uint256(i) + 1))));
        }
        return _exp(_div(L, _fromUint(n)));
    }

    /// acc += d1(S); S += tick, N times, with
    /// d1 = (ln(S / K) + (r + sigma^2 / 2) T) / (sigma sqrt(T)).
    function _blackScholesChain(uint32 n) internal view returns (int256 acc) {
        int256 S = _param(P.BLACK_SCHOLES_CHAIN_SPOT);
        int256 K = _param(P.BLACK_SCHOLES_CHAIN_STRIKE);
        int256 sigma = _param(P.BLACK_SCHOLES_CHAIN_SIGMA);
        int256 T = _param(P.BLACK_SCHOLES_CHAIN_T);
        int256 tick = _param(P.BLACK_SCHOLES_CHAIN_TICK);
        int256 drift = _mul(_add(_param(P.BLACK_SCHOLES_CHAIN_R), _div(_mul(sigma, sigma), _fromUint(2))), T);
        for (uint32 i; i < n; i++) {
            int256 d1 = _div(_add(_ln(_div(S, K)), drift), _mul(sigma, _sqrt(T)));
            acc = _add(acc, d1);
            S = _add(S, tick);
        }
    }

    /// p = p * (1 + eps_i), eps_i = +eps for odd i and -eps for even i, i = 1..N.
    function _cumulativeProduct(uint32 n) internal view returns (int256 p) {
        p = _one();
        int256 up = _add(_one(), _param(P.CUMULATIVE_PRODUCT_EPS));
        int256 dn = _sub(_one(), _param(P.CUMULATIVE_PRODUCT_EPS));
        for (uint32 i = 1; i <= n; i++) p = _mul(p, i & 1 == 1 ? up : dn);
    }
}
