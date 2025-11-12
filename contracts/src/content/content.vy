# @version 0.4.3

"""
@title Content - Immutable On-Chain Image or Text Storage
@author L1Ca$h
@notice Stores either an image (up to 16KB RGB) or text (up to 16KB) on-chain
@dev Deployed from content_factory.vy using blueprint pattern

DESIGN PRINCIPLES:
- IMMUTABLE content and ownership (permanent storage)
- EFFICIENT storage (16KB max for both images and text)
- CODIFIED data (minimal contract, maximal content)
- TYPE-SAFE (enforced at creation via factory)

STORAGE LIMITS:
- Images: Up to 16KB RGB (5,461 pixels max - various dimensions supported)
  * Square: 73×73 = 5,329 pixels = 15,987 bytes
  * Wide: 128×42 = 5,376 pixels = 16,128 bytes
  * Tall: 42×128 = 5,376 pixels = 16,128 bytes
  * Custom: Any width×height where width×height×3 ≤ 16,384 and dimensions ≤ 128
- Text: 16,384 bytes (16KB UTF-8 text)
- Total per contract: Single content piece only

ECONOMICS:
- Creation cost: ~250K-500K gas depending on size
- No ongoing costs (immutable storage)
- Gas scales linearly with content size (~70 gas/byte)
"""

# ============================================================================
# EVENTS
# ============================================================================

event ContentCreated:
    creator: indexed(address)
    content_type: uint8
    size: uint256
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_IMAGE_SIZE: constant(uint256) = 16384   # 16KB RGB (5,461 pixels max)
MAX_TEXT_SIZE: constant(uint256) = 16384    # 16KB UTF-8
MAX_IMAGE_DIMENSION: constant(uint256) = 128  # Max width or height

# ============================================================================
# STATE VARIABLES
# ============================================================================

# Immutable ownership and metadata
creator: public(immutable(address))
factory: public(immutable(address))
content_type: public(uint8)        # 0=image, 1=text
creation_time: public(uint256)
actual_size: public(uint256)

# Image-specific metadata (only used if content_type == 0)
image_width: public(uint256)
image_height: public(uint256)

# Unified content storage (interpretation depends on content_type)
# For images: RGB pixel data in row-major order
# For text: UTF-8 encoded string
content_data: public(Bytes[16384])

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(
    _content_type: uint8,
    _content_data: Bytes[16384],
    _width: uint256,           # Only for images (0 for text)
    _height: uint256,          # Only for images (0 for text)
    _creator: address,
    _factory: address
):
    """
    @notice Deploy immutable content (image or text)
    @param _content_type 0=image, 1=text
    @param _content_data Raw bytes (RGB for image, UTF-8 for text)
    @param _width Image width in pixels (0 for text)
    @param _height Image height in pixels (0 for text)
    @param _creator The address that created this content
    @param _factory The factory contract address
    @dev Only callable via factory's create_from_blueprint
    """
    assert _content_type <= 1, "Invalid content type (must be 0 or 1)"
    assert len(_content_data) > 0, "Empty content"
    assert _creator != empty(address), "Creator cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"
    
    # Set immutables
    creator = _creator
    factory = _factory
    
    # Set content type and data
    self.content_type = _content_type
    self.content_data = _content_data
    self.actual_size = len(_content_data)
    self.creation_time = block.timestamp
    
    # Type-specific validation
    if _content_type == 0:  # Image
        assert _width > 0 and _height > 0, "Invalid image dimensions"
        assert _width <= MAX_IMAGE_DIMENSION and _height <= MAX_IMAGE_DIMENSION, "Dimensions too large"
        assert _width * _height * 3 == len(_content_data), "Image size mismatch"
        assert len(_content_data) <= MAX_IMAGE_SIZE, "Image too large"
        
        self.image_width = _width
        self.image_height = _height
    else:  # Text
        assert len(_content_data) <= MAX_TEXT_SIZE, "Text too large"
        assert _width == 0 and _height == 0, "Text must not have dimensions"
        
        self.image_width = 0
        self.image_height = 0
    
    log ContentCreated(
        creator=_creator,
        content_type=_content_type,
        size=len(_content_data),
        timestamp=block.timestamp
    )

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_content() -> Bytes[16384]:
    """
    @notice Get the full content (image or text)
    @return Raw content bytes
    """
    return self.content_data

@view
@external
def get_pixel(x: uint256, y: uint256) -> (uint8, uint8, uint8):
    """
    @notice Get RGB values for a single pixel (images only)
    @param x X coordinate (0 to width-1)
    @param y Y coordinate (0 to height-1)
    @return (red, green, blue) values as uint8
    """
    assert self.content_type == 0, "Not an image"
    assert x < self.image_width, "x out of bounds"
    assert y < self.image_height, "y out of bounds"
    
    # Calculate offset in row-major order
    offset: uint256 = (y * self.image_width + x) * 3
    
    r: uint8 = convert(slice(self.content_data, offset, 1), uint8)
    g: uint8 = convert(slice(self.content_data, offset + 1, 1), uint8)
    b: uint8 = convert(slice(self.content_data, offset + 2, 1), uint8)
    
    return (r, g, b)

@view
@external
def get_metadata() -> (address, uint8, uint256, uint256, uint256, uint256):
    """
    @notice Get content metadata
    @return (creator, content_type, creation_time, actual_size, width, height)
    """
    return (
        creator,
        self.content_type,
        self.creation_time,
        self.actual_size,
        self.image_width,
        self.image_height
    )

@view
@external
def get_content_hash() -> bytes32:
    """
    @notice Get hash of content data (for verification)
    @return keccak256 hash of content_data
    """
    return keccak256(self.content_data)

@view
@external
def is_image() -> bool:
    """
    @notice Check if this is an image
    @return True if image, False if text
    """
    return self.content_type == 0

@view
@external
def is_text() -> bool:
    """
    @notice Check if this is text
    @return True if text, False if image
    """
    return self.content_type == 1

@view
@external
def age() -> uint256:
    """
    @notice Get content age in seconds
    @return Seconds since creation
    """
    return block.timestamp - self.creation_time


