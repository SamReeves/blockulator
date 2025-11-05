/**
 * Message Board Game
 * Pay to post messages on-chain with anti-spam protections
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class MessageBoard {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.gameType = 'message-board';
        this.messages = [];
        this.userStats = {
            postCount: 0,
            totalPaid: 0,
            lastPostTime: 0
        };
        this.config = {
            minimumFee: 0,
            rateLimitSeconds: 0,
            paused: false
        };
    }

    /**
     * Initialize the game
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Ensure wallet is connected
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            console.error('Cannot initialize game: Wallet not properly connected');
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return;
        }
        
        console.log('✅ Wallet confirmed:', web3Provider.currentAddress);
        
        // Load contract ABI and initialize contract
        try {
            const response = await fetch('/contracts/abis/message-board.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.MESSAGE_BOARD,
                abi
            );
            
            console.log('Message Board: Contract loaded at', CONTRACT_ADDRESSES.MESSAGE_BOARD);
            
        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game contract',
                type: 'error'
            });
            return;
        }
        
        // Render UI
        this.render();
        
        // Setup event listeners
        this.setupListeners();
        
        // Setup real-time contract event listeners
        this.setupContractEventListeners();
        
        // Load initial state from blockchain
        await this.refreshState();
    }

    /**
     * Render the game interface
     */
    render() {
        // Create custom interface for message board (not using standard game interface)
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Title and description header
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = '💬 Message Board';
        header.appendChild(title);
        
        const description = document.createElement('p');
        description.className = 'game-description';
        description.textContent = 'Post messages on-chain with anti-spam protection. Pay to post!';
        header.appendChild(description);
        
        container.appendChild(header);
        
        // Custom controls for message board
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'game-controls message-board-controls';
        controlsDiv.innerHTML = `
            <div class="input-group">
                <label for="message-content">Your Message</label>
                <textarea 
                    id="message-content" 
                    placeholder="Your message (max 280 chars)..."
                    maxlength="280"
                    rows="4"
                ></textarea>
                <div class="char-counter">
                    <span id="char-count">0</span> / 280
                </div>
            </div>
            <div class="input-group">
                <label for="message-fee">Posting Fee (wei)</label>
                <input 
                    type="number" 
                    id="message-fee" 
                    placeholder="Minimum: loading..."
                    min="0"
                    step="1"
                />
            </div>
            <button id="post-button" class="button-primary">Post Message</button>
        `;
        
        container.appendChild(controlsDiv);
        this.container.appendChild(container);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Board info panel
        const boardPanel = this.renderBoardInfo();
        sectionsContainer.appendChild(boardPanel);
        
        // User stats panel
        const userStatsPanel = this.renderUserStats();
        sectionsContainer.appendChild(userStatsPanel);
        
        // Recent messages panel
        const messagesPanel = this.renderRecentMessages();
        sectionsContainer.appendChild(messagesPanel);
        
        this.container.appendChild(sectionsContainer);
    }

    /**
     * Render board info panel
     */
    renderBoardInfo() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'board-info-panel';
        
        panel.innerHTML = `
            <h3>📋 Board Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Total Messages</div>
                    <div class="info-value" id="total-messages">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Collected</div>
                    <div class="info-value" id="total-collected">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Minimum Fee</div>
                    <div class="info-value" id="minimum-fee">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Rate Limit</div>
                    <div class="info-value" id="rate-limit">0s</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Board Status</div>
                    <div class="info-value" id="board-status">Active</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contract Balance</div>
                    <div class="info-value" id="contract-balance">0 wei</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render user statistics panel
     */
    renderUserStats() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'user-stats-panel';
        
        panel.innerHTML = `
            <h3>👤 Your Statistics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Messages Posted</div>
                    <div class="info-value" id="user-post-count">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Paid</div>
                    <div class="info-value" id="user-total-paid">0 wei</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Last Post</div>
                    <div class="info-value" id="user-last-post">Never</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Can Post In</div>
                    <div class="info-value" id="time-until-post">Now</div>
                </div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Render recent messages panel
     */
    renderRecentMessages() {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        panel.id = 'recent-messages-panel';
        
        panel.innerHTML = `
            <h3>📝 Recent Messages</h3>
            <div id="messages-list" class="messages-list">
                <div class="loading">Loading messages...</div>
            </div>
        `;
        
        return panel;
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        const postButton = document.getElementById('post-button');
        const messageContent = document.getElementById('message-content');
        const messageFee = document.getElementById('message-fee');
        const charCount = document.getElementById('char-count');
        
        // Character counter
        messageContent.addEventListener('input', () => {
            charCount.textContent = messageContent.value.length;
        });
        
        const handlePost = () => this.postMessage(messageContent.value, messageFee.value);
        
        postButton.addEventListener('click', handlePost);
        
        // Enter key support (Ctrl+Enter for textarea)
        messageContent.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                handlePost();
            }
        });
        
        // Store for cleanup
        this.eventListeners.push({ element: postButton, handler: handlePost });
    }

    /**
     * Post a message
     */
    async postMessage(content, weiAmount) {
        if (!content || content.trim().length === 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a message',
                type: 'warning'
            });
            return;
        }
        
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid fee amount',
                type: 'warning'
            });
            return;
        }
        
        if (parseFloat(weiAmount) < parseFloat(this.config.minimumFee)) {
            eventBus.emit(EVENTS.TOAST, {
                message: `Fee must be at least ${this.config.minimumFee} wei`,
                type: 'warning'
            });
            return;
        }
        
        try {
            GameRenderer.setLoading(true);
            
            console.log(`Posting message: "${content}" with fee: ${weiAmount} wei`);
            const tx = await this.contract.post_message(content, {
                value: ethers.BigNumber.from(weiAmount)
            });
            
            console.log('Transaction sent:', tx.hash);
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction sent, waiting for confirmation...',
                type: 'info'
            });
            
            // Wait for transaction confirmation
            await tx.wait();
            
            console.log('Transaction confirmed!');
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Message posted successfully!',
                type: 'success'
            });
            
            // Clear inputs
            document.getElementById('message-content').value = '';
            document.getElementById('message-fee').value = '';
            document.getElementById('char-count').textContent = '0';
            
            // Refresh state from blockchain
            await this.refreshState();
            
        } catch (error) {
            console.error('Post failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction failed: ' + (error.reason || error.message),
                type: 'error'
            });
        } finally {
            GameRenderer.setLoading(false);
        }
    }

    /**
     * Refresh game state from blockchain
     */
    async refreshState() {
        try {
            console.log('🔄 Refreshing state from contract...');
            
            // Get message count
            const messageCount = await this.contract.get_message_count();
            
            // Get config
            const config = await this.contract.get_config();
            const [minimumFee, rateLimitSeconds, paused] = config;
            
            this.config = {
                minimumFee: minimumFee.toString(),
                rateLimitSeconds: rateLimitSeconds.toNumber(),
                paused
            };
            
            // Update minimum fee placeholder
            const feeInput = document.getElementById('message-fee');
            if (feeInput) {
                feeInput.placeholder = `Minimum: ${minimumFee.toString()} wei`;
            }
            
            // Get total collected
            const totalCollected = await this.contract.total_collected();
            
            // Get contract balance
            const balance = await this.contract.get_balance();
            
            // Get user stats
            const userStats = await this.contract.get_user_stats(this.web3Provider.currentAddress);
            const [postCount, totalPaid, lastPostTime] = userStats;
            
            this.userStats = {
                postCount: postCount.toNumber(),
                totalPaid,
                lastPostTime: lastPostTime.toNumber()
            };
            
            // Get time until next post
            const timeUntilPost = await this.contract.get_time_until_next_post(this.web3Provider.currentAddress);
            
            // Get recent messages
            const recentCount = Math.min(messageCount.toNumber(), 20);
            if (recentCount > 0) {
                const recentMessages = await this.contract.get_recent_messages(recentCount);
                this.messages = recentMessages.map((msg, index) => ({
                    poster: msg.poster,
                    content: msg.content,
                    amount: msg.amount,
                    timestamp: msg.timestamp.toNumber(),
                    blockNumber: msg.block_number.toNumber(),
                    flagged: msg.flagged,
                    index: messageCount.toNumber() - recentCount + index
                }));
            } else {
                this.messages = [];
            }
            
            console.log('✅ Contract state loaded');
            
            // Update all UI panels
            this.updateBoardInfo(messageCount.toNumber(), totalCollected, balance);
            this.updateUserStatsPanel(timeUntilPost.toNumber());
            this.updateMessagesList();
            
            console.log('✅ State refresh complete!');
            
        } catch (error) {
            console.error('❌ Failed to refresh state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: `Failed to load game state: ${error.message}`,
                type: 'error'
            });
        }
    }

    /**
     * Setup real-time event listener for new messages
     */
    setupContractEventListeners() {
        if (!this.contract) return;
        
        // Listen for new MessagePosted events
        this.contract.on('MessagePosted', async (poster, messageId, amount, content, timestamp) => {
            console.log('New message posted!', {
                poster,
                messageId: messageId.toString(),
                amount: ethers.utils.formatEther(amount),
                content
            });
            
            const isYou = poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            eventBus.emit(EVENTS.TOAST, {
                message: isYou 
                    ? '✅ Your message was posted!' 
                    : `📝 New message from ${poster.slice(0, 6)}...`,
                type: 'success'
            });
            
            // Refresh state and UI
            await this.refreshState();
        });
    }

    /**
     * Update board info panel
     */
    updateBoardInfo(messageCount, totalCollected, balance) {
        // Total messages
        const messagesEl = document.getElementById('total-messages');
        if (messagesEl) {
            messagesEl.textContent = messageCount.toString();
        }
        
        // Total collected
        const collectedEl = document.getElementById('total-collected');
        if (collectedEl) {
            const collected = parseFloat(ethers.utils.formatEther(totalCollected));
            collectedEl.textContent = collected >= 0.01 
                ? `${collected.toFixed(4)} ETH` 
                : `${totalCollected.toString()} wei`;
        }
        
        // Minimum fee
        const minFeeEl = document.getElementById('minimum-fee');
        if (minFeeEl) {
            const minFee = parseFloat(ethers.utils.formatEther(this.config.minimumFee));
            minFeeEl.textContent = minFee >= 0.01 
                ? `${minFee.toFixed(4)} ETH` 
                : `${this.config.minimumFee} wei`;
        }
        
        // Rate limit
        const rateLimitEl = document.getElementById('rate-limit');
        if (rateLimitEl) {
            rateLimitEl.textContent = `${this.config.rateLimitSeconds}s`;
        }
        
        // Board status
        const statusEl = document.getElementById('board-status');
        if (statusEl) {
            if (this.config.paused) {
                statusEl.textContent = '⏸️ Paused';
                statusEl.style.color = 'var(--warning)';
            } else {
                statusEl.textContent = '✅ Active';
                statusEl.style.color = 'var(--success)';
            }
        }
        
        // Contract balance
        const balanceEl = document.getElementById('contract-balance');
        if (balanceEl) {
            const bal = parseFloat(ethers.utils.formatEther(balance));
            balanceEl.textContent = bal >= 0.01 
                ? `${bal.toFixed(4)} ETH` 
                : `${balance.toString()} wei`;
        }
    }

    /**
     * Update user statistics panel
     */
    updateUserStatsPanel(timeUntilPost) {
        // Post count
        const countEl = document.getElementById('user-post-count');
        if (countEl) {
            countEl.textContent = this.userStats.postCount.toString();
        }
        
        // Total paid
        const paidEl = document.getElementById('user-total-paid');
        if (paidEl) {
            const paid = parseFloat(ethers.utils.formatEther(this.userStats.totalPaid));
            paidEl.textContent = paid >= 0.01 
                ? `${paid.toFixed(4)} ETH` 
                : `${this.userStats.totalPaid.toString()} wei`;
        }
        
        // Last post time
        const lastPostEl = document.getElementById('user-last-post');
        if (lastPostEl) {
            if (this.userStats.lastPostTime === 0) {
                lastPostEl.textContent = 'Never';
            } else {
                const date = new Date(this.userStats.lastPostTime * 1000);
                lastPostEl.textContent = date.toLocaleString();
            }
        }
        
        // Time until next post
        const timeEl = document.getElementById('time-until-post');
        if (timeEl) {
            if (timeUntilPost === 0) {
                timeEl.textContent = 'Now';
                timeEl.style.color = 'var(--success)';
            } else {
                timeEl.textContent = `${timeUntilPost}s`;
                timeEl.style.color = 'var(--warning)';
            }
        }
    }

    /**
     * Update messages list
     */
    updateMessagesList() {
        const listEl = document.getElementById('messages-list');
        if (!listEl) return;
        
        if (this.messages.length === 0) {
            listEl.innerHTML = '<div class="no-data">No messages yet. Be the first to post!</div>';
            return;
        }
        
        // Build messages list (newest first)
        let html = '<div class="messages-container">';
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            const isYou = msg.poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            const date = new Date(msg.timestamp * 1000);
            const amount = parseFloat(ethers.utils.formatEther(msg.amount));
            
            html += `
                <div class="message-item ${isYou ? 'your-message' : ''} ${msg.flagged ? 'flagged' : ''}">
                    <div class="message-header">
                        <span class="message-poster ${isYou ? 'highlight' : ''}">
                            ${isYou ? '👤 YOU' : `${msg.poster.slice(0, 8)}...${msg.poster.slice(-6)}`}
                        </span>
                        <span class="message-amount">
                            ${amount >= 0.01 ? `${amount.toFixed(4)} ETH` : `${msg.amount.toString()} wei`}
                        </span>
                    </div>
                    <div class="message-content">
                        ${msg.flagged ? '<span class="flag">⚠️ Flagged</span> ' : ''}
                        ${this.escapeHtml(msg.content)}
                    </div>
                    <div class="message-footer">
                        <span class="message-time">${date.toLocaleString()}</span>
                        <span class="message-number">#${msg.index}</span>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        
        listEl.innerHTML = html;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners = [];
        
        // Remove contract event listeners
        if (this.contract) {
            this.contract.removeAllListeners('MessagePosted');
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

