# @version 0.4.3

"""
@title Discussion Board - Algorithmic Curation
@author L1Ca$h
@notice A self-organizing discussion board with up to 100 discussions
@dev Fully algorithmic - no owner, rule-based termination and replacement

MECHANICS:
- Up to 100 discussion slots
- Anyone can create a discussion with minimum initial value
- Discussions auto-terminate after inactivity period (anyone can trigger)
- New discussions can only replace INACTIVE ones
- Replacement requires higher initial_value than lowest inactive
- Terminated discussions stay visible as history (tombstones)
"""

# Events

event DiscussionCreated:
    discussion_address: indexed(address)
    creator: indexed(address)
    subject: String[200]
    initial_value: uint256
    slot_index: uint256
    timestamp: uint256
    was_replacement: bool

event DiscussionTerminated:
    discussion_address: indexed(address)
    terminator: indexed(address)
    final_pool: uint256
    age: uint256
    timestamp: uint256

event DiscussionReplaced:
    old_discussion: indexed(address)
    new_discussion: indexed(address)
    slot_index: uint256
    old_initial_value: uint256
    new_initial_value: uint256

event ActivityUpdated:
    discussion_address: indexed(address)
    new_last_activity: uint256

event FeesWithdrawn:
    owner: indexed(address)
    amount: uint256
    remaining_balance: uint256
    timestamp: uint256

# Structs

struct DiscussionEntry:
    discussion_address: address  # The discussion contract address
    last_activity: uint256       # Cached for inactivity checks (updated via report_activity)

# Interface for Discussion contract

interface IDiscussion:
    def terminate(): nonpayable
    def last_activity() -> uint256: view
    def terminated() -> bool: view
    def total_pool() -> uint256: view
    def initial_value() -> uint256: view
    def subject() -> String[200]: view
    def creator() -> address: view
    def creation_time() -> uint256: view
    def board() -> address: view

# Constants

MAX_DISCUSSIONS: constant(uint256) = 100
INACTIVITY_THRESHOLD: constant(uint256) = 7 * 24 * 60 * 60  # 7 days
MIN_INITIAL_VALUE: constant(uint256) = 100000000000000  # 0.0001 ETH (much lower!)
BOARD_FEE_PERCENT: constant(uint256) = 10  # 10% goes to board
CREATION_COOLDOWN: constant(uint256) = 300  # 5 minutes between creations per address

# State

discussions: public(DynArray[DiscussionEntry, MAX_DISCUSSIONS])

# Reverse lookup
discussion_index: public(HashMap[address, uint256])  # address -> index (0-based)
is_discussion: public(HashMap[address, bool])

# Anti-spam: Track last creation time per address
last_creation_time: public(HashMap[address, uint256])

# Stats (can be derived from len(discussions) but kept for convenience)
total_created: public(uint256)

# Board economics
board_balance: public(uint256)  # Accumulated fees (separate from contract balance for clarity)

# Governance
owner: public(immutable(address))

# Blueprint for deploying discussions
discussion_blueprint: public(immutable(address))

# Initialization

@deploy
def __init__(_discussion_blueprint: address, _owner: address):
    """
    @notice Initialize the discussion board
    @param _discussion_blueprint Address of the discussion contract blueprint
    @param _owner Address that can withdraw board fees
    @dev Board collects 10% fee on all discussion creations
    """
    assert _discussion_blueprint != empty(address), "Blueprint cannot be zero address"
    assert _owner != empty(address), "Owner cannot be zero address"
    
    discussion_blueprint = _discussion_blueprint
    owner = _owner
    self.total_created = 0
    self.board_balance = 0

# Core Functions

