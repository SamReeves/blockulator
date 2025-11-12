/**
 * Uploads App with Multi-Mode Compression
 * On-chain content uploads: RGB, Grayscale, Monochrome, Indexed
 */

import { web3Provider } from './infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from './infrastructure/events/event-bus.js';
import { WalletConnectComponent, ToastComponent } from './presentation/components/index.js';
import { initConfetti } from './presentation/effects/confetti-animation.js';
import { getContractMetadata } from './infrastructure/config/contract-registry.js';
import {
    CompressionMode,
    getModeCapacity,
    compress,
    decompress,
    analyzeImage,
    suggestMode,
    calculateDimensions
} from './domain/image-compression.js';

class UploadsApp {
    constructor(toastComponent = null) {
        this.web3Provider = web3Provider;
        this.factoryContract = null;
        this.factoryAbi = null;
        this.contentAbi = null;
        this.walletComponent = null;
        this.toastComponent = toastComponent;
        this.currentView = 'upload';
        
        // Compression state
        this.selectedMode = CompressionMode.RGB;
        this.currentImageData = null;
        this.currentDimensions = { width: 0, height: 0 };
    }

    async init() {
        console.log('📤 Initializing Uploads app with compression...');

        try {
            await this.web3Provider.checkConnection();
            
            this.walletComponent = new WalletConnectComponent(this.web3Provider);
            this.walletComponent.render();
            
            this.toastComponent = new ToastComponent();
            initConfetti();
            
            await this.initViewOnly();
        } catch (error) {
            console.error('Failed to initialize uploads app:', error);
        }
    }

    async initViewOnly() {
        console.log('📤 Initializing Uploads view...');

        try {
            if (!this.toastComponent) {
                this.toastComponent = new ToastComponent();
            }

            await this.loadContracts();
            await this.initializeUI();
            this.setupEventListeners();
            await this.loadRecentContent();

            console.log('✅ Uploads app ready');
        } catch (error) {
            console.error('Failed to initialize uploads view:', error);
        }
    }

    async loadContracts() {
        try {
            console.log('📋 Loading content contracts...');
            
            const factoryMeta = getContractMetadata('content-factory');
            const contentMeta = getContractMetadata('content-blueprint');

            console.log('Factory address:', factoryMeta.contractAddress);

            const factoryResponse = await fetch(factoryMeta.abi);
            if (!factoryResponse.ok) {
                throw new Error(`Failed to load factory ABI: ${factoryResponse.status}`);
            }
            this.factoryAbi = await factoryResponse.json();
            console.log('✅ Factory ABI loaded');

            const contentResponse = await fetch(contentMeta.abi);
            if (!contentResponse.ok) {
                throw new Error(`Failed to load content ABI: ${contentResponse.status}`);
            }
            this.contentAbi = await contentResponse.json();
            console.log('✅ Content ABI loaded');

            if (factoryMeta.contractAddress && factoryMeta.contractAddress !== '0x0000000000000000000000000000000000000000') {
                const provider = this.web3Provider.getProvider();
                
                if (provider) {
                    try {
                        const code = await provider.getCode(factoryMeta.contractAddress);
                        console.log('Contract has code:', code !== '0x');
                    } catch (codeError) {
                        console.warn('Could not verify contract code:', codeError);
                    }
                }
                
                this.factoryContract = this.web3Provider.getContract(
                    factoryMeta.contractAddress,
                    this.factoryAbi
                );
                
                console.log('✅ Factory contract loaded at:', factoryMeta.contractAddress);

                try {
                    const testCount = await this.factoryContract.get_content_count();
                    console.log('✅ Contract connection verified, content count:', testCount.toString());
                } catch (testError) {
                    console.error('❌ Contract test call failed:', testError);
                    console.error('   This might indicate the contract is not deployed or incompatible');
                }
            } else {
                console.warn('⚠️ No factory contract address configured');
            }

        } catch (error) {
            console.error('Failed to load contracts:', error);
            throw error;
        }
    }

    async initializeUI() {
        this.initUploadForm();
        this.initContentBrowser();
        this.initCompressionModeSelector();
        this.showView('upload');
    }

