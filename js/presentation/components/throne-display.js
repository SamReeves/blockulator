/**
 * ThroneDisplay Component - Dramatic king visualization
 * Shows the current king with power meter and reign duration
 */

import { DOMHelpers } from '../dom/dom-helpers.js';

export class ThroneDisplay {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.currentKing = null;
        this.prize = '0';
        this.reignDuration = 0;
        this.isYouKing = false;
        this.onUpdate = options.onUpdate || (() => {});
        
        this.updateInterval = null;
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
        
        // Start auto-updating reign time
        this.startAutoUpdate();
    }
    
    getHTML() {
        return `
            <div class="throne-container" style="
                position: relative;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 1.5rem;
                color: white;
                overflow: hidden;
                min-height: 250px;
            ">
                <!-- Crown decoration -->
                <div style="position: absolute; top: -30px; right: -30px; font-size: 140px; opacity: 0.1; transform: rotate(15deg);">
                    👑
                </div>
                
                <!-- Main content -->
                <div style="position: relative; z-index: 1;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; margin-bottom: 0.5rem;">
                            🏰 Current Ruler
                        </div>
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;" id="throne-crown">
                            👑
                        </div>
                    </div>
                    
                    <!-- King info -->
                    <div id="throne-king-info" style="
                        text-align: center;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 8px;
                        backdrop-filter: blur(10px);
                        margin-bottom: 1rem;
                    ">
                        <div style="font-size: 0.9rem; font-weight: bold; font-family: monospace; word-break: break-all;">
                            No King Yet
                        </div>
                    </div>
                    
                    <!-- Stats grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div style="background: rgba(255, 255, 255, 0.1); padding: 0.75rem; border-radius: 6px; text-align: center;">
                            <div style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 1px;">
                                Prize Pool
                            </div>
                            <div id="throne-prize" style="font-size: 1.1rem; font-weight: bold;">
                                0 wei
                            </div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.1); padding: 0.75rem; border-radius: 6px; text-align: center;">
                            <div style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 1px;">
                                Reign Time
                            </div>
                            <div id="throne-reign" style="font-size: 1.1rem; font-weight: bold;">
                                0s
                            </div>
                        </div>
                    </div>
                    
                    <!-- Power meter -->
                    <div style="margin-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div style="font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">
                                Dominance
                            </div>
                            <div id="throne-power-pct" style="font-size: 0.7rem; font-weight: bold;">
                                100%
                            </div>
                        </div>
                        <div style="
                            height: 8px;
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 4px;
                            overflow: hidden;
                        ">
                            <div id="throne-power-bar" style="
                                height: 100%;
                                width: 100%;
                                background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                                transition: width 0.5s ease-out;
                                box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                            "></div>
                        </div>
                        <div style="font-size: 0.65rem; opacity: 0.7; margin-top: 0.25rem; text-align: center;">
                            Power decays over time • Dethrone to claim!
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Update the throne with current king info
     */
    update(kingData) {
        const { address, prize, reignDuration, isYou } = kingData;
        
        this.currentKing = address;
        this.prize = prize;
        this.reignDuration = reignDuration;
        this.isYouKing = isYou;
        
        this.render();
    }
    
    /**
     * Render the current state
     */
    render() {
        const infoEl = document.getElementById('throne-king-info');
        const prizeEl = document.getElementById('throne-prize');
        const reignEl = document.getElementById('throne-reign');
        const crownEl = document.getElementById('throne-crown');
        
        if (!infoEl || !prizeEl || !reignEl || !crownEl) return;
        
        const isZero = !this.currentKing || this.currentKing === '0x0000000000000000000000000000000000000000';
        
        // Update king display
        if (isZero) {
            infoEl.innerHTML = `
                <div style="font-size: 1.2rem; font-weight: bold; opacity: 0.7;">
                    👻 Throne is Empty
                </div>
                <div style="font-size: 0.75rem; opacity: 0.6; margin-top: 0.5rem;">
                    Claim it and become the first king!
                </div>
            `;
            crownEl.style.filter = 'grayscale(100%) opacity(0.5)';
        } else {
            const youBadge = this.isYouKing ? 
                '<div style="background: #ffd700; color: #000; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem; display: inline-block; animation: pulse 2s infinite;">YOU ARE KING!</div>' : 
                '';
            
            infoEl.innerHTML = `
                <div style="font-size: 0.85rem; font-weight: bold; font-family: monospace; word-break: break-all;">
                    ${DOMHelpers.formatAddress(this.currentKing)}
                </div>
                ${youBadge}
            `;
            
            crownEl.style.filter = this.isYouKing ? 'none' : 'hue-rotate(180deg)';
            if (this.isYouKing) {
                crownEl.style.animation = 'throneGlow 2s infinite';
            }
        }
        
        // Update prize and reign
        prizeEl.textContent = this.prize;
        reignEl.textContent = DOMHelpers.formatDuration(this.reignDuration);
        
        // Update power bar (decays over time)
        this.updatePowerBar();
    }
    
    /**
     * Update the power/dominance bar based on reign duration
     */
    updatePowerBar() {
        const barEl = document.getElementById('throne-power-bar');
        const pctEl = document.getElementById('throne-power-pct');
        
        if (!barEl || !pctEl) return;
        
        // Power decays: 100% at 0s, 50% at 1 hour, 10% at 6 hours, 0% at 24 hours
        const maxTime = 86400; // 24 hours
        const power = Math.max(0, 100 * (1 - (this.reignDuration / maxTime)));
        
        barEl.style.width = `${power}%`;
        pctEl.textContent = `${Math.round(power)}%`;
        
        // Change color based on power
        if (power > 70) {
            barEl.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            barEl.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
        } else if (power > 30) {
            barEl.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
            barEl.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.5)';
        } else {
            barEl.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
            barEl.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
        }
    }
    
    /**
     * Start auto-updating the display
     */
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            if (this.reignDuration !== null) {
                this.reignDuration++;
                this.render();
            }
        }, 1000);
    }
    
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Add CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes throneGlow {
            0%, 100% {
                filter: drop-shadow(0 0 10px #ffd700);
                transform: scale(1);
            }
            50% {
                filter: drop-shadow(0 0 20px #ffd700);
                transform: scale(1.1);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.8;
                transform: scale(1.05);
            }
        }
    `;
    document.head.appendChild(style);
}

