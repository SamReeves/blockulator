# @version 0.4.3

"""
@title Last Call - The Race to Be Last
@author L1Ca$h
@notice A game where being LAST wins. Rush to donate at the end of each 10-day round!
@dev Simplified time-based rounds

MECHANICS:
- Each round lasts 10 days from the last donation
- Anyone can donate to become the potential winner
- The LAST person to donate before the round ends wins 100% of the pot
- Winner gets 100% of the pot (no fees)
- Creates a rush to be the last donor before time runs out!

STRATEGY:
- Donate late to maximize your chance of winning
- But don't wait too long or someone else will swoop in
- Watch the clock and outmaneuver other players
- Every donation resets the 10-day countdown!
"""

# Constants

ROUND_DURATION: constant(uint256) = 864000  # 10 days in seconds
WINNER_PERCENTAGE: constant(uint256) = 100  # Winner gets 100%

# State variables

owner: public(immutable(address))

round_number: public(uint256)
pot_value: public(uint256)
last_donor: public(address)
last_donation_time: public(uint256)

# Events

event DonationReceived:
    round_number: indexed(uint256)
    donor: indexed(address)
    amount: uint256
    new_pot: uint256
    deadline: uint256

event RoundEnded:
    round_number: indexed(uint256)
    winner: indexed(address)
    prize: uint256
    fee: uint256

# Initialization

@deploy
def __init__():
    """
    @notice Initialize the Last Call game
    """
    owner = msg.sender
    self.round_number = 1
    self.pot_value = 0
    self.last_donor = empty(address)
    self.last_donation_time = block.timestamp

# Core game logic

@payable
@external
def donate():
    """
    @notice Donate to become the last donor and potential winner
    @dev Resets the round timer with each donation
    """
    assert msg.value > 0, "Must donate something"
    
    # Check if round should have ended - if so, payout and start new round
    if self._should_end_round():
        self._end_round()
    
    # Update round state
    self.pot_value += msg.value
    self.last_donor = msg.sender
    self.last_donation_time = block.timestamp
    
    # Calculate deadline
    deadline: uint256 = self.last_donation_time + ROUND_DURATION
    
    log DonationReceived(
        self.round_number,
        msg.sender,
        msg.value,
        self.pot_value,
        deadline
    )

@external
def end_round():
    """
    @notice Anyone can call this to end the round if time has expired
    @dev Winner receives 100% of pot
    """
    assert self._should_end_round(), "Round not ready to end"
    self._end_round()

# Internal functions

@internal
@view
def _should_end_round() -> bool:
    """
    @notice Check if the round should end
    @return True if 10 days have passed since last donation
    """
    if self.last_donor == empty(address):
        return False
    
    deadline: uint256 = self.last_donation_time + ROUND_DURATION
    return block.timestamp >= deadline

@internal
def _end_round():
    """
    @notice Internal function to end current round and distribute prize
    """
    assert self.last_donor != empty(address), "No donations this round"
    
    winner: address = self.last_donor
    prize: uint256 = self.pot_value
    
    # Pay out winner (100% of pot)
    send(winner, prize)
    
    log RoundEnded(self.round_number, winner, prize, 0)
    
    # Increment round and reset state
    self.round_number += 1
    self.pot_value = 0
    self.last_donor = empty(address)
    self.last_donation_time = block.timestamp

# View functions

@view
@external
def get_time_remaining() -> uint256:
    """
    @notice Get seconds remaining in current round
    @return Seconds until round can be ended (0 if can end now)
    """
    if self.last_donor == empty(address):
        return ROUND_DURATION
    
    deadline: uint256 = self.last_donation_time + ROUND_DURATION
    
    if block.timestamp >= deadline:
        return 0
    
    return deadline - block.timestamp

@view
@external
def get_deadline() -> uint256:
    """
    @notice Get the timestamp when the current round ends
    @return Unix timestamp of round deadline
    """
    if self.last_donor == empty(address):
        return block.timestamp + ROUND_DURATION
    
    return self.last_donation_time + ROUND_DURATION

@view
@external
def can_end_round() -> bool:
    """
    @notice Check if the round can be ended now
    @return True if round is ready to end
    """
    return self._should_end_round()

@view
@external
def get_current_winner_prize() -> (uint256, uint256):
    """
    @notice Calculate what the current last donor would win
    @return prize_amount (100% of pot), 0 (no fee)
    """
    if self.pot_value == 0:
        return (0, 0)
    
    return (self.pot_value, 0)

