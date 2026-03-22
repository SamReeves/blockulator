/**
 * Pay It Forward Template
 * HTML template for the Pay It Forward game UI
 */

export function getTemplate(config = {}) {
    const { panelColor = '#10b981', btnColor = '#10b981' } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --hero-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="flex-between" style="margin-bottom: 0.75rem;">
                    <h3 class="game-panel-header">
                        <span>⏩</span>
                        <span>Pay It Forward</span>
                    </h3>
                    <div style="font-size: 0.85rem; font-weight: 500;">Donate → Wait → Receive</div>
                </div>
                
                <div class="game-panel-grid">
                    <div class="min-w-0">
                        <div id="address-flow-container"></div>
                    </div>
                    
                    <div class="min-w-0">
                        <div class="hero-card" style="margin-bottom: 1rem;">
                            <div class="hero-card-label">⏳ Pending Donor</div>
                            <div id="pending-donor" class="hero-card-content" style="min-height: 1.5rem; font-family: monospace;">
                                None
                            </div>
                            <div class="hero-card-stats stat-grid">
                                <div>
                                    <div>Pending</div>
                                    <div id="pending-amount" class="value">0 wei</div>
                                </div>
                                <div>
                                    <div>Your Status</div>
                                    <div id="your-status" class="value">—</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="state-message" class="strategy-callout" style="text-align: center; font-weight: 600; margin-bottom: 1rem;">
                            💡 Loading state...
                        </div>
                        
                        <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                        <button id="donate-button" class="btn-action">
                            ⏩ Donate & Join Chain
                        </button>
                    </div>
                </div>
            </div>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>🔗 How Pay It Forward Works</span>
                </summary>
                <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                    <div class="step-card" style="--step-color: #10b981;">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <strong>First Donor</strong>
                            <span>Becomes pending, waits for next person</span>
                        </div>
                    </div>
                    <div class="step-card" style="--step-color: #3b82f6;">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <strong>Second Donor</strong>
                            <span>Receives first donor's amount, becomes new pending</span>
                        </div>
                    </div>
                    <div class="step-card" style="--step-color: #8b5cf6;">
                        <div class="step-number">∞</div>
                        <div class="step-content">
                            <strong>Chain Continues</strong>
                            <span>Each donor receives from pending and becomes new pending</span>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    `;
}
