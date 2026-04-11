/**
 * Blockulator palette — SDR design tokens + particle palette.
 * Vendor copies under vendor/sdr/lib/ (run scripts/sync-sdr.sh to refresh from upstream).
 */

import { colors } from '../../vendor/sdr/lib/tokens.js';
import { palette } from '../../vendor/sdr/lib/particles/palette.js';

const EXTRA = {
    outlineVariant: '#1a1a1a',
    error: '#ef4444',
    warning: '#f59e0b',
    chartTrack: 'rgba(255, 255, 255, 0.14)',
    pixelPaper: '#ffffff',
};

/**
 * @param {string} hex - "#RRGGBB"
 * @param {number} alpha - 0..1
 * @returns {string} rgba(...)
 */
export function rgbaFromHex(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Lerp two #RRGGBB colors (t = 0 → fg, t = 1 → bg). For calmer chart ink on dark fields.
 */
export function blendHex(fg, bg, t) {
    const h = (x) => x.replace('#', '');
    const pa = h(fg);
    const pb = h(bg);
    const ar = parseInt(pa.slice(0, 2), 16);
    const ag = parseInt(pa.slice(2, 4), 16);
    const ab = parseInt(pa.slice(4, 6), 16);
    const br = parseInt(pb.slice(0, 2), 16);
    const bg_ = parseInt(pb.slice(2, 4), 16);
    const bb = parseInt(pb.slice(4, 6), 16);
    const u = Math.min(1, Math.max(0, t));
    const r = Math.round(ar + (br - ar) * u);
    const g = Math.round(ag + (bg_ - ag) * u);
    const b = Math.round(ab + (bb - ab) * u);
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export const SDR_PALETTE = {
    bgDarker: colors.bgDarker,
    bgDark: colors.bgDark,
    bgCard: colors.bgCard,
    border: colors.border,
    text: colors.textDark,
    textMuted: colors.textLight,
    textWhite: colors.textWhite,
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    link: colors.link,
    outlineVariant: EXTRA.outlineVariant,
    success: palette[0],
    error: EXTRA.error,
    warning: EXTRA.warning,
    particleEmerald: palette[0],
    particleRed: palette[8],
    particleGold: palette[11],
    particleSapphire: palette[15],
    chartTrack: EXTRA.chartTrack,
    pixelPaper: EXTRA.pixelPaper,
};

/**
 * Ordered particle bases (same sequence as frame.js indices 0, 8, 11, 15).
 */
export const PARTICLE_BASES_HEX = [
    SDR_PALETTE.particleEmerald,
    SDR_PALETTE.particleRed,
    SDR_PALETTE.particleGold,
    SDR_PALETTE.particleSapphire,
];

/**
 * @param {number} index
 * @returns {string} hex
 */
export function particleHexAt(index) {
    return PARTICLE_BASES_HEX[index % PARTICLE_BASES_HEX.length];
}

/**
 * Library trace colors — identical mapping to About precision chart.
 */
export const LIBRARY_TRACE_COLORS = {
    fp127: SDR_PALETTE.particleEmerald,
    abdk: SDR_PALETTE.particleSapphire,
    solady: SDR_PALETTE.particleGold,
    prb: SDR_PALETTE.particleRed,
};

/** Plotly / chart chrome on black field */
export const CHART_THEME = {
    fontColor: SDR_PALETTE.textMuted,
    gridColor: SDR_PALETTE.outlineVariant,
    gridColorMinor: rgbaFromHex(SDR_PALETTE.textMuted, 0.14),
    zeroLine: SDR_PALETTE.border,
};

/**
 * Default `--panel-color` / status-card accent per game (particle bases only).
 * @type {Record<string, string>}
 */
export const GAME_PANEL_COLOR_HEX = {
    'pissing-contest': SDR_PALETTE.particleSapphire,
    'pay-it-forward': SDR_PALETTE.particleEmerald,
    'pay-it-backward': SDR_PALETTE.particleSapphire,
    'message-board': SDR_PALETTE.particleSapphire,
    'king-of-the-hill': SDR_PALETTE.particleSapphire,
    'last-call': SDR_PALETTE.particleRed,
    'time-to-make-the-donuts': SDR_PALETTE.particleGold,
    'dice-gods': SDR_PALETTE.particleSapphire,
    'satan-moloch-baal': SDR_PALETTE.particleRed,
};

/**
 * @param {string} gameId
 * @returns {string} hex
 */
export function gamePanelColor(gameId) {
    return GAME_PANEL_COLOR_HEX[gameId] ?? SDR_PALETTE.particleSapphire;
}

const DISTRIBUTION_CHART_NAMES = [
    'Uniform - Constant Rate',
    'Gaussian - Bell Curve',
    'Exponential Decay',
    'Exponential Growth',
    'Linear Decay',
    'Linear Growth',
];

/**
 * Six distribution preview traces — cycles the four particle bases, then repeats with lower alpha feel via same hues.
 */
export function distributionPreviewChartColors() {
    return DISTRIBUTION_CHART_NAMES.map((name, i) => {
        const border = particleHexAt(i);
        return { border, bg: rgbaFromHex(border, i < 4 ? 0.2 : 0.14), name };
    });
}
