/**
 * Pay It Backward Template
 * HTML template for the Pay It Backward game UI
 */

import { gamePanelColor, SDR_PALETTE } from '../../../theme/sdr-palette.js';

export function getTemplate(config = {}) {
    const { panelColor = gamePanelColor('pay-it-backward'), btnColor = gamePanelColor('pay-it-backward') } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --hero-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="flex-between" style="margin-bottom: 0.75rem;">
                    <h3 class="game-panel-header">
                        <span>⏪</span>
                        <span>Pay It Backward</span>
                    </h3>
                    <div style="font-size: 0.85rem; font-weight: 500;">Donate → Pay Previous → Wait</div>
                </div>
                
                <div class="game-panel-grid">
                    <div class="min-w-0">
                        <div id="address-flow-container"></div>
                    </div>
                    
                    <div class="min-w-0">
                        <div class="hero-card" style="margin-bottom: 1rem;">
                            <div class="hero-card-label">🎯 Last Donor</div>
                            <div id="last-donor" class="hero-card-content" style="min-height: 1.5rem; font-family: monospace;">
                                None
                            </div>
                            <div class="hero-card-stats stat-grid">
                                <div>
                                    <div>Next Gets</div>
                                    <div id="next-recipient" class="value" style="font-size: 0.75rem;">—</div>
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
                            ⏪ Donate & Pay Previous
                        </button>
                    </div>
                </div>
            </div>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>🔄 How Pay It Backward Works</span>
                </summary>
                <div style="display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                    <div class="step-card" style="--step-color: ${SDR_PALETTE.particleSapphire};">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <strong>First Donor</strong>
                            <span>Pays owner (bootstrap), becomes last donor</span>
                        </div>
                    </div>
                    <div class="step-card" style="--step-color: ${SDR_PALETTE.particleRed};">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <strong>Second Donor</strong>
                            <span>Pays first donor IMMEDIATELY, becomes new last donor</span>
                        </div>
                    </div>
                    <div class="step-card" style="--step-color: ${SDR_PALETTE.particleEmerald};">
                        <div class="step-number">∞</div>
                        <div class="step-content">
                            <strong>Chain Continues</strong>
                            <span>Each donor pays previous instantly, becomes new last donor</span>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    `;
}
