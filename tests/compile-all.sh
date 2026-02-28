#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
SRC="$ROOT/contracts/src"
BUILD="$ROOT/contracts/build"
BYTECODE_DIR="$BUILD/bytecode"
ABI_DIR="$BUILD/abis"

mkdir -p "$BYTECODE_DIR" "$ABI_DIR"

PASS=0
FAIL=0

compile() {
    local src_path="$1"
    local name="$2"
    local is_blueprint="${3:-false}"

    printf "${BLUE}Compiling${NC} %-30s " "$name"

    if [ ! -f "$src_path" ]; then
        echo -e "${RED}NOT FOUND${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi

    if ! vyper -f abi "$src_path" > "$ABI_DIR/$name.json" 2>/tmp/vyper_err; then
        echo -e "${RED}ABI FAIL${NC}"
        cat /tmp/vyper_err
        FAIL=$((FAIL + 1))
        return 1
    fi

    local bytecode
    if ! bytecode=$(vyper -f bytecode "$src_path" 2>/tmp/vyper_err); then
        echo -e "${RED}BYTECODE FAIL${NC}"
        cat /tmp/vyper_err
        FAIL=$((FAIL + 1))
        return 1
    fi
    echo "{\"bytecode\":\"$bytecode\"}" > "$BYTECODE_DIR/$name.json"

    if [ "$is_blueprint" = "true" ]; then
        local bp_bytecode
        if ! bp_bytecode=$(vyper -f blueprint_bytecode "$src_path" 2>/tmp/vyper_err); then
            echo -e "${RED}BLUEPRINT FAIL${NC}"
            cat /tmp/vyper_err
            FAIL=$((FAIL + 1))
            return 1
        fi
        echo "{\"bytecode\":\"$bp_bytecode\"}" > "$BYTECODE_DIR/$name-blueprint.json"
        local size=$((${#bytecode} / 2 - 1))
        echo -e "${GREEN}OK${NC} (${size}B + blueprint)"
    else
        local size=$((${#bytecode} / 2 - 1))
        echo -e "${GREEN}OK${NC} (${size}B)"
    fi

    PASS=$((PASS + 1))
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Compiling All Contracts (Vyper $(vyper --version 2>&1))${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${YELLOW}--- Calculators ---${NC}"
compile "$SRC/tools/math/exp.vy"           "exp"
compile "$SRC/tools/math/ln.vy"            "ln"
compile "$SRC/tools/math/sqrt.vy"          "sqrt"
compile "$SRC/tools/math/factorial.vy"     "factorial"
compile "$SRC/tools/math/ln_factorial.vy"  "ln-factorial"
compile "$SRC/tools/math/erf.vy"           "erf"
compile "$SRC/tools/math/norm_cdf.vy"      "norm-cdf"
compile "$SRC/tools/math/atan.vy"          "atan"
compile "$SRC/tools/math/pow2.vy"          "pow2"
compile "$SRC/tools/math/pow10.vy"         "pow10"
compile "$SRC/tools/math/log2.vy"          "log2"
compile "$SRC/tools/math/log10.vy"         "log10"
compile "$SRC/tools/math/sinh.vy"          "sinh"
compile "$SRC/tools/math/cosh.vy"          "cosh"
compile "$SRC/tools/math/zscore.vy"        "zscore"
compile "$SRC/tools/math/gaussian_tail.vy" "gaussian-tail"
compile "$SRC/tools/math/binomial_coeff.vy" "binomial-coeff"
compile "$SRC/tools/math/norm_pdf.vy"       "norm-pdf"
compile "$SRC/tools/math/gcd.vy"            "gcd"

echo ""
echo -e "${YELLOW}--- Trig ---${NC}"
compile "$SRC/tools/trig/sin.vy"           "sin"
compile "$SRC/tools/trig/cos.vy"           "cos"
compile "$SRC/tools/trig/tanh.vy"          "tanh"

echo ""
echo -e "${YELLOW}--- Constants ---${NC}"
compile "$SRC/tools/constants/e.vy"        "e"
compile "$SRC/tools/constants/pi.vy"       "pi"
compile "$SRC/tools/constants/tau.vy"      "tau"

echo ""
echo -e "${YELLOW}--- Market / Futures ---${NC}"
compile "$SRC/market/uniform_future.vy"            "uniform-future"           true
compile "$SRC/market/linear_future.vy"             "linear-future"            true
compile "$SRC/market/exponential_future.vy"        "exponential-future"       true
compile "$SRC/market/gaussian_future.vy"           "gaussian-future"          true
compile "$SRC/market/inverted_gaussian_future.vy"  "inverted-gaussian-future" true
compile "$SRC/market/future_factory.vy"            "future-factory"

echo ""
echo -e "${YELLOW}--- Identity ---${NC}"
compile "$SRC/identity/badge.vy"           "badge"            true
compile "$SRC/identity/badge_factory.vy"   "badge-factory"

echo ""
echo -e "${YELLOW}--- Content ---${NC}"
compile "$SRC/content/image_content_v3.vy"        "image-content-v3"     true
compile "$SRC/content/text_content_v4.vy"         "text-content-v4"      true
compile "$SRC/content/content_factory_v4.vy"      "content-factory-v4"

echo ""
echo -e "${YELLOW}--- Games ---${NC}"
compile "$SRC/games/pissing_contest.vy"           "pissing-contest"
compile "$SRC/games/message_board.vy"             "message-board"
compile "$SRC/games/pay_it_forward.vy"            "pay-it-forward"
compile "$SRC/games/pay_it_backward.vy"           "pay-it-backward"
compile "$SRC/games/king_of_the_hill.vy"          "king-of-the-hill"
compile "$SRC/games/last_call.vy"                 "last-call"
compile "$SRC/games/time_to_make_the_donuts.vy"   "time-to-make-the-donuts"
compile "$SRC/games/dice_gods.vy"                 "dice-gods"
compile "$SRC/games/satan_moloch_baal.vy"         "satan-moloch-baal"

echo ""
echo -e "${YELLOW}--- Test Contracts ---${NC}"
compile "$SRC/tests/math_tools_caller.vy"  "math-tools-caller"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All $PASS contracts compiled successfully${NC}"
else
    echo -e "${RED}$FAIL failures${NC}, ${GREEN}$PASS passed${NC}"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

exit $FAIL
