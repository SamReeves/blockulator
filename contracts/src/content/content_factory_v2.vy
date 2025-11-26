# @version 0.4.3

"""
@title Content Factory V2 - Dual Blueprint Upload System
@author L1Ca$h
@notice Factory for creating immutable on-chain content (images and text)
@dev Uses TWO separate blueprints for type safety

ARCHITECTURE:
- Two separate blueprints: ImageContent and TextContent
- Type-safe creation (no runtime type checking in children)
- HashMap registry for O(1) content lookup
- DynArray tracking for browsing (Top 1000 pattern)
- No marketplace (pure content codification)

CONTENT TYPES:
- Images: Via image_blueprint (ImageContent.vy)
  * Up to 16KB RGB (5,461 pixels)
  * Dimensions: 1-128 for width/height
  * Format: Row-major RGB bytes

- Text: Via text_blueprint (TextContent.vy)
  * Up to 16KB UTF-8
  * ~8,000 words
  * Format: UTF-8 encoded string

BENEFITS OF SEPARATION:
- Type safety at compile time
- Smaller per-contract bytecode
- No conditional logic overhead
- Cleaner interfaces
- Easier to extend

ECONOMICS:
- Optional creation fee (configurable by owner)
- Cooldown period between uploads (anti-spam)
- Users pay their own gas (~$10-30 per upload)
"""

# ============================================================================
# EVENTS
# ============================================================================

event ImageCreated:
    content_address: indexed(address)
    creator: indexed(address)
    width: uint256
    height: uint256
    size: uint256
    timestamp: uint256
    slot_index: uint256

event TextCreated:
    content_address: indexed(address)
    creator: indexed(address)
    size: uint256
    timestamp: uint256
    slot_index: uint256

event BlueprintUpdated:
    blueprint_type: String[10]  # "image" or "text"
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
# INTERFACES
# ============================================================================

interface IImageContent:
    def creator() -> address: view
    def width() -> uint256: view
    def height() -> uint256: view
    def data_size() -> uint256: view
    def get_data_hash() -> bytes32: view

interface ITextContent:
    def creator() -> address: view
    def data_size() -> uint256: view
    def get_data_hash() -> bytes32: view

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_CONTENTS: constant(uint256) = 1000         # Top 1000 content registry
MAX_IMAGE_SIZE: constant(uint256) = 16384      # 16KB RGB (5,461 pixels max)
MAX_TEXT_SIZE: constant(uint256) = 16384       # 16KB UTF-8
MAX_IMAGE_DIMENSION: constant(uint256) = 128   # Max width or height
DEFAULT_CREATION_FEE: constant(uint256) = 0    # Free by default
DEFAULT_COOLDOWN: constant(uint256) = 300      # 5 minutes

# ============================================================================
# STATE VARIABLES
# ============================================================================

# Two separate blueprints for type safety
image_blueprint: public(address)
text_blueprint: public(address)

# Content registry (Top 1000 pattern)
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
def __init__(
    _image_blueprint: address,
    _text_blueprint: address,
    _owner: address,
    _creation_fee: uint256,
    _creation_cooldown: uint256
):
    """
    @notice Initialize factory with two separate blueprints
    @param _image_blueprint Blueprint address for ImageContent
    @param _text_blueprint Blueprint address for TextContent
    @param _owner Factory owner address
    @param _creation_fee Fee in wei (0 for free)
    @param _creation_cooldown Seconds between uploads (0 for no cooldown)
    """
    assert _image_blueprint != empty(address), "Invalid image blueprint"
    assert _text_blueprint != empty(address), "Invalid text blueprint"
    assert _owner != empty(address), "Invalid owner"
    
    self.image_blueprint = _image_blueprint
    self.text_blueprint = _text_blueprint
    self.owner = _owner
    self.creation_fee = _creation_fee
    self.creation_cooldown = _creation_cooldown
    
    self.total_created = 0
    self.total_images = 0
    self.total_texts = 0

# ============================================================================
# FACTORY FUNCTIONS - Type Safe Creation
# ============================================================================

@external
@payable
def create_image(width: uint256, height: uint256, pixel_data: Bytes[16384]) -> address:
    """
    @notice Create an immutable image (type-safe via ImageContent blueprint)
    @param width Image width in pixels (1-128)
    @param height Image height in pixels (1-128)
    @param pixel_data RGB pixel data in row-major order (max 16,384 bytes)
    @return Address of deployed ImageContent contract
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
    
    # Deploy from IMAGE blueprint
    new_content: address = create_from_blueprint(
        self.image_blueprint,
        width,          # _width
        height,         # _height
        pixel_data,     # _pixel_data
        msg.sender,     # _creator
        self,           # _factory
        code_offset=3
    )
    
    # Register content
    self._register_content(new_content, msg.sender, 0, len(pixel_data))
    
    # Update statistics
    self.total_images += 1
    self.last_creation_time[msg.sender] = block.timestamp
    
    # Get slot index for event
    slot_index: uint256 = len(self.contents) - 1
    
    log ImageCreated(
        content_address=new_content,
        creator=msg.sender,
        width=width,
        height=height,
        size=len(pixel_data),
        timestamp=block.timestamp,
        slot_index=slot_index
    )
    
    return new_content

@external
@payable
def create_text(text_data: Bytes[16384]) -> address:
    """
    @notice Create an immutable text (type-safe via TextContent blueprint)
    @param text_data UTF-8 encoded text (max 16,384 bytes)
    @return Address of deployed TextContent contract
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
    
    # Deploy from TEXT blueprint
    new_content: address = create_from_blueprint(
        self.text_blueprint,
        text_data,      # _text_data
        msg.sender,     # _creator
        self,           # _factory
        code_offset=3
    )
    
    # Register content
    self._register_content(new_content, msg.sender, 1, len(text_data))
    
    # Update statistics
    self.total_texts += 1
    self.last_creation_time[msg.sender] = block.timestamp
    
    # Get slot index for event
    slot_index: uint256 = len(self.contents) - 1
    
    log TextCreated(
        content_address=new_content,
        creator=msg.sender,
        size=len(text_data),
        timestamp=block.timestamp,
        slot_index=slot_index
    )
    
    return new_content

