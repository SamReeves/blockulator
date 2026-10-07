/**
 * CountdownWheel Component - Visual SVG countdown display
 * A circular progress indicator showing time until next day
 */

import { rgbaFromHex, SDR_PALETTE } from '../../theme/sdr-palette.js';

export class CountdownWheel {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.onTick = options.onTick || (() => {});
        this.timeGetter = options.timeGetter || null; // Function that returns seconds until next day
        
        this.updateInterval = null;
        this.currentSeconds = 0;
        this.maxSeconds = 86400; // 24 hours in seconds
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
        this.startUpdating();
    }
    
    getHTML() {
        return `
            <div class="countdown-wheel-container" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                <!-- SVG Circle Progress -->
                <svg width="180" height="180" viewBox="0 0 180 180" style="transform: rotate(-90deg);">
                    <!-- Background circle -->
                    <circle
                        cx="90"
                        cy="90"
                        r="75"
                        fill="none"
                        stroke="${rgbaFromHex(SDR_PALETTE.particleGold, 0.15)}"
                        stroke-width="8"
                    />
                    <circle
                        id="countdown-progress-circle"
                        cx="90"
                        cy="90"
                        r="75"
                        fill="none"
                        stroke="${SDR_PALETTE.particleGold}"
                        stroke-width="8"
                        stroke-linecap="round"
                        stroke-dasharray="471.24"
                        stroke-dashoffset="471.24"
                        style="transition: stroke-dashoffset 1s linear;"
                    />
                </svg>
                
                <!-- Center content -->
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 100%;">
                    <div id="countdown-wheel-time" style="font-size: 1.8rem; font-weight: bold; font-family: monospace; margin-bottom: 0.25rem; color: ${SDR_PALETTE.particleGold};">
                        --:--:--
                    </div>
                    <div id="countdown-wheel-status" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; color: var(--sdr-text-dark);">
                        Until Next Day
                    </div>
                    <div id="countdown-wheel-alert" style="margin-top: 0.5rem; font-size: 0.75rem; font-weight: bold; color: ${SDR_PALETTE.particleRed}; display: none;">
                        🚨 NEW DAY!
                    </div>
                </div>
            </div>
        `;
    }
    
    async startUpdating() {
        await this.update();
        // Update every second
        this.updateInterval = setInterval(() => this.update(), 1000);
    }
    
    async update() {
        if (!this.timeGetter) return;
        
        try {
            // Get seconds from the provided getter function
            this.currentSeconds = await this.timeGetter();
            
            const hours = Math.floor(this.currentSeconds / 3600);
            const minutes = Math.floor((this.currentSeconds % 3600) / 60);
            const secs = this.currentSeconds % 60;
            
            // Update time display
            const timeEl = document.getElementById('countdown-wheel-time');
            const statusEl = document.getElementById('countdown-wheel-status');
            const alertEl = document.getElementById('countdown-wheel-alert');
            
            if (timeEl) {
                timeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                
                // Color based on urgency
                if (this.currentSeconds < 60) {
                    timeEl.style.color = SDR_PALETTE.particleRed;
                    if (statusEl) statusEl.textContent = '⚡ STARTING NOW!';
                } else if (this.currentSeconds < 300) {
                    timeEl.style.color = SDR_PALETTE.particleGold;
                    if (statusEl) statusEl.textContent = 'Get Ready!';
                } else {
                    timeEl.style.color = SDR_PALETTE.particleSapphire;
                    if (statusEl) statusEl.textContent = 'Until Next Day';
                }
            }
            
            // Update circle progress
            const circle = document.getElementById('countdown-progress-circle');
            if (circle) {
                const circumference = 471.24; // 2 * PI * 75
                const progress = this.currentSeconds / this.maxSeconds;
                const offset = circumference * (1 - progress);
                circle.style.strokeDashoffset = offset;
            }
            
            // Show alert if new day
            if (alertEl) {
                alertEl.style.display = this.currentSeconds === 0 ? 'block' : 'none';
            }
            
            // Call the tick callback
            this.onTick(this.currentSeconds);
            
        } catch (error) {
            console.error('Failed to update countdown:', error);
        }
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

