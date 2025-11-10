/**
 * Message Board - Minimalist
 * Pay to post messages on-chain
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { MessageFeed } from '../../presentation/components/message-feed.js';

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
            <div class="game-sections">
                <!-- Main Panel -->
                <div class="contest-info-panel" style="border: 2px solid #3b82f6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #3b82f6; margin: 0;">
                            <span>💬</span>
                            <span>Message Board</span>
                        </h3>
                        <div style="font-size: 0.75rem; color: #3b82f6;">
                            <span id="msg-count-badge">0</span> posts
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start;">
                        <!-- Left: Post Form -->
                        <div style="min-width: 0;">
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
                            
                            <button id="post-btn" class="btn-play" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                                💬 Post
                            </button>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.7rem;">
                                <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 4px;">
                                    <div style="opacity: 0.7; margin-bottom: 0.2rem;">Min Fee</div>
                                    <div id="min-fee" style="font-weight: bold; font-size: 0.75rem;">0 wei</div>
                                </div>
                                <div style="padding: 0.5rem; background: rgba(139, 92, 246, 0.1); border-radius: 4px;">
                                    <div style="opacity: 0.7; margin-bottom: 0.2rem;">Can Post</div>
                                    <div id="wait-time" style="font-weight: bold; font-size: 0.75rem;">Now</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right: Message Feed -->
                        <div style="min-width: 0;">
                            <div id="message-feed-container"></div>
                        </div>
                    </div>
                </div>

                <!-- Owner Panel (only visible to owner) -->
                <div id="owner-panel" class="contest-info-panel" style="border: 2px solid #ef4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%); display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="color: #ef4444; margin: 0; font-size: 0.9rem;">⚙️ Owner</h3>
                        <span id="contract-balance" style="font-weight: bold; font-size: 0.85rem;">0 wei</span>
                    </div>
                    <button id="withdraw-btn" class="btn-secondary" style="width: 100%; padding: 0.6rem; font-size: 0.85rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; margin-top: 0.5rem;">
                        💰 Withdraw
                    </button>
                </div>
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
            hint: 'Fee to post your message',
            defaultUnit: 'gwei',
            minWei: '0',
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
        
        if (!fee || fee <= 0) {
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
                        btn.textContent = isLoading ? '⏳ Posting...' : '🎮 Play';
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
            
            this.dom.updateInfo('msg-count', count.toString());
            this.dom.updateInfo('total', this.dom.formatWei(total));
            
            // Update message count badge
            const badge = document.getElementById('msg-count-badge');
            if (badge) badge.textContent = count.toString();
            
            const minFeeWei = minFee.toString();
            this.dom.updateInfo('min-fee', minFeeWei + ' wei');
            
            const feeInput = document.getElementById('msg-fee');
            if (feeInput) {
                feeInput.placeholder = `Minimum: ${minFeeWei}`;
            }
            
            this.dom.updateInfo('rate-limit', rateLimit.toString() + 's');
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const [lastPost, waitTime] = await Promise.all([
                    this.contract.last_post_time(this.web3Provider.currentAddress),
                    this.contract.get_time_until_next_post(this.web3Provider.currentAddress)
                ]);
                
                this.dom.updateInfo('last-post', this.dom.formatTimestamp(lastPost.toNumber()));
                
                const wait = waitTime.toNumber();
                this.dom.updateInfo('wait-time', 
                    wait === 0 ? 'Now ✅' : `${wait}s ⏳`
                );
            } else {
                this.dom.updateInfo('last-post', '👀 Read-only');
                this.dom.updateInfo('wait-time', 'Connect wallet');
            }
            
            await this.loadMessages(count.toNumber());
            
            // Check owner status and update owner panel
            await this.checkOwnerAccess();
            
        } catch (error) {
            console.error('Failed to load state:', error);
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: 'Failed to load message board state',
                type: 'error'
            });
        }
    }
    
    async checkOwnerAccess() {
        try {
            const owner = await this.contract.owner();
            const ownerPanel = document.getElementById('owner-panel');
            
            if (!ownerPanel) return;
            
            // Show owner panel if current user is owner
            if (this.web3Provider?.currentAddress && 
                this.web3Provider.currentAddress.toLowerCase() === owner.toLowerCase()) {
                ownerPanel.style.display = 'block';
                
                // Get contract balance
                const balance = await this.web3Provider.provider.getBalance(this.contract.address);
                this.dom.updateInfo('contract-balance', this.dom.formatWei(balance));
                
                // Setup withdraw button listener
                const withdrawBtn = document.getElementById('withdraw-btn');
                if (withdrawBtn) {
                    withdrawBtn.replaceWith(withdrawBtn.cloneNode(true));
                    document.getElementById('withdraw-btn').addEventListener('click', () => this.withdraw());
                }
            } else {
                ownerPanel.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to check owner access:', error);
        }
    }
    
    async withdraw() {
        if (!this.requiresWallet('withdraw fees')) return;
        
        try {
            await TransactionHandler.execute(
                this.contract.withdraw(),
                { game: 'message-board', action: 'withdraw' }
            );
            
            this.events.bus.emit(this.events.EVENTS.TOAST, {
                message: '✅ Fees withdrawn successfully',
                type: 'success'
            });
            
            await this.refreshState();
        } catch (error) {
            console.error('Withdraw failed:', error);
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
}

