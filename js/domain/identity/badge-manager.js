/**
 * Badge Manager
 * Domain layer - manages badge factory contract interactions
 * Extends InteractiveContract for consistent architecture
 */

import { InteractiveContract } from '../models/interactive-contract.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { ContractInfoRenderer } from '../../presentation/renderers/contract-info-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { getContractMetadata } from '../../infrastructure/config/contract-registry.js';
import { getExplorerUrl } from '../../infrastructure/config/network.js';
import { PixelEditor } from '../../presentation/components/pixel-editor.js';
import { BadgeViewer } from '../../presentation/components/badge-viewer.js';
import { ImageUploader } from '../../presentation/components/image-uploader.js';
import { ContractLoader } from '../../infrastructure/blockchain/contract-loader.js';

export class BadgeManager extends InteractiveContract {
    constructor() {
        super();
        this.editor = null;
        this.imageUploader = null;
        this.userBadgeAddress = null;
        this.userBadgeContract = null;
        this.hasBadge = false;
        this.creationMode = 'editor'; // 'editor' or 'upload'
    }

    getContractName() {
        return 'badge-factory';
    }

    render() {
        const badgeContent = document.createElement('div');
        badgeContent.className = 'badge-interface';
        badgeContent.style.paddingTop = '1.5rem';

        const contentInner = document.createElement('div');
        contentInner.innerHTML = `
            <div class="badge-sections" style="max-width: 1200px; margin: 0 auto;">
                <!-- Loading State -->
                <div id="badge-loading" class="loading-state" style="text-align: center; padding: 3rem;">
                    <div class="spinner" style="margin: 0 auto 1rem;"></div>
                    <p>Loading badge information...</p>
                </div>

                <!-- Main Content (hidden until loaded) -->
                <div id="badge-content" class="hidden">
                    <!-- No Badge State -->
                    <div id="no-badge-state" class="hidden">
                        <div style="text-align: center; margin-bottom: 2rem;">
                            <h2>Create Your Badge</h2>
                            <p style="color: var(--md-sys-color-on-surface-variant);">You don't have a badge yet. Choose how you want to create it:</p>
                            
                            <!-- Mode Selector -->
                            <div style="display: flex; gap: 0.5rem; justify-content: center; margin: 1rem 0;">
                                <button id="mode-editor" class="mode-btn active" style="padding: 0.75rem 2rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                    ✏️ Pixel Editor
                                </button>
                                <button id="mode-upload" class="mode-btn" style="padding: 0.75rem 2rem; background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); border: 2px solid var(--md-sys-color-outline); border-radius: 8px; cursor: pointer;">
                                    🖼️ Upload Image
                                </button>
                            </div>
                        </div>
                        <div id="editor-container"></div>
                        <div id="upload-container" class="hidden"></div>
                    </div>

                    <!-- Has Badge State -->
                    <div id="has-badge-state" class="hidden">
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-bottom: 2rem;">
                            <!-- Current Badge Display -->
                            <div style="background: var(--md-sys-color-surface-variant); padding: 1.5rem; border-radius: 12px;">
                                <h3 style="margin-top: 0;">Your Current Badge</h3>
                                <div id="current-badge-display" style="text-align: center; margin: 1rem 0;"></div>
                                <div id="badge-metadata" style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">
                                    <div style="margin: 0.5rem 0;"><strong>Created:</strong> <span id="badge-created"></span></div>
                                    <div style="margin: 0.5rem 0;"><strong>Last Edited:</strong> <span id="badge-edited"></span></div>
                                    <div style="margin: 0.5rem 0;"><strong>Edit Count:</strong> <span id="badge-edit-count"></span></div>
                                    <div style="margin: 0.5rem 0;"><strong>Contract:</strong> <a id="badge-address-link" target="_blank" style="font-family: monospace; font-size: 0.75rem;"></a></div>
                                </div>
                            </div>

                            <!-- Editor -->
                            <div>
                                <h3 style="margin-top: 0;">Edit Your Badge</h3>
                                <p style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 1rem;">Make changes to your badge below. Click "Update Badge" to save changes on-chain.</p>
                                <div id="editor-container-edit"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        badgeContent.appendChild(contentInner);
        
        // Contract info grid for both contracts (placed after main content)
        const contractsSection = document.createElement('div');
        contractsSection.className = 'contract-info-grid';
        contractsSection.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin: 2rem 0; max-width: 1200px; margin-left: auto; margin-right: auto;';
        
        // Badge Factory contract
        const factoryCard = document.createElement('div');
        factoryCard.className = 'contract-info-card';
        factoryCard.innerHTML = `
            <div class="contract-card-header">
                <h4>🏭 Badge Factory Contract</h4>
                <p class="contract-card-description">Creates and manages badge instances</p>
            </div>
        `;
        const factoryMetadata = getContractMetadata('badge-factory');
        const factoryInfo = ContractInfoRenderer.createContractInfo(
            factoryMetadata.contractAddress,
            factoryMetadata.sourceFile,
            factoryMetadata.abiFile
        );
        factoryCard.appendChild(factoryInfo);
        contractsSection.appendChild(factoryCard);

        // Badge Blueprint contract
        const blueprintCard = document.createElement('div');
        blueprintCard.className = 'contract-info-card';
        blueprintCard.innerHTML = `
            <div class="contract-card-header">
                <h4>📐 Badge Blueprint Contract</h4>
                <p class="contract-card-description">Template contract for individual badges</p>
            </div>
        `;
        const blueprintMetadata = getContractMetadata('badge-blueprint');
        const blueprintInfo = ContractInfoRenderer.createContractInfo(
            blueprintMetadata.contractAddress,
            blueprintMetadata.sourceFile,
            blueprintMetadata.abiFile
        );
        blueprintCard.appendChild(blueprintInfo);
        contractsSection.appendChild(blueprintCard);
        
        badgeContent.appendChild(contractsSection);
        
        this.container.innerHTML = '';
        this.container.appendChild(badgeContent);
    }

    setupListeners() {
        // Listen for wallet connection changes
        eventBus.on(EVENTS.WALLET_CONNECTED, () => this.onWalletChanged());
        eventBus.on(EVENTS.WALLET_DISCONNECTED, () => this.onWalletChanged());
    }

    async onAfterInit() {
        await this.loadBadgeStatus();
    }

    async onWalletChanged() {
        await this.loadBadgeStatus();
    }

    /**
     * Load user's badge status and display appropriate UI
     */
    async loadBadgeStatus() {
        const loading = document.getElementById('badge-loading');
        const content = document.getElementById('badge-content');
        const noBadgeState = document.getElementById('no-badge-state');
        const hasBadgeState = document.getElementById('has-badge-state');

        // Check if badge contracts are deployed
        const factoryMetadata = getContractMetadata('badge-factory');
        const factoryAddress = factoryMetadata.contractAddress;
        if (!factoryAddress ||
            factoryAddress === '0x0000000000000000000000000000000000000000') {
            if (loading) loading.classList.add('hidden');
            if (content) {
                content.classList.remove('hidden');
                content.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <h2>🚧 Badge System Not Deployed</h2>
                        <p style="color: var(--md-sys-color-on-surface-variant); margin: 1rem 0;">
                            The badge contracts haven't been deployed to the network yet.
                        </p>
                        <details style="max-width: 600px; margin: 2rem auto; text-align: left;">
                            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 1rem;">📋 Deployment Instructions</summary>
                            <ol style="line-height: 1.8;">
                                <li>Compile contracts (already done ✅)</li>
                                <li>Deploy <code>badge.vy</code> blueprint contract</li>
                                <li>Deploy <code>badge_factory.vy</code> with blueprint address</li>
                                <li>Update <code>js/infrastructure/config/contracts.js</code> with deployed addresses</li>
                                <li>Refresh this page</li>
                            </ol>
                            <p style="margin-top: 1rem; padding: 1rem; background: var(--md-sys-color-surface-variant); border-radius: 8px;">
                                💡 <strong>Tip:</strong> Use the deployment page at 
                                <code>contracts/deployments/deploy.html</code>
                            </p>
                        </details>
                    </div>
                `;
            }
            return;
        }

        if (!this.web3Provider.isConnected()) {
            if (loading) loading.classList.add('hidden');
            if (content) {
                content.classList.remove('hidden');
                content.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <h2>🔐 Wallet Not Connected</h2>
                        <p style="color: var(--md-sys-color-on-surface-variant);">Please connect your wallet to create or view your badge.</p>
                    </div>
                `;
            }
            return;
        }

        try {
            // Check if user has a badge
            const userAddress = await this.web3Provider.signer.getAddress();
            this.userBadgeAddress = await this.contract.get_badge(userAddress);
            this.hasBadge = this.userBadgeAddress !== '0x0000000000000000000000000000000000000000';

            // Hide loading, show content
            if (loading) loading.classList.add('hidden');
            if (content) content.classList.remove('hidden');

            if (this.hasBadge) {
                // Load badge contract
                await this.loadBadgeContract();
                
                // Show badge state
                if (noBadgeState) noBadgeState.classList.add('hidden');
                if (hasBadgeState) hasBadgeState.classList.remove('hidden');
                
                await this.displayExistingBadge();
            } else {
                // Show no badge state
                if (hasBadgeState) hasBadgeState.classList.add('hidden');
                if (noBadgeState) noBadgeState.classList.remove('hidden');
                
                this.displayCreateBadge();
            }
        } catch (error) {
            console.error('Error loading badge status:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: `❌ Error loading badge: ${error.message}`,
                type: 'error'
            });
        }
    }

    /**
     * Load the user's badge contract
     */
    async loadBadgeContract() {
        try {
            // Load badge ABI (with cache busting)
            const badgeMetadata = getContractMetadata('badge-blueprint');
            const response = await fetch(`${badgeMetadata.abiFile}?v=${Date.now()}`);
            const abi = await response.json();
            
            // Create contract instance
            this.userBadgeContract = this.web3Provider.getContract(
                this.userBadgeAddress,
                abi
            );
        } catch (error) {
            console.error('Error loading badge contract:', error);
            throw error;
        }
    }

    /**
     * Display UI for creating a new badge
     */
    displayCreateBadge() {
        const editorContainer = document.getElementById('editor-container');
        const uploadContainer = document.getElementById('upload-container');
        
        if (!editorContainer || !uploadContainer) return;

        // Setup mode buttons
        const modeEditorBtn = document.getElementById('mode-editor');
        const modeUploadBtn = document.getElementById('mode-upload');
        
        if (modeEditorBtn && modeUploadBtn) {
            modeEditorBtn.addEventListener('click', () => {
                this.switchCreationMode('editor', editorContainer, uploadContainer, modeEditorBtn, modeUploadBtn);
            });
            
            modeUploadBtn.addEventListener('click', () => {
                this.switchCreationMode('upload', editorContainer, uploadContainer, modeEditorBtn, modeUploadBtn);
            });
        }

        // Create pixel editor
        editorContainer.innerHTML = '';
        this.editor = new PixelEditor({
            initialData: new Uint8Array(3072),
            scale: 12,
            onSave: (pixelData) => this.createBadge(pixelData)
        });
        const editorElement = this.editor.render();
        editorContainer.appendChild(editorElement);

        // Create image uploader
        uploadContainer.innerHTML = '';
        this.imageUploader = new ImageUploader({
            onImageLoaded: (pixelData) => {
                // Load into editor for final tweaks
                if (confirm('Load this image into the editor? You can then make final adjustments before saving.')) {
                    this.editor.loadPixelDataFromImage(pixelData);
                    this.switchCreationMode('editor', editorContainer, uploadContainer, modeEditorBtn, modeUploadBtn);
                } else {
                    // Use directly
                    this.createBadge(pixelData);
                }
            }
        });
        const uploaderElement = this.imageUploader.render();
        uploadContainer.appendChild(uploaderElement);
    }

    /**
     * Switch between editor and upload modes
     */
    switchCreationMode(mode, editorContainer, uploadContainer, editorBtn, uploadBtn) {
        this.creationMode = mode;
        
        if (mode === 'editor') {
            editorContainer.classList.remove('hidden');
            uploadContainer.classList.add('hidden');
            editorBtn.style.background = 'var(--md-sys-color-primary)';
            editorBtn.style.color = 'var(--md-sys-color-on-primary)';
            editorBtn.style.border = 'none';
            uploadBtn.style.background = 'var(--md-sys-color-surface-variant)';
            uploadBtn.style.color = 'var(--md-sys-color-on-surface-variant)';
            uploadBtn.style.border = '2px solid var(--md-sys-color-outline)';
        } else {
            editorContainer.classList.add('hidden');
            uploadContainer.classList.remove('hidden');
            uploadBtn.style.background = 'var(--md-sys-color-primary)';
            uploadBtn.style.color = 'var(--md-sys-color-on-primary)';
            uploadBtn.style.border = 'none';
            editorBtn.style.background = 'var(--md-sys-color-surface-variant)';
            editorBtn.style.color = 'var(--md-sys-color-on-surface-variant)';
            editorBtn.style.border = '2px solid var(--md-sys-color-outline)';
        }
    }

    /**
     * Display existing badge with editor
     */
    async displayExistingBadge() {
        try {
            // Load badge data
            const pixelData = await this.userBadgeContract.pixel_data();
            const pixelBytes = new Uint8Array(ethers.utils.arrayify(pixelData));
            
            // Load metadata
            const creationTime = await this.userBadgeContract.creation_time();
            const lastEditTime = await this.userBadgeContract.last_edit_time();
            const editCount = await this.userBadgeContract.edit_count();

            // Display current badge
            const badgeDisplay = document.getElementById('current-badge-display');
            if (badgeDisplay) {
                badgeDisplay.innerHTML = '';
                const viewer = BadgeViewer.create(pixelBytes, { 
                    size: 256, 
                    showGrid: false,
                    clickToExpand: true
                });
                badgeDisplay.appendChild(viewer);
            }

            // Display metadata
            const formatDate = (timestamp) => {
                const date = new Date(timestamp.toNumber() * 1000);
                return date.toLocaleString();
            };

            const createdEl = document.getElementById('badge-created');
            if (createdEl) createdEl.textContent = formatDate(creationTime);

            const editedEl = document.getElementById('badge-edited');
            if (editedEl) editedEl.textContent = formatDate(lastEditTime);

            const editCountEl = document.getElementById('badge-edit-count');
            if (editCountEl) editCountEl.textContent = editCount.toString();

            const addressLink = document.getElementById('badge-address-link');
            if (addressLink) {
                addressLink.textContent = `${this.userBadgeAddress.slice(0, 6)}...${this.userBadgeAddress.slice(-4)}`;
                addressLink.href = getExplorerUrl(this.userBadgeAddress);
            }

            // Create editor with existing data
            const editorContainer = document.getElementById('editor-container-edit');
            if (editorContainer) {
                editorContainer.innerHTML = '';
                
                this.editor = new PixelEditor({
                    initialData: pixelBytes,
                    scale: 12,
                    onSave: (pixelData) => this.editBadge(pixelData)
                });

                const editorElement = this.editor.render();
                
                // Update button text
                const saveBtn = editorElement.querySelector('.btn-primary');
                if (saveBtn) {
                    saveBtn.textContent = '💾 Update Badge';
                }
                
                editorContainer.appendChild(editorElement);
            }
        } catch (error) {
            console.error('Error displaying badge:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: `❌ Error loading badge data: ${error.message}`,
                type: 'error'
            });
        }
    }

    /**
     * Create a new badge
     */
    async createBadge(pixelData) {
        if (!this.requiresWallet('create a badge')) return;

        try {
            // Convert pixel data to hex string
            const hexData = '0x' + Array.from(pixelData)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // Estimate gas
            const gasEstimate = await this.contract.estimateGas.create_badge(hexData);
            const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

            eventBus.emit(EVENTS.TOAST, {
                message: `⏳ Creating badge... Estimated gas: ${gasEstimate.toString()}`,
                type: 'info'
            });

            // Create badge
            const tx = await this.contract.create_badge(hexData, { gasLimit });
            
            eventBus.emit(EVENTS.TOAST, {
                message: '⏳ Transaction submitted! Waiting for confirmation...',
                type: 'info'
            });

            const receipt = await tx.wait();

            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Badge created successfully! 🎉',
                type: 'success'
            });

            // Reload badge status
            await this.loadBadgeStatus();

        } catch (error) {
            console.error('Error creating badge:', error);
            
            let errorMessage = 'Failed to create badge';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user';
            } else if (error.message.includes('already has a badge')) {
                errorMessage = 'You already have a badge';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: `❌ ${errorMessage}`,
                type: 'error'
            });
        }
    }

    /**
     * Edit existing badge
     */
    async editBadge(pixelData) {
        if (!this.requiresWallet('edit your badge')) return;
        if (!this.userBadgeContract) {
            eventBus.emit(EVENTS.TOAST, {
                message: '❌ Badge contract not loaded',
                type: 'error'
            });
            return;
        }

        try {
            // Convert pixel data to hex string
            const hexData = '0x' + Array.from(pixelData)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // Estimate gas
            const gasEstimate = await this.userBadgeContract.estimateGas.edit(hexData);
            const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

            eventBus.emit(EVENTS.TOAST, {
                message: `⏳ Updating badge... Estimated gas: ${gasEstimate.toString()}`,
                type: 'info'
            });

            // Edit badge
            const tx = await this.userBadgeContract.edit(hexData, { gasLimit });
            
            eventBus.emit(EVENTS.TOAST, {
                message: '⏳ Transaction submitted! Waiting for confirmation...',
                type: 'info'
            });

            const receipt = await tx.wait();

            eventBus.emit(EVENTS.TOAST, {
                message: '✅ Badge updated successfully! 🎉',
                type: 'success'
            });

            // Reload badge display
            await this.displayExistingBadge();

        } catch (error) {
            console.error('Error editing badge:', error);
            
            let errorMessage = 'Failed to update badge';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user';
            } else if (error.message.includes('Only owner')) {
                errorMessage = 'Only the badge owner can edit';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: `❌ ${errorMessage}`,
                type: 'error'
            });
        }
    }
}

