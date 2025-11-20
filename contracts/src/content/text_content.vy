# @version 0.4.3

"""
@title TextContent - Immutable On-Chain Text Storage
@author L1Ca$h
@notice Stores a single immutable text document on-chain (up to 16KB)
@dev Deployed from content_factory.vy using blueprint pattern

DESIGN PRINCIPLES:
- SINGLE RESPONSIBILITY: Text only (no image logic)
- IMMUTABLE: All data permanent after deployment
- TYPE SAFE: No conditional branches or runtime type checking
- EFFICIENT: Direct UTF-8 storage

STORAGE LIMITS:
- Maximum: 16,384 bytes (16KB UTF-8)
- Approximately: ~8,000 words or ~16,000 characters
- Format: UTF-8 encoded string

USE CASES:
- Articles & blog posts
- Poetry & literature
- Code snippets
- Documentation
- Messages & manifests

ECONOMICS:
- Creation cost: ~250K-500K gas (scales linearly with text size)
- Storage cost: ~70 gas/byte on-chain
- No ongoing costs (immutable storage)
"""

# ============================================================================
# EVENTS
# ============================================================================

event TextCreated:
    creator: indexed(address)
    size: uint256
    timestamp: uint256

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_TEXT_SIZE: constant(uint256) = 16384       # 16KB UTF-8

# ============================================================================
# IMMUTABLE STATE
# ============================================================================

creator: public(immutable(address))
factory: public(immutable(address))
creation_time: public(immutable(uint256))
data_size: public(immutable(uint256))

# ============================================================================
# STORAGE
# ============================================================================

# UTF-8 encoded text data
text_data: public(Bytes[16384])

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(
    _text_data: Bytes[16384],
    _creator: address,
    _factory: address
):
    """
    @notice Deploy immutable text content
    @param _text_data UTF-8 encoded text
    @param _creator The address that created this text
    @param _factory The factory contract address
    """
    # Validate creator and factory
    assert _creator != empty(address), "Creator cannot be zero address"
    assert _factory != empty(address), "Factory cannot be zero address"
    
    # Validate text data
    assert len(_text_data) > 0, "Empty text data"
    assert len(_text_data) <= MAX_TEXT_SIZE, "Text too large"
    
    # Set immutables
    creator = _creator
    factory = _factory
    creation_time = block.timestamp
    data_size = len(_text_data)
    
    # Store text data
    self.text_data = _text_data
    
    log TextCreated(
        creator=_creator,
        size=len(_text_data),
        timestamp=block.timestamp
    )

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_text() -> Bytes[16384]:
    """
    @notice Get the complete text data
    @return UTF-8 encoded text bytes
    """
    return self.text_data

@view
@external
def get_text_slice(start: uint256, length: uint256) -> Bytes[16384]:
    """
    @notice Get a slice of the text
    @param start Starting byte offset
    @param length Number of bytes to retrieve
    @return Text slice
    """
    assert start < len(self.text_data), "Start out of bounds"
    assert start + length <= len(self.text_data), "Slice out of bounds"
    
    return slice(self.text_data, start, length)

@view
@external
def get_size() -> uint256:
    """
    @notice Get text size in bytes
    @return Number of bytes
    """
    return data_size

@view
@external
def get_metadata() -> (address, uint256, uint256):
    """
    @notice Get complete text metadata
    @return (creator, creation_time, data_size)
    """
    return (
        creator,
        creation_time,
        data_size
    )

@view
@external
def get_data_hash() -> bytes32:
    """
    @notice Get hash of text data
    @return keccak256 hash of text_data
    """
    return keccak256(self.text_data)

@view
@external
def age() -> uint256:
    """
    @notice Get text age in seconds
    @return Seconds since creation
    """
    return block.timestamp - creation_time






