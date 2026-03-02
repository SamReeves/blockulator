# Deployment Configuration for Zero-Fee Games

This document specifies the required constructor parameters for deploying game contracts with rock-bottom fees and minimal barriers to entry.

## Game Contracts

### Message Board (`message_board.vy`)

**Constructor:**
```python
def __init__(min_fee: uint256, rate_limit: uint256):
```

**Recommended config:**
- `min_fee: 0` (no minimum posting fee)
- `rate_limit: 0` (no cooldown between posts)

**Rationale:** The contract has no `withdraw()` function, so fees would be trapped forever. Setting both to zero eliminates fees entirely and removes the rate limit barrier.

---

### Pissing Contest (`pissing_contest.vy`)

**Constructor:**
```python
def __init__(max_donations: uint16, min_donation: uint256):
```

**Recommended config:**
- `max_donations: 10` (or higher for longer rounds)
- `min_donation: 1` (1 wei minimum)

**Rationale:** The contract has 0% fees already. Setting `min_donation` to 1 wei (the smallest possible ETH unit) removes the practical barrier to entry while preventing spam from zero-value transactions.

**Note:** The owner can update `min_donation` later via `update_minimum_donation()` if needed.

---

### Dice Gods (`dice_gods.vy`)

**Constructor:**
```python
def __init__(min_donation: uint256):
```

**Recommended config:**
- `min_donation: 1` (1 wei minimum)

**Rationale:** The contract has 0% fees and distributes 100% of the pot to winners. Setting `min_donation` to 1 wei removes barriers while preventing zero-value spam.

---

## Other Game Contracts (No Config Changes Needed)

The following contracts already have minimal/zero fees and no configurable minimums:

- **Last Call** (`last_call.vy`) - 0% fees, 1 wei minimum hardcoded
- **King of the Hill** (`king_of_the_hill.vy`) - 0% fees, minimum payment is game mechanic (stakes must grow by 1% + 1000 wei)
- **Pay It Forward** (`pay_it_forward.vy`) - 0% fees, 1 wei minimum hardcoded
- **Pay It Backward** (`pay_it_backward.vy`) - 0% fees, 1 wei minimum hardcoded
- **Time to Make the Donuts** (`time_to_make_the_donuts.vy`) - 0% fees, 1 wei minimum hardcoded
- **Satan, Moloch, Baal** (`satan_moloch_baal.vy`) - 0% fees (all ETH burned), 1 wei minimum hardcoded

## Market Contracts

### Future Factory (`future_factory.vy`)

**Constants (hardcoded):**
```python
CREATION_FEE_PERCENT: constant(uint256) = 0
MARKET_FEE_PERCENT: constant(uint256) = 0
MIN_INITIAL_VALUE: constant(uint256) = 100000000000000  # 0.0001 ETH
CREATION_COOLDOWN: constant(uint256) = 300  # 5 minutes
```

**Rationale:** The factory already has 0% fees. The 5-minute cooldown and 0.0001 ETH minimum prevent spam while remaining accessible.

---

## Summary

| Contract | Parameter | Recommended Value | Current Frontend |
|----------|-----------|-------------------|------------------|
| message_board | `min_fee` | `0` | ✅ Fixed (removed owner panel) |
| message_board | `rate_limit` | `0` | ✅ Fixed (removed owner panel) |
| pissing_contest | `min_donation` | `1` | ✅ No changes needed |
| dice_gods | `min_donation` | `1` | ✅ No changes needed |
| future_factory | `CREATION_FEE_PERCENT` | `0` (hardcoded) | ✅ Fixed (removed false fee claims) |
| future_factory | `MARKET_FEE_PERCENT` | `0` (hardcoded) | ✅ Fixed (removed false fee claims) |

All frontend language has been updated to reflect these zero-fee configurations.
