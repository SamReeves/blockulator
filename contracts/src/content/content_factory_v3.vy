# @version 0.4.3

"""
@title ContentFactoryV3 - Multi-Mode Compressed Image Factory
@author L1Ca$h
@notice Factory for creating compressed on-chain images with 4 modes
@dev Uses CREATE2 for deterministic deployment, supports RGB/Grayscale/Mono/Indexed

COMPRESSION MODES:
- 0: RGB (3 bytes/px)    - 73×73 max
- 1: Grayscale (1 byte/px) - 128×128 max  
- 2: Monochrome (1 bit/px) - 362×362 max
- 3: Indexed (palette)     - 124×124 max

GAS OPTIMIZATION:
- Pure functions for cost calculation (0 gas via staticcall)
- Immutable blueprint pattern
- Minimal storage overhead
"""

# ============================================================================
# INTERFACES
# ============================================================================

interface IImageContentV3:
    def get_metadata() -> (uint8, uint256, uint256, uint256, uint256, uint256, address, uint256): view
    def get_mode() -> uint8: view
    def get_dimensions() -> (uint256, uint256): view
    def get_image_data() -> Bytes[16384]: view

# Supported compression modes for this factory:
# MODE_RGB (0):        3 bytes/pixel - Full color, max 73×73 (15,987 bytes)
# MODE_GRAYSCALE (1):  1 byte/pixel  - 256 shades, max 128×128 (16,384 bytes)
# MODE_MONOCHROME (2): 1 bit/pixel   - Dithered B&W, max 362×362 (16,384 bytes)
# MODE_INDEXED (3):    1 byte/pixel  - 256-color palette, max 124×124 (15,376 bytes)
# MODE_RGB565 (5):     2 bytes/pixel - 65K colors, max 90×90 (16,384 bytes)

# ============================================================================
# EVENTS
# ============================================================================

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
    blueprint: address
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_CONTENTS: constant(uint256) = 10000        # Scale up to 10k
MAX_IMAGE_SIZE: constant(uint256) = 16384      # 16KB limit
MAX_DIMENSION: constant(uint256) = 512         # Support large mono images

# Compression modes
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
    mode: uint8
    width: uint256
    height: uint256
    data_size: uint256
    pixel_count: uint256
    creation_time: uint256

# ============================================================================
# STATE VARIABLES
# ============================================================================

owner: public(address)
blueprint: public(immutable(address))
creation_fee: public(uint256)
creation_cooldown: public(uint256)

# Content registry
contents: public(DynArray[ContentEntry, MAX_CONTENTS])
content_index: public(HashMap[address, uint256])
creator_contents: public(HashMap[address, DynArray[address, 1000]])
last_creation: public(HashMap[address, uint256])

# Statistics
total_pixels_stored: public(uint256)
total_bytes_stored: public(uint256)

# ============================================================================
# PURE FUNCTIONS - GAS CALCULATION (0 GAS VIA STATICCALL!)
# ============================================================================

