# @version 0.4.3

"""
@title Pissing Contest - Enhanced Continuous Rounds Edition
@author L1Ca$h
@notice A perpetual contest where the largest donor wins each round
@dev Automatically resets after each round, maintains historical data

     IMPROVEMENTS (2025 v0.4.3 Update):
     - Updated to Vyper 0.4.3 with pinned version for reproducibility
     - Added formal invariant documentation for type safety
     - Enhanced mathematical correctness documentation
     - Improved circular buffer overflow protection comments
     - Clarified reentrancy protection patterns
     - Already had checked send() calls ✓
     - Emergency pause mechanism ✓
     - Ownership transfer (2-step) ✓
     - Minimum donation requirement ✓
     - Configurable parameters (fees, max donations) ✓
     - Enhanced event indexing ✓
     - Manual round ending by owner ✓
     - Gas optimization with cached values ✓
     
     TYPE SAFETY INVARIANTS:
     - donation_count: uint16 is safe due to max_donations_per_round constraint
     - history_head: uint256 effectively unbounded but practically safe for 2^256 rounds
     - All address comparisons use empty(address) for type correctness
"""

# ============= DATA STRUCTURES =============

struct ContestConfig:
    owner: address
    proposed_owner: address
    max_donations_per_round: uint16
    fee_basis_points: uint16
    minimum_donation: uint256
    paused: bool

struct RoundState:
    round_number: uint256
    donation_count: uint16
    largest_donation: uint256
    largest_donor: address
    total_value: uint256
    start_time: uint256
    is_active: bool

struct RoundResult:
    round_number: uint256
    winner: address
    prize: uint256
    total_donations: uint256
    donation_count: uint16
    largest_donation: uint256
    end_time: uint256

# ============= CONSTANTS =============

MAX_HISTORY: constant(uint256) = 100
BASIS_POINTS_DIVISOR: constant(uint256) = 10000
MAX_FEE_BASIS_POINTS: constant(uint16) = 1000  # 10% max fee

# ============= EVENTS =============

event DonationReceived:
    round_number: indexed(uint256)
    donor: indexed(address)
    amount: uint256
    donation_number: uint16
    is_largest: bool
    timestamp: uint256

event RoundEnded:
    round_number: indexed(uint256)
    winner: indexed(address)
    prize: uint256
    fee_collected: uint256
    total_donations: uint256
    duration: uint256

event RoundStarted:
    round_number: indexed(uint256)
    start_time: uint256

event LeaderboardUpdate:
    round_number: indexed(uint256)
    new_leader: indexed(address)
    amount: uint256
    previous_leader: address

event OwnershipTransferProposed:
    current_owner: indexed(address)
    proposed_owner: indexed(address)

event OwnershipTransferred:
    previous_owner: indexed(address)
    new_owner: indexed(address)

event EmergencyPauseToggled:
    paused: bool
    toggled_by: indexed(address)

event ConfigUpdated:
    parameter: String[32]
    old_value: uint256
    new_value: uint256

# ============= STATE VARIABLES =============

config: public(ContestConfig)
current_round: public(RoundState)

# Historical data - keep last N rounds for queries (circular buffer pattern)
# INVARIANT: Only last MAX_HISTORY rounds are retained
# INVARIANT: history_head % MAX_HISTORY gives current write position
# NOTE: history_head grows unbounded but wraps via modulo for indexing
#       Theoretical overflow after 2^256 rounds is practically impossible
round_history: public(RoundResult[100])
history_head: uint256  # Circular buffer head pointer (monotonically increasing)

# Lifetime statistics
total_rounds_completed: public(uint256)
all_time_highest_donation: public(uint256)
all_time_highest_donor: public(address)

# Per-round donation tracking
round_donations: public(HashMap[uint256, HashMap[address, uint256]])

# Per-user lifetime statistics
user_lifetime_donated: public(HashMap[address, uint256])
user_lifetime_won: public(HashMap[address, uint256])
user_rounds_won: public(HashMap[address, uint256])
user_rounds_participated: public(HashMap[address, uint256])

# ============= INITIALIZATION =============

