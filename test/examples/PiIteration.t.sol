// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {PiIteration} from "./PiIteration.sol";

contract PiIterationTest is Test {
    /// floor(pi * 2^128), mpmath at 60 digits.
    int256 constant PI = 1069028584064966747859680373161870783300;
    int256 constant ONE = int256(1) << 128;

    PiIteration p;

    function setUp() public { p = new PiIteration(); }

    function _digits(int256 got) internal pure returns (uint256 d) {
        uint256 err = uint256(got > PI ? got - PI : PI - got);
        if (err == 0) return 60;
        // correct significant digits = floor(log10(pi / err)); pi ~ 3.14 so count decades of 10^... below
        uint256 ratio = uint256(PI) / err;
        while (ratio >= 10) { ratio /= 10; d++; }
    }

    function test_borwein_quadruples_then_hits_the_floor() public view {
        uint256 d1 = _digits(p.borwein(1));
        uint256 d2 = _digits(p.borwein(2));
        uint256 d3 = _digits(p.borwein(3));
        assertGe(d1, 8, "step 1");
        assertGe(d2, 36, "step 2");
        assertEq(d3, d2, "a third step changes nothing: the format's floor");
    }

    function test_gaussLegendre_doubles() public view {
        assertGe(_digits(p.gaussLegendre(1)), 3);
        assertGe(_digits(p.gaussLegendre(2)), 8);
        assertGe(_digits(p.gaussLegendre(3)), 19);
        assertGe(_digits(p.gaussLegendre(4)), 36);
    }

    function test_gas() public view {
        uint256 g0 = gasleft(); p.borwein(2); uint256 gb = g0 - gasleft();
        g0 = gasleft(); p.gaussLegendre(4); uint256 gg = g0 - gasleft();
        console.log("borwein(2) gas", gb, "gaussLegendre(4) gas", gg);
    }
}
