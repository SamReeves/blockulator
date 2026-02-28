# @version 0.4.3

"""
@title Pay It Forward (Simplified)
@author Sam Reeves
@notice Minimal donation chain where your donation goes to the next donor
@dev First donor becomes pending, each subsequent donor receives the previous pending amount
"""

# State

pending_donor: public(address)
pending_amount: public(uint256)

# Events

event Donation:
    donor: indexed(address)
    amount: uint256
    received: uint256
    is_first: bool

# Init

@deploy
def __init__():
    self.pending_donor = empty(address)
    self.pending_amount = 0

# Core

@external
@payable
def donate():
    """
    @notice Donate and receive previous pending amount
    """
    assert msg.value > 0, "Must donate something"
    
    if self.pending_donor == empty(address):
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        log Donation(msg.sender, msg.value, 0, True)
    else:
        prev_amount: uint256 = self.pending_amount
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        send(msg.sender, prev_amount)
        log Donation(msg.sender, msg.value, prev_amount, False)
