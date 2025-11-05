# @version 0.4.3

"""
@title Pay It Forward (Simplified)
@author L1Ca$h
@notice Minimal donation chain where your donation goes to the next donor
@dev First donor becomes pending, each subsequent donor receives the previous pending amount
     
     Pure game logic with no administrative overhead.
     All statistics can be derived from events.
     
     INVARIANTS:
     - self.balance == pending_amount (except during send)
     - (pending_donor == empty(address)) ⟺ (pending_amount == 0)
"""

# ============= STATE =============

pending_donor: public(address)
pending_amount: public(uint256)

# ============= EVENTS =============

event Donation:
    donor: indexed(address)
    amount: uint256
    received: uint256
    is_first: bool

# ============= INIT =============

@deploy
def __init__():
    """Initialize with no pending donation"""
    self.pending_donor = empty(address)
    self.pending_amount = 0

# ============= CORE =============

@external
@payable
def donate():
    """
    @notice Donate and receive previous pending amount
    @dev First donor sets pending, subsequent donors receive pending and become new pending
    """
    assert msg.value > 0, "Must donate something"
    
    if self.pending_donor == empty(address):
        # First donation - establish pending
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        log Donation(msg.sender, msg.value, 0, True)
    else:
        # Pay previous pending donor, become new pending
        prev_amount: uint256 = self.pending_amount
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        send(msg.sender, prev_amount)
        log Donation(msg.sender, msg.value, prev_amount, False)
