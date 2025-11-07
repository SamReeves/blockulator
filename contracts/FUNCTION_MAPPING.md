# Contract Function Mapping Verification

This document verifies that all frontend JavaScript calls match the actual Vyper contract functions.

## Board Contract (`board.vy`)

### External Functions Available:

| Vyper Function | Parameters | JS Wrapper Method | Status |
|---------------|------------|-------------------|--------|
| `create_and_register` | subject, body, max_messages, max_message_length, min_donation (payable) | `createAndRegister()` | ✅ |
| `create_discussion` | discussion_address | Not wrapped (internal use) | ✅ |
| `terminate_discussion` | discussion_address | `terminateDiscussion()` | ✅ |
| `report_activity` | - | Not wrapped (called by discussions) | ✅ |
| `update_activity` | discussion_address | Not wrapped (manual sync) | ✅ |
| `withdraw_board_fees` | percentage | Not wrapped (owner only) | ✅ |
| `get_discussion_count` | - | `getDiscussionCount()` | ✅ |
| `get_discussion` | idx | `getDiscussion()` | ✅ |
| `get_all_discussions` | - | `getAllDiscussions()` | ✅ |
| `get_active_discussions` | - | `getActiveDiscussions()` | ✅ |
| `get_inactive_discussions` | - | `getInactiveDiscussions()` | ✅ |
| `can_terminate` | discussion_address | `canTerminate()` | ✅ |
| `get_min_inactive_value` | - | `getMinInactiveValue()` | ✅ |
| `can_create` | initial_value | `canCreate()` | ✅ |
| `get_stats` | - | `getStats()` | ✅ |

### Public Immutable Variables:

| Vyper Variable | JS Access | Status |
|----------------|-----------|--------|
| `discussion_blueprint` | `contract.discussion_blueprint()` | ✅ |
| `owner` | `contract.owner()` | ✅ |

## Discussion Contract (`discussion.vy`)

### External Functions Available:

| Vyper Function | Parameters | JS Wrapper Method | Status |
|---------------|------------|-------------------|--------|
| `post_message` | content (payable) | `postMessage()` | ✅ |
| `boost_message` | message_idx (payable) | `boostMessage()` | ✅ |
| `terminate` | - | Not wrapped (board calls this) | ✅ |
| `get_message_count` | - | `getMessageCount()` | ✅ |
| `get_message` | idx | `getMessage()` | ✅ |
| `get_all_messages` | - | `getAllMessages()` | ✅ |
| `get_min_donation_in_messages` | - | `getMinDonationInMessages()` | ✅ FIXED |
| `get_required_donation` | - | `getRequiredDonation()` | ✅ |
| `get_survivor_count` | - | `getSurvivorCount()` | ✅ |
| `get_survivors` | - | `getSurvivors()` | ✅ |
| `get_potential_payout` | - | `getPotentialPayout()` | ✅ |
| `get_status` | - | `getStatus()` | ✅ |
| `get_config` | - | `getConfig()` | ✅ |

### Public Immutable Variables:

| Vyper Variable | JS Access | Status |
|----------------|-----------|--------|
| `board` | `contract.board()` | ✅ Used |
| `creator` | `contract.creator()` | ✅ Used |
| `subject` | `contract.subject()` | ✅ Used |
| `body` | `contract.body()` | ✅ Used |
| `initial_value` | `contract.initial_value()` | ✅ Used |
| `creation_time` | `contract.creation_time()` | ✅ Used |
| `max_messages` | `contract.max_messages()` | ✅ Available |
| `max_message_length` | `contract.max_message_length()` | ✅ Available |
| `min_donation` | `contract.min_donation()` | ✅ Available |

### Public Mutable Variables:

| Vyper Variable | JS Access | Status |
|----------------|-----------|--------|
| `messages` | `contract.messages(idx)` | ✅ Available (use get_all_messages instead) |
| `total_pool` | `contract.total_pool()` | ✅ Available |
| `last_activity` | `contract.last_activity()` | ✅ Available |
| `terminated` | `contract.terminated()` | ✅ Available |

## Events

### Board Events:

| Event Name | Parameters | Handled in JS | Status |
|-----------|------------|---------------|--------|
| `DiscussionCreated` | discussion_address, creator, subject, initial_value, slot_index, timestamp, was_replacement | ✅ | ✅ |
| `DiscussionTerminated` | discussion_address, terminator, final_pool, age, timestamp | ✅ | ✅ |
| `DiscussionReplaced` | old_discussion, new_discussion, slot_index, old_initial_value, new_initial_value | ✅ | ✅ |
| `ActivityUpdated` | discussion_address, new_last_activity | ✅ | ✅ |
| `FeesWithdrawn` | owner, amount, remaining_balance, timestamp | ❌ | Not needed |

### Discussion Events:

| Event Name | Parameters | Handled in JS | Status |
|-----------|------------|---------------|--------|
| `MessagePosted` | author, donation, content, timestamp, index, was_replacement | ✅ | ✅ |
| `MessageEvicted` | author, original_donation, index, replaced_by | ✅ | ✅ |
| `DiscussionTerminated` | terminator, final_pool, survivor_count, timestamp | ✅ | ✅ |
| `PayoutDistributed` | recipient, amount | ✅ | ✅ |
| `MessageBoosted` | supporter, message_author, message_index, boost_amount, new_total_donation, timestamp | ✅ | ✅ |

## Issues Fixed:

1. ✅ **FIXED**: `discussion.js` was calling `get_min_donation()` instead of `get_min_donation_in_messages()`
2. ✅ **FIXED**: `discussions-app.js` had hardcoded address instead of using `CONTRACT_ADDRESSES.DISCUSSION_BOARD`

## Verification Summary:

- ✅ All Board contract functions match
- ✅ All Discussion contract functions match
- ✅ All events properly handled
- ✅ Function names corrected
- ✅ Address configuration uses constants

**Status: 100% Verified ✅**

All frontend function calls now exactly match the deployed Vyper contracts.

