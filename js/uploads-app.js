/**
 * Uploads App Entry Point
 * On-chain content uploads: images and text
 */

import { web3Provider } from './infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from './infrastructure/events/event-bus.js';
import { WalletConnectComponent, ToastComponent } from './presentation/components/index.js';
import { initConfetti } from './presentation/effects/confetti-animation.js';
import { getContractMetadata } from './infrastructure/config/contract-registry.js';

class UploadsApp {
    constructor(toastComponent = null) {
        this.web3Provider = web3Provider;
        this.factoryContract = null;
        this.factoryAbi = null;
        this.contentAbi = null;
        this.walletComponent = null;
        this.toastComponent = toastComponent; // Use shared toast or create new one
        this.currentView = 'upload'; // 'upload' or 'browse'
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
            const factoryMeta = getContractMetadata('content-factory');
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
                if (textSection) textSection.style.display = 'block';
                if (imageSection) imageSection.style.display = 'none';
            });
        }

        // Image upload handling
        const imageInput = document.getElementById('image-input');
        const canvas = document.getElementById('image-preview-canvas');
        if (imageInput && canvas) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e, canvas));
        }

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleImageUpload(event, canvas) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // ENFORCE exactly 64x64 pixels
                const ctx = canvas.getContext('2d');
                const targetSize = 64;

                canvas.width = targetSize;
                canvas.height = targetSize;
                
                // Use high-quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw image stretched to fill entire 64x64 canvas
                ctx.drawImage(img, 0, 0, targetSize, targetSize);

                // Show preview
                canvas.style.display = 'block';
                
                console.log(`✅ Image resized to ${targetSize}x${targetSize} (${targetSize * targetSize * 3} bytes)`);
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

        // Get pixel data from canvas
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = [];

        // Convert to RGB bytes (removing alpha channel)
        for (let i = 0; i < imageData.data.length; i += 4) {
            pixelData.push(imageData.data[i]);     // R
            pixelData.push(imageData.data[i + 1]); // G
            pixelData.push(imageData.data[i + 2]); // B
        }

        const pixelBytes = window.ethers.utils.hexlify(pixelData);

        this.toastComponent.show('Creating image on-chain...', 'info');

        const tx = await this.factoryContract.create_image(
            canvas.width,
            canvas.height,
            pixelBytes
        );

        this.toastComponent.show('Transaction submitted...', 'info');
        await tx.wait();

        this.toastComponent.show('Image uploaded successfully!', 'success');
        eventBus.emit(EVENTS.GAME_EVENT, { type: 'upload', success: true });

        // Refresh content list
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

        const typeIcon = entry.content_type === 0 ? '🖼️' : '📝';
        const typeName = entry.content_type === 0 ? 'Image' : 'Text';
        const date = new Date(entry.creation_time.toNumber() * 1000).toLocaleString();
        
        // Link to Etherscan to view the contract
        const etherscanUrl = `https://sepolia.etherscan.io/address/${entry.content_address}`;

        div.innerHTML = `
            <div class="content-entry-header">
                <span class="content-type">${typeIcon} ${typeName}</span>
                <span class="content-size">${entry.size.toNumber()} bytes</span>
            </div>
            <div class="content-entry-meta">
                <span class="content-creator" title="${entry.creator}">${entry.creator.slice(0, 6)}...${entry.creator.slice(-4)}</span>
                <span class="content-date">${date}</span>
            </div>
            <div class="content-preview" id="preview-${entry.content_address}">
                <div style="padding: 0.5rem; color: rgba(255,255,255,0.5); font-style: italic;">Loading...</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
                <a href="${etherscanUrl}" target="_blank" class="content-link" style="font-size: 0.75rem;" onclick="event.stopPropagation()">
                    View on Etherscan →
                </a>
                <span style="font-size: 0.7rem; color: rgba(255,255,255,0.3);">${entry.content_address.slice(0, 8)}...</span>
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
            
            if (entry.content_type === 0) {
                // Image content
                console.log('Loading image from:', entry.content_address);
                const [data, width, height] = await Promise.all([
                    contentContract.content_data(),
                    contentContract.image_width(),
                    contentContract.image_height()
                ]);
                
                const w = width.toNumber();
                const h = height.toNumber();
                console.log(`Image dimensions: ${w}x${h}`);
                
                // Convert hex data to RGB pixels
                const bytes = window.ethers.utils.arrayify(data);
                console.log(`Image data: ${bytes.length} bytes (expected ${w * h * 3})`);
                
                // Check if data has ABI encoding (offset + length = 64 bytes)
                // Bytes returned from contract include the ABI encoding prefix
                let dataStartIndex = 0;
                const expectedBytes = w * h * 3;
                
                if (bytes.length > expectedBytes) {
                    // ABI encoding has 32 bytes offset + 32 bytes length = skip 64 bytes
                    dataStartIndex = 64;
                    console.log('Detected ABI encoding, skipping first 64 bytes (offset + length)');
                    console.log('First 64 bytes:', Array.from(bytes.slice(0, 64)));
                }
                
                // Validate data size
                if (bytes.length - dataStartIndex < expectedBytes) {
                    throw new Error(`Insufficient image data: got ${bytes.length - dataStartIndex} bytes, need ${expectedBytes}`);
                }
                
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
                const imageData = ctx.createImageData(w, h);
                
                // Convert RGB bytes to RGBA pixels
                let byteIndex = dataStartIndex;  // Start from correct offset
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const pixelIndex = (y * w + x) * 4;
                        imageData.data[pixelIndex] = bytes[byteIndex];       // R
                        imageData.data[pixelIndex + 1] = bytes[byteIndex + 1]; // G
                        imageData.data[pixelIndex + 2] = bytes[byteIndex + 2]; // B
                        imageData.data[pixelIndex + 3] = 255;                  // A
                        byteIndex += 3;
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                previewDiv.innerHTML = '';
                previewDiv.appendChild(canvas);
                console.log('✅ Image rendered successfully');
                
            } else {
                // Text content
                const data = await contentContract.content_data();
                const bytes = window.ethers.utils.arrayify(data);
                const text = window.ethers.utils.toUtf8String(bytes);
                
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
            
            const typeIcon = entry.content_type === 0 ? '🖼️' : '📝';
            const typeName = entry.content_type === 0 ? 'Image' : 'Text';
            const date = new Date(entry.creation_time.toNumber() * 1000).toLocaleString();
            const etherscanUrl = `https://sepolia.etherscan.io/address/${entry.content_address}`;
            
            // Build detail view header
            let detailHTML = `
                <div class="content-detail-header">
                    <div class="content-detail-title">${typeIcon} ${typeName}</div>
                    <div class="content-detail-meta">
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Creator</span>
                            <span class="content-detail-meta-value">${entry.creator}</span>
                        </div>
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Contract Address</span>
                            <span class="content-detail-meta-value">${entry.content_address}</span>
                        </div>
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Size</span>
                            <span class="content-detail-meta-value">${entry.size.toNumber()} bytes</span>
                        </div>
                        <div class="content-detail-meta-item">
                            <span class="content-detail-meta-label">Created</span>
                            <span class="content-detail-meta-value">${date}</span>
                        </div>
                    </div>
                </div>
                <div class="content-detail-body">
            `;
            
            if (entry.content_type === 0) {
                // Image content
                const [data, width, height] = await Promise.all([
                    contentContract.content_data(),
                    contentContract.image_width(),
                    contentContract.image_height()
                ]);
                
                const w = width.toNumber();
                const h = height.toNumber();
                
                // Convert hex data to RGB pixels
                const bytes = window.ethers.utils.arrayify(data);
                
                // Skip ABI encoding (64 bytes)
                let dataStartIndex = 0;
                const expectedBytes = w * h * 3;
                if (bytes.length > expectedBytes) {
                    dataStartIndex = 64;
                }
                
                // Create canvas to render image
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.style.maxWidth = '400px';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                
                const ctx = canvas.getContext('2d');
                const imageData = ctx.createImageData(w, h);
                
                // Convert RGB bytes to RGBA pixels
                let byteIndex = dataStartIndex;
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const pixelIndex = (y * w + x) * 4;
                        imageData.data[pixelIndex] = bytes[byteIndex];
                        imageData.data[pixelIndex + 1] = bytes[byteIndex + 1];
                        imageData.data[pixelIndex + 2] = bytes[byteIndex + 2];
                        imageData.data[pixelIndex + 3] = 255;
                        byteIndex += 3;
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                
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
                    <div class="content-detail-actions">
                        <a href="${etherscanUrl}" target="_blank" class="btn-secondary" style="text-align: center; text-decoration: none;">
                            View on Etherscan →
                        </a>
                    </div>
                `;
                
                // Append canvas
                const previewDiv = document.getElementById(`detail-preview-${entry.content_address}`);
                if (previewDiv) {
                    previewDiv.querySelector('div').appendChild(canvas);
                }
                
            } else {
                // Text content
                const data = await contentContract.content_data();
                const bytes = window.ethers.utils.arrayify(data);
                
                // Skip ABI encoding if present
                let textBytes = bytes;
                if (bytes.length > entry.size.toNumber()) {
                    textBytes = bytes.slice(64);
                }
                
                const text = window.ethers.utils.toUtf8String(textBytes);
                
                detailHTML += `
                    <div class="content-detail-text">${text}</div>
                    </div>
                    <div class="content-detail-actions">
                        <a href="${etherscanUrl}" target="_blank" class="btn-secondary" style="text-align: center; text-decoration: none;">
                            View on Etherscan →
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

