// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FP127Harness} from "../base/FP127Harness.sol";
import {IFP127} from "../../contracts/src/fp127/IFP127.sol";

/// @title Behaviour
/// @notice Known values, identities and shortcut dispatch for the Yul build.
///         Carried over from the Huff-era suites (FP127Test, core/*) and the
///         property tests that used to live in EquivalenceOps. Independent of
///         the Huff baseline and of the oracle; these are the facts a reader
///         can check by hand.
contract Behaviour is FP127Harness {
    int256 constant E_RAW = 924983374546220337150911035843336795079;   // floor(e * 2^128)
    int256 constant PI_RAW = 1068362306129446170624574138052468108800; // floor(pi * 2^128)... approx, checked loosely

    function _absd(int256 a, int256 b) internal pure returns (int256) { return a > b ? a - b : b - a; }

    // ------------------------------------------------------------------
    // Known values
    // ------------------------------------------------------------------

    function test_conversions() public view {
        assertEq(obj.fromFixed18(1e18), ONE);
        assertEq(obj.toFixed18(ONE), 1e18);
        assertEq(obj.fromFixed18(-5e17), -ONE / 2);
        assertEq(obj.toFixed18(-ONE / 2), -5e17);
        assertEq(obj.fromFixed18(0), 0);
        assertEq(obj.toFixed18(1), 0);           // one ULP is below 1e-18
        assertEq(obj.toFixed18(-1), -1);         // floor, not trunc
    }

    function test_arithmetic_known() public view {
        assertEq(obj.add(2 * ONE, 3 * ONE), 5 * ONE);
        assertEq(obj.sub(2 * ONE, 3 * ONE), -ONE);
        assertEq(obj.mul(2 * ONE, 3 * ONE), 6 * ONE);
        assertEq(obj.mul(-2 * ONE, 3 * ONE), -6 * ONE);
        assertEq(obj.div(3 * ONE, 2 * ONE), ONE + ONE / 2);
        assertEq(obj.div(-3 * ONE, 2 * ONE), -(ONE + ONE / 2));
        assertEq(obj.div(ONE, 3 * ONE), ONE / 3);
        assertEq(obj.inv(4 * ONE), ONE / 4);
        // rounding direction: mul floors, div truncates
        assertEq(obj.mul(-ONE, ONE + 1), -(ONE + 1));
        assertEq(obj.mul(-(ONE + 1), ONE / 2), -(ONE / 2) - 1);
        assertEq(obj.div(-(ONE + 1), 2 * ONE), -(ONE / 2));
    }

    function test_transcendental_known() public view {
        int256 e = obj.exp(ONE);
        assertLe(_absd(e, E_RAW), 4, "e");
        assertEq(obj.exp(0), ONE);
        assertEq(obj.exp2(10 * ONE), 1024 * ONE);
        assertEq(obj.exp2(-ONE), ONE / 2);
        assertEq(obj.exp2(0), ONE);
        assertLe(_absd(obj.exp10(2 * ONE), 100 * ONE), 256, "exp10(2) via log2(10) is not exact");
        assertEq(obj.log2(1024 * ONE), 10 * ONE);
        assertEq(obj.log2(ONE / 4), -2 * ONE);
        assertEq(obj.log2(ONE), 0);
        assertEq(obj.ln(ONE), 0);
        assertLe(_absd(obj.ln(e), ONE), 8, "ln e");
        assertLe(_absd(obj.log10(1000 * ONE), 3 * ONE), 8, "log10 1000");
        assertEq(obj.sqrt(4 * ONE), 2 * ONE);
        assertEq(obj.sqrt(ONE / 4), ONE / 2);
        assertEq(obj.sqrt(0), 0);
    }

    function test_integer_ops_known() public view {
        assertEq(obj.floor(-ONE / 2), -ONE);
        assertEq(obj.floor(ONE + ONE / 2), ONE);
        assertEq(obj.ceil(-ONE / 2), 0);
        assertEq(obj.ceil(ONE + 1), 2 * ONE);
        assertEq(obj.round(ONE / 2), ONE);
        assertEq(obj.round(-ONE / 2), 0);
        assertEq(obj.round(ONE / 2 - 1), 0);
        assertEq(obj.frac(-ONE / 2), ONE / 2);
        assertEq(obj.sign(-5), -ONE);
        assertEq(obj.sign(0), 0);
        assertEq(obj.sign(1), ONE);
        assertEq(obj.factorial(5 * ONE + 1), 120 * ONE);
        assertEq(obj.factorial(0), ONE);
        assertEq(obj.factorial(33 * ONE), int256(8683317618811886495518194401280000000) * ONE);
        assertEq(obj.gcd(12 * ONE, 18 * ONE), 6 * ONE);
        assertEq(obj.gcd(-12 * ONE, 18 * ONE), 6 * ONE);
        assertEq(obj.gcd(-4 * ONE, -4 * ONE), 4 * ONE);
        assertEq(obj.gcd(7 * ONE, 0), 7 * ONE);
        assertEq(obj.log2Up(5 * ONE), 3 * ONE);
        assertEq(obj.log2Up(8 * ONE), 3 * ONE);
        assertEq(obj.log2Up(ONE / 3), -1 * ONE);
    }

    function test_selection_known() public view {
        assertEq(obj.min(-ONE, ONE), -ONE);
        assertEq(obj.max(-ONE, ONE), ONE);
        assertEq(obj.clamp(5 * ONE, 0, ONE), ONE);
        assertEq(obj.clamp(-5 * ONE, 0, ONE), 0);
        assertEq(obj.clamp(ONE / 2, 0, ONE), ONE / 2);
        assertEq(obj.avg(ONE, 3 * ONE), 2 * ONE);
        assertEq(obj.avg(MAX, MAX), MAX);
        assertEq(obj.avg(MIN, MIN), MIN);
        assertEq(obj.avg(-ONE, 0), -ONE / 2);
        assertEq(obj.dist(-ONE, ONE), 2 * ONE);
        assertEq(obj.zeroFloorSub(ONE, 2 * ONE), 0);
        assertEq(obj.zeroFloorSub(2 * ONE, ONE), ONE);
        assertEq(obj.lerp(0, 10 * ONE, ONE / 2), 5 * ONE);
        assertEq(obj.lerp(10 * ONE, 0, ONE / 4), 7 * ONE + ONE / 2);
        assertEq(obj.hypot(3 * ONE, 4 * ONE), 5 * ONE);
        assertEq(obj.gavg(2 * ONE, 8 * ONE), 4 * ONE);
    }

    function test_lambert_known() public view {
        assertEq(obj.lambertW0(0), 0);
        assertEq(obj.lambertW0(ONE), 0x91304d7c74b2ba5eafddaa6286dc28e1);
        assertEq(obj.lambertW0(2 * ONE), 0xda445aab89e28ccbe8ac8e1abd5cd1db);
        // W(-1/4) = -0.35740295618138890306881110405590475...
        assertLe(_absd(obj.lambertW0(-ONE / 4), -121617923873943470405355803408166885968), 16);
        // W(e) = 1 exactly
        assertLe(_absd(obj.lambertW0(E_RAW), ONE), 16);
    }

    // ------------------------------------------------------------------
    // Shortcut dispatch: the shortcut must equal the direct op
    // ------------------------------------------------------------------

    function testFuzz_pow_shortcuts(int256 x, uint8 which) public view {
        x = bound(x, ONE / 1000, 1000 * ONE);
        uint8 k = which % 7;
        int256 y; int256 direct;
        if (k == 0) { y = ONE; direct = x; }
        else if (k == 1) { y = 2 * ONE; direct = obj.mul(x, x); }
        else if (k == 2) { y = 3 * ONE; direct = obj.mul(obj.mul(x, x), x); }
        else if (k == 3) { y = 4 * ONE; int256 x2 = obj.mul(x, x); direct = obj.mul(x2, x2); }
        else if (k == 4) { y = ONE / 2; direct = obj.sqrt(x); }
        else if (k == 5) { y = ONE / 4; direct = obj.sqrt(obj.sqrt(x)); }
        else { y = -ONE; direct = obj.inv(x); }
        assertEq(obj.pow(x, y), direct, "y shortcut");
        int256 ysm = bound(int256(uint256(which)), -30 * ONE, 30 * ONE);
        assertEq(obj.pow(2 * ONE, ysm), obj.exp2(ysm), "x=2 shortcut");
        assertEq(obj.pow(10 * ONE, ysm), obj.exp10(ysm), "x=10 shortcut");
    }

    function test_pow_edge_cases() public view {
        assertEq(obj.pow(0, 0), ONE);
        assertEq(obj.pow(0, 5 * ONE), 0);
        assertEq(obj.pow(ONE, 123 * ONE), ONE);
        assertEq(obj.pow(3 * ONE, 2 * ONE), 9 * ONE);
        assertEq(obj.pow(2 * ONE, 10 * ONE), 1024 * ONE);
        assertEq(obj.pow(10 * ONE, 2 * ONE), 100 * ONE);
        assertEq(obj.pow(27 * ONE, ONE / 2), obj.sqrt(27 * ONE));
    }

    function test_cbrt_shortcuts() public view {
        assertEq(obj.cbrt(8 * ONE), 2 * ONE);
        assertEq(obj.cbrt(27 * ONE), 3 * ONE);
        assertEq(obj.cbrt(64 * ONE), 4 * ONE);
        assertEq(obj.cbrt(0), 0);
        assertEq(obj.cbrt(-27 * ONE), -obj.pow(27 * ONE, obj.div(ONE, 3 * ONE)));
    }

    function test_log2_powers_of_two() public view {
        for (int256 k = -120; k <= 126; k += 3) {
            int256 x = k >= 0 ? ONE << uint256(k) : ONE >> uint256(-k);
            assertEq(obj.log2(x), k * ONE);
            assertEq(obj.log2Up(x), k * ONE);
        }
    }

    // ------------------------------------------------------------------
    // Properties
    // ------------------------------------------------------------------

    function testFuzz_prop_fixed18_roundtrip(int256 w) public view {
        w = bound(w, -(int256(1) << 127), (int256(1) << 127) - 1);
        int256 back = obj.toFixed18(obj.fromFixed18(w));
        assertLe(back, w);
        assertLe(w - back, 1);
    }

    function testFuzz_prop_mul_one(int256 a) public view {
        assertEq(obj.mul(a, ONE), a);
        assertEq(obj.mul(ONE, a), a);
        assertEq(obj.div(a, ONE), a);
    }

    function testFuzz_prop_mul_commutes(int256 a, int256 b) public view {
        _assertSame(_try(address(obj), abi.encodeCall(IFP127.mul, (a, b))),
                    _try(address(obj), abi.encodeCall(IFP127.mul, (b, a))), "mul commutes");
    }

    function testFuzz_prop_mul_then_div(int256 a, int256 b) public view {
        a = bound(a, -(int256(1) << 180), int256(1) << 180);
        b = bound(b, ONE, int256(1) << 200);
        if (a & 1 == 1) b = -b;
        int256 back = obj.div(obj.mul(a, b), b);
        assertLe(_absd(back, a), 2);
    }

    function testFuzz_prop_exp_ln(int256 x) public view {
        x = bound(x, ONE / 1000, 1000 * ONE);
        int256 back = obj.exp(obj.ln(x));
        assertLe(_absd(back, x), (x >> 110) + 8);
    }

    function testFuzz_prop_sqrt_square(int256 x) public view {
        x = bound(x, 0, int256(1) << 250);
        int256 s = obj.sqrt(x);
        assertLe(obj.mul(s, s), x);
        assertGe(obj.mul(s + 1, s + 1), x);
    }

    function testFuzz_prop_lambertW0_inverse(int256 x) public view {
        x = bound(x, -int256(0x5e2d58d8b3bcdf1abadec7829054f90d) / 2, int256(1) << 160);
        int256 w = obj.lambertW0(x);
        int256 back = obj.mul(w, obj.exp(w));
        int256 tol = (x < 0 ? -x : x) >> 112;
        assertLe(_absd(back, x), tol + 8);
    }

    function testFuzz_prop_floor_ceil(int256 x) public view {
        x = bound(x, MIN + ONE, MAX - ONE);
        int256 f = obj.floor(x);
        int256 c = obj.ceil(x);
        assertLe(f, x);
        assertGe(c, x);
        assertEq(f & (ONE - 1), 0);
        assertEq(c & (ONE - 1), 0);
        assertEq(obj.frac(x), x - f);
    }
}
