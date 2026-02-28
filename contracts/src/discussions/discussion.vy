# @version 0.4.3

"""
@title Discussion Contract
@author Sam Reeves
@notice A discussion with configurable message limits
@dev Survivors at termination split the pool evenly

MECHANICS:
- Creator sets subject, body, and loads initial value
- Configurable max messages (up to 1000), message length (up to 500), and min donation
- When full, higher donations replace lowest donation messages
- IMPORTANT: Evicted message donations stay in the pool (become part of prize pool)
- Board can terminate the discussion
- At termination, pool is split evenly among unique surviving authors
"""

# Events

event MessagePosted:
    author: indexed(address)
    donation: uint256
    content: String[500]
    timestamp: uint256
    index: uint256
    was_replacement: bool

event MessageEvicted:
    author: indexed(address)
    original_donation: uint256
    index: uint256
    replaced_by: indexed(address)

event DiscussionTerminated:
    terminator: indexed(address)
    final_pool: uint256
    survivor_count: uint256
    timestamp: uint256

event PayoutDistributed:
    recipient: indexed(address)
    amount: uint256

event MessageBoosted:
    supporter: indexed(address)
    message_author: indexed(address)
    message_index: uint256
    boost_amount: uint256
    new_total_donation: uint256
    timestamp: uint256

# Interface for Board contract

interface IBoard:
    def report_activity(): nonpayable

# Structs

struct Message:
    author: address
    content: String[500]  # Maximum possible message length
    donation: uint256
    timestamp: uint256

# Constants

ABSOLUTE_MAX_MESSAGES: constant(uint256) = 1000  # Hard limit
ABSOLUTE_MAX_MESSAGE_LENGTH: constant(uint256) = 500  # Hard limit
MESSAGE_COOLDOWN: constant(uint256) = 60  # 1 minute between messages per address

# Immutable state (set at creation)

board: public(immutable(address))
creator: public(immutable(address))
subject: public(immutable(String[200]))
body: public(immutable(String[1000]))
initial_value: public(immutable(uint256))
creation_time: public(immutable(uint256))
max_messages: public(immutable(uint256))  # Configurable max messages for this discussion
max_message_length: public(immutable(uint256))  # Configurable max message length
min_donation: public(immutable(uint256))  # Minimum donation required to post

# Mutable state

messages: public(DynArray[Message, ABSOLUTE_MAX_MESSAGES])
total_pool: public(uint256)
last_activity: public(uint256)
terminated: public(bool)

# Anti-spam: Track last message time per address
last_message_time: public(HashMap[address, uint256])

# Initialization

@deploy
@payable
def __init__(
    _board: address, 
    _subject: String[200], 
    _body: String[1000],
    _max_messages: uint256,
    _max_message_length: uint256,
    _min_donation: uint256
):
    """
    @notice Initialize a new discussion
    @param _board The board contract that can terminate this discussion
    @param _subject The discussion subject (immutable)
    @param _body The discussion body/description (immutable)
    @param _max_messages Maximum number of messages (1-1000)
    @param _max_message_length Maximum message length (1-500)
    @param _min_donation Minimum donation required to post (can be 0)
    @dev msg.value becomes the initial pool value
    """
    assert _board != empty(address), "Board cannot be zero address"
    assert len(_subject) > 0, "Subject cannot be empty"
    assert msg.value > 0, "Must load initial value"
    assert _max_messages > 0 and _max_messages <= ABSOLUTE_MAX_MESSAGES, "Invalid max messages"
    assert _max_message_length > 0 and _max_message_length <= ABSOLUTE_MAX_MESSAGE_LENGTH, "Invalid max message length"
    
    board = _board
    creator = msg.sender
    subject = _subject
    body = _body
    initial_value = msg.value
    creation_time = block.timestamp
    max_messages = _max_messages
    max_message_length = _max_message_length
    min_donation = _min_donation
    
    self.total_pool = msg.value
    self.last_activity = block.timestamp
    self.terminated = False

# Core functions

