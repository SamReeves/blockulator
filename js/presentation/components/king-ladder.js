/**
 * KingLadder Component - Vertical tournament-style king history
 * Shows recent kings in a clean ladder format
 */

import { DOMHelpers } from '../dom/dom-helpers.js';
import { rgbaFromHex, SDR_PALETTE } from '../../theme/sdr-palette.js';

export class KingLadder {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.kings = [];
        this.currentKing = null;
        this.currentAddress = options.currentAddress || null;
        this.maxVisible = options.maxVisible || 10;
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
            <div class="king-ladder-container" style="
                background: ${SDR_PALETTE.bgCard};
                border: 1px solid ${SDR_PALETTE.border};
                border-radius: 0;
                padding: 0.75rem;
                min-height: 300px;
                position: relative;
            ">
                <!-- Current King at top -->
                <div id="current-king-display" style="
                    background: ${SDR_PALETTE.bgDark};
                    color: ${SDR_PALETTE.textWhite};
                    padding: 0.75rem;
                    border-radius: 0;
                    border: 1px solid ${SDR_PALETTE.border};
                    margin-bottom: 0.75rem;
                    text-align: center;
                ">
                    <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">👑</div>
                    <div style="font-size: 0.65rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem;">Current King</div>
                    <div id="king-address-display" style="font-family: monospace; font-size: 0.85rem; font-weight: bold;">
                        —
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.7rem;">
                        <div>
                            <div style="opacity: 0.7;">Prize</div>
                            <div id="king-prize" style="font-weight: bold;">0 wei</div>
                        </div>
                        <div>
                            <div style="opacity: 0.7;">Reign</div>
                            <div id="king-reign" style="font-weight: bold;">0s</div>
                        </div>
                    </div>
                </div>
                
                <!-- Ladder rungs -->
                <div style="font-size: 0.7rem; font-weight: 600; margin-bottom: 0.5rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">
                    Recent Kings
                </div>
                <div id="ladder-rungs" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="text-align: center; padding: 2rem 1rem; color: var(--md-sys-color-on-surface-variant); opacity: 0.5;">
                        No history yet
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Update current king info
     */
    updateCurrentKing(data) {
        const { address, prize, reignDuration, isYou } = data;
        
        this.currentKing = address;
        
        const addressDisplay = document.getElementById('king-address-display');
        const prizeDisplay = document.getElementById('king-prize');
        const reignDisplay = document.getElementById('king-reign');
        
        if (!addressDisplay || !prizeDisplay || !reignDisplay) return;
        
        const isZero = !address || address === '0x0000000000000000000000000000000000000000';
        
        if (isZero) {
            addressDisplay.innerHTML = '<span style="opacity: 0.7;">Vacant</span>';
        } else {
            const youBadge = isYou ? ` <span style="background: ${SDR_PALETTE.particleGold}; color: ${SDR_PALETTE.bgDarker}; padding: 0.1rem 0.3rem; border-radius: 0; font-size: 0.65rem; font-weight: 700; border: 1px solid ${SDR_PALETTE.border};">YOU</span>` : '';
            addressDisplay.innerHTML = DOMHelpers.formatAddress(address) + youBadge;
        }
        
        prizeDisplay.textContent = prize;
        reignDisplay.textContent = DOMHelpers.formatDuration(reignDuration);
    }
    
    /**
     * Set the ladder history
     */
    setKings(kings) {
        this.kings = kings.slice(0, this.maxVisible);
        this.renderLadder();
    }
    
    /**
     * Update current user address
     */
    updateCurrentAddress(address) {
        this.currentAddress = address;
        this.renderLadder();
    }
    
    /**
     * Render the ladder rungs
     */
    renderLadder() {
        const rungsEl = document.getElementById('ladder-rungs');
        if (!rungsEl) return;
        
        if (this.kings.length === 0) {
            rungsEl.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem; color: var(--md-sys-color-on-surface-variant); opacity: 0.5; font-size: 0.8rem;">
                    No previous kings yet
                </div>
            `;
            return;
        }
        
        rungsEl.innerHTML = this.kings.map((king, index) => {
            const isYou = this.currentAddress && 
                         king.toLowerCase() === this.currentAddress.toLowerCase();
            const position = index + 1;
            const youBg = rgbaFromHex(SDR_PALETTE.particleEmerald, 0.12);
            const youBgHi = rgbaFromHex(SDR_PALETTE.particleEmerald, 0.18);
            const otherBg = rgbaFromHex(SDR_PALETTE.primaryDark, 0.35);
            const otherBgHi = rgbaFromHex(SDR_PALETTE.primary, 0.25);

            return `
                <div class="ladder-rung" style="
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    background: ${isYou ? youBg : otherBg};
                    border-left: 1px solid ${isYou ? SDR_PALETTE.particleEmerald : SDR_PALETTE.particleSapphire};
                    border-radius: 0;
                    transition: all 0.2s;
                " onmouseenter="this.style.background='${isYou ? youBgHi : otherBgHi}'" onmouseleave="this.style.background='${isYou ? youBg : otherBg}'">
                    <!-- Position badge -->
                    <div style="
                        min-width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: ${isYou ? SDR_PALETTE.particleEmerald : SDR_PALETTE.particleSapphire};
                        color: ${SDR_PALETTE.textWhite};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                        font-weight: bold;
                        border: 1px solid ${SDR_PALETTE.border};
                    ">
                        ${position === 1 ? '🥈' : position === 2 ? '🥉' : position}
                    </div>
                    
                    <!-- Address -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-family: monospace; font-size: 0.75rem; font-weight: 500; color: ${isYou ? SDR_PALETTE.particleEmerald : 'inherit'};">
                            ${DOMHelpers.formatAddress(king)}
                            ${isYou ? `<span style="color: ${SDR_PALETTE.particleEmerald}; font-weight: 700; margin-left: 0.25rem;">←</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
}

