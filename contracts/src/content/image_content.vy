# @version 0.4.3

"""
@title ImageContent - Immutable On-Chain Image Storage
@author L1Ca$h
@notice Stores a single immutable RGB image on-chain (up to 16KB)
@dev Deployed from content_factory.vy using blueprint pattern

DESIGN PRINCIPLES:
- SINGLE RESPONSIBILITY: Images only (no text logic)
- IMMUTABLE: All data permanent after deployment
- TYPE SAFE: No conditional branches or runtime type checking
- EFFICIENT: Minimal storage overhead, maximal pixel density

STORAGE LIMITS:
- Maximum: 16,384 bytes RGB = 5,461 pixels
- Dimensions: 1-128 for both width and height
- Format: RGB bytes in row-major order (no alpha channel)

SUPPORTED CONFIGURATIONS:
- Square: 73×73 (15,987 bytes), 64×64 (12,288 bytes)
- Wide: 128×42 (16,128 bytes), 96×56 (16,128 bytes)
- Tall: 42×128 (16,128 bytes), 56×96 (16,128 bytes)
- Custom: Any width×height where width×height×3 ≤ 16,384

ECONOMICS:
- Creation cost: ~250K-500K gas (scales linearly with pixel count)
- Storage cost: ~70 gas/byte on-chain
- No ongoing costs (immutable storage)
"""

# ============================================================================
# EVENTS
# ============================================================================

event ImageCreated:
    creator: indexed(address)
    width: uint256
    height: uint256
    size: uint256
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_IMAGE_SIZE: constant(uint256) = 16384      # 16KB RGB
MAX_DIMENSION: constant(uint256) = 128         # Max width or height
MIN_DIMENSION: constant(uint256) = 1           # Min width or height
BYTES_PER_PIXEL: constant(uint256) = 3         # RGB (no alpha)

# ============================================================================
# IMMUTABLE STATE
# ============================================================================

creator: public(immutable(address))
factory: public(immutable(address))
width: public(immutable(uint256))
height: public(immutable(uint256))
creation_time: public(immutable(uint256))
data_size: public(immutable(uint256))

# ============================================================================
# STORAGE
# ============================================================================

# RGB pixel data in row-major order
pixel_data: public(Bytes[16384])

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(
    _width: uint256,
    _height: uint256,
    _pixel_data: Bytes[16384],
    _creator: address,
    _factory: address
):
    """
    @notice Deploy immutable image content
    @param _width Image width in pixels (1-128)
    @param _height Image height in pixels (1-128)
    @param _pixel_data RGB pixel data in row-major order
    @param _creator The address that created this image
    @param _factory The factory contract address
    """
    # Validate creator and factory
    assert _creator != empty(address), "Creator cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"
    
    # Validate dimensions
    assert _width >= MIN_DIMENSION, "Width too small"
    assert _height >= MIN_DIMENSION, "Height too small"
    assert _width <= MAX_DIMENSION, "Width too large"
    assert _height <= MAX_DIMENSION, "Height too large"
    
    # Validate data size
    expected_size: uint256 = _width * _height * BYTES_PER_PIXEL
    assert len(_pixel_data) == expected_size, "Data size mismatch"
    assert len(_pixel_data) <= MAX_IMAGE_SIZE, "Image too large"
    assert len(_pixel_data) > 0, "Empty image data"
    
    # Set immutables
    creator = _creator
    factory = _factory
    width = _width
    height = _height
    creation_time = block.timestamp
    data_size = len(_pixel_data)
    
    # Store pixel data
    self.pixel_data = _pixel_data
    
    log ImageCreated(
        creator=_creator,
        width=_width,
        height=_height,
        size=len(_pixel_data),
        timestamp=block.timestamp
    )

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_pixel_data() -> Bytes[16384]:
    """
    @notice Get the complete RGB pixel data
    @return Raw pixel bytes in row-major order
    """
    return self.pixel_data

@view
@external
def get_pixel(x: uint256, y: uint256) -> (uint8, uint8, uint8):
    """
    @notice Get RGB values for a single pixel
    @param x X coordinate (0 to width-1)
    @param y Y coordinate (0 to height-1)
    @return (red, green, blue) values as uint8
    """
    assert x < width, "x out of bounds"
    assert y < height, "y out of bounds"
    
    offset: uint256 = (y * width + x) * BYTES_PER_PIXEL
    
    r: uint8 = convert(slice(self.pixel_data, offset, 1), uint8)
    g: uint8 = convert(slice(self.pixel_data, offset + 1, 1), uint8)
    b: uint8 = convert(slice(self.pixel_data, offset + 2, 1), uint8)
    
    return (r, g, b)

@view
@external
def get_row(y: uint256) -> Bytes[16384]:
    """
    @notice Get all pixels in a row (up to 128 pixels = 384 bytes actual)
    @param y Row index (0 to height-1)
    @return RGB bytes for entire row (Bytes[16384] to match slice type)
    """
    assert y < height, "y out of bounds"
    
    offset: uint256 = y * width * BYTES_PER_PIXEL
    row_size: uint256 = width * BYTES_PER_PIXEL
    
    return slice(self.pixel_data, offset, row_size)

@view
@external
def get_dimensions() -> (uint256, uint256):
    """
    @notice Get image dimensions
    @return (width, height) in pixels
    """
    return (width, height)

@view
@external
def get_pixel_count() -> uint256:
    """
    @notice Get total number of pixels
    @return width × height
    """
    return width * height

@view
@external
def get_metadata() -> (address, uint256, uint256, uint256, uint256, uint256):
    """
    @notice Get complete image metadata
    @return (creator, creation_time, width, height, data_size, pixel_count)
    """
    return (
        creator,
        creation_time,
        width,
        height,
        data_size,
        width * height
    )

@view
@external
def get_data_hash() -> bytes32:
    """
    @notice Get hash of pixel data
    @return keccak256 hash of pixel_data
    """
    return keccak256(self.pixel_data)

@view
@external
def age() -> uint256:
    """
    @notice Get image age in seconds
    @return Seconds since creation
    """
    return block.timestamp - creation_time

@view
@external
def is_square() -> bool:
    """
    @notice Check if image is square
    @return True if width == height
    """
    return width == height

