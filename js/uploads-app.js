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

            console.log('✅ Uploads app ready');

        } catch (error) {
            console.error('Failed to initialize uploads view:', error);
        }
    }

    async loadContracts() {
        try {
            // Get content factory metadata
            const factoryMeta = getContractMetadata('content-factory');
            const contentMeta = getContractMetadata('content-blueprint');

            // Load ABIs
            const factoryResponse = await fetch(factoryMeta.abi);
            this.factoryAbi = await factoryResponse.json();

            const contentResponse = await fetch(contentMeta.abi);
            this.contentAbi = await contentResponse.json();

            // Initialize factory contract
            if (factoryMeta.address && factoryMeta.address !== '0x0000000000000000000000000000000000000000') {
                const { ethers } = this.web3Provider.getEthers();
                this.factoryContract = new ethers.Contract(
                    factoryMeta.address,
                    this.factoryAbi,
                    this.web3Provider.getSigner()
                );
                console.log('📤 Content factory loaded:', factoryMeta.address);
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
                // Draw image on canvas (max 64x64)
                const ctx = canvas.getContext('2d');
                const maxSize = 64;
                const scale = Math.min(maxSize / img.width, maxSize / img.height);
                const width = Math.floor(img.width * scale);
                const height = Math.floor(img.height * scale);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Show preview
                canvas.style.display = 'block';
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

        const { ethers } = this.web3Provider.getEthers();
        const pixelBytes = ethers.utils.hexlify(pixelData);

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

        // Refresh browser
        setTimeout(() => this.loadRecentContent(), 1000);
    }

    async uploadText() {
        const textarea = document.getElementById('text-input');
        if (!textarea || !textarea.value.trim()) {
            this.toastComponent.show('Please enter some text', 'error');
            return;
        }

        const text = textarea.value;
        const { ethers } = this.web3Provider.getEthers();
        const textBytes = ethers.utils.toUtf8Bytes(text);

        if (textBytes.length > 16384) {
            this.toastComponent.show('Text too large (max 16KB)', 'error');
            return;
        }

        this.toastComponent.show('Creating text on-chain...', 'info');

        const tx = await this.factoryContract.create_text(
            ethers.utils.hexlify(textBytes)
        );

        this.toastComponent.show('Transaction submitted...', 'info');
        await tx.wait();

        this.toastComponent.show('Text uploaded successfully!', 'success');
        eventBus.emit(EVENTS.GAME_EVENT, { type: 'upload', success: true });

        // Clear form and refresh browser
        textarea.value = '';
        setTimeout(() => this.loadRecentContent(), 1000);
    }

    initContentBrowser() {
        // Load recent content when browser is shown
        const browserSection = document.getElementById('content-browser-section');
        if (browserSection) {
            this.loadRecentContent();
        }
    }

    async loadRecentContent() {
        if (!this.factoryContract) return;

        try {
            const count = await this.factoryContract.get_content_count();
            const contentList = document.getElementById('content-list');
            if (!contentList) return;

            contentList.innerHTML = '';

            // Load last 20 items
            const start = Math.max(0, count.toNumber() - 20);
            for (let i = count.toNumber() - 1; i >= start; i--) {
                const entry = await this.factoryContract.get_content_by_index(i);
                this.renderContentEntry(entry, contentList);
            }

        } catch (error) {
            console.error('Failed to load content:', error);
        }
    }

    renderContentEntry(entry, container) {
        const div = document.createElement('div');
        div.className = 'content-entry';

        const typeIcon = entry.content_type === 0 ? '🖼️' : '📝';
        const typeName = entry.content_type === 0 ? 'Image' : 'Text';
        const date = new Date(entry.creation_time.toNumber() * 1000).toLocaleString();

        div.innerHTML = `
            <div class="content-entry-header">
                <span class="content-type">${typeIcon} ${typeName}</span>
                <span class="content-size">${entry.size.toNumber()} bytes</span>
            </div>
            <div class="content-entry-meta">
                <span class="content-creator">${entry.creator.slice(0, 8)}...</span>
                <span class="content-date">${date}</span>
            </div>
            <a href="${entry.content_address}" target="_blank" class="content-link">
                View Content →
            </a>
        `;

        container.appendChild(div);
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

        // Listen for wallet connection
        eventBus.on(EVENTS.WALLET_CONNECTED, async () => {
            console.log('Wallet connected, reloading contracts...');
            await this.loadContracts();
        });
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

