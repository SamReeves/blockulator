# @version 0.4.3

"""
@title ContentFactoryV4 - Unified Text + Image Factory
@author Sam Reeves
@notice Factory for creating both text and RGB image content on-chain
@dev Uses two blueprints: TextContentV4 and ImageContentV3

CONTENT TYPES:
- 0: Text (UTF-8, up to 16KB)
- 1: Image (RGB only, up to 73×73)

IMAGE STORAGE:
- RGB only: 3 bytes/pixel
- Max: 73×73 = 15,987 bytes
- Simple, like badges: raw RGB pixel data

GAS OPTIMIZATION:
- Immutable blueprint pattern (cheap instance creation)
- Minimal storage overhead
- Simple validation
"""

# ============================================================================
# INTERFACES
# ============================================================================

interface ITextContentV4:
    def get_metadata() -> (uint256, address, address, uint256): view

interface IImageContentV3:
    def get_metadata() -> (uint256, uint256, uint256, uint256, address, uint256): view

# ============================================================================
# EVENTS
# ============================================================================

event TextCreated:
    creator: indexed(address)
    content_address: indexed(address)
    data_size: uint256
    index: uint256
    timestamp: uint256

event ImageCreated:
    creator: indexed(address)
    content_address: indexed(address)
    width: uint256
    height: uint256
    data_size: uint256
    pixel_count: uint256
    index: uint256
    timestamp: uint256

event FactoryInitialized:
    owner: indexed(address)
    text_blueprint: address
    image_blueprint: address
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_CONTENTS: constant(uint256) = 10000
MAX_TEXT_SIZE: constant(uint256) = 16384
MAX_IMAGE_SIZE: constant(uint256) = 15987  # 73×73×3
MAX_DIMENSION: constant(uint256) = 73

# Content types
CONTENT_TEXT: constant(uint8) = 0
CONTENT_IMAGE: constant(uint8) = 1

# ============================================================================
# STRUCTS
# ============================================================================

struct ContentEntry:
    content_address: address
    creator: address
    content_type: uint8      # 0=text, 1=image
    width: uint256          # image dimensions (0 for text)
    height: uint256
    data_size: uint256
    pixel_count: uint256    # pixels (image) or 0 (text)
    creation_time: uint256

# ============================================================================
# STATE
# ============================================================================

owner: public(address)
text_blueprint: public(immutable(address))
image_blueprint: public(immutable(address))

creation_fee: public(uint256)
creation_cooldown: public(uint256)

contents: public(DynArray[ContentEntry, MAX_CONTENTS])
content_index: HashMap[address, uint256]
creator_contents: HashMap[address, DynArray[address, 1000]]
last_creation: HashMap[address, uint256]

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(_text_blueprint: address, _image_blueprint: address, _creation_fee: uint256, _creation_cooldown: uint256):
    """
    @notice Initialize factory with both blueprints
    @param _text_blueprint Address of TextContentV4 blueprint
    @param _image_blueprint Address of ImageContentV3 blueprint
    @param _creation_fee Fee in wei (0 for free)
    @param _creation_cooldown Cooldown between creations (0 for none)
    """
    assert _text_blueprint != empty(address), "Invalid text blueprint"
    assert _image_blueprint != empty(address), "Invalid image blueprint"
    
    self.owner = msg.sender
    text_blueprint = _text_blueprint
    image_blueprint = _image_blueprint
    self.creation_fee = _creation_fee
    self.creation_cooldown = _creation_cooldown
    
    log FactoryInitialized(owner=msg.sender, text_blueprint=_text_blueprint, image_blueprint=_image_blueprint, timestamp=block.timestamp)

# ============================================================================
# CREATION FUNCTIONS
# ============================================================================

@external
@payable
def create_text(text_data: Bytes[16384]) -> address:
    """
    @notice Create text content
    @param text_data UTF-8 encoded text (1-16384 bytes)
    @return Address of created content contract
    """
    # Check fee
    assert msg.value >= self.creation_fee, "Insufficient fee"
    
    # Check cooldown
    if self.creation_cooldown > 0:
        assert block.timestamp >= self.last_creation[msg.sender] + self.creation_cooldown, "Cooldown active"
    
    # Validate data
    assert len(text_data) > 0, "Empty text"
    assert len(text_data) <= MAX_TEXT_SIZE, "Text too large"
    
    # Deploy using CREATE2 for deterministic address
    salt: bytes32 = keccak256(concat(
        convert(msg.sender, bytes32),
        convert(block.timestamp, bytes32),
        convert(len(self.contents), bytes32)
    ))
    
    content_addr: address = create_from_blueprint(
        text_blueprint,
        text_data,
        msg.sender,
        self,
        code_offset=3,
        salt=salt
    )
    
    # Create registry entry
    entry: ContentEntry = ContentEntry(
        content_address=content_addr,
        creator=msg.sender,
        content_type=CONTENT_TEXT,
        width=0,
        height=0,
        data_size=len(text_data),
        pixel_count=0,
        creation_time=block.timestamp
    )
    
    # Update registry
    self.contents.append(entry)
    self.content_index[content_addr] = len(self.contents) - 1
    self.creator_contents[msg.sender].append(content_addr)
    self.last_creation[msg.sender] = block.timestamp
    
    log TextCreated(
        creator=msg.sender,
        content_address=content_addr,
        data_size=len(text_data),
        index=len(self.contents) - 1,
        timestamp=block.timestamp
    )
    
    return content_addr

