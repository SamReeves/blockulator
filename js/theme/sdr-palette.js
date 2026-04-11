/**
 * SDR-aligned design tokens (JS).
 * Mirrors `css/variables.css` :root; keep hex values identical.
 * When securedataresearch packages branding, swap this module for their export.
 */

export const SDR_PALETTE = {
    bgDarker: '#000000',
    bgDark: '#0a0a0a',
    bgCard: '#171717',
    border: '#262626',
    text: '#e5e5e5',
    textMuted: '#a3a3a3',
    textWhite: '#f5f5f5',
    primary: '#737373',
    primaryDark: '#525252',
    accent: '#a3a3a3',
    link: '#a8a8a8',
    outlineVariant: '#1a1a1a',
    /** Positive UI — banked Pantone 341 C (same hue as particleEmerald; not neon) */
    success: '#00694e',
    error: '#ef4444',
    warning: '#f59e0b',
    /** `_palette[0]` Pantone 341 C */
    particleEmerald: '#00694e',
    /** `_palette[8]` Pantone 185 C */
    particleRed: '#e4002b',
    /** `_palette[11]` */
    particleGold: '#a09860',
    /** `_palette[15]` */
    particleSapphire: '#4070a0',
    chartTrack: 'rgba(255, 255, 255, 0.14)',
    /** Sprite clear / eraser — mirrors --sdr-pixel-paper */
    pixelPaper: '#ffffff',
};

/**
 * Ordered particle bases (same sequence as frame.js indices 0, 8, 11, 15).
 * Use for cycling series colors (bars, dice faces, distribution previews).
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
 * FP127 → emerald, ABDK → sapphire, Solady → gold, PRBMath → red.
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
    /** Major grid / log ticks — hairline on black, not full #262626 */
    gridColorMinor: 'rgba(163, 163, 163, 0.14)',
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
 * @param {string} fg
 * @param {string} bg
 * @param {number} t
 * @returns {string}
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