@payable
@external
def create_and_register(
    subject: String[200], 
    body: String[1000],
    max_messages: uint256,
    max_message_length: uint256,
    min_donation: uint256
) -> address:
    """
    @notice Deploy a new discussion and register it on the board (factory pattern)
    @param subject Discussion subject
    @param body Discussion body/description
    @param max_messages Maximum number of messages (1-1000)
    @param max_message_length Maximum message length (1-500)
    @param min_donation Minimum donation required to post
    @return Address of newly created discussion
    @dev Deploys from blueprint, initializes, and registers in one transaction
    """
    assert msg.value >= MIN_INITIAL_VALUE, "Initial value too low"
    assert len(subject) > 0, "Subject cannot be empty"
    assert max_messages > 0 and max_messages <= 1000, "Invalid max messages"
    assert max_message_length > 0 and max_message_length <= 500, "Invalid max message length"
    
    # Anti-spam: Enforce cooldown between creations
    last_created: uint256 = self.last_creation_time[msg.sender]
    if last_created > 0:
        assert block.timestamp >= last_created + CREATION_COOLDOWN, "Creation cooldown active"
    
    # Calculate board fee (10%) and discussion value (90%)
    board_fee: uint256 = msg.value * BOARD_FEE_PERCENT // 100
    discussion_value: uint256 = msg.value - board_fee
    
    # Collect board fee
    self.board_balance += board_fee
    
    # Deploy new discussion from blueprint with 90% of value
    new_discussion: address = create_from_blueprint(
        discussion_blueprint,
        self,  # board address
        subject,
        body,
        max_messages,
        max_message_length,
        min_donation,
        value=discussion_value,
        code_offset=3
    )
    
    # Register it internally (using simplified logic since we know it's valid)
    creator: address = msg.sender
    
    current_count: uint256 = len(self.discussions)
    
    # If under capacity, just append
    if current_count < MAX_DISCUSSIONS:
        entry: DiscussionEntry = DiscussionEntry(
            discussion_address=new_discussion,
            last_activity=block.timestamp
        )
        
        self.discussions.append(entry)
        self.discussion_index[new_discussion] = current_count
        self.is_discussion[new_discussion] = True
        self.total_created += 1
        
        # Update creator's last creation time
        self.last_creation_time[creator] = block.timestamp
        
        log DiscussionCreated(
            discussion_address=new_discussion,
            creator=creator,
            subject=subject,
            initial_value=msg.value,
            slot_index=current_count,
            timestamp=block.timestamp,
            was_replacement=False
        )
    else:
        # Board is full - find lowest-value INACTIVE discussion
        min_idx: uint256 = 0
        min_val: uint256 = max_value(uint256)
        found_inactive: bool = False
        
        for i: uint256 in range(MAX_DISCUSSIONS):
            entry: DiscussionEntry = self.discussions[i]
            
            # Check if inactive or terminated
            is_inactive: bool = self._is_inactive(entry.discussion_address)
            
            if is_inactive:
                # Query initial value from discussion contract
                disc: IDiscussion = IDiscussion(entry.discussion_address)
                disc_initial_value: uint256 = staticcall disc.initial_value()
                
                if disc_initial_value < min_val:
                    min_val = disc_initial_value
                    min_idx = i
                    found_inactive = True
        
        assert found_inactive, "No inactive discussions to replace"
        assert msg.value > min_val, "Initial value too low to replace"
        
        # Replace - terminate old discussion first to distribute funds
        old_discussion: address = self.discussions[min_idx].discussion_address
        old_disc: IDiscussion = IDiscussion(old_discussion)
        old_value: uint256 = staticcall old_disc.initial_value()
        
        # Terminate old discussion (distributes pool to survivors)
        # Check if not already terminated to avoid revert
        if not staticcall old_disc.terminated():
            extcall old_disc.terminate()
        
        # Clear old mapping (both flags)
        self.is_discussion[old_discussion] = False
        self.discussion_index[old_discussion] = 0  # Reset to 0
        
        # Create new entry
        new_entry: DiscussionEntry = DiscussionEntry(
            discussion_address=new_discussion,
            last_activity=block.timestamp
        )
        
        self.discussions[min_idx] = new_entry
        self.discussion_index[new_discussion] = min_idx
        self.is_discussion[new_discussion] = True
        self.total_created += 1
        
        # Update creator's last creation time
        self.last_creation_time[creator] = block.timestamp
        
        log DiscussionReplaced(
            old_discussion=old_discussion,
            new_discussion=new_discussion,
            slot_index=min_idx,
            old_initial_value=old_value,
            new_initial_value=msg.value
        )
        
        log DiscussionCreated(
            discussion_address=new_discussion,
            creator=creator,
            subject=subject,
            initial_value=msg.value,
            slot_index=min_idx,
            timestamp=block.timestamp,
            was_replacement=True
        )
    
    return new_discussion

