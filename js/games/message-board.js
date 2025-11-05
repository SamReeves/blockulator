/**
 * Message Board - Minimalist
 * Pay to post messages on-chain
 */

import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

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
        
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return;
        }
        
        try {
            const response = await fetch('/contracts/abis/message-board.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.MESSAGE_BOARD,
                abi
            );
            
            console.log('✅ Message Board loaded');
            
        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load contract',
                type: 'error'
            });
            return;
        }
        
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
        
        content.addEventListener('input', () => {
            charCount.textContent = content.value.length;
        });
        
        postBtn.addEventListener('click', () => this.post());
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
            eventBus.emit(EVENTS.TOAST, {
                message: 'Posting...',
                type: 'info'
            });
            
            const tx = await this.contract.post_message(content, {
                value: ethers.BigNumber.from(fee)
            });
            
            await tx.wait();
            
            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Message posted!',
                type: 'success'
            });
            
            document.getElementById('msg-content').value = '';
            document.getElementById('msg-fee').value = '';
            document.getElementById('char-count').textContent = '0';
            
            await this.loadState();
            
        } catch (error) {
            console.error('Post failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed: ' + (error.reason || error.message),
                type: 'error'
            });
        }
    }

    async loadState() {
        try {
            // Load all data in parallel
            const [count, total, minFee, rateLimit, lastPost, waitTime] = await Promise.all([
                this.contract.get_message_count(),
                this.contract.total_collected(),
                this.contract.minimum_post_fee(),
                this.contract.rate_limit_seconds(),
                this.contract.last_post_time(this.web3Provider.currentAddress),
                this.contract.get_time_until_next_post(this.web3Provider.currentAddress)
            ]);
            
            // Update stats
            document.getElementById('msg-count').textContent = count.toString();
            
            const totalEth = parseFloat(ethers.utils.formatEther(total));
            document.getElementById('total').textContent = totalEth >= 0.001 
                ? `${totalEth.toFixed(4)} ETH` 
                : `${total.toString()} wei`;
            
            const minFeeWei = minFee.toString();
            document.getElementById('min-fee').textContent = minFeeWei + ' wei';
            document.getElementById('msg-fee').placeholder = `Minimum: ${minFeeWei}`;
            
            document.getElementById('rate-limit').textContent = rateLimit.toString() + 's';
            
            if (lastPost.toNumber() > 0) {
                const date = new Date(lastPost.toNumber() * 1000);
                document.getElementById('last-post').textContent = date.toLocaleString();
            } else {
                document.getElementById('last-post').textContent = 'Never';
            }
            
            const wait = waitTime.toNumber();
            document.getElementById('wait-time').textContent = wait === 0 ? 'Now ✅' : `${wait}s ⏳`;
            
            // Load recent messages
            const msgCount = count.toNumber();
            if (msgCount > 0) {
                const recent = Math.min(msgCount, 20);
                const messages = await this.contract.get_recent_messages(recent);
                this.displayMessages(messages);
            } else {
                document.getElementById('messages').innerHTML = 
                    '<div class="no-data">No messages yet. Be the first!</div>';
            }
            
        } catch (error) {
            console.error('Failed to load state:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load data: ' + error.message,
                type: 'error'
            });
        }
    }

    displayMessages(messages) {
        const container = document.getElementById('messages');
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="no-data">No messages</div>';
            return;
        }
        
        // Newest first
        const reversed = [...messages].reverse();
        const userAddr = this.web3Provider.currentAddress.toLowerCase();
        
        container.innerHTML = reversed.map(msg => {
            const isYou = msg.poster.toLowerCase() === userAddr;
            const date = new Date(msg.timestamp.toNumber() * 1000);
            const amount = parseFloat(ethers.utils.formatEther(msg.amount));
            
            return `
                <div class="message-item ${isYou ? 'your-message' : ''}" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: ${isYou ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600; ${isYou ? 'color: var(--success);' : ''}">
                            ${isYou ? '👤 YOU' : `${msg.poster.slice(0,6)}...${msg.poster.slice(-4)}`}
                        </span>
                        <span style="color: var(--secondary); font-weight: 600;">
                            ${amount >= 0.001 ? `${amount.toFixed(4)} ETH` : `${msg.amount.toString()} wei`}
                        </span>
                    </div>
                    <div style="margin-bottom: 0.5rem; line-height: 1.6;">
                        ${this.escape(msg.content)}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">
                        ${date.toLocaleString()}
                    </div>
                </div>
            `;
        }).join('');
    }

    setupContractEvents() {
        this.contract.on('MessagePosted', (poster, messageId, amount) => {
            const isYou = poster.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            eventBus.emit(EVENTS.TOAST, {
                message: isYou ? '✅ Your message posted!' : '📝 New message',
                type: 'success'
            });
            
            this.loadState();
        });
    }

    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
