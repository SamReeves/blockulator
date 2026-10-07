/**
 * Image Uploader Component
 * Converts uploaded images to 32x32 RGB pixel data for badges
 * Presentation layer - handles image upload, resize, and conversion
 */

export class ImageUploader {
    constructor(options = {}) {
        this.onImageLoaded = options.onImageLoaded || (() => {});
        this.maxFileSize = 5 * 1024 * 1024; // 5MB max
    }

    /**
     * Render the image upload UI
     * @returns {HTMLElement} Container with upload interface
     */
    render() {
        const container = document.createElement('div');
        container.className = 'image-uploader';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            background: var(--sdr-bg-darker);
            border-radius: 12px;
        `;

        // Upload area
        const uploadArea = document.createElement('div');
        uploadArea.className = 'upload-area';
        uploadArea.style.cssText = `
            border: 3px dashed var(--sdr-border);
            border-radius: 12px;
            padding: 3rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--sdr-bg-dark);
        `;

        uploadArea.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">🖼️</div>
            <h3 style="margin: 0 0 0.5rem 0;">Upload Image</h3>
            <p style="color: var(--sdr-text-light); margin: 0 0 1rem 0;">
                Click to select or drag & drop
            </p>
            <p style="color: var(--sdr-text-light); font-size: 0.875rem; margin: 0;">
                Will be resized to 32×32 pixels • Max 5MB
            </p>
        `;

        // File input (hidden)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp';
        fileInput.style.display = 'none';

        // Preview area (hidden initially)
        const previewArea = document.createElement('div');
        previewArea.className = 'preview-area hidden';
        previewArea.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
        `;

        previewArea.innerHTML = `
            <div style="text-align: center;">
                <h4 style="margin: 0 0 1rem 0;">Preview (32×32)</h4>
                <div id="preview-canvas-container" style="display: inline-block; padding: 1rem; background: var(--sdr-bg-dark); border-radius: 8px;"></div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button id="use-image-btn" class="btn-primary" style="padding: 0.75rem 2rem; background: var(--sdr-primary); color: var(--sdr-text-white); border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    ✓ Use This Image
                </button>
                <button id="cancel-upload-btn" style="padding: 0.75rem 2rem; background: var(--sdr-bg-dark); color: var(--sdr-text-light); border: 2px solid var(--sdr-border); border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--sdr-primary)';
            uploadArea.style.background = 'var(--sdr-secondary)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--sdr-border)';
            uploadArea.style.background = 'var(--sdr-bg-dark)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--sdr-border)';
            uploadArea.style.background = 'var(--sdr-bg-dark)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0], uploadArea, previewArea);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0], uploadArea, previewArea);
            }
        });

        // Button handlers
        previewArea.addEventListener('click', (e) => {
            if (e.target.id === 'use-image-btn') {
                this.confirmImage();
            } else if (e.target.id === 'cancel-upload-btn') {
                this.resetUpload(uploadArea, previewArea);
            }
        });

        container.appendChild(uploadArea);
        container.appendChild(fileInput);
        container.appendChild(previewArea);

        return container;
    }

    /**
     * Handle file selection/drop
     */
    async handleFile(file, uploadArea, previewArea) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > this.maxFileSize) {
            alert('File too large. Maximum size is 5MB');
            return;
        }

        try {
            // Load image
            const img = await this.loadImage(file);
            
            // Convert to 32x32 pixel data
            this.currentPixelData = await this.imageToPixelData(img);
            
            // Show preview
            this.showPreview(this.currentPixelData, uploadArea, previewArea);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image. Please try another file.');
        }
    }

    /**
     * Load image from file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert image to 32x32 RGB pixel data
     */
    async imageToPixelData(img) {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image scaled to 32x32
        ctx.drawImage(img, 0, 0, 32, 32);
        
        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, 32, 32);
        const rgbData = new Uint8Array(3072); // 32 * 32 * 3
        
        // Convert RGBA to RGB
        for (let i = 0; i < 1024; i++) {
            rgbData[i * 3] = imageData.data[i * 4];         // R
            rgbData[i * 3 + 1] = imageData.data[i * 4 + 1]; // G
            rgbData[i * 3 + 2] = imageData.data[i * 4 + 2]; // B
            // Skip alpha channel
        }
        
        return rgbData;
    }

    /**
     * Show preview of converted image
     */
    showPreview(pixelData, uploadArea, previewArea) {
        // Hide upload area, show preview
        uploadArea.style.display = 'none';
        previewArea.classList.remove('hidden');
        
        // Create preview canvas
        const previewContainer = previewArea.querySelector('#preview-canvas-container');
        previewContainer.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        canvas.style.cssText = `
            width: 256px;
            height: 256px;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            border: 2px solid var(--sdr-border);
            border-radius: 4px;
        `;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(32, 32);
        
        // Convert RGB to RGBA for display
        for (let i = 0; i < 1024; i++) {
            const srcOffset = i * 3;
            const dstOffset = i * 4;
            
            imageData.data[dstOffset] = pixelData[srcOffset];
            imageData.data[dstOffset + 1] = pixelData[srcOffset + 1];
            imageData.data[dstOffset + 2] = pixelData[srcOffset + 2];
            imageData.data[dstOffset + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        previewContainer.appendChild(canvas);
    }

    /**
     * Confirm and use the uploaded image
     */
    confirmImage() {
        if (this.currentPixelData) {
            this.onImageLoaded(this.currentPixelData);
        }
    }

    /**
     * Reset upload state
     */
    resetUpload(uploadArea, previewArea) {
        this.currentPixelData = null;
        uploadArea.style.display = 'block';
        previewArea.classList.add('hidden');
    }
}

