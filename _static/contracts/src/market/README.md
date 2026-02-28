# Futures Marketplace - Design Overview

## Architecture

The futures marketplace consists of **2 contracts**:

### 1. Eulerian Future Blueprint (`eulerian_future.vy`)

**Single unified contract** supporting 4 distribution types:

- **Type 0 - Uniform**: Linear payout over time
  - Weight = elapsed_time / total_lifetime
  - Predictable, constant rate
  - State: `last_cache` = proportion elapsed

- **Type 1 - Gaussian**: Bell curve centered at midpoint
  - Uses Lin 1990 approximation
  - Symmetric risk - value peaks at midpoint
  - State: `last_cache` = tail probability

- **Type 2 - Exponential Decay**: Early payouts favored
  - λ = 3/lifetime (95% decay by end)
  - Uses e^(-x) = 1/e^x with E_TAB
  - State: `last_cache` = e^(-λt)

- **Type 3 - Exponential Growth**: Late payouts favored
  - Inverse of decay: CDF = 1 - e^(-λt)
  - Payouts increase over time
  - State: `last_cache` = CDF value

**Key Insight**: All 4 types use the **same E_TAB table**! 
- Gaussian uses e^x directly
- Exponentials use 1/e^x for e^(-x) calculation
- No need for separate EXP_DECAY_TAB

### 2. Future Factory (`future_factory.vy`)
- Factory pattern with **single blueprint**
- Top 100 structure (mirrors `board.vy` architecture)
- Marketplace functions for listing/buying
- Free valuation functions (view calls)
- Distribution type selected at creation time

## Economic Model

### Fees
- **Creation Fee**: 1% (anti-spam, reasonable barrier)
- **Trade Fee**: 1% (marketplace transaction fee)
- All fees accumulate in `market_balance` for owner withdrawal

### Anti-Spam
- **Cooldown**: 5 minutes between creations per address
- **Minimum Value**: 0.0001 ETH (100000000000000 wei)
- **Lifetime Limits**: 5 minutes to 1000 years

## Distribution Types (Single Contract)

All types in `eulerian_future.vy` - selected by `distribution_type` parameter (0-3):

### Type 0: Uniform Distribution
```
Parameters: None (purely linear)
Formula: weight = (t_current - t_last) / lifetime
Use case: All times equally likely, constant hazard rate
Value curve: Linear decline from 100% to 0%
Trading: Most predictable, simplest valuation
State: last_cache = proportion elapsed (0.0 to 1.0)
```

### Type 1: Gaussian (Normal) Distribution
```
Parameters: mean = lifetime/2, stddev = lifetime/sqrt(12)
Formula: Lin 1990 approximation with tail probabilities
Use case: Event expected around midpoint with uncertainty
Value curve: Low → High (midpoint) → Low
Trading: Value peaks at midpoint, decays at extremes
State: last_cache = tail probability
Math: Uses E_TAB for e^x calculation
```

### Type 2: Exponential Decay Distribution
```
Parameters: λ = 3/lifetime (95% decay by end)
Formula: weight = (e^(-λt_last) - e^(-λt_current)) / e^(-λt_last)
Use case: Early payouts favored - time-to-event, survival analysis
Value curve: High → Rapid decay → Long tail
Trading: High initial value, fast depreciation
State: last_cache = e^(-λt) 
Math: Uses e^(-x) = 1/e^x with E_TAB
```

### Type 3: Exponential Growth Distribution
```
Parameters: λ = 3/lifetime (same as decay)
Formula: CDF difference - payouts increase over time
Use case: Late payouts favored - accumulating rewards
Value curve: Low → Slow growth → High (near end)
Trading: Low initial value, appreciation over time
State: last_cache = CDF value (cumulative distribution)
Math: Uses e^(-x) = 1/e^x with E_TAB
```

## Marketplace Flow

### Creating a Future
1. User calls `create_future(lifetime, distribution_type)` with ETH
   - distribution_type: 0=Uniform, 1=Gaussian, 2=ExpDecay, 3=ExpGrowth
