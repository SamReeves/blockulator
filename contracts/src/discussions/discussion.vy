# @version 0.4.3

"""
@title Discussion Contract
@author L1Ca$h
@notice A discussion with subject, body, and up to 100 messages
@dev Survivors at termination split the pool evenly

MECHANICS:
- Creator sets subject, body, and loads initial value
- Up to 100 messages, each requires a donation
- When full, higher donations replace lowest donation messages
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
    content: String[200]
    donation: uint256
    timestamp: uint256

# Constants

MAX_MESSAGES: constant(uint256) = 100

# Immutable state (set at creation)

board: public(immutable(address))
creator: public(immutable(address))
subject: public(immutable(String[200]))
body: public(immutable(String[1000]))
initial_value: public(immutable(uint256))
creation_time: public(immutable(uint256))

# Mutable state

messages: public(DynArray[Message, MAX_MESSAGES])
total_pool: public(uint256)
last_activity: public(uint256)
terminated: public(bool)

# Initialization

@deploy
@payable
def __init__(_board: address, _subject: String[200], _body: String[1000]):
    """
    @notice Initialize a new discussion
    @param _board The board contract that can terminate this discussion
    @param _subject The discussion subject (immutable)
    @param _body The discussion body/description (immutable)
    @dev msg.value becomes the initial pool value
    """
    assert _board != empty(address), "Board cannot be zero address"
    assert len(_subject) > 0, "Subject cannot be empty"
    assert msg.value > 0, "Must load initial value"
    
    board = _board
    creator = msg.sender
    subject = _subject
    body = _body
    initial_value = msg.value
    creation_time = block.timestamp
    
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
    @dev If under 100 messages, appends. If full, replaces lowest donation if msg.value is higher
    """
    assert not self.terminated, "Discussion terminated"
    assert msg.value > 0, "Must send donation"
    assert len(content) > 0, "Message cannot be empty"
    
    current_length: uint256 = len(self.messages)
    
    # If under 100, just append
    if current_length < MAX_MESSAGES:
        new_message: Message = Message(
            author=msg.sender,
            content=content,
            donation=msg.value,
            timestamp=block.timestamp
        )
        self.messages.append(new_message)
        
        self.total_pool += msg.value
        self.last_activity = block.timestamp
        
        log MessagePosted(
            msg.sender,
            msg.value,
            content,
            block.timestamp,
            current_length,
            False
        )
        
        # Report activity to board
        board_interface: IBoard = IBoard(board)
        board_interface.report_activity()
    else:
        # Find minimum donation
        min_idx: uint256 = 0
        min_donation: uint256 = self.messages[0].donation
        
        for i: uint256 in range(MAX_MESSAGES):
            if self.messages[i].donation < min_donation:
                min_donation = self.messages[i].donation
                min_idx = i
        
        # Must beat the minimum
        assert msg.value > min_donation, "Donation too low to replace"
        
        # Log eviction
        evicted_author: address = self.messages[min_idx].author
        evicted_donation: uint256 = self.messages[min_idx].donation
        
        log MessageEvicted(
            evicted_author,
            evicted_donation,
            min_idx,
            msg.sender
        )
        
        # Replace
        self.messages[min_idx] = Message(
            author=msg.sender,
            content=content,
            donation=msg.value,
            timestamp=block.timestamp
        )
        
        self.total_pool += msg.value
        self.last_activity = block.timestamp
        
        log MessagePosted(
            msg.sender,
            msg.value,
            content,
            block.timestamp,
            min_idx,
            True
        )
        
        # Report activity to board
        board_interface: IBoard = IBoard(board)
        board_interface.report_activity()

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
        msg.sender,
        self.messages[message_idx].author,
        message_idx,
        msg.value,
        self.messages[message_idx].donation,
        block.timestamp
    )
    
    # Report activity to board
    board_interface: IBoard = IBoard(board)
    board_interface.report_activity()

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
    survivors: DynArray[address, MAX_MESSAGES] = self._get_unique_authors()
    survivor_count: uint256 = len(survivors)
    
    final_pool: uint256 = self.balance
    
    log DiscussionTerminated(
        msg.sender,
        final_pool,
        survivor_count,
        block.timestamp
    )
    
    # Distribute evenly
    if survivor_count > 0:
        payout_per_survivor: uint256 = final_pool / survivor_count
        remainder: uint256 = final_pool % survivor_count
        
        for i: uint256 in range(MAX_MESSAGES):
            if i >= survivor_count:
                break
            
            # Last survivor gets remainder to handle division rounding
            amount: uint256 = payout_per_survivor
            if i == survivor_count - 1:
                amount += remainder
            
            send(survivors[i], amount)
            
            log PayoutDistributed(survivors[i], amount)

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
def get_all_messages() -> DynArray[Message, MAX_MESSAGES]:
    """
    @notice Get all messages
    @return Array of all messages
    """
    return self.messages

@view
@external
def get_min_donation() -> uint256:
    """
    @notice Get minimum donation amount in current messages
    @return Minimum donation (0 if no messages)
    """
    if len(self.messages) == 0:
        return 0
    
    min_donation: uint256 = self.messages[0].donation
    
    for i: uint256 in range(MAX_MESSAGES):
        if i >= len(self.messages):
            break
        if self.messages[i].donation < min_donation:
            min_donation = self.messages[i].donation
    
    return min_donation

@view
@external
def get_required_donation() -> uint256:
    """
    @notice Get minimum donation needed to post (1 more than current min)
    @return Required donation amount
    """
    if len(self.messages) < MAX_MESSAGES:
        return 1  # Any positive amount works
    
    return self.get_min_donation() + 1

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
def get_survivors() -> DynArray[address, MAX_MESSAGES]:
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
    survivors: DynArray[address, MAX_MESSAGES] = self._get_unique_authors()
    if len(survivors) == 0:
        return 0
    return self.balance / len(survivors)

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

# Internal functions

@view
@internal
def _get_unique_authors() -> DynArray[address, MAX_MESSAGES]:
    """
    @notice Get unique authors from current messages
    @return Array of unique addresses
    """
    unique: DynArray[address, MAX_MESSAGES] = []
    
    for i: uint256 in range(MAX_MESSAGES):
        if i >= len(self.messages):
            break
        
        author: address = self.messages[i].author
        is_unique: bool = True
        
        # Check if already in unique list
        for j: uint256 in range(MAX_MESSAGES):
            if j >= len(unique):
                break
            if unique[j] == author:
                is_unique = False
                break
        
        if is_unique:
            unique.append(author)
    
    return unique

