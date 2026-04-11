/**
 * Last Call Template
 * HTML template for the Last Call game UI
 */

import { gamePanelColor, SDR_PALETTE } from '../../../theme/sdr-palette.js';

export function getTemplate(config = {}) {
    const { panelColor = gamePanelColor('last-call'), btnColor = SDR_PALETTE.particleEmerald } = config;
    
    return `
        <div class="game-panel-grid" style="margin-top: 1rem; --panel-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <h3 class="game-panel-header">
                    <span>⏰</span>
                    <span>Time Remaining</span>
                </h3>
                
                <div class="countdown-container" style="--countdown-color: ${panelColor};">
                    <svg width="200" height="200" viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                        <circle cx="100" cy="100" r="75" fill="none" stroke="${SDR_PALETTE.border}" stroke-width="12"/>
                        <circle id="countdown-progress-circle" cx="100" cy="100" r="75" fill="none"
                                stroke="${SDR_PALETTE.particleRed}" stroke-width="12" stroke-linecap="round"
                                stroke-dasharray="471.24" stroke-dashoffset="471.24"
                                style="transition: stroke-dashoffset 1s linear;"/>
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
                
                <button id="end-round-btn" class="btn-action-secondary" style="--btn-color: ${SDR_PALETTE.particleGold}; display: none;">
                    🏁 End Round & Claim Prize
                </button>
                
                <div class="strategy-callout">
                    <strong>⚡ Strategy:</strong> Be the LAST donor when timer hits zero. Winner gets 100% of the pot!
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="contest-info-panel game-panel" style="--panel-color: ${SDR_PALETTE.particleEmerald};">
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
                        <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleSapphire}; text-align: center;">
                            <div class="stat-box-label">💰 Current Pot</div>
                            <div id="pot-value" class="stat-box-value" style="font-size: 1.1rem;">0 wei</div>
                        </div>
                        <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleGold}; text-align: center;">
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
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleEmerald};">
                            <strong>1. Donate</strong> - Become current winner, reset 10-day timer
                        </div>
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleRed};">
                            <strong>2. Be Last</strong> - Stay in lead when countdown hits zero
                        </div>
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleGold};">
                            <strong>3. Claim</strong> - End round to win the entire pot
                        </div>
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleSapphire};">
                            <strong>💡 Tip:</strong> Each donation resets the clock. Time your move perfectly!
                        </div>
                    </div>
                </details>
            </div>
        </div>
    `;
}
