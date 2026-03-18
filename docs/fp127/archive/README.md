# Archived FP127 Code

Code preserved here was removed from the main build but may be restored in the future.

## lambertwm1.huff

**Lambert W_{-1}** (secondary branch) for 127.128 fixed-point arithmetic.

### Why archived

Removed to stay under the huffc compiler's internal expanded-source limit (~115KB). The full FP127 contract with lambertwm1 triggered:
```
"byte index 115922 is out of bounds"
```

### How to restore

1. Move `lambertwm1.huff` to `contracts/src/tools/huff/fp127/`
2. Add `#include "lambertwm1.huff"` to `fp127.huff` and `test_fp127.huff`
3. Add selector checks and jump blocks for `lambertWm1` and `lambertWm1Raw`
4. Add `#define function lambertWm1(uint256)...` and `lambertWm1Raw(uint256)...`

Alternatively, implement as a separate library contract (deploy lambertwm1 standalone, call via `CALL`) to avoid the single-contract size limit.
