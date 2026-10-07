/**
 * Future Factory Domain Class
 * Wrapper for the FutureFactory contract - manages marketplace of probabilistic value streams
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class FutureFactory {
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

        console.log('✅ Future Factory initialized:', this.contractAddress);
    }

    /**
     * Create a new future contract
     * @param {number} lifetime - Duration in seconds
     * @param {number} distributionType - 0=Uniform, 1=Gaussian, 2=ExpDecay, 3=ExpGrowth
     * @param {string} value - ETH value to deposit
     */
    async createFuture(lifetime, distributionType, value) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);
        const valueBN = ethers.BigNumber.from(value);

        // Estimate gas with buffer for complex distributions (e.g., Gaussian)
        let gasLimit;
        try {
            const gasEstimate = await contractWithSigner.estimateGas.create_future(
                lifetime,
                distributionType,
                { value: valueBN }
            );
            // Add 30% buffer for safety (complex math in contract initialization)
            gasLimit = gasEstimate.mul(130).div(100);
        } catch (estimateError) {
            console.warn('Gas estimation failed, using fallback:', estimateError.message);
            // Fallback gas limit for contract deployment with math initialization
            gasLimit = ethers.BigNumber.from(3000000);
        }

        const tx = await contractWithSigner.create_future(
            lifetime,
            distributionType,
            {
                value: valueBN,
                gasLimit: gasLimit
            }
        );

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Creating future contract...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Future created!' 
        });

        // Extract future address from events
        const event = receipt.events?.find(e => e.event === 'FutureCreated');
        const futureAddress = event?.args?.futureAddress;

        return { receipt, futureAddress };
    }

    /**
     * List a future for sale
     */
    async listFuture(futureAddress, askPrice) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.list_future(
            futureAddress,
            ethers.BigNumber.from(askPrice)
        );

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Listing future...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Future listed!' 
        });

        return receipt;
    }

    /**
     * Buy a listed future
     */
    async buyFuture(futureAddress, askPrice) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.buy_future(
            futureAddress,
            {
                value: ethers.BigNumber.from(askPrice)
            }
        );

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Buying future...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Future purchased!' 
        });

        return receipt;
    }

    /**
     * Delist a future from marketplace
     */
    async delistFuture(futureAddress) {
        if (!this.web3Provider.address) {
            throw new Error('Wallet not connected');
        }

        const signer = this.web3Provider.signer;
        const contractWithSigner = this.contract.connect(signer);

        const tx = await contractWithSigner.delist_future(futureAddress);

        eventBus.emit(EVENTS.TRANSACTION_PENDING, { 
            hash: tx.hash, 
            description: 'Delisting future...' 
        });

        const receipt = await tx.wait();
        
        eventBus.emit(EVENTS.TRANSACTION_SUCCESS, { 
            hash: receipt.transactionHash,
            description: 'Future delisted!' 
        });

        return receipt;
    }

    /**
     * Get expected value of a future (free valuation)
     */
    async getExpectedValue(futureAddress) {
        const value = await this.contract.get_expected_value(futureAddress);
        return value;
    }

    /**
     * Get suggested price with premium/discount
     */
    async suggestPrice(futureAddress, premiumPercent) {
        const price = await this.contract.suggest_price(futureAddress, premiumPercent);
        return price;
    }

    /**
     * Get future info
     * Returns: (initial_value, creation_time, expiry_time, owner, balance, is_expired, distribution_type)
     */
    async getFutureInfo(futureAddress) {
        const info = await this.contract.get_future_info(futureAddress);
        return {
            initialValue: info[0],
            creationTime: info[1].toNumber(),
            expiryTime: info[2].toNumber(),
            owner: info[3],
            balance: info[4],
            isExpired: info[5],
            distributionType: info[6]
        };
    }

    /**
     * Get listing details
     * Returns: (is_listed, ask_price, list_time)
     */
    async getListing(futureAddress) {
        const listing = await this.contract.get_listing(futureAddress);
        return {
            isListed: listing[0],
            askPrice: listing[1],
            listTime: listing[2].toNumber()
        };
    }

    /**
     * Get all active futures
     */
    async getAllFutures() {
        try {
            const futures = await this.contract.get_all_futures();
            return futures;
        } catch (error) {
            console.error('Error fetching futures:', error);
            return [];
        }
    }

    /**
     * Get active listings (paginated)
     */
    async getActiveListings(startIdx = 0, count = 100) {
        try {
            const listings = await this.contract.get_active_listings(startIdx, count);
            return listings;
        } catch (error) {
            console.error('Error fetching listings:', error);
            return [];
        }
    }

    /**
     * Get futures count
     */
    async getFuturesCount() {
        const count = await this.contract.get_futures_count();
        return count.toNumber();
    }

    /**
     * Get total trades
     */
    async getTotalTrades() {
        try {
            // This would need to be added to contract or queried from events
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Subscribe to contract events
     */
    subscribeToEvents(handlers) {
        if (!this.contract) {
            console.warn('Contract not initialized');
            return;
        }

        // FutureCreated event
        if (handlers.FutureCreated) {
            this.contract.on('FutureCreated', (futureAddress, creator, initialValue, lifetime, distributionType, event) => {
                handlers.FutureCreated({
                    futureAddress,
                    creator,
                    initialValue,
                    lifetime: lifetime.toNumber(),
                    distributionType,
                    event
                });
            });
        }

        // FutureListed event
        if (handlers.FutureListed) {
            this.contract.on('FutureListed', (futureAddress, owner, askPrice, expectedValue, event) => {
                handlers.FutureListed({
                    futureAddress,
                    owner,
                    askPrice,
                    expectedValue,
                    event
                });
            });
        }

        // FutureSold event
        if (handlers.FutureSold) {
            this.contract.on('FutureSold', (futureAddress, seller, buyer, price, timestamp, event) => {
                handlers.FutureSold({
                    futureAddress,
                    seller,
                    buyer,
                    price,
                    timestamp: timestamp.toNumber(),
                    event
                });
            });
        }

        // FutureDelisted event
        if (handlers.FutureDelisted) {
            this.contract.on('FutureDelisted', (futureAddress, owner, event) => {
                handlers.FutureDelisted({
                    futureAddress,
                    owner,
                    event
                });
            });
        }

        // FutureReplaced event
        if (handlers.FutureReplaced) {
            this.contract.on('FutureReplaced', (oldFuture, newFuture, event) => {
                handlers.FutureReplaced({
                    oldFuture,
                    newFuture,
                    event
                });
            });
        }
    }

    /**
     * Unsubscribe from all events
     */
    unsubscribeFromEvents() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}

