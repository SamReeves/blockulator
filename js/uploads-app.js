/**
 * Uploads App Entry Point
 * On-chain content uploads: images and text
 */

import { web3Provider } from './infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from './infrastructure/events/event-bus.js';
import { WalletConnectComponent, ToastComponent } from './presentation/components/index.js';
import { initConfetti } from './presentation/effects/confetti-animation.js';
import { getContractMetadata } from './infrastructure/config/contract-registry.js';
import { PixelEditor } from './presentation/components/pixel-editor.js';
import {
    CompressionMode,
    compress,
    decompress,
    analyzeImage,
    suggestMode,
    calculateDimensions,
    getModeCapacity
} from './domain/image-compression.js';

class UploadsApp {
    constructor(toastComponent = null) {
        this.web3Provider = web3Provider;
        this.factoryContract = null;
        this.factoryAbi = null;
        this.contentAbi = null;
        this.walletComponent = null;
        this.toastComponent = toastComponent; // Use shared toast or create new one
        this.currentView = 'upload'; // 'upload' or 'browse'
        
        // Compression state
        this.selectedMode = CompressionMode.RGB;
        this.currentImageData = null;
        this.currentDimensions = { width: 0, height: 0 };
        this.pixelEditor = null;
        this.isDrawingMode = false;
        
        // Crop tool state
        this.cropMode = 'scale'; // 'scale' or 'crop'
        this.cropSelection = null;
        this.originalImage = null;
        this.isDragging = false;
        this.dragStart = null;
    }

    async init() {
        console.log('📤 Initializing Uploads app...');

        try {
            // Check for existing wallet connection
            await this.web3Provider.checkConnection();

            // Initialize wallet component
            this.walletComponent = new WalletConnectComponent(this.web3Provider);
            this.walletComponent.render();

            // Initialize toast notifications
            this.toastComponent = new ToastComponent();

            // Initialize confetti
            initConfetti();

            // Initialize view-specific components
            await this.initViewOnly();

        } catch (error) {
            console.error('Failed to initialize uploads app:', error);
        }
    }

    async initViewOnly() {
        console.log('📤 Initializing Uploads view...');

        try {
            // Ensure toast component exists
            if (!this.toastComponent) {
                this.toastComponent = new ToastComponent();
            }

            // Load ABIs and factory contract
            await this.loadContracts();

            // Initialize UI
            await this.initializeUI();

            // Setup event listeners
            this.setupEventListeners();

            // Load recent content
            await this.loadRecentContent();

            console.log('✅ Uploads app ready');

        } catch (error) {
            console.error('Failed to initialize uploads view:', error);
        }
    }

    async loadContracts() {
        try {
            console.log('📋 Loading content contracts...');
            
            // Get content factory metadata
            const factoryMeta = getContractMetadata('content-factory-v3');
            const contentMeta = getContractMetadata('content-blueprint');

            console.log('Factory address:', factoryMeta.contractAddress);
            console.log('Factory ABI path:', factoryMeta.abi);

            // Load ABIs
            const factoryResponse = await fetch(factoryMeta.abi);
            if (!factoryResponse.ok) {
                throw new Error(`Failed to load factory ABI: ${factoryResponse.status}`);
            }
            this.factoryAbi = await factoryResponse.json();
            console.log('✅ Factory ABI loaded, functions:', this.factoryAbi.filter(x => x.type === 'function').map(x => x.name));

            const contentResponse = await fetch(contentMeta.abi);
            if (!contentResponse.ok) {
                throw new Error(`Failed to load content ABI: ${contentResponse.status}`);
            }
            this.contentAbi = await contentResponse.json();
            console.log('✅ Content ABI loaded');

            // Initialize factory contract
            if (factoryMeta.contractAddress && factoryMeta.contractAddress !== '0x0000000000000000000000000000000000000000') {
                // Get provider and check network
                const provider = this.web3Provider.getProvider();
                console.log('Provider type:', provider ? provider.constructor.name : 'null');
                
                if (provider) {
                    try {
                        const network = await provider.getNetwork();
                        console.log('Provider network:', network.name, 'chainId:', network.chainId);
                    } catch (netError) {
                        console.error('Failed to get network:', netError);
                    }
                    
                    // Check if contract has code
                    try {
                        const code = await provider.getCode(factoryMeta.contractAddress);
                        console.log('Contract has code:', code !== '0x', 'length:', code.length);
                    } catch (codeError) {
                        console.error('Failed to get contract code:', codeError);
                    }
                }
                
                this.factoryContract = this.web3Provider.getContract(
                    factoryMeta.contractAddress,
                    this.factoryAbi
                );
                console.log('📤 Content factory contract initialized:', factoryMeta.contractAddress);
                console.log('Contract object:', this.factoryContract);
                console.log('Available functions:', Object.keys(this.factoryContract.functions || {}));
                
                // Test the contract connection
                try {
                    console.log('Testing contract call: get_content_count()...');
                    const testCount = await this.factoryContract.get_content_count();
                    console.log('✅ Contract connection verified, content count:', testCount.toString());
                } catch (testError) {
                    console.error('⚠️ Contract call test failed:', testError);
                    console.error('Error details:', {
                        code: testError.code,
                        method: testError.method,
                        data: testError.data
                    });
                }
            } else {
                console.warn('⚠️ Content factory not deployed yet');
            }

        } catch (error) {
            console.error('Failed to load contracts:', error);
        }
    }

