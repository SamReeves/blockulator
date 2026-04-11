/**
 * Badge Viewer Component
 * Displays a badge as a readonly canvas at various sizes
 * Presentation layer - pure rendering component
 */

import { rgbaFromHex, SDR_PALETTE } from '../../theme/sdr-palette.js';

export class BadgeViewer {
    /**
     * Create a badge viewer element
     * @param {Uint8Array|Array} pixelData - 49,152 bytes (128x128 RGB)
     * @param {Object} options - Configuration options
     * @param {number} options.size - Display size in pixels (default: 128)
     * @param {boolean} options.showGrid - Show pixel grid overlay (default: false)
     * @param {boolean} options.clickToExpand - Enable click to view full size (default: false)
     * @returns {HTMLElement} Canvas element displaying the badge
     */
    static create(pixelData, options = {}) {
        const {
            size = 32,
            showGrid = false,
            clickToExpand = false
        } = options;

        // Validate pixel data
        if (!pixelData || pixelData.length !== 3072) {
            return this.createPlaceholder(size, 'Invalid pixel data');
        }

        // Create container
        const container = document.createElement('div');
        container.className = 'badge-viewer';
        container.style.cssText = `
            display: inline-block;
            position: relative;
            width: ${size}px;
            height: ${size}px;
        `;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        canvas.style.cssText = `
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        `;

        // Render pixel data
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(32, 32);
        
        // Convert RGB to RGBA
        for (let i = 0; i < 1024; i++) { // 32x32 pixels
            const srcOffset = i * 3;
            const dstOffset = i * 4;
            
            imageData.data[dstOffset] = pixelData[srcOffset];       // R
            imageData.data[dstOffset + 1] = pixelData[srcOffset + 1]; // G
            imageData.data[dstOffset + 2] = pixelData[srcOffset + 2]; // B
            imageData.data[dstOffset + 3] = 255;                      // A (opaque)
        }
        
        ctx.putImageData(imageData, 0, 0);

        // Add grid overlay if requested
        if (showGrid) {
            const gridCanvas = this.createGrid(size);
            container.appendChild(canvas);
            container.appendChild(gridCanvas);
        } else {
            container.appendChild(canvas);
        }

        // Add click to expand functionality
        if (clickToExpand) {
            container.style.cursor = 'pointer';
            container.addEventListener('click', () => {
                this.showFullSizeModal(pixelData);
            });
        }

        return container;
    }

    /**
     * Create a placeholder for when no badge exists
     * @param {number} size - Display size in pixels
     * @param {string} message - Message to display
     * @returns {HTMLElement}
     */
    static createPlaceholder(size, message = 'No badge') {
        const container = document.createElement('div');
        container.className = 'badge-viewer-placeholder';
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${size}px;
            height: ${size}px;
            background: ${SDR_PALETTE.bgCard};
            border-radius: 0;
            border: 1px dashed ${SDR_PALETTE.border};
            color: ${SDR_PALETTE.textMuted};
            font-size: ${Math.max(10, size / 10)}px;
            text-align: center;
            padding: 8px;
        `;
        container.textContent = message;
        return container;
    }

    /**
     * Create grid overlay
     * @param {number} size - Display size in pixels
     * @returns {HTMLElement}
     */
    static createGrid(size) {
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = 32;
        gridCanvas.height = 32;
        gridCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            image-rendering: pixelated;
        `;

        const ctx = gridCanvas.getContext('2d');
        ctx.strokeStyle = rgbaFromHex(SDR_PALETTE.border, 0.22);
        ctx.lineWidth = 1;

        // Draw vertical lines (every 4 pixels for 32x32)
        for (let x = 0; x <= 32; x += 4) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 32);
            ctx.stroke();
        }

        // Draw horizontal lines (every 4 pixels for 32x32)
        for (let y = 0; y <= 32; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(32, y);
            ctx.stroke();
        }

        return gridCanvas;
    }

    /**
     * Show full-size modal
     * @param {Uint8Array|Array} pixelData - Pixel data to display
     */
    static showFullSizeModal(pixelData) {
        // Create modal overlay
        const modal = document.createElement('div');
        const overlayBg = rgbaFromHex(SDR_PALETTE.bgDarker, 0.8);
        const liftShadow = `0 20px 60px ${rgbaFromHex(SDR_PALETTE.bgDarker, 0.5)}`;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${overlayBg};
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        // Create large badge viewer
        const viewer = this.create(pixelData, { size: 512, showGrid: false });
        viewer.style.boxShadow = liftShadow;
        viewer.style.borderRadius = '12px';
        viewer.style.overflow = 'hidden';

        modal.appendChild(viewer);

        // Close on click
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.body.appendChild(modal);
    }

    /**
     * Create empty pixel data (all black)
     * @returns {Uint8Array} 3,072 bytes of zeros
     */
    static createEmptyPixelData() {
        return new Uint8Array(3072);
    }

    /**
     * Create test pattern pixel data
     * @returns {Uint8Array} 3,072 bytes with a test pattern
     */
    static createTestPattern() {
        const data = new Uint8Array(3072);
        
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const offset = (y * 32 + x) * 3;
                
                // Create a gradient pattern
                data[offset] = Math.floor((x / 32) * 255);     // R
                data[offset + 1] = Math.floor((y / 32) * 255); // G
                data[offset + 2] = 128;                         // B
            }
        }
        
        return data;
    }

    /**
     * Convert hex color string to pixel data (solid color)
     * @param {string} hexColor - Hex color string (e.g. six-digit RRGGBB with leading #)
     * @returns {Uint8Array} 3,072 bytes with solid color
     */
    static createSolidColor(hexColor) {
        const data = new Uint8Array(3072);
        
        // Parse hex color
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        for (let i = 0; i < 1024; i++) {
            const offset = i * 3;
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
        }
        
        return data;
    }
}