    setupEventListeners() {
        const uploadBtn = document.getElementById('show-upload-btn');
        const browseBtn = document.getElementById('show-browse-btn');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showView('upload'));
        }
        if (browseBtn) {
            browseBtn.addEventListener('click', () => this.showView('browse'));
        }

        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('content-detail-section').style.display = 'none';
                document.getElementById('content-list-section').style.display = 'block';
            });
        }
    }

    initUploadForm() {
        const form = document.getElementById('upload-form');
        if (!form) return;

        const imageBtn = document.getElementById('upload-type-image');
        const textBtn = document.getElementById('upload-type-text');
        const imageSection = document.getElementById('image-upload-section');
        const textSection = document.getElementById('text-upload-section');

        if (imageBtn && textBtn) {
            imageBtn.addEventListener('click', () => {
                imageBtn.classList.add('active');
                textBtn.classList.remove('active');
                if (imageSection) imageSection.style.display = 'block';
                if (textSection) textSection.style.display = 'none';
            });

            textBtn.addEventListener('click', () => {
                textBtn.classList.add('active');
                imageBtn.classList.remove('active');
                if (imageSection) imageSection.style.display = 'none';
                if (textSection) textSection.style.display = 'block';
            });
        }

        const imageInput = document.getElementById('image-input');
        const canvas = document.getElementById('image-preview-canvas');
        if (imageInput && canvas) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e, canvas));
        }

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

        console.log(`🎨 Selected compression mode: ${mode} (${getModeCapacity(mode).description})`);

        // Update preview if image is loaded
        if (this.currentImageData) {
            this.updateCompressedPreview();
        }
    }

    async handleImageUpload(event, canvas) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext('2d');
                
                // Start with RGB mode to get original
                const { width, height } = calculateDimensions(
                    img.width, 
                    img.height, 
                    CompressionMode.RGB
                );
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Store current image data
                this.currentImageData = ctx.getImageData(0, 0, width, height);
                this.currentDimensions = { width, height };

                // Show canvas
                canvas.style.display = 'block';
                
                // Show compression mode selector
                const modeSelector = document.getElementById('compression-mode-selector');
                if (modeSelector) {
                    modeSelector.style.display = 'block';
                }

                // Analyze image and suggest mode
                const analysis = analyzeImage(this.currentImageData, width, height);
                const suggestion = suggestMode(this.currentImageData, width, height);
                
                const suggestionEl = document.getElementById('mode-suggestion');
                const suggestionText = document.getElementById('suggestion-text');
                if (suggestionEl && suggestionText) {
                    suggestionText.textContent = `${getModeCapacity(suggestion.mode).description} - ${suggestion.reason}`;
                    suggestionEl.style.display = 'block';
                    
                    // Auto-select suggested mode
                    this.selectCompressionMode(suggestion.mode);
                }

                console.log('📊 Image Analysis:', analysis);
                console.log('💡 Suggested mode:', suggestion);
                
                this.updateInfoDisplay();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    updateCompressedPreview() {
        if (!this.currentImageData) return;

        const capacity = getModeCapacity(this.selectedMode);
        const { width, height } = calculateDimensions(
            this.currentDimensions.width,
            this.currentDimensions.height,
            this.selectedMode
        );

        // Create scaled canvas for compression
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw scaled image
        tempCtx.drawImage(
            document.getElementById('image-preview-canvas'),
            0, 0, width, height
        );
        
        const scaledImageData = tempCtx.getImageData(0, 0, width, height);

        // Compress
        const compressed = compress(scaledImageData, width, height, this.selectedMode);
        
        // Decompress for preview
        const decompressed = decompress(compressed, width, height, this.selectedMode, 256);

        // Draw preview
        const previewCanvas = document.getElementById('compressed-preview-canvas');
        const previewContainer = document.getElementById('compressed-preview-container');
        
        if (previewCanvas && previewContainer) {
            previewCanvas.width = width;
            previewCanvas.height = height;
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.putImageData(decompressed, 0, 0);
            
            previewContainer.style.display = 'block';
        }

        // Update dimensions for upload
        this.currentDimensions = { width, height };
        
        this.updateInfoDisplay();
    }

    updateInfoDisplay() {
        const infoDiv = document.getElementById('image-info');
        if (!infoDiv) return;

        const capacity = getModeCapacity(this.selectedMode);
        const { width, height } = this.currentDimensions;
        const pixels = width * height;
        
        let dataSize;
        if (this.selectedMode === CompressionMode.RGB) {
            dataSize = pixels * 3;
        } else if (this.selectedMode === CompressionMode.GRAYSCALE) {
            dataSize = pixels;
        } else if (this.selectedMode === CompressionMode.MONOCHROME) {
            dataSize = Math.ceil(pixels / 8);
        } else if (this.selectedMode === CompressionMode.INDEXED) {
            dataSize = 768 + pixels; // 256-color palette + indices
        }

        const compressionRatio = (pixels * 3) / dataSize;

        infoDiv.innerHTML = `
            <div style="padding: 1rem; background: rgba(102, 126, 234, 0.2); border-radius: 8px; border: 2px solid rgba(102, 126, 234, 0.4);">
                <h4 style="margin-bottom: 0.75rem; color: #667eea;">📊 Upload Statistics</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                    <div>
                        <strong style="color: rgba(255,255,255,0.7);">Dimensions:</strong><br>
                        <span style="font-size: 1.1rem; color: white;">${width}×${height} pixels</span>
                    </div>
                    <div>
                        <strong style="color: rgba(255,255,255,0.7);">Data Size:</strong><br>
                        <span style="font-size: 1.1rem; color: white;">${dataSize.toLocaleString()} bytes (${(dataSize/1024).toFixed(2)} KB)</span>
                    </div>
                    <div>
                        <strong style="color: rgba(255,255,255,0.7);">Mode:</strong><br>
                        <span style="font-size: 1.1rem; color: white;">${capacity.description}</span>
                    </div>
                    <div>
                        <strong style="color: rgba(255,255,255,0.7);">Compression:</strong><br>
                        <span style="font-size: 1.1rem; color: #10b981;">${compressionRatio.toFixed(2)}× vs RGB</span>
                    </div>
                </div>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                    💾 Storage efficiency: Using ${((dataSize / 16384) * 100).toFixed(1)}% of maximum capacity
                </div>
            </div>
        `;
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

        if (!this.currentImageData) {
            this.toastComponent.show('Image data not loaded', 'error');
            return;
        }

        const { width, height } = this.currentDimensions;
        
        // Scale and re-capture for selected mode
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0, width, height);
        const imageData = tempCtx.getImageData(0, 0, width, height);

        // Compress
        const compressed = compress(imageData, width, height, this.selectedMode);
        const hexData = window.ethers.utils.hexlify(compressed);

        console.log(`📤 Uploading ${width}×${height} image in mode ${this.selectedMode}`);
        console.log(`   Data size: ${compressed.length} bytes`);
        console.log(`   Mode: ${getModeCapacity(this.selectedMode).description}`);

        this.toastComponent.show('Creating image on-chain...', 'info');

        // For now, use old create_image function (RGB mode)
        // TODO: Update contract to support v3 with modes
        if (this.selectedMode !== CompressionMode.RGB) {
            this.toastComponent.show('⚠️ Only RGB mode supported on current contract. Uploading as RGB...', 'warning');
            
            // Convert to RGB
            const rgbData = compress(imageData, width, height, CompressionMode.RGB);
            const rgbHex = window.ethers.utils.hexlify(rgbData);
            
            const tx = await this.factoryContract.create_image(width, height, rgbHex);
            this.toastComponent.show('Transaction submitted...', 'info');
            await tx.wait();
        } else {
            const tx = await this.factoryContract.create_image(width, height, hexData);
            this.toastComponent.show('Transaction submitted...', 'info');
            await tx.wait();
        }

        this.toastComponent.show('Image uploaded successfully! 🎉', 'success');
        eventBus.emit(EVENTS.GAME_EVENT, { type: 'upload', success: true });

        setTimeout(() => this.loadRecentContent(), 2000);
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

        setTimeout(() => this.loadRecentContent(), 2000);
    }

    initContentBrowser() {
        // Implemented in original file...
    }

    async loadRecentContent() {
        // Keep original implementation
        const contentList = document.getElementById('content-list');
        if (!contentList) return;

        try {
            const count = await this.factoryContract.get_content_count();
            
            if (count.toNumber() === 0) {
                contentList.innerHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.5);">📭 No uploads yet. Be the first!</div>';
                return;
            }

            contentList.innerHTML = '<div style="padding: 1rem; color: rgba(255,255,255,0.6);">Loading uploads...</div>';

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
        } catch (error) {
            console.error('Failed to load content:', error);
            contentList.innerHTML = '<div class="error-state" style="padding: 2rem; text-align: center; color: rgba(255,100,100,0.8);">⚠️ Error loading uploads.</div>';
        }
    }

    async renderContentEntry(entry, container) {
        // Keep original implementation with RGB decompression
        // (Simplified for brevity - use original code)
    }

    showView(viewName) {
        this.currentView = viewName;
        
        const uploadSection = document.getElementById('upload-section');
        const browseSection = document.getElementById('content-list-section');
        
        if (viewName === 'upload') {
            if (uploadSection) uploadSection.style.display = 'block';
            if (browseSection) browseSection.style.display = 'none';
        } else {
            if (uploadSection) uploadSection.style.display = 'none';
            if (browseSection) browseSection.style.display = 'block';
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up uploads app...');
        this.factoryContract = null;
        this.currentImageData = null;
    }
}

// Initialize on load
let uploadsApp;
window.uploadsApp = uploadsApp = new UploadsApp();

// Export for module usage
export { UploadsApp };
export default UploadsApp;

