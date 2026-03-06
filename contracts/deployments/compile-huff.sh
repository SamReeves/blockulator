#!/bin/bash

# Compile Huff contracts
# Usage: ./compile-huff.sh [contract-path]

set -e

# Add huffc to PATH
export PATH="$HOME/.huff/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
HUFF_DIR="contracts/src/tools/huff"
BUILD_DIR="contracts/build/huff"
ABI_DIR="contracts/build/abis"
BYTECODE_DIR="contracts/build/bytecode"

# Create build directories
mkdir -p "$BUILD_DIR"
mkdir -p "$ABI_DIR"
mkdir -p "$BYTECODE_DIR"

# Check if huffc is installed
if ! command -v huffc &> /dev/null; then
    echo -e "${RED}Error: huffc not found. Please install Huff compiler.${NC}"
    echo "Run: curl -L get.huff.sh | bash && huffup"
    exit 1
fi

echo -e "${GREEN}Huff Compiler Version:${NC}"
huffc --version
echo ""

# Function to compile a single Huff file
compile_huff_file() {
    local huff_file=$1
    local contract_name=$(basename "$huff_file" .huff)
    
    echo -e "${YELLOW}Compiling ${contract_name}...${NC}"
    
    # Compile to bytecode (both creation and runtime)
    if huffc "$huff_file" -b > "${BUILD_DIR}/${contract_name}.bin" 2>/dev/null && \
       huffc "$huff_file" -r > "${BUILD_DIR}/${contract_name}.runtime.bin" 2>/dev/null; then
        echo -e "${GREEN}✓ Bytecode generated (creation + runtime)${NC}"
        
        # Copy to bytecode dir in JSON format (for consistency with Vyper contracts)
        echo "{\"bytecode\": \"0x$(cat ${BUILD_DIR}/${contract_name}.bin)\"}" > "${BYTECODE_DIR}/${contract_name}.json"
        
        # Generate minimal ABI (Huff doesn't auto-generate ABI, so we create a basic one)
        # This should be customized based on the contract's interface
        if [ "$contract_name" = "exp" ]; then
            cat > "${ABI_DIR}/${contract_name}.json" << EOF
[
  {
    "type": "function",
    "name": "calculate",
    "inputs": [{"name": "x", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "get_constant",
    "inputs": [],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  }
]
EOF
            echo -e "${GREEN}✓ ABI generated${NC}"
        elif [ "$contract_name" = "test_table_lookup" ]; then
            cat > "${ABI_DIR}/${contract_name}.json" << EOF
[
  {
    "type": "function",
    "name": "lookup",
    "inputs": [{"name": "i", "type": "uint256"}, {"name": "d", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  }
]
EOF
            echo -e "${GREEN}✓ ABI generated${NC}"
        elif [[ "$contract_name" =~ ^test_(one|two)_iter_exp$ ]] || [ "$contract_name" = "test_basic_math" ]; then
            cat > "${ABI_DIR}/${contract_name}.json" << EOF
[
  {
    "type": "function",
    "name": "calculate",
    "inputs": [{"name": "x", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  }
]
EOF
            echo -e "${GREEN}✓ ABI generated${NC}"
        elif [ "$contract_name" = "test_binary256" ]; then
            cat > "${ABI_DIR}/binary256.json" << EOF
[
  {
    "type": "function",
    "name": "add",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "sub",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "mul",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "div",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "mulRaw",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "divRaw",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "fromFixed18",
    "inputs": [{"name": "x", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "toFixed18",
    "inputs": [{"name": "x", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  }
]
EOF
            echo -e "${GREEN}✓ ABI generated${NC}"
        elif [ "$contract_name" = "test_fixedpoint128" ]; then
            cat > "${ABI_DIR}/fixedpoint128.json" << EOF
[
  {
    "type": "function",
    "name": "add",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "sub",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "mul",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "div",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "mulRaw",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "divRaw",
    "inputs": [{"name": "a", "type": "uint256"}, {"name": "b", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "fromFixed18",
    "inputs": [{"name": "x", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "toFixed18",
    "inputs": [{"name": "x", "type": "uint256"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "pure"
  }
]
EOF
            echo -e "${GREEN}✓ ABI generated${NC}"
        fi
        
        echo -e "${GREEN}✓ ${contract_name} compiled successfully${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Compilation failed for ${contract_name}${NC}\n"
        return 1
    fi
}

# Main compilation logic
if [ -n "$1" ]; then
    # Compile specific file
    compile_huff_file "$1"
else
    # Compile all Huff contracts in the huff directory
    echo -e "${GREEN}Compiling all Huff contracts...${NC}\n"
    
    compiled=0
    failed=0
    
    # Only compile top-level contracts (not includes or tables)
    for huff_file in "$HUFF_DIR"/*.huff; do
        if [ -f "$huff_file" ]; then
            # Skip constants files and library files (no MAIN macro)
            basename_file=$(basename "$huff_file")
            if [[ "$basename_file" == *"_constants.huff" ]] || \
               [[ "$basename_file" == "binary256.huff" ]] || \
               [[ "$basename_file" == "fixedpoint128.huff" ]] || \
               [[ "$basename_file" == "fp128.huff" ]]; then
                continue
            fi
            
            if compile_huff_file "$huff_file"; then
                ((compiled++))
            else
                ((failed++))
            fi
        fi
    done
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Compilation Summary:${NC}"
    echo -e "${GREEN}  ✓ Compiled: ${compiled}${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "${RED}  ✗ Failed: ${failed}${NC}"
    fi
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi
