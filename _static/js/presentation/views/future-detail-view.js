/**
 * Future Detail View
 * Enhanced view with expected value calculator and price suggester
 */

import { ExpectedValueCalculator } from '../components/expected-value-calc.js';
import { PriceSuggester } from '../components/price-suggester.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { getExplorerUrl } from '../../infrastructure/config/network.js';

export class FutureDetailView {
    constructor(futureAddress, factory, web3Provider, futureAbi) {
        this.futureAddress = futureAddress;
        this.factory = factory;
        this.web3Provider = web3Provider;
        this.futureAbi = futureAbi;
        this.containerElement = null;
        this.futureData = null;
        this.expectedValueCalc = null;
        this.priceSuggester = null;
        this.selectedPrice = null;
    }

    setContainer(element) {
        this.containerElement = element;
    }

    async loadFutureData() {
        try {
            console.log('📈 Loading future data:', this.futureAddress);
            
            const [futureInfo, listing, expectedValue] = await Promise.all([
                this.factory.getFutureInfo(this.futureAddress),
                this.factory.getListing(this.futureAddress),
                this.factory.getExpectedValue(this.futureAddress)
            ]);

            this.futureData = {
                address: this.futureAddress,
                initialValue: futureInfo.initialValue,
                creationTime: futureInfo.creationTime,
                expiryTime: futureInfo.expiryTime,
                owner: futureInfo.owner,
                balance: futureInfo.balance,
                isExpired: futureInfo.isExpired,
                distributionType: futureInfo.distributionType,
                isListed: listing.isListed,
                askPrice: listing.askPrice,
                listTime: listing.listTime,
                expectedValue: expectedValue
            };

            console.log('✅ Loaded future data');
            console.log('   Owner:', this.futureData.owner);
            console.log('   Balance:', ethers.utils.formatEther(this.futureData.balance), 'ETH');
            console.log('   Expected Value:', ethers.utils.formatEther(this.futureData.expectedValue), 'ETH');
            console.log('   Listed:', this.futureData.isListed);
        } catch (error) {
            console.error('Failed to load future data:', error);
            throw error;
        }
    }