@pure
@external
def calculate_data_size(mode: uint8, width: uint256, height: uint256, palette_size: uint256) -> uint256:
    """
    @notice Calculate expected data size for given parameters (PURE - no gas for state)
    @param mode Compression mode (0-3)
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
        return (pixels + 7) // 8  # Ceiling division
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
        return (73, 128, 5461)
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

@pure
@external
def calculate_compression_ratio(mode: uint8, pixels: uint256, data_size: uint256) -> uint256:
    """
    @notice Calculate compression ratio in basis points (PURE)
    @param mode Compression mode
    @param pixels Total pixels
    @param data_size Actual data size
    @return Ratio × 10000 (e.g., 30000 = 3.0×)
    """
    if data_size == 0:
        return 0
    
    uncompressed: uint256 = pixels * 3  # RGB baseline
    return (uncompressed * 10000) // data_size

@pure
@external
def estimate_gas_cost(mode: uint8, data_size: uint256) -> uint256:
    """
    @notice Estimate gas cost for image creation (PURE)
    @param mode Compression mode
    @param data_size Data size in bytes
    @return Estimated gas units
    """
    # Base cost: contract creation + storage setup
    base_cost: uint256 = 100000
    
    # Storage cost: ~20k gas per 32-byte word
    storage_words: uint256 = (data_size + 31) // 32
    storage_cost: uint256 = storage_words * 20000
    
    # Mode-specific overhead
    mode_overhead: uint256 = 0
    if mode == MODE_INDEXED:
        mode_overhead = 50000  # Palette processing
    elif mode == MODE_MONOCHROME:
        mode_overhead = 10000  # Bit packing
    elif mode == MODE_RGB565:
        mode_overhead = 5000   # Bit unpacking
    
    return base_cost + storage_cost + mode_overhead

@pure
@external  
def validate_dimensions(mode: uint8, width: uint256, height: uint256) -> bool:
    """
    @notice Validate dimensions for a mode (PURE)
    @param mode Compression mode
    @param width Image width
    @param height Image height
    @return True if valid
    """
    if width == 0 or height == 0:
        return False
    
    pixels: uint256 = width * height
    
    if mode == MODE_RGB:
        return width <= 128 and height <= 128 and pixels <= 5461
    elif mode == MODE_GRAYSCALE:
        return width <= 128 and height <= 128 and pixels <= 16384
    elif mode == MODE_MONOCHROME:
        return width <= 512 and height <= 512 and pixels <= 131072
    elif mode == MODE_INDEXED:
        return width <= 128 and height <= 128 and pixels <= 15376
    elif mode == MODE_RGB565:
        return width <= 128 and height <= 128 and pixels <= 8192
    else:
        return False

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(_blueprint: address, _creation_fee: uint256, _creation_cooldown: uint256):
    """
    @notice Initialize factory with blueprint
    @param _blueprint Address of ImageContentV3 blueprint
    @param _creation_fee Fee in wei (0 for free)
    @param _creation_cooldown Cooldown between creations (0 for none)
    """
    assert _blueprint != empty(address), "Invalid blueprint"
    
    self.owner = msg.sender
    blueprint = _blueprint
    self.creation_fee = _creation_fee
    self.creation_cooldown = _creation_cooldown
    
    log FactoryInitialized(owner=msg.sender, blueprint=_blueprint, timestamp=block.timestamp)

# ============================================================================
# MAIN FUNCTIONS
# ============================================================================

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
    @param mode Compression mode (0-3)
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
    assert mode <= MODE_RGB565, "Invalid mode"
    
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
        blueprint,
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
        mode=mode,
        width=width,
        height=height,
        data_size=len(image_data),
        pixel_count=pixels,
        creation_time=block.timestamp
    )
    
    # Add to registry
    index: uint256 = len(self.contents)
    self.contents.append(entry)
    self.content_index[content_addr] = index
    self.creator_contents[msg.sender].append(content_addr)
    self.last_creation[msg.sender] = block.timestamp
    
    # Update statistics
    self.total_pixels_stored += pixels
    self.total_bytes_stored += len(image_data)
    
    log ImageCreated(
        creator=msg.sender,
        content_address=content_addr,
        mode=mode,
        width=width,
        height=height,
        data_size=len(image_data),
        pixel_count=pixels,
        index=index,
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

@view
@external
def get_statistics() -> (uint256, uint256, uint256, uint256):
    """
    @notice Get factory statistics
    @return (total_contents, total_pixels, total_bytes, avg_compression_ratio)
    """
    total: uint256 = len(self.contents)
    if total == 0:
        return (0, 0, 0, 0)
    
    # Calculate average compression (RGB baseline)
    uncompressed_equiv: uint256 = self.total_pixels_stored * 3
    avg_ratio: uint256 = 0
    if self.total_bytes_stored > 0:
        avg_ratio = (uncompressed_equiv * 10000) // self.total_bytes_stored
    
    return (total, self.total_pixels_stored, self.total_bytes_stored, avg_ratio)

@view
@external
def get_mode_statistics(mode: uint8) -> (uint256, uint256, uint256):
    """
    @notice Get statistics for specific mode
    @return (count, total_pixels, total_bytes)
    """
    count: uint256 = 0
    pixels: uint256 = 0
    bytes_stored: uint256 = 0
    
    for entry: ContentEntry in self.contents:
        if entry.mode == mode:
            count += 1
            pixels += entry.pixel_count
            bytes_stored += entry.data_size
    
    return (count, pixels, bytes_stored)

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

