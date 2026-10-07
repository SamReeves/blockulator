/**
 * Market Table Component
 * Level 1: Renders futures list as a semantic HTML table
 * Pure presentation - receives data, renders table, emits events
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { EulerianFuture } from '../../domain/futures/eulerian-future.js';
import { DOMHelpers } from '../dom/dom-helpers.js';
import { AddressBadge } from '../components/address-badge.js';

export class MarketTable {
    constructor(factory, web3Provider) {
        this.factory = factory;
        this.web3Provider = web3Provider;
        this.futures = [];
        this.filter = 'all'; // all, listed, my-futures, uniform, gaussian, decay, growth
        this.sortBy = 'recent'; // recent, expiry, value, expected
        this.containerElement = null;
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Load futures from factory
     */
    async loadFutures() {
        try {
            const futureAddresses = await this.factory.getAllFutures();
            
            // Load data for each future
            const futuresWithData = await Promise.all(
                futureAddresses.map(async (address) => {
                    try {
                        // Get factory-level info and listing
                        const [factoryInfo, listing, expectedValue] = await Promise.all([
                            this.factory.getFutureInfo(address),
                            this.factory.getListing(address),
                            this.factory.getExpectedValue(address).catch(() => ethers.BigNumber.from(0))
                        ]);

                        // Compute time remaining from factory data
                        const currentTimestamp = Math.floor(Date.now() / 1000);
                        const timeRemaining = Math.max(0, factoryInfo.expiryTime - currentTimestamp);

                        return {
                            address,
                            initialValue: factoryInfo.initialValue,
                            creationTime: factoryInfo.creationTime,
                            owner: factoryInfo.owner,
                            expiryTime: factoryInfo.expiryTime,
                            isExpired: factoryInfo.isExpired,
                            distributionType: factoryInfo.distributionType,
                            isListed: listing.isListed,
                            askPrice: listing.askPrice,
                            listTime: listing.listTime,
                            expectedValue,
                            balance: factoryInfo.balance,
                            timeRemaining
                        };
                    } catch (error) {
                        console.error(`Failed to load future ${address}:`, error);
                        return null;
                    }
                })
            );

            // Filter out failed loads and expired futures
            this.futures = futuresWithData.filter(f => f !== null && !f.isExpired);

            // Apply filter
            this.applyFilter();

            // Sort futures
            this.sortFutures();

        } catch (error) {
            console.error('Failed to load futures:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load futures',
                type: 'error'
            });
        }
    }

    /**
     * Apply current filter
     */
    applyFilter() {
        let filtered = [...this.futures];

        if (this.filter === 'listed') {
            filtered = filtered.filter(f => f.isListed);
        } else if (this.filter === 'my-futures') {
            const myAddress = this.web3Provider.currentAddress?.toLowerCase();
            filtered = filtered.filter(f => f.owner.toLowerCase() === myAddress);
        } else if (this.filter === 'uniform') {
            filtered = filtered.filter(f => f.distributionType === 0);
        } else if (this.filter === 'gaussian') {
            filtered = filtered.filter(f => f.distributionType === 1);
        } else if (this.filter === 'decay') {
            filtered = filtered.filter(f => f.distributionType === 2);
        } else if (this.filter === 'growth') {
            filtered = filtered.filter(f => f.distributionType === 3);
        }

        this.futures = filtered;
    }

    /**
     * Sort futures based on current sort option
     */
    sortFutures() {
        if (this.sortBy === 'recent') {
            this.futures.sort((a, b) => b.creationTime - a.creationTime);
        } else if (this.sortBy === 'expiry') {
            this.futures.sort((a, b) => a.timeRemaining - b.timeRemaining);
        } else if (this.sortBy === 'value') {
            this.futures.sort((a, b) => {
                const aValue = parseFloat(ethers.utils.formatEther(a.balance));
                const bValue = parseFloat(ethers.utils.formatEther(b.balance));
                return bValue - aValue;
            });
        } else if (this.sortBy === 'expected') {
            this.futures.sort((a, b) => {
                const aExp = parseFloat(ethers.utils.formatEther(a.expectedValue));
                const bExp = parseFloat(ethers.utils.formatEther(b.expectedValue));
                return bExp - aExp;
            });
        }
    }

    /**
     * Set filter and re-render
     */
    async setFilter(filter) {
        this.filter = filter;
        await this.render();
    }

    /**
     * Set sort option and re-render
     */
    async setSortBy(sortBy) {
        this.sortBy = sortBy;
        await this.render();
    }

    /**
     * Render the complete table
     */
    async render() {
        if (!this.containerElement) {
            console.error('Container element not set');
            return;
        }

        // Show loading state
        this.containerElement.innerHTML = '<div class="loading-state">Loading futures...</div>';

        // Load futures
        await this.loadFutures();

        // Render table
        if (this.futures.length === 0) {
            this.containerElement.innerHTML = this.renderEmptyState();
        } else {
            this.containerElement.innerHTML = this.renderTableHTML();
            this.attachEventListeners();
            this.loadOwnerBadges();
        }

        // Update stats after loading
        await this.updateStats();
    }

    /**
     * Load owner badges asynchronously
     */
    async loadOwnerBadges() {
        const badgeContainers = this.containerElement.querySelectorAll('.owner-badge-container');
        
        for (const container of badgeContainers) {
            const ownerAddress = container.dataset.owner;
            if (!ownerAddress) continue;
            
            try {
                const badge = await AddressBadge.create(ownerAddress, this.web3Provider, {
                    size: 18,
                    clickToExpand: true
                });
                
                if (badge) {
                    container.appendChild(badge);
                }
            } catch (err) {
                // Silently fail - no badge for this user
            }
        }
    }

    /**
     * Refresh table (reload and re-render)
     */
    async refresh() {
        await this.render();
    }

    /**
     * Render table HTML
     */
    renderTableHTML() {
        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Time Left</th>
                        <th>Balance</th>
                        <th>Expected Value</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.futures.map(future => this.renderFutureRow(future)).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Render a single future row
     */
    renderFutureRow(future) {
        const distEmoji = EulerianFuture.getDistributionEmoji(future.distributionType);
        const distName = EulerianFuture.getDistributionName(future.distributionType);
        const createdAgo = this.formatTimeAgo(future.creationTime);
        const timeLeft = DOMHelpers.formatDuration(future.timeRemaining);
        const balance = parseFloat(ethers.utils.formatEther(future.balance)).toFixed(6);
        const expected = parseFloat(ethers.utils.formatEther(future.expectedValue)).toFixed(6);
        const ownerShort = DOMHelpers.formatAddress(future.owner);
        
        const isMyFuture = this.web3Provider.currentAddress?.toLowerCase() === future.owner.toLowerCase();
        
        let statusBadge = '';
        let actionButtons = '';

        if (future.isListed) {
            const askPrice = parseFloat(ethers.utils.formatEther(future.askPrice)).toFixed(6);
            statusBadge = `<span class="status-badge status-listed">Listed: ${askPrice} ETH</span>`;
            
            if (isMyFuture) {
                actionButtons = `
                    <button class="btn-small btn-secondary" data-action="delist" data-address="${future.address}">
                        Delist
                    </button>
                `;
            } else {
                actionButtons = `
                    <button class="btn-small btn-primary" data-action="buy" data-address="${future.address}" data-price="${future.askPrice}">
                        Buy
                    </button>
                `;
            }
        } else {
            statusBadge = `<span class="status-badge status-unlisted">Not Listed</span>`;
            
            if (isMyFuture) {
                actionButtons = `
                    <button class="btn-small btn-primary" data-action="list" data-address="${future.address}">
                        List for Sale
                    </button>
                `;
            }
        }

        return `
            <tr class="future-row" data-address="${future.address}">
                <td>
                    <div class="future-type">
                        <span class="type-emoji">${distEmoji}</span>
                        <span class="type-name">${distName}</span>
                    </div>
                </td>
                <td class="timestamp">${createdAgo}</td>
                <td class="time-left">${timeLeft}</td>
                <td class="value">${balance} ETH</td>
                <td class="expected-value">${expected} ETH</td>
                <td class="owner">
                    <span class="owner-badge-container" data-owner="${future.owner}"></span>
                    <span class="owner-address">${ownerShort}</span>
                </td>
                <td>${statusBadge}</td>
                <td class="actions">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        let message = 'No futures found';
        
        if (this.filter === 'listed') {
            message = 'No futures listed for sale';
        } else if (this.filter === 'my-futures') {
            message = 'You don\'t own any futures yet';
        }

        return `
            <div class="empty-state">
                <p>${message}</p>
                <p>Create your first probabilistic value stream!</p>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // List buttons
        const listButtons = this.containerElement.querySelectorAll('[data-action="list"]');
        listButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const address = btn.dataset.address;
                await this.handleListFuture(address);
            });
        });

        // Delist buttons
        const delistButtons = this.containerElement.querySelectorAll('[data-action="delist"]');
        delistButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const address = btn.dataset.address;
                await this.handleDelistFuture(address);
            });
        });

        // Buy buttons
        const buyButtons = this.containerElement.querySelectorAll('[data-action="buy"]');
        buyButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const address = btn.dataset.address;
                const price = btn.dataset.price;
                await this.handleBuyFuture(address, price);
            });
        });

        // Row click
        const rows = this.containerElement.querySelectorAll('.future-row');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const address = row.dataset.address;
                const future = this.futures.find(f => f.address === address);
                if (future) {
                    eventBus.emit(EVENTS.FUTURE_SELECTED, future);
                }
            });
        });
    }

    /**
     * Handle listing a future
     */
    async handleListFuture(address) {
        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet',
                type: 'warning'
            });
            return;
        }

        const future = this.futures.find(f => f.address === address);
        if (!future) return;

        // Get suggested price
        const suggested = await this.factory.suggestPrice(address, 0);
        const suggestedEth = parseFloat(ethers.utils.formatEther(suggested)).toFixed(6);

        const priceInput = prompt(`List price in ETH?\n\nSuggested (fair value): ${suggestedEth} ETH\n\nEnter your asking price:`);
        if (!priceInput) return;

        try {
            const priceWei = ethers.utils.parseEther(priceInput);
            await this.factory.listFuture(address, priceWei);
            await this.refresh();
        } catch (error) {
            console.error('Failed to list future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to list future: ' + error.message,
                type: 'error'
            });
        }
    }

    /**
     * Handle delisting a future
     */
    async handleDelistFuture(address) {
        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet',
                type: 'warning'
            });
            return;
        }

        if (!confirm('Remove this future from the marketplace?')) {
            return;
        }

        try {
            await this.factory.delistFuture(address);
            await this.refresh();
        } catch (error) {
            console.error('Failed to delist future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to delist future: ' + error.message,
                type: 'error'
            });
        }
    }

    /**
     * Handle buying a future
     */
    async handleBuyFuture(address, priceWei) {
        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet',
                type: 'warning'
            });
            return;
        }

        const priceEth = parseFloat(ethers.utils.formatEther(priceWei)).toFixed(6);
        
        if (!confirm(`Buy this future for ${priceEth} ETH?`)) {
            return;
        }

        try {
            await this.factory.buyFuture(address, priceWei);
            await this.refresh();
        } catch (error) {
            console.error('Failed to buy future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to buy future: ' + error.message,
                type: 'error'
            });
        }
    }

    /**
     * Update stats display
     */
    async updateStats() {
        try {
            const futuresCount = await this.factory.getFuturesCount();
            const allListings = await this.factory.getActiveListings(0, 100);
            const totalTrades = await this.factory.getTotalTrades();

            // Update stat displays
            const totalEl = document.getElementById('total-futures');
            const listingsEl = document.getElementById('active-listings');
            const volumeEl = document.getElementById('total-volume');

            if (totalEl) totalEl.textContent = futuresCount;
            if (listingsEl) listingsEl.textContent = allListings.length;
            if (volumeEl) volumeEl.textContent = totalTrades; // Would need to calculate actual volume

        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    /**
     * Format timestamp as "X ago"
     */
    formatTimeAgo(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

}

