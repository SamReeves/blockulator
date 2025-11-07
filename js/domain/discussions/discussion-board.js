/**
 * Discussion Board Domain Class
 * Wrapper for the Board contract - manages up to 100 discussions
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class DiscussionBoard {
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

        console.log('✅ Discussion Board initialized:', this.contractAddress);
    }

    /**
     * Create a new discussion and register it on the board
     */
    async createAndRegister(subject, body, maxMessages, maxMessageLength, minDonation, value) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.create_and_register(
            subject, 
            body,
            maxMessages,
            maxMessageLength,
            minDonation,
            {
                value: ethers.BigNumber.from(value)
            }
        );

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Creating discussion...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Discussion created!' 
        });

        return receipt;
    }

    /**
     * Get total number of discussions on the board
     */
    async getDiscussionCount() {
        const count = await this.contract.get_discussion_count();
        return count.toNumber();
    }

    /**
     * Get a single discussion entry by index
     */
    async getDiscussion(index) {
        const entry = await this.contract.get_discussion(index);
        return {
            address: entry.discussion_address,
            lastActivity: entry.last_activity.toNumber()
        };
    }

    /**
     * Get all discussions on the board
     */
    async getAllDiscussions() {
        const entries = await this.contract.get_all_discussions();
        return entries.map(entry => ({
            address: entry.discussion_address,
            lastActivity: entry.last_activity.toNumber()
        }));
    }

    /**
     * Get only active discussions
     */
    async getActiveDiscussions() {
        const entries = await this.contract.get_active_discussions();
        return entries.map(entry => ({
            address: entry.discussion_address,
            lastActivity: entry.last_activity.toNumber()
        }));
    }

    /**
     * Get inactive/terminated discussions
     */
    async getInactiveDiscussions() {
        const entries = await this.contract.get_inactive_discussions();
        return entries.map(entry => ({
            address: entry.discussion_address,
            lastActivity: entry.last_activity.toNumber()
        }));
    }

    /**
     * Check if a discussion can be terminated
     */
    async canTerminate(discussionAddress) {
        return await this.contract.can_terminate(discussionAddress);
    }

    /**
     * Terminate an inactive discussion
     */
    async terminateDiscussion(discussionAddress) {
        if (!this.web3Provider.currentAddress) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.terminate_discussion(discussionAddress);

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Terminating discussion...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Discussion terminated!' 
        });

        return receipt;
    }

    /**
     * Get minimum initial value of inactive discussions (for replacement cost)
     */
    async getMinInactiveValue() {
        const value = await this.contract.get_min_inactive_value();
        return value;
    }

    /**
     * Check if a new discussion with given value can be created
     */
    async canCreate(initialValue) {
        return await this.contract.can_create(ethers.BigNumber.from(initialValue));
    }

    /**
     * Get board statistics
     * Returns: (total_on_board, total_created, active_count)
     */
    async getStats() {
        const stats = await this.contract.get_stats();
        return {
            totalOnBoard: stats[0].toNumber(),
            totalCreated: stats[1].toNumber(),
            activeCount: stats[2].toNumber()
        };
    }

    /**
     * Subscribe to board events
     */
    subscribeToEvents(handlers) {
        if (!this.contract) return;

        // DiscussionCreated event
        if (handlers.DiscussionCreated) {
            this.contract.on('DiscussionCreated', (discussionAddress, creator, subject, initialValue, slotIndex, timestamp, wasReplacement, event) => {
                handlers.DiscussionCreated({
                    discussionAddress,
                    creator,
                    subject,
                    initialValue,
                    slotIndex: slotIndex.toNumber(),
                    timestamp: timestamp.toNumber(),
                    wasReplacement,
                    event
                });
            });
        }

        // DiscussionTerminated event
        if (handlers.DiscussionTerminated) {
            this.contract.on('DiscussionTerminated', (discussionAddress, terminator, finalPool, age, timestamp, event) => {
                handlers.DiscussionTerminated({
                    discussionAddress,
                    terminator,
                    finalPool,
                    age: age.toNumber(),
                    timestamp: timestamp.toNumber(),
                    event
                });
            });
        }

        // DiscussionReplaced event
        if (handlers.DiscussionReplaced) {
            this.contract.on('DiscussionReplaced', (oldDiscussion, newDiscussion, slotIndex, oldInitialValue, newInitialValue, event) => {
                handlers.DiscussionReplaced({
                    oldDiscussion,
                    newDiscussion,
                    slotIndex: slotIndex.toNumber(),
                    oldInitialValue,
                    newInitialValue,
                    event
                });
            });
        }

        // ActivityUpdated event
        if (handlers.ActivityUpdated) {
            this.contract.on('ActivityUpdated', (discussionAddress, newLastActivity, event) => {
                handlers.ActivityUpdated({
                    discussionAddress,
                    newLastActivity: newLastActivity.toNumber(),
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

