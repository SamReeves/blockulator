/**
 * Eulerian Future Domain Class
 * Wrapper for individual EulerianFuture contract instances
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class EulerianFuture {
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

        console.log('✅ Eulerian Future initialized:', this.contractAddress);
    }

    /**
     * Transfer ownership to a new owner
     * This triggers payout of accumulated value to current owner
     */
    async transfer(newOwner) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.transfer(newOwner);

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Transferring future ownership...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Ownership transferred!' 
        });

        return receipt;
    }

    /**
     * Get current state
     * Returns: (current_value, last_cache, phase)
     */
    async getCurrentState() {
        const state = await this.contract.get_current_state();
        return {
            currentValue: state[0],
            lastCache: state[1],
            phase: state[2]
        };
    }

    /**
     * Get distribution parameters
     * Returns: (start_time, lifetime, last_activity)
     */
    async getDistributionParams() {
        const params = await this.contract.get_distribution_params();
        return {
            startTime: params[0].toNumber(),
            lifetime: params[1].toNumber(),
            lastActivity: params[2]
        };
    }

    /**
     * Get time remaining until expiry
     */
    async timeRemaining() {
        const remaining = await this.contract.time_remaining();
        return remaining.toNumber();
    }

    /**
     * Get current contract balance
     */
    async getBalance() {
        const balance = await this.contract.get_balance();
        return balance;
    }

    /**
     * Get current owner
     */
    async getCurrentOwner() {
        const owner = await this.contract.current_owner();
        return owner;
    }

    /**
     * Get distribution type
     */
    async getDistributionType() {
        const distType = await this.contract.distribution_type();
        return distType;
    }

    /**
     * Check if expired
     */
    async isExpired() {
        const expired = await this.contract.expired();
        return expired;
    }

    /**
     * Get complete future data
     */
    async getFullData() {
        try {
            const [
                owner,
                distributionType,
                expired,
                state,
                params,
                balance,
                timeLeft
            ] = await Promise.all([
                this.getCurrentOwner(),
                this.getDistributionType(),
                this.isExpired(),
                this.getCurrentState(),
                this.getDistributionParams(),
                this.getBalance(),
                this.timeRemaining()
            ]);

            return {
                address: this.contractAddress,
                owner,
                distributionType,
                expired,
                currentValue: state.currentValue,
                lastCache: state.lastCache,
                phase: state.phase,
                startTime: params.startTime,
                lifetime: params.lifetime,
                lastActivity: params.lastActivity,
                balance,
                timeRemaining: timeLeft
            };
        } catch (error) {
            console.error('Error fetching future data:', error);
            throw error;
        }
    }

    /**
     * Get distribution type name
     */
    static getDistributionName(type) {
        const types = [
            'Uniform',          // 0
            'Gaussian',         // 1
            'Exp Decay',        // 2
            'Exp Growth',       // 3
            'Linear Decay',     // 4
            'Inverted Gaussian',// 5
            'Linear Growth'     // 6
        ];
        return types[type] || 'Unknown';
    }

    /**
     * Get distribution type description
     */
    static getDistributionDescription(type) {
        const descriptions = {
            0: 'Constant rate payout. Linear accumulation from 0% to 100% over lifetime.',
            1: 'Peak payout at midpoint. Bell curve distribution with symmetric risk.',
            2: 'Early payout favored. Front-loaded with rapid value extraction.',
            3: 'Late payout favored. Back-loaded with appreciation over time.',
            4: 'Linear decay rate. Triangular distribution, high payouts at start.',
            5: 'U-shaped curve. High payouts at both extremes, low in middle.',
            6: 'Linear growth rate. Triangular distribution, high payouts at end.'
        };
        return descriptions[type] || 'Unknown distribution type';
    }

    /**
     * Get distribution type emoji
     */
    static getDistributionEmoji(type) {
        const emojis = [
            '📏',  // 0: Uniform
            '🔔',  // 1: Gaussian
            '📉',  // 2: Exp Decay
            '📈',  // 3: Exp Growth
            '🔻',  // 4: Linear Decay
            '🆄',  // 5: Inverted Gaussian (U-shape)
            '🔺'   // 6: Linear Growth
        ];
        return emojis[type] || '❓';
    }
}