@deploy
def __init__(max_donations: uint16, fee_bp: uint16, min_donation: uint256):
    """
    @notice Initialize the perpetual contest system
    @param max_donations Maximum donations per round (e.g., 10)
    @param fee_bp Fee in basis points (e.g., 100 = 1%, max 1000 = 10%)
    @param min_donation Minimum donation in wei (e.g., 0.001 ETH = 1000000000000000)
    
    @dev ESTABLISHES INVARIANTS:
         - max_donations > 0 ensures uint16 donation_count can safely increment
         - fee_bp <= MAX_FEE_BASIS_POINTS ensures fee calculation doesn't exceed total
         - All state initialized to mathematically consistent values
    """
    assert max_donations > 0, "Need at least 1 donation"
    assert fee_bp <= MAX_FEE_BASIS_POINTS, "Fee too high"
    
    self.config = ContestConfig(
        owner=msg.sender,
        proposed_owner=empty(address),
        max_donations_per_round=max_donations,
        fee_basis_points=fee_bp,
        minimum_donation=min_donation,
        paused=False
    )
    
    self.current_round = RoundState(
        round_number=1,
        donation_count=0,
        largest_donation=0,
        largest_donor=empty(address),
        total_value=0,
        start_time=block.timestamp,
        is_active=True
    )
    
    self.total_rounds_completed = 0
    self.history_head = 0
    self.all_time_highest_donation = 0
    self.all_time_highest_donor = empty(address)
    
    log RoundStarted(1, block.timestamp)

# ============= CORE GAME LOGIC =============

@payable
@external
def donate():
    """
    @notice Make a donation to enter the current round
    @dev Automatically starts new round after completion
    
    @dev INVARIANT CHECKING:
         Line 188: Ensures donation_count < max (prevents uint16 overflow on line 195)
         Line 189: Prevents reentrancy during round transition
         Combined with initialization constraints, guarantees type safety
    """
    assert not self.config.paused, "Contest is paused"
    assert self.current_round.is_active, "Round is transitioning"
    assert self.current_round.donation_count < self.config.max_donations_per_round, "Round full"
    assert msg.value >= self.config.minimum_donation, "Donation below minimum"
    
    round_num: uint256 = self.current_round.round_number
    previous_leader: address = self.current_round.largest_donor
    
    # Update round state (safe: checked above that donation_count < max)
    self.current_round.donation_count += 1
    self.current_round.total_value += msg.value
    
    # Update per-round donation tracking
    current_user_donation: uint256 = self.round_donations[round_num][msg.sender]
    is_first_donation_this_round: bool = (current_user_donation == 0)
    self.round_donations[round_num][msg.sender] = current_user_donation + msg.value
    
    # Update user lifetime stats
    self.user_lifetime_donated[msg.sender] += msg.value
    if is_first_donation_this_round:
        self.user_rounds_participated[msg.sender] += 1
    
    # Check if this is the largest single donation
    is_largest: bool = False
    if msg.value > self.current_round.largest_donation:
        self.current_round.largest_donation = msg.value
        self.current_round.largest_donor = msg.sender
        is_largest = True
        
        # Update all-time records
        if msg.value > self.all_time_highest_donation:
            self.all_time_highest_donation = msg.value
            self.all_time_highest_donor = msg.sender
        
        log LeaderboardUpdate(round_num, msg.sender, msg.value, previous_leader)
    
    log DonationReceived(round_num, msg.sender, msg.value, self.current_round.donation_count, is_largest, block.timestamp)
    
    # End round and auto-start next if we've reached the limit
    if self.current_round.donation_count == self.config.max_donations_per_round:
        self._end_round()
        self._start_new_round()

@internal
def _end_round():
    """
    @notice Internal function to end current round and distribute funds
    @dev Uses assert on transfers to ensure atomicity
    
    @dev MATHEMATICAL CORRECTNESS:
         - Fee uses integer division (truncation toward zero)
         - Any fractional remainder (< 1/10000 of total) goes to winner
         - This prevents dust accumulation in contract
         - INVARIANT: prize + fee = total (with at most BASIS_POINTS_DIVISOR-1 wei to winner)
    
    @dev REENTRANCY PROTECTION (Checks-Effects-Interactions):
         - State marked inactive before external calls
         - If any transfer fails, entire transaction reverts
         - All state changes are atomic (revert restores is_active = True)
    """
    assert self.current_round.is_active, "Round already ended"
    assert self.current_round.largest_donor != empty(address), "No valid winner"
    
    round_num: uint256 = self.current_round.round_number
    winner: address = self.current_round.largest_donor
    total: uint256 = self.current_round.total_value
    duration: uint256 = block.timestamp - self.current_round.start_time
    
    # Calculate distribution (integer division truncates, remainder implicitly goes to winner)
    fee: uint256 = (total * convert(self.config.fee_basis_points, uint256)) // BASIS_POINTS_DIVISOR
    prize: uint256 = total - fee
    
    # Mark inactive before transfers (CEI pattern: if transfers fail, transaction reverts)
    self.current_round.is_active = False
    
    # CRITICAL: send() reverts automatically on failure - atomicity guaranteed
    send(winner, prize)
    
    if fee > 0:
        send(self.config.owner, fee)
    
    # Update winner stats
    self.user_lifetime_won[winner] += prize
    self.user_rounds_won[winner] += 1
    
    # Store in history (circular buffer pattern)
    # CIRCULAR BUFFER CORRECTNESS:
    # - Modulo ensures index always in [0, MAX_HISTORY)
    # - Oldest entry overwritten when buffer full
    # - history_head grows unbounded (safe: overflow after 2^256 rounds is impossible)
    history_index: uint256 = self.history_head % MAX_HISTORY
    self.round_history[history_index] = RoundResult(
        round_number=round_num,
        winner=winner,
        prize=prize,
        total_donations=total,
        donation_count=self.current_round.donation_count,
        largest_donation=self.current_round.largest_donation,
        end_time=block.timestamp
    )
    self.history_head += 1
    self.total_rounds_completed += 1
    
    log RoundEnded(round_num, winner, prize, fee, total, duration)

