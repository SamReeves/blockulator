/**
 * Pissing Contest Template
 * HTML template for the Pissing Contest game UI
 */

import { gamePanelColor, SDR_PALETTE } from '../../../theme/sdr-palette.js';

export function getTemplate(config = {}) {
    const { panelColor = gamePanelColor('pissing-contest'), btnColor = SDR_PALETTE.particleEmerald } = config;
    
    return `
        <div class="game-sections" style="--panel-color: ${panelColor}; --hero-color: ${panelColor}; --btn-color: ${btnColor};">
            <div class="contest-info-panel game-panel">
                <div class="game-panel-grid">
                    <div class="min-w-0">
                        <div class="hero-card" style="margin-bottom: 1rem;">
                            <div class="hero-card-label">🏆 Current Leader</div>
                            <div id="current-leader" class="hero-card-content">
                                No donations yet
                            </div>
                            <div class="hero-card-stats stat-grid">
                                <div>
                                    <div>Prize Pool</div>
                                    <div id="prize-pool" class="value">0 wei</div>
                                </div>
                                <div>
                                    <div>Donations</div>
                                    <div id="donations-count" class="value">0 / 0</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="donate-amount-input" style="margin-bottom: 0.75rem;"></div>
                        <button id="donate-button" class="btn-action">
                            💰 Donate
                        </button>
                        
                        <div class="stat-grid-3" style="margin-top: 0.75rem;">
                            <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleEmerald};">
                                <div class="stat-box-label">Your Donation</div>
                                <div id="your-donation" class="stat-box-value">0 wei</div>
                            </div>
                            <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleGold};">
                                <div class="stat-box-label">Status</div>
                                <div id="your-status" class="stat-box-value">Not playing</div>
                            </div>
                            <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleGold};">
                                <div class="stat-box-label">Minimum</div>
                                <div id="min-donation" class="stat-box-value">-</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="min-w-0">
                        <div class="flex-between" style="margin-bottom: 0.5rem;">
                            <h3 class="game-panel-header" style="font-size: 1rem;">📊 Donation Histogram</h3>
                            <span style="font-size: 0.75rem; opacity: 0.8;">Top 10</span>
                        </div>
                        <div id="donations-3d-graph"></div>
                    </div>
                </div>
            </div>

            <div id="admin-panel" class="contest-info-panel admin-panel" style="display: none;">
                <h3 class="admin-panel-header">
                    <span>⚙️</span>
                    <span>Admin</span>
                </h3>
                <div class="stat-grid-3" style="margin: 0.75rem 0; font-size: 0.75rem; --stat-color: ${SDR_PALETTE.particleRed};">
                    <div class="stat-box">
                        <div class="stat-box-label">Status</div>
                        <div id="contract-paused" class="stat-box-value">No</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">Min Donation</div>
                        <div id="config-min" class="stat-box-value">-</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">Max Donations</div>
                        <div id="config-max" class="stat-box-value">-</div>
                    </div>
                </div>
                <div class="stat-grid">
                    <button id="toggle-pause-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.8rem;">🔄 Pause</button>
                    <button id="end-round-early-btn" class="btn-secondary" style="padding: 0.5rem; font-size: 0.8rem;">🏁 End</button>
                </div>
            </div>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📈 Your Stats</span>
                </summary>
                <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.8rem;">
                    <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleSapphire};">
                        <div class="stat-box-label">Lifetime Donated</div>
                        <div id="lifetime-donated" class="stat-box-value">0 wei</div>
                    </div>
                    <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleSapphire};">
                        <div class="stat-box-label">Lifetime Won</div>
                        <div id="lifetime-won" class="stat-box-value">0 wei</div>
                    </div>
                    <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleGold};">
                        <div class="stat-box-label">Rounds Won</div>
                        <div id="rounds-won" class="stat-box-value">0</div>
                    </div>
                    <div class="stat-box" style="--stat-color: ${SDR_PALETTE.particleGold};">
                        <div class="stat-box-label">Rounds Played</div>
                        <div id="rounds-participated" class="stat-box-value">0</div>
                    </div>
                </div>
            </details>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>🏆 Recent Winners</span>
                </summary>
                <div id="winners-history" style="max-height: 250px; overflow-y: auto; margin-top: 0.75rem;">
                    <div style="text-align: center; padding: 1.5rem; color: var(--sdr-text-light); font-size: 0.85rem;">
                        Loading history...
                    </div>
                </div>
            </details>

            <details class="contest-info-panel">
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>🌍 Global Stats</span>
                </summary>
                <div class="stat-grid" style="margin-top: 0.75rem; font-size: 0.8rem; --stat-color: ${SDR_PALETTE.particleEmerald};">
                    <div class="stat-box">
                        <div class="stat-box-label">Total Rounds</div>
                        <div id="total-rounds" class="stat-box-value">0</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">Total Donated</div>
                        <div id="total-donated" class="stat-box-value">0 wei</div>
                    </div>
                </div>
                <div class="stat-box" style="margin-top: 0.5rem; font-size: 0.8rem; --stat-color: ${SDR_PALETTE.particleEmerald};">
                    <div class="stat-box-label">All-Time Record</div>
                    <div id="highest-donation" class="stat-box-value" style="margin-bottom: 0.25rem;">0 wei</div>
                    <div style="font-size: 0.75rem; opacity: 0.8;">
                        By: <span id="highest-donor">-</span>
                    </div>
                </div>
            </details>

            <details class="contest-info-panel" open>
                <summary class="collapsible-summary">
                    <span class="collapsible-arrow">▶</span>
                    <span>📖 How to Win</span>
                </summary>
                <div style="margin-top: 1rem;">
                    <div class="strategy-callout" style="margin-bottom: 1rem;">
                        <strong>🎯 Goal:</strong> Send the highest donation in the round to win the entire prize pool.
                    </div>
                    
                    <div style="padding: 1rem; background: color-mix(in srgb, var(--panel-color) 5%, transparent); border-radius: 8px; font-size: 0.85rem;">
                        <strong style="display: block; margin-bottom: 0.5rem;">Rules:</strong>
                        • Each round accepts up to 10 donations<br>
                        • Highest donor becomes the leader<br>
                        • After 10 donations, round ends and leader wins 100%<br>
                        • New round starts immediately
                    </div>
                </div>
            </details>
        </div>
    `;
}
