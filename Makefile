.PHONY: compile test test-all bench bench-unified benchmarks help

help:
	@echo "Blockulator Test Pipeline"
	@echo ""
	@echo "  make compile       - Compile Huff contracts"
	@echo "  make test          - FP127 unit tests"
	@echo "  make test-all      - All Foundry tests (unit + bench + HexFP)"
	@echo "  make bench         - All benchmarks (unified + isolated x4)"
	@echo "  make bench-unified - Unified benchmark (ABDK vs Solady vs Vyper vs FP127)"
	@echo "  make benchmarks    - Precision sweep -> JSON"
	@echo ""

compile:
	@echo "Compiling Huff contracts..."
	@bash contracts/deployments/compile-huff.sh

test: compile
	@echo "Running FP127 unit tests..."
	@forge test --match-path "test/fp127/*" -vv

test-all: compile
	@echo "Running all Foundry tests..."
	@forge test -vv

bench: compile
	@echo "Running all benchmarks (ABDK, Solady, Vyper, FP127)..."
	@forge test --match-path "test/bench/*" -vv

bench-unified: compile
	@echo "Running unified benchmark (all 4 libraries)..."
	@forge test --match-contract UnifiedBenchmark -vv

benchmarks: compile
	@echo "Running precision sweep benchmarks..."
	@forge test --match-contract PrecisionSweep -vv 2>&1 \
		| grep 'SWEEP|' \
		| python3 scripts/generators/precision_sweep.py --json
	@echo ""
	@echo "Benchmarks updated: docs/benchmarks/precision_distribution.json"
