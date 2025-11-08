# @version 0.4.3
#pragma enable-decimals

"""
@title Futures Market Factory
@author L1Ca$h
@notice Factory and marketplace for Eulerian futures (Top 100 structure like board.vy)
@dev Creates futures from blueprint, tracks active futures, facilitates trading

ARCHITECTURE (mirroring board.vy):
- Blueprint-based factory for creating futures
- DynArray[FutureEntry, 100] for tracking active futures
- HashMap lookups for O(1) access
- Expired futures get replaced when new ones are created
- Marketplace functions for listing/buying

SUPPORTED DISTRIBUTIONS (7 types):
- Type 0: Uniform - Constant rate
- Type 1: Gaussian - Bell curve (peak at midpoint)
- Type 2: Exp Decay - Early payouts favored
- Type 3: Exp Growth - Late payouts favored
- Type 4: Linear Decay - Triangular (high at start)
- Type 5: Inverted Gaussian - U-shape (high at extremes)
- Type 6: Linear Growth - Triangular (low at start, high at end)

KEY DIFFERENCES FROM BOARD.VY:
- Futures expire by TIME, not inactivity
- Futures are TRADEABLE assets (not just terminatable)
- Need VALUATION functions (compute expected value)
- Need MARKETPLACE functions (list, buy, delist)
- Futures collect FEES on sales (not on creation)
"""

# High-precision e^x lookup table for valuation calculations
E_TAB: constant(decimal[10][11]) = [
    [1.0, 2.7182818285, 7.3890560989, 20.0855369232, 54.5981500331, 148.4131591026, 403.4287934927, 1096.6331584285, 2980.9579870417, 8103.0839275754],
    [1.0, 1.1051709181, 1.2214027582, 1.3498588076, 1.4918246976, 1.6487212707, 1.8221188004, 2.0137527075, 2.2255409285, 2.4596031112],
    [1.0, 1.0100501671, 1.02020134, 1.030454534, 1.0408107742, 1.0512710964, 1.0618365465, 1.0725081813, 1.0832870677, 1.0941742837],
    [1.0, 1.0010005002, 1.0020020013, 1.0030045045, 1.0040080107, 1.0050125209, 1.0060180361, 1.0070245573, 1.0080320855, 1.0090406218],
    [1.0, 1.000100005, 1.00020002, 1.000300045, 1.00040008, 1.000500125, 1.00060018, 1.0007002451, 1.0008003201, 1.0009004051],
    [1.0, 1.00001, 1.0000200002, 1.0000300005, 1.0000400008, 1.0000500013, 1.0000600018, 1.0000700025, 1.0000800032, 1.0000900041],
    [1.0, 1.000001, 1.000002, 1.000003, 1.000004, 1.000005, 1.000006, 1.000007, 1.000008, 1.000009],
    [1.0, 1.0000001, 1.0000002, 1.0000003, 1.0000004, 1.0000005, 1.0000006, 1.0000007, 1.0000008, 1.0000009],
    [1.0, 1.00000001, 1.00000002, 1.00000003, 1.00000004, 1.00000005, 1.00000006, 1.00000007, 1.00000008, 1.00000009],
    [1.0, 1.000000001, 1.000000002, 1.000000003, 1.000000004, 1.000000005, 1.000000006, 1.000000007, 1.000000008, 1.000000009],
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0000000001, 1.0000000001, 1.0000000001, 1.0000000001]
]

# ============================================================================
# EVENTS
# ============================================================================

event FutureCreated:
    future_address: indexed(address)
    creator: indexed(address)
    initial_value: uint256
    lifetime: uint256
    distribution_type: uint8
    slot_index: uint256
    timestamp: uint256

event FutureReplaced:
    old_future: indexed(address)
    new_future: indexed(address)
    slot_index: uint256

event FutureListed:
    future_address: indexed(address)
    owner: indexed(address)
    ask_price: uint256
    expected_value: uint256
    timestamp: uint256

event FutureSold:
    future_address: indexed(address)
    seller: indexed(address)
    buyer: indexed(address)
    price: uint256
    timestamp: uint256

event FutureDelisted:
    future_address: indexed(address)
    owner: indexed(address)

event FutureExpired:
    future_address: indexed(address)
    final_owner: address
    slot_index: uint256

# ============================================================================
# STRUCTS
# ============================================================================

