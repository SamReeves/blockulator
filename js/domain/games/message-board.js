/**
 * Message Board - Minimalist
 * Pay to post messages on-chain
 * Domain layer - extends Game base class
 */

import { Game } from '../models/game.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class MessageBoard extends Game {
    getContractName() {
        return 'message-board';
    }

    render() {
        const header = GameRenderer.createGameHeader({
            title: '💬 Message Board',
            description: 'Post messages on-chain. Simple. Transparent.',
            contractAddress: CONTRACT_ADDRESSES.MESSAGE_BOARD,
            sourceFile: CONTRACT_SOURCES.MESSAGE_BOARD,
            abiFile: CONTRACT_ABIS.MESSAGE_BOARD
        });
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="game-sections">
                <!-- Post Message Panel -->
                <div class="contest-info-panel" style="border: 2px solid #3b82f6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #3b82f6;">
                        <span>✍️</span>
                        <span>Post Your Message</span>
                    </h3>
                    <div class="game-controls">
                        <div class="input-group" style="margin-top: 1rem;">
                            <label for="msg-content" style="font-weight: 600; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                                <span>Your Message</span>
                                <span class="char-counter" style="font-size: 0.875rem; color: var(--md-sys-color-outline);">
                                    <span id="char-count">0</span> / 280
                                </span>
                            </label>
                            <textarea 
                                id="msg-content"
                                class="message-input"
                                placeholder="Say something to the blockchain... it's permanent!"
                                maxlength="280"
                                rows="4"
                                style="width: 100%; padding: 1rem; background: var(--md-sys-color-surface); border: 2px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-small); color: var(--md-sys-color-on-surface); font-size: 1rem; resize: vertical; font-family: inherit; transition: border-color 0.2s;"
                                onfocus="this.style.borderColor='#3b82f6'"
                                onblur="this.style.borderColor='var(--md-sys-color-outline)'"
                            ></textarea>
                        </div>
                        <div class="input-group">
                            <label for="msg-fee" style="font-weight: 600; margin-bottom: 0.5rem; display: block;">Fee (wei)</label>
                            <input 
                                type="number" 
                                id="msg-fee" 
                                placeholder="Enter fee amount..."
                                min="0"
                                style="width: 100%; padding: 1rem; background: var(--md-sys-color-surface); border: 2px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-small); color: var(--md-sys-color-on-surface); font-size: 1.1rem; font-family: monospace; transition: border-color 0.2s;"
                                onfocus="this.style.borderColor='#3b82f6'"
                                onblur="this.style.borderColor='var(--md-sys-color-outline)'"
                            />
                        </div>
                        <button id="post-btn" class="btn-play" style="width: 100%; margin-top: 0.5rem; padding: 1rem; font-size: 1.1rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); transition: all 0.3s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                            📝 Post Message
                        </button>
                        
                        <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                                <span style="font-size: 1.5rem;">⚠️</span>
                                <strong style="font-size: 1.1rem; color: #f59e0b;">Important</strong>
                            </div>
                            <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
                                <li>Messages are stored on the blockchain FOREVER</li>
                                <li>Pay the minimum fee to post</li>
                                <li>Rate limit prevents spam (check your wait time below)</li>
                                <li>Max 280 characters per message</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Board Stats -->
                <div class="contest-info-panel" style="border: 2px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                        <span>📊</span>
                        <span>Board Statistics</span>
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                        <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 4px solid #10b981;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Total Messages</div>
                            <div id="msg-count" style="font-size: 1.5rem; font-weight: bold;">0</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 4px solid #10b981;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Total Collected</div>
                            <div id="total" style="font-size: 1.5rem; font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Minimum Fee</div>
                            <div id="min-fee" style="font-size: 1.5rem; font-weight: bold;">0 wei</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Rate Limit</div>
                            <div id="rate-limit" style="font-size: 1.5rem; font-weight: bold;">0s</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Your Last Post</div>
                            <div id="last-post" style="font-size: 1.25rem; font-weight: bold;">Never</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Can Post In</div>
                            <div id="wait-time" style="font-size: 1.25rem; font-weight: bold;">Now</div>
                        </div>
                    </div>
                </div>

                <!-- Messages Feed -->
                <div class="contest-info-panel" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>💬</span>
                        <span>Recent Messages</span>
                    </h3>
                    <div id="messages" style="max-height: 500px; overflow-y: auto; margin-top: 1rem; padding: 0.5rem;">
                        <div class="loading" style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">Loading messages...</div>
                    </div>
                </div>
            </div>
        `;
        
        gameContent.appendChild(contentInner);
        this.container.appendChild(gameContent);
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
        if (!this.requiresWallet('post messages')) return;
        
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
            await TransactionHandler.execute(
                this.contract.post_message(content, {
                    value: ethers.BigNumber.from(fee)
                }),
                { 
                    game: 'message-board', 
                    message: content, 
                    fee 
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
            document.getElementById('msg-fee').value = '';
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
            
            DOMHelpers.updateInfo('msg-count', count.toString());
            DOMHelpers.updateInfo('total', DOMHelpers.formatWei(total));
            
            const minFeeWei = minFee.toString();
            DOMHelpers.updateInfo('min-fee', minFeeWei + ' wei');
            
            const feeInput = document.getElementById('msg-fee');
            if (feeInput) {
                feeInput.placeholder = `Minimum: ${minFeeWei}`;
            }
            
            DOMHelpers.updateInfo('rate-limit', rateLimit.toString() + 's');
            
            if (this.web3Provider.isConnected() && this.web3Provider.currentAddress) {
                const [lastPost, waitTime] = await Promise.all([
                    this.contract.last_post_time(this.web3Provider.currentAddress),
                    this.contract.get_time_until_next_post(this.web3Provider.currentAddress)
                ]);
                
                DOMHelpers.updateInfo('last-post', DOMHelpers.formatTimestamp(lastPost.toNumber()));
                
                const wait = waitTime.toNumber();
                DOMHelpers.updateInfo('wait-time', 
                    wait === 0 ? 'Now ✅' : `${wait}s ⏳`
                );
            } else {
                DOMHelpers.updateInfo('last-post', '👀 Read-only');
                DOMHelpers.updateInfo('wait-time', 'Connect wallet');
            }
            
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
            
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                
                const msgEl = document.createElement('div');
                msgEl.className = 'message-item';
                msgEl.style.cssText = `
                    padding: 0.5rem;
                    margin-bottom: 0.35rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    border-left: 3px solid var(--primary);
                `;
                
                const isYourMessage = this.web3Provider.isConnected() && 
                    msg.poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                
                msgEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
                        <span style="font-family: monospace; font-size: 0.75rem; color: var(--primary);">
                            ${DOMHelpers.formatAddress(msg.poster)}
                            ${isYourMessage ? ' <strong>(You)</strong>' : ''}
                        </span>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">
                            ${DOMHelpers.formatTimestamp(msg.timestamp.toNumber())}
                        </span>
                    </div>
                    <div style="font-size: 0.875rem; line-height: 1.4; word-wrap: break-word; margin-bottom: 0.25rem;">
                        ${this.escapeHtml(msg.content)}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                        ${DOMHelpers.formatWei(msg.amount)}
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

        this.contract.on('MessagePosted', async (poster, messageId, amount, content, event) => {
            console.log('New message posted:', { poster, messageId: messageId.toString(), amount: amount.toString(), content });
            
            await this.refreshState();
            
            if (this.web3Provider.isConnected() && 
                poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase()) {
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
}

