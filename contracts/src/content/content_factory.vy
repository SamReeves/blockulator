# @version 0.4.3

"""
@title Content Factory - Uploads Registry
@author L1Ca$h
@notice Factory for creating immutable on-chain content (images and text)
@dev Uses blueprint pattern for gas-efficient deployment

ARCHITECTURE:
- Blueprint-based factory for creating content contracts
- HashMap registry for O(1) content lookup
- DynArray tracking for browsing (Top 1000 pattern)
- No marketplace (pure content codification)
- Anti-spam cooldowns and fees

CONTENT TYPES:
- Type 0: Image (up to 64×64 RGB = 12,288 bytes)
- Type 1: Text (up to 16KB UTF-8 = 16,384 bytes)

ECONOMICS:
- Optional creation fee (configurable by owner)
- Cooldown period between uploads (anti-spam)
- Users pay their own gas (~$10-30 per upload)
"""

# ============================================================================
# EVENTS
# ============================================================================

event ContentCreated:
    content_address: indexed(address)
    creator: indexed(address)
    content_type: uint8
    size: uint256
    timestamp: uint256
    slot_index: uint256

event BlueprintUpdated:
    old_blueprint: indexed(address)
    new_blueprint: indexed(address)
    timestamp: uint256

event ContentReplaced:
    old_content: indexed(address)
    new_content: indexed(address)
    slot_index: uint256

# ============================================================================
# STRUCTS
# ============================================================================

struct ContentEntry:
    content_address: address
    creator: address
    content_type: uint8         # 0=image, 1=text
    creation_time: uint256
    size: uint256
    data_hash: bytes32

# ============================================================================
# INTERFACE
# ============================================================================

interface IContent:
    def creator() -> address: view
    def content_type() -> uint8: view
    def actual_size() -> uint256: view
    def get_content_hash() -> bytes32: view
    def get_metadata() -> (address, uint8, uint256, uint256, uint256, uint256): view

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_CONTENTS: constant(uint256) = 1000         # Top 1000 content registry
MAX_IMAGE_SIZE: constant(uint256) = 12288      # 64×64×3 RGB
MAX_TEXT_SIZE: constant(uint256) = 16384       # 16KB UTF-8
MAX_IMAGE_DIMENSION: constant(uint256) = 64
DEFAULT_CREATION_FEE: constant(uint256) = 0    # Free by default
DEFAULT_COOLDOWN: constant(uint256) = 300      # 5 minutes

# ============================================================================
# STATE VARIABLES
# ============================================================================

# Blueprint for deploying content contracts
content_blueprint: public(address)

# Content registry (Top 1000 pattern like board.vy/future_factory.vy)
contents: public(DynArray[ContentEntry, MAX_CONTENTS])
content_index: public(HashMap[address, uint256])  # address -> array index
is_content: public(HashMap[address, bool])        # quick membership check

# Creator tracking
creator_contents: public(HashMap[address, DynArray[address, 50]])  # Max 50 per creator
creator_count: public(HashMap[address, uint256])

# Anti-spam
creation_fee: public(uint256)
creation_cooldown: public(uint256)
last_creation_time: public(HashMap[address, uint256])

# Statistics
total_created: public(uint256)
total_images: public(uint256)
total_texts: public(uint256)

# Governance
owner: public(address)

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(_content_blueprint: address, _owner: address, _creation_fee: uint256, _creation_cooldown: uint256):
    """
    @notice Initialize content factory
    @param _content_blueprint Address of content contract blueprint
    @param _owner Factory owner (can update blueprint, adjust fees)
    @param _creation_fee Minimum ETH required to create content (0 = free)
    @param _creation_cooldown Seconds between creations per address (0 = no limit)
    """
    assert _content_blueprint != empty(address), "Invalid blueprint address"
    assert _owner != empty(address), "Invalid owner address"
    
    self.content_blueprint = _content_blueprint
    self.owner = _owner
    self.creation_fee = _creation_fee
    self.creation_cooldown = _creation_cooldown
    self.total_created = 0
    self.total_images = 0
    self.total_texts = 0