struct FutureEntry:
    future_address: address    # The future contract instance
    creation_time: uint256     # When created
    expiry_time: uint256       # When expires (creation_time + lifetime)
    initial_value: uint256     # ETH deposited at creation
    distribution_type: uint8   # 0=Uniform, 1=Gaussian, 2=ExpDecay, 3=ExpGrowth

struct Listing:
    is_listed: bool           # Is it for sale?
    ask_price: uint256        # Seller's asking price
    list_time: uint256        # When listed

# ============================================================================
# INTERFACE
# ============================================================================

interface IFuture:
    def current_owner() -> address: view
    def transfer(new_owner: address): payable
    def lock(): nonpayable
    def unlock(): nonpayable
    def get_balance() -> uint256: view
    def distribution_type() -> uint8: view
    def last_t() -> uint256: view
    def get_current_state() -> (uint256, decimal, uint8): view
    def get_distribution_params() -> (uint256, uint256, decimal): view
    def lifetime() -> uint256: view
    def start_time() -> uint256: view
    def expired() -> bool: view
    def initial_value() -> uint256: view

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_FUTURES: constant(uint256) = 100
MIN_INITIAL_VALUE: constant(uint256) = 100000000000000  # 0.0001 ETH
MIN_LIFETIME: constant(uint256) = 300  # 5 minutes
MAX_LIFETIME: constant(uint256) = 31557600000  # 1000 years (1000 * 365.25 * 24 * 60 * 60)

CREATION_FEE_PERCENT: constant(uint256) = 1  # 1% fee on future creation
MARKET_FEE_PERCENT: constant(uint256) = 1  # 1% fee on trades
CREATION_COOLDOWN: constant(uint256) = 300  # 5 minutes between creations per address

# ============================================================================
# STATE
# ============================================================================

futures: public(DynArray[FutureEntry, MAX_FUTURES])
future_index: public(HashMap[address, uint256])  # address -> array index
is_future: public(HashMap[address, bool])        # quick membership check

listings: public(HashMap[address, Listing])      # marketplace state

# Anti-spam: Track last creation time per address
last_creation_time: public(HashMap[address, uint256])

total_created: public(uint256)
total_trades: public(uint256)
market_balance: public(uint256)  # Accumulated fees from creation + trades

owner: public(immutable(address))
future_blueprint: public(immutable(address))

# ============================================================================
# INITIALIZATION
# ============================================================================

@deploy
def __init__(_future_blueprint: address, _owner: address):
    """Initialize market with blueprint and owner"""
    assert _future_blueprint != empty(address), "Invalid blueprint address"
    assert _owner != empty(address), "Invalid owner address"
    
    owner = _owner
    future_blueprint = _future_blueprint
    self.total_created = 0
    self.total_trades = 0
    self.market_balance = 0

# ============================================================================
# FACTORY FUNCTIONS (like board.vy create_and_register)
# ============================================================================

@external
@payable
def create_future(lifetime: uint256, distribution_type: uint8) -> address:
    """
    Create a new future with chosen distribution type
    
    PARAMETERS:
    - lifetime: Duration in seconds
    - distribution_type: 0=Uniform, 1=Gaussian, 2=ExpDecay, 3=ExpGrowth, 4=LinearDecay, 5=InvertedGaussian, 6=LinearGrowth
    """
    # Validate inputs
    assert msg.value >= MIN_INITIAL_VALUE, "Value too low"
    assert lifetime >= MIN_LIFETIME, "Lifetime too short"
    assert lifetime <= MAX_LIFETIME, "Lifetime too long"
    assert distribution_type <= 6, "Invalid distribution type"
    
    # Anti-spam cooldown
    last_created: uint256 = self.last_creation_time[msg.sender]
    if last_created > 0:
        assert block.timestamp >= last_created + CREATION_COOLDOWN, "Cooldown active"
    
    # Calculate fees
    creation_fee: uint256 = msg.value * CREATION_FEE_PERCENT // 100
    future_value: uint256 = msg.value - creation_fee
    self.market_balance += creation_fee
    
    # Deploy from blueprint (pass msg.sender as the owner, self as factory)
    new_future: address = create_from_blueprint(
        future_blueprint,
        lifetime,
        distribution_type,
        msg.sender,
        self,
        value=future_value,
        code_offset=3
    )
    
    # Create future entry
    expiry_time: uint256 = block.timestamp + lifetime
    entry: FutureEntry = FutureEntry(
        future_address=new_future,
        creation_time=block.timestamp,
        expiry_time=expiry_time,
        initial_value=future_value,
        distribution_type=distribution_type
    )
    
    # Register future
    slot_index: uint256 = 0
    if len(self.futures) < MAX_FUTURES:
        # Array not full - append new entry
        self.futures.append(entry)
        slot_index = len(self.futures) - 1
        self.future_index[new_future] = slot_index
        self.is_future[new_future] = True
    else:
        # Array full - find and replace expired future
        replaced: bool = False
        for i: uint256 in range(MAX_FUTURES):
            if block.timestamp >= self.futures[i].expiry_time:
                # Found expired future - replace it
                old_future: address = self.futures[i].future_address
                
                # Clear old mappings
                self.is_future[old_future] = False
                self.future_index[old_future] = 0
                self.listings[old_future] = empty(Listing)
                
                # Replace with new future
                self.futures[i] = entry
                self.future_index[new_future] = i
                self.is_future[new_future] = True
                slot_index = i
                replaced = True
                
                log FutureReplaced(old_future=old_future, new_future=new_future, slot_index=i)
                break
        
        assert replaced, "No expired futures to replace"
    
    # Update state
    self.last_creation_time[msg.sender] = block.timestamp
    self.total_created += 1
    
    # Emit event
    log FutureCreated(
        future_address=new_future,
        creator=msg.sender,
        initial_value=future_value,
        lifetime=lifetime,
        distribution_type=distribution_type,
        slot_index=slot_index,
        timestamp=block.timestamp
    )
    
    return new_future

