/**
 * Dice Gods Template
 * HTML template for the Dice Gods game UI
 */

export function getTemplate(config = {}) {
    const { panelColor = '#8b5cf6', btnColor = '#10b981' } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="game-panel-grid">
                    <div class="min-w-0">
                        <div id="dice-3d-container"></div>
                    </div>
                    
                    <div class="min-w-0">
                        <div class="strategy-callout" style="margin-bottom: 1rem;">
                            <strong>How to play:</strong> The last digit of your donation (1-6) is your number. Pick the LEAST popular to win!
                        </div>
                        
                        <div id="play-amount-input" style="margin-bottom: 1rem;"></div>
                        <button id="play-button" class="btn-action">
                            Play
                        </button>
                        
                        <div class="stat-grid-4" style="margin-top: 1rem; font-size: 0.75rem;">
                            <div class="stat-box">
                                <div class="stat-box-label">Round</div>
                                <div id="round-number" class="stat-box-value">-</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">Plays</div>
                                <div id="plays-count" class="stat-box-value">-</div>
                            </div>
                            <div class="stat-box" style="--stat-color: #10b981;">
                                <div class="stat-box-label">Pool</div>
                                <div id="prize-pool" class="stat-box-value">-</div>
                            </div>
                            <div class="stat-box" style="--stat-color: #f59e0b;">
                                <div class="stat-box-label">Min</div>
                                <div id="min-donation" class="stat-box-value">-</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📊 Current Round - Number Votes</span>
                </summary>
                <div style="margin-top: 1rem;">
                    <div class="distribution-bars" id="distribution-bars" style="margin-bottom: 1rem;">
                        <div style="text-align: center; padding: 1rem; color: var(--md-sys-color-on-surface-variant);">
                            No plays yet...
                        </div>
                    </div>
                    <div id="current-plays-list" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
            </details>
        </div>
    `;
}