# ============================================================================
# FACTORY FUNCTIONS
# ============================================================================

@external
@payable
def create_image(width: uint256, height: uint256, pixel_data: Bytes[12288]) -> address:
    """
    @notice Create an immutable image (up to 64×64 RGB)
    @param width Image width in pixels (1-64)
    @param height Image height in pixels (1-64)
    @param pixel_data RGB pixel data in row-major order
    @return Address of deployed content contract
    """
    # Validation
    assert msg.value >= self.creation_fee, "Insufficient creation fee"
    assert width > 0 and height > 0, "Invalid dimensions"
    assert width <= MAX_IMAGE_DIMENSION and height <= MAX_IMAGE_DIMENSION, "Dimensions too large"
    assert len(pixel_data) == width * height * 3, "Image size mismatch"
    assert len(pixel_data) <= MAX_IMAGE_SIZE, "Image too large"
    
    # Anti-spam cooldown
    if self.creation_cooldown > 0:
        last_created: uint256 = self.last_creation_time[msg.sender]
        if last_created > 0:
            assert block.timestamp >= last_created + self.creation_cooldown, "Cooldown active"
    
    # Deploy from blueprint
    new_content: address = create_from_blueprint(
        self.content_blueprint,
        convert(0, uint8),  # content_type: image
        pixel_data,     # content_data
        width,          # width
        height,         # height
        msg.sender,     # creator
        self,           # factory
        code_offset=3
    )
    
    # Register content
    self._register_content(new_content, msg.sender, 0, len(pixel_data))
    
    # Update statistics
    self.total_images += 1
    self.last_creation_time[msg.sender] = block.timestamp
    
    return new_content

@external
@payable
def create_text(text_data: Bytes[16384]) -> address:
    """
    @notice Create immutable text (up to 16KB UTF-8)
    @param text_data UTF-8 encoded text data
    @return Address of deployed content contract
    """
    # Validation
    assert msg.value >= self.creation_fee, "Insufficient creation fee"
    assert len(text_data) > 0, "Empty text"
    assert len(text_data) <= MAX_TEXT_SIZE, "Text too large"
    
    # Anti-spam cooldown
    if self.creation_cooldown > 0:
        last_created: uint256 = self.last_creation_time[msg.sender]
        if last_created > 0:
            assert block.timestamp >= last_created + self.creation_cooldown, "Cooldown active"
    
    # Pad text_data to fit image data parameter (empty bytes for unused space)
    padded_data: Bytes[16384] = text_data
    
    # Deploy from blueprint
    new_content: address = create_from_blueprint(
        self.content_blueprint,
        convert(1, uint8),  # content_type: text
        padded_data,    # content_data
        convert(0, uint256),  # width (not used for text)
        convert(0, uint256),  # height (not used for text)
        msg.sender,     # creator
        self,           # factory
        code_offset=3
    )
    
    # Register content
    self._register_content(new_content, msg.sender, 1, len(text_data))
    
    # Update statistics
    self.total_texts += 1
    self.last_creation_time[msg.sender] = block.timestamp
    
    return new_content

# ============================================================================
# INTERNAL FUNCTIONS
# ============================================================================