    async initializeUI() {
        // Initialize upload form
        this.initUploadForm();

        // Initialize content browser
        this.initContentBrowser();

        // Show default view
        this.showView('upload');
    }

    initUploadForm() {
        const form = document.getElementById('upload-form');
        if (!form) return;

        // Upload type toggle
        const imageBtn = document.getElementById('upload-type-image');
        const drawBtn = document.getElementById('upload-type-draw');
        const textBtn = document.getElementById('upload-type-text');
        const imageSection = document.getElementById('image-upload-section');
        const drawSection = document.getElementById('draw-upload-section');
        const textSection = document.getElementById('text-upload-section');

        if (imageBtn && textBtn) {
            imageBtn.addEventListener('click', () => {
                imageBtn.classList.add('active');
                if (drawBtn) drawBtn.classList.remove('active');
                textBtn.classList.remove('active');
                if (imageSection) imageSection.style.display = 'block';
                if (drawSection) drawSection.style.display = 'none';
                if (textSection) textSection.style.display = 'none';
                this.isDrawingMode = false;
            });

            if (drawBtn) {
                drawBtn.addEventListener('click', () => {
                    drawBtn.classList.add('active');
                    imageBtn.classList.remove('active');
                    textBtn.classList.remove('active');
                    if (drawSection) drawSection.style.display = 'block';
                    if (imageSection) imageSection.style.display = 'none';
                    if (textSection) textSection.style.display = 'none';
                    this.isDrawingMode = true;
                    setTimeout(() => this.initPixelEditor(), 100);
                });
            }

            textBtn.addEventListener('click', () => {
                textBtn.classList.add('active');
                imageBtn.classList.remove('active');
                if (drawBtn) drawBtn.classList.remove('active');
                if (textSection) textSection.style.display = 'block';
                if (imageSection) imageSection.style.display = 'none';
                if (drawSection) drawSection.style.display = 'none';
                this.isDrawingMode = false;
            });
        }

        // Image upload handling
        const imageInput = document.getElementById('image-input');
        const canvas = document.getElementById('image-preview-canvas');
        if (imageInput && canvas) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e, canvas));
        }

        // Compression mode selector
        this.initCompressionModeSelector();
        
        // Crop tool
        this.initCropTool();

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    initCompressionModeSelector() {
        const cards = document.querySelectorAll('.compression-mode-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const mode = parseInt(card.dataset.mode);
                this.selectCompressionMode(mode);
            });
        });

        // Select RGB by default
        this.selectCompressionMode(CompressionMode.RGB);
    }
    
    selectCompressionMode(mode) {
        this.selectedMode = mode;
        
        // Update UI
        document.querySelectorAll('.compression-mode-card').forEach(card => {
            if (parseInt(card.dataset.mode) === mode) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Update mode label
        const modeLabel = document.getElementById('compression-mode-label');
        if (modeLabel) {
            modeLabel.textContent = getModeCapacity(mode).description;
        }

        console.log(`🎨 Selected compression mode: ${mode} (${getModeCapacity(mode).description})`);

        // Update preview if image is loaded
        if (this.currentImageData || this.pixelEditor) {
            this.updateCompressedPreview();
        }
    }
    
    initCropTool() {
        const scaleBtn = document.getElementById('crop-mode-scale');
        const cropBtn = document.getElementById('crop-mode-crop');
        const canvas = document.getElementById('crop-source-canvas');
        const selection = document.getElementById('crop-selection');
        const instructions = document.getElementById('crop-instructions');
        
        if (!scaleBtn || !cropBtn || !canvas) return;
        
        scaleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.cropMode = 'scale';
            this.cropSelection = null;
            scaleBtn.classList.add('active');
            cropBtn.classList.remove('active');
            scaleBtn.style.background = 'rgba(102, 126, 234, 0.3)';
            scaleBtn.style.border = '1px solid rgba(102, 126, 234, 0.5)';
            cropBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            cropBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            selection.style.display = 'none';
            instructions.innerHTML = '<strong>Scale mode:</strong> Entire image will be scaled to fit. Click "✂️ Crop" to select a region instead.';
            this.processImage();
        });
        
        cropBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.cropMode = 'crop';
            cropBtn.classList.add('active');
            scaleBtn.classList.remove('active');
            cropBtn.style.background = 'rgba(102, 126, 234, 0.3)';
            cropBtn.style.border = '1px solid rgba(102, 126, 234, 0.5)';
            scaleBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            scaleBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            canvas.style.cursor = 'crosshair';
            instructions.innerHTML = '<strong>Crop mode:</strong> Drag on the image to select a region to upload at full resolution.';
        });
        
        // Mouse events for cropping
        canvas.addEventListener('mousedown', (e) => this.handleCropMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleCropMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleCropMouseUp(e));
        canvas.addEventListener('mouseleave', () => this.isDragging = false);
    }
    
    handleCropMouseDown(e) {
        e.preventDefault();
        if (this.cropMode !== 'crop') return;
        
        const canvas = document.getElementById('crop-source-canvas');
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        this.isDragging = true;
        this.dragStart = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    handleCropMouseMove(e) {
        e.preventDefault();
        if (!this.isDragging || this.cropMode !== 'crop') return;
        
        const canvas = document.getElementById('crop-source-canvas');
        const selection = document.getElementById('crop-selection');
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;
        
        const x = Math.min(this.dragStart.x, currentX);
        const y = Math.min(this.dragStart.y, currentY);
        const width = Math.abs(currentX - this.dragStart.x);
        const height = Math.abs(currentY - this.dragStart.y);
        
        // Calculate display position (scaled to canvas display size)
        const displayX = x / scaleX;
        const displayY = y / scaleY;
        const displayWidth = width / scaleX;
        const displayHeight = height / scaleY;
        
        selection.style.left = displayX + 'px';
        selection.style.top = displayY + 'px';
        selection.style.width = displayWidth + 'px';
        selection.style.height = displayHeight + 'px';
        selection.style.display = 'block';
        
        const label = selection.querySelector('div');
        label.textContent = `${Math.round(width)}×${Math.round(height)}`;
        
        this.cropSelection = { x, y, width, height };
    }
    
    handleCropMouseUp(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        this.isDragging = false;
        
        if (this.cropSelection && this.cropSelection.width > 10 && this.cropSelection.height > 10) {
            this.processImage();
        }
    }
    
    initPixelEditor() {
        if (this.pixelEditor) return; // Already initialized
        
        const container = document.getElementById('pixel-editor-canvas-container');
        if (!container) return;
        
        // Create pixel editor
        this.pixelEditor = new PixelEditor('#pixel-editor-canvas-container', 64, 64);
        container.appendChild(this.pixelEditor.getCanvas());
        
        // Setup controls
        const sizeSelect = document.getElementById('pixel-editor-size');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                const size = parseInt(e.target.value);
                this.pixelEditor.resize(size, size);
            });
        }
        
        const zoomSelect = document.getElementById('pixel-editor-zoom');
        if (zoomSelect) {
            zoomSelect.addEventListener('change', (e) => {
                const zoom = parseInt(e.target.value);
                this.pixelEditor.setPixelSize(zoom);
            });
        }
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.pixelEditor.setTool(btn.dataset.tool);
            });
        });
        
        // Color picker
        const colorPicker = document.getElementById('pixel-editor-color');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.pixelEditor.setColor(e.target.value);
            });
            
            // Sync color when picked with eyedropper
            this.pixelEditor.onColorPicked = (color) => {
                colorPicker.value = color;
            };
        }
        
        // Palette colors
        document.querySelectorAll('.palette-color').forEach(color => {
            color.addEventListener('click', () => {
                const colorValue = color.dataset.color;
                this.pixelEditor.setColor(colorValue);
                if (colorPicker) colorPicker.value = colorValue;
            });
        });
        
        // Action buttons
        const undoBtn = document.getElementById('pixel-editor-undo');
        if (undoBtn) undoBtn.addEventListener('click', () => this.pixelEditor.undo());
        
        const redoBtn = document.getElementById('pixel-editor-redo');
        if (redoBtn) redoBtn.addEventListener('click', () => this.pixelEditor.redo());
        
        const clearBtn = document.getElementById('pixel-editor-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear the canvas?')) {
                    this.pixelEditor.clear();
                }
            });
        }
    }
    
    updateCompressedPreview() {
        // Update stats for single preview
        const canvas = document.getElementById('image-preview-canvas');
        if (!canvas || canvas.width === 0) return;
        
        const width = canvas.width;
        const height = canvas.height;
        const capacity = getModeCapacity(this.selectedMode);
        
        // Calculate size for selected mode
        let estimatedBytes;
        if (typeof capacity.bytesPerPixel === 'number') {
            estimatedBytes = Math.ceil(width * height * capacity.bytesPerPixel);
        } else {
            estimatedBytes = width * height * 3; // Fallback to RGB
        }
        
        const statsDiv = document.getElementById('compression-stats');
        if (statsDiv) {
            const originalSize = width * height * 3;
            const savings = originalSize > 0 ? ((1 - estimatedBytes / originalSize) * 100).toFixed(1) : '0.0';
            
            statsDiv.innerHTML = `
                <div style="padding: 0.5rem; background: rgba(102, 126, 234, 0.1); border-radius: 4px;">
                    <div><strong>Dimensions:</strong> ${width}×${height} pixels</div>
                    <div><strong>Estimated size:</strong> ${estimatedBytes.toLocaleString()} bytes</div>
                    <div><strong>Original RGB:</strong> ${originalSize.toLocaleString()} bytes</div>
                    <div><strong>Savings:</strong> ${savings}% smaller</div>
                    <div style="margin-top: 0.25rem; opacity: 0.8;">
                        <strong>Mode capacity:</strong> ${capacity.maxDimensions}
                    </div>
                </div>
            `;
        }
    }

    processImage() {
        if (!this.originalImage) return;
        
        const canvas = document.getElementById('image-preview-canvas');
        const ctx = canvas.getContext('2d');
        const img = this.originalImage;
        
        // Contract limits - use SAFE byte limits (not theoretical max)
        const MAX_DIMENSION = 128;
        const SAFE_MAX_BYTES = 15987; // RGB safe deployment limit (73×73)
        const MAX_PIXELS = Math.floor(SAFE_MAX_BYTES / 3); // 5,329 pixels for RGB
        
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        
        // If cropping, use crop selection
        if (this.cropMode === 'crop' && this.cropSelection) {
            sourceX = Math.round(this.cropSelection.x);
            sourceY = Math.round(this.cropSelection.y);
            sourceWidth = Math.round(this.cropSelection.width);
            sourceHeight = Math.round(this.cropSelection.height);
        }
        
        // Calculate optimal dimensions preserving aspect ratio
        let targetWidth = sourceWidth;
        let targetHeight = sourceHeight;
        const aspectRatio = sourceWidth / sourceHeight;
        
        // Scale down if either dimension exceeds max
        if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            if (aspectRatio > 1) {
                targetWidth = MAX_DIMENSION;
                targetHeight = Math.round(MAX_DIMENSION / aspectRatio);
            } else {
                targetHeight = MAX_DIMENSION;
                targetWidth = Math.round(MAX_DIMENSION * aspectRatio);
            }
        }
        
        // Scale down if total pixels exceed max
        const totalPixels = targetWidth * targetHeight;
        let wasScaledDown = false;
        if (totalPixels > MAX_PIXELS) {
            wasScaledDown = true;
            const scale = Math.sqrt(MAX_PIXELS / totalPixels);
            targetWidth = Math.floor(targetWidth * scale);
            targetHeight = Math.floor(targetHeight * scale);
        }
        
        // Ensure at least 1x1
        targetWidth = Math.max(1, targetWidth);
        targetHeight = Math.max(1, targetHeight);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image from source region
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        // Show preview
        canvas.style.display = 'block';
        
        const totalBytes = targetWidth * targetHeight * 3;
        const modeText = this.cropMode === 'crop' ? '(cropped)' : '(scaled)';
        console.log(`✅ Image processed ${modeText}: ${targetWidth}×${targetHeight} (${totalBytes.toLocaleString()} bytes)`);
        
        // Show warning if image was scaled down
        if (wasScaledDown && this.toastComponent) {
            this.toastComponent.show(`Image auto-scaled to ${targetWidth}×${targetHeight} to fit on-chain storage limits (max ${MAX_PIXELS.toLocaleString()} pixels for RGB)`, 'info');
        }
        
        // Update UI
        const infoDiv = document.getElementById('image-info');
        if (infoDiv) {
            const cropInfo = this.cropMode === 'crop' && this.cropSelection ? 
                `<br><strong>Crop region:</strong> ${Math.round(sourceWidth)}×${Math.round(sourceHeight)} from ${img.width}×${img.height}` : 
                `<br><strong>Original:</strong> ${img.width}×${img.height}`;
            
            const warningBadge = wasScaledDown ? 
                `<br><span style="color: #fbbf24; font-size: 0.85em;">⚠️ Auto-scaled to fit deployment limit (max 5,329 RGB pixels)</span>` : '';
            
            infoDiv.innerHTML = `
                <div style="padding: 0.5rem; background: rgba(102, 126, 234, 0.2); border-radius: 4px; margin-top: 0.5rem;">
                    <strong>Dimensions:</strong> ${targetWidth}×${targetHeight} pixels<br>
                    <strong>Size:</strong> ${totalBytes.toLocaleString()} bytes (${(totalBytes/1024).toFixed(2)} KB)
                    ${cropInfo}${warningBadge}
                </div>
            `;
        }
        
        // Store and update preview
        this.currentImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        this.currentDimensions = { width: targetWidth, height: targetHeight };
        this.updateCompressedPreview();
    }
    
    handleImageUpload(event, canvas) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Store original image
                this.originalImage = img;
                this.cropSelection = null;
                this.cropMode = 'scale';
                
                // Show crop tool
                const cropContainer = document.getElementById('crop-tool-container');
                const cropCanvas = document.getElementById('crop-source-canvas');
                const cropSelection = document.getElementById('crop-selection');
                
                if (cropContainer && cropCanvas) {
                    cropContainer.style.display = 'block';
                    cropCanvas.width = img.width;
                    cropCanvas.height = img.height;
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(img, 0, 0);
                    cropSelection.style.display = 'none';
                    
                    // Reset buttons
                    const scaleBtn = document.getElementById('crop-mode-scale');
                    const cropBtn = document.getElementById('crop-mode-crop');
                    if (scaleBtn) scaleBtn.click();
                }
                
                // Process with default (scale) mode
                this.processImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.factoryContract) {
            this.toastComponent.show('Contract not deployed yet', 'error');
            return;
        }

        const uploadType = document.querySelector('.upload-type-btn.active').dataset.type;

        try {
            if (uploadType === 'image') {
                await this.uploadImage();
            } else {
                await this.uploadText();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            this.toastComponent.show('Upload failed: ' + error.message, 'error');
        }
    }

    async uploadImage() {
        const canvas = document.getElementById('image-preview-canvas');
        if (!canvas || canvas.width === 0) {
            this.toastComponent.show('Please select an image first', 'error');
            return;
        }

        const width = canvas.width;
        const height = canvas.height;

        // Get pixel data from canvas
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Compress using selected mode
        console.log(`📤 Compressing ${width}×${height} image with mode ${this.selectedMode}`);
        const compressed = compress(imageData, width, height, this.selectedMode);
        
        const compressedData = compressed.data;
        const paletteSize = compressed.paletteSize || 0;
        
        // Validate size against practical deployment limits
        // Theoretical max is 16,384 bytes, but deployment overhead requires headroom
        const practicalLimits = {
            0: 15987,  // RGB: 73×73 max
            1: 16384,  // Grayscale: 128×128 max
            2: 16384,  // Monochrome: uses bit packing, plenty of room
            3: 15376,  // Indexed: 124×124 + palette
            5: 16384   // RGB565: 90×90 max
        };
        
        const maxSize = practicalLimits[this.selectedMode] || 16384;
        
        if (compressedData.length > maxSize) {
            this.toastComponent.show(`Compressed data too large: ${compressedData.length} bytes (safe max: ${maxSize.toLocaleString()}). Please reduce image dimensions.`, 'error');
            console.error(`❌ Data exceeds safe deployment limit: ${compressedData.length} > ${maxSize} bytes`);
            return;
        }
        
        if (compressedData.length > 16384) {
            this.toastComponent.show(`Compressed data exceeds storage limit: ${compressedData.length} bytes (max 16,384).`, 'error');
            console.error(`❌ Compressed data exceeds storage limit: ${compressedData.length} bytes`);
            return;
        }

        const dataBytes = window.ethers.utils.hexlify(compressedData);
        
        const modeNames = ['RGB', 'Grayscale', 'Monochrome', 'Indexed', 'RLE', 'RGB565'];
        console.log(`📤 Uploading ${width}×${height} image (${modeNames[this.selectedMode]})`);
        console.log(`   Mode: ${this.selectedMode}`);
        console.log(`   Compressed bytes: ${compressedData.length}`);
        console.log(`   Palette size: ${paletteSize}`);
        console.log(`   Original RGB would be: ${width * height * 3} bytes`);
        console.log(`   Savings: ${((1 - compressedData.length / (width * height * 3)) * 100).toFixed(1)}%`);
        
        // Validate for contract
        const expectedSize = this.selectedMode === CompressionMode.RGB ? width * height * 3 :
                            this.selectedMode === CompressionMode.GRAYSCALE ? width * height :
                            this.selectedMode === CompressionMode.MONOCHROME ? Math.ceil((width * height) / 8) :
                            this.selectedMode === CompressionMode.INDEXED ? (paletteSize * 3) + (width * height) :
                            this.selectedMode === CompressionMode.RGB565 ? width * height * 2 : 0;
        
        if (expectedSize > 0 && compressedData.length !== expectedSize) {
            console.error(`❌ Size mismatch: got ${compressedData.length}, expected ${expectedSize}`);
            this.toastComponent.show(`Data size mismatch: got ${compressedData.length} bytes, contract expects ${expectedSize} bytes`, 'error');
            return;
        }

        this.toastComponent.show(`Creating ${modeNames[this.selectedMode]} image on-chain...`, 'info');

        try {
            const tx = await this.factoryContract.create_image(
                this.selectedMode,
                width,
                height,
                paletteSize,
                dataBytes,
                {
                    gasLimit: 12000000 // Sufficient for max-size images (~10.2M gas + safety margin)
                }
            );

            this.toastComponent.show('Transaction submitted...', 'info');
            await tx.wait();

            this.toastComponent.show(`${modeNames[this.selectedMode]} image uploaded successfully! 🎉`, 'success');
            eventBus.emit(EVENTS.GAME_EVENT, { type: 'upload', success: true });

            // Refresh content list
            setTimeout(() => this.loadRecentContent(), 2000);
        } catch (error) {
            console.error('❌ Contract error:', error);
            if (error.message.includes('Data size mismatch')) {
                this.toastComponent.show('Contract rejected: data size mismatch. Try a different compression mode.', 'error');
            } else if (error.message.includes('Image too large') || error.message.includes('Data too large')) {
                this.toastComponent.show('Image exceeds contract size limit (16KB). Try a different compression mode.', 'error');
            } else if (error.message.includes('Invalid mode')) {
                this.toastComponent.show('Invalid compression mode selected.', 'error');
            } else {
                throw error; // Re-throw for outer catch
            }
        }
    }

    async uploadText() {
        const textarea = document.getElementById('text-input');
        if (!textarea || !textarea.value.trim()) {
            this.toastComponent.show('Please enter some text', 'error');
            return;
        }

        const text = textarea.value;
        const textBytes = window.ethers.utils.toUtf8Bytes(text);

        if (textBytes.length > 16384) {
            this.toastComponent.show('Text too large (max 16KB)', 'error');
            return;
        }

        this.toastComponent.show('Creating text on-chain...', 'info');

        const tx = await this.factoryContract.create_text(
            window.ethers.utils.hexlify(textBytes)
        );

        this.toastComponent.show('Transaction submitted...', 'info');
        await tx.wait();

        this.toastComponent.show('Text uploaded successfully!', 'success');
        eventBus.emit(EVENTS.GAME_EVENT, { type: 'upload', success: true });

        // Clear form and refresh content list
        textarea.value = '';
        setTimeout(() => this.loadRecentContent(), 2000);
    }

    initContentBrowser() {
        // Load recent content when browser is shown
        const browserSection = document.getElementById('content-browser-section');
        if (browserSection) {
            this.loadRecentContent();
        }
    }

    async loadRecentContent() {
        if (!this.factoryContract) {
            console.log('No factory contract loaded');
            return;
        }

        const contentList = document.getElementById('content-list');
        if (!contentList) return;

        try {
            console.log('Loading content count from factory...');
            const count = await this.factoryContract.get_content_count();
            console.log('Content count:', count.toString());

            if (count.toNumber() === 0) {
                contentList.innerHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.5);">📭 No uploads yet. Be the first!</div>';
                return;
            }

            contentList.innerHTML = '<div style="padding: 1rem; color: rgba(255,255,255,0.6);">Loading uploads...</div>';

            // Load last 20 items
            const start = Math.max(0, count.toNumber() - 20);
            contentList.innerHTML = '';
            
            for (let i = count.toNumber() - 1; i >= start; i--) {
                try {
                    const entry = await this.factoryContract.get_content_by_index(i);
                    await this.renderContentEntry(entry, contentList);
                } catch (entryError) {
                    console.error(`Failed to load entry ${i}:`, entryError);
                }
            }

            if (contentList.children.length === 0) {
                contentList.innerHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.5);">📭 No uploads found</div>';
            }

        } catch (error) {
            console.error('Failed to load content:', error);
            contentList.innerHTML = '<div class="error-state" style="padding: 2rem; text-align: center; color: rgba(255,100,100,0.8);">⚠️ Error loading uploads. Contract may not be deployed yet.</div>';
        }
    }

    async renderContentEntry(entry, container) {
        const div = document.createElement('div');
        div.className = 'content-entry';

        // V3 entries have 'mode' field, old entries have 'content_type'
        const isImage = entry.mode !== undefined || entry.content_type === 0;
        const typeIcon = isImage ? '🖼️' : '📝';
        const typeName = isImage ? 'Image' : 'Text';
        const date = new Date(entry.creation_time.toNumber() * 1000).toLocaleString();
        
        // Links to Etherscan
        const etherscanUrl = `https://sepolia.etherscan.io/address/${entry.content_address}`;
        const creatorUrl = `https://sepolia.etherscan.io/address/${entry.creator}`;

        div.innerHTML = `
            <div class="content-entry-header">
                <span class="content-type">${typeIcon} ${typeName}</span>
                <span class="content-size">${entry.data_size.toNumber().toLocaleString()} bytes</span>
            </div>
            <div class="content-entry-meta">
                <a href="${creatorUrl}" target="_blank" rel="noopener noreferrer" 
                   class="content-creator" 
                   title="${entry.creator}"
                   style="color: var(--md-sys-color-secondary); text-decoration: none; cursor: pointer;"
                   onclick="event.stopPropagation()">
                    ${entry.creator.slice(0, 6)}...${entry.creator.slice(-4)}
                </a>
                <span class="content-date">${date}</span>
            </div>
            <div class="content-preview" id="preview-${entry.content_address}">
                <div style="padding: 0.5rem; color: rgba(255,255,255,0.5); font-style: italic;">Loading...</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; justify-content: space-between;">
                <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer" 
                   class="content-link" 
                   style="font-size: 0.75rem; color: var(--md-sys-color-primary); text-decoration: none;" 
                   onclick="event.stopPropagation()">
                    🔗 View on Etherscan
                </a>
                <span style="font-size: 0.7rem; color: rgba(255,255,255,0.3); display: flex; gap: 0.25rem; align-items: center;">
                    ${entry.content_address.slice(0, 10)}...
                    <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${entry.content_address}').then(() => uploadsApp.toastComponent.show('Address copied!', 'success'))" 
                            style="padding: 0.15rem 0.3rem; background: rgba(102, 126, 234, 0.2); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 3px; cursor: pointer; font-size: 0.65rem;"
                            title="Copy contract address">
                        📋
                    </button>
                </span>
            </div>
        `;

        // Make entry clickable to view details
        div.addEventListener('click', () => {
            this.showContentDetail(entry);
        });

        container.appendChild(div);
        
        // Load and render the actual content
        await this.loadAndRenderContent(entry);
    }
    
    async loadAndRenderContent(entry) {
        try {
            // Get content contract instance
            const contentContract = this.web3Provider.getContract(
                entry.content_address,
                this.contentAbi
            );
            
            const previewDiv = document.getElementById(`preview-${entry.content_address}`);
            if (!previewDiv) return;
            
            // V3 factory entries have 'mode' field, old entries have 'content_type'
            const isV3Image = entry.mode !== undefined;
            const isOldImage = entry.content_type === 0;
            
            if (isV3Image || isOldImage) {
                // Image content
                console.log('Loading image from:', entry.content_address, isV3Image ? '(V3)' : '(old)');
                const [data, metadata] = await Promise.all([
                    contentContract.get_image_data(),
                    contentContract.get_metadata()
                ]);
                
                const mode = metadata[0];
                const w = metadata[1].toNumber();
                const h = metadata[2].toNumber();
                const paletteSize = metadata[3].toNumber();
                console.log(`Image: ${w}×${h}, mode ${mode}, palette ${paletteSize}`);
                
                // Convert to Uint8Array
                const bytes = window.ethers.utils.arrayify(data);
                console.log(`Compressed data: ${bytes.length} bytes`);
                
                // Decompress using the compression mode
                const decompressed = decompress(bytes, w, h, mode, paletteSize);
                
                // Create canvas to render image
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.style.maxWidth = '200px';
                canvas.style.height = 'auto';
                canvas.style.imageRendering = 'pixelated';
                canvas.style.border = '1px solid rgba(102, 126, 234, 0.3)';
                canvas.style.borderRadius = '4px';
                
                const ctx = canvas.getContext('2d');
                ctx.putImageData(decompressed, 0, 0);
                
                previewDiv.innerHTML = '';
                previewDiv.appendChild(canvas);
                console.log('✅ Image rendered successfully');
                
            } else {
                // Text content - try both old and new methods
                let text;
                try {
                    // Try V2 method first (get_text)
                    const data = await contentContract.get_text();
                    const bytes = window.ethers.utils.arrayify(data);
                    text = window.ethers.utils.toUtf8String(bytes);
                } catch (e) {
                    try {
                        // Fallback to old content_data method
                        const data = await contentContract.content_data();
                        const bytes = window.ethers.utils.arrayify(data);
                        text = window.ethers.utils.toUtf8String(bytes);
                    } catch (e2) {
                        console.error('Failed to load text content:', e2);
                        text = 'Error loading text content';
                    }
                }
                
                const textDiv = document.createElement('div');
                textDiv.style.cssText = 'padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 4px; border: 1px solid rgba(102, 126, 234, 0.3); white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 0.85rem; line-height: 1.4;';
                textDiv.textContent = text;
                
                previewDiv.innerHTML = '';
                previewDiv.appendChild(textDiv);
            }
            
        } catch (error) {
            console.error('Failed to load content:', error);
            const previewDiv = document.getElementById(`preview-${entry.content_address}`);
            if (previewDiv) {
                previewDiv.innerHTML = '<div style="padding: 0.5rem; color: rgba(255,100,100,0.8); font-size: 0.85rem;">Failed to load content</div>';
            }
        }
    }

    showView(viewName) {
        this.currentView = viewName;

        const uploadSection = document.getElementById('upload-section');
        const browserSection = document.getElementById('content-browser-section');

        if (viewName === 'upload') {
            if (uploadSection) uploadSection.style.display = 'block';
            if (browserSection) browserSection.style.display = 'none';
        } else {
            if (uploadSection) uploadSection.style.display = 'none';
            if (browserSection) browserSection.style.display = 'block';
            this.loadRecentContent();
        }
    }

    setupEventListeners() {
        // View toggle buttons
        const uploadBtn = document.getElementById('show-upload-btn');
        const browseBtn = document.getElementById('show-browse-btn');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showView('upload'));
        }

        if (browseBtn) {
            browseBtn.addEventListener('click', () => this.showView('browse'));
        }

        // Back to list button
        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showContentList());
        }

        // Listen for wallet connection
        eventBus.on(EVENTS.WALLET_CONNECTED, async () => {
            console.log('Wallet connected, reloading contracts...');
            await this.loadContracts();
        });
    }

    /**
     * Show content detail view
     */
    async showContentDetail(entry) {
        const listSection = document.getElementById('content-list-section');
        const detailSection = document.getElementById('content-detail-section');
        const detailContainer = document.getElementById('content-detail-container');
        
        if (!detailSection || !detailContainer) return;
        
        // Hide list, show detail
        if (listSection) listSection.style.display = 'none';
        detailSection.style.display = 'block';
        
        // Show loading state
        detailContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">Loading content...</div>';
        
        try {
            // Get content contract instance
            const contentContract = this.web3Provider.getContract(
                entry.content_address,
                this.contentAbi
            );
            
            // V3 entries have 'mode' field, old entries have 'content_type'
            const isImage = entry.mode !== undefined || entry.content_type === 0;
            const typeIcon = isImage ? '🖼️' : '📝';
            const typeName = isImage ? 'Image' : 'Text';
            const date = new Date(entry.creation_time.toNumber() * 1000).toLocaleString();
            const etherscanUrl = `https://sepolia.etherscan.io/address/${entry.content_address}`;
            const creatorUrl = `https://sepolia.etherscan.io/address/${entry.creator}`;
            
            // Build detail view header
            let detailHTML = `
                <div class="content-detail-header">
                    <div class="content-detail-title">${typeIcon} ${typeName}</div>
                    <div class="content-detail-meta">
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Creator</span>
                            <span class="content-detail-meta-value">
                                <a href="${creatorUrl}" target="_blank" rel="noopener noreferrer" 
                                   style="color: var(--md-sys-color-primary); text-decoration: none; border-bottom: 1px solid var(--md-sys-color-primary);"
                                   title="View creator on Etherscan">
                                    ${entry.creator}
                                </a>
                                <button onclick="navigator.clipboard.writeText('${entry.creator}').then(() => uploadsApp.toastComponent.show('Creator address copied!', 'success'))" 
                                        style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: rgba(102, 126, 234, 0.2); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                                        title="Copy creator address">
                                    📋
                                </button>
                            </span>
                        </div>
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Contract Address</span>
                            <span class="content-detail-meta-value">
                                <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer" 
                                   style="color: var(--md-sys-color-primary); text-decoration: none; border-bottom: 1px solid var(--md-sys-color-primary);"
                                   title="View contract on Etherscan">
                                    ${entry.content_address}
                                </a>
                                <button onclick="navigator.clipboard.writeText('${entry.content_address}').then(() => uploadsApp.toastComponent.show('Contract address copied!', 'success'))" 
                                        style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: rgba(102, 126, 234, 0.2); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                                        title="Copy contract address">
                                    📋
                                </button>
                            </span>
                        </div>
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Size</span>
                            <span class="content-detail-meta-value">${entry.data_size.toNumber().toLocaleString()} bytes</span>
                        </div>
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Created</span>
                            <span class="content-detail-meta-value">${date}</span>
                        </div>
                    </div>
                </div>
                <div class="content-detail-body">
            `;
            
            if (isImage) {
                // Image content - V3 format
                const [data, metadata] = await Promise.all([
                    contentContract.get_image_data(),
                    contentContract.get_metadata()
                ]);
                
                const mode = metadata[0];
                const w = metadata[1].toNumber();
                const h = metadata[2].toNumber();
                const paletteSize = metadata[3].toNumber();
                
                // Convert and decompress
                const bytes = window.ethers.utils.arrayify(data);
                const decompressed = decompress(bytes, w, h, mode, paletteSize);
                
                // Create canvas to render image
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.style.maxWidth = '400px';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                
                const ctx = canvas.getContext('2d');
                ctx.putImageData(decompressed, 0, 0);
                
                detailHTML += `
                    <div class="content-detail-preview" id="detail-preview-${entry.content_address}">
                        <div style="text-align: center;">
                            <div style="margin-bottom: 1rem; color: rgba(255,255,255,0.6);">
                                ${w}×${h} pixels
                            </div>
                        </div>
                    </div>
                `;
                
                detailContainer.innerHTML = detailHTML + `
                    </div>
                    <div class="content-detail-actions" style="display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin-top: 1rem;">
                        <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer" 
                           class="btn-secondary" 
                           style="flex: 1; min-width: 200px; text-align: center; text-decoration: none; padding: 0.75rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border-radius: 8px; font-weight: bold;">
                            🔗 View Contract on Etherscan
                        </a>
                        <a href="${creatorUrl}" target="_blank" rel="noopener noreferrer" 
                           class="btn-secondary" 
                           style="flex: 1; min-width: 200px; text-align: center; text-decoration: none; padding: 0.75rem; background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); border-radius: 8px; font-weight: bold;">
                            👤 View Creator on Etherscan
                        </a>
                    </div>
                `;
                
                // Append canvas
                const previewDiv = document.getElementById(`detail-preview-${entry.content_address}`);
                if (previewDiv) {
                    previewDiv.querySelector('div').appendChild(canvas);
                }
                
        } else {
            // Text content - try both old and new methods
            let text;
            try {
                // Try V2 method first (get_text)
                const data = await contentContract.get_text();
                const bytes = window.ethers.utils.arrayify(data);
                text = window.ethers.utils.toUtf8String(bytes);
            } catch (e) {
                try {
                    // Fallback to old content_data method
                    const data = await contentContract.content_data();
                    const bytes = window.ethers.utils.arrayify(data);
                    text = window.ethers.utils.toUtf8String(bytes);
                } catch (e2) {
                    console.error('Failed to load text content:', e2);
                    text = 'Error loading text content';
                }
            }
                
                detailHTML += `
                    <div class="content-detail-text">${text}</div>
                    </div>
                    <div class="content-detail-actions" style="display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin-top: 1rem;">
                        <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer" 
                           class="btn-secondary" 
                           style="flex: 1; min-width: 200px; text-align: center; text-decoration: none; padding: 0.75rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border-radius: 8px; font-weight: bold;">
                            🔗 View Contract on Etherscan
                        </a>
                        <a href="${creatorUrl}" target="_blank" rel="noopener noreferrer" 
                           class="btn-secondary" 
                           style="flex: 1; min-width: 200px; text-align: center; text-decoration: none; padding: 0.75rem; background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); border-radius: 8px; font-weight: bold;">
                            👤 View Creator on Etherscan
                        </a>
                    </div>
                `;
                
                detailContainer.innerHTML = detailHTML;
            }
            
        } catch (error) {
            console.error('Failed to load content detail:', error);
            detailContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255,100,100,0.8);">
                    ⚠️ Error loading content details
                </div>
            `;
        }
    }
    
    /**
     * Show content list view
     */
    showContentList() {
        const listSection = document.getElementById('content-list-section');
        const detailSection = document.getElementById('content-detail-section');
        
        if (listSection) listSection.style.display = 'block';
        if (detailSection) detailSection.style.display = 'none';
    }

    /**
     * Cleanup when navigating away
     */
    destroy() {
        console.log('🧹 Cleaning up uploads app...');
        // Remove event listeners if needed
    }
}

// Export class for MasterApp to instantiate
export { UploadsApp };

// Also export singleton for standalone usage
export default UploadsApp;