@external
def create_discussion(discussion_address: address):
    """
    @notice Register a newly deployed discussion contract (advanced usage)
    @param discussion_address Address of the discussion contract
    @dev If board is full, replaces lowest-value inactive discussion
    @dev NOTE: Prefer create_and_register() for normal usage (safer, one transaction)
    @dev This function is for registering externally-deployed discussions
    """
    assert not self.is_discussion[discussion_address], "Already registered"
    assert discussion_address != empty(address), "Invalid address"
    
    # Get discussion details via interface
    discussion: IDiscussion = IDiscussion(discussion_address)
    
    subject: String[200] = staticcall discussion.subject()
    initial_value: uint256 = staticcall discussion.initial_value()
    creator: address = staticcall discussion.creator()
    creation_time: uint256 = staticcall discussion.creation_time()
    last_activity: uint256 = staticcall discussion.last_activity()
    
    assert initial_value >= MIN_INITIAL_VALUE, "Initial value too low"
    
    # Verify this discussion was created with this board as its board address
    # This prevents registering discussions that point to different boards
    board_addr: address = staticcall discussion.board()
    assert board_addr == self, "Discussion not created for this board"
    
    current_count: uint256 = len(self.discussions)
    
    # If under capacity, just append
    if current_count < MAX_DISCUSSIONS:
        entry: DiscussionEntry = DiscussionEntry(
            discussion_address=discussion_address,
            last_activity=last_activity
        )
        
        self.discussions.append(entry)
        self.discussion_index[discussion_address] = current_count
        self.is_discussion[discussion_address] = True
        self.total_created += 1
        
        log DiscussionCreated(
            discussion_address=discussion_address,
            creator=creator,
            subject=subject,
            initial_value=initial_value,
            slot_index=current_count,
            timestamp=block.timestamp,
            was_replacement=False
        )
    else:
        # Board is full - find lowest-value INACTIVE discussion
        min_idx: uint256 = 0
        min_val: uint256 = max_value(uint256)
        found_inactive: bool = False
        
        for i: uint256 in range(MAX_DISCUSSIONS):
            entry: DiscussionEntry = self.discussions[i]
            
            # Check if inactive or terminated
            is_inactive: bool = self._is_inactive(entry.discussion_address)
            
            if is_inactive:
                # Query initial value from discussion contract
                disc: IDiscussion = IDiscussion(entry.discussion_address)
                disc_initial_value: uint256 = staticcall disc.initial_value()
                
                if disc_initial_value < min_val:
                    min_val = disc_initial_value
                    min_idx = i
                    found_inactive = True
        
        assert found_inactive, "No inactive discussions to replace"
        assert initial_value > min_val, "Initial value too low to replace"
        
        # Replace - terminate old discussion first to distribute funds
        old_discussion: address = self.discussions[min_idx].discussion_address
        old_disc: IDiscussion = IDiscussion(old_discussion)
        old_value: uint256 = staticcall old_disc.initial_value()
        
        # Terminate old discussion (distributes pool to survivors)
        # Check if not already terminated to avoid revert
        if not staticcall old_disc.terminated():
            extcall old_disc.terminate()
        
        # Clear old mapping (both flags)
        self.is_discussion[old_discussion] = False
        self.discussion_index[old_discussion] = 0  # Reset to 0
        
        # Create new entry
        new_entry: DiscussionEntry = DiscussionEntry(
            discussion_address=discussion_address,
            last_activity=last_activity
        )
        
        self.discussions[min_idx] = new_entry
        self.discussion_index[discussion_address] = min_idx
        self.is_discussion[discussion_address] = True
        self.total_created += 1
        
        log DiscussionReplaced(
            old_discussion=old_discussion,
            new_discussion=discussion_address,
            slot_index=min_idx,
            old_initial_value=old_value,
            new_initial_value=initial_value
        )
        
        log DiscussionCreated(
            discussion_address=discussion_address,
            creator=creator,
            subject=subject,
            initial_value=initial_value,
            slot_index=min_idx,
            timestamp=block.timestamp,
            was_replacement=True
        )

