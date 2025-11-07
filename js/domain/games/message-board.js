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
            <div class="game-controls">
                <div class="input-group">
                    <label for="msg-content">Your Message (max 280 chars)</label>
                    <textarea 
                        id="msg-content"
                        class="message-input"
                        placeholder="Say something..."
                        maxlength="280"
                        rows="4"
                    ></textarea>
                    <div class="char-counter">
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
                <button id="post-btn" class="btn-play">🎮 Play</button>
            </div>

            <div class="game-sections">
                <div class="contest-info-panel">
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
                    <div id="messages" style="max-height: 400px; overflow-y: auto;">
                        <div class="loading">Loading...</div>
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

