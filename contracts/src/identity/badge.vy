# @version 0.4.3

"""
@title Badge - Wallet Identity Pixel Art
@author L1Ca$h
@notice One badge per wallet - immutable ownership, editable pixel art
@dev 32x32 RGB pixel matrix (3,072 bytes) representing wallet identity

DESIGN PRINCIPLES:
- ONE badge per wallet (enforced by factory)
- IMMUTABLE ownership (badges are identity, not assets)
- EDITABLE by owner (update pixel art anytime)
- AUTHENTIC via factory registry (trustless verification)

STORAGE:
- 32x32 pixels = 1,024 pixels
- RGB = 3 bytes per pixel
- Total = 3,072 bytes on-chain
- Cost: ~60K gas to deploy (~$5-10 depending on network)

AUTHENTICITY:
- Factory tracks wallet -> badge mapping
- Badge stores immutable owner address
- Verification: factory.wallet_badge[owner] == self
"""

# ============================================================================
# EVENTS
# ============================================================================

event BadgeCreated:
    owner: indexed(address)
    factory: indexed(address)
    timestamp: uint256

event BadgeEdited:
    editor: indexed(address)
    timestamp: uint256
    edit_count: uint256

event PixelDataUpdated:
    old_hash: indexed(bytes32)
    new_hash: indexed(bytes32)
    editor: address

# ============================================================================
# STATE VARIABLES
# ============================================================================

# Immutable identity binding
factory: public(immutable(address))
owner: public(immutable(address))

# Temporal tracking
creation_time: public(uint256)
last_edit_time: public(uint256)
edit_count: public(uint256)

# Pixel data: 32x32 RGB (3,072 bytes)
# Format: Row-major order, 3 bytes per pixel [R, G, B]
# Pixel (x, y) is at offset: (y * 32 + x) * 3
pixel_data: public(Bytes[3072])

# ============================================================================
# CONSTANTS
# ============================================================================

PIXEL_DATA_SIZE: constant(uint256) = 3072  # 32 * 32 * 3
GRID_SIZE: constant(uint256) = 32

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(_pixel_data: Bytes[3072], _owner: address, _factory: address):
    """
    @notice Deploy a badge bound to a wallet forever
    @param _pixel_data 3,072 bytes (32x32 RGB)
    @param _owner The wallet this badge represents (immutable)
    @param _factory The factory that deployed this badge
    @dev Only callable via factory's create_from_blueprint
    """
    assert len(_pixel_data) == PIXEL_DATA_SIZE, "Invalid pixel data size"
    assert _owner != empty(address), "Owner cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"
    
    # Set immutable values
    factory = _factory
    owner = _owner
    
    # Initialize state
    self.pixel_data = _pixel_data
    self.creation_time = block.timestamp
    self.last_edit_time = block.timestamp
    self.edit_count = 0
    
    log BadgeCreated(owner=_owner, factory=_factory, timestamp=block.timestamp)

# ============================================================================
# CORE FUNCTIONS
# ============================================================================

@external
def edit(new_pixel_data: Bytes[3072]):
    """
    @notice Edit your badge's pixel art
    @param new_pixel_data New 3,072 bytes (32x32 RGB)
    @dev Only the immutable owner can call this
    """
    assert msg.sender == owner, "Only owner can edit their badge"
    assert len(new_pixel_data) == PIXEL_DATA_SIZE, "Invalid pixel data size"
    
    # Compute hashes for event logging
    old_hash: bytes32 = keccak256(self.pixel_data)
    new_hash: bytes32 = keccak256(new_pixel_data)
    
    # Update pixel data
    self.pixel_data = new_pixel_data
    self.last_edit_time = block.timestamp
    self.edit_count += 1
    
    log BadgeEdited(editor=msg.sender, timestamp=block.timestamp, edit_count=self.edit_count)
    log PixelDataUpdated(old_hash=old_hash, new_hash=new_hash, editor=msg.sender)


# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def is_authentic(wallet: address) -> bool:
    """
    @notice Verify this badge authentically represents the given wallet
    @param wallet The wallet address to verify
    @return True if this badge belongs to the wallet
    @dev Simple ownership check - wallet owns badge if wallet == owner
    """
    return owner == wallet

@view
@external
def get_pixel(x: uint256, y: uint256) -> (uint8, uint8, uint8):
    """
    @notice Get RGB values for a single pixel
    @param x X coordinate (0-31)
    @param y Y coordinate (0-31)
    @return (red, green, blue) values as uint8
    """
    assert x < GRID_SIZE, "x out of bounds"
    assert y < GRID_SIZE, "y out of bounds"
    
    offset: uint256 = (y * GRID_SIZE + x) * 3
    
    r: uint8 = convert(slice(self.pixel_data, offset, 1), uint8)
    g: uint8 = convert(slice(self.pixel_data, offset + 1, 1), uint8)
    b: uint8 = convert(slice(self.pixel_data, offset + 2, 1), uint8)
    
    return (r, g, b)


@view
@external
def get_metadata() -> (address, address, uint256, uint256, uint256):
    """
    @notice Get badge metadata
    @return (owner, factory, creation_time, last_edit_time, edit_count)
    """
    return (owner, factory, self.creation_time, self.last_edit_time, self.edit_count)

@view
@external
def get_pixel_data_hash() -> bytes32:
    """
    @notice Get hash of current pixel data (for verification/comparison)
    @return keccak256 hash of pixel_data
    """
    return keccak256(self.pixel_data)

@view
@external
def age() -> uint256:
    """
    @notice Get badge age in seconds
    @return Seconds since creation
    """
    return block.timestamp - self.creation_time

@view
@external
def time_since_edit() -> uint256:
    """
    @notice Get time since last edit in seconds
    @return Seconds since last edit
    """
    return block.timestamp - self.last_edit_time


