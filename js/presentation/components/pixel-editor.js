/**
 * Pixel Editor Component
 * MS Paint-style pixel art editor for on-chain image creation
 */

import { rgbaFromHex, SDR_PALETTE } from '../../theme/sdr-palette.js';

export class PixelEditor {
    constructor(options = {}) {
        // Support both old API (containerSelector string) and new API (options object)
        if (typeof options === 'string') {
            // Old API: constructor(containerSelector, initialWidth, initialHeight)
            this.container = document.querySelector(options);
            this.width = arguments[1] || 64;
            this.height = arguments[2] || 64;
            this.pixelSize = 8;
            this.onSave = null;
            this.initialData = null;
        } else {
            // New API: constructor({ containerSelector, initialData, width, height, scale, onSave })
            this.container = options.containerSelector ? document.querySelector(options.containerSelector) : null;
            this.width = options.width || 32;
            this.height = options.height || 32;
            this.pixelSize = options.scale || 8;
            this.onSave = options.onSave || null;
            this.initialData = options.initialData || null;
        }
        
        this.currentColor = SDR_PALETTE.bgDarker;
        this.currentTool = 'pen';
        this.isDrawing = false;
        this.colorPickerInput = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Create canvases
        this.canvas = document.createElement('canvas');
        this.displayCanvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.displayCtx = this.displayCanvas.getContext('2d');
        
        // Disable image smoothing for crisp pixels on both contexts
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.displayCtx.imageSmoothingEnabled = false;
        this.displayCtx.webkitImageSmoothingEnabled = false;
        this.displayCtx.mozImageSmoothingEnabled = false;
        this.displayCtx.msImageSmoothingEnabled = false;
        
        // Add CSS for crisp pixel rendering
        this.displayCanvas.style.imageRendering = 'pixelated';
        this.displayCanvas.style.imageRendering = '-moz-crisp-edges';
        this.displayCanvas.style.imageRendering = 'crisp-edges';
        
        this.init();
    }
    
    init() {
        this.resize(this.width, this.height);
        
        // Load initial data if provided
        if (this.initialData && this.initialData.length > 0) {
            this.loadPixelData(this.initialData);
        } else {
            this.clear();
        }
        
        this.setupEventListeners();
        this.saveState(); // Initial state
    }
    
    /**
     * Render the pixel editor UI
     * Returns a DOM element containing the complete editor interface
     */
    render() {
        const container = document.createElement('div');
        container.className = 'pixel-editor-container';
        container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';
        
        // Toolbar
        const toolbar = this.createToolbar();
        container.appendChild(toolbar);
        
        // Canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.style.cssText = 'display: flex; justify-content: center; background: var(--md-sys-color-surface-variant); padding: 2rem; border-radius: 8px;';
        
        // Ensure crisp rendering (in case it wasn't set in constructor)
        this.displayCanvas.style.imageRendering = 'pixelated';
        this.displayCanvas.style.webkitImageRendering = 'pixelated';
        this.displayCanvas.style.msInterpolationMode = 'nearest-neighbor';
        
        canvasContainer.appendChild(this.displayCanvas);
        container.appendChild(canvasContainer);
        
        // Save button
        if (this.onSave) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn-primary';
            saveBtn.textContent = '💾 Save Badge';
            saveBtn.style.cssText = 'padding: 0.75rem 2rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;';
            saveBtn.addEventListener('click', () => {
                const pixelData = this.getPixelData();
                this.onSave(pixelData);
            });
            container.appendChild(saveBtn);
        }
        
