# @version 0.4.3

"""
@title Pay It Backward (Simplified)
@author L1Ca$h
@notice Minimal donation chain where your donation goes to the previous donor
@dev Each donor immediately pays the previous donor, first donation goes to deployer
"""

# State

owner: public(address)
last_donor: public(address)

# Events

event Donation:
    donor: indexed(address)
    amount: uint256
    recipient: indexed(address)
    is_first: bool

# Init

@deploy
def __init__():
    self.owner = msg.sender
    self.last_donor = empty(address)

# Core

@external
@payable
def donate():
    """
    @notice Donate to reward the previous donor
    """
    assert msg.value > 0, "Must donate something"
    
    if self.last_donor == empty(address):
        self.last_donor = msg.sender
        send(self.owner, msg.value)
        log Donation(msg.sender, msg.value, self.owner, True)
    else:
        recipient: address = self.last_donor
        self.last_donor = msg.sender
        send(recipient, msg.value)
        log Donation(msg.sender, msg.value, recipient, False)

# View

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