@external
@payable
def create_image(
    width: uint256,
    height: uint256,
    image_data: Bytes[15987]
) -> address:
    """
    @notice Create RGB image content
    @param width Image width in pixels
    @param height Image height in pixels
    @param image_data Raw RGB pixel data (width × height × 3 bytes)
    @return Address of created content contract
    """
    # Check fee
    assert msg.value >= self.creation_fee, "Insufficient fee"
    
    # Check cooldown
    if self.creation_cooldown > 0:
        assert block.timestamp >= self.last_creation[msg.sender] + self.creation_cooldown, "Cooldown active"
    
    # Validate dimensions
    assert width > 0 and width <= MAX_DIMENSION, "Invalid width"
    assert height > 0 and height <= MAX_DIMENSION, "Invalid height"
    
    pixels: uint256 = width * height
    expected_size: uint256 = pixels * 3  # RGB = 3 bytes per pixel
    
    # Validate data size
    assert len(image_data) > 0, "Empty data"
    assert len(image_data) == expected_size, "Data size mismatch"
    assert len(image_data) <= MAX_IMAGE_SIZE, "Data too large"
    
    # Deploy using CREATE2 for deterministic address
    salt: bytes32 = keccak256(concat(
        convert(msg.sender, bytes32),
        convert(block.timestamp, bytes32),
        convert(len(self.contents), bytes32)
    ))
    
    content_addr: address = create_from_blueprint(
        image_blueprint,
        width,
        height,
        image_data,
        msg.sender,
        self,
        code_offset=3,
        salt=salt
    )
    
    # Create registry entry
    entry: ContentEntry = ContentEntry(
        content_address=content_addr,
        creator=msg.sender,
        content_type=CONTENT_IMAGE,
        width=width,
        height=height,
        data_size=len(image_data),
        pixel_count=pixels,
        creation_time=block.timestamp
    )
    
    # Update registry
    self.contents.append(entry)
    self.content_index[content_addr] = len(self.contents) - 1
    self.creator_contents[msg.sender].append(content_addr)
    self.last_creation[msg.sender] = block.timestamp
    
    log ImageCreated(
        creator=msg.sender,
        content_address=content_addr,
        width=width,
        height=height,
        data_size=len(image_data),
        pixel_count=pixels,
        index=len(self.contents) - 1,
        timestamp=block.timestamp
    )
    
    return content_addr

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_content_count() -> uint256:
    """@notice Get total number of contents"""
    return len(self.contents)

@view
@external
def get_content_by_index(index: uint256) -> ContentEntry:
    """@notice Get content by registry index"""
    assert index < len(self.contents), "Invalid index"
    return self.contents[index]

@view
@external
def get_content_by_address(addr: address) -> ContentEntry:
    """@notice Get content by contract address"""
    index: uint256 = self.content_index[addr]
    return self.contents[index]

@view
@external
def get_creator_content_count(creator: address) -> uint256:
    """@notice Get number of contents created by address"""
    return len(self.creator_contents[creator])

@view
@external
def get_creator_contents(creator: address) -> DynArray[address, 1000]:
    """@notice Get all content addresses for creator"""
    return self.creator_contents[creator]

# ============================================================================
# ADMIN FUNCTIONS
# ============================================================================

@external
def set_creation_fee(new_fee: uint256):
    """@notice Update creation fee (owner only)"""
    assert msg.sender == self.owner, "Not owner"
    self.creation_fee = new_fee

@external
def set_creation_cooldown(new_cooldown: uint256):
    """@notice Update creation cooldown (owner only)"""
    assert msg.sender == self.owner, "Not owner"
    self.creation_cooldown = new_cooldown

@external
def withdraw_fees():
    """@notice Withdraw collected fees (owner only)"""
    assert msg.sender == self.owner, "Not owner"
    send(self.owner, self.balance)

@external
def transfer_ownership(new_owner: address):
    """@notice Transfer ownership (owner only)"""
    assert msg.sender == self.owner, "Not owner"
    assert new_owner != empty(address), "Invalid address"
    self.owner = new_owner