# ============================================================================
# MARKETPLACE FUNCTIONS
# ============================================================================

@external
def list_future(future_addr: address, ask_price: uint256):
    """List a future for sale"""
    # Validate future exists
    assert self.is_future[future_addr], "Not a registered future"
    
    # Validate ownership
    current_owner: address = staticcall IFuture(future_addr).current_owner()
    assert current_owner == msg.sender, "Not the owner"
    
    # Validate not expired
    is_expired: bool = staticcall IFuture(future_addr).expired()
    assert not is_expired, "Future has expired"
    
    # Validate not past expiry time
    idx: uint256 = self.future_index[future_addr]
    assert block.timestamp < self.futures[idx].expiry_time, "Future expired"
    
    # Lock the future to prevent direct transfers
    extcall IFuture(future_addr).lock()
    
    # Store listing
    self.listings[future_addr] = Listing(
        is_listed=True,
        ask_price=ask_price,
        list_time=block.timestamp
    )
    
    # Compute expected value for transparency
    expected_value: uint256 = self._get_expected_value_internal(future_addr)
    
    # Emit event
    log FutureListed(
        future_address=future_addr,
        owner=msg.sender,
        ask_price=ask_price,
        expected_value=expected_value,
        timestamp=block.timestamp
    )

@external
@payable
def buy_future(future_addr: address):
    """Buy a listed future (1% marketplace fee)"""
    # Validate future exists
    assert self.is_future[future_addr], "Not a registered future"
    
    # Validate listing
    listing: Listing = self.listings[future_addr]
    assert listing.is_listed, "Not listed for sale"
    assert msg.value == listing.ask_price, "Incorrect payment"
    
    # Query future contract
    seller: address = staticcall IFuture(future_addr).current_owner()
    is_expired: bool = staticcall IFuture(future_addr).expired()
    
    # Validate
    assert not is_expired, "Future has expired"
    assert seller != msg.sender, "Cannot buy your own future"
    
    # Calculate fees
    market_fee: uint256 = msg.value * MARKET_FEE_PERCENT // 100
    seller_payment: uint256 = msg.value - market_fee
    
    # Accumulate fee
    self.market_balance += market_fee
    
    # Pay seller
    raw_call(seller, b"", value=seller_payment)
    
    # Transfer future ownership (this pays out accumulated value to seller)
    extcall IFuture(future_addr).transfer(msg.sender)
    
    # Unlock the future (new owner can transfer or re-list)
    extcall IFuture(future_addr).unlock()
    
    # Clear listing
    self.listings[future_addr] = empty(Listing)
    
    # Update stats
    self.total_trades += 1
    
    # Emit event
    log FutureSold(
        future_address=future_addr,
        seller=seller,
        buyer=msg.sender,
        price=msg.value,
        timestamp=block.timestamp
    )

@external
def delist_future(future_addr: address):
    """Remove future from marketplace"""
    # Validate ownership
    current_owner: address = staticcall IFuture(future_addr).current_owner()
    assert current_owner == msg.sender, "Not the owner"
    
    # Unlock the future (owner can transfer directly now)
    extcall IFuture(future_addr).unlock()
    
    # Clear listing
    self.listings[future_addr] = empty(Listing)
    
    # Emit event
    log FutureDelisted(future_address=future_addr, owner=msg.sender)

