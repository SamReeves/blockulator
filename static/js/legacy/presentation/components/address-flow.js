/**
 * AddressFlow Component - Animated chain visualization
 * Shows addresses flowing through with payouts
 */

import { DOMHelpers } from '../dom/dom-helpers.js';
import { rgbaFromHex, SDR_PALETTE } from '../../theme/sdr-palette.js';

export class AddressFlow {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.mode = options.mode || 'forward'; // 'forward' or 'backward'
        this.onUpdate = options.onUpdate || (() => {});
        
        this.addresses = [];
        this.maxVisible = 5;
        this.animationInterval = null;
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
        const title = this.mode === 'forward' ? 'Forward Chain' : 'Backward Chain';
        const arrow = this.mode === 'forward' ? '→' : '←';
        const color = this.mode === 'forward' ? SDR_PALETTE.particleEmerald : SDR_PALETTE.link;
        const surface = rgbaFromHex(SDR_PALETTE.bgCard, 0.95);
        const highlightBg = rgbaFromHex(color, 0.12);
        const highlightBorder = rgbaFromHex(color, 0.35);

        return `
            <div class="address-flow-container" style="position: relative; background: ${surface}; border: 1px solid ${SDR_PALETTE.border}; border-radius: 0; padding: 0.75rem; min-height: 200px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: ${color}; text-transform: uppercase; letter-spacing: 1px;">
                        ${arrow} ${title}
                    </div>
                    <div id="flow-stats" style="font-size: 0.7rem; opacity: 0.7;">
                        <span id="flow-count">0</span> donations
                    </div>
                </div>
                
                <!-- Flow visualization -->
                <div id="address-flow-list" style="display: flex; flex-direction: column; gap: 0.5rem; min-height: 150px;">
                    <!-- Addresses will be dynamically inserted here -->
                </div>
                
                <!-- Current pending/last donor highlight -->
                <div id="current-highlight" style="margin-top: 0.75rem; padding: 0.75rem; background: ${highlightBg}; border: 1px solid ${highlightBorder}; border-radius: 0; display: none;">
                    <div style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.25rem;">
                        ${this.mode === 'forward' ? '⏳ Pending' : '🎯 Last Donor'}
                    </div>
                    <div id="current-address" style="font-family: monospace; font-weight: bold; font-size: 0.85rem; color: ${color};">
                        —
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Update the current pending (forward) or last donor (backward)
     */
    updateCurrent(address, amount = null) {
        const highlightEl = document.getElementById('current-highlight');
        const addressEl = document.getElementById('current-address');
        
        if (!highlightEl || !addressEl) return;
        
        const isZero = address === '0x0000000000000000000000000000000000000000';
        
        if (isZero) {
            highlightEl.style.display = 'none';
        } else {
            highlightEl.style.display = 'block';
            const formatted = DOMHelpers.formatAddress(address);
            addressEl.innerHTML = amount ?
                `${formatted}<br><span style="font-size: 0.7rem; opacity: 0.8;">${amount}</span>` :
                formatted;
        }
    }
    
    /**
     * Add a new address to the flow (for event history)
     */
    addAddress(address, amount, type = 'donated') {
        this.addresses.unshift({
            address,
            amount,
            type,
            timestamp: Date.now()
        });
        
        // Keep only recent addresses
        if (this.addresses.length > this.maxVisible) {
            this.addresses = this.addresses.slice(0, this.maxVisible);
        }
        
        this.render();
        
        // Update stats
        const countEl = document.getElementById('flow-count');
        if (countEl) {
            const current = parseInt(countEl.textContent) || 0;
            countEl.textContent = current + 1;
        }
    }
    
    /**
     * Set multiple addresses at once (for initial load)
     */
    setAddresses(addresses) {
        this.addresses = addresses.slice(0, this.maxVisible);
        this.render();
        
        const countEl = document.getElementById('flow-count');
        if (countEl) {
            countEl.textContent = addresses.length;
        }
    }
    
    /**
     * Render the address list
     */
    render() {
        const listEl = document.getElementById('address-flow-list');
        if (!listEl) return;
        
        if (this.addresses.length === 0) {
            listEl.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 150px; opacity: 0.5; font-size: 0.85rem;">
                    No donations yet
                </div>
            `;
            return;
        }
        
        const color = this.mode === 'forward' ? SDR_PALETTE.particleEmerald : SDR_PALETTE.link;

        listEl.innerHTML = this.addresses.map((item, index) => {
            const opacity = 1 - (index * 0.15);
            const isRecent = (Date.now() - item.timestamp) < 3000;
            const animation = isRecent ? 'animation: slideInFade 0.5s ease-out;' : '';
            const rowBg = rgbaFromHex(color, 0.1 * opacity);

            return `
                <div class="address-flow-item" style="
                    padding: 0.5rem;
                    background: ${rowBg};
                    border-left: 1px solid ${color};
                    border-radius: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    opacity: ${opacity};
                    transition: all 0.3s;
                    ${animation}
                ">
                    <div style="min-width: 0; flex: 1;">
                        <div style="font-family: monospace; font-size: 0.75rem; font-weight: 500; color: ${color};">
                            ${DOMHelpers.formatAddress(item.address)}
                        </div>
                        <div style="font-size: 0.65rem; opacity: 0.7; margin-top: 0.1rem;">
                            ${this.getTimeAgo(item.timestamp)}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 0.7rem; font-weight: 600; color: ${color};">
                        ${item.amount}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
    
    /**
     * Start auto-updating time ago labels
     */
    startAutoUpdate() {
        this.animationInterval = setInterval(() => {
            this.render();
        }, 10000); // Update every 10 seconds
    }
    
    destroy() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
    }
}

// Add CSS animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFade {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