@payable
@external
def post_message(content: String[500]):
    """
    @notice Post a message with a donation
    @param content The message content
    @dev If under max_messages, appends. If full, replaces lowest donation if msg.value is higher
    """
    assert not self.terminated, "Discussion terminated"
    assert msg.value >= min_donation, "Donation below minimum"
    assert len(content) > 0, "Message cannot be empty"
    assert len(content) <= max_message_length, "Message too long"
    
    # Anti-spam: Enforce cooldown between messages
    last_posted: uint256 = self.last_message_time[msg.sender]
    if last_posted > 0:
        assert block.timestamp >= last_posted + MESSAGE_COOLDOWN, "Message cooldown active"
    
    current_length: uint256 = len(self.messages)
    
    # If under max_messages, just append
    if current_length < max_messages:
        new_message: Message = Message(
            author=msg.sender,
            content=content,
            donation=msg.value,
            timestamp=block.timestamp
        )
        self.messages.append(new_message)
        
        self.total_pool += msg.value
        self.last_activity = block.timestamp
        
        # Update sender's last message time
        self.last_message_time[msg.sender] = block.timestamp
        
        log MessagePosted(
            author=msg.sender,
            donation=msg.value,
            content=content,
            timestamp=block.timestamp,
            index=current_length,
            was_replacement=False
        )
        
        # Report activity to board (must succeed - discussion must remain registered)
        board_interface: IBoard = IBoard(board)
        extcall board_interface.report_activity()
    else:
        # Find minimum donation
        min_idx: uint256 = 0
        min_donation_val: uint256 = self.messages[0].donation
        
        for i: uint256 in range(ABSOLUTE_MAX_MESSAGES):
            if i >= current_length:
                break
            if self.messages[i].donation < min_donation_val:
                min_donation_val = self.messages[i].donation
                min_idx = i
        
        # Must beat the minimum
        assert msg.value > min_donation_val, "Donation too low to replace"
        
        # Log eviction
        evicted_author: address = self.messages[min_idx].author
        evicted_donation: uint256 = self.messages[min_idx].donation
        
        log MessageEvicted(
            author=evicted_author,
            original_donation=evicted_donation,
            index=min_idx,
            replaced_by=msg.sender
        )
        
        # Replace (evicted donation stays in pool - becomes part of prize pool)
        self.messages[min_idx] = Message(
            author=msg.sender,
            content=content,
            donation=msg.value,
            timestamp=block.timestamp
        )
        
        # Add new donation to pool (evicted donation already in pool, not refunded)
        self.total_pool += msg.value
        self.last_activity = block.timestamp
        
        # Update sender's last message time
        self.last_message_time[msg.sender] = block.timestamp
        
        log MessagePosted(
            author=msg.sender,
            donation=msg.value,
            content=content,
            timestamp=block.timestamp,
            index=min_idx,
            was_replacement=True
        )
        
        # Report activity to board (must succeed - discussion must remain registered)
        board_interface: IBoard = IBoard(board)
        extcall board_interface.report_activity()

@payable
@external
def boost_message(message_idx: uint256):
    """
    @notice Donate to an existing message to increase its donation amount
    @param message_idx Index of the message to boost
    @dev Increases the message's donation, making it harder to evict
    """
    assert not self.terminated, "Discussion terminated"
    assert msg.value > 0, "Must send donation"
    assert message_idx < len(self.messages), "Message index out of bounds"
    
    # Update message donation amount
    self.messages[message_idx].donation += msg.value
    
    # Update pool and activity
    self.total_pool += msg.value
    self.last_activity = block.timestamp
    
    log MessageBoosted(
        supporter=msg.sender,
        message_author=self.messages[message_idx].author,
        message_index=message_idx,
        boost_amount=msg.value,
        new_total_donation=self.messages[message_idx].donation,
        timestamp=block.timestamp
    )
    
    # Report activity to board (must succeed - discussion must remain registered)
    board_interface: IBoard = IBoard(board)
    extcall board_interface.report_activity()

@external
def terminate():
    """
    @notice Terminate the discussion and distribute pool to survivors
    @dev Only callable by board, splits pool evenly among unique surviving authors
    """
    assert msg.sender == board, "Only board can terminate"
    assert not self.terminated, "Already terminated"
    
    self.terminated = True
    
    # Get unique survivor addresses
    survivors: DynArray[address, ABSOLUTE_MAX_MESSAGES] = self._get_unique_authors()
    survivor_count: uint256 = len(survivors)
    
    final_pool: uint256 = self.balance
    
    log DiscussionTerminated(
        terminator=msg.sender,
        final_pool=final_pool,
        survivor_count=survivor_count,
        timestamp=block.timestamp
    )
    
    # Distribute evenly
    if survivor_count > 0:
        payout_per_survivor: uint256 = final_pool // survivor_count
        remainder: uint256 = final_pool % survivor_count
        
        for i: uint256 in range(ABSOLUTE_MAX_MESSAGES):
            if i >= survivor_count:
                break
            
            # Last survivor gets remainder to handle division rounding
            amount: uint256 = payout_per_survivor
            if i == survivor_count - 1:
                amount += remainder
            
            send(survivors[i], amount)
            
            log PayoutDistributed(recipient=survivors[i], amount=amount)

