/**
 * King of the Hill Template
 * HTML template for the King of the Hill game UI
 */

import { gamePanelColor, SDR_PALETTE } from '../../../theme/sdr-palette.js';

export function getTemplate(config = {}) {
    const { panelColor = gamePanelColor('king-of-the-hill'), btnColor = SDR_PALETTE.primary } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="flex-between" style="margin-bottom: 0.75rem;">
                    <h3 class="game-panel-header">
                        <span>👑</span>
                        <span>King of the Hill</span>
                    </h3>
                    <div style="font-size: 0.75rem;">
                        <span id="total-dethrone-badge">0</span> battles
                    </div>
                </div>
                
                <div class="game-panel-grid">
                    <div class="min-w-0">
                        <div class="stat-box" style="margin-bottom: 0.75rem;">
                            <div class="stat-box-label">Min Payment</div>
                            <div id="min-payment" class="stat-box-value" style="font-size: 0.95rem;">
                                0 wei
                            </div>
                        </div>
                        
                        <div id="throne-payment-input" style="margin-bottom: 0.75rem;"></div>
                        
                        <button id="claim-btn" class="btn-action">
                            ⚔️ Dethrone King
                        </button>
                        
                        <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.75rem;">
                            <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleEmerald};">
                                <div class="stat-box-label">Crowns</div>
                                <div id="your-crowns" class="stat-box-value">—</div>
                            </div>
                            <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleGold};">
                                <div class="stat-box-label">Total Reign</div>
                                <div id="your-reign" class="stat-box-value">—</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="min-w-0">
                        <div id="king-ladder-container"></div>
                    </div>
                </div>
            </div>

            <details class="contest-info-panel" open>
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📖 How to Win</span>
                </summary>
                <div style="margin-top: 1rem;">
                    <div class="strategy-callout" style="margin-bottom: 1rem;">
                        <strong>👑 Goal:</strong> Pay more than the current king to claim the throne. Last king standing wins the entire prize.
                    </div>
                    
                    <div style="padding: 1rem; background: color-mix(in srgb, var(--panel-color) 5%, transparent); border-radius: 8px; font-size: 0.85rem;">
                        <strong style="display: block; margin-bottom: 0.5rem;">Rules:</strong>
                        • Minimum payment grows with each dethronement<br>
                        • Must pay at least 1% more than current prize<br>
                        • Previous king loses their payment (no refunds)<br>
                        • Winner takes all when game ends
                    </div>
                </div>
            </details>
        </div>
    `;
}
