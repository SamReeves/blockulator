# @version 0.4.3

"""
@title Satan, Moloch, Baal - The Infernal Voting Game
@author Sam Reeves
@notice Vote for your favorite demon by burning ETH in their name
@dev All donations are sent to the null address - money goes to the void

MECHANICS:
- Three choices: Satan, Moloch, Baal
- Vote by sending ETH - all funds burn to 0x0000000000000000000000000000000000000000
- Running tally shows total burned for each demon
- No winners, no prizes - just pure sacrifice to the void
"""

# Constants

NULL_ADDRESS: constant(address) = 0x0000000000000000000000000000000000000000

# Enums

enum Demon:
    SATAN    # 0
    MOLOCH   # 1
    BAAL     # 2

# State variables

total_votes: public(HashMap[Demon, uint256])
total_burned: public(HashMap[Demon, uint256])

# Best worshipper for each demon
best_worshipper: public(HashMap[Demon, address])
best_worshipper_amount: public(HashMap[Demon, uint256])

user_votes: public(HashMap[address, HashMap[Demon, uint256]])
user_burned_per_demon: public(HashMap[address, HashMap[Demon, uint256]])
user_total_burned: public(HashMap[address, uint256])

all_time_total_burned: public(uint256)

# Events

event VoteCast:
    voter: indexed(address)
    demon: indexed(Demon)
    amount: uint256
    total_for_demon: uint256
    timestamp: uint256

event NewBestWorshipper:
    demon: indexed(Demon)
    worshipper: indexed(address)
    total_amount: uint256
    previous_best: address

event SacrificeCompleted:
    amount: uint256
    recipient: indexed(address)

# Initialization

@deploy
def __init__():
    """
    @notice Initialize the infernal voting system
    """
    self.total_votes[Demon.SATAN] = 0
    self.total_votes[Demon.MOLOCH] = 0
    self.total_votes[Demon.BAAL] = 0
    
    self.total_burned[Demon.SATAN] = 0
    self.total_burned[Demon.MOLOCH] = 0
    self.total_burned[Demon.BAAL] = 0
    
    self.best_worshipper[Demon.SATAN] = empty(address)
    self.best_worshipper[Demon.MOLOCH] = empty(address)
    self.best_worshipper[Demon.BAAL] = empty(address)
    
    self.best_worshipper_amount[Demon.SATAN] = 0
    self.best_worshipper_amount[Demon.MOLOCH] = 0
    self.best_worshipper_amount[Demon.BAAL] = 0
    
    self.all_time_total_burned = 0

# Core game logic

@payable
@external
def vote_satan():
    """
    @notice Cast your vote for Satan by burning ETH
    """
    assert msg.value > 0, "Must send ETH to vote"
    
    self._process_vote(Demon.SATAN)

@payable
@external
def vote_moloch():
    """
    @notice Cast your vote for Moloch by burning ETH
    """
    assert msg.value > 0, "Must send ETH to vote"
    
    self._process_vote(Demon.MOLOCH)

@payable
@external
def vote_baal():
    """
    @notice Cast your vote for Baal by burning ETH
    """
    assert msg.value > 0, "Must send ETH to vote"
    
    self._process_vote(Demon.BAAL)

@payable
@internal
def _process_vote(demon: Demon):
    """
    @notice Internal function to process a vote and burn the ETH
    @param demon The demon being voted for
    """
    # Update global tallies
    self.total_votes[demon] += 1
    self.total_burned[demon] += msg.value
    self.all_time_total_burned += msg.value
    
    # Update user stats
    self.user_votes[msg.sender][demon] += 1
    self.user_burned_per_demon[msg.sender][demon] += msg.value
    self.user_total_burned[msg.sender] += msg.value
    
    # Check if this user is now the best worshipper for this demon
    user_demon_total: uint256 = self.user_burned_per_demon[msg.sender][demon]
    if user_demon_total > self.best_worshipper_amount[demon]:
        previous_best: address = self.best_worshipper[demon]
        self.best_worshipper[demon] = msg.sender
        self.best_worshipper_amount[demon] = user_demon_total
        
        log NewBestWorshipper(
            demon,
            msg.sender,
            user_demon_total,
            previous_best
        )
    
    # Emit vote event
    log VoteCast(
        msg.sender,
        demon,
        msg.value,
        self.total_burned[demon],
        block.timestamp
    )
    
    # Send to null address (burn)
    send(NULL_ADDRESS, msg.value)
    
    log SacrificeCompleted(msg.value, NULL_ADDRESS)

