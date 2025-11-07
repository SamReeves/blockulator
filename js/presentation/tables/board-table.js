/**
 * Board Table Component
 * Level 1: Renders discussion list as a semantic HTML table
 * Pure presentation - receives data, renders table, emits events
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class BoardTable {
    constructor(board, web3Provider, discussionAbi) {
        this.board = board;
        this.web3Provider = web3Provider;
        this.discussionAbi = discussionAbi;
        this.discussions = [];
        this.filter = 'all'; // all, active, inactive
        this.sortBy = 'recent'; // recent, pool, messages, activity
        this.containerElement = null;
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Load discussions from board
     */
    async loadDiscussions() {
        try {
            let entries;
            
            if (this.filter === 'active') {
                entries = await this.board.getActiveDiscussions();
            } else if (this.filter === 'inactive') {
                entries = await this.board.getInactiveDiscussions();
            } else {
                entries = await this.board.getAllDiscussions();
            }

            // Load metadata for each discussion
            const { Discussion } = await import('../../domain/discussions/discussion.js');
            
            const discussionsWithMeta = await Promise.all(
                entries.map(async (entry) => {
                    try {
                        const discussion = new Discussion(
                            this.web3Provider,
                            entry.address,
                            this.discussionAbi
                        );
                        await discussion.init();

                        const [metadata, status] = await Promise.all([
                            discussion.getMetadata(),
                            discussion.getStatus()
                        ]);

                        return {
                            address: entry.address,
                            lastActivity: entry.lastActivity,
                            ...metadata,
                            ...status
                        };
                    } catch (error) {
                        console.error(`Failed to load discussion ${entry.address}:`, error);
                        return null;
                    }
                })
            );

            // Filter out failed loads
            this.discussions = discussionsWithMeta.filter(d => d !== null);

            // Sort discussions
            this.sortDiscussions();

            console.log(`📋 Loaded ${this.discussions.length} discussions`);
        } catch (error) {
            console.error('Failed to load discussions:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load discussions',
                type: 'error'
            });
        }
    }

    /**
     * Sort discussions based on current sort option
     */
    sortDiscussions() {
        if (this.sortBy === 'recent') {
            this.discussions.sort((a, b) => b.creationTime - a.creationTime);
        } else if (this.sortBy === 'pool') {
            this.discussions.sort((a, b) => {
                const aPool = parseFloat(ethers.utils.formatEther(a.totalPool));
                const bPool = parseFloat(ethers.utils.formatEther(b.totalPool));
                return bPool - aPool;
            });
        } else if (this.sortBy === 'messages') {
            this.discussions.sort((a, b) => b.messageCount - a.messageCount);
        } else if (this.sortBy === 'activity') {
            this.discussions.sort((a, b) => b.lastActivity - a.lastActivity);
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
        this.sortDiscussions();
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
        this.containerElement.innerHTML = '<div class="loading-state">Loading discussions...</div>';

        // Load discussions
        await this.loadDiscussions();

        // Render table
        if (this.discussions.length === 0) {
            this.containerElement.innerHTML = this.renderEmptyState();
        } else {
            this.containerElement.innerHTML = this.renderTableHTML();
            this.attachEventListeners();
        }

        // Update stats after loading discussions
        await this.updateStats();
    }

    /**
     * Update board statistics
     */
    async updateStats() {
        try {
            const stats = await this.board.getStats();

            const totalEl = document.getElementById('total-discussions');
            const activeEl = document.getElementById('active-discussions');

            if (totalEl) totalEl.textContent = stats.totalCreated || '-';
            if (activeEl) activeEl.textContent = stats.activeCount || '-';

        } catch (error) {
            console.error('Failed to get stats:', error);
            // Don't throw - stats are non-critical
        }
    }

    /**
     * Re-render just the table body (for sorting without reloading data)
     */
    renderTableBody() {
        if (!this.containerElement) return;

        const tbody = this.containerElement.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.discussions.map(d => this.renderTableRow(d)).join('');
        this.attachRowClickListeners();
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const emptyMessages = {
            all: 'No discussions yet. Be the first to start one!',
            active: 'No active discussions at the moment.',
            inactive: 'No inactive discussions.'
        };

        return `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>${emptyMessages[this.filter]}</p>
            </div>
        `;
    }

    /**
     * Render complete table HTML
     */
    renderTableHTML() {
        return `
            <div class="board-table-container">
                <table class="board-table">
                    <thead>
                        <tr>
                            <th class="col-subject sortable" data-sort="subject">
                                Subject
                                <span class="sort-indicator">${this.sortBy === 'recent' ? '▼' : ''}</span>
                            </th>
                            <th class="col-creator">Creator</th>
                            <th class="col-pool sortable" data-sort="pool">
                                Pool (ETH)
                                <span class="sort-indicator">${this.sortBy === 'pool' ? '▼' : ''}</span>
                            </th>
                            <th class="col-messages sortable" data-sort="messages">
                                Messages
                                <span class="sort-indicator">${this.sortBy === 'messages' ? '▼' : ''}</span>
                            </th>
                            <th class="col-activity sortable" data-sort="activity">
                                Last Activity
                                <span class="sort-indicator">${this.sortBy === 'activity' ? '▼' : ''}</span>
                            </th>
                            <th class="col-status">Status</th>
                            <th class="col-action">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.discussions.map(d => this.renderTableRow(d)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render a single table row
     */
    renderTableRow(discussion) {
        // Determine status
        const now = Math.floor(Date.now() / 1000);
        const inactivityThreshold = 7 * 24 * 60 * 60; // 7 days
        const timeSinceActivity = now - discussion.lastActivity;
        
        let statusClass = 'status-active';
        let statusText = '🟢 Active';
        
        if (discussion.terminated) {
            statusClass = 'status-terminated';
            statusText = '⚫ Terminated';
        } else if (timeSinceActivity >= inactivityThreshold) {
            statusClass = 'status-inactive';
            statusText = '🟡 Stale';
        }

        // Format data
        const creatorShort = `${discussion.creator.slice(0, 6)}...${discussion.creator.slice(-4)}`;
        const pool = ethers.utils.formatEther(discussion.totalPool);
        const poolFormatted = parseFloat(pool).toFixed(4);
        const lastActivityAgo = this.formatTimeAgo(discussion.lastActivity);
        const subjectEscaped = this.escapeHtml(discussion.subject);

        return `
            <tr class="discussion-row" data-address="${discussion.address}">
                <td class="col-subject">
                    <div class="subject-cell">
                        <span class="subject-text" title="${subjectEscaped}">${subjectEscaped}</span>
                    </div>
                </td>
                <td class="col-creator">
                    <code>${creatorShort}</code>
                </td>
                <td class="col-pool">
                    <strong>${poolFormatted}</strong>
                </td>
                <td class="col-messages">
                    ${discussion.messageCount}/${discussion.maxMessages}
                </td>
                <td class="col-activity">
                    ${lastActivityAgo}
                </td>
                <td class="col-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="col-action">
                    <button class="btn-open-discussion" data-address="${discussion.address}">
                        Open →
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.attachRowClickListeners();
        this.attachSortListeners();
    }

    /**
     * Attach click listeners to table rows
     */
    attachRowClickListeners() {
        const rows = this.containerElement.querySelectorAll('.discussion-row');
        rows.forEach(row => {
            const address = row.dataset.address;
            const discussion = this.discussions.find(d => d.address === address);
            
            if (discussion) {
                // Click on row opens discussion
                row.addEventListener('click', (e) => {
                    // Don't trigger if clicking the button directly
                    if (e.target.classList.contains('btn-open-discussion')) return;
                    this.openDiscussion(discussion);
                });

                // Button also opens discussion
                const button = row.querySelector('.btn-open-discussion');
                if (button) {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openDiscussion(discussion);
                    });
                }
            }
        });
    }

    /**
     * Attach sort listeners to column headers
     */
    attachSortListeners() {
        const sortableHeaders = this.containerElement.querySelectorAll('th.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', async () => {
                const sortType = header.dataset.sort;
                
                // Map column names to sort options
                const sortMap = {
                    'subject': 'recent',
                    'pool': 'pool',
                    'messages': 'messages',
                    'activity': 'activity'
                };
                
                const newSort = sortMap[sortType];
                if (newSort) {
                    await this.setSortBy(newSort);
                    this.updateSortIndicators();
                }
            });
        });
    }

    /**
     * Update sort indicators in table headers
     */
    updateSortIndicators() {
        const indicators = this.containerElement.querySelectorAll('.sort-indicator');
        indicators.forEach(indicator => indicator.textContent = '');
        
        // Set active indicator
        const sortMap = {
            'recent': 'subject',
            'pool': 'pool',
            'messages': 'messages',
            'activity': 'activity'
        };
        
        const activeColumn = sortMap[this.sortBy];
        if (activeColumn) {
            const activeHeader = this.containerElement.querySelector(`th[data-sort="${activeColumn}"]`);
            if (activeHeader) {
                const indicator = activeHeader.querySelector('.sort-indicator');
                if (indicator) indicator.textContent = '▼';
            }
        }
    }

    /**
     * Open a discussion (emit event)
     */
    openDiscussion(discussion) {
        console.log('Opening discussion:', discussion.address);
        eventBus.emit('DISCUSSION_SELECTED', discussion);
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

