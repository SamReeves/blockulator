/**
 * Template Helpers
 * Shared template building utilities for game components
 */

import { SDR_PALETTE } from '../../../theme/sdr-palette.js';

/**
 * Create a hero card HTML block
 * @param {Object} config - Card configuration
 * @param {string} config.label - Card header label
 * @param {string} config.contentId - ID for the main content element
 * @param {string} config.defaultContent - Default content to display
 * @param {Array} config.stats - Array of stat objects: { id, label }
 * @returns {string} HTML string
 */
export function createHeroCard({ label, contentId, defaultContent = 'None', stats = [] }) {
    const statsHtml = stats.map(stat => `
        <div>
            <div>${stat.label}</div>
            <div id="${stat.id}" class="value">${stat.default || '—'}</div>
        </div>
    `).join('');
    
    return `
        <div class="hero-card" style="margin-bottom: 1rem;">
            <div class="hero-card-label">${label}</div>
            <div id="${contentId}" class="hero-card-content" style="min-height: 1.5rem;">
                ${defaultContent}
            </div>
            ${stats.length ? `
                <div class="hero-card-stats stat-grid${stats.length > 2 ? `-${stats.length}` : ''}">
                    ${statsHtml}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Create a stat box HTML block
 * @param {Object} config - Stat configuration
 * @param {string} config.label - Stat label
 * @param {string} config.id - ID for the value element
 * @param {string} config.defaultValue - Default value to display
 * @param {string} config.color - Optional color for the stat box
 * @returns {string} HTML string
 */
export function createStatBox({ label, id, defaultValue = '—', color = null }) {
    const colorStyle = color ? `--stat-color: ${color};` : '';
    return `
        <div class="stat-box" style="${colorStyle}">
            <div class="stat-box-label">${label}</div>
            <div id="${id}" class="stat-box-value">${defaultValue}</div>
        </div>
    `;
}

/**
 * Create a stat grid with multiple stat boxes
 * @param {Array} stats - Array of stat configurations
 * @param {number} columns - Number of columns (2, 3, or 4)
 * @returns {string} HTML string
 */
export function createStatGrid(stats, columns = 2) {
    const gridClass = columns > 2 ? `stat-grid-${columns}` : 'stat-grid';
    return `
        <div class="${gridClass}">
            ${stats.map(stat => createStatBox(stat)).join('')}
        </div>
    `;
}

/**
 * Create a collapsible details section
 * @param {Object} config - Section configuration
 * @param {string} config.icon - Icon/emoji for the header
 * @param {string} config.title - Section title
 * @param {string} config.content - Inner HTML content
 * @param {boolean} config.open - Whether section is open by default
 * @returns {string} HTML string
 */
export function createCollapsibleSection({ icon, title, content, open = false }) {
    return `
        <details class="contest-info-panel"${open ? ' open' : ''}>
            <summary class="collapsible-summary">
                <span class="collapsible-arrow">▶</span>
                <span>${icon} ${title}</span>
            </summary>
            <div style="margin-top: 1rem;">
                ${content}
            </div>
        </details>
    `;
}

/**
 * Create a step card for "how to" sections
 * @param {Object} config - Step configuration
 * @param {string|number} config.number - Step number or icon
 * @param {string} config.title - Step title
 * @param {string} config.description - Step description
 * @param {string} config.color - Step accent color
 * @returns {string} HTML string
 */
export function createStepCard({ number, title, description, color = SDR_PALETTE.particleSapphire }) {
    return `
        <div class="step-card" style="--step-color: ${color};">
            <div class="step-number">${number}</div>
            <div class="step-content">
                <strong>${title}</strong>
                <span>${description}</span>
            </div>
        </div>
    `;
}

/**
 * Create a strategy callout box
 * @param {string} content - Callout content (can include HTML)
 * @param {string} style - Additional inline styles
 * @returns {string} HTML string
 */
export function createStrategyCallout(content, style = '') {
    return `
        <div class="strategy-callout"${style ? ` style="${style}"` : ''}>
            ${content}
        </div>
    `;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
