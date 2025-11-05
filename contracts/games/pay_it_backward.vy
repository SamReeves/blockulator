# @version 0.4.3

"""
@title Pay It Backward (Simplified)
@author L1Ca$h
@notice Minimal donation chain where your donation goes to the previous donor
@dev Each donor immediately pays the previous donor, first donation goes to deployer
     
     Pure game logic with no administrative overhead.
     All statistics can be derived from events.
     
     INVARIANTS:
     - self.balance == 0 (immediate forwarding)
     - last_donor tracks most recent donor
"""

# ============= STATE =============

owner: public(address)  # Bootstrap recipient for first donation
last_donor: public(address)

# ============= EVENTS =============

event Donation:
    donor: indexed(address)
    amount: uint256
    recipient: indexed(address)
    is_first: bool

# ============= INIT =============

@deploy
def __init__():
    """Initialize with deployer as bootstrap recipient"""
    self.owner = msg.sender
    self.last_donor = empty(address)

# ============= CORE =============

@external
@payable
def donate():
    """
    @notice Donate to reward the previous donor
    @dev First donation goes to owner, subsequent donations go to last_donor
    """
    assert msg.value > 0, "Must donate something"
    
    if self.last_donor == empty(address):
        # First donation - goes to owner (bootstrap)
        self.last_donor = msg.sender
        send(self.owner, msg.value)
        log Donation(msg.sender, msg.value, self.owner, True)
    else:
        # Pay previous donor
        recipient: address = self.last_donor
        self.last_donor = msg.sender
        send(recipient, msg.value)
        log Donation(msg.sender, msg.value, recipient, False)

# ============= VIEW =============

@external
@view
def get_next_recipient() -> address:
    """
    @notice Get who will receive the next donation
    @return Address that will receive next donation
    """
    if self.last_donor == empty(address):
        return self.owner
    return self.last_donor
