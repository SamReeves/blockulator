# @version 0.4.3

"""
@title Badge Factory - One Badge Per Wallet
@author L1Ca$h
@notice Factory for creating wallet identity badges
@dev Enforces one badge per wallet, uses blueprint pattern for deployment

ARCHITECTURE:
- One badge per wallet (enforced via HashMap)
- Blueprint-based deployment (gas-efficient)
- No badge transfers (identity, not assets)
- Simple registry lookup (O(1) constant gas)

ECONOMICS:
- Creation cost: ~1M gas for 49KB pixel data storage
- No factory fees (users pay their own gas)
- Optional: Could add creation fee for spam prevention

REGISTRY:
- wallet_badge[address] -> badge_address
- O(1) lookup regardless of total badges
- Scales to millions of users without degradation
"""

# ============================================================================
# EVENTS
# ============================================================================

event BadgeCreated:
    badge_address: indexed(address)
    owner: indexed(address)
    timestamp: uint256
    total_badges: uint256

event BlueprintUpdated:
    old_blueprint: indexed(address)
    new_blueprint: indexed(address)
    timestamp: uint256

# ============================================================================
# INTERFACES
# ============================================================================

interface IBadge:
    def owner() -> address: view
    def creation_time() -> uint256: view
    def edit_count() -> uint256: view
    def is_authentic(wallet: address) -> bool: view
    def get_pixel_data_hash() -> bytes32: view

# ============================================================================
# STATE VARIABLES
# ============================================================================

# Blueprint for deploying badges
badge_blueprint: public(address)

# Core registry: ONE badge per wallet
wallet_badge: public(HashMap[address, address])

# Reverse lookup: badge -> whether it's valid
is_badge: public(HashMap[address, bool])

# Statistics
total_badges: public(uint256)

# Governance
owner: public(address)

# Optional: Minimum creation fee (0 = free)
creation_fee: public(uint256)

# Optional: Anti-spam cooldown
creation_cooldown: public(uint256)
last_creation_time: public(HashMap[address, uint256])

# ============================================================================
# CONSTANTS
# ============================================================================

PIXEL_DATA_SIZE: constant(uint256) = 3072  # 32 * 32 * 3

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(_badge_blueprint: address, _owner: address, _creation_fee: uint256, _creation_cooldown: uint256):
    """
    @notice Initialize badge factory
    @param _badge_blueprint Address of badge contract blueprint
    @param _owner Factory owner (can update blueprint, adjust fees)
    @param _creation_fee Minimum ETH required to create badge (0 = free)
    @param _creation_cooldown Seconds between badge creations per wallet (0 = no limit)
    """
    assert _badge_blueprint != empty(address), "Blueprint cannot be zero address"
    assert _owner != empty(address), "Owner cannot be zero address"
    
    self.badge_blueprint = _badge_blueprint
    self.owner = _owner
    self.total_badges = 0
    self.creation_fee = _creation_fee
    self.creation_cooldown = _creation_cooldown

# ============================================================================
# CORE FUNCTIONS
# ============================================================================

@payable
@external
def create_badge(pixel_data: Bytes[3072]) -> address:
    """
    @notice Create your one and only badge
    @param pixel_data 3,072 bytes (32x32 RGB pixel art)
    @return Address of deployed badge contract
    @dev Can only be called once per wallet
    """
    # Validation
    assert len(pixel_data) == PIXEL_DATA_SIZE, "Invalid pixel data size (must be 3,072 bytes)"
    assert self.wallet_badge[msg.sender] == empty(address), "You already have a badge"
    assert msg.value >= self.creation_fee, "Insufficient creation fee"
    
    # Anti-spam cooldown check
    if self.creation_cooldown > 0:
        assert block.timestamp >= self.last_creation_time[msg.sender] + self.creation_cooldown, "Creation cooldown active"
    
    # Deploy badge from blueprint
    badge_addr: address = create_from_blueprint(
        self.badge_blueprint,
        pixel_data,           # _pixel_data
        msg.sender,           # _owner (immutable)
        self,                 # _factory
        code_offset=3
    )
    
    # Register badge
    self.wallet_badge[msg.sender] = badge_addr
    self.is_badge[badge_addr] = True
    self.total_badges += 1
    self.last_creation_time[msg.sender] = block.timestamp
    
    log BadgeCreated(
        badge_address=badge_addr,
        owner=msg.sender,
        timestamp=block.timestamp,
        total_badges=self.total_badges
    )
    
    return badge_addr

# ============================================================================
# VIEW FUNCTIONS - REGISTRY LOOKUPS
# ============================================================================

