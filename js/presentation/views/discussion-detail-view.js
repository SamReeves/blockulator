/**
 * Discussion Detail View
 * Level 2: Wrapper component that renders discussion header + message table + post form
 */

import { MessageTable } from '../tables/message-table.js';
import { PostMessageForm } from '../forms/post-message-form.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class DiscussionDetailView {
    constructor(discussion, web3Provider, discussionAbi) {
        this.discussion = discussion;
        this.web3Provider = web3Provider;
        this.discussionAbi = discussionAbi;
        this.messageTable = null;
        this.postMessageForm = null;
        this.containerElement = null;
        this.discussionData = null;
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Load discussion data
     */
    async loadDiscussionData() {
        try {
            // Import Discussion class
            const { Discussion } = await import('../../domain/discussions/discussion.js');
            
            // Create discussion instance
            const discussionInstance = new Discussion(
                this.web3Provider,
                this.discussion.address,
                this.discussionAbi
            );
            await discussionInstance.init();

            // Load metadata, status, and config
            const [metadata, status, config] = await Promise.all([
                discussionInstance.getMetadata(),
                discussionInstance.getStatus(),
                discussionInstance.getConfig()
            ]);

            this.discussionData = {
                address: this.discussion.address,
                ...metadata,
                ...status,
                ...config,
                instance: discussionInstance
            };

            console.log('📋 Loaded discussion data:', this.discussionData.subject);
            console.log('📊 Discussion details:', {
                maxMessages: this.discussionData.maxMessages,
                messageCount: this.discussionData.messageCount,
                minDonation: ethers.utils.formatEther(this.discussionData.minDonation),
                totalPool: ethers.utils.formatEther(this.discussionData.totalPool)
            });
        } catch (error) {
            console.error('Failed to load discussion data:', error);
            throw error;
        }
    }

    /**
     * Render the complete discussion detail view
     */
    async render() {
        if (!this.containerElement) {
            console.error('Container element not set');
            return;
        }

        // Show loading state
        this.containerElement.innerHTML = '<div class="loading-state">Loading discussion...</div>';

        try {
            // Load discussion data
            await this.loadDiscussionData();

            // Render HTML structure
            this.containerElement.innerHTML = this.renderHTML();

            // Initialize child components
            await this.initializeComponents();

            // Attach event listeners
            this.attachEventListeners();

        } catch (error) {
            console.error('Failed to render discussion view:', error);
            this.containerElement.innerHTML = `
                <div class="error-state">
                    <p>Failed to load discussion</p>
                    <button id="back-to-board-error">← Back to Board</button>
                </div>
            `;
            
            document.getElementById('back-to-board-error')?.addEventListener('click', () => {
                eventBus.emit('NAVIGATE_TO_BOARD');
            });
        }
    }

    /**
     * Render HTML structure
     */
    renderHTML() {
        // Calculate status
        const now = Math.floor(Date.now() / 1000);
        const inactivityThreshold = 7 * 24 * 60 * 60;
        const timeSinceActivity = now - this.discussionData.lastActivity;
        
        let statusClass = 'status-active';
        let statusText = '🟢 Active';
        
        if (this.discussionData.terminated) {
            statusClass = 'status-terminated';
            statusText = '⚫ Terminated';
        } else if (timeSinceActivity >= inactivityThreshold) {
            statusClass = 'status-inactive';
            statusText = '🟡 Stale';
        }

        // Format values
        const pool = ethers.utils.formatEther(this.discussionData.totalPool);
        const poolFormatted = parseFloat(pool).toFixed(4);
        const initialValue = ethers.utils.formatEther(this.discussionData.initialValue);
        const initialFormatted = parseFloat(initialValue).toFixed(4);
        const minDonation = ethers.utils.formatEther(this.discussionData.minDonation);
        const minDonationFormatted = parseFloat(minDonation).toFixed(4);
        const createdDate = new Date(this.discussionData.creationTime * 1000).toLocaleString();
        const creatorShort = `${this.discussionData.creator.slice(0, 6)}...${this.discussionData.creator.slice(-4)}`;

        return `
            <div class="discussion-detail-view">
                <!-- Back Button -->
                <div class="detail-nav">
                    <button id="back-to-board" class="btn-back">
                        ← Back to Board
                    </button>
                </div>

                <!-- Discussion Header -->
                <div class="discussion-header">
                    <div class="header-top">
                        <h1 class="discussion-title">💬 ${this.escapeHtml(this.discussionData.subject)}</h1>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="discussion-metadata">
                        <div class="metadata-row">
                            <div class="metadata-item">
                                <span class="metadata-label">Creator:</span>
                                <code>${creatorShort}</code>
                                <span class="metadata-full" title="${this.discussionData.creator}">(${this.discussionData.creator})</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">Created:</span>
                                <span>${createdDate}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">Contract:</span>
                                <code>${this.discussionData.address.slice(0, 10)}...</code>
                            </div>
                        </div>
                    </div>

                    <div class="discussion-description">
                        <p>${this.escapeHtml(this.discussionData.body)}</p>
                    </div>

                    <!-- Stats Grid -->
                    <div class="discussion-stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Total Pool</div>
                            <div class="stat-value">${poolFormatted} ETH</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Initial Value</div>
                            <div class="stat-value">${initialFormatted} ETH</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Messages</div>
                            <div class="stat-value">${this.discussionData.messageCount}/${this.discussionData.maxMessages}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Survivors</div>
                            <div class="stat-value">${this.discussionData.survivorCount}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Min Donation</div>
                            <div class="stat-value">${minDonationFormatted} ETH</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Max Msg Length</div>
                            <div class="stat-value">${this.discussionData.maxMessageLength} chars</div>
                        </div>
                    </div>
                </div>

                <!-- Post Message Section -->
                <div class="post-message-section">
                    <button id="toggle-post-form" class="btn-primary">
                        ✍️ Post Message
                    </button>
                    <div id="post-message-form-container" class="form-container hidden"></div>
                </div>

                <!-- Messages Section -->
                <div class="messages-section">
                    <h2 class="section-title">Messages (${this.discussionData.messageCount})</h2>
                    <div id="message-table-container"></div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize child components
     */
    async initializeComponents() {
        // Initialize message table
        this.messageTable = new MessageTable(
            this.discussionData.instance,
            this.web3Provider
        );
        
        const messageTableContainer = this.containerElement.querySelector('#message-table-container');
        if (messageTableContainer) {
            this.messageTable.setContainer(messageTableContainer);
            await this.messageTable.render();
        }

        // Initialize post message form
        this.postMessageForm = new PostMessageForm(
            this.discussionData.instance,
            this.web3Provider,
            this.discussionData
        );
        
        const formContainer = this.containerElement.querySelector('#post-message-form-container');
        if (formContainer) {
            this.postMessageForm.setContainer(formContainer);
            this.postMessageForm.render();
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Back button
        const backButton = this.containerElement.querySelector('#back-to-board');
        if (backButton) {
            backButton.addEventListener('click', () => {
                eventBus.emit('NAVIGATE_TO_BOARD');
            });
        }

        // Toggle post form
        const toggleButton = this.containerElement.querySelector('#toggle-post-form');
        const formContainer = this.containerElement.querySelector('#post-message-form-container');
        
        if (toggleButton && formContainer) {
            toggleButton.addEventListener('click', () => {
                const isHidden = formContainer.classList.contains('hidden');
                
                if (isHidden) {
                    // Check wallet connection
                    if (!this.web3Provider.currentAddress) {
                        eventBus.emit(EVENTS.TOAST, {
                            message: 'Please connect your wallet first',
                            type: 'warning'
                        });
                        return;
                    }
                    
                    formContainer.classList.remove('hidden');
                    toggleButton.textContent = '✖️ Cancel';
                } else {
                    formContainer.classList.add('hidden');
                    toggleButton.textContent = '✍️ Post Message';
                }
            });
        }

        // Listen for message posted event
        eventBus.on('MESSAGE_POSTED', async () => {
            console.log('Message posted, refreshing view...');
            
            // Hide form
            if (formContainer) {
                formContainer.classList.add('hidden');
            }
            if (toggleButton) {
                toggleButton.textContent = '✍️ Post Message';
            }
            
            // Refresh messages and header
            await this.refresh();
        });
    }

    /**
     * Refresh the view
     */
    async refresh() {
        try {
            // Reload discussion data
            await this.loadDiscussionData();
            
            // Update stats in header
            this.updateHeaderStats();
            
            // Refresh message table
            if (this.messageTable) {
                await this.messageTable.refresh();
            }
        } catch (error) {
            console.error('Failed to refresh discussion view:', error);
        }
    }

    /**
     * Update header statistics without full re-render
     */
    updateHeaderStats() {
        const pool = ethers.utils.formatEther(this.discussionData.totalPool);
        const poolFormatted = parseFloat(pool).toFixed(4);

        // Update pool
        const poolStat = this.containerElement.querySelector('.stat-card:nth-child(1) .stat-value');
        if (poolStat) poolStat.textContent = `${poolFormatted} ETH`;

        // Update message count
        const messageStat = this.containerElement.querySelector('.stat-card:nth-child(3) .stat-value');
        if (messageStat) messageStat.textContent = `${this.discussionData.messageCount}/${this.discussionData.maxMessages}`;

        // Update survivor count
        const survivorStat = this.containerElement.querySelector('.stat-card:nth-child(4) .stat-value');
        if (survivorStat) survivorStat.textContent = this.discussionData.survivorCount;

        // Update section title
        const sectionTitle = this.containerElement.querySelector('.section-title');
        if (sectionTitle) sectionTitle.textContent = `Messages (${this.discussionData.messageCount})`;
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

