# @version 0.4.3

"""
@title Pay It Backward
@author L1Ca$h
@notice A game where your donation goes to the previous donor
@dev When you donate, your funds immediately go to the previous donor
     The first donation goes to the contract creator
     Each subsequent donation rewards the donor who came before you
     
     IMPROVEMENTS (2025 v0.4.3 Update):
     - Updated to Vyper 0.4.3 with pinned version for reproducibility
     - Added formal invariant documentation for correctness
     - Enhanced reentrancy protection documentation
     - Documented immediate payment flow
     - Checked send() calls to prevent silent failures ✓
     - Ownership transfer (2-step) ✓
     - Minimum donation requirement ✓
     - Optimized: Removed per-user statistics and pause mechanism for smaller bytecode
     
     CONTRACT INVARIANTS:
     - INVARIANT: self.balance = 0 (all funds immediately forwarded)
     - INVARIANT: last_donor tracks most recent donor for next recipient
     - First donation always goes to owner (bootstrap mechanism)
     - All address comparisons use empty(address) for type correctness
"""

# ============= STATE VARIABLES =============

owner: public(address)
proposed_owner: public(address)

# Core game state
# INVARIANT: Contract balance = 0 (immediate forwarding of all donations)
# INVARIANT: last_donor = empty(address) ⟺ no donations yet (first goes to owner)
# INVARIANT: After each donation, last_donor = msg.sender
minimum_donation: public(uint256)
last_donor: address
total_donations: public(uint256)
donation_count: public(uint256)

# ============= EVENTS =============

event Donated:
    donor: indexed(address)
    amount: uint256
    recipient: indexed(address)

event FirstDonation:
    donor: indexed(address)
    amount: uint256
    recipient: indexed(address)

event OwnershipTransferProposed:
    current_owner: indexed(address)
    proposed_owner: indexed(address)

event OwnershipTransferred:
    previous_owner: indexed(address)
    new_owner: indexed(address)

event MinimumDonationUpdated:
    old_minimum: uint256
    new_minimum: uint256

# ============= INITIALIZATION =============

@deploy
def __init__(min_donation: uint256):
    """
    @notice Initialize with creator as owner and recipient of first donation
    @param min_donation Minimum donation amount in wei (e.g., 0.001 ETH = 1000000000000000)
    
    @dev ESTABLISHES INVARIANTS:
         - last_donor = empty(address) (no donations yet)
         - Contract balance = 0 at deployment
         - Owner will receive first donation (bootstrap mechanism)
         - All counters initialized to zero
    """
    self.owner = msg.sender
    self.proposed_owner = empty(address)
    self.minimum_donation = min_donation
    self.last_donor = empty(address)
    self.total_donations = 0
    self.donation_count = 0

# ============= CORE FUNCTIONALITY =============

@external
@payable
def donate():
    """
    @notice Donate and pay backward to the previous donor
    @dev First donation goes to contract owner
         All subsequent donations go to the previous donor
         You become the new last_donor who will receive the next donation
    
    @dev REENTRANCY PROTECTION (Checks-Effects-Interactions):
         - All state updates occur BEFORE external call (send)
         - If send fails, entire transaction reverts atomically
         - Immediate forwarding keeps contract balance = 0
    
    @dev INVARIANT PRESERVATION:
         - After execution: last_donor = msg.sender
         - Contract balance returns to 0 after send completes
         - Bootstrap: first donation recipient = owner
    """
    assert msg.value >= self.minimum_donation, "Below minimum"
    
    if self.last_donor == empty(address):
        # First donation - goes to owner (bootstrap mechanism)
        recipient: address = self.owner
        
        # CEI Pattern: Update ALL state before external call
        self.last_donor = msg.sender
        self.total_donations = msg.value
        self.donation_count = 1
        
        # CRITICAL: Checked transfer (revert on failure preserves state consistency)
        send(recipient, msg.value)
        
        log FirstDonation(msg.sender, msg.value, recipient)
    else:
        # Send to previous donor
        recipient: address = self.last_donor
        
        # CEI Pattern: Update ALL state before external call
        self.last_donor = msg.sender
        self.total_donations += msg.value
        self.donation_count += 1
        
        # CRITICAL: Checked transfer (revert on failure preserves state consistency)
        send(recipient, msg.value)
        
        log Donated(msg.sender, msg.value, recipient)

# ============= ADMIN FUNCTIONS =============

@external
def propose_ownership_transfer(new_owner: address):
    """
    @notice Propose a new owner (2-step transfer for safety)
    @param new_owner Address of proposed new owner
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_owner != empty(address), "Invalid address"
    assert new_owner != self.owner, "Already owner"
    
    self.proposed_owner = new_owner
    log OwnershipTransferProposed(self.owner, new_owner)

@external
def accept_ownership():
    """
    @notice Accept ownership transfer (must be called by proposed owner)
    """
    assert msg.sender == self.proposed_owner, "Not proposed owner"
    assert self.proposed_owner != empty(address), "No transfer proposed"
    
    old_owner: address = self.owner
    self.owner = self.proposed_owner
    self.proposed_owner = empty(address)
    
    log OwnershipTransferred(old_owner, self.owner)

@external
def update_minimum_donation(new_minimum: uint256):
    """
    @notice Update the minimum donation amount
    @param new_minimum New minimum donation in wei
    """
    assert msg.sender == self.owner, "Only owner"
    
    old_minimum: uint256 = self.minimum_donation
    self.minimum_donation = new_minimum
    log MinimumDonationUpdated(old_minimum, new_minimum)

# ============= VIEW FUNCTIONS =============

@external
@view
def get_next_recipient() -> address:
    """
    @notice Get who will receive the next donation
    @return Address that will receive next donation (owner if no donations yet)
    """
    if self.last_donor == empty(address):
        return self.owner
    return self.last_donor

# NOTE: Additional state getters are auto-generated from public variables:
#       owner(), minimum_donation(), total_donations(), donation_count(), etc.
