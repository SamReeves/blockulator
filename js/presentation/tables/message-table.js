/**
 * Message Table Component
 * Level 2: Renders messages for a specific discussion as a semantic HTML table
 * Pure presentation - receives messages, renders table, emits events
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class MessageTable {
    constructor(discussion, web3Provider) {
        this.discussion = discussion;
        this.web3Provider = web3Provider;
        this.messages = [];
        this.sortBy = 'chronological'; // chronological, donation
        this.containerElement = null;
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Load messages from discussion
     */
    async loadMessages() {
        try {
            this.messages = await this.discussion.getAllMessages();
            this.sortMessages();
            console.log(`💬 Loaded ${this.messages.length} messages`);
        } catch (error) {
            console.error('Failed to load messages:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load messages',
                type: 'error'
            });
        }
    }

    /**
     * Sort messages
     */
    sortMessages() {
        if (this.sortBy === 'chronological') {
            // Sort by timestamp ascending (oldest first)
            this.messages.sort((a, b) => a.timestamp - b.timestamp);
        } else if (this.sortBy === 'donation') {
            // Sort by donation descending (highest first)
            this.messages.sort((a, b) => {
                const aDonation = parseFloat(ethers.utils.formatEther(a.donation));
                const bDonation = parseFloat(ethers.utils.formatEther(b.donation));
                return bDonation - aDonation;
            });
        }
    }

    /**
     * Set sort option and re-render
     */
    async setSortBy(sortBy) {
        this.sortBy = sortBy;
        this.sortMessages();
        this.renderTableBody();
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
        this.containerElement.innerHTML = '<div class="loading-state">Loading messages...</div>';

        // Load messages
        await this.loadMessages();

        // Render table
        if (this.messages.length === 0) {
            this.containerElement.innerHTML = this.renderEmptyState();
        } else {
            this.containerElement.innerHTML = this.renderTableHTML();
            this.attachEventListeners();
        }
    }

    /**
     * Re-render just the table body (for sorting without reloading data)
     */
    renderTableBody() {
        if (!this.containerElement) return;

        const tbody = this.containerElement.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.messages.map((m, idx) => this.renderTableRow(m, idx)).join('');
        this.attachRowEventListeners();
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">💭</div>
                <p>No messages yet. Be the first to contribute!</p>
            </div>
        `;
    }

    /**
     * Render complete table HTML
     */
    renderTableHTML() {
        return `
            <div class="message-table-container">
                <div class="table-controls">
                    <div class="sort-controls">
                        <label>Sort by:</label>
                        <select class="sort-select" id="message-sort-select">
                            <option value="chronological" ${this.sortBy === 'chronological' ? 'selected' : ''}>
                                Chronological
                            </option>
                            <option value="donation" ${this.sortBy === 'donation' ? 'selected' : ''}>
                                Highest Donation
                            </option>
                        </select>
                    </div>
                </div>
                <table class="message-table">
                    <thead>
                        <tr>
                            <th class="col-index">#</th>
                            <th class="col-author">Author</th>
                            <th class="col-message">Message</th>
                            <th class="col-donation">Donation (ETH)</th>
                            <th class="col-time">Time</th>
                            <th class="col-support">Support</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.messages.map((m, idx) => this.renderTableRow(m, idx)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render a single table row
     */
    renderTableRow(message, originalIndex) {
        const authorShort = `${message.author.slice(0, 6)}...${message.author.slice(-4)}`;
        const donation = ethers.utils.formatEther(message.donation);
        const donationFormatted = parseFloat(donation).toFixed(4);
        const timeAgo = this.formatTimeAgo(message.timestamp);
        const contentEscaped = this.escapeHtml(message.content);
        
        // Truncate long messages
        const contentTruncated = contentEscaped.length > 100 
            ? contentEscaped.slice(0, 100) + '...' 
            : contentEscaped;
        
        const isLong = contentEscaped.length > 100;
        const isCurrentUser = this.web3Provider.currentAddress && 
            message.author.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();

        return `
            <tr class="message-row" data-index="${originalIndex}">
                <td class="col-index">${originalIndex + 1}</td>
                <td class="col-author">
                    <code title="${message.author}">${authorShort}</code>
                    ${isCurrentUser ? '<span class="badge-you">YOU</span>' : ''}
                </td>
                <td class="col-message">
                    <div class="message-content ${isLong ? 'expandable' : ''}">
                        <span class="message-preview">${contentTruncated}</span>
                        ${isLong ? `
                            <button class="btn-expand-message" data-index="${originalIndex}">
                                Expand
                            </button>
                            <div class="message-full" style="display: none;">
                                ${contentEscaped}
                                <button class="btn-collapse-message" data-index="${originalIndex}">
                                    Collapse
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td class="col-donation">
                    <strong>${donationFormatted}</strong>
                </td>
                <td class="col-time">
                    <span title="${new Date(message.timestamp * 1000).toLocaleString()}">
                        ${timeAgo}
                    </span>
                </td>
                <td class="col-support">
                    <button class="btn-splash" data-index="${originalIndex}" 
                            title="Boost this message with ETH">
                        💦 Splash
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.attachRowEventListeners();
        this.attachSortListener();
    }

    /**
     * Attach listeners to message rows
     */
    attachRowEventListeners() {
        // Splash buttons
        const splashButtons = this.containerElement.querySelectorAll('.btn-splash');
        splashButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const index = parseInt(button.dataset.index);
                await this.handleSplash(index);
            });
        });

        // Expand/collapse buttons
        const expandButtons = this.containerElement.querySelectorAll('.btn-expand-message');
        expandButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = button.dataset.index;
                this.expandMessage(index);
            });
        });

        const collapseButtons = this.containerElement.querySelectorAll('.btn-collapse-message');
        collapseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = button.dataset.index;
                this.collapseMessage(index);
            });
        });
    }

    /**
     * Attach sort listener
     */
    attachSortListener() {
        const sortSelect = this.containerElement.querySelector('#message-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                await this.setSortBy(e.target.value);
            });
        }
    }

    /**
     * Handle splash (boost message)
     */
    async handleSplash(index) {
        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }

        // Prompt for donation amount
        const amount = prompt('Enter ETH amount to boost this message:', '0.01');
        if (!amount) return;

        try {
            const amountWei = ethers.utils.parseEther(amount);
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Boosting message...',
                type: 'info'
            });

            await this.discussion.boostMessage(index, amountWei);

            eventBus.emit(EVENTS.TOAST, {
                message: `💦 Splashed ${amount} ETH on message #${index + 1}!`,
                type: 'success'
            });

            // Reload messages
            await this.render();

        } catch (error) {
            console.error('Failed to boost message:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Failed to boost message',
                type: 'error'
            });
        }
    }

    /**
     * Expand a message to show full content
     */
    expandMessage(index) {
        const row = this.containerElement.querySelector(`tr[data-index="${index}"]`);
        if (!row) return;

        const preview = row.querySelector('.message-preview');
        const full = row.querySelector('.message-full');
        const expandBtn = row.querySelector('.btn-expand-message');

        if (preview) preview.style.display = 'none';
        if (full) full.style.display = 'block';
        if (expandBtn) expandBtn.style.display = 'none';
    }

    /**
     * Collapse a message to show preview
     */
    collapseMessage(index) {
        const row = this.containerElement.querySelector(`tr[data-index="${index}"]`);
        if (!row) return;

        const preview = row.querySelector('.message-preview');
        const full = row.querySelector('.message-full');
        const expandBtn = row.querySelector('.btn-expand-message');

        if (preview) preview.style.display = 'inline';
        if (full) full.style.display = 'none';
        if (expandBtn) expandBtn.style.display = 'inline-block';
    }

    /**
     * Refresh the table
     */
    async refresh() {
        await this.render();
    }

    /**
     * Format time ago
     */
    formatTimeAgo(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const seconds = now - timestamp;
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return `${Math.floor(seconds / 604800)}w ago`;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

