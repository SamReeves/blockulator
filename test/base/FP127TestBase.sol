// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../fp127/IFP127.sol";

abstract contract FP127TestBase is Test {
    IFP127 fp127;
    
    int256 constant F18 = 1e18;
    int256 constant E = 2718281828459045235;
    uint256 constant ONE_FP127 = uint256(1) << 128;

    function _deployFP127() internal {
        _deployFP127FromFile("contracts/archive/huff/fp127.sepolia.runtime.hex");
    }

    function _deployFP127FromFile(string memory path) internal {
        // The baseline file is the 0x-prefixed runtime bytecode fetched from
        // Sepolia with `make fetch-baseline`; no Huff toolchain is needed.
        bytes memory code = vm.parseBytes(vm.readFile(path));
        address addr = makeAddr("fp127");
        vm.etch(addr, code);
        fp127 = IFP127(addr);
    }

    function _wadToFp127(int256 wad) internal pure virtual returns (uint256) {
        bool negative = wad < 0;
        uint256 abs_wad = uint256(negative ? -wad : wad);
        uint256 result = (abs_wad << 128) / 1e18;
        if (negative) {
            return uint256(-int256(result));
        }
        return result;
    }

    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }

    function _log2Err(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 d = a > b ? a - b : b - a;
        if (d == 0) return 128;
        uint256 bits = 0;
        while (d > 0) { d >>= 1; bits++; }
        return bits;
    }

    function _oracle(string memory func, uint256 x) internal returns (uint256) {
        string[] memory cmd = new string[](6);
        cmd[0] = "uv";
        cmd[1] = "run";
        cmd[2] = "python";
        cmd[3] = "scripts/fp127/fp127_oracle.py";
        cmd[4] = func;
        cmd[5] = vm.toString(x);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (uint256));
    }
    
    function _oracle2(string memory func, uint256 a, uint256 b) internal returns (uint256) {
        string[] memory cmd = new string[](7);
        cmd[0] = "uv";
        cmd[1] = "run";
        cmd[2] = "python";
        cmd[3] = "scripts/fp127/fp127_oracle.py";
        cmd[4] = func;
        cmd[5] = vm.toString(a);
        cmd[6] = vm.toString(b);
        bytes memory out = vm.ffi(cmd);
        return abi.decode(out, (uint256));
    }

    function _refDivUnsigned(uint256 a, uint256 b) internal pure returns (uint256 result) {
        assembly {
            let prod0 := shl(128, a)
            let prod1 := shr(128, a)
            
            let remainder := mulmod(a, 0x100000000000000000000000000000000, b)
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
            
            let twos := and(sub(0, b), b)
            b := div(b, twos)
            prod0 := div(prod0, twos)
            
            let twos_flipped := add(div(sub(0, twos), twos), 1)
            prod0 := or(prod0, mul(prod1, twos_flipped))
            
            let inv := xor(mul(3, b), 2)
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            inv := mul(inv, sub(2, mul(b, inv)))
            
            result := mul(prod0, inv)
        }
    }
}
