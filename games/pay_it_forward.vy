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
     - Emergency pause mechanism ✓
     - Ownership transfer (2-step) ✓
     - Minimum donation requirement ✓
     - Per-user statistics tracking ✓
     - Enhanced event indexing ✓
     - Emergency withdrawal for stuck funds ✓
     
     CONTRACT INVARIANTS:
     - INVARIANT: self.balance == pending_amount (except during donation execution)
     - INVARIANT: pending_donor != empty(address) ⟺ pending_amount > 0
     - All address comparisons use empty(address) for type correctness
     - First donor establishes the pending state
"""

# ============= STATE VARIABLES =============

owner: public(address)
proposed_owner: public(address)
paused: public(bool)

# Core game state
# INVARIANT: (pending_donor == empty(address)) ⟺ (pending_amount == 0)
# INVARIANT: If pending_donor != empty(address), then self.balance >= pending_amount
pending_donor: public(address)
pending_amount: public(uint256)
total_donations: public(uint256)
donation_count: public(uint256)
minimum_donation: public(uint256)

# Per-user statistics
user_total_donated: public(HashMap[address, uint256])
user_total_received: public(HashMap[address, uint256])
user_donation_count: public(HashMap[address, uint256])

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

event EmergencyPauseToggled:
    paused: bool
    toggled_by: indexed(address)

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
    self.paused = False
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
    assert not self.paused, "Contract is paused"
    assert msg.value >= self.minimum_donation, "Donation below minimum"
    
    if self.pending_donor == empty(address):
        # First donation - set as pending (no external call, establishes invariant)
        self.pending_donor = msg.sender
        self.pending_amount = msg.value
        self.total_donations = msg.value
        self.donation_count = 1
        
        # Update user stats
        self.user_total_donated[msg.sender] = msg.value
        self.user_donation_count[msg.sender] = 1
        
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
        
        # Update user stats
        self.user_total_donated[msg.sender] += msg.value
        self.user_donation_count[msg.sender] += 1
        self.user_total_received[msg.sender] += previous_amount
        
        # CRITICAL: Checked transfer (revert on failure preserves state consistency)
        success: bool = send(msg.sender, previous_amount)
        assert success, "Payment to donor failed"
        
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
    success: bool = send(recipient, amount)
    assert success, "Emergency withdrawal failed"
    
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
def toggle_pause():
    """
    @notice Emergency pause/unpause the contract
    """
    assert msg.sender == self.owner, "Only owner"
    
    self.paused = not self.paused
    log EmergencyPauseToggled(self.paused, msg.sender)

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
def get_pending_info() -> (address, uint256):
    """
    @notice Get information about the pending donation
    @return Tuple of (pending_donor_address, pending_amount)
    """
    return (self.pending_donor, self.pending_amount)

@external
@view
def get_stats() -> (uint256, uint256, bool, uint256):
    """
    @notice Get game statistics
    @return Tuple of (total_donations, donation_count, paused, minimum_donation)
    """
    return (self.total_donations, self.donation_count, self.paused, self.minimum_donation)

@external
@view
def get_user_stats(user: address) -> (uint256, uint256, uint256):
    """
    @notice Get statistics for a specific user
    @param user Address to query
    @return Tuple of (total_donated, total_received, donation_count)
    """
    return (
        self.user_total_donated[user],
        self.user_total_received[user],
        self.user_donation_count[user]
    )

@external
@view
def get_contract_balance() -> uint256:
    """
    @notice Get current contract balance
    @dev Should equal pending_amount (verifies no stuck funds)
    """
    return self.balance

@external
@view
def get_config() -> (address, uint256, bool):
    """
    @notice Get current configuration
    @return Tuple of (owner, minimum_donation, paused)
    """
    return (self.owner, self.minimum_donation, self.paused)
