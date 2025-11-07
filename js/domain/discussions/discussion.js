/**
 * Discussion Domain Class
 * Wrapper for individual Discussion contract instances
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class Discussion {
    constructor(web3Provider, contractAddress, abi) {
        this.web3Provider = web3Provider;
        this.contractAddress = contractAddress;
        this.abi = abi;
        this.contract = null;
    }

    async init() {
        const provider = this.web3Provider.getProvider();
        if (!provider) {
            throw new Error('Web3 provider not initialized');
        }

        this.contract = this.web3Provider.getContract(
            this.contractAddress,
            this.abi
        );

        console.log('✅ Discussion initialized:', this.contractAddress);
    }

    /**
     * Get discussion metadata
     */
    async getMetadata() {
        const [board, creator, subject, body, initialValue, creationTime] = await Promise.all([
            this.contract.board(),
            this.contract.creator(),
            this.contract.subject(),
            this.contract.body(),
            this.contract.initial_value(),
            this.contract.creation_time()
        ]);

        return {
            board,
            creator,
            subject,
            body,
            initialValue,
            creationTime: creationTime.toNumber()
        };
    }

    /**
     * Get discussion status
     * Returns: (terminated, message_count, total_pool, last_activity, survivor_count)
     */
    async getStatus() {
        const status = await this.contract.get_status();
        return {
            terminated: status[0],
            messageCount: status[1].toNumber(),
            totalPool: status[2],
            lastActivity: status[3].toNumber(),
            survivorCount: status[4].toNumber()
        };
    }

    /**
     * Get discussion configuration
     * Returns: (max_messages, max_message_length, min_donation)
     */
    async getConfig() {
        const config = await this.contract.get_config();
        return {
            maxMessages: config[0].toNumber(),
            maxMessageLength: config[1].toNumber(),
            minDonation: config[2]
        };
    }

    /**
     * Get message count
     */
    async getMessageCount() {
        const count = await this.contract.get_message_count();
        return count.toNumber();
    }

    /**
     * Get a single message by index
     */
    async getMessage(index) {
        const message = await this.contract.get_message(index);
        return {
            author: message.author,
            content: message.content,
            donation: message.donation,
            timestamp: message.timestamp.toNumber()
        };
    }

    /**
     * Get all messages
     */
    async getAllMessages() {
        const messages = await this.contract.get_all_messages();
        return messages.map(msg => ({
            author: msg.author,
            content: msg.content,
            donation: msg.donation,
            timestamp: msg.timestamp.toNumber()
        }));
    }

    /**
     * Get minimum donation in current messages
     */
    async getMinDonation() {
        const min = await this.contract.get_min_donation();
        return min;
    }

    /**
     * Get required donation to post a message
     */
    async getRequiredDonation() {
        const required = await this.contract.get_required_donation();
        return required;
    }

    /**
     * Get survivor count (unique authors who would split pool)
     */
    async getSurvivorCount() {
        const count = await this.contract.get_survivor_count();
        return count.toNumber();
    }

    /**
     * Get list of survivors
     */
    async getSurvivors() {
        const survivors = await this.contract.get_survivors();
        return survivors;
    }

    /**
     * Get potential payout per survivor if terminated now
     */
    async getPotentialPayout() {
        const payout = await this.contract.get_potential_payout();
        return payout;
    }

    /**
     * Post a message with donation
     */
    async postMessage(content, value) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.post_message(content, {
            value: ethers.BigNumber.from(value)
        });

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Posting message...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Message posted!' 
        });

        return receipt;
    }

    /**
     * Boost an existing message
     */
    async boostMessage(messageIndex, value) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.boost_message(messageIndex, {
            value: ethers.BigNumber.from(value)
        });

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Boosting message...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Message boosted!' 
        });

        return receipt;
    }

    /**
     * Subscribe to discussion events
     */
    subscribeToEvents(handlers) {
        if (!this.contract) return;

        // MessagePosted event
        if (handlers.MessagePosted) {
            this.contract.on('MessagePosted', (author, donation, content, timestamp, index, wasReplacement, event) => {
                handlers.MessagePosted({
                    author,
                    donation,
                    content,
                    timestamp: timestamp.toNumber(),
                    index: index.toNumber(),
                    wasReplacement,
                    event
                });
            });
        }

        // MessageEvicted event
        if (handlers.MessageEvicted) {
            this.contract.on('MessageEvicted', (author, originalDonation, index, replacedBy, event) => {
                handlers.MessageEvicted({
                    author,
                    originalDonation,
                    index: index.toNumber(),
                    replacedBy,
                    event
                });
            });
        }

        // MessageBoosted event
        if (handlers.MessageBoosted) {
            this.contract.on('MessageBoosted', (supporter, messageAuthor, messageIndex, boostAmount, newTotalDonation, timestamp, event) => {
                handlers.MessageBoosted({
                    supporter,
                    messageAuthor,
                    messageIndex: messageIndex.toNumber(),
                    boostAmount,
                    newTotalDonation,
                    timestamp: timestamp.toNumber(),
                    event
                });
            });
        }

        // DiscussionTerminated event
        if (handlers.DiscussionTerminated) {
            this.contract.on('DiscussionTerminated', (terminator, finalPool, survivorCount, timestamp, event) => {
                handlers.DiscussionTerminated({
                    terminator,
                    finalPool,
                    survivorCount: survivorCount.toNumber(),
                    timestamp: timestamp.toNumber(),
                    event
                });
            });
        }

        // PayoutDistributed event
        if (handlers.PayoutDistributed) {
            this.contract.on('PayoutDistributed', (recipient, amount, event) => {
                handlers.PayoutDistributed({
                    recipient,
                    amount,
                    event
                });
            });
        }
    }

    /**
     * Clean up event listeners
     */
    removeAllListeners() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}

