# @version 0.4.3

"""
@title ImageContentV3 - Multi-Mode Compressed On-Chain Image Storage
@author L1Ca$h (Compression Edition)
@notice Store images with multiple compression modes: RGB, Grayscale, Monochrome, Indexed
@dev Maximizes storage efficiency through adaptive compression

COMPRESSION MODES:
- Mode 0 (RGB):        3 bytes/pixel  - Full color, 5,461 pixels max (73×73)
- Mode 1 (Grayscale):  1 byte/pixel   - 256 shades, 16,384 pixels max (128×128)
- Mode 2 (Monochrome): 1 bit/pixel    - B&W with dithering, 131,072 pixels max (362×362)
- Mode 3 (Indexed):    1 byte/pixel   - Custom palette, ~16,000 pixels max (126×126)

STORAGE FORMAT:
Byte 0:      Mode (0=RGB, 1=Gray, 2=Mono, 3=Indexed)
Byte 1-2:    Width (uint16, little-endian)
Byte 3-4:    Height (uint16, little-endian)
Byte 5-6:    Palette size N (uint8, only for indexed mode)
Byte 7+:     Data (palette bytes if indexed, then pixel data)

CAPACITY COMPARISON:
RGB:        73×73    = 5,329 pixels    = 15,987 bytes
Grayscale:  128×128  = 16,384 pixels   = 16,389 bytes (header + data)
Monochrome: 362×362  = 131,044 pixels  = 16,386 bytes (header + packed bits)
Indexed:    126×126  = 15,876 pixels   = 16,363 bytes (256-color palette)
"""

# ============================================================================
# EVENTS
# ============================================================================

event ImageCreated:
    creator: indexed(address)
    mode: uint8
    width: uint256
    height: uint256
    data_size: uint256
    pixel_count: uint256
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_IMAGE_SIZE: constant(uint256) = 16384      # 16KB total
MAX_DIMENSION: constant(uint256) = 512         # Support up to 512×512 mono
MIN_DIMENSION: constant(uint256) = 1

# Compression modes
MODE_RGB: constant(uint8) = 0          # 3 bytes/pixel
MODE_GRAYSCALE: constant(uint8) = 1    # 1 byte/pixel
MODE_MONOCHROME: constant(uint8) = 2   # 1 bit/pixel (packed)
MODE_INDEXED: constant(uint8) = 3      # 1 byte/pixel + palette
MODE_RGB565: constant(uint8) = 5       # 2 bytes/pixel (16-bit color)

# ============================================================================
# IMMUTABLE STATE
# ============================================================================

creator: public(immutable(address))
factory: public(immutable(address))
mode: public(immutable(uint8))
width: public(immutable(uint256))
height: public(immutable(uint256))
palette_size: public(immutable(uint256))  # 0 for non-indexed modes
creation_time: public(immutable(uint256))
data_size: public(immutable(uint256))

# ============================================================================
# STORAGE
# ============================================================================

# Compressed image data (format depends on mode)
image_data: public(Bytes[16384])

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(
    _mode: uint8,
    _width: uint256,
    _height: uint256,
    _palette_size: uint256,
    _image_data: Bytes[16384],
    _creator: address,
    _factory: address
):
    """
    @notice Deploy compressed image content
    @param _mode Compression mode (0-3)
    @param _width Image width in pixels
    @param _height Image height in pixels
    @param _palette_size Palette size (0 for non-indexed)
    @param _image_data Compressed image data
    @param _creator Creator address
    @param _factory Factory address
    """
    # Validate addresses
    assert _creator != empty(address), "Creator cannot be zero"
    assert _factory != empty(address), "Factory cannot be zero"
    
    # Validate mode
    assert _mode <= MODE_RGB565, "Invalid mode"
    
    # Validate dimensions
    assert _width >= MIN_DIMENSION and _width <= MAX_DIMENSION, "Invalid width"
    assert _height >= MIN_DIMENSION and _height <= MAX_DIMENSION, "Invalid height"
    
    # Validate data size
    assert len(_image_data) > 0, "Empty data"
    assert len(_image_data) <= MAX_IMAGE_SIZE, "Data too large"
    
    # Mode-specific validation
    pixel_count: uint256 = _width * _height
    
    if _mode == MODE_RGB:
        expected: uint256 = pixel_count * 3
        assert len(_image_data) == expected, "RGB size mismatch"
        assert _palette_size == 0, "RGB has no palette"
        
    elif _mode == MODE_GRAYSCALE:
        expected: uint256 = pixel_count
        assert len(_image_data) == expected, "Grayscale size mismatch"
        assert _palette_size == 0, "Grayscale has no palette"
        
    elif _mode == MODE_MONOCHROME:
        # 1 bit per pixel, packed into bytes
        expected: uint256 = (pixel_count + 7) // 8  # Ceiling division
        assert len(_image_data) == expected, "Monochrome size mismatch"
        assert _palette_size == 0, "Monochrome has no palette"
        
    elif _mode == MODE_INDEXED:
        # Palette + index data
        assert _palette_size > 0 and _palette_size <= 256, "Invalid palette size"
        palette_bytes: uint256 = _palette_size * 3  # RGB palette
        expected: uint256 = palette_bytes + pixel_count
        assert len(_image_data) == expected, "Indexed size mismatch"
        
    elif _mode == MODE_RGB565:
        # 2 bytes per pixel (16-bit color)
        expected: uint256 = pixel_count * 2
        assert len(_image_data) == expected, "RGB565 size mismatch"
        assert _palette_size == 0, "RGB565 has no palette"
    
    # Set immutables
    creator = _creator
    factory = _factory
    mode = _mode
    width = _width
    height = _height
    palette_size = _palette_size
    creation_time = block.timestamp
    data_size = len(_image_data)
    
    # Store data
    self.image_data = _image_data
    
    log ImageCreated(
        creator=_creator,
        mode=_mode,
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
def get_image_data() -> Bytes[16384]:
    """
    @notice Get raw compressed image data
    @return Compressed data (format depends on mode)
    """
    return self.image_data

@view
@external
def get_metadata() -> (uint8, uint256, uint256, uint256, uint256, uint256, address, uint256):
    """
    @notice Get complete metadata
    @return (mode, width, height, palette_size, data_size, pixel_count, creator, creation_time)
    """
    return (
        mode,
        width,
        height,
        palette_size,
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

@view
@external
def get_compression_ratio() -> uint256:
    """
    @notice Calculate compression ratio (basis points)
    @return Ratio × 10000 (e.g., 3000 = 3× compression)
    """
    uncompressed: uint256 = width * height * 3  # RGB baseline
    if data_size == 0:
        return 0
    return (uncompressed * 10000) // data_size

@view
@external
def get_data_hash() -> bytes32:
    """
    @notice Hash of image data
    @return keccak256 hash
    """
    return keccak256(self.image_data)

@view
@external
def age() -> uint256:
    """
    @notice Age in seconds
    @return Seconds since creation
    """
    return block.timestamp - creation_time

@view
@external
def mode_name() -> String[12]:
    """
    @notice Human-readable mode name
    @return Mode name string
    """
    if mode == MODE_RGB:
        return "RGB"
    elif mode == MODE_GRAYSCALE:
        return "Grayscale"
    elif mode == MODE_MONOCHROME:
        return "Monochrome"
    elif mode == MODE_INDEXED:
        return "Indexed"
    else:  # MODE_RGB565
        return "RGB565"