    async render() {
        if (!this.containerElement) {
            console.error('Future detail view: Container element not set');
            return;
        }

        this.containerElement.innerHTML = '<div class="loading-state">Loading future...</div>';

        try {
            await this.loadFutureData();
            this.containerElement.innerHTML = this.renderHTML();
            await this.initializeComponents();
            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to render future detail view:', error);
            this.containerElement.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to load future details</p>
                    <button id="back-to-market-error" class="btn-retry">← Back to Market</button>
                </div>
            `;
            
            const backBtn = document.getElementById('back-to-market-error');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    eventBus.emit('NAVIGATE_TO_MARKET');
                });
            }
        }
    }

    renderHTML() {
        const balanceEth = ethers.utils.formatEther(this.futureData.balance);
        const expectedEth = ethers.utils.formatEther(this.futureData.expectedValue);
        const initialEth = ethers.utils.formatEther(this.futureData.initialValue);
        
        const distributionTypes = ['📏 Uniform', '🔔 Gaussian', '📉 Exp Decay', '📈 Exp Growth', '🔻 Linear Decay', '🆄 Inverted', '🔺 Linear Growth'];
        const distName = distributionTypes[this.futureData.distributionType] || '❓ Unknown';
        
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = this.futureData.expiryTime - now;
        const daysRemaining = Math.floor(timeRemaining / 86400);
        const hoursRemaining = Math.floor((timeRemaining % 86400) / 3600);

        const isOwner = this.web3Provider.currentAddress && 
            this.futureData.owner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();

        const ownerShort = `${this.futureData.owner.slice(0, 6)}...${this.futureData.owner.slice(-4)}`;

        return `
            <div class="future-detail-view">
                <!-- Back Navigation -->
                <div class="detail-nav">
                    <button id="back-to-market" class="btn-back">← Back to Market</button>
                </div>

                <!-- Future Header -->
                <div class="future-header">
                    <div class="header-top">
                        <h1 class="future-title">${distName} Future</h1>
                        ${isOwner ? '<span class="badge-owner">✨ You Own This</span>' : ''}
                        ${this.futureData.isExpired ? '<span class="badge-expired">💀 Expired</span>' : ''}
                    </div>
                    
                    <div class="future-metadata">
                        <div class="metadata-item">
                            <span class="metadata-label">Contract:</span>
                            <code title="${this.futureData.address}">${this.futureData.address.slice(0, 14)}...${this.futureData.address.slice(-10)}</code>
                            <button class="btn-copy-inline" data-copy="${this.futureData.address}">📋</button>
                            <a href="${getExplorerUrl(this.futureData.address)}" 
                               target="_blank" class="btn-etherscan-inline">↗</a>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Owner:</span>
                            <code title="${this.futureData.owner}">${ownerShort}</code>
                            <a href="${getExplorerUrl(this.futureData.owner)}" 
                               target="_blank" class="btn-etherscan-inline">↗</a>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Created:</span>
                            <span>${new Date(this.futureData.creationTime * 1000).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="future-stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Current Balance</div>
                        <div class="stat-value">${parseFloat(balanceEth).toFixed(4)} ETH</div>
                    </div>
                    <div class="stat-card highlight">
                        <div class="stat-label">Expected Value</div>
                        <div class="stat-value">${parseFloat(expectedEth).toFixed(4)} ETH</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Initial Value</div>
                        <div class="stat-value">${parseFloat(initialEth).toFixed(4)} ETH</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Time Remaining</div>
                        <div class="stat-value">${daysRemaining}d ${hoursRemaining}h</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Market Status</div>
                        <div class="stat-value">${this.futureData.isListed ? '🏷️ Listed' : '🔒 Unlisted'}</div>
                    </div>
                </div>

                <!-- Expected Value Calculator -->
                <div id="expected-value-container"></div>
                
                ${isOwner && !this.futureData.isExpired ? `
                    <!-- Price Suggester (Owner Only) -->
                    <div id="price-suggester-container"></div>
                    
                    <!-- Owner Actions -->
                    <div class="owner-actions-section">
                        <h3>⚡ Quick Actions</h3>
                        <div class="action-buttons-grid">
                            ${!this.futureData.isListed ? `
                                <button id="list-future-btn" class="btn-action btn-primary">
                                    <span class="btn-icon">🏷️</span>
                                    <span class="btn-text">List for Sale</span>
                                </button>
                            ` : `
                                <button id="delist-future-btn" class="btn-action btn-secondary">
                                    <span class="btn-icon">❌</span>
                                    <span class="btn-text">Delist from Market</span>
                                </button>
                                <div class="listed-info">
                                    <strong>Listed at:</strong> ${ethers.utils.formatEther(this.futureData.askPrice)} ETH
                                </div>
                            `}
                            <button id="transfer-future-btn" class="btn-action btn-secondary">
                                <span class="btn-icon">🔄</span>
                                <span class="btn-text">Transfer Direct</span>
                            </button>
                            <button id="claim-payout-btn" class="btn-action btn-success">
                                <span class="btn-icon">💰</span>
                                <span class="btn-text">Claim ${parseFloat(expectedEth).toFixed(4)} ETH Now</span>
                            </button>
                        </div>
                    </div>
                ` : !isOwner && this.futureData.isListed && !this.futureData.isExpired ? `
                    <!-- Buy Section (Non-Owner) -->
                    <div class="buy-section">
                        <h3>💰 Purchase This Future</h3>
                        <div class="buy-info-grid">
                            <div class="buy-stat">
                                <span class="label">Asking Price</span>
                                <span class="value">${ethers.utils.formatEther(this.futureData.askPrice)} ETH</span>
                            </div>
                            <div class="buy-stat">
                                <span class="label">Expected Value</span>
                                <span class="value">${parseFloat(expectedEth).toFixed(4)} ETH</span>
                            </div>
                            <div class="buy-stat ${parseFloat(ethers.utils.formatEther(this.futureData.askPrice)) < parseFloat(expectedEth) ? 'positive' : 'negative'}">
                                <span class="label">Premium/Discount</span>
                                <span class="value">
                                    ${((parseFloat(ethers.utils.formatEther(this.futureData.askPrice)) / parseFloat(expectedEth) - 1) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <button id="buy-future-btn" class="btn-buy-large">
                            💰 Buy for ${ethers.utils.formatEther(this.futureData.askPrice)} ETH
                        </button>
                    </div>
                ` : `
                    <div class="info-box">
                        ${this.futureData.isExpired ? 
                            '<span class="info-icon">💀</span><span>This future has expired.</span>' :
                            '<span class="info-icon">🔒</span><span>This future is not currently for sale.</span>'
                        }
                    </div>
                `}

                <!-- Transfer Modal (Hidden by default) -->
                <div id="transfer-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>🔄 Direct Transfer</h3>
                            <button class="btn-close-modal">✖</button>
                        </div>
                        <div class="modal-body">
                            <p>Transfer ownership directly (no marketplace fees)</p>
                            <div class="form-group">
                                <label for="transfer-to-address">New Owner Address</label>
                                <input type="text" id="transfer-to-address" placeholder="0x..." class="input-full">
                            </div>
                            <div class="transfer-info">
                                <strong>⚠️ What happens:</strong>
                                <ul>
                                    <li>You receive ${parseFloat(expectedEth).toFixed(4)} ETH immediately</li>
                                    <li>New owner gets the future with ${(parseFloat(balanceEth) - parseFloat(expectedEth)).toFixed(4)} ETH remaining</li>
                                    <li>No marketplace fees (0% fee)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary btn-cancel-modal">Cancel</button>
                            <button id="confirm-transfer-btn" class="btn-primary">Transfer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeComponents() {
        // Initialize Expected Value Calculator
        this.expectedValueCalc = new ExpectedValueCalculator(this.factory, this.futureAddress);
        const evContainer = this.containerElement.querySelector('#expected-value-container');
        if (evContainer) {
            this.expectedValueCalc.setContainer(evContainer);
            await this.expectedValueCalc.render();
        }

        // Initialize Price Suggester (only for owners)
        const isOwner = this.web3Provider.currentAddress && 
            this.futureData.owner.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
        if (isOwner && !this.futureData.isExpired) {
            this.priceSuggester = new PriceSuggester(this.factory, this.futureAddress);
            const psContainer = this.containerElement.querySelector('#price-suggester-container');
            if (psContainer) {
                this.priceSuggester.setContainer(psContainer);
                await this.priceSuggester.render();
            }
        }
    }

    attachEventListeners() {
        // Back button
        const backBtn = this.containerElement.querySelector('#back-to-market');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                eventBus.emit('NAVIGATE_TO_MARKET');
            });
        }

        // Copy buttons
        const copyButtons = this.containerElement.querySelectorAll('.btn-copy-inline');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const text = btn.dataset.copy;
                try {
                    await navigator.clipboard.writeText(text);
                    eventBus.emit(EVENTS.TOAST, {
                        message: '📋 Copied to clipboard!',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Failed to copy:', error);
                }
            });
        });

        // List button
        const listBtn = this.containerElement.querySelector('#list-future-btn');
        if (listBtn) {
            listBtn.addEventListener('click', () => this.handleList());
        }

        // Delist button
        const delistBtn = this.containerElement.querySelector('#delist-future-btn');
        if (delistBtn) {
            delistBtn.addEventListener('click', () => this.handleDelist());
        }

        // Buy button
        const buyBtn = this.containerElement.querySelector('#buy-future-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => this.handleBuy());
        }

        // Transfer button
        const transferBtn = this.containerElement.querySelector('#transfer-future-btn');
        if (transferBtn) {
            transferBtn.addEventListener('click', () => this.showTransferModal());
        }

        // Claim payout button
        const claimBtn = this.containerElement.querySelector('#claim-payout-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.handleClaimPayout());
        }

        // Transfer modal
        this.attachModalListeners();

        // Listen for price selection from price suggester
        eventBus.on('PRICE_SELECTED', (data) => {
            if (data.futureAddress === this.futureAddress) {
                this.selectedPrice = data.priceWei;
                console.log('Price selected:', ethers.utils.formatEther(this.selectedPrice), 'ETH');
            }
        });
    }

    attachModalListeners() {
        const modal = this.containerElement.querySelector('#transfer-modal');
        const closeButtons = this.containerElement.querySelectorAll('.btn-close-modal, .btn-cancel-modal');
        const confirmBtn = this.containerElement.querySelector('#confirm-transfer-btn');

        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        });

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.handleDirectTransfer());
        }
    }

    showTransferModal() {
        const modal = this.containerElement.querySelector('#transfer-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async handleList() {
        const price = this.selectedPrice || prompt('Enter ask price in ETH:');
        if (!price) return;

        try {
            const priceWei = typeof price === 'string' ? ethers.utils.parseEther(price) : price;
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Listing future...',
                type: 'info'
            });

            await this.factory.listFuture(this.futureAddress, priceWei);
            
            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Future listed successfully!',
                type: 'success'
            });
            
            await this.render(); // Refresh
        } catch (error) {
            console.error('Failed to list future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Failed to list future',
                type: 'error'
            });
        }
    }

    async handleDelist() {
        const confirmed = confirm('Delist this future from the marketplace?');
        if (!confirmed) return;

        try {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Delisting future...',
                type: 'info'
            });

            await this.factory.delistFuture(this.futureAddress);
            
            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Future delisted successfully!',
                type: 'success'
            });
            
            await this.render(); // Refresh
        } catch (error) {
            console.error('Failed to delist future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Failed to delist future',
                type: 'error'
            });
        }
    }

    async handleBuy() {
        const askPriceEth = ethers.utils.formatEther(this.futureData.askPrice);
        const confirmed = confirm(`Buy this future for ${askPriceEth} ETH?`);
        if (!confirmed) return;

        try {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Purchasing future...',
                type: 'info'
            });

            await this.factory.buyFuture(this.futureAddress, this.futureData.askPrice);
            
            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Future purchased successfully!',
                type: 'success'
            });
            
            eventBus.emit('NAVIGATE_TO_MARKET'); // Go back to market
        } catch (error) {
            console.error('Failed to buy future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Failed to buy future',
                type: 'error'
            });
        }
    }

    async handleDirectTransfer() {
        const newOwner = this.containerElement.querySelector('#transfer-to-address').value.trim();
        
        if (!newOwner || !ethers.utils.isAddress(newOwner)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Invalid address',
                type: 'error'
            });
            return;
        }

        try {
            // Import EulerianFuture class
            const { EulerianFuture } = await import('../../domain/futures/eulerian-future.js');
            const future = new EulerianFuture(this.web3Provider, this.futureAddress, this.futureAbi);
            await future.init();

            eventBus.emit(EVENTS.TOAST, {
                message: 'Transferring future...',
                type: 'info'
            });

            await future.transfer(newOwner);

            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Transfer successful! Payout sent to your wallet.',
                type: 'success'
            });

            // Close modal and go back to market
            const modal = this.containerElement.querySelector('#transfer-modal');
            if (modal) modal.classList.add('hidden');
            
            eventBus.emit('NAVIGATE_TO_MARKET');
        } catch (error) {
            console.error('Transfer failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Transfer failed',
                type: 'error'
            });
        }
    }

    async handleClaimPayout() {
        const expectedEth = ethers.utils.formatEther(this.futureData.expectedValue);
        const confirmed = confirm(
            `Claim payout by transferring to yourself?\n\n` +
            `You'll receive ${expectedEth} ETH immediately.\n\n` +
            `This will also give you back ownership with reduced balance.`
        );
        if (!confirmed) return;

        try {
            const { EulerianFuture } = await import('../../domain/futures/eulerian-future.js');
            const future = new EulerianFuture(this.web3Provider, this.futureAddress, this.futureAbi);
            await future.init();

            eventBus.emit(EVENTS.TOAST, {
                message: 'Claiming payout...',
                type: 'info'
            });

            await future.transfer(this.web3Provider.currentAddress);

            eventBus.emit(EVENTS.TOAST, {
                message: `✅ Claimed ${expectedEth} ETH successfully!`,
                type: 'success'
            });

            await this.render(); // Refresh
        } catch (error) {
            console.error('Claim failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Claim failed',
                type: 'error'
            });
        }
    }

    async refresh() {
        await this.render();
    }

    destroy() {
        if (this.expectedValueCalc) {
            this.expectedValueCalc.destroy();
        }
        if (this.priceSuggester) {
            this.priceSuggester.destroy();
        }
        if (this.containerElement) {
            this.containerElement.innerHTML = '';
        }
    }
}

