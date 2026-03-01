/**
 * MessageFeed Component - Animated message timeline
 * Shows messages in a sleek, Twitter-like feed
 */

import { DOMHelpers } from '../dom/dom-helpers.js';

export class MessageFeed {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.messages = [];
        this.maxVisible = options.maxVisible || 20;
        this.currentAddress = options.currentAddress || null;
        this.onLoad = options.onLoad || (() => {});
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
    }
    
    getHTML() {
        return `
            <div class="message-feed-container" style="
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
                border-radius: 8px;
                padding: 0.75rem;
                max-height: 500px;
                overflow-y: auto;
                position: relative;
            ">
                <div id="message-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant); opacity: 0.7;">
                        💬 Loading messages...
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set messages to display
     */
    setMessages(messages) {
        this.messages = messages.slice(0, this.maxVisible);
        this.render();
    }
    
    /**
     * Add a new message (typically from event)
     */
    addMessage(message) {
        this.messages.unshift(message);
        if (this.messages.length > this.maxVisible) {
            this.messages = this.messages.slice(0, this.maxVisible);
        }
        this.render();
    }
    
    /**
     * Update current user address for highlighting
     */
    updateCurrentAddress(address) {
        this.currentAddress = address;
        this.render();
    }
    
    /**
     * Render the message list
     */
    render() {
        const listEl = document.getElementById('message-list');
        if (!listEl) return;
        
        if (this.messages.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--md-sys-color-on-surface-variant); opacity: 0.7;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">💬</div>
                    <div style="font-size: 0.9rem;">No messages yet</div>
                    <div style="font-size: 0.8rem; margin-top: 0.25rem;">Be the first to post!</div>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = this.messages.map((msg, index) => {
            const isYou = this.currentAddress && 
                         msg.poster.toLowerCase() === this.currentAddress.toLowerCase();
            const isRecent = index === 0; // First message is most recent
            
            return this.renderMessage(msg, isYou, isRecent);
        }).join('');
    }
    
    renderMessage(msg, isYou, isRecent) {
        const animation = isRecent ? 'animation: messageSlideIn 0.5s ease-out;' : '';
        const youBadge = isYou ? '<span style="background: #10b981; color: white; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.65rem; font-weight: 600; margin-left: 0.5rem;">YOU</span>' : '';
        
        return `
            <div class="message-item" style="
                background: ${isYou ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.05)'};
                border-left: 3px solid ${isYou ? '#10b981' : '#3b82f6'};
                border-radius: 6px;
                padding: 0.75rem;
                transition: all 0.3s;
                ${animation}
            " onmouseenter="this.style.background='${isYou ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.08)'}'" onmouseleave="this.style.background='${isYou ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.05)'}'">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, ${isYou ? '#10b981' : '#3b82f6'} 0%, ${isYou ? '#059669' : '#2563eb'} 100%);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 0.75rem;
                        ">
                            ${this.getInitials(msg.poster)}
                        </div>
                        <div>
                            <div style="font-family: monospace; font-size: 0.75rem; color: ${isYou ? '#10b981' : '#3b82f6'}; font-weight: 600; display: flex; align-items: center;">
                                ${DOMHelpers.formatAddress(msg.poster)}
                                ${youBadge}
                            </div>
                            <div style="font-size: 0.65rem; color: var(--md-sys-color-on-surface-variant); opacity: 0.8;">
                                ${this.formatTimestamp(msg.timestamp)}
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); opacity: 0.7;">
                        ${this.formatAmount(msg.amount)}
                    </div>
                </div>
                
                <!-- Content -->
                <div style="
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: var(--md-sys-color-on-surface);
                    word-wrap: break-word;
                    padding-left: 2.5rem;
                ">
                    ${this.escapeHtml(msg.content)}
                </div>
            </div>
        `;
    }
    
    getInitials(address) {
        if (!address || address.length < 4) return '?';
        return address.slice(2, 4).toUpperCase();
    }
    
    
    formatTimestamp(timestamp) {
        const num = typeof timestamp === 'number' ? timestamp : timestamp.toNumber?.() || parseInt(timestamp);
        const date = new Date(num * 1000);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        
        if (diffSeconds < 60) return 'just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }
    
    formatAmount(amount) {
        const weiStr = amount.toString?.() || String(amount);
        const wei = BigInt(weiStr);
        
        if (wei < 1000n) return `${wei} wei`;
        if (wei < 1000000n) return `${Number(wei) / 1000} Kwei`;
        if (wei < 1000000000n) return `${Number(wei) / 1000000} Mwei`;
        if (wei < 1000000000000n) return `${Number(wei) / 1000000000} Gwei`;
        
        return `${Number(wei) / 1000000000000000000} ETH`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message-feed-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .message-feed-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
        }
        
        .message-feed-container::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.3);
            border-radius: 4px;
        }
        
        .message-feed-container::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.5);
        }
    `;
    document.head.appendChild(style);
}

