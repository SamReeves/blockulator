# @version 0.4.3

"""
@title Message Board - Minimalist Edition
@author L1Ca$h
@notice Pay to post messages on-chain with rate limiting
@dev Ultra-simple message board with essential features only
"""

# ============= DATA STRUCTURES =============

struct Message:
    poster: address
    content: String[280]
    amount: uint256
    timestamp: uint256

# ============= STATE VARIABLES =============

owner: public(immutable(address))
minimum_post_fee: public(immutable(uint256))
rate_limit_seconds: public(immutable(uint256))

messages: public(DynArray[Message, 1000])
total_collected: public(uint256)
last_post_time: public(HashMap[address, uint256])

# ============= EVENTS =============

event MessagePosted:
    poster: indexed(address)
    message_id: indexed(uint256)
    amount: uint256
    content: String[280]

event FeesWithdrawn:
    owner: indexed(address)
    amount: uint256

# ============= INITIALIZATION =============

@deploy
def __init__(min_fee: uint256, rate_limit: uint256):
    """
    @notice Initialize the message board
    @param min_fee Minimum posting fee in wei
    @param rate_limit Minimum seconds between posts per user
    """
    owner = msg.sender
    minimum_post_fee = min_fee
    rate_limit_seconds = rate_limit
    self.total_collected = 0

# ============= CORE FUNCTIONALITY =============

@payable
@external
def post_message(content: String[280]):
    """
    @notice Post a message to the board
    @param content Message content (max 280 chars)
    """
    assert msg.value >= minimum_post_fee, "Below minimum fee"
    assert len(content) > 0, "Empty message"
    
    # Rate limiting
    last_post: uint256 = self.last_post_time[msg.sender]
    if last_post > 0:
        time_since: uint256 = block.timestamp - last_post
        assert time_since >= rate_limit_seconds, "Too soon, wait longer"
    
    message_id: uint256 = len(self.messages)
    
    self.messages.append(Message(
        poster=msg.sender,
        content=content,
        amount=msg.value,
        timestamp=block.timestamp
    ))
    
    self.total_collected += msg.value
    self.last_post_time[msg.sender] = block.timestamp
    
    log MessagePosted(msg.sender, message_id, msg.value, content)

# ============= ADMIN FUNCTIONS =============

@external
def withdraw():
    """
    @notice Owner withdraws accumulated fees
    """
    assert msg.sender == owner, "Only owner"
    amount: uint256 = self.balance
    assert amount > 0, "Nothing to withdraw"
    
    send(owner, amount)
    log FeesWithdrawn(owner, amount)

# ============= VIEW FUNCTIONS =============

@view
@external
def get_message_count() -> uint256:
    """
    @notice Get total number of messages
    """
    return len(self.messages)

@view
@external
def get_message(index: uint256) -> Message:
    """
    @notice Get a specific message by index
    """
    assert index < len(self.messages), "Invalid index"
    return self.messages[index]

@view
@external
def get_recent_messages(count: uint256) -> DynArray[Message, 100]:
    """
    @notice Get most recent N messages (max 100)
    """
    result: DynArray[Message, 100] = []
    total: uint256 = len(self.messages)
    
    if total == 0:
        return result
    
    actual_count: uint256 = count
    if actual_count > 100:
        actual_count = 100
    
    start: uint256 = 0
    if total > actual_count:
        start = total - actual_count
    
    for i: uint256 in range(start, total, bound=100):
        result.append(self.messages[i])
    
    return result

@view
@external
def get_time_until_next_post(user: address) -> uint256:
    """
    @notice Check how long until user can post again
    @return Seconds until next post (0 if can post now)
    """
    last_post: uint256 = self.last_post_time[user]
    if last_post == 0:
        return 0
    
    elapsed: uint256 = block.timestamp - last_post
    if elapsed >= rate_limit_seconds:
        return 0
    
    return rate_limit_seconds - elapsed