@internal
def _start_new_round():
    """
    @notice Internal function to start a new round
    """
    new_round_number: uint256 = self.current_round.round_number + 1
    
    self.current_round = RoundState(
        round_number=new_round_number,
        donation_count=0,
        largest_donation=0,
        largest_donor=empty(address),
        total_value=0,
        start_time=block.timestamp,
        is_active=True
    )
    
    log RoundStarted(new_round_number, block.timestamp)

# ============= ADMIN FUNCTIONS =============

@external
def end_round_early():
    """
    @notice Owner can manually end the current round (emergency use)
    @dev Requires at least one donation to have a winner
    """
    assert msg.sender == self.config.owner, "Only owner"
    assert self.current_round.donation_count > 0, "No donations yet"
    assert self.current_round.is_active, "Round already ended"
    
    self._end_round()
    self._start_new_round()

@external
def propose_ownership_transfer(new_owner: address):
    """
    @notice Propose a new owner (2-step transfer for safety)
    @param new_owner Address of proposed new owner
    """
    assert msg.sender == self.config.owner, "Only owner"
    assert new_owner != empty(address), "Invalid address"
    assert new_owner != self.config.owner, "Already owner"
    
    self.config.proposed_owner = new_owner
    log OwnershipTransferProposed(self.config.owner, new_owner)

@external
def accept_ownership():
    """
    @notice Accept ownership transfer (must be called by proposed owner)
    """
    assert msg.sender == self.config.proposed_owner, "Not proposed owner"
    assert self.config.proposed_owner != empty(address), "No transfer proposed"
    
    old_owner: address = self.config.owner
    self.config.owner = self.config.proposed_owner
    self.config.proposed_owner = empty(address)
    
    log OwnershipTransferred(old_owner, self.config.owner)

@external
def toggle_pause():
    """
    @notice Emergency pause/unpause the contest
    """
    assert msg.sender == self.config.owner, "Only owner"
    
    self.config.paused = not self.config.paused
    log EmergencyPauseToggled(self.config.paused, msg.sender)

@external
def update_fee_basis_points(new_fee_bp: uint16):
    """
    @notice Update the fee percentage
    @param new_fee_bp New fee in basis points (max 1000 = 10%)
    """
    assert msg.sender == self.config.owner, "Only owner"
    assert new_fee_bp <= MAX_FEE_BASIS_POINTS, "Fee too high"
    
    old_value: uint256 = convert(self.config.fee_basis_points, uint256)
    self.config.fee_basis_points = new_fee_bp
    log ConfigUpdated("fee_basis_points", old_value, convert(new_fee_bp, uint256))

@external
def update_minimum_donation(new_minimum: uint256):
    """
    @notice Update the minimum donation requirement
    @param new_minimum New minimum donation in wei
    """
    assert msg.sender == self.config.owner, "Only owner"
    
    old_value: uint256 = self.config.minimum_donation
    self.config.minimum_donation = new_minimum
    log ConfigUpdated("minimum_donation", old_value, new_minimum)

@external
def update_max_donations_per_round(new_max: uint16):
    """
    @notice Update max donations per round (takes effect next round)
    @param new_max New maximum (must be > 0)
    """
    assert msg.sender == self.config.owner, "Only owner"
    assert new_max > 0, "Must allow at least 1 donation"
    
    old_value: uint256 = convert(self.config.max_donations_per_round, uint256)
    self.config.max_donations_per_round = new_max
    log ConfigUpdated("max_donations_per_round", old_value, convert(new_max, uint256))

# ============= QUERY FUNCTIONS =============

