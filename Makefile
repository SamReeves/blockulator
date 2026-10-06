.PHONY: help gen gen-check build test test-legacy bench fetch-baseline compile-huff size

PY := uv run
BASELINE_ADDR := 0xfae694D0c2c44181791F838c54Ed64C3151FfE30
SEPOLIA_RPC ?= https://ethereum-sepolia-rpc.publicnode.com

help:
	@echo "Blockulator / FP127"
	@echo ""
	@echo "  make gen            - Generate FP127.yul, FP127Lib.sol, IFP127.sol, abi.json from FP127.yul.src"
	@echo "  make gen-check      - Fail if the generated files are stale"
	@echo "  make build          - gen-check + forge build"
	@echo "  make test           - gen-check + FP127 Foundry tests (equivalence, properties)"
	@echo "  make size           - Print the deployed FP127 runtime size in bytes"
	@echo "  make bench          - Isolated gas benchmarks (Huff baseline, Yul object, inline lib)"
	@echo "  make test-legacy    - Legacy Huff-era precision suites against the Sepolia bytecode"
	@echo "  make fetch-baseline - Re-fetch the live Huff runtime bytecode from Sepolia"
	@echo "  make compile-huff   - Build the archived Huff sources (needs huffc)"
	@echo ""

gen:
	@$(PY) scripts/fp127/gen.py

gen-check:
	@$(PY) scripts/fp127/gen.py --check

build: gen-check
	@forge build

test: gen-check
	@forge test --match-path "test/fp127/Equivalence*" -vv

size: build
	@$(PY) python -c "import json;d=json.load(open('out/FP127.yul/FP127.json'));b=d['deployedBytecode']['object'];print('FP127 runtime:', (len(b)-2)//2, 'bytes of 24576')"

bench: build
	@forge test --match-path "test/fp127/Gas*" -vv

test-legacy: gen-check
	@forge test --match-path "test/fp127/*" --no-match-path "test/fp127/Equivalence*" -vv

fetch-baseline:
	@mkdir -p contracts/archive/huff
	@cast code $(BASELINE_ADDR) --rpc-url $(SEPOLIA_RPC) | tr -d "\n" > contracts/archive/huff/fp127.sepolia.runtime.hex
	@echo "fetched at block $$(cast block-number --rpc-url $(SEPOLIA_RPC))"
	@cast keccak "$$(cat contracts/archive/huff/fp127.sepolia.runtime.hex)"

compile-huff:
	@bash contracts/deployments/compile-huff.sh
