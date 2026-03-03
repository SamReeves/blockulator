#!/usr/bin/env python3
"""
FP Calculator Test Harness
Uses huffc + pyrevm to test Huff contracts without Solidity/Foundry
"""

import subprocess
import os
from pyrevm import EVM, AccountInfo


class HuffTester:
    """Test harness for Huff contracts using pyrevm"""
    
    def __init__(self):
        self.evm = EVM()
        self.deployer = "0x" + "d0" * 20
        self.contract_counter = 0xcc
        self._env = dict(os.environ)
        self._env["PATH"] = "/home/s/.huff/bin:" + self._env.get("PATH", "")
    
    def compile_huff(self, path):
        """Compile Huff file to runtime bytecode"""
        result = subprocess.run(
            ["huffc", "--evm-version", "paris", path, "-r"],
            capture_output=True,
            text=True,
            env=self._env
        )
        if result.returncode != 0:
            raise RuntimeError(f"Compilation failed: {result.stderr}")
        return bytes.fromhex(result.stdout.strip())
    
    def deploy(self, bytecode):
        """Deploy bytecode and return contract address"""
        # Use a unique address for each deployment
        addr_bytes = bytes([self.contract_counter]) + b"\x00" * 19
        contract_addr = "0x" + addr_bytes.hex()
        self.contract_counter += 1
        
        info = AccountInfo(code=bytecode)
        self.evm.insert_account_info(contract_addr, info)
        return contract_addr
    
    def find_selectors(self, bytecode):
        """
        Find all function selectors in bytecode by scanning for PUSH4 opcodes.
        Returns list of selectors found.
        """
        selectors = []
        for i in range(min(100, len(bytecode))):
            if bytecode[i] == 0x63:  # PUSH4
                selectors.append(bytecode[i+1:i+5])
        return selectors
    
    def encode_uint256(self, value):
        """Encode uint256 for calldata"""
        # Handle negative numbers via two's complement
        if isinstance(value, int):
            if value < 0:
                value = (1 << 256) + value
            return value.to_bytes(32, 'big')
        return value.to_bytes(32, 'big')
    
    def decode_uint256(self, data):
        """Decode uint256 from return data"""
        if len(data) == 0:
            return 0
        return int.from_bytes(data, 'big')
    
    def decode_int256(self, data):
        """Decode int256 (two's complement) from return data"""
        val = int.from_bytes(data, 'big')
        if val >= (1 << 255):
            val = val - (1 << 256)
        return val
    
    def call(self, contract_addr, selector, *args, decode_signed=False):
        """
        Call contract function with args.
        Args are encoded as uint256.
        Returns decoded result.
        """
        calldata = list(selector)
        for arg in args:
            calldata.extend(self.encode_uint256(arg))
        
        result = self.evm.message_call(
            caller=self.deployer,
            to=contract_addr,
            calldata=calldata
        )
        
        if decode_signed:
            return self.decode_int256(result)
        return self.decode_uint256(result)
    
    def call_multi_return(self, contract_addr, selector, *args, num_returns=2):
        """
        Call contract that returns multiple uint256 values in memory.
        Returns list of decoded values.
        """
        calldata = list(selector)
        for arg in args:
            calldata.extend(self.encode_uint256(arg))
        
        result = self.evm.message_call(
            caller=self.deployer,
            to=contract_addr,
            calldata=calldata
        )
        
        # Decode multiple 32-byte values
        values = []
        for i in range(num_returns):
            offset = i * 32
            val_bytes = result[offset:offset+32]
            values.append(int.from_bytes(val_bytes, 'big'))
        return values
    
    def assert_eq(self, actual, expected, msg=""):
        """Assert equality"""
        if actual != expected:
            raise AssertionError(f"{msg}\n  Actual: {actual}\n  Expected: {expected}")
        print(f"✓ {msg}: {actual}")
    
    def assert_approx(self, actual, expected, tolerance=1, msg=""):
        """Assert approximate equality (for FP round-trip losses)"""
        diff = abs(actual - expected)
        if diff > tolerance:
            raise AssertionError(
                f"{msg}\n  Actual: {actual}\n  Expected: {expected}\n  Diff: {diff} (tolerance: {tolerance})"
            )
        print(f"✓ {msg}: {actual} (expected {expected}, diff {diff})")


def test_deployment():
    """Verify the test harness works with a known contract"""
    tester = HuffTester()
    
    # Compile and deploy exp.huff
    bytecode = tester.compile_huff("contracts/src/tools/huff/exp.huff")
    print(f"Compiled exp.huff: {len(bytecode)} bytes")
    
    addr = tester.deploy(bytecode)
    print(f"Deployed to: {addr}")
    
    # Find selectors - exp.huff has calculate(uint256) and get_constant()
    selectors = tester.find_selectors(bytecode)
    print(f"Found {len(selectors)} selectors:")
    for i, sel in enumerate(selectors):
        print(f"  [{i}]: 0x{sel.hex()}")
    
    # From the bytecode, selector[0] is calculate, selector[1] is get_constant
    sel_calculate = selectors[0]
    sel_get_const = selectors[1]
    
    # Test get_constant()
    result = tester.call(addr, sel_get_const)
    tester.assert_eq(result, 2718281828459045235, "get_constant() returns e*1e18")
    
    # Test calculate(1e18)
    result = tester.call(addr, sel_calculate, 10**18)
    tester.assert_eq(result, 2718281828459045235, "calculate(1e18) returns e*1e18")
    
    # Test calculate(0)
    result = tester.call(addr, sel_calculate, 0)
    tester.assert_eq(result, 10**18, "calculate(0) returns 1e18")
    
    print("\n✓ Test harness verified working!")


if __name__ == "__main__":
    test_deployment()