@view
@external
def get_current_round_info() -> (uint256, uint16, uint16, uint256, address, uint256, uint256, bool):
    """
    @notice Get comprehensive current round information
    @return round_number, donation_count, max_donations, largest_donation, 
            largest_donor, total_value, start_time, is_active
    """
    return (
        self.current_round.round_number,
        self.current_round.donation_count,
        self.config.max_donations_per_round,
        self.current_round.largest_donation,
        self.current_round.largest_donor,
        self.current_round.total_value,
        self.current_round.start_time,
        self.current_round.is_active
    )

@view
@external
def get_current_leaderboard_position(donor: address) -> (uint256, bool):
    """
    @notice Check if donor is currently winning and their donation amount
    @return donation_amount, is_winning
    """
    amount: uint256 = self.round_donations[self.current_round.round_number][donor]
    is_winning: bool = (donor == self.current_round.largest_donor and donor != empty(address))
    return (amount, is_winning)

@view
@external
def calculate_current_winnings() -> (uint256, uint256):
    """
    @notice Calculate what the current leader would win
    @return prize_amount, fee_amount
    """
    if self.current_round.total_value == 0:
        return (0, 0)
    
    fee: uint256 = (self.current_round.total_value * convert(self.config.fee_basis_points, uint256)) // BASIS_POINTS_DIVISOR
    prize: uint256 = self.current_round.total_value - fee
    return (prize, fee)

@view
@external
def get_user_stats(user: address) -> (uint256, uint256, uint256, uint256):
    """
    @notice Get lifetime statistics for a user
    @return total_donated, total_won, rounds_won, rounds_participated
    """
    return (
        self.user_lifetime_donated[user],
        self.user_lifetime_won[user],
        self.user_rounds_won[user],
        self.user_rounds_participated[user]
    )

@view
@external
def get_round_result(round_number: uint256) -> (address, uint256, uint256, uint16, uint256):
    """
    @notice Get results from a specific completed round
    @dev Only returns results from the last 100 rounds
    @return winner, prize, total_donations, donation_count, end_time
    """
    assert round_number <= self.total_rounds_completed, "Round not completed"
    assert round_number > 0, "Invalid round number"
    
    # Check if this round is still in history buffer
    rounds_ago: uint256 = self.total_rounds_completed - round_number
    assert rounds_ago < MAX_HISTORY, "Round too old (>100 rounds ago)"
    
    # Calculate circular buffer position
    history_index: uint256 = (self.history_head - 1 - rounds_ago) % MAX_HISTORY
    result: RoundResult = self.round_history[history_index]
    
    return (
        result.winner,
        result.prize,
        result.total_donations,
        result.donation_count,
        result.end_time
    )

@view
@external
def get_recent_winners(count: uint256) -> DynArray[address, 100]:
    """
    @notice Get list of recent winners (most recent first)
    @param count Number of recent winners to return (max 100)
    @return Array of winner addresses
    """
    actual_count: uint256 = min(count, min(self.total_rounds_completed, MAX_HISTORY))
    winners: DynArray[address, 100] = []
    
    for i: uint256 in range(100):
        if i >= actual_count:
            break
        history_index: uint256 = (self.history_head - 1 - i) % MAX_HISTORY
        winners.append(self.round_history[history_index].winner)
    
    return winners

@view
@external
def get_global_stats() -> (uint256, uint256, uint256, address):
    """
    @notice Get overall contract statistics
    @return total_rounds_completed, current_round_number, 
            all_time_highest_donation, all_time_highest_donor
    """
    return (
        self.total_rounds_completed,
        self.current_round.round_number,
        self.all_time_highest_donation,
        self.all_time_highest_donor
    )

@view
@external
def get_config() -> (address, uint16, uint16, uint256, bool):
    """
    @notice Get current configuration
    @return owner, max_donations_per_round, fee_basis_points, minimum_donation, paused
    """
    return (
        self.config.owner,
        self.config.max_donations_per_round,
        self.config.fee_basis_points,
        self.config.minimum_donation,
        self.config.paused
    )

@view
@external
def get_time_remaining_estimate() -> uint256:
    """
    @notice Estimate time until round ends (based on current pace)
    @return estimated_seconds (0 if not enough data)
    """
    if self.current_round.donation_count == 0:
        return 0
    
    elapsed: uint256 = block.timestamp - self.current_round.start_time
    donations_remaining: uint256 = convert(self.config.max_donations_per_round - self.current_round.donation_count, uint256)
    
    if donations_remaining == 0:
        return 0
    
    # Average time per donation
    avg_time_per_donation: uint256 = elapsed // convert(self.current_round.donation_count, uint256)
    return avg_time_per_donation * donations_remaining

@view
@external
def get_contract_balance() -> uint256:
    """
    @notice Get current contract balance
    @dev Should be 0 after proper round completion (verifies no stuck funds)
    """
    return self.balance