2. Factory takes 1% creation fee
3. Selects appropriate blueprint based on distribution_type
4. Deploys future from chosen blueprint with 99% of value
5. Registers in futures array (or replaces expired future)
6. Returns future address

### Listing a Future
1. Owner calls `list_future(future_addr, ask_price)`
2. Factory validates ownership and checks not expired
3. Computes expected value for transparency
4. Stores listing
5. Emits `FutureListed` event

### Buying a Future
1. Buyer calls `buy_future(future_addr)` with exact price
2. Factory takes 1% marketplace fee
3. Pays seller 99% of price
4. Calls `future.transfer(buyer)` - this pays out accumulated value to seller
5. Seller receives: sale price + accumulated future value
6. Buyer becomes new owner with clean slate
7. Listing is cleared

### Valuation (Free)
- `get_expected_value(future_addr)` - compute fair value
- `suggest_price(future_addr, premium_percent)` - suggest listing price
- Always accurate (recomputed on every call)
- Distribution-specific logic

## Replacement Logic

When futures array is full (100 futures):
- Scan for first **expired** future
- Replace it with newly created future
- Update all mappings
- Emit `FutureReplaced` event
- Simpler than board's "inactive + lowest value" logic

## Key Design Decisions

✅ **Single Unified Blueprint** - One E_TAB table serves all distributions
✅ **Efficient Math** - e^(-x) = 1/e^x eliminates need for separate table
✅ **Clean Branching** - Distribution type selected once at creation
✅ **Uniform Interface** - All 4 types expose same view functions
✅ **Low Creation Fee (1%)** - Barrier to spam but not prohibitive  
✅ **Low Trade Fee (1%)** - Encourage active marketplace
✅ **Simple Ask Model** - Seller sets price, buyer accepts
✅ **Time-Based Expiry** - Clear, deterministic replacement logic
✅ **Free Valuation** - View functions enable price discovery
✅ **5min Cooldown** - Per-address spam prevention
✅ **Top 100 Structure** - Proven pattern from board.vy

## Implementation Status

**Current**: Pseudocode complete, ready for implementation

**Next Steps**:
1. Implement `future_blueprint.vy` with real code
2. Implement `future_factory.vy` with real code
3. Test locally with Vyper compiler
4. Deploy to testnet
5. Build frontend UI
6. Add to main site navigation

## Files

```
/contracts/src/market/
├── eulerian_future.vy     # Unified blueprint: All 4 distributions ✅
├── future_factory.vy      # Factory and marketplace (pseudocode)
└── README.md              # This file
```

## Dependencies

### Math Libraries (embedded in eulerian_future.vy)

**Single E_TAB table** serves all calculations:
- `E_TAB` constant (e^x lookup table from tools/e.vy)

**Functions using E_TAB**:
- `_e_power(x)` - Calculate e^x directly (Gaussian)
- `_exp_minus(λ, t)` - Calculate e^(-λt) = 1/e^(λt) (Exponential types)

**Gaussian-specific functions**:
- `_z_score()` - z-score calculation
- `_y_constant()` - Lin 1990 y-constant  
- `_tail()` - Lin 1990 tail probability
- `_weight_phase()` - Gaussian weight with phase logic

**Uniform**: Simple division - no special math needed

### Optional Standalone Tool
- `exp_decay.vy` - Standalone e^(-x) calculator (in tools/math/)
- Not needed for eulerian_future.vy since it uses e^(-x) = 1/e^x

## Questions for Discussion

1. Should we allow direct peer-to-peer transfers outside marketplace?
   - Currently: Users can call `future.transfer()` directly
   - Pro: Maximum flexibility
   - Con: Bypasses marketplace fee

2. Advanced features for v2?
   - Batch operations (create multiple futures at once)
   - Bid/ask order book (more complex)
   - Automated market maker (bonding curve pricing)
   - Future bundles (packages of futures)

3. UI considerations?
   - How to visualize different distribution types?
   - Interactive value charts?
   - Real-time expected value updates?
   - Filter by distribution type?

