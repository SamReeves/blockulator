# @version 0.4.3

"""
@title TextContentV4 - On-Chain Text Storage
@author L1Ca$h
@notice Blueprint for storing UTF-8 text up to 16KB on-chain
@dev Deployed via ContentFactoryV4 using create_from_blueprint

FEATURES:
- Store up to 16KB UTF-8 text
- Efficient slice retrieval for large texts
- Immutable once deployed
- Content hash for verification
"""

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_TEXT_SIZE: constant(uint256) = 16384  # 16KB limit

# ============================================================================
# IMMUTABLE STATE
# ============================================================================

creator: public(immutable(address))
factory: public(immutable(address))
creation_time: public(immutable(uint256))

# ============================================================================
# MUTABLE STATE
# ============================================================================

text_data: Bytes[16384]
data_size: public(uint256)

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
    @notice Deploy text content blueprint instance
    @param _text_data UTF-8 encoded text (1-16384 bytes)
    @param _creator Creator address
    @param _factory Factory address
    """
    # Validate addresses
    assert _creator != empty(address), "Creator cannot be zero"
    assert _factory != empty(address), "Factory cannot be zero"
    
    # Validate data
    assert len(_text_data) > 0, "Empty text"
    assert len(_text_data) <= MAX_TEXT_SIZE, "Text too large"
    
    # Store immutable
    creator = _creator
    factory = _factory
    creation_time = block.timestamp
    
    # Store mutable
    self.text_data = _text_data
    self.data_size = len(_text_data)

# ============================================================================
# VIEW FUNCTIONS
# ============================================================================

@view
@external
def get_text() -> Bytes[16384]:
    """
    @notice Get full text content
    @return Complete text data
    """
    return self.text_data

@view
@external
def get_text_slice(start: uint256, length: uint256) -> Bytes[16384]:
    """
    @notice Get substring of text (for large texts)
    @param start Starting byte position
    @param length Number of bytes to return
    @return Text slice
    """
    assert start < self.data_size, "Start out of bounds"
    assert start + length <= self.data_size, "Length out of bounds"
    
    return slice(self.text_data, start, length)

@view
@external
def get_metadata() -> (uint256, address, address, uint256):
    """
    @notice Get text metadata
    @return (data_size, creator, factory, creation_time)
    """
    return (
        self.data_size,
        creator,
        factory,
        creation_time
    )

@view
@external
def get_data_hash() -> bytes32:
    """
    @notice Content hash for verification
    @return Keccak256 hash of text data
    """
    return keccak256(self.text_data)

@view
@external
def get_content_type() -> String[10]:
    """
    @notice Get content type
    @return "text"
    """
    return "text"

