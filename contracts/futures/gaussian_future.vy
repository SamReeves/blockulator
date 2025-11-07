# @version ^0.4.0
#pragma enable-decimals

interface ErfCalculator:
    def calculate(x: decimal) -> decimal: view

erf_calculator: public(address)
current_owner: address
initial_value: uint256
start_time: uint256
lifetime: uint256
mean: uint256
stddev: uint256
last_t: uint256
last_cdf: decimal
expired: public(bool)

@deploy
@payable
def __init__(_lifetime: uint256, _erf_calculator: address):
    assert msg.value > 0 and _lifetime > 0 and _erf_calculator != empty(address)
    self.start_time = block.timestamp
    self.lifetime = _lifetime
    self.current_owner = msg.sender
    self.initial_value = msg.value
    self.erf_calculator = _erf_calculator
    self.mean = _lifetime // 2
    self.stddev = convert(convert(_lifetime, decimal) / 3.464101615, uint256)

@external
@payable
def __default__():
    assert msg.value == 0 and msg.sender == self.current_owner

@internal
@view
def normal_cdf(t: uint256) -> decimal:
    z: decimal = 0.0
    if t >= self.mean:
        z = convert(t - self.mean, decimal) / convert(self.stddev, decimal)
    else:
        z = convert(self.mean - t, decimal) / convert(self.stddev, decimal) * -1.0
    z = z / 1.4142135624
    if z > 5.0:
        z = 5.0
    elif z < -5.0:
        z = -5.0
    return 0.5 * (1.0 + staticcall ErfCalculator(self.erf_calculator).calculate(z))

@external
@payable
def transfer(new: address):
    assert msg.sender == self.current_owner and new != empty(address) and msg.value == 0 and new != self.current_owner and not self.expired
    if block.timestamp >= self.start_time + self.lifetime:
        raw_call(self.current_owner, b"", value=self.balance)
        self.expired = True
        return
    t: uint256 = block.timestamp - self.start_time
    left: decimal = self.last_cdf if self.last_t > 0 else 0.0
    right: decimal = self.normal_cdf(t)
    w: decimal = right - left if right > left else 0.0
    raw_call(self.current_owner, b"", value=convert(convert(self.initial_value, decimal) * w, uint256))
    self.last_t = t
    self.last_cdf = right
    self.current_owner = new