# @version 0.4.3

"""
@title Pissing Contest - Enhanced Continuous Rounds Edition
@author Sam Reeves
@notice A perpetual contest where the largest donor wins each round
@dev Automatically resets after each round, maintains historical data
"""

# Data structures

struct ContestConfig:
    owner: address
    proposed_owner: address
    max_donations_per_round: uint16
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

# Constants

MAX_HISTORY: constant(uint256) = 100

# Events

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

# State variables

config: public(ContestConfig)
current_round: public(RoundState)

round_history: public(RoundResult[100])
history_head: uint256

total_rounds_completed: public(uint256)
all_time_highest_donation: public(uint256)
all_time_highest_donor: public(address)

round_donations: public(HashMap[uint256, HashMap[address, uint256]])

user_lifetime_donated: public(HashMap[address, uint256])
user_lifetime_won: public(HashMap[address, uint256])
user_rounds_won: public(HashMap[address, uint256])
user_rounds_participated: public(HashMap[address, uint256])

# Initialization

@deploy
def __init__(max_donations: uint16, min_donation: uint256):
    """
    @notice Initialize the perpetual contest system
    @param max_donations Maximum donations per round
    @param min_donation Minimum donation in wei
    """
    assert max_donations > 0, "Need at least 1 donation"
    
    self.config = ContestConfig(
        owner=msg.sender,
        proposed_owner=empty(address),
        max_donations_per_round=max_donations,
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

# Core game logic

@payable
@external
def donate():
    """
    @notice Make a donation to enter the current round
    @dev Automatically starts new round after completion
    """
    assert not self.config.paused, "Contest is paused"
    assert self.current_round.is_active, "Round is transitioning"
    assert self.current_round.donation_count < self.config.max_donations_per_round, "Round full"
    assert msg.value >= self.config.minimum_donation, "Donation below minimum"
    
    round_num: uint256 = self.current_round.round_number
    previous_leader: address = self.current_round.largest_donor
    
    self.current_round.donation_count += 1
    self.current_round.total_value += msg.value
    
    current_user_donation: uint256 = self.round_donations[round_num][msg.sender]
    is_first_donation_this_round: bool = (current_user_donation == 0)
    self.round_donations[round_num][msg.sender] = current_user_donation + msg.value
    
    self.user_lifetime_donated[msg.sender] += msg.value
    if is_first_donation_this_round:
        self.user_rounds_participated[msg.sender] += 1
    
    is_largest: bool = False
    if msg.value > self.current_round.largest_donation:
        self.current_round.largest_donation = msg.value
        self.current_round.largest_donor = msg.sender
        is_largest = True
        
        if msg.value > self.all_time_highest_donation:
            self.all_time_highest_donation = msg.value
            self.all_time_highest_donor = msg.sender
        
        log LeaderboardUpdate(round_num, msg.sender, msg.value, previous_leader)
    
    log DonationReceived(round_num, msg.sender, msg.value, self.current_round.donation_count, is_largest, block.timestamp)
    
    if self.current_round.donation_count == self.config.max_donations_per_round:
        self._end_round()
        self._start_new_round()

@internal
def _end_round():
    """
    @notice Internal function to end current round and distribute funds
    """
    assert self.current_round.is_active, "Round already ended"
    assert self.current_round.largest_donor != empty(address), "No valid winner"
    
    round_num: uint256 = self.current_round.round_number
    winner: address = self.current_round.largest_donor
    total: uint256 = self.current_round.total_value
    duration: uint256 = block.timestamp - self.current_round.start_time
    
    prize: uint256 = total  # Winner gets 100% of pot
    
    self.current_round.is_active = False
    
    send(winner, prize)
    
    self.user_lifetime_won[winner] += prize
    self.user_rounds_won[winner] += 1
    
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
    
    log RoundEnded(round_num, winner, prize, 0, total, duration)

@internal
def _start_new_round():
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

# Admin functions

@external
def end_round_early():
    """
    @notice Owner can manually end the current round
    """
    assert msg.sender == self.config.owner, "Only owner"
    assert self.current_round.donation_count > 0, "No donations yet"
    assert self.current_round.is_active, "Round already ended"
    
    self._end_round()
    self._start_new_round()

@external
def propose_ownership_transfer(new_owner: address):
    """
    @notice Propose a new owner
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
    @notice Accept ownership transfer
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
    @notice Pause/unpause the contest
    """
    assert msg.sender == self.config.owner, "Only owner"
    
    self.config.paused = not self.config.paused
    log EmergencyPauseToggled(self.config.paused, msg.sender)

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
    @notice Update max donations per round
    @param new_max New maximum
    """
    assert msg.sender == self.config.owner, "Only owner"
    assert new_max > 0, "Must allow at least 1 donation"
    
    old_value: uint256 = convert(self.config.max_donations_per_round, uint256)
    self.config.max_donations_per_round = new_max
    log ConfigUpdated("max_donations_per_round", old_value, convert(new_max, uint256))

# Query functions

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
    @notice Check if donor is currently winning
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
    @return prize_amount (100% of pot), 0 (no fee)
    """
    if self.current_round.total_value == 0:
        return (0, 0)
    
    return (self.current_round.total_value, 0)

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
    @return winner, prize, total_donations, donation_count, end_time
    """
    assert round_number <= self.total_rounds_completed, "Round not completed"
    assert round_number > 0, "Invalid round number"
    
    rounds_ago: uint256 = self.total_rounds_completed - round_number
    assert rounds_ago < MAX_HISTORY, "Round too old"
    
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
    @notice Get list of recent winners
    @param count Number of recent winners to return
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
def get_config() -> (address, uint16, uint256, bool):
    """
    @notice Get current configuration
    @return owner, max_donations_per_round, minimum_donation, paused
    """
    return (
        self.config.owner,
        self.config.max_donations_per_round,
        self.config.minimum_donation,
        self.config.paused
    )

@view
@external
def get_time_remaining_estimate() -> uint256:
    """
    @notice Estimate time until round ends
    @return estimated_seconds
    """
    if self.current_round.donation_count == 0:
        return 0
    
    elapsed: uint256 = block.timestamp - self.current_round.start_time
    donations_remaining: uint256 = convert(self.config.max_donations_per_round - self.current_round.donation_count, uint256)
    
    if donations_remaining == 0:
        return 0
    
    avg_time_per_donation: uint256 = elapsed // convert(self.current_round.donation_count, uint256)
    return avg_time_per_donation * donations_remaining

@view
@external
def get_contract_balance() -> uint256:
    """
    @notice Get current contract balance
    """
    return self.balance
