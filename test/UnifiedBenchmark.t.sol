// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

interface IArith {
    function mul(int256 a, int256 b) external view returns (int256);
    function div(int256 a, int256 b) external view returns (int256);
    function add(int256 a, int256 b) external view returns (int256);
    function sub(int256 a, int256 b) external view returns (int256);
}

interface IArithU {
    function mul(uint256 a, uint256 b) external view returns (uint256);
    function div(uint256 a, uint256 b) external view returns (uint256);
    function add(uint256 a, uint256 b) external view returns (uint256);
    function sub(uint256 a, uint256 b) external view returns (uint256);
}

contract UnifiedBenchmark is Test {
    IArith abdk;
    IArith solady;
    IArith vyper;
    IArithU fp128;
    IArithU binary256;

    int256 constant F18 = 1e18;
    int256 constant F18_TO_32 = 1e14;

    int256 constant A1 = 3_141592653589793238;
    int256 constant B1 = 2_718281828459045235;
    int256 constant A2 = 1_618033988749894848;
    int256 constant B2 = 2_236067977499789696;

    function setUp() public {
        abdk = IArith(deployCode("ABDKWrapper.sol:ABDKWrapper"));
        solady = IArith(deployCode("SoladyWrapper.sol:SoladyWrapper"));
        vyper = IArith(_deployBinaryBytecode("contracts/build/vyper/arith.bin"));
        fp128 = IArithU(_deployHuffBytecode("contracts/build/huff/test_fixedpoint128.runtime.bin"));
        binary256 = IArithU(_deployHuffBytecode("contracts/build/huff/test_binary256.runtime.bin"));
    }

    function _deployBinaryBytecode(string memory path) internal returns (address addr) {
        bytes memory code = vm.readFileBinary(path);
        addr = makeAddr(path);
        vm.etch(addr, code);
        vm.deal(addr, 1);
    }

    function _deployHuffBytecode(string memory path) internal returns (address addr) {
        string memory hexCode = vm.readFile(path);
        bytes memory code = vm.parseBytes(string.concat("0x", hexCode));
        addr = makeAddr(path);
        vm.etch(addr, code);
        vm.deal(addr, 1);
    }

    // --- Single-call benchmarks for precise gas measurement ---

    function testGas_ABDK_mul_single() public view {
        abdk.mul(A1, B1);
    }

    function testGas_Solady_mul_single() public view {
        solady.mul(A1, B1);
    }

    function testGas_Vyper_mul_single() public view {
        vyper.mul(A1, B1);
    }

    function testGas_fp128_mul_single() public view {
        fp128.mul(uint256(A1), uint256(B1));
    }

    function testGas_binary256_mul_single() public view {
        binary256.mul(uint256(A1 * F18_TO_32), uint256(B1 * F18_TO_32));
    }

    function testGas_ABDK_div_single() public view {
        abdk.div(A1, B1);
    }

    function testGas_Solady_div_single() public view {
        solady.div(A1, B1);
    }

    function testGas_Vyper_div_single() public view {
        vyper.div(A1, B1);
    }

    function testGas_fp128_div_single() public view {
        fp128.div(uint256(A1), uint256(B1));
    }

    function testGas_binary256_div_single() public view {
        binary256.div(uint256(A1 * F18_TO_32), uint256(B1 * F18_TO_32));
    }

    function testGas_ABDK_add_single() public view {
        abdk.add(A1, B1);
    }

    function testGas_Solady_add_single() public view {
        solady.add(A1, B1);
    }

    function testGas_Vyper_add_single() public view {
        vyper.add(A1, B1);
    }

    function testGas_fp128_add_single() public view {
        fp128.add(uint256(A1), uint256(B1));
    }

    function testGas_binary256_add_single() public view {
        binary256.add(uint256(A1 * F18_TO_32), uint256(B1 * F18_TO_32));
    }

    // --- Correctness checks ---

    function testCorrectness_mul() public view {
        int256 expected_abdk = abdk.mul(A1, B1);
        int256 expected_solady = solady.mul(A1, B1);
        int256 expected_vyper = vyper.mul(A1, B1);

        assertApproxEqAbs(expected_abdk, expected_solady, 1, "ABDK vs Solady mul");
        assertApproxEqAbs(expected_solady, expected_vyper, 1, "Solady vs Vyper mul");

        uint256 fp128_result = fp128.mul(uint256(A1), uint256(B1));
        assertApproxEqAbs(int256(fp128_result), expected_vyper, 2, "fp128 vs Vyper mul");
    }

    function testCorrectness_div() public view {
        int256 expected_abdk = abdk.div(A1, B1);
        int256 expected_solady = solady.div(A1, B1);
        int256 expected_vyper = vyper.div(A1, B1);

        assertApproxEqAbs(expected_abdk, expected_solady, 1, "ABDK vs Solady div");
        assertApproxEqAbs(expected_solady, expected_vyper, 1, "Solady vs Vyper div");

        uint256 fp128_result = fp128.div(uint256(A1), uint256(B1));
        assertApproxEqAbs(int256(fp128_result), expected_vyper, 2, "fp128 vs Vyper div");
    }
}
