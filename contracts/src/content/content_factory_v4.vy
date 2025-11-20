# @version 0.4.3

"""
@title ContentFactoryV4 - Unified Text + Image Factory
@author L1Ca$h
@notice Factory for creating both text and compressed image content on-chain
@dev Uses two blueprints: TextContentV4 and ImageContentV3

CONTENT TYPES:
- 0: Text (UTF-8, up to 16KB)
- 1: Image (5 compression modes, up to 16KB)

IMAGE COMPRESSION MODES:
- 0: RGB (3 bytes/px)      - 73×73 max
- 1: Grayscale (1 byte/px) - 128×128 max  
- 2: Monochrome (1 bit/px) - 362×362 max
- 3: Indexed (palette)     - 124×124 max
- 5: RGB565 (2 bytes/px)   - 90×90 max

GAS OPTIMIZATION:
- Pure functions for cost calculation (0 gas via staticcall)
- Immutable blueprint pattern (cheap instance creation)
- Minimal storage overhead
"""

# ============================================================================
# INTERFACES
# ============================================================================

interface ITextContentV4:
    def get_metadata() -> (uint256, address, address, uint256): view

interface IImageContentV3:
    def get_metadata() -> (uint8, uint256, uint256, uint256, uint256, uint256, address, uint256): view

# Supported compression modes for images (mode field):
# MODE_RGB (0):        3 bytes/pixel - Full color, max 73×73 (15,987 bytes)
# MODE_GRAYSCALE (1):  1 byte/pixel  - 256 shades, max 128×128 (16,384 bytes)
# MODE_MONOCHROME (2): 1 bit/pixel   - Dithered B&W, max 362×362 (16,384 bytes)
# MODE_INDEXED (3):    1 byte/pixel  - 256-color palette, max 124×124 (15,376 bytes)
# MODE_RGB565 (5):     2 bytes/pixel - 65K colors, max 90×90 (16,384 bytes)

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
    mode: uint8
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
MAX_IMAGE_SIZE: constant(uint256) = 16384
MAX_DIMENSION: constant(uint256) = 512

# Content types
CONTENT_TEXT: constant(uint8) = 0
CONTENT_IMAGE: constant(uint8) = 1

# Image compression modes
MODE_RGB: constant(uint8) = 0
MODE_GRAYSCALE: constant(uint8) = 1
MODE_MONOCHROME: constant(uint8) = 2
MODE_INDEXED: constant(uint8) = 3
MODE_RGB565: constant(uint8) = 5

# ============================================================================
# STRUCTS
# ============================================================================

struct ContentEntry:
    content_address: address
    creator: address
    content_type: uint8      # 0=text, 1=image
    mode: uint8             # compression mode (image only, 0 for text)
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
# PURE HELPERS (0 gas via staticcall)
# ============================================================================

@pure
@external
def calculate_image_data_size(mode: uint8, width: uint256, height: uint256, palette_size: uint256) -> uint256:
    """
    @notice Calculate expected data size for image parameters (PURE)
    @param mode Compression mode
    @param width Image width
    @param height Image height  
    @param palette_size Palette size (only for indexed mode)
    @return Expected data size in bytes
    """
    pixels: uint256 = width * height
    
    if mode == MODE_RGB:
        return pixels * 3
    elif mode == MODE_GRAYSCALE:
        return pixels
    elif mode == MODE_MONOCHROME:
        return (pixels + 7) // 8
    elif mode == MODE_INDEXED:
        return (palette_size * 3) + pixels
    elif mode == MODE_RGB565:
        return pixels * 2
    else:
        return 0

@pure
@external
def calculate_max_dimensions(mode: uint8) -> (uint256, uint256, uint256):
    """
    @notice Calculate maximum dimensions for a mode (PURE)
    @param mode Compression mode
    @return (max_square, max_dimension, max_pixels)
    """
    if mode == MODE_RGB:
        return (73, 128, 5329)  # Updated to safe limit
    elif mode == MODE_GRAYSCALE:
        return (128, 128, 16384)
    elif mode == MODE_MONOCHROME:
        return (362, 512, 131072)
    elif mode == MODE_INDEXED:
        return (124, 128, 15376)
    elif mode == MODE_RGB565:
        return (90, 128, 8192)
    else:
        return (0, 0, 0)

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
        code_offset=4,
        salt=salt
    )
    
    # Create registry entry
    entry: ContentEntry = ContentEntry(
        content_address=content_addr,
        creator=msg.sender,
        content_type=CONTENT_TEXT,
        mode=0,  # Not applicable for text
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
    mode: uint8,
    width: uint256,
    height: uint256,
    palette_size: uint256,
    image_data: Bytes[16384]
) -> address:
    """
    @notice Create compressed image with specified mode
    @param mode Compression mode (0,1,2,3,5)
    @param width Image width in pixels
    @param height Image height in pixels
    @param palette_size Palette size (0 for non-indexed modes)
    @param image_data Compressed image data
    @return Address of created content contract
    """
    # Check fee
    assert msg.value >= self.creation_fee, "Insufficient fee"
    
    # Check cooldown
    if self.creation_cooldown > 0:
        assert block.timestamp >= self.last_creation[msg.sender] + self.creation_cooldown, "Cooldown active"
    
    # Validate mode
    assert mode <= MODE_RGB565 and mode != 4, "Invalid mode"
    
    # Validate dimensions
    assert width > 0 and width <= MAX_DIMENSION, "Invalid width"
    assert height > 0 and height <= MAX_DIMENSION, "Invalid height"
    
    pixels: uint256 = width * height
    
    # Validate data size
    assert len(image_data) > 0, "Empty data"
    assert len(image_data) <= MAX_IMAGE_SIZE, "Data too large"
    
    # Mode-specific validation
    expected_size: uint256 = 0
    
    if mode == MODE_RGB:
        expected_size = pixels * 3
        assert palette_size == 0, "RGB has no palette"
    elif mode == MODE_GRAYSCALE:
        expected_size = pixels
        assert palette_size == 0, "Grayscale has no palette"
    elif mode == MODE_MONOCHROME:
        expected_size = (pixels + 7) // 8
        assert palette_size == 0, "Monochrome has no palette"
    elif mode == MODE_INDEXED:
        assert palette_size > 0 and palette_size <= 256, "Invalid palette size"
        expected_size = (palette_size * 3) + pixels
    elif mode == MODE_RGB565:
        expected_size = pixels * 2
        assert palette_size == 0, "RGB565 has no palette"
    
    if expected_size > 0:
        assert len(image_data) == expected_size, "Data size mismatch"
    
    # Deploy using CREATE2 for deterministic address
    salt: bytes32 = keccak256(concat(
        convert(msg.sender, bytes32),
        convert(block.timestamp, bytes32),
        convert(len(self.contents), bytes32)
    ))
    
    content_addr: address = create_from_blueprint(
        image_blueprint,
        mode,
        width,
        height,
        palette_size,
        image_data,
        msg.sender,
        self,
        code_offset=4,
        salt=salt
    )
    
    # Create registry entry
    entry: ContentEntry = ContentEntry(
        content_address=content_addr,
        creator=msg.sender,
        content_type=CONTENT_IMAGE,
        mode=mode,
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
        mode=mode,
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

