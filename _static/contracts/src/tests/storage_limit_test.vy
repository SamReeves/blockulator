# @version 0.4.3

"""
@title Storage Limit Test
@notice Test contract to empirically determine maximum Bytes storage
@dev Deploy with increasing data sizes until failure
"""

content_data: public(Bytes[131072])  # Start with 128KB capacity
actual_size: public(uint256)
deployment_gas: public(uint256)
creator: public(address)

@deploy
def __init__(_content_data: Bytes[131072]):
    """
    Try to store variable amounts of data
    We'll call this with increasing sizes to find the limit
    """
    self.content_data = _content_data
    self.actual_size = len(_content_data)
    self.creator = msg.sender
    self.deployment_gas = msg.gas  # Remaining gas during deployment

@view
@external
def get_data_hash() -> bytes32:
    """Verify data was stored correctly"""
    return keccak256(self.content_data)

@view
@external
def get_stats() -> (uint256, uint256, address):
    """Return size, gas, creator"""
    return (self.actual_size, self.deployment_gas, self.creator)


