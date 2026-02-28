# @version 0.4.3

"""
@title ImageContentV3 - Simple On-Chain Image Storage
@author Sam Reeves
@notice Store images as raw RGB pixel data
@dev Simplified to match badge pattern - no compression, just RGB bytes

STORAGE FORMAT:
- RGB only: 3 bytes/pixel (R, G, B)
- Max size: 15,987 bytes (73×73 pixels)
- Row-major order: pixel (x, y) is at offset (y * width + x) * 3

COMPARISON TO BADGES:
- Badges: 32×32 = 3,072 bytes
- Images: Up to 73×73 = 15,987 bytes
"""

# ============================================================================
# EVENTS
# ============================================================================

event ImageCreated:
    creator: indexed(address)
    width: uint256
    height: uint256
    data_size: uint256
    pixel_count: uint256
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_IMAGE_SIZE: constant(uint256) = 15987     # 73×73×3 bytes max
MAX_DIMENSION: constant(uint256) = 73         # Max 73×73 for RGB
MIN_DIMENSION: constant(uint256) = 1

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

# RGB image data (3 bytes per pixel)
image_data: public(Bytes[15987])

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(
    _width: uint256,
    _height: uint256,
    _image_data: Bytes[15987],
    _creator: address,
    _factory: address
):
    """
    @notice Deploy RGB image content
    @param _width Image width in pixels
    @param _height Image height in pixels
    @param _image_data Raw RGB pixel data (width × height × 3 bytes)
    @param _creator Creator address
    @param _factory Factory address
    """
    # Validate addresses
    assert _creator != empty(address), "Creator cannot be zero"
    assert _factory != empty(address), "Factory cannot be zero"
    
    # Validate dimensions
    assert _width >= MIN_DIMENSION and _width <= MAX_DIMENSION, "Invalid width"
    assert _height >= MIN_DIMENSION and _height <= MAX_DIMENSION, "Invalid height"
    
    # Validate data size (must be exactly width × height × 3)
    pixel_count: uint256 = _width * _height
    expected_size: uint256 = pixel_count * 3
    
    assert len(_image_data) > 0, "Empty data"
    assert len(_image_data) == expected_size, "Data size mismatch"
    assert len(_image_data) <= MAX_IMAGE_SIZE, "Data too large"
    
    # Set immutables
    creator = _creator
    factory = _factory
    width = _width
    height = _height
    creation_time = block.timestamp
    data_size = len(_image_data)
    
    # Store data
    self.image_data = _image_data
    
    log ImageCreated(
        creator=_creator,
        width=_width,
        height=_height,
        data_size=len(_image_data),
        pixel_count=pixel_count,
        timestamp=block.timestamp
    )

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_image_data() -> Bytes[15987]:
    """
    @notice Get raw RGB image data
    @return RGB data (3 bytes per pixel, row-major order)
    """
    return self.image_data

@view
@external
def get_metadata() -> (uint256, uint256, uint256, uint256, address, uint256):
    """
    @notice Get complete metadata
    @return (width, height, data_size, pixel_count, creator, creation_time)
    """
    return (
        width,
        height,
        data_size,
        width * height,
        creator,
        creation_time
    )

@view
@external
def get_dimensions() -> (uint256, uint256):
    """
    @notice Get dimensions
    @return (width, height)
    """
    return (width, height)

@view
@external
def get_pixel_count() -> uint256:
    """
    @notice Get total pixels
    @return width × height
    """
    return width * height
