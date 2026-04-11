/**
 * MessageFeed Component - Animated message timeline
 * Shows messages in a sleek, Twitter-like feed
 */

import { DOMHelpers } from '../dom/dom-helpers.js';
import { rgbaFromHex, SDR_PALETTE } from '../../theme/sdr-palette.js';

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
                background: ${SDR_PALETTE.bgCard};
                border: 1px solid ${SDR_PALETTE.border};
                border-radius: 0;
                padding: 0.75rem;
                max-height: 500px;
                overflow-y: auto;
                position: relative;
            ">
                <div id="message-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="text-align: center; padding: 2rem; color: var(--sdr-text-light); opacity: 0.7;">
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
                <div style="text-align: center; padding: 3rem 1rem; color: var(--sdr-text-light); opacity: 0.7;">
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
        const youBadge = isYou ? `<span style="background: ${SDR_PALETTE.particleEmerald}; color: ${SDR_PALETTE.textWhite}; padding: 0.15rem 0.4rem; border-radius: 0; font-size: 0.65rem; font-weight: 600; margin-left: 0.5rem; border: 1px solid ${SDR_PALETTE.border};">YOU</span>` : '';
        const otherTint = rgbaFromHex(SDR_PALETTE.particleSapphire, 0.08);
        const otherTintHi = rgbaFromHex(SDR_PALETTE.particleSapphire, 0.14);
        const youBg = rgbaFromHex(SDR_PALETTE.particleEmerald, 0.12);
        const youBgHi = rgbaFromHex(SDR_PALETTE.particleEmerald, 0.2);
        const borderOther = SDR_PALETTE.particleSapphire;

        return `
            <div class="message-item" style="
                background: ${isYou ? youBg : otherTint};
                border-left: 1px solid ${isYou ? SDR_PALETTE.particleEmerald : borderOther};
                border-radius: 0;
                padding: 0.75rem;
                transition: all 0.3s;
                ${animation}
            " onmouseenter="this.style.background='${isYou ? youBgHi : otherTintHi}'" onmouseleave="this.style.background='${isYou ? youBg : otherTint}'">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background: ${isYou ? SDR_PALETTE.particleEmerald : SDR_PALETTE.particleSapphire};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: ${SDR_PALETTE.textWhite};
                            font-weight: bold;
                            font-size: 0.75rem;
                            border: 1px solid ${SDR_PALETTE.border};
                        ">
                            ${this.getInitials(msg.poster)}
                        </div>
                        <div>
                            <div style="font-family: monospace; font-size: 0.75rem; color: ${isYou ? SDR_PALETTE.particleEmerald : SDR_PALETTE.particleSapphire}; font-weight: 600; display: flex; align-items: center;">
                                ${DOMHelpers.formatAddress(msg.poster)}
                                ${youBadge}
                            </div>
                            <div style="font-size: 0.65rem; color: var(--sdr-text-light); opacity: 0.8;">
                                ${this.formatTimestamp(msg.timestamp)}
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--sdr-text-light); opacity: 0.7;">
                        ${this.formatAmount(msg.amount)}
                    </div>
                </div>
                
                <!-- Content -->
                <div style="
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: var(--sdr-text-dark);
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
            background: color-mix(in srgb, var(--sdr-text-white) 5%, transparent);
            border-radius: 4px;
        }
        
        .message-feed-container::-webkit-scrollbar-thumb {
            background: color-mix(in srgb, var(--sdr-particle-sapphire) 30%, transparent);
            border-radius: 4px;
        }
        
        .message-feed-container::-webkit-scrollbar-thumb:hover {
            background: color-mix(in srgb, var(--sdr-particle-sapphire) 50%, transparent);
        }
    `;
    document.head.appendChild(style);
}

