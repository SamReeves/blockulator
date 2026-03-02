/**
 * Message Board - Minimalist
 * Pay to post messages on-chain
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { MessageFeed } from '../../presentation/components/message-feed.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';

export class MessageBoard extends Game {
    constructor() {
        super();
        this.feeInput = null;
        this.messageFeed = null;
    }
    getContractName() {
        return 'message-board';
    }

    render() {
        // Clear container first to prevent duplicates
        this.container.innerHTML = '';
        
        const header = this.renderer.createGameHeader(this.metadata);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections" style="--panel-color: #3b82f6; --btn-color: #3b82f6;">
                <!-- Main Panel -->
                <div class="contest-info-panel game-panel">
                    <div class="flex-between" style="margin-bottom: 0.75rem;">
                        <h3 class="game-panel-header">
                            <span>💬</span>
                            <span>Message Board</span>
                        </h3>
                        <div style="font-size: 0.75rem;">
                            <span id="msg-count-badge">0</span> posts
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Post Form -->
                        <div class="min-w-0">
                            <textarea 
                                id="msg-content"
                                placeholder="Write something permanent..."
                                maxlength="280"
                                rows="3"
                                style="width: 100%; padding: 0.75rem; background: var(--md-sys-color-surface); border: 2px solid #3b82f6; border-radius: 6px; color: var(--md-sys-color-on-surface); font-size: 0.9rem; resize: vertical; font-family: inherit; margin-bottom: 0.5rem;"
                            ></textarea>
                            <div style="font-size: 0.7rem; opacity: 0.6; text-align: right; margin-bottom: 0.75rem;">
                                <span id="char-count">0</span>/280
                            </div>
                            
                            <div id="msg-fee-input" style="margin-bottom: 0.75rem;"></div>
                            
                            <button id="post-btn" class="btn-action">
                                💬 Post
                            </button>
                            
                            <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.7rem;">
                                <div class="stat-box" style="--stat-color: #10b981;">
                                    <div class="stat-box-label">Min Fee</div>
                                    <div id="min-fee" class="stat-box-value" style="font-size: 0.75rem;">0 wei</div>
                                </div>
                                <div class="stat-box" style="--stat-color: #8b5cf6;">
                                    <div class="stat-box-label">Can Post</div>
                                    <div id="wait-time" class="stat-box-value" style="font-size: 0.75rem;">Now</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right: Message Feed -->
                        <div class="min-w-0">
                            <div id="message-feed-container"></div>
                        </div>
                    </div>
                </div>

                <!-- How to Post -->
                <details class="contest-info-panel" open>
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📖 How to Post</span>
                    </summary>
                    <div style="margin-top: 1rem;">
                        <div class="strategy-callout" style="margin-bottom: 1rem;">
                            <strong>💬 Post messages permanently on-chain.</strong> Your message is stored forever in the blockchain.
                        </div>
                        
                        <div style="padding: 1rem; background: color-mix(in srgb, var(--panel-color) 5%, transparent); border-radius: 8px; font-size: 0.85rem;">
                            <strong style="display: block; margin-bottom: 0.5rem;">Rules:</strong>
                            • Maximum 280 characters per message<br>
                            • Minimum fee set by contract (shown above)<br>
                            • Rate limit prevents spam (cooldown between posts)<br>
                            • Messages are permanent and uncensored
                        </div>
                    </div>
                </details>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
        
        // Initialize MessageFeed component
        this.messageFeed = new MessageFeed('message-feed-container', {
            maxVisible: 10,
            currentAddress: this.web3Provider?.currentAddress
        });
        this.messageFeed.init();
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
        
        // Initialize ValueInput component
        this.feeInput = new this.components.ValueInput('msg-fee-input', {
            label: 'Fee',
            hint: 'Minimum fee set by contract',
            defaultUnit: 'gwei',
            minWei: '0', // Will be updated from contract
            required: true
        });
        this.feeInput.render();
    }

    async post() {
        if (!this.requiresWallet('post messages')) return;
        
        const content = document.getElementById('msg-content').value.trim();
        const fee = this.feeInput.getWeiValue();
        
        if (!content) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Please enter a message',
                type: 'warning'
            });
            return;
        }
        
        if (!fee || fee.lte(0)) {
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Please enter a fee',
                type: 'warning'
            });
            return;
        }
        
        try {
            await TransactionHandler.execute(
                this.contract.post_message(content, { value: fee }),
                { 
                    game: 'message-board', 
                    message: content, 
                    fee: fee.toString() 
                },
                (isLoading) => {
                    const btn = document.getElementById('post-btn');
                    if (btn) {
                        btn.disabled = isLoading;
                        btn.textContent = isLoading ? '⏳ Posting...' : '💬 Post';
                    }
                }
            );
            
            document.getElementById('msg-content').value = '';
            this.feeInput.reset();
            document.getElementById('char-count').textContent = '0';
            
            await this.refreshState();
            
        } catch (error) {
            console.error('Post failed:', error);
        }
    }

    async refreshState() {
        if (!this.contract) return;
        
        try {
            const [count, total, minFee, rateLimit] = await Promise.all([
                this.contract.get_message_count(),
                this.contract.total_collected(),
                this.contract.minimum_post_fee(),
                this.contract.rate_limit_seconds()
            ]);
            
            // Update message count badge
            const badge = document.getElementById('msg-count-badge');
            if (badge) badge.textContent = count.toString();
            
            const minFeeWei = minFee.toString();
            this.dom.updateInfo('min-fee', this.dom.formatWei(minFee));
            
            // Update ValueInput minimum
            if (this.feeInput && minFee) {
                this.feeInput.setMinimum(minFeeWei);
            }
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const [lastPost, waitTime] = await Promise.all([
                    this.contract.last_post_time(this.web3Provider.currentAddress),
                    this.contract.get_time_until_next_post(this.web3Provider.currentAddress)
                ]);

                const wait = waitTime.toNumber();
                this.dom.updateInfo('wait-time', 
                    wait === 0 ? 'Now ✅' : `${wait}s ⏳`
                );
            } else {
                this.dom.updateInfo('wait-time', 'Connect wallet');
            }
            
            await this.loadMessages(count.toNumber());
            
        } catch (error) {
            console.error('Failed to load state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load message board state',
                type: 'error'
            });
        }
    }

    async loadMessages(msgCount) {
        if (!this.messageFeed) return;
        
        if (msgCount === 0) {
            this.messageFeed.setMessages([]);
            return;
        }
        
        try {
            const recent = Math.min(msgCount, 20);
            const messages = await this.contract.get_recent_messages(recent);
            
            // Update message feed with current address
            this.messageFeed.updateCurrentAddress(this.web3Provider?.currentAddress);
            this.messageFeed.setMessages(messages);
            
            // Update badge
            const badge = document.getElementById('msg-count-badge');
            if (badge) badge.textContent = msgCount;
            
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.messageFeed.setMessages([]);
        }
    }

    setupContractEvents() {
        if (!this.contract) return;

        this.contract.on('MessagePosted', async (poster, messageId, amount, content, event) => {
            console.log('New message posted:', { poster, messageId: messageId.toString(), amount: amount.toString(), content });
            
            // Add message to feed immediately
            if (this.messageFeed) {
                this.messageFeed.addMessage({
                    poster,
                    content,
                    amount,
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }
            
            await this.refreshState();
            
            if (this.web3Provider.isConnected() && 
                poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
                this.events.bus.emit(this.events.EVENTS.TOAST, {
                    message: 'Message posted successfully',
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
}

