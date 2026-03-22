/**
 * Time to Make the Donuts Template
 * HTML template for the Time to Make the Donuts game UI
 */

export function getTemplate(config = {}) {
    const { panelColor = '#ec4899', btnColor = '#ec4899' } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --hero-color: #f59e0b; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="flex-between" style="margin-bottom: 0.75rem;">
                    <h3 class="game-panel-header">
                        <span>🍩</span>
                        <span>Make the Donuts</span>
                    </h3>
                    <div style="font-size: 0.85rem; font-weight: 500;">First donor after midnight UTC wins</div>
                </div>
                
                <div class="game-panel-grid">
                    <div class="min-w-0">
                        <div id="countdown-wheel-container"></div>
                    </div>
                    
                    <div class="min-w-0">
                        <div class="hero-card" style="margin-bottom: 1rem;">
                            <div class="hero-card-label">🏆 First Donor Today</div>
                            <div id="first-donor-today" class="hero-card-content" style="min-height: 1.5rem;">
                                No one yet
                            </div>
                            <div class="hero-card-stats stat-grid-3">
                                <div>
                                    <div>Prize Pool</div>
                                    <div id="pot-value" class="value">0 wei</div>
                                </div>
                                <div>
                                    <div>Winner Gets</div>
                                    <div id="winner-prize" class="value">0 wei</div>
                                </div>
                                <div>
                                    <div>Day</div>
                                    <div id="current-day" class="value">0</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="donation-amount-input" style="margin-bottom: 0.75rem;"></div>
                        <button id="donate-btn" class="btn-action">
                            🎮 Donate & Race to Win
                        </button>
                    </div>
                </div>
            </div>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📖 How To Win</span>
                </summary>
                <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                    <div class="step-card" style="--step-color: #ec4899;">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <strong>Wait For Midnight UTC</strong>
                            <span>Each day starts at 00:00 UTC - watch the countdown closely</span>
                        </div>
                    </div>
                    <div class="step-card" style="--step-color: #f59e0b;">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <strong>Be First To Donate</strong>
                            <span>Race to submit your donation as soon as the day changes</span>
                        </div>
                    </div>
                    <div class="step-card" style="--step-color: #10b981;">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <strong>Win the Prize Pool</strong>
                            <span>First donor wins 100% of yesterday's pot automatically!</span>
                        </div>
                    </div>
                </div>
            </details>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📊 Stats</span>
                </summary>
                <div class="stat-box" style="margin-top: 0.75rem; font-size: 0.8rem; --stat-color: #ec4899;">
                    <div class="stat-box-label">Total Days</div>
                    <div id="total-days" class="stat-box-value" style="font-size: 0.9rem;">1</div>
                </div>
            </details>
        </div>
    `;
}
