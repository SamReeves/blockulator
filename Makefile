.PHONY: compile test benchmarks help

help:
	@echo "FP127 Benchmark Pipeline"
	@echo ""
	@echo "Available targets:"
	@echo "  compile    - Compile Huff contracts"
	@echo "  test       - Run FP127 unit tests"
	@echo "  benchmarks - Run precision sweep and update benchmark JSON"
	@echo ""

compile:
	@echo "Compiling Huff contracts..."
	bash contracts/deployments/compile-huff.sh

test: compile
	@echo "Running FP127 unit tests..."
	cd contracts && forge test --match-contract FP127Test -vv

benchmarks: compile
	@echo "Running precision sweep benchmarks..."
	@cd contracts && forge test --match-contract PrecisionSweep -vv 2>&1 \
		| grep 'SWEEP|' \
		| (cd .. && python3 scripts/generators/precision_sweep.py --json)
	@echo ""
	@echo "Benchmarks updated: docs/benchmarks/precision_distribution.json"
