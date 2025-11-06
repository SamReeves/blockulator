/**
 * Message Board - Minimalist
 * Pay to post messages on-chain
 */

import { ContractLoader } from '../core/contract-loader.js';
import { TransactionHandler } from '../core/transaction-handler.js';
import { DOMHelpers } from '../core/dom-helpers.js';
import { eventBus, EVENTS } from '../ui/events.js';

export class MessageBoard {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'message-board';
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract using utility
        this.contract = await ContractLoader.load('message-board', web3Provider);
        if (!this.contract) return;
        
        this.render();
        this.setupListeners();
        this.setupContractEvents();
        await this.loadState();
    }

    render() {
        this.container.innerHTML = `
            <div class="game-interface">
                <div class="game-header">
                    <h2 class="game-title">💬 Message Board</h2>
                    <p class="game-description">Post messages on-chain. Simple. Transparent.</p>
                </div>

                <div class="game-controls">
                    <div class="input-group">
                        <label for="msg-content">Your Message (max 280 chars)</label>
                        <textarea 
                            id="msg-content" 
                            placeholder="Say something..."
                            maxlength="280"
                            rows="3"
                        ></textarea>
                        <div style="text-align: right; font-size: 0.875rem; color: var(--text-muted);">
                            <span id="char-count">0</span> / 280
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="msg-fee">Fee (wei)</label>
                        <input 
                            type="number" 
                            id="msg-fee" 
                            placeholder="Minimum..."
                            min="0"
                        />
                    </div>
                    <button id="post-btn" class="button-primary">Post Message</button>
                </div>

                <div class="game-sections">
                    <div class="contest-info-panel">
                        <h3>📊 Stats</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Total Messages</div>
                                <div class="info-value" id="msg-count">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total Collected</div>
                                <div class="info-value" id="total">0 wei</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Minimum Fee</div>
                                <div class="info-value" id="min-fee">0 wei</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Rate Limit</div>
                                <div class="info-value" id="rate-limit">0s</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Your Last Post</div>
                                <div class="info-value" id="last-post">Never</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Can Post In</div>
                                <div class="info-value" id="wait-time">Now</div>
                            </div>
                        </div>
                    </div>

                    <div class="contest-info-panel">
                        <h3>📝 Recent Messages</h3>
                        <div id="messages" style="max-height: 500px; overflow-y: auto;">
                            <div class="loading">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupListeners() {
        const content = document.getElementById('msg-content');
        const charCount = document.getElementById('char-count');
        const postBtn = document.getElementById('post-btn');
        
        if (content && charCount) {
            content.addEventListener('input', () => {
                charCount.textContent = content.value.length;
            });
        }
        
        if (postBtn) {
            postBtn.addEventListener('click', () => this.post());
        }
    }

    async post() {
        const content = document.getElementById('msg-content').value.trim();
        const fee = document.getElementById('msg-fee').value;
        
        if (!content) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a message',
                type: 'warning'
            });
            return;
        }
        
        if (!fee || fee <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a fee',
                type: 'warning'
            });
            return;
        }
        
        try {
            // Use TransactionHandler utility
            await TransactionHandler.execute(
                this.contract.post_message(content, {
                    value: ethers.BigNumber.from(fee)
                }),
                { 
                    game: 'message-board', 
                    message: content, 
                    fee 
                }
            );
            
            // Clear inputs
            document.getElementById('msg-content').value = '';
            document.getElementById('msg-fee').value = '';
            document.getElementById('char-count').textContent = '0';
            
            // Refresh state
            await this.loadState();
            
        } catch (error) {
            // Error already handled by TransactionHandler
            console.error('Post failed:', error);
        }
    }

    async loadState() {
        if (!this.contract) return;
        
        try {
            // Load all data in parallel using DOMHelpers
            const [count, total, minFee, rateLimit, lastPost, waitTime] = await Promise.all([
                this.contract.get_message_count(),
                this.contract.total_collected(),
                this.contract.minimum_post_fee(),
                this.contract.rate_limit_seconds(),
                this.contract.last_post_time(this.web3Provider.currentAddress),
                this.contract.get_time_until_next_post(this.web3Provider.currentAddress)
            ]);
            
            // Update stats using DOMHelpers
            DOMHelpers.updateInfo('msg-count', count.toString());
            DOMHelpers.updateInfo('total', DOMHelpers.formatWei(total));
            
            const minFeeWei = minFee.toString();
            DOMHelpers.updateInfo('min-fee', minFeeWei + ' wei');
            
            const feeInput = document.getElementById('msg-fee');
            if (feeInput) {
                feeInput.placeholder = `Minimum: ${minFeeWei}`;
            }
            
            DOMHelpers.updateInfo('rate-limit', rateLimit.toString() + 's');
            DOMHelpers.updateInfo('last-post', DOMHelpers.formatTimestamp(lastPost.toNumber()));
            
            const wait = waitTime.toNumber();
            DOMHelpers.updateInfo('wait-time', 
                wait === 0 ? 'Now ✅' : `${wait}s ⏳`
            );
            
            // Load recent messages
            await this.loadMessages(count.toNumber());
            
        } catch (error) {
            console.error('Failed to load state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load message board state',
                type: 'error'
            });
        }
    }

    async loadMessages(msgCount) {
        const messagesDiv = document.getElementById('messages');
        if (!messagesDiv) return;
        
        if (msgCount === 0) {
            messagesDiv.innerHTML = '<div class="loading">No messages yet. Be the first!</div>';
            return;
        }
        
        try {
            const recent = Math.min(msgCount, 20);
            const messages = await this.contract.get_recent_messages(recent);
            
            messagesDiv.innerHTML = '';
            
            // Display messages in reverse (newest first)
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                
                const msgEl = document.createElement('div');
                msgEl.className = 'message-item';
                msgEl.style.cssText = `
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    border-left: 3px solid var(--primary);
                `;
                
                const isYourMessage = msg.poster.toLowerCase() === 
                    this.web3Provider.currentAddress.toLowerCase();
                
                msgEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <span style="font-family: monospace; font-size: 0.875rem; color: var(--primary);">
                            ${DOMHelpers.formatAddress(msg.poster)}
                            ${isYourMessage ? ' <strong>(You)</strong>' : ''}
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">
                            ${DOMHelpers.formatTimestamp(msg.timestamp.toNumber())}
                        </span>
                    </div>
                    <div style="font-size: 0.95rem; line-height: 1.5; word-wrap: break-word;">
                        ${this.escapeHtml(msg.content)}
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                        Fee: ${DOMHelpers.formatWei(msg.amount)}
                    </div>
                `;
                
                messagesDiv.appendChild(msgEl);
            }
            
        } catch (error) {
            console.error('Failed to load messages:', error);
            messagesDiv.innerHTML = '<div class="loading">Failed to load messages</div>';
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        // Listen for new messages
        // Event signature: MessagePosted(poster: indexed(address), message_id: indexed(uint256), amount: uint256, content: String[280])
        this.contract.on('MessagePosted', async (poster, messageId, amount, content, event) => {
            console.log('New message posted:', { poster, messageId: messageId.toString(), amount: amount.toString(), content });
            
            // Refresh state and messages
            await this.loadState();
            
            // Show notification if it's from current user
            if (poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                eventBus.emit(EVENTS.TOAST, {
                    message: '✅ Message posted successfully!',
                    type: 'success'
                });
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}