@view
@external
def get_badge(wallet: address) -> address:
    """
    @notice Get a wallet's badge address
    @param wallet The wallet address to look up
    @return Badge address (empty(address) if none exists)
    @dev O(1) constant gas regardless of total badges
    """
    return self.wallet_badge[wallet]

@view
@external
def has_badge(wallet: address) -> bool:
    """
    @notice Check if a wallet has created a badge
    @param wallet The wallet address to check
    @return True if wallet has a badge
    """
    return self.wallet_badge[wallet] != empty(address)

@view
@external
def verify_badge(badge_address: address, claimed_owner: address) -> bool:
    """
    @notice Verify a badge belongs to claimed owner
    @param badge_address The badge contract address
    @param claimed_owner The wallet claiming to own it
    @return True if badge is authentic and belongs to claimed_owner
    @dev Two-way verification: factory registry + badge owner
    """
    # Check factory registry
    if self.wallet_badge[claimed_owner] != badge_address:
        return False
    
    # Check badge is in our registry
    if not self.is_badge[badge_address]:
        return False
    
    # Verify badge's internal state matches
    return staticcall IBadge(badge_address).is_authentic(claimed_owner)

@view
@external
def get_badge_info(wallet: address) -> (address, uint256, uint256, bytes32):
    """
    @notice Get comprehensive badge info for a wallet
    @param wallet The wallet address
    @return (badge_address, creation_time, edit_count, pixel_hash)
    @dev Returns empty values if no badge exists
    """
    badge_addr: address = self.wallet_badge[wallet]
    
    if badge_addr == empty(address):
        return (empty(address), 0, 0, empty(bytes32))
    
    badge: IBadge = IBadge(badge_addr)
    return (
        badge_addr,
        staticcall badge.creation_time(),
        staticcall badge.edit_count(),
        staticcall badge.get_pixel_data_hash()
    )

@view
@external
def can_create_badge(wallet: address) -> (bool, String[100]):
    """
    @notice Check if a wallet can create a badge (with reason if not)
    @param wallet The wallet address to check
    @return (can_create, reason)
    """
    # Already has badge
    if self.wallet_badge[wallet] != empty(address):
        return (False, "Wallet already has a badge")
    
    # Cooldown active
    if self.creation_cooldown > 0:
        next_allowed: uint256 = self.last_creation_time[wallet] + self.creation_cooldown
        if block.timestamp < next_allowed:
            return (False, "Creation cooldown active")
    
    return (True, "Can create badge")

# ============================================================================
# GOVERNANCE FUNCTIONS
# ============================================================================

@external
def set_blueprint(new_blueprint: address):
    """
    @notice Update badge blueprint (for future deployments)
    @param new_blueprint New blueprint address
    @dev Only owner, does NOT affect existing badges
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_blueprint != empty(address), "Invalid blueprint"
    
    old_blueprint: address = self.badge_blueprint
    self.badge_blueprint = new_blueprint
    
    log BlueprintUpdated(
        old_blueprint=old_blueprint,
        new_blueprint=new_blueprint,
        timestamp=block.timestamp
    )

@external
def set_creation_fee(new_fee: uint256):
    """
    @notice Update creation fee
    @param new_fee New minimum fee in wei (0 = free)
    @dev Only owner
    """
    assert msg.sender == self.owner, "Only owner"
    self.creation_fee = new_fee

@external
def set_creation_cooldown(new_cooldown: uint256):
    """
    @notice Update creation cooldown period
    @param new_cooldown Seconds between creations (0 = no limit)
    @dev Only owner
    """
    assert msg.sender == self.owner, "Only owner"
    self.creation_cooldown = new_cooldown

@external
def set_owner(new_owner: address):
    """
    @notice Transfer factory ownership
    @param new_owner New owner address
    @dev Only current owner
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_owner != empty(address), "Invalid new owner"
    self.owner = new_owner

@external
def withdraw_fees():
    """
    @notice Withdraw accumulated creation fees
    @dev Only owner, sends entire balance
    """
    assert msg.sender == self.owner, "Only owner"
    
    balance: uint256 = self.balance
    assert balance > 0, "No fees to withdraw"
    
    send(self.owner, balance)

# ============================================================================
# STATISTICS
# ============================================================================

@view
@external
def get_stats() -> (uint256, uint256, uint256):
    """
    @notice Get factory statistics
    @return (total_badges, creation_fee, creation_cooldown)
    """
    return (self.total_badges, self.creation_fee, self.creation_cooldown)

