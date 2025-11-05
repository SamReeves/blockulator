# @version 0.4.3

"""
@title Message Board - Enhanced Edition
@author L1Ca$h
@notice Pay to post messages on-chain with anti-spam protections
@dev Simple transparent message board with robust safeguards

     IMPROVEMENTS (2025 v0.4.3 Update):
     - Updated to Vyper 0.4.3 with pinned version for reproducibility
     - Added formal invariant documentation
     - Enhanced loop correctness in get_recent_messages
     - Documented rate limiting mechanism
     - Checked send() calls to prevent silent failures ✓
     - Emergency pause mechanism ✓
     - Ownership transfer (2-step) ✓
     - Minimum posting fee ✓
     - Rate limiting per user ✓
     - Enhanced event indexing ✓
     - Message flagging capability ✓
     - Per-user statistics ✓
     
     CONTRACT INVARIANTS:
     - INVARIANT: messages array grows monotonically (append-only)
     - INVARIANT: message_id = index in messages array
     - INVARIANT: Contract accumulates all fees (no automatic distribution)
     - Rate limiting enforced per-address with configurable cooldown
"""

# ============= DATA STRUCTURES =============

struct Message:
    poster: address
    content: String[280]
    amount: uint256
    timestamp: uint256
    block_number: uint256
    flagged: bool

# ============= STATE VARIABLES =============

owner: public(address)
proposed_owner: public(address)
paused: public(bool)

# Message storage
# INVARIANT: messages.length monotonically increases (append-only)
# INVARIANT: message_id corresponds to array index
# NOTE: DynArray capacity is 10000 messages (hard limit enforced by Vyper)
messages: public(DynArray[Message, 10000])
total_collected: public(uint256)

# Anti-spam settings
# INVARIANT: last_post_time[addr] ≤ block.timestamp
# INVARIANT: rate_limit_seconds enforces minimum time between posts per address
minimum_post_fee: public(uint256)
rate_limit_seconds: public(uint256)
last_post_time: public(HashMap[address, uint256])

# Per-user statistics
user_post_count: public(HashMap[address, uint256])
user_total_paid: public(HashMap[address, uint256])

# ============= EVENTS =============

event MessagePosted:
    poster: indexed(address)
    message_id: indexed(uint256)
    amount: uint256
    content: String[280]
    timestamp: uint256

event MessageFlagged:
    message_id: indexed(uint256)
    flagged_by: indexed(address)
    flagged: bool

event FeesWithdrawn:
    owner: indexed(address)
    amount: uint256

event OwnershipTransferProposed:
    current_owner: indexed(address)
    proposed_owner: indexed(address)

event OwnershipTransferred:
    previous_owner: indexed(address)
    new_owner: indexed(address)

event EmergencyPauseToggled:
    paused: bool
    toggled_by: indexed(address)

event MinimumFeeUpdated:
    old_fee: uint256
    new_fee: uint256

event RateLimitUpdated:
    old_limit: uint256
    new_limit: uint256

# ============= INITIALIZATION =============

@deploy
def __init__(min_fee: uint256, rate_limit: uint256):
    """
    @notice Initialize the message board
    @param min_fee Minimum posting fee in wei (e.g., 0.001 ETH = 1000000000000000)
    @param rate_limit Minimum seconds between posts per user (e.g., 60 for 1 minute)
    
    @dev ESTABLISHES INVARIANTS:
         - messages array initialized empty (length 0)
         - All counters initialized to zero
         - Rate limiting parameters set
         - No messages flagged (empty array)
    """
    self.owner = msg.sender
    self.proposed_owner = empty(address)
    self.paused = False
    self.minimum_post_fee = min_fee
    self.rate_limit_seconds = rate_limit
    self.total_collected = 0

# ============= CORE FUNCTIONALITY =============

@payable
@external
def post_message(content: String[280]):
    """
    @notice Post a message to the board
    @param content Message content (max 280 chars, min 1 char)
    
    @dev RATE LIMITING:
         - Enforces minimum time between posts per address
         - First post from address has no restriction
         - Prevents spam while allowing legitimate use
    
    @dev INVARIANT PRESERVATION:
         - message_id = current array length (before append)
         - Array grows by exactly 1
         - No external calls (no reentrancy risk)
    """
    assert not self.paused, "Board is paused"
    assert msg.value >= self.minimum_post_fee, "Fee below minimum"
    assert len(content) > 0, "Message cannot be empty"
    assert len(content) <= 280, "Message too long"
    
    # Rate limiting check (skip for first post from address)
    last_post: uint256 = self.last_post_time[msg.sender]
    if last_post > 0:
        time_since_last: uint256 = block.timestamp - last_post
        assert time_since_last >= self.rate_limit_seconds, "Rate limit: wait longer"
    
    message_id: uint256 = len(self.messages)
    
    # Update state (no external calls, no reentrancy concerns)
    self.messages.append(Message(
        poster=msg.sender,
        content=content,
        amount=msg.value,
        timestamp=block.timestamp,
        block_number=block.number,
        flagged=False
    ))
    
    self.total_collected += msg.value
    self.last_post_time[msg.sender] = block.timestamp
    self.user_post_count[msg.sender] += 1
    self.user_total_paid[msg.sender] += msg.value
    
    log MessagePosted(msg.sender, message_id, msg.value, content, block.timestamp)

# ============= ADMIN FUNCTIONS =============

