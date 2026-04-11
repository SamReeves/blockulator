/**
 * Satan Moloch Baal Template
 * HTML template for the Satan Moloch Baal game UI
 */

import { rgbaFromHex, SDR_PALETTE } from '../../../theme/sdr-palette.js';

const DEFAULT_DEMONS = [
    { emoji: '😈', name: 'SATAN', subtitle: 'The Adversary', color: SDR_PALETTE.particleRed, key: 'satan' },
    { emoji: '🐂', name: 'MOLOCH', subtitle: 'The Bull God', color: SDR_PALETTE.particleGold, key: 'moloch' },
    { emoji: '⚡', name: 'BAAL', subtitle: 'Lord of Storms', color: SDR_PALETTE.particleSapphire, key: 'baal' },
];

export function getTemplate(config = {}) {
    const { panelColor = SDR_PALETTE.particleRed, demons = DEFAULT_DEMONS } = config;

    const demonStandingsHTML = demons.map(demon => `
        <div style="padding: 1rem; background: ${rgbaFromHex(demon.color, 0.12)}; border-radius: 0; border: 1px solid ${SDR_PALETTE.border}; border-left: 1px solid ${demon.color};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">${demon.emoji}</span>
                    <span style="font-weight: bold; color: ${demon.color};">${demon.name}</span>
                </div>
                <div id="${demon.key}-votes" style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">0 votes</div>
            </div>
            <div id="${demon.key}-total" style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">0 wei</div>
            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                <span>👑</span> <span id="${demon.key}-top-devotee">None</span>
            </div>
        </div>
    `).join('');

    const userStatsHTML = [
        ...demons.map(demon => ({
            key: `user-${demon.key}-burned`,
            label: `${demon.emoji} ${demon.name}`,
            color: demon.color
        })),
        { key: 'user-total-burned', label: '🔥 Total', color: SDR_PALETTE.particleRed },
    ].map(stat => `
        <div style="padding: 0.75rem; background: ${rgbaFromHex(stat.color, 0.12)}; border-radius: 0; border: 1px solid ${SDR_PALETTE.border}; border-left: 1px solid ${stat.color};">
            <div style="font-size: 0.7rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.25rem;">${stat.label}</div>
            <div id="${stat.key}" style="font-size: 1rem; font-weight: bold;">0 wei</div>
        </div>
    `).join('');

    return `
        <div class="game-panel-grid" style="margin-top: 1rem; --panel-color: ${panelColor};">
            <div class="contest-info-panel game-panel">
                <h3 class="game-panel-header">
                    <span>🔥</span>
                    <span>Choose Your Demon</span>
                </h3>
                
                <div id="lazy-susan-container" style="margin: 1rem 0;"></div>
                
                <div id="vote-amount-input" style="margin-top: 1.5rem;"></div>
                
                <div class="strategy-callout" style="text-align: center; margin-top: 1rem; font-size: 0.875rem;">
                    <strong>⚠️ All ETH is burned to address(0) forever!</strong>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="contest-info-panel">
                    <h3 class="flex-between" style="margin-bottom: 1rem;">
                        <span class="flex-center-gap">
                            <span>👹</span>
                            <span>Demon Standings</span>
                        </span>
                        <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">🔥 <span id="total-burned">0 wei</span></span>
                    </h3>
                    
                    <div id="demon-standings" style="display: grid; gap: 0.75rem;">
                        ${demonStandingsHTML}
                    </div>
                </div>

                <div class="contest-info-panel game-panel" style="--panel-color: ${SDR_PALETTE.particleEmerald};">
                    <h3 class="game-panel-header" style="margin-bottom: 1rem;">
                        <span>📈</span>
                        <span>Your Sacrifices</span>
                    </h3>
                    <div id="user-stats" class="stat-grid">
                        ${userStatsHTML}
                    </div>
                </div>

                <details class="contest-info-panel" style="cursor: pointer;">
                    <summary class="collapsible-summary">
                        <span class="collapsible-arrow">▶</span>
                        <span>📖 The Ritual</span>
                    </summary>
                    <div style="margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6; display: grid; gap: 0.5rem;">
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleRed};">
                            <strong>1. Choose Demon</strong> - Rotate to select, then vote
                        </div>
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleGold};">
                            <strong>2. Burn ETH</strong> - Sent to address(0), destroyed forever
                        </div>
                        <div class="step-card" style="--step-color: ${SDR_PALETTE.particleSapphire};">
                            <strong>3. Become Top Devotee</strong> - Highest donor per demon
                        </div>
                    </div>
                </details>
            </div>
        </div>
    `;
}