# View functions

@view
@external
def get_message_count() -> uint256:
    """
    @notice Get current number of messages
    @return Number of messages
    """
    return len(self.messages)

@view
@external
def get_message(idx: uint256) -> Message:
    """
    @notice Get a specific message by index
    @param idx Message index
    @return The message
    """
    assert idx < len(self.messages), "Index out of bounds"
    return self.messages[idx]

@view
@external
def get_all_messages() -> DynArray[Message, ABSOLUTE_MAX_MESSAGES]:
    """
    @notice Get all messages
    @return Array of all messages
    """
    return self.messages

@view
@external
def get_min_donation_in_messages() -> uint256:
    """
    @notice Get minimum donation amount in current messages
    @return Minimum donation (0 if no messages)
    """
    if len(self.messages) == 0:
        return 0
    
    min_donation_val: uint256 = self.messages[0].donation
    
    for i: uint256 in range(ABSOLUTE_MAX_MESSAGES):
        if i >= len(self.messages):
            break
        if self.messages[i].donation < min_donation_val:
            min_donation_val = self.messages[i].donation
    
    return min_donation_val

@view
@external
def get_required_donation() -> uint256:
    """
    @notice Get minimum donation needed to post
    @return Required donation amount
    """
    if len(self.messages) < max_messages:
        return min_donation  # Just need to meet minimum
    
    # Calculate min donation inline - need to beat lowest to replace
    if len(self.messages) == 0:
        return min_donation
    
    min_donation_val: uint256 = self.messages[0].donation
    for i: uint256 in range(ABSOLUTE_MAX_MESSAGES):
        if i >= len(self.messages):
            break
        if self.messages[i].donation < min_donation_val:
            min_donation_val = self.messages[i].donation
    
    return min_donation_val + 1

@view
@external
def get_survivor_count() -> uint256:
    """
    @notice Get number of unique authors who would split the pool
    @return Number of unique surviving authors
    """
    return len(self._get_unique_authors())

@view
@external
def get_survivors() -> DynArray[address, ABSOLUTE_MAX_MESSAGES]:
    """
    @notice Get list of unique authors who would split the pool
    @return Array of unique survivor addresses
    """
    return self._get_unique_authors()

@view
@external
def get_potential_payout() -> uint256:
    """
    @notice Get potential payout per survivor if terminated now
    @return Payout amount per survivor
    """
    survivors: DynArray[address, ABSOLUTE_MAX_MESSAGES] = self._get_unique_authors()
    if len(survivors) == 0:
        return 0
    return self.balance // len(survivors)

@view
@external
def get_status() -> (bool, uint256, uint256, uint256, uint256):
    """
    @notice Get discussion status
    @return (terminated, message_count, total_pool, last_activity, survivor_count)
    """
    return (
        self.terminated,
        len(self.messages),
        self.total_pool,
        self.last_activity,
        len(self._get_unique_authors())
    )

@view
@external
def get_config() -> (uint256, uint256, uint256):
    """
    @notice Get discussion configuration
    @return (max_messages, max_message_length, min_donation)
    """
    return (max_messages, max_message_length, min_donation)

# Internal functions

@view
@internal
def _get_unique_authors() -> DynArray[address, ABSOLUTE_MAX_MESSAGES]:
    """
    @notice Get unique authors from current messages
    @return Array of unique addresses
    """
    unique: DynArray[address, ABSOLUTE_MAX_MESSAGES] = []
    
    for i: uint256 in range(ABSOLUTE_MAX_MESSAGES):
        if i >= len(self.messages):
            break
        
        author: address = self.messages[i].author
        is_unique: bool = True
        
        # Check if already in unique list
        for j: uint256 in range(ABSOLUTE_MAX_MESSAGES):
            if j >= len(unique):
                break
            if unique[j] == author:
                is_unique = False
                break
        
        if is_unique:
            unique.append(author)
    
    return unique

