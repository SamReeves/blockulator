/**
 * Pixel Editor Component
 * MS Paint-style pixel art editor for on-chain image creation
 */

export class PixelEditor {
    constructor(containerSelector, initialWidth = 64, initialHeight = 64) {
        this.container = document.querySelector(containerSelector);
        this.width = initialWidth;
        this.height = initialHeight;
        this.pixelSize = 8; // Display size of each pixel
        this.currentColor = '#000000';
        this.currentTool = 'pen';
        this.isDrawing = false;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Create canvases
        this.canvas = document.createElement('canvas');
        this.displayCanvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.displayCtx = this.displayCanvas.getContext('2d');
        
        // Disable image smoothing for crisp pixels
        this.displayCtx.imageSmoothingEnabled = false;
        
        this.init();
    }
    
    init() {
        this.resize(this.width, this.height);
        this.clear();
        this.setupEventListeners();
        this.saveState(); // Initial state
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
    
    clear(color = '#FFFFFF') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.redraw();
        this.saveState();
    }
    
    redraw() {
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
        this.displayCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
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
            this.drawPixel(x, y, '#FFFFFF');
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
            this.drawLine(this.lastX, this.lastY, x, y, '#FFFFFF');
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
        
        // Emit color change event
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
