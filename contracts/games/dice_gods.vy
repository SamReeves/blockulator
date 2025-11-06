# @version 0.4.3

"""
@title Dice Gods - Reverse Popularity Contest
@author L1Ca$h
@notice Choose the LEAST popular number (1-6) to win
@dev After 10 plays, winners who chose the rarest number split the pot weighted by order
"""

# Data structures

struct Play:
    player: address
    number: uint8
    amount: uint256
    play_index: uint8

# Constants

PLAYS_PER_ROUND: constant(uint8) = 10
MIN_NUMBER: constant(uint8) = 1
MAX_NUMBER: constant(uint8) = 6

# Events

event PlayMade:
    round_number: indexed(uint256)
    player: indexed(address)
    number: uint8
    amount: uint256
    play_number: uint8

event WinnerPaid:
    round_number: indexed(uint256)
    winner: indexed(address)
    number: uint8
    amount: uint256

event RoundEnded:
    round_number: indexed(uint256)
    winning_numbers: DynArray[uint8, 6]
    winner_count: uint8

event RoundStarted:
    round_number: indexed(uint256)

# State variables

owner: public(immutable(address))
minimum_donation: public(uint256)

round_number: public(uint256)
play_count: public(uint8)
total_pot: public(uint256)

round_plays: public(DynArray[Play, 10])
number_counts: public(HashMap[uint8, uint8])

# Initialization

@deploy
def __init__(min_donation: uint256):
    """
    @notice Initialize the Dice Gods game
    @param min_donation Minimum donation in wei
    """
    owner = msg.sender
    self.minimum_donation = min_donation
    self.round_number = 1
    self.play_count = 0
    self.total_pot = 0
    
    log RoundStarted(round_number=1)

# Core game logic

@payable
@external
def play(number: uint8):
    """
    @notice Make a play by choosing a number 1-6
    @param number Your chosen number (1-6)
    """
    assert self.play_count < PLAYS_PER_ROUND, "Round full"
    assert msg.value >= self.minimum_donation, "Donation too low"
    assert number >= MIN_NUMBER and number <= MAX_NUMBER, "Number must be 1-6"
    
    # Record the play
    self.play_count += 1
    self.total_pot += msg.value
    
    self.round_plays.append(Play(
        player=msg.sender,
        number=number,
        amount=msg.value,
        play_index=self.play_count
    ))
    
    self.number_counts[number] += 1
    
    log PlayMade(round_number=self.round_number, player=msg.sender, number=number, amount=msg.value, play_number=self.play_count)
    
    # End round after 10th play
    if self.play_count == PLAYS_PER_ROUND:
        self._end_round()
        self._start_new_round()

@internal
def _end_round():
    """
    @notice End round and distribute winnings
    """
    # Find the minimum count
    min_count: uint8 = 255
    for num: uint8 in range(MIN_NUMBER, MAX_NUMBER + 1):
        count: uint8 = self.number_counts[num]
        if count > 0 and count < min_count:
            min_count = count
    
    # Find winning numbers
    winning_numbers: DynArray[uint8, 6] = []
    for num: uint8 in range(MIN_NUMBER, MAX_NUMBER + 1):
        if self.number_counts[num] == min_count:
            winning_numbers.append(num)
    
    # Calculate total weight
    total_weight: uint256 = 0
    winner_count: uint8 = 0
    
    for i: uint256 in range(10):
        if i >= len(self.round_plays):
            break
        play: Play = self.round_plays[i]
        
        # Check if winner
        for winning_num: uint8 in winning_numbers:
            if play.number == winning_num:
                position_weight: uint256 = convert(PLAYS_PER_ROUND - play.play_index + 1, uint256)
                weight: uint256 = play.amount * position_weight
                total_weight += weight
                winner_count += 1
                break
    
    # Distribute winnings
    if total_weight > 0:
        for i: uint256 in range(10):
            if i >= len(self.round_plays):
                break
            play: Play = self.round_plays[i]
            
            # Check if winner
            for winning_num: uint8 in winning_numbers:
                if play.number == winning_num:
                    position_weight: uint256 = convert(PLAYS_PER_ROUND - play.play_index + 1, uint256)
                    weight: uint256 = play.amount * position_weight
                    payout: uint256 = (self.total_pot * weight) // total_weight
                    
                    if payout > 0:
                        send(play.player, payout)
                        log WinnerPaid(round_number=self.round_number, winner=play.player, number=play.number, amount=payout)
                    break
    
    log RoundEnded(round_number=self.round_number, winning_numbers=winning_numbers, winner_count=winner_count)

@internal
def _start_new_round():
    """
    @notice Start a fresh round
    """
    self.round_number += 1
    self.play_count = 0
    self.total_pot = 0
    self.round_plays = []
    
    for num: uint8 in range(MIN_NUMBER, MAX_NUMBER + 1):
        self.number_counts[num] = 0
    
    log RoundStarted(round_number=self.round_number)

# View functions

@view
@external
def get_current_round_info() -> (uint256, uint8, uint256):
    """
    @notice Get current round info
    @return round_number, play_count, total_pot
    """
    return (self.round_number, self.play_count, self.total_pot)

@view
@external
def get_number_counts() -> (uint8, uint8, uint8, uint8, uint8, uint8):
    """
    @notice Get vote counts for each number
    @return (count_1, count_2, count_3, count_4, count_5, count_6)
    """
    return (
        self.number_counts[1],
        self.number_counts[2],
        self.number_counts[3],
        self.number_counts[4],
        self.number_counts[5],
        self.number_counts[6]
    )

@view
@external
def get_plays() -> DynArray[Play, 10]:
    """
    @notice Get all plays in current round
    """
    return self.round_plays