# ============================================================================
# VALUATION FUNCTIONS (View - Free)
# ============================================================================

@internal
@view
def _get_expected_value_internal(future_addr: address) -> uint256:
    """Compute expected remaining value (supports all 4 distribution types)"""
    # Validate future exists
    assert self.is_future[future_addr], "Not a registered future"
    
    # Query future state
    balance: uint256 = staticcall IFuture(future_addr).get_balance()
    last_t: uint256 = 0
    last_cache: decimal = 0.0
    dist_type: uint8 = 0
    last_t, last_cache, dist_type = staticcall IFuture(future_addr).get_current_state()
    
    lifetime: uint256 = staticcall IFuture(future_addr).lifetime()
    start_time: uint256 = staticcall IFuture(future_addr).start_time()
    is_expired: bool = staticcall IFuture(future_addr).expired()
    
    # If expired, all remaining value goes to current owner
    if is_expired:
        return balance
    
    # If about to expire
    if block.timestamp >= start_time + lifetime:
        return balance
    
    # Compute current elapsed time
    t_current: uint256 = block.timestamp - start_time
    if t_current > lifetime:
        t_current = lifetime
    
    # Compute remaining mass based on distribution type
    remaining_mass: decimal = 0.0
    
    if dist_type == 0:
        # UNIFORM: last_cache is proportion elapsed (0 to 1)
        remaining_mass = 1.0 - last_cache
    
    elif dist_type == 1:
        # GAUSSIAN
        mean: uint256 = 0
        stddev: uint256 = 0
        lambda_param: decimal = 0.0
        mean, stddev, lambda_param = staticcall IFuture(future_addr).get_distribution_params()
        
        z_end: decimal = self._z_score(lifetime, mean, stddev)
        y_end: decimal = self._y_constant(z_end)
        exp_y_end: decimal = self._e_power(y_end)
        tail_end: decimal = self._tail(exp_y_end)
        
        phase: uint8 = self._determine_phase(last_t, lifetime, mean)
        remaining_mass = self._weight_gaussian(last_cache, tail_end, phase)
    
    elif dist_type == 2:
        # EXPONENTIAL DECAY: last_cache is e^(-λ*t_last)
        mean: uint256 = 0
        stddev: uint256 = 0
        lambda_param: decimal = 0.0
        mean, stddev, lambda_param = staticcall IFuture(future_addr).get_distribution_params()
        
        exp_end: decimal = self._exp_decay(lambda_param, lifetime)
        # Remaining mass is from last_t to end
        if last_cache > 0.0:
            remaining_mass = (last_cache - exp_end) / last_cache
        else:
            remaining_mass = 0.0
    
    elif dist_type == 3:
        # EXPONENTIAL GROWTH: last_cache is CDF value
        mean: uint256 = 0
        stddev: uint256 = 0
        lambda_param: decimal = 0.0
        mean, stddev, lambda_param = staticcall IFuture(future_addr).get_distribution_params()
        
        exp_end: decimal = self._exp_decay(lambda_param, lifetime)
        cdf_end: decimal = 1.0 - exp_end
        
        # Remaining mass from current CDF to end
        if 1.0 - last_cache > 0.0:
            remaining_mass = (cdf_end - last_cache) / (1.0 - last_cache)
        else:
            remaining_mass = 0.0
    
    elif dist_type == 4:
        # LINEAR DECAY: last_cache is proportion elapsed
        # Remaining area under triangular curve: (T - t_last)^2 / (2T^2)
        remaining_time: uint256 = lifetime - last_t
        remaining_mass = convert(remaining_time, decimal) * convert(remaining_time, decimal) / (2.0 * convert(lifetime, decimal) * convert(lifetime, decimal))
    
    elif dist_type == 5:
        # INVERTED GAUSSIAN: U-shaped curve
        # Uses similar logic to Gaussian but inverted
        mean: uint256 = 0
        stddev: uint256 = 0
        lambda_param: decimal = 0.0
        mean, stddev, lambda_param = staticcall IFuture(future_addr).get_distribution_params()
        
        z_end: decimal = self._z_score(lifetime, mean, stddev)
        y_end: decimal = self._y_constant(z_end)
        exp_y_end: decimal = self._e_power(y_end)
        tail_end: decimal = self._tail(exp_y_end)
        
        phase: uint8 = self._determine_phase(last_t, lifetime, mean)
        
        # Inverted Gaussian: complement of normal Gaussian weight
        gaussian_remaining: decimal = self._weight_gaussian(last_cache, tail_end, phase)
        
        # For inverted, we reverse: high at extremes means complement behavior
        # The total mass that's "inverted" depends on position
        if phase == 0:
            # Before mean: invert tail values
            remaining_mass = tail_end - last_cache
        elif phase == 1:
            # Crossing mean: sum of outer areas
            remaining_mass = (1.0 - last_cache) + tail_end
        else:
            # After mean: invert tail values
            remaining_mass = last_cache - tail_end
        
        # Clamp to valid range
        if remaining_mass < 0.0:
            remaining_mass = 0.0
    
    else:
        # LINEAR GROWTH (type 6): last_cache is proportion elapsed
        # Remaining area under growth curve: (T^2 - t_last^2) / (2T^2)
        remaining_mass = (convert(lifetime, decimal) * convert(lifetime, decimal) - convert(last_t, decimal) * convert(last_t, decimal)) / (2.0 * convert(lifetime, decimal) * convert(lifetime, decimal))
    
    # Clamp remaining_mass to [0, 1]
    if remaining_mass < 0.0:
        remaining_mass = 0.0
    if remaining_mass > 1.0:
        remaining_mass = 1.0
    
    # Compute expected value
    expected: decimal = convert(balance, decimal) * remaining_mass
    
    return convert(expected, uint256)