# View functions

@view
@external
def get_current_standings() -> (uint256, uint256, uint256):
    """
    @notice Get current total burned for each demon
    @return (satan_total, moloch_total, baal_total)
    """
    return (
        self.total_burned[Demon.SATAN],
        self.total_burned[Demon.MOLOCH],
        self.total_burned[Demon.BAAL]
    )

@view
@external
def get_vote_counts() -> (uint256, uint256, uint256):
    """
    @notice Get total number of votes for each demon
    @return (satan_votes, moloch_votes, baal_votes)
    """
    return (
        self.total_votes[Demon.SATAN],
        self.total_votes[Demon.MOLOCH],
        self.total_votes[Demon.BAAL]
    )

@view
@external
def get_leading_demon() -> (Demon, uint256):
    """
    @notice Get which demon is currently leading
    @return (leading_demon, amount)
    """
    satan: uint256 = self.total_burned[Demon.SATAN]
    moloch: uint256 = self.total_burned[Demon.MOLOCH]
    baal: uint256 = self.total_burned[Demon.BAAL]
    
    if satan >= moloch and satan >= baal:
        return (Demon.SATAN, satan)
    elif moloch >= baal:
        return (Demon.MOLOCH, moloch)
    else:
        return (Demon.BAAL, baal)

@view
@external
def get_user_stats(user: address) -> (uint256, uint256, uint256, uint256):
    """
    @notice Get voting statistics for a specific user
    @param user Address to check
    @return (satan_votes, moloch_votes, baal_votes, total_burned)
    """
    return (
        self.user_votes[user][Demon.SATAN],
        self.user_votes[user][Demon.MOLOCH],
        self.user_votes[user][Demon.BAAL],
        self.user_total_burned[user]
    )

@view
@external
def get_user_burned_per_demon(user: address) -> (uint256, uint256, uint256):
    """
    @notice Get total burned by a user for each demon
    @param user Address to check
    @return (satan_burned, moloch_burned, baal_burned)
    """
    return (
        self.user_burned_per_demon[user][Demon.SATAN],
        self.user_burned_per_demon[user][Demon.MOLOCH],
        self.user_burned_per_demon[user][Demon.BAAL]
    )

@view
@external
def get_user_total_burned(user: address) -> uint256:
    """
    @notice Get total amount burned by a user
    @param user Address to check
    @return Total amount burned
    """
    return self.user_total_burned[user]

@view
@external
def get_demon_stats(demon: Demon) -> (uint256, uint256):
    """
    @notice Get stats for a specific demon
    @param demon The demon to check
    @return (total_votes, total_burned)
    """
    return (self.total_votes[demon], self.total_burned[demon])

@view
@external
def get_best_worshipper(demon: Demon) -> (address, uint256):
    """
    @notice Get the best worshipper for a specific demon
    @param demon The demon to check
    @return (worshipper_address, total_amount)
    """
    return (self.best_worshipper[demon], self.best_worshipper_amount[demon])

@view
@external
def get_all_best_worshippers() -> (address, uint256, address, uint256, address, uint256):
    """
    @notice Get best worshippers for all demons
    @return (satan_addr, satan_amt, moloch_addr, moloch_amt, baal_addr, baal_amt)
    """
    return (
        self.best_worshipper[Demon.SATAN],
        self.best_worshipper_amount[Demon.SATAN],
        self.best_worshipper[Demon.MOLOCH],
        self.best_worshipper_amount[Demon.MOLOCH],
        self.best_worshipper[Demon.BAAL],
        self.best_worshipper_amount[Demon.BAAL]
    )

@view
@external
def get_contract_balance() -> uint256:
    """
    @notice Get current contract balance (should always be 0)
    @return Contract balance
    """
    return self.balance