@external
def terminate_discussion(discussion_address: address):
    """
    @notice Terminate an inactive discussion
    @param discussion_address Address of the discussion to terminate
    @dev Anyone can call if discussion meets inactivity criteria
    """
    assert self.is_discussion[discussion_address], "Not a registered discussion"
    
    idx: uint256 = self.discussion_index[discussion_address]
    
    # Check if meets termination criteria
    assert self._is_inactive(discussion_address), "Discussion still active"
    
    # Call terminate on the discussion contract
    discussion: IDiscussion = IDiscussion(discussion_address)
    extcall discussion.terminate()
    
    # Update board state - mark termination time
    self.discussions[idx].last_activity = block.timestamp
    
    # Get final pool value and age
    final_pool: uint256 = staticcall discussion.total_pool()
    creation_time: uint256 = staticcall discussion.creation_time()
    age: uint256 = block.timestamp - creation_time
    
    log DiscussionTerminated(
        discussion_address=discussion_address,
        terminator=msg.sender,
        final_pool=final_pool,
        age=age,
        timestamp=block.timestamp
    )

@external
def report_activity():
    """
    @notice Called by discussion contracts to report new activity
    @dev Only registered discussions can call this
    @dev Automatically updates cached last_activity timestamp
    """
    assert self.is_discussion[msg.sender], "Not a registered discussion"
    
    idx: uint256 = self.discussion_index[msg.sender]
    
    # Update cache to current block timestamp
    self.discussions[idx].last_activity = block.timestamp
    
    log ActivityUpdated(discussion_address=msg.sender, new_last_activity=block.timestamp)

@external
def update_activity(discussion_address: address):
    """
    @notice Update cached last_activity for a discussion (manual refresh)
    @param discussion_address Address of the discussion
    @dev Can be called by anyone to refresh activity timestamp
    @dev NOTE: Prefer discussions self-reporting via report_activity()
    """
    assert self.is_discussion[discussion_address], "Not a registered discussion"
    
    idx: uint256 = self.discussion_index[discussion_address]
    
    discussion: IDiscussion = IDiscussion(discussion_address)
    new_activity: uint256 = staticcall discussion.last_activity()
    
    # Update cache
    self.discussions[idx].last_activity = new_activity
    
    log ActivityUpdated(discussion_address=discussion_address, new_last_activity=new_activity)

@external
def withdraw_board_fees(percentage: uint256):
    """
    @notice Withdraw a percentage of accumulated board fees
    @param percentage Percentage to withdraw (1-100)
    @dev Only callable by owner, allows partial withdrawals to keep board operational
    """
    assert msg.sender == owner, "Only owner can withdraw"
    assert percentage > 0 and percentage <= 100, "Invalid percentage"
    assert self.board_balance > 0, "No fees to withdraw"
    
    # Calculate withdrawal amount
    withdrawal_amount: uint256 = self.board_balance * percentage // 100
    
    # Update board balance
    self.board_balance -= withdrawal_amount
    
    # Send to owner
    send(owner, withdrawal_amount)
    
    # Log withdrawal
    log FeesWithdrawn(
        owner=owner,
        amount=withdrawal_amount,
        remaining_balance=self.board_balance,
        timestamp=block.timestamp
    )

# View Functions

@view
@external
def get_discussion_count() -> uint256:
    """
    @notice Get total number of discussions on board
    @return Number of discussions
    """
    return len(self.discussions)

@view
@external
def get_discussion(idx: uint256) -> DiscussionEntry:
    """
    @notice Get discussion entry by index
    @param idx Discussion index
    @return Discussion entry
    """
    assert idx < len(self.discussions), "Index out of bounds"
    return self.discussions[idx]

@view
@external
def get_all_discussions() -> DynArray[DiscussionEntry, MAX_DISCUSSIONS]:
    """
    @notice Get all discussions
    @return Array of all discussion entries
    """
    return self.discussions

@view
@external
def get_active_discussions() -> DynArray[DiscussionEntry, MAX_DISCUSSIONS]:
    """
    @notice Get only active discussions
    @return Array of active discussion entries
    """
    active: DynArray[DiscussionEntry, MAX_DISCUSSIONS] = []
    
    for i: uint256 in range(MAX_DISCUSSIONS):
        if i >= len(self.discussions):
            break
        
        entry: DiscussionEntry = self.discussions[i]
        if not self._is_inactive(entry.discussion_address):
            active.append(entry)
    
    return active