@external
def withdraw_fees():
    """
    @notice Owner withdraws accumulated fees
    
    @dev CEI PATTERN:
         - Checks amount before transfer
         - No state changes needed (balance is implicit)
         - Checked transfer ensures atomicity
         - Contract can continue receiving fees after withdrawal
    """
    assert msg.sender == self.owner, "Only owner"
    amount: uint256 = self.balance
    assert amount > 0, "Nothing to withdraw"
    
    # CRITICAL: Checked transfer (revert on failure)
    success: bool = send(self.owner, amount)
    assert success, "Withdrawal failed"
    
    log FeesWithdrawn(self.owner, amount)

@external
def flag_message(message_id: uint256, flagged: bool):
    """
    @notice Flag/unflag a message (content moderation)
    @param message_id ID of message to flag
    @param flagged True to flag, False to unflag
    """
    assert msg.sender == self.owner, "Only owner"
    assert message_id < len(self.messages), "Invalid message ID"
    
    self.messages[message_id].flagged = flagged
    log MessageFlagged(message_id, msg.sender, flagged)

@external
def propose_ownership_transfer(new_owner: address):
    """
    @notice Propose a new owner (2-step transfer for safety)
    @param new_owner Address of proposed new owner
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_owner != empty(address), "Invalid address"
    assert new_owner != self.owner, "Already owner"
    
    self.proposed_owner = new_owner
    log OwnershipTransferProposed(self.owner, new_owner)

@external
def accept_ownership():
    """
    @notice Accept ownership transfer (must be called by proposed owner)
    """
    assert msg.sender == self.proposed_owner, "Not proposed owner"
    assert self.proposed_owner != empty(address), "No transfer proposed"
    
    old_owner: address = self.owner
    self.owner = self.proposed_owner
    self.proposed_owner = empty(address)
    
    log OwnershipTransferred(old_owner, self.owner)

@external
def toggle_pause():
    """
    @notice Emergency pause/unpause the message board
    """
    assert msg.sender == self.owner, "Only owner"
    
    self.paused = not self.paused
    log EmergencyPauseToggled(self.paused, msg.sender)

@external
def update_minimum_fee(new_fee: uint256):
    """
    @notice Update the minimum posting fee
    @param new_fee New minimum fee in wei
    """
    assert msg.sender == self.owner, "Only owner"
    
    old_fee: uint256 = self.minimum_post_fee
    self.minimum_post_fee = new_fee
    log MinimumFeeUpdated(old_fee, new_fee)

@external
def update_rate_limit(new_limit: uint256):
    """
    @notice Update the rate limit seconds
    @param new_limit New rate limit in seconds
    """
    assert msg.sender == self.owner, "Only owner"
    
    old_limit: uint256 = self.rate_limit_seconds
    self.rate_limit_seconds = new_limit
    log RateLimitUpdated(old_limit, new_limit)

# ============= VIEW FUNCTIONS =============

@view
@external
def get_message_count() -> uint256:
    """
    @notice Get total number of messages
    @return Total message count
    """
    return len(self.messages)

@view
@external
def get_message(index: uint256) -> Message:
    """
    @notice Get a specific message by index
    @param index Message index (0-based)
    @return Message struct
    """
    assert index < len(self.messages), "Invalid index"
    return self.messages[index]

@view
@external
def get_recent_messages(count: uint256) -> DynArray[Message, 100]:
    """
    @notice Get most recent N messages
    @param count Number of recent messages to retrieve (max 100)
    @return Array of recent messages (most recent last)
    
    @dev LOOP CORRECTNESS:
         - Bounded loop with explicit bound=100 (Vyper requirement)
         - Start index calculated to get last N messages
         - Iterator count verified: (total - start) <= actual_count <= 100
         - Empty array returned if no messages exist
    
    @dev MATHEMATICAL CORRECTNESS:
         Given: count requested, total messages available
         - actual_count = min(count, 100)  [enforce max return size]
         - start = max(0, total - actual_count)  [get last N]
         - iterations = total - start <= actual_count <= 100  [proven bound]
    """
    result: DynArray[Message, 100] = []
    total: uint256 = len(self.messages)
    
    if total == 0:
        return result
    
    # Calculate start index and actual count
    # PROOF: actual_count <= 100 by construction
    actual_count: uint256 = count
    if actual_count > 100:
        actual_count = 100
    
    # PROOF: start >= 0 always (uint256), start < total if actual_count < total
    start: uint256 = 0
    if total > actual_count:
        start = total - actual_count
    
    # PROOF: Loop iterations = (total - start) <= actual_count <= 100
    # Therefore bound=100 is sufficient
    for i: uint256 in range(start, total, bound=100):
        result.append(self.messages[i])
    
    return result

@view
@external
def get_user_stats(user: address) -> (uint256, uint256, uint256):
    """
    @notice Get statistics for a specific user
    @param user Address to query
    @return Tuple of (post_count, total_paid, last_post_time)
    """
    return (
        self.user_post_count[user],
        self.user_total_paid[user],
        self.last_post_time[user]
    )

@view
@external
def get_time_until_next_post(user: address) -> uint256:
    """
    @notice Check how long until user can post again
    @param user Address to query
    @return Seconds until next post allowed (0 if can post now)
    """
    last_post: uint256 = self.last_post_time[user]
    if last_post == 0:
        return 0
    
    elapsed: uint256 = block.timestamp - last_post
    if elapsed >= self.rate_limit_seconds:
        return 0
    
    return self.rate_limit_seconds - elapsed

@view
@external
def get_balance() -> uint256:
    """
    @notice Get the current contract balance
    @return Contract balance in wei
    """
    return self.balance

@view
@external
def get_config() -> (uint256, uint256, bool):
    """
    @notice Get current configuration
    @return Tuple of (minimum_post_fee, rate_limit_seconds, paused)
    """
    return (self.minimum_post_fee, self.rate_limit_seconds, self.paused)
