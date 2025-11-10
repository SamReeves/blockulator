/**
 * Pixel Editor Component
 * Interactive 128x128 pixel art editor with tools, color picker, and undo/redo
 * Presentation layer - handles all drawing and editing UI
 */

export class PixelEditor {
    constructor(options = {}) {
        this.width = 32;
        this.height = 32;
        this.pixelData = options.initialData || new Uint8Array(3072);
        
        // Drawing state
        this.currentColor = { r: 0, g: 0, b: 0 };
        this.currentTool = 'pencil'; // pencil, fill, eraser
        this.isDrawing = false;
        this.scale = options.scale || 12; // Canvas display scale (larger for easier editing)
        
        // Undo/redo stacks
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // UI elements (will be set during render)
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        
        // Callbacks
        this.onChange = options.onChange || (() => {});
        this.onSave = options.onSave || (() => {});
    }

    /**
     * Render the complete pixel editor UI
     * @returns {HTMLElement} Container with editor and tools
     */
    render() {
        this.container = document.createElement('div');
        this.container.className = 'pixel-editor';
        this.container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            background: var(--md-sys-color-surface);
            border-radius: 12px;
        `;

        // Create toolbar
        const toolbar = this.createToolbar();
        
        // Create canvas area
        const canvasArea = this.createCanvasArea();
        
        // Create color picker
        const colorPicker = this.createColorPicker();
        
        // Create action buttons
        const actions = this.createActionButtons();

        this.container.appendChild(toolbar);
        this.container.appendChild(canvasArea);
        this.container.appendChild(colorPicker);
        this.container.appendChild(actions);

        // Save initial state to undo stack
        this.saveState();

        return this.container;
    }

    /**
     * Create toolbar with drawing tools
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            padding: 0.5rem;
            background: var(--md-sys-color-surface-variant);
            border-radius: 8px;
        `;

        const tools = [
            { id: 'pencil', icon: '✏️', label: 'Pencil' },
            { id: 'fill', icon: '🪣', label: 'Fill' },
            { id: 'eraser', icon: '🧹', label: 'Eraser' },
            { id: 'clear', icon: '🗑️', label: 'Clear All' }
        ];

        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = `tool-btn ${tool.id === this.currentTool ? 'active' : ''}`;
            btn.innerHTML = `${tool.icon} ${tool.label}`;
            btn.style.cssText = `
                padding: 0.5rem 1rem;
                border: 2px solid transparent;
                background: ${tool.id === this.currentTool ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)'};
                color: ${tool.id === this.currentTool ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)'};
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s;
            `;

            btn.addEventListener('click', () => {
                if (tool.id === 'clear') {
                    this.clearCanvas();
                } else {
                    this.setTool(tool.id);
                    // Update all buttons
                    toolbar.querySelectorAll('.tool-btn').forEach(b => {
                        b.style.background = 'var(--md-sys-color-surface)';
                        b.style.color = 'var(--md-sys-color-on-surface)';
                    });
                    btn.style.background = 'var(--md-sys-color-primary)';
                    btn.style.color = 'var(--md-sys-color-on-primary)';
                }
            });

            toolbar.appendChild(btn);
        });

        // Add undo/redo buttons
        const undoBtn = document.createElement('button');
        undoBtn.innerHTML = '↶ Undo';
        undoBtn.style.cssText = `
            padding: 0.5rem 1rem;
            border: 2px solid var(--md-sys-color-outline);
            background: var(--md-sys-color-surface);
            color: var(--md-sys-color-on-surface);
            border-radius: 6px;
            cursor: pointer;
            margin-left: auto;
        `;
        undoBtn.addEventListener('click', () => this.undo());
        toolbar.appendChild(undoBtn);

        const redoBtn = document.createElement('button');
        redoBtn.innerHTML = '↷ Redo';
        redoBtn.style.cssText = `
            padding: 0.5rem 1rem;
            border: 2px solid var(--md-sys-color-outline);
            background: var(--md-sys-color-surface);
            color: var(--md-sys-color-on-surface);
            border-radius: 6px;
            cursor: pointer;
        `;
        redoBtn.addEventListener('click', () => this.redo());
        toolbar.appendChild(redoBtn);

        return toolbar;
    }

    /**
     * Create canvas area with grid
     */
    createCanvasArea() {
        const area = document.createElement('div');
        area.style.cssText = `
            position: relative;
            width: ${this.width * this.scale}px;
            height: ${this.height * this.scale}px;
            margin: 0 auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            overflow: hidden;
        `;

        // Create main canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
            cursor: crosshair;
        `;
        this.ctx = this.canvas.getContext('2d');

        // Load initial data
        this.redrawCanvas();

        // Add mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        area.appendChild(this.canvas);

        return area;
    }

    /**
     * Create color picker
     */
    createColorPicker() {
        const picker = document.createElement('div');
        picker.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            background: var(--md-sys-color-surface-variant);
            border-radius: 8px;
        `;

        // Current color display
        const colorDisplay = document.createElement('div');
        colorDisplay.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
        `;

        const colorSwatch = document.createElement('div');
        colorSwatch.id = 'color-swatch';
        colorSwatch.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b});
            border: 3px solid var(--md-sys-color-outline);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        `;

        const colorInfo = document.createElement('div');
        colorInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 0.25rem;">Current Color</div>
            <div id="color-rgb" style="font-family: monospace; font-size: 0.875rem;">
                RGB(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})
            </div>
        `;

        colorDisplay.appendChild(colorSwatch);
        colorDisplay.appendChild(colorInfo);
        picker.appendChild(colorDisplay);

        // RGB sliders
        const sliders = ['r', 'g', 'b'];
        const labels = { r: 'Red', g: 'Green', b: 'Blue' };
        
        sliders.forEach(channel => {
            const sliderGroup = document.createElement('div');
            sliderGroup.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            `;

            const label = document.createElement('label');
            label.textContent = labels[channel];
            label.style.cssText = `
                font-size: 0.875rem;
                font-weight: 500;
            `;

            const sliderRow = document.createElement('div');
            sliderRow.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '255';
            slider.value = this.currentColor[channel];
            slider.style.cssText = `
                flex: 1;
            `;

            const value = document.createElement('span');
            value.textContent = this.currentColor[channel];
            value.style.cssText = `
                font-family: monospace;
                font-size: 0.875rem;
                min-width: 3ch;
                text-align: right;
            `;

            slider.addEventListener('input', (e) => {
                this.currentColor[channel] = parseInt(e.target.value);
                value.textContent = this.currentColor[channel];
                colorSwatch.style.background = `rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
                document.getElementById('color-rgb').textContent = 
                    `RGB(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
            });

            sliderRow.appendChild(slider);
            sliderRow.appendChild(value);
            sliderGroup.appendChild(label);
            sliderGroup.appendChild(sliderRow);
            picker.appendChild(sliderGroup);
        });

        // Quick color presets
        const presets = document.createElement('div');
        presets.style.cssText = `
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        `;

        const colors = [
            { r: 0, g: 0, b: 0 },       // Black
            { r: 255, g: 255, b: 255 }, // White
            { r: 255, g: 0, b: 0 },     // Red
            { r: 0, g: 255, b: 0 },     // Green
            { r: 0, g: 0, b: 255 },     // Blue
            { r: 255, g: 255, b: 0 },   // Yellow
            { r: 255, g: 0, b: 255 },   // Magenta
            { r: 0, g: 255, b: 255 },   // Cyan
        ];

        colors.forEach(color => {
            const preset = document.createElement('button');
            preset.style.cssText = `
                width: 32px;
                height: 32px;
                background: rgb(${color.r}, ${color.g}, ${color.b});
                border: 2px solid var(--md-sys-color-outline);
                border-radius: 4px;
                cursor: pointer;
            `;
            preset.addEventListener('click', () => {
                this.currentColor = { ...color };
                // Update sliders and display
                picker.querySelectorAll('input[type="range"]').forEach((slider, i) => {
                    const channel = sliders[i];
                    slider.value = this.currentColor[channel];
                    slider.nextElementSibling.textContent = this.currentColor[channel];
                });
                colorSwatch.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
                document.getElementById('color-rgb').textContent = 
                    `RGB(${color.r}, ${color.g}, ${color.b})`;
            });
            presets.appendChild(preset);
        });

        picker.appendChild(presets);

        return picker;
    }

    /**
     * Create action buttons
     */
    createActionButtons() {
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 0.5rem;
            justify-content: center;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾 Save Badge';
        saveBtn.className = 'btn-primary';
        saveBtn.style.cssText = `
            padding: 1rem 2rem;
            background: var(--md-sys-color-primary);
            color: var(--md-sys-color-on-primary);
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        saveBtn.addEventListener('click', () => this.onSave(this.pixelData));

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '↻ Reset';
        resetBtn.style.cssText = `
            padding: 1rem 2rem;
            background: var(--md-sys-color-surface-variant);
            color: var(--md-sys-color-on-surface-variant);
            border: 2px solid var(--md-sys-color-outline);
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
        `;
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset to blank canvas? This cannot be undone.')) {
                this.pixelData = new Uint8Array(3072);
                this.undoStack = [];
                this.redoStack = [];
                this.saveState();
                this.redrawCanvas();
            }
        });

        actions.appendChild(saveBtn);
        actions.appendChild(resetBtn);

        return actions;
    }

    /**
     * Get pixel coordinates from mouse event
     */
    getPixelCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.scale);
        const y = Math.floor((e.clientY - rect.top) / this.scale);
        return { x, y };
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        this.isDrawing = true;
        this.saveState();
        
        const { x, y } = this.getPixelCoords(e);
        
        if (this.currentTool === 'fill') {
            this.floodFill(x, y);
        } else {
            this.drawPixel(x, y);
        }
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        if (!this.isDrawing) return;
        if (this.currentTool === 'fill') return; // Fill only on click
        
        const { x, y } = this.getPixelCoords(e);
        this.drawPixel(x, y);
    }

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        this.isDrawing = false;
    }

    /**
     * Draw a single pixel
     */
    drawPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        
        const offset = (y * this.width + x) * 3;
        
        if (this.currentTool === 'eraser') {
            this.pixelData[offset] = 255;
            this.pixelData[offset + 1] = 255;
            this.pixelData[offset + 2] = 255;
        } else {
            this.pixelData[offset] = this.currentColor.r;
            this.pixelData[offset + 1] = this.currentColor.g;
            this.pixelData[offset + 2] = this.currentColor.b;
        }
        
        this.redrawCanvas();
        this.onChange(this.pixelData);
    }

    /**
     * Flood fill algorithm
     */
    floodFill(startX, startY) {
        if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height) return;
        
        const startOffset = (startY * this.width + startX) * 3;
        const targetColor = {
            r: this.pixelData[startOffset],
            g: this.pixelData[startOffset + 1],
            b: this.pixelData[startOffset + 2]
        };
        
        // Don't fill if already the target color
        if (targetColor.r === this.currentColor.r &&
            targetColor.g === this.currentColor.g &&
            targetColor.b === this.currentColor.b) {
            return;
        }
        
        const stack = [{ x: startX, y: startY }];
        const visited = new Set();
        
        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
            
            const offset = (y * this.width + x) * 3;
            const r = this.pixelData[offset];
            const g = this.pixelData[offset + 1];
            const b = this.pixelData[offset + 2];
            
            if (r !== targetColor.r || g !== targetColor.g || b !== targetColor.b) continue;
            
            visited.add(key);
            
            // Fill this pixel
            this.pixelData[offset] = this.currentColor.r;
            this.pixelData[offset + 1] = this.currentColor.g;
            this.pixelData[offset + 2] = this.currentColor.b;
            
            // Add neighbors
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
        
        this.redrawCanvas();
        this.onChange(this.pixelData);
    }

    /**
     * Redraw entire canvas from pixel data
     */
    redrawCanvas() {
        const imageData = this.ctx.createImageData(this.width, this.height);
        
        for (let i = 0; i < 1024; i++) {  // 32*32 = 1024 pixels
            const srcOffset = i * 3;
            const dstOffset = i * 4;
            
            imageData.data[dstOffset] = this.pixelData[srcOffset];
            imageData.data[dstOffset + 1] = this.pixelData[srcOffset + 1];
            imageData.data[dstOffset + 2] = this.pixelData[srcOffset + 2];
            imageData.data[dstOffset + 3] = 255;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Set current tool
     */
    setTool(tool) {
        this.currentTool = tool;
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        if (confirm('Clear entire canvas? This can be undone.')) {
            this.saveState();
            this.pixelData.fill(255); // White
            this.redrawCanvas();
            this.onChange(this.pixelData);
        }
    }

    /**
     * Load pixel data from image
     */
    loadPixelDataFromImage(imageData) {
        if (imageData.length !== 3072) {
            throw new Error('Invalid pixel data size');
        }
        
        this.saveState();
        this.pixelData = new Uint8Array(imageData);
        this.redrawCanvas();
        this.onChange(this.pixelData);
    }

    /**
     * Save current state to undo stack
     */
    saveState() {
        const state = new Uint8Array(this.pixelData);
        this.undoStack.push(state);
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = []; // Clear redo stack on new action
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length <= 1) return;
        
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        
        this.pixelData = new Uint8Array(this.undoStack[this.undoStack.length - 1]);
        this.redrawCanvas();
        this.onChange(this.pixelData);
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) return;
        
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        
        this.pixelData = new Uint8Array(state);
        this.redrawCanvas();
        this.onChange(this.pixelData);
    }

    /**
     * Get current pixel data
     */
    getPixelData() {
        return this.pixelData;
    }

    /**
     * Load pixel data
     */
    loadPixelData(data) {
        if (data.length !== 3072) {
            throw new Error('Invalid pixel data size');
        }
        
        this.pixelData = new Uint8Array(data);
        this.undoStack = [];
        this.redoStack = [];
        this.saveState();
        this.redrawCanvas();
    }
}

