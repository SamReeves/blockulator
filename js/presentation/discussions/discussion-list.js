/**
 * Discussion List Component
 * Renders list/grid of discussion cards with filtering and sorting
 */

import { Discussion } from '../../domain/discussions/discussion.js';
import { DOMHelpers } from '../dom/dom-helpers.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class DiscussionList {
    constructor(board, web3Provider, discussionAbi) {
        this.board = board;
        this.web3Provider = web3Provider;
        this.discussionAbi = discussionAbi;
        this.discussions = [];
        this.filter = 'all'; // all, active, inactive
        this.sortBy = 'recent'; // recent, pool, messages
        this.selectedDiscussion = null;
    }

    /**
     * Load discussions from board with metadata
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
     * Render the discussion list
     */
    async render() {
        const listContainer = document.getElementById('discussions-list');
        if (!listContainer) return;

        // Show loading state
        listContainer.innerHTML = '<div class="loading-discussions">Loading discussions...</div>';

        // Load discussions
        await this.loadDiscussions();

        // Clear container
        listContainer.innerHTML = '';

        // Render discussions
        if (this.discussions.length === 0) {
            listContainer.innerHTML = this.renderEmptyState();
        } else {
            this.discussions.forEach(discussion => {
                const card = this.renderDiscussionCard(discussion);
                listContainer.appendChild(card);
            });
        }

        // Update stats
        this.updateStats();
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
     * Render a discussion card
     */
    renderDiscussionCard(discussion) {
        const card = document.createElement('div');
        card.className = 'discussion-card';
        card.dataset.address = discussion.address;

        // Determine status
        const now = Math.floor(Date.now() / 1000);
        const inactivityThreshold = 7 * 24 * 60 * 60; // 7 days
        const timeSinceActivity = now - discussion.lastActivity;
        
        let statusClass = 'active';
        let statusText = '🟢 Active';
        
        if (discussion.terminated) {
            statusClass = 'terminated';
            statusText = '⚫ Terminated';
        } else if (timeSinceActivity >= inactivityThreshold) {
            statusClass = 'inactive';
            statusText = '🟡 Inactive';
        }

        // Format data
        const creatorShort = `${discussion.creator.slice(0, 6)}...${discussion.creator.slice(-4)}`;
        const pool = ethers.utils.formatEther(discussion.totalPool);
        const poolFormatted = parseFloat(pool).toFixed(4);
        const initialValue = ethers.utils.formatEther(discussion.initialValue);
        const initialFormatted = parseFloat(initialValue).toFixed(4);
        const timeAgo = this.formatTimeAgo(discussion.creationTime);
        const lastActivityAgo = this.formatTimeAgo(discussion.lastActivity);

        card.innerHTML = `
            <div class="discussion-card-header">
                <h3 class="discussion-subject">${this.escapeHtml(discussion.subject)}</h3>
                <span class="discussion-status ${statusClass}">${statusText}</span>
            </div>
            <div class="discussion-meta">
                <div class="meta-item">
                    <span class="meta-label">Creator:</span>
                    <span class="meta-value">${creatorShort}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span class="meta-value">${timeAgo}</span>
                </div>
            </div>
            <div class="discussion-stats">
                <div class="stat-item">
                    <div class="stat-label">Initial Value</div>
                    <div class="stat-value">${initialFormatted} ETH</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Pool</div>
                    <div class="stat-value">${poolFormatted} ETH</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Messages</div>
                    <div class="stat-value">${discussion.messageCount}/100</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Survivors</div>
                    <div class="stat-value">${discussion.survivorCount}</div>
                </div>
            </div>
            <div class="discussion-footer">
                <span class="last-activity">Last activity: ${lastActivityAgo}</span>
                <button class="btn-view-discussion">View Discussion →</button>
            </div>
        `;

        // Add click handler
        card.querySelector('.btn-view-discussion').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDiscussion(discussion);
        });

        // Make whole card clickable
        card.addEventListener('click', () => {
            this.openDiscussion(discussion);
        });

        return card;
    }

    /**
     * Open discussion detail modal
     */
    openDiscussion(discussion) {
        console.log('Opening discussion:', discussion.address);
        this.selectedDiscussion = discussion;
        
        // Emit event for modal to handle
        eventBus.emit('DISCUSSION_SELECTED', discussion);
    }

    /**
     * Update board stats display
     */
    async updateStats() {
        try {
            const stats = await this.board.getStats();

            const totalEl = document.getElementById('total-discussions');
            const activeEl = document.getElementById('active-discussions');

            if (totalEl) totalEl.textContent = stats.totalOnBoard;
            if (activeEl) activeEl.textContent = stats.activeCount;

        } catch (error) {
            console.error('Failed to update stats:', error);
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
     * Set sort and re-render
     */
    async setSortBy(sortBy) {
        this.sortBy = sortBy;
        this.sortDiscussions();
        await this.render();
    }

    /**
     * Refresh the list
     */
    async refresh() {
        await this.render();
    }

    /**
     * Format timestamp to human-readable "time ago"
     */
    formatTimeAgo(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        
        return new Date(timestamp * 1000).toLocaleDateString();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