@external
@view
def get_expected_value(future_addr: address) -> uint256:
    """
    Public wrapper for expected value calculation
    Compute expected remaining value (supports all 7 distribution types)
    """
    return self._get_expected_value_internal(future_addr)

@external
@view
def suggest_price(future_addr: address, premium_percent: int256) -> uint256:
    """Suggest fair price with premium/discount"""
    expected: uint256 = self._get_expected_value_internal(future_addr)
    
    # Calculate multiplier: 1.0 + (premium_percent / 100.0)
    multiplier: decimal = 1.0 + (convert(premium_percent, decimal) / 100.0)
    
    # Ensure non-negative
    if multiplier < 0.0:
        multiplier = 0.0
    
    suggested: decimal = convert(expected, decimal) * multiplier
    return convert(suggested, uint256)

# ============================================================================
# QUERY FUNCTIONS (View - Free)
# ============================================================================

@external
@view
def get_future_info(future_addr: address) -> (uint256, uint256, uint256, address, uint256, bool, uint8):
    """
    Return comprehensive future info
    Returns: (initial_value, creation_time, expiry_time, owner, balance, is_expired, distribution_type)
    """
    assert self.is_future[future_addr], "Not a registered future"
    
    idx: uint256 = self.future_index[future_addr]
    entry: FutureEntry = self.futures[idx]
    
    current_owner: address = staticcall IFuture(future_addr).current_owner()
    balance: uint256 = staticcall IFuture(future_addr).get_balance()
    is_expired: bool = staticcall IFuture(future_addr).expired()
    
    return (
        entry.initial_value,
        entry.creation_time,
        entry.expiry_time,
        current_owner,
        balance,
        is_expired,
        entry.distribution_type
    )

@external
@view
def get_listing(future_addr: address) -> (bool, uint256, uint256):
    """Return listing details: (is_listed, ask_price, list_time)"""
    listing: Listing = self.listings[future_addr]
    return (listing.is_listed, listing.ask_price, listing.list_time)

@external
@view
def get_active_listings(start_idx: uint256, count: uint256) -> DynArray[address, 100]:
    """Get array of listed futures for UI pagination"""
    result: DynArray[address, 100] = []
    
    end_idx: uint256 = start_idx + count
    if end_idx > len(self.futures):
        end_idx = len(self.futures)
    
    for i: uint256 in range(start_idx, end_idx, bound=MAX_FUTURES):
        future_addr: address = self.futures[i].future_address
        if self.listings[future_addr].is_listed:
            result.append(future_addr)
    
    return result

@external
@view
def get_all_futures() -> DynArray[address, 100]:
    """Return all active future addresses"""
    result: DynArray[address, 100] = []
    
    for i: uint256 in range(len(self.futures), bound=MAX_FUTURES):
        result.append(self.futures[i].future_address)
    
    return result

@external
@view
def get_futures_count() -> uint256:
    """Return number of active futures"""
    return len(self.futures)

# ============================================================================
# HELPER FUNCTIONS (Internal/Pure) - Math for Valuation
# ============================================================================

