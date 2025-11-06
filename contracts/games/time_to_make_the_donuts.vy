# @version 0.4.3

"""
@title Time to Make the Donuts - The Race to Be First
@author L1Ca$h
@notice A game where being FIRST wins. Rush to be the first donor of each day!
@dev Day-based rounds using UTC days

MECHANICS:
- Each day (00:00 UTC) starts a new opportunity
- The FIRST person to donate each day wins the pot from the previous day
- All donations accumulate into the next day's prize pot
- 1% fee goes to owner when a winner claims
- Creates a rush to be the first donor when each new day starts!

STRATEGY:
- Set your alarm for midnight UTC
- Be ready to donate as soon as a new day begins
- Miss the window and you're just adding to tomorrow's pot
- Early bird gets the worm!
"""

# Constants

SECONDS_PER_DAY: constant(uint256) = 86400  # 24 hours in seconds
WINNER_PERCENTAGE: constant(uint256) = 99  # Winner gets 99%

# State variables

owner: public(immutable(address))

pot_value: public(uint256)
current_day: public(uint256)
first_donor_today: public(address)
total_days: public(uint256)

# Events

event DonationReceived:
    day_number: indexed(uint256)
    donor: indexed(address)
    amount: uint256
    new_pot: uint256
    is_first_donor: bool

event WinnerPaid:
    day_number: indexed(uint256)
    winner: indexed(address)
    prize: uint256
    fee: uint256

# Initialization

@deploy
def __init__():
    """
    @notice Initialize the Time to Make the Donuts game
    """
    owner = msg.sender
    self.pot_value = 0
    self.current_day = self._get_current_day()
    self.first_donor_today = empty(address)
    self.total_days = 1

# Core game logic

@payable
@external
def donate():
    """
    @notice Donate to the pot. If you're first today, win yesterday's pot!
    @dev Automatically pays out if you're the first donor of a new day
    """
    assert msg.value > 0, "Must donate something"
    
    today: uint256 = self._get_current_day()
    is_first_donor: bool = False
    
    # Check if we've moved to a new day
    if today > self.current_day:
        # New day! Check if there's a pot to claim
        if self.pot_value > 0:
            # This donor is the first of the new day and wins the pot!
            winner: address = msg.sender
            prize_pot: uint256 = self.pot_value
            
            # Calculate prize (99%) and fee (1%)
            prize: uint256 = (prize_pot * WINNER_PERCENTAGE) // 100
            fee: uint256 = prize_pot - prize
            
            # Pay out winner
            send(winner, prize)
            
            # Pay owner fee
            if fee > 0:
                send(owner, fee)
            
            log WinnerPaid(self.current_day, winner, prize, fee)
            
            # Reset pot to just this donation
            self.pot_value = msg.value
            is_first_donor = True
        else:
            # No pot yet, just add the donation
            self.pot_value += msg.value
            is_first_donor = True
        
        # Update to new day
        self.current_day = today
        self.first_donor_today = msg.sender
        self.total_days += 1
    else:
        # Same day, just add to the pot
        self.pot_value += msg.value
        is_first_donor = False
    
    log DonationReceived(
        self.current_day,
        msg.sender,
        msg.value,
        self.pot_value,
        is_first_donor
    )

# Internal functions

@internal
@view
def _get_current_day() -> uint256:
    """
    @notice Get the current day number (days since Unix epoch)
    @return Day number
    """
    return block.timestamp // SECONDS_PER_DAY

@internal
@view
def _get_seconds_until_next_day() -> uint256:
    """
    @notice Get seconds remaining until next day starts
    @return Seconds until 00:00 UTC
    """
    current_day: uint256 = self._get_current_day()
    next_day_start: uint256 = (current_day + 1) * SECONDS_PER_DAY
    return next_day_start - block.timestamp

# View functions

@view
@external
def get_time_until_next_day() -> uint256:
    """
    @notice Get seconds remaining until the next day begins
    @return Seconds until 00:00 UTC
    """
    return self._get_seconds_until_next_day()

@view
@external
def get_next_day_timestamp() -> uint256:
    """
    @notice Get the timestamp when the next day starts
    @return Unix timestamp of next 00:00 UTC
    """
    current_day: uint256 = self._get_current_day()
    return (current_day + 1) * SECONDS_PER_DAY

@view
@external
def is_new_day_available() -> bool:
    """
    @notice Check if a new day has started (first donor opportunity)
    @return True if current day is greater than stored day
    """
    today: uint256 = self._get_current_day()
    return today > self.current_day

@view
@external
def get_current_day_number() -> uint256:
    """
    @notice Get the current day number
    @return Current day (days since Unix epoch)
    """
    return self._get_current_day()

@view
@external
def get_potential_prize() -> (uint256, uint256):
    """
    @notice Calculate what the next first donor would win
    @return prize_amount, fee_amount
    """
    if self.pot_value == 0:
        return (0, 0)
    
    prize: uint256 = (self.pot_value * WINNER_PERCENTAGE) // 100
    fee: uint256 = self.pot_value - prize
    return (prize, fee)

