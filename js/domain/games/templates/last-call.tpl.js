/**
 * Last Call Template
 * HTML template for the Last Call game UI
 */

export function getTemplate(config = {}) {
    const { panelColor = '#ef4444', btnColor = '#10b981' } = config;
    
    return `
        <div class="game-panel-grid" style="margin-top: 1rem; --panel-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <h3 class="game-panel-header">
                    <span>⏰</span>
                    <span>Time Remaining</span>
                </h3>
                
                <div class="countdown-container" style="--countdown-color: ${panelColor};">
                    <svg width="200" height="200" viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                        <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(239, 68, 68, 0.1)" stroke-width="12"/>
                        <circle id="countdown-progress-circle" cx="100" cy="100" r="75" fill="none" 
                                stroke="url(#lastcall-gradient)" stroke-width="12" stroke-linecap="round"
                                stroke-dasharray="471.24" stroke-dashoffset="471.24" 
                                style="transition: stroke-dashoffset 1s linear;"/>
                        <defs>
                            <linearGradient id="lastcall-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1"/>
                                <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <div class="countdown-overlay">
                        <div id="countdown-time" class="countdown-time">--:--:--</div>
                        <div id="countdown-label" class="countdown-label">Until Round Ends</div>
                    </div>
                </div>
                
                <div id="donation-amount-input" style="margin-bottom: 1rem;"></div>
                
                <button id="donate-btn" class="btn-action">
                    💰 Donate — Become the Last Donor
                </button>
                
                <button id="end-round-btn" class="btn-action-secondary" style="--btn-color: #f59e0b; display: none;">
                    🏁 End Round & Claim Prize
                </button>
                
                <div class="strategy-callout">
                    <strong>⚡ Strategy:</strong> Be the LAST donor when timer hits zero. Winner gets 100% of the pot!
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="contest-info-panel game-panel" style="--panel-color: #10b981;">
                    <h3 class="flex-between game-panel-header" style="margin-bottom: 1rem;">
                        <span class="flex-center-gap">
                            <span>🏆</span>
                            <span>Current Leader</span>
                        </span>
                        <span style="font-size: 0.85rem; font-weight: normal;">Round <span id="round-number">#1</span></span>
                    </h3>
                    
                    <div id="current-winner" class="stat-box" style="margin-bottom: 1rem; text-align: center; min-height: 60px; display: flex; align-items: center; justify-content: center;">
                        No one yet
                    </div>
                    
                    <div class="stat-grid">
                        <div class="stat-box" style="--stat-color: #3b82f6; text-align: center;">
                            <div class="stat-box-label">💰 Current Pot</div>
                            <div id="pot-value" class="stat-box-value" style="font-size: 1.1rem;">0 wei</div>
                        </div>
                        <div class="stat-box" style="--stat-color: #f59e0b; text-align: center;">
                            <div class="stat-box-label">🎁 Winner Gets</div>
                            <div id="winner-prize" class="stat-box-value" style="font-size: 1.1rem;">0 wei</div>
                        </div>
                    </div>
                </div>

                <details class="contest-info-panel" style="cursor: pointer;">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📖 How To Win</span>
                    </summary>
                    <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6; display: grid; gap: 0.5rem;">
                        <div class="step-card" style="--step-color: #10b981;">
                            <strong>1. Donate</strong> - Become current winner, reset 10-day timer
                        </div>
                        <div class="step-card" style="--step-color: #ef4444;">
                            <strong>2. Be Last</strong> - Stay in lead when countdown hits zero
                        </div>
                        <div class="step-card" style="--step-color: #f59e0b;">
                            <strong>3. Claim</strong> - End round to win the entire pot
                        </div>
                        <div class="step-card" style="--step-color: #3b82f6;">
                            <strong>💡 Tip:</strong> Each donation resets the clock. Time your move perfectly!
                        </div>
                    </div>
                </details>
            </div>
        </div>
    `;
}