@view
@external
def get_inactive_discussions() -> DynArray[DiscussionEntry, MAX_DISCUSSIONS]:
    """
    @notice Get inactive/terminated discussions
    @return Array of inactive discussion entries
    """
    inactive: DynArray[DiscussionEntry, MAX_DISCUSSIONS] = []
    
    for i: uint256 in range(MAX_DISCUSSIONS):
        if i >= len(self.discussions):
            break
        
        entry: DiscussionEntry = self.discussions[i]
        if self._is_inactive(entry.discussion_address):
            inactive.append(entry)
    
    return inactive

@view
@external
def can_terminate(discussion_address: address) -> bool:
    """
    @notice Check if a discussion can be terminated
    @param discussion_address Address to check
    @return True if terminable
    """
    if not self.is_discussion[discussion_address]:
        return False
    
    # Check if already terminated
    discussion: IDiscussion = IDiscussion(discussion_address)
    if staticcall discussion.terminated():
        return False
    
    return self._is_inactive(discussion_address)

@view
@external
def get_min_inactive_value() -> uint256:
    """
    @notice Get minimum initial value of inactive discussions
    @return Minimum value, or max_value(uint256) if no inactive discussions
    """
    min_val: uint256 = max_value(uint256)
    found: bool = False
    
    for i: uint256 in range(MAX_DISCUSSIONS):
        if i >= len(self.discussions):
            break
        
        entry: DiscussionEntry = self.discussions[i]
        if self._is_inactive(entry.discussion_address):
            # Query initial value from discussion
            disc: IDiscussion = IDiscussion(entry.discussion_address)
            disc_initial_value: uint256 = staticcall disc.initial_value()
            
            if disc_initial_value < min_val:
                min_val = disc_initial_value
                found = True
    
    return min_val if found else max_value(uint256)

@view
@external
def can_create(initial_value: uint256) -> bool:
    """
    @notice Check if a new discussion with given initial value can be created
    @param initial_value Initial value of proposed discussion
    @return True if can be created
    """
    if initial_value < MIN_INITIAL_VALUE:
        return False
    
    # If under capacity, always can create
    if len(self.discussions) < MAX_DISCUSSIONS:
        return True
    
    # Must beat minimum inactive value - compute inline
    min_inactive_val: uint256 = max_value(uint256)
    found: bool = False
    
    for i: uint256 in range(MAX_DISCUSSIONS):
        if i >= len(self.discussions):
            break
        
        entry: DiscussionEntry = self.discussions[i]
        if self._is_inactive(entry.discussion_address):
            disc: IDiscussion = IDiscussion(entry.discussion_address)
            disc_initial_value: uint256 = staticcall disc.initial_value()
            
            if disc_initial_value < min_inactive_val:
                min_inactive_val = disc_initial_value
                found = True
    
    if not found:
        return False  # No inactive discussions to replace
    
    return initial_value > min_inactive_val

@view
@external
def get_stats() -> (uint256, uint256, uint256):
    """
    @notice Get board statistics
    @return (total_on_board, total_created, active_count)
    """
    active_count: uint256 = 0
    
    for i: uint256 in range(MAX_DISCUSSIONS):
        if i >= len(self.discussions):
            break
        
        if not self._is_inactive(self.discussions[i].discussion_address):
            active_count += 1
    
    return (
        len(self.discussions),
        self.total_created,
        active_count
    )

# Internal Functions

@view
@internal
def _is_inactive(discussion_address: address) -> bool:
    """
    @notice Check if a discussion is inactive
    @param discussion_address Discussion address to check
    @return True if inactive or terminated
    """
    # Query discussion contract
    discussion: IDiscussion = IDiscussion(discussion_address)
    
    # Terminated is always inactive
    if staticcall discussion.terminated():
        return True
    
    # Check inactivity threshold using cached last_activity
    idx: uint256 = self.discussion_index[discussion_address]
    last_activity: uint256 = self.discussions[idx].last_activity
    
    # Underflow protection: if last_activity is in the future, treat as active
    if last_activity > block.timestamp:
        return False
    
    time_since_activity: uint256 = block.timestamp - last_activity
    return time_since_activity >= INACTIVITY_THRESHOLD