        this.element = container;
        return container;
    }
    
    /**
     * Create toolbar with drawing tools
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'pixel-editor-toolbar';
        toolbar.style.cssText = 'display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; padding: 1rem; background: var(--md-sys-color-surface-variant); border-radius: 8px;';
        
        // Color picker
        const colorGroup = document.createElement('div');
        colorGroup.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        colorGroup.innerHTML = '<label style="font-weight: bold;">Color:</label>';
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = this.currentColor;
        colorPicker.style.cssText = 'width: 50px; height: 40px; cursor: pointer; border: 2px solid var(--md-sys-color-outline); border-radius: 4px;';
        colorPicker.addEventListener('change', (e) => {
            this.setColor(e.target.value);
        });
        colorPicker.addEventListener('input', (e) => {
            this.setColor(e.target.value);
        });
        this.colorPickerInput = colorPicker;
        colorGroup.appendChild(colorPicker);
        toolbar.appendChild(colorGroup);
        
        // Tool buttons
        const toolsGroup = document.createElement('div');
        toolsGroup.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        toolsGroup.innerHTML = '<label style="font-weight: bold;">Tools:</label>';
        
        const tools = [
            { name: 'pen', icon: '✏️', title: 'Pen' },
            { name: 'eraser', icon: '🧹', title: 'Eraser' },
            { name: 'fill', icon: '🪣', title: 'Fill' },
            { name: 'eyedropper', icon: '💧', title: 'Color Picker' }
        ];
        
        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = tool.name === this.currentTool ? 'tool-btn active' : 'tool-btn';
            btn.textContent = tool.icon;
            btn.title = tool.title;
            btn.style.cssText = `padding: 0.5rem 1rem; border: 2px solid var(--md-sys-color-outline); border-radius: 4px; cursor: pointer; background: ${tool.name === this.currentTool ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)'}; font-size: 1.2rem;`;
            btn.addEventListener('click', () => {
                this.setTool(tool.name);
                // Update all tool buttons
                toolsGroup.querySelectorAll('.tool-btn').forEach(b => {
                    b.style.background = 'var(--md-sys-color-surface)';
                    b.classList.remove('active');
                });
                btn.style.background = 'var(--md-sys-color-primary)';
                btn.classList.add('active');
            });
            toolsGroup.appendChild(btn);
        });
        
        toolbar.appendChild(toolsGroup);
        
        // Action buttons
        const actionsGroup = document.createElement('div');
        actionsGroup.style.cssText = 'display: flex; gap: 0.5rem; margin-left: auto;';
        
        const undoBtn = document.createElement('button');
        undoBtn.textContent = '↶ Undo';
        undoBtn.style.cssText = 'padding: 0.5rem 1rem; border: 1px solid var(--md-sys-color-outline); border-radius: 4px; cursor: pointer; background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface);';
        undoBtn.addEventListener('click', () => this.undo());
        actionsGroup.appendChild(undoBtn);
        
        const redoBtn = document.createElement('button');
        redoBtn.textContent = '↷ Redo';
        redoBtn.style.cssText = 'padding: 0.5rem 1rem; border: 1px solid var(--md-sys-color-outline); border-radius: 4px; cursor: pointer; background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface);';
        redoBtn.addEventListener('click', () => this.redo());
        actionsGroup.appendChild(redoBtn);
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ Clear';
        clearBtn.style.cssText = 'padding: 0.5rem 1rem; border: 1px solid var(--md-sys-color-error); border-radius: 4px; cursor: pointer; background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-error);';
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear the entire canvas?')) {
                this.clear();
            }
        });
        actionsGroup.appendChild(clearBtn);
        
        toolbar.appendChild(actionsGroup);
        
        return toolbar;
    }
    
    /**
     * Load pixel data from byte array (RGB format: 32x32x3 = 3072 bytes)
     */
    loadPixelData(pixelData) {
        if (pixelData.length !== 3072) {
            console.error('Invalid pixel data length. Expected 3072 bytes for 32x32 RGB image.');
            return;
        }
        
        // Create ImageData from pixel bytes
        const imageData = this.ctx.createImageData(32, 32);
        
        for (let i = 0; i < 32 * 32; i++) {
            const r = pixelData[i * 3];
            const g = pixelData[i * 3 + 1];
            const b = pixelData[i * 3 + 2];
            
            imageData.data[i * 4] = r;
            imageData.data[i * 4 + 1] = g;
            imageData.data[i * 4 + 2] = b;
            imageData.data[i * 4 + 3] = 255; // Alpha
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.redraw();
    }
    
    /**
     * Get pixel data as byte array (RGB format)
     */
    getPixelData() {
        const imageData = this.ctx.getImageData(0, 0, 32, 32);
        const pixelData = new Uint8Array(3072);
        
        for (let i = 0; i < 32 * 32; i++) {
            pixelData[i * 3] = imageData.data[i * 4];       // R
            pixelData[i * 3 + 1] = imageData.data[i * 4 + 1]; // G
            pixelData[i * 3 + 2] = imageData.data[i * 4 + 2]; // B
        }
        
        return pixelData;
    }
    
    /**
     * Load pixel data from an uploaded image
     */
    loadPixelDataFromImage(pixelData) {
        this.loadPixelData(pixelData);
        this.saveState();
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        // Internal canvas (actual pixel data)
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Display canvas (scaled up)
        const displayWidth = width * this.pixelSize;
        const displayHeight = height * this.pixelSize;
        this.displayCanvas.width = displayWidth;
        this.displayCanvas.height = displayHeight;
        
        this.redraw();
    }
    
    setPixelSize(size) {
        this.pixelSize = size;
        this.displayCanvas.width = this.width * size;
        this.displayCanvas.height = this.height * size;
        this.redraw();
    }
    
    clear(color = SDR_PALETTE.pixelPaper) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.redraw();
        this.saveState();
    }
    
    redraw() {
        // Ensure no image smoothing (crisp pixel edges)
        this.displayCtx.imageSmoothingEnabled = false;
        this.displayCtx.webkitImageSmoothingEnabled = false;
        this.displayCtx.mozImageSmoothingEnabled = false;
        this.displayCtx.msImageSmoothingEnabled = false;
        
        // Scale up internal canvas to display canvas
        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayCtx.drawImage(
            this.canvas,
            0, 0, this.width, this.height,
            0, 0, this.width * this.pixelSize, this.height * this.pixelSize
        );
        
        // Draw grid if enabled
        if (this.showGrid) {
            this.drawGrid();
        }
    }
    
    drawGrid() {
        this.displayCtx.strokeStyle = rgbaFromHex(SDR_PALETTE.border, 0.22);
        this.displayCtx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.width; x++) {
            this.displayCtx.beginPath();
            this.displayCtx.moveTo(x * this.pixelSize, 0);
            this.displayCtx.lineTo(x * this.pixelSize, this.height * this.pixelSize);
            this.displayCtx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.height; y++) {
            this.displayCtx.beginPath();
            this.displayCtx.moveTo(0, y * this.pixelSize);
            this.displayCtx.lineTo(this.width * this.pixelSize, y * this.pixelSize);
            this.displayCtx.stroke();
        }
    }
    
    setupEventListeners() {
        this.displayCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.displayCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.displayCanvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.displayCanvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Touch support
        this.displayCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.displayCanvas.dispatchEvent(mouseEvent);
        });
        
        this.displayCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.displayCanvas.dispatchEvent(mouseEvent);
        });
        
        this.displayCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        });
    }
    
    getPixelCoords(e) {
        const rect = this.displayCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.pixelSize);
        const y = Math.floor((e.clientY - rect.top) / this.pixelSize);
        return { x, y };
    }
    
    handleMouseDown(e) {
        this.isDrawing = true;
        const { x, y } = this.getPixelCoords(e);
        
        if (this.currentTool === 'pen') {
            this.drawPixel(x, y, this.currentColor);
        } else if (this.currentTool === 'fill') {
            this.floodFill(x, y, this.currentColor);
        } else if (this.currentTool === 'eyedropper') {
            this.pickColor(x, y);
        } else if (this.currentTool === 'eraser') {
            this.drawPixel(x, y, SDR_PALETTE.pixelPaper);
        }
        
        this.lastX = x;
        this.lastY = y;
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing) return;
        
        const { x, y } = this.getPixelCoords(e);
        
        if (this.currentTool === 'pen') {
            // Draw line from last position to current (for smooth drawing)
            this.drawLine(this.lastX, this.lastY, x, y, this.currentColor);
            this.lastX = x;
            this.lastY = y;
        } else if (this.currentTool === 'eraser') {
            this.drawLine(this.lastX, this.lastY, x, y, SDR_PALETTE.pixelPaper);
            this.lastX = x;
            this.lastY = y;
        }
    }
    
    handleMouseUp() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }
    
    // Drawing tools
    
    drawPixel(x, y, color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, 1, 1);
        this.redraw();
    }
    
    drawLine(x0, y0, x1, y1, color) {
        // Bresenham's line algorithm
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            this.drawPixel(x0, y0, color);
            
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
    
    floodFill(x, y, fillColor) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const pixels = imageData.data;
        
        const targetColor = this.getPixelColor(x, y);
        if (this.colorsMatch(targetColor, this.hexToRgb(fillColor))) return;
        
        const fillRgb = this.hexToRgb(fillColor);
        const stack = [[x, y]];
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) continue;
            
            const idx = (cy * this.width + cx) * 4;
            const currentColor = [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
            
            if (!this.colorsMatch(currentColor, targetColor)) continue;
            
            // Fill pixel
            pixels[idx] = fillRgb[0];
            pixels[idx + 1] = fillRgb[1];
            pixels[idx + 2] = fillRgb[2];
            pixels[idx + 3] = 255;
            
            // Add neighbors
            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.redraw();
    }
    
    pickColor(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        
        const rgb = this.getPixelColor(x, y);
        this.currentColor = this.rgbToHex(rgb);
        
        if (this.colorPickerInput) {
            this.colorPickerInput.value = this.currentColor;
        }

        // Switch back to pen after picking
        this.setTool('pen');
        const toolBtns = this.element?.querySelectorAll('.tool-btn');
        if (toolBtns) {
            toolBtns.forEach(b => {
                const isPen = b.title === 'Pen';
                b.style.background = isPen ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)';
                b.classList.toggle('active', isPen);
            });
        }

        if (this.onColorPicked) {
            this.onColorPicked(this.currentColor);
        }
    }
    
    getPixelColor(x, y) {
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        return [imageData.data[0], imageData.data[1], imageData.data[2]];
    }
    
    // Undo/Redo
    
    saveState() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.undoStack.push(imageData);
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = []; // Clear redo stack on new action
    }
    
    undo() {
        if (this.undoStack.length <= 1) return; // Keep at least one state
        
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        
        const previous = this.undoStack[this.undoStack.length - 1];
        this.ctx.putImageData(previous, 0, 0);
        this.redraw();
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.ctx.putImageData(state, 0, 0);
        this.redraw();
    }
    
    // Export/Import
    
    getImageData() {
        return this.ctx.getImageData(0, 0, this.width, this.height);
    }
    
    setImageData(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
        this.redraw();
        this.saveState();
    }
    
    importFromImage(img) {
        this.ctx.drawImage(img, 0, 0, this.width, this.height);
        this.redraw();
        this.saveState();
    }
    
    getCanvas() {
        return this.displayCanvas;
    }
    
    // Utility functions
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }
    
    rgbToHex(rgb) {
        return '#' + rgb.map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    colorsMatch(color1, color2) {
        return color1[0] === color2[0] &&
               color1[1] === color2[1] &&
               color1[2] === color2[2];
    }
    
    setTool(tool) {
        this.currentTool = tool;
    }
    
    setColor(color) {
        this.currentColor = color;
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.redraw();
    }
}
