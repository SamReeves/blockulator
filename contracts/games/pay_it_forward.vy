# @version 0.4.3

"""
@title Pay It Forward
@author L1Ca$h
@notice A game where your donation goes to the next donor
@dev When you donate, your funds are held until someone else donates
     The next donor receives your donation amount
     Your donation then becomes pending for the following donor
     
     IMPROVEMENTS (2025 v0.4.3 Update):
     - Updated to Vyper 0.4.3 with pinned version for reproducibility
     - Added formal invariant documentation for correctness
     - Enhanced reentrancy protection documentation
     - Documented contract balance invariants
     - Checked send() calls to prevent silent failures ✓
     - Ownership transfer (2-step) ✓
     - Minimum donation requirement ✓
     - Emergency withdrawal for stuck funds ✓
     - Optimized: Removed per-user statistics and pause mechanism for smaller bytecode
     
     CONTRACT INVARIANTS:
     - INVARIANT: self.balance == pending_amount (except during donation execution)
     - INVARIANT: pending_donor != empty(address) ⟺ pending_amount > 0
     - All address comparisons use empty(address) for type correctness
     - First donor establishes the pending state
"""

# ============= STATE VARIABLES =============

owner: public(address)
proposed_owner: public(address)

# Core game state
# INVARIANT: (pending_donor == empty(address)) ⟺ (pending_amount == 0)
# INVARIANT: If pending_donor != empty(address), then self.balance >= pending_amount
pending_donor: public(address)
pending_amount: public(uint256)
total_donations: public(uint256)
donation_count: public(uint256)
minimum_donation: public(uint256)

# ============= EVENTS =============

event Donated:
    donor: indexed(address)
    amount: uint256
    received_from: indexed(address)
    received_amount: uint256
    timestamp: uint256

event FirstDonation:
    donor: indexed(address)
    amount: uint256
    timestamp: uint256

event OwnershipTransferProposed:
    current_owner: indexed(address)
    proposed_owner: indexed(address)

event OwnershipTransferred:
    previous_owner: indexed(address)
    new_owner: indexed(address)

event MinimumDonationUpdated:
    old_minimum: uint256
    new_minimum: uint256

event EmergencyWithdrawal:
    recipient: indexed(address)
    amount: uint256

# ============= INITIALIZATION =============

@deploy
def __init__(min_donation: uint256):
    """
    @notice Initialize with no pending donation
    @param min_donation Minimum donation amount in wei (e.g., 0.001 ETH = 1000000000000000)
    
    @dev ESTABLISHES INVARIANTS:
         - pending_donor = empty(address) and pending_amount = 0 (consistent initial state)
         - Contract balance = 0 at deployment
         - All counters initialized to zero
    """
    self.owner = msg.sender
    self.proposed_owner = empty(address)
    self.pending_donor = empty(address)
    self.pending_amount = 0
    self.total_donations = 0
    self.donation_count = 0
    self.minimum_donation = min_donation

# ============= CORE FUNCTIONALITY =============

@external
@payable
def donate():
    """
    @notice Donate and receive the previous pending donation
    @dev First donor sets the initial pending donation
         All subsequent donors receive the pending amount and become the new pending donor
    
    @dev REENTRANCY PROTECTION (Checks-Effects-Interactions):
         - All state updates occur BEFORE external call (send)
         - If send fails, entire transaction reverts
         - State remains consistent due to atomicity
    
    @dev INVARIANT PRESERVATION:
         - After execution: pending_donor = msg.sender, pending_amount = msg.value
         - Contract balance equals new pending_amount after send completes
         - First donation establishes pending state without external call
    """
    assert msg.value >= self.minimum_donation, "Below minimum"
    
    if self.pending_donor == empty(address):
        # First donation - set as pending (no external call, establishes invariant)
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        self.total_donations = msg.value
        self.donation_count = 1
        
        log FirstDonation(msg.sender, msg.value, block.timestamp)
    else:
        # Send pending amount to current donor
        previous_donor: address = self.pending_donor
        previous_amount: uint256 = self.pending_amount
        
        # CEI Pattern: Update ALL state before external call
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        self.total_donations += msg.value
        self.donation_count += 1
        
        # CRITICAL: Checked transfer (revert on failure preserves state consistency)
        send(msg.sender, previous_amount)
        
        log Donated(msg.sender, msg.value, previous_donor, previous_amount, block.timestamp)

# ============= ADMIN FUNCTIONS =============

@external
def emergency_withdraw_pending():
    """
    @notice Emergency function to withdraw pending donation if stuck
    @dev Only callable by owner, sends pending amount to pending donor
    
    @dev CEI PATTERN:
         - Validates invariants (pending_amount > 0 ⟺ pending_donor != empty)
         - Resets state before external call
         - Checked transfer ensures atomicity
         - Restores invariant: pending_donor = empty ⟺ pending_amount = 0
    """
    assert msg.sender == self.owner, "Only owner"
    assert self.pending_amount > 0, "No pending amount"
    assert self.pending_donor != empty(address), "No pending donor"
    
    recipient: address = self.pending_donor
    amount: uint256 = self.pending_amount
    
    # Reset state before external call (CEI pattern)
    self.pending_donor = empty(address)
    self.pending_amount = 0
    
    # Checked transfer (revert on failure)
    send(recipient, amount)
    
    log EmergencyWithdrawal(recipient, amount)

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
# NOTE: All state variables are public and have auto-generated getters
#       Access via: owner(), pending_donor(), pending_amount(), 
#       total_donations(), donation_count(), minimum_donation(), etc.