@internal
def _register_content(content_addr: address, creator_addr: address, content_type: uint8, size: uint256):
    """
    @notice Register content in factory registry (Top 1000 pattern)
    @param content_addr The deployed content contract address
    @param creator_addr The creator's address
    @param content_type 0=image, 1=text
    @param size Size in bytes
    """
    # Get content hash for verification
    data_hash: bytes32 = staticcall IContent(content_addr).get_content_hash()
    
    # Create entry
    entry: ContentEntry = ContentEntry(
        content_address=content_addr,
        creator=creator_addr,
        content_type=content_type,
        creation_time=block.timestamp,
        size=size,
        data_hash=data_hash
    )
    
    # Register in main array (Top 1000 pattern - oldest gets replaced when full)
    slot_index: uint256 = 0
    if len(self.contents) < MAX_CONTENTS:
        # Array not full - append
        self.contents.append(entry)
        slot_index = len(self.contents) - 1
    else:
        # Array full - replace oldest
        slot_index = 0
        old_content: address = self.contents[0].content_address
        
        # Remove old content from registry
        self.is_content[old_content] = False
        self.content_index[old_content] = 0
        
        # Shift array left (remove first element)
        for i: uint256 in range(MAX_CONTENTS - 1):
            if i < MAX_CONTENTS - 1:
                self.contents[i] = self.contents[i + 1]
                self.content_index[self.contents[i].content_address] = i
        
        # Add new entry at end
        self.contents[MAX_CONTENTS - 1] = entry
        slot_index = MAX_CONTENTS - 1
        
        log ContentReplaced(
            old_content=old_content,
            new_content=content_addr,
            slot_index=slot_index
        )
    
    # Update maps
    self.content_index[content_addr] = slot_index
    self.is_content[content_addr] = True
    
    # Track per-creator (max 50)
    if self.creator_count[creator_addr] < 50:
        self.creator_contents[creator_addr].append(content_addr)
        self.creator_count[creator_addr] += 1
    
    # Update total
    self.total_created += 1
    
    log ContentCreated(
        content_address=content_addr,
        creator=creator_addr,
        content_type=content_type,
        size=size,
        timestamp=block.timestamp,
        slot_index=slot_index
    )

# ============================================================================
# VIEW FUNCTIONS - REGISTRY LOOKUPS
# ============================================================================

@view
@external
def get_content_by_index(index: uint256) -> ContentEntry:
    """
    @notice Get content entry by array index
    @param index Index in contents array (0 to total-1)
    @return ContentEntry struct
    """
    assert index < len(self.contents), "Index out of bounds"
    return self.contents[index]

@view
@external
def get_content_count() -> uint256:
    """
    @notice Get total number of content entries in registry
    @return Number of registered contents (max 1000)
    """
    return len(self.contents)

@view
@external
def get_creator_contents(creator_addr: address) -> DynArray[address, 50]:
    """
    @notice Get all content addresses created by an address
    @param creator_addr The creator's address
    @return Array of content contract addresses (max 50)
    """
    return self.creator_contents[creator_addr]

@view
@external
def can_create(creator_addr: address) -> (bool, String[100]):
    """
    @notice Check if an address can create content (with reason if not)
    @param creator_addr The address to check
    @return (can_create, reason)
    """
    # Check cooldown
    if self.creation_cooldown > 0:
        last_created: uint256 = self.last_creation_time[creator_addr]
        if last_created > 0:
            next_allowed: uint256 = last_created + self.creation_cooldown
            if block.timestamp < next_allowed:
                return (False, "Creation cooldown active")
    
    return (True, "Can create content")

# ============================================================================
# GOVERNANCE FUNCTIONS
# ============================================================================

@external
def set_blueprint(new_blueprint: address):
    """
    @notice Update content blueprint (for future deployments)
    @param new_blueprint New blueprint address
    @dev Only owner, does NOT affect existing content
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_blueprint != empty(address), "Invalid blueprint"
    
    old_blueprint: address = self.content_blueprint
    self.content_blueprint = new_blueprint
    
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
    @notice Update creation cooldown
    @param new_cooldown New cooldown in seconds (0 = no cooldown)
    @dev Only owner
    """
    assert msg.sender == self.owner, "Only owner"
    self.creation_cooldown = new_cooldown

@external
def set_owner(new_owner: address):
    """
    @notice Transfer ownership
    @param new_owner New owner address
    @dev Only current owner
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_owner != empty(address), "Invalid owner"
    self.owner = new_owner