# ============================================================================
# INTERNAL FUNCTIONS
# ============================================================================

@internal
def _register_content(
    content_addr: address,
    creator_addr: address,
    content_type: uint8,
    size: uint256
):
    """
    @notice Register newly created content in registry
    """
    # Get hash from content contract
    data_hash: bytes32 = empty(bytes32)
    if content_type == 0:  # Image
        data_hash = staticcall IImageContent(content_addr).get_data_hash()
    else:  # Text
        data_hash = staticcall ITextContent(content_addr).get_data_hash()
    
    # Create entry
    entry: ContentEntry = ContentEntry({
        content_address: content_addr,
        creator: creator_addr,
        content_type: content_type,
        creation_time: block.timestamp,
        size: size,
        data_hash: data_hash
    })
    
    # Handle Top 1000 registry
    if len(self.contents) < MAX_CONTENTS:
        # Room available - just append
        self.contents.append(entry)
        idx: uint256 = len(self.contents) - 1
        self.content_index[content_addr] = idx
    else:
        # Replace oldest entry (slot 0)
        old_content: address = self.contents[0].content_address
        
        # Remove old content from index
        self.is_content[old_content] = False
        self.content_index[old_content] = 0
        
        # Shift all entries down
        for i: uint256 in range(MAX_CONTENTS - 1):
            self.contents[i] = self.contents[i + 1]
            self.content_index[self.contents[i].content_address] = i
        
        # Add new content at end
        self.contents[MAX_CONTENTS - 1] = entry
        self.content_index[content_addr] = MAX_CONTENTS - 1
        
        log ContentReplaced(
            old_content=old_content,
            new_content=content_addr,
            slot_index=MAX_CONTENTS - 1
        )
    
    # Mark as valid content
    self.is_content[content_addr] = True
    
    # Track creator's contents
    if self.creator_count[creator_addr] < 50:
        self.creator_contents[creator_addr].append(content_addr)
        self.creator_count[creator_addr] += 1
    
    # Increment total
    self.total_created += 1

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_content_count() -> uint256:
    """
    @notice Get number of contents in registry
    @return Number of contents (max 1000)
    """
    return len(self.contents)

@view
@external
def get_content(index: uint256) -> ContentEntry:
    """
    @notice Get content entry by index
    @param index Index in contents array
    @return Content entry struct
    """
    assert index < len(self.contents), "Index out of bounds"
    return self.contents[index]

@view
@external
def get_recent_contents(count: uint256) -> DynArray[ContentEntry, 100]:
    """
    @notice Get most recent contents
    @param count Number of contents to retrieve (max 100)
    @return Array of content entries (newest first)
    """
    assert count <= 100, "Count too large"
    
    result: DynArray[ContentEntry, 100] = []
    total: uint256 = len(self.contents)
    
    for i: uint256 in range(100):
        if i >= count or i >= total:
            break
        result.append(self.contents[total - 1 - i])
    
    return result

@view
@external
def get_creator_contents(creator_addr: address) -> DynArray[address, 50]:
    """
    @notice Get all contents created by an address
    @param creator_addr Creator address
    @return Array of content addresses
    """
    return self.creator_contents[creator_addr]

@view
@external
def get_statistics() -> (uint256, uint256, uint256):
    """
    @notice Get factory statistics
    @return (total_created, total_images, total_texts)
    """
    return (self.total_created, self.total_images, self.total_texts)

# ============================================================================
# OWNER FUNCTIONS
# ============================================================================

@external
def update_image_blueprint(new_blueprint: address):
    """
    @notice Update image blueprint address
    @param new_blueprint New ImageContent blueprint address
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_blueprint != empty(address), "Invalid blueprint"
    
    old_blueprint: address = self.image_blueprint
    self.image_blueprint = new_blueprint
    
    log BlueprintUpdated(
        blueprint_type="image",
        old_blueprint=old_blueprint,
        new_blueprint=new_blueprint,
        timestamp=block.timestamp
    )

@external
def update_text_blueprint(new_blueprint: address):
    """
    @notice Update text blueprint address
    @param new_blueprint New TextContent blueprint address
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_blueprint != empty(address), "Invalid blueprint"
    
    old_blueprint: address = self.text_blueprint
    self.text_blueprint = new_blueprint
    
    log BlueprintUpdated(
        blueprint_type="text",
        old_blueprint=old_blueprint,
        new_blueprint=new_blueprint,
        timestamp=block.timestamp
    )

@external
def update_creation_fee(new_fee: uint256):
    """
    @notice Update creation fee
    @param new_fee New fee in wei
    """
    assert msg.sender == self.owner, "Only owner"
    self.creation_fee = new_fee

@external
def update_cooldown(new_cooldown: uint256):
    """
    @notice Update cooldown period
    @param new_cooldown New cooldown in seconds
    """
    assert msg.sender == self.owner, "Only owner"
    self.creation_cooldown = new_cooldown

@external
def transfer_ownership(new_owner: address):
    """
    @notice Transfer factory ownership
    @param new_owner New owner address
    """
    assert msg.sender == self.owner, "Only owner"
    assert new_owner != empty(address), "Invalid owner"
    self.owner = new_owner

@external
def withdraw_fees():
    """
    @notice Withdraw collected fees
    """
    assert msg.sender == self.owner, "Only owner"
    send(self.owner, self.balance)