@internal
@pure
def _z_score(t: uint256, mu: uint256, sigma: uint256) -> decimal:
    """Calculate z-score (standard deviations from mean)"""
    if sigma == 0:
        return 0.0
    
    if t > mu:
        return convert(t - mu, decimal) / convert(sigma, decimal)
    else:
        return convert(mu - t, decimal) / convert(sigma, decimal)

@internal
@pure
def _y_constant(z: decimal) -> decimal:
    """Lin 1990 y-constant calculation"""
    if z >= 9.0:
        return 10.0  # Cap to prevent division issues
    return 13.194689145 * z / (9.0 - z)

@internal
@pure
def _e_power(x: decimal) -> decimal:
    """Calculate e^x using high-precision lookup table"""
    y: decimal = 1.0
    x_work: decimal = x
    
    # Clamp x to valid range [0, 10)
    if x_work < 0.0:
        x_work = 0.0
    if x_work >= 10.0:
        x_work = 9.9999999999
    
    # Process each decimal digit using table multiplication
    for i: uint256 in range(11):
        if x_work != 0.0:
            digit: uint256 = convert(x_work, uint256)
            y *= E_TAB[i][digit]
            x_work -= convert(digit, decimal)
            x_work *= 10.0
        else:
            break
    
    return y

@internal
@pure
def _tail(exp_y: decimal) -> decimal:
    """Lin 1990 tail probability calculation"""
    return 1.0 - 1.0 / (1.0 + exp_y)

@internal
@pure
def _weight_gaussian(left: decimal, right: decimal, phase: uint8) -> decimal:
    """Calculate Gaussian weight between two times based on phase"""
    if phase == 0:
        # Both times before mean
        return left - right
    elif phase == 1:
        # Left before mean, right after mean
        return left - (1.0 - right)
    else:
        # Both times after mean
        return (1.0 - left) - (1.0 - right)

@internal
@pure
def _exp_decay(lambda_param: decimal, t: uint256) -> decimal:
    """Calculate e^(-λt) for exponential distribution using e^(-x) = 1/e^x"""
    # Calculate exponent: λt (positive value)
    exponent: decimal = lambda_param * convert(t, decimal)
    
    # Handle underflow: if exponent >= 10, return ~0
    if exponent >= 10.0:
        return 0.0
    
    # Clamp to valid range
    if exponent < 0.0:
        exponent = 0.0
    
    # Calculate e^x using table
    exp_pos: decimal = self._e_power(exponent)
    
    # Return reciprocal: e^(-x) = 1 / e^x
    if exp_pos > 0.0:
        return 1.0 / exp_pos
    else:
        return 0.0

@internal
@pure
def _determine_phase(t_last: uint256, t_current: uint256, mean: uint256) -> uint8:
    """
    Determine phase for Gaussian calculations
    0: both before mean
    1: t_last before, t_current after
    2: both after mean
    """
    phase: uint8 = 0
    if t_last > mean:
        phase += 1
    if t_current > mean:
        phase += 1
    return phase

# ============================================================================
# ADMIN FUNCTIONS
# ============================================================================

@external
def withdraw_fees(amount: uint256):
    """Owner withdraws accumulated trade fees"""
    assert msg.sender == owner, "Only owner can withdraw"
    assert amount <= self.market_balance, "Insufficient accounting balance"
    assert amount <= self.balance, "Insufficient contract balance"
    
    self.market_balance -= amount
    raw_call(owner, b"", value=amount)

@external
@view
def get_market_balance() -> uint256:
    """Get accumulated fees available for withdrawal"""
    return self.market_balance

@external
@view
def get_unaccounted_balance() -> uint256:
    """
    Return ETH in contract not tracked by market_balance
    This should always be 0 under normal operation
    """
    if self.balance > self.market_balance:
        return self.balance - self.market_balance
    return 0

@external
def withdraw_unaccounted(amount: uint256):
    """
    Owner can withdraw unaccounted ETH (defensive measure)
    Only works for ETH that somehow entered contract outside normal flow
    """
    assert msg.sender == owner, "Only owner can withdraw"
    
    # Calculate unaccounted balance
    unaccounted: uint256 = 0
    if self.balance > self.market_balance:
        unaccounted = self.balance - self.market_balance
    
    assert amount <= unaccounted, "Not enough unaccounted balance"
    assert amount <= self.balance, "Insufficient contract balance"
    
    # Note: Do NOT update market_balance since this is unaccounted ETH
    raw_call(owner, b"", value=amount)
