# @version 0.4.3

"""
@title King of the Hill - Winner Takes All Edition
@author L1Ca$h
@notice Pay to dethrone and claim the prize. Stakes grow with dual constraints.
@dev Perpetual king game where you pay to win the previous stake

MECHANICS:
- Prize pot starts at initial_stake
- To claim throne and win the prize, you must pay BOTH:
  * At least (current_prize + 1000 wei)
  * At least (current_prize * 1.01)
- Winner receives the current prize immediately
- Your payment becomes the new prize for the next person
- No refunds - prize pot keeps growing

EXAMPLE:
- Prize: 10000 wei
- Alice pays 11000 (>=10000+1000 and >=10100) -> wins 10000, new prize: 11000
- Bob pays 12100 (>=11000+1000 and >=11110) -> wins 11000, new prize: 12100
- Stakes grow exponentially!
"""

# Constants

MINIMUM_INCREASE_BP: constant(uint256) = 100  # 1% = 100 basis points
BASIS_POINTS: constant(uint256) = 10000
MINIMUM_ABSOLUTE_INCREASE: constant(uint256) = 1000  # Minimum 1000 wei increase

# State variables

owner: public(immutable(address))

current_king: public(address)
current_prize: public(uint256)
coronation_time: public(uint256)
total_dethronements: public(uint256)

king_history: public(DynArray[address, 1000])
reign_duration: public(HashMap[address, uint256])
times_crowned: public(HashMap[address, uint256])

# Events

event NewKing:
    new_king: indexed(address)
    previous_king: indexed(address)
    payment: uint256
    prize_won: uint256
    new_prize: uint256
    dethronement_number: uint256
    timestamp: uint256

# Initialization

@deploy
def __init__(initial_prize: uint256):
    """
    @notice Initialize the eternal hill
    @param initial_prize Starting prize in wei
    """
    assert initial_prize > 0, "Need non-zero starting prize"
    
    owner = msg.sender
    self.current_king = empty(address)
    self.current_prize = initial_prize
    self.coronation_time = block.timestamp
    self.total_dethronements = 0

# Core game logic

@payable
@external
def claim_throne():
    """
    @notice Pay to dethrone and claim the prize
    @dev Must satisfy BOTH minimum requirements
    """
    percentage_minimum: uint256 = (self.current_prize * (BASIS_POINTS + MINIMUM_INCREASE_BP)) // BASIS_POINTS
    absolute_minimum: uint256 = self.current_prize + MINIMUM_ABSOLUTE_INCREASE
    
    assert msg.value >= percentage_minimum, "Payment below percentage minimum"
    assert msg.value >= absolute_minimum, "Payment below absolute minimum"
    
    previous_king: address = self.current_king
    prize_to_win: uint256 = self.current_prize
    
    if previous_king != empty(address):
        reign_time: uint256 = block.timestamp - self.coronation_time
        self.reign_duration[previous_king] += reign_time
        
        send(msg.sender, prize_to_win)
    
    self.current_king = msg.sender
    self.current_prize = msg.value
    self.coronation_time = block.timestamp
    self.total_dethronements += 1
    
    self.king_history.append(msg.sender)
    self.times_crowned[msg.sender] += 1
    
    log NewKing(
        msg.sender,
        previous_king,
        msg.value,
        prize_to_win,
        msg.value,
        self.total_dethronements,
        block.timestamp
    )

# View functions

@view
@external
def get_minimum_payment() -> uint256:
    """
    @notice Calculate minimum payment to dethrone current king
    @return Minimum payment
    """
    percentage_minimum: uint256 = (self.current_prize * (BASIS_POINTS + MINIMUM_INCREASE_BP)) // BASIS_POINTS
    absolute_minimum: uint256 = self.current_prize + MINIMUM_ABSOLUTE_INCREASE
    
    if absolute_minimum > percentage_minimum:
        return absolute_minimum
    return percentage_minimum

@view
@external
def get_current_reign_duration() -> uint256:
    """
    @notice How long has current king reigned?
    """
    if self.current_king == empty(address):
        return 0
    return block.timestamp - self.coronation_time

@view
@external
def get_king_stats(king: address) -> (uint256, uint256):
    """
    @notice Get stats for a specific address
    @return (times_crowned, total_reign_duration)
    """
    return (self.times_crowned[king], self.reign_duration[king])

@view
@external
def get_recent_kings(count: uint256) -> DynArray[address, 100]:
    """
    @notice Get most recent kings
    """
    result: DynArray[address, 100] = []
    total: uint256 = len(self.king_history)
    
    if total == 0:
        return result
    
    actual_count: uint256 = count
    if actual_count > 100:
        actual_count = 100
    
    start: uint256 = 0
    if total > actual_count:
        start = total - actual_count
    
    for i: uint256 in range(start, total, bound=100):
        result.append(self.king_history[i])
    
    return result

@view
@external
def get_contract_balance() -> uint256:
    """
    @notice Total balance
    """
    return self.balance

