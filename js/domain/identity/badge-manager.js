/**
 * Badge Manager — standalone class (no InteractiveContract inheritance).
 * All UI lives in index.html; this class wires it up.
 */

import { getContractMetadata } from '../../infrastructure/config/contract-registry.js';
import { getExplorerUrl } from '../../infrastructure/config/network.js';
import { ContractInfoRenderer } from '../../presentation/renderers/contract-info-renderer.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { PixelEditor } from '../../presentation/components/pixel-editor.js';
import { BadgeViewer } from '../../presentation/components/badge-viewer.js';
import { ImageUploader } from '../../presentation/components/image-uploader.js';

export class BadgeManager {
    constructor() {
        this.contract = null;       // badge-factory contract
        this.web3Provider = null;
        this.editor = null;
        this.imageUploader = null;
        this.userBadgeAddress = null;
        this.userBadgeContract = null;
        this.hasBadge = false;
    }

    async init(web3Provider) {
        this.web3Provider = web3Provider;

        try {
            const meta = getContractMetadata('badge-factory');
            const addr = meta.contractAddress;
            if (addr && addr !== '0x0000000000000000000000000000000000000000') {
                const resp = await fetch(`/${meta.abiFile}?v=${Date.now()}`);
                if (resp.ok) {
                    const abi = await resp.json();
                    this.contract = web3Provider.getContract(addr, abi);
                }
            }
        } catch (err) {
            console.warn('[badge-factory] Contract load failed:', err.message);
            this.contract = null;
        }

        this.renderContractInfo();
        this.bindModeButtons();

        eventBus.on(EVENTS.WALLET_CONNECTED, () => this.loadBadgeStatus());
        eventBus.on(EVENTS.WALLET_DISCONNECTED, () => this.loadBadgeStatus());

        await this.loadBadgeStatus();
    }

    // ── Contract info cards ─────────────────────────────────────────

    renderContractInfo() {
        const target = document.getElementById('badge-contract-info');
        if (!target) return;

        const items = [
            { key: 'badge-factory', label: '🏭 Badge Factory Contract', desc: 'Creates and manages badge instances' },
            { key: 'badge-blueprint', label: '📐 Badge Blueprint Contract', desc: 'Template contract for individual badges' }
        ];

        items.forEach(({ key, label, desc }) => {
            const card = document.createElement('div');
            card.className = 'contract-info-card';
            card.innerHTML = `<div class="contract-card-header"><h4>${label}</h4><p class="contract-card-description">${desc}</p></div>`;
            try {
                const meta = getContractMetadata(key);
                const info = ContractInfoRenderer.createContractInfo(meta.contractAddress, meta.sourceFile, meta.abiFile);
                card.appendChild(info);
            } catch (e) {
                console.warn(`[badge] Could not render info for ${key}:`, e.message);
            }
            target.appendChild(card);
        });
    }

    // ── Mode selector buttons ───────────────────────────────────────

    bindModeButtons() {
        this.setupModePair('mode-editor', 'mode-upload', 'editor-container', 'upload-container');
        this.setupModePair('edit-mode-editor', 'edit-mode-upload', 'editor-container-edit', 'upload-container-edit');
    }

    setupModePair(editorBtnId, uploadBtnId, editorContainerId, uploadContainerId) {
        const editorBtn = document.getElementById(editorBtnId);
        const uploadBtn = document.getElementById(uploadBtnId);
        const editorContainer = document.getElementById(editorContainerId);
        const uploadContainer = document.getElementById(uploadContainerId);
        if (!editorBtn || !uploadBtn || !editorContainer || !uploadContainer) return;

        const activate = (mode) => {
            const isEditor = mode === 'editor';
            editorContainer.classList.toggle('hidden', !isEditor);
            uploadContainer.classList.toggle('hidden', isEditor);
            editorBtn.classList.toggle('active', isEditor);
            uploadBtn.classList.toggle('active', !isEditor);
        };

        editorBtn.addEventListener('click', () => activate('editor'));
        uploadBtn.addEventListener('click', () => activate('upload'));
    }

    // ── Badge status ────────────────────────────────────────────────

    async loadBadgeStatus() {
        const loading = document.getElementById('badge-loading');
        const content = document.getElementById('badge-content');
        const noBadgeState = document.getElementById('no-badge-state');
        const hasBadgeState = document.getElementById('has-badge-state');

        const showMessage = (html) => {
            if (loading) loading.classList.add('hidden');
            if (content) { content.classList.remove('hidden'); content.innerHTML = html; }
        };

        const factoryMeta = getContractMetadata('badge-factory');
        const addr = factoryMeta.contractAddress;
        if (!addr || addr === '0x0000000000000000000000000000000000000000') {
            showMessage('<div style="text-align:center;padding:3rem"><h2>🚧 Badge System Not Deployed</h2><p>The badge contracts have not been deployed to this network yet.</p></div>');
            return;
        }

        if (!this.web3Provider.isConnected()) {
            showMessage('<div style="text-align:center;padding:3rem"><h2>🔐 Wallet Not Connected</h2><p>Please connect your wallet to create or view your badge.</p></div>');
            return;
        }

        if (!this.contract) {
            showMessage('<div style="text-align:center;padding:3rem"><h2>⚠️ Contract Not Available</h2><p>Could not connect to the badge contract. Please check your network.</p></div>');
            return;
        }

        try {
            const userAddress = await this.web3Provider.signer.getAddress();
            this.userBadgeAddress = await this.contract.get_badge(userAddress);
            this.hasBadge = this.userBadgeAddress !== '0x0000000000000000000000000000000000000000';

            if (loading) loading.classList.add('hidden');
            if (content) content.classList.remove('hidden');

            if (this.hasBadge) {
                await this.loadBadgeContract();
                if (noBadgeState) noBadgeState.classList.add('hidden');
                if (hasBadgeState) hasBadgeState.classList.remove('hidden');
                await this.displayExistingBadge();
            } else {
                if (hasBadgeState) hasBadgeState.classList.add('hidden');
                if (noBadgeState) noBadgeState.classList.remove('hidden');
                this.displayCreateBadge();
            }
        } catch (error) {
            console.error('Error loading badge status:', error);
            eventBus.emit(EVENTS.TOAST, { message: `❌ Error loading badge: ${error.message}`, type: 'error' });
        }
    }

    async loadBadgeContract() {
        const badgeMeta = getContractMetadata('badge-blueprint');
        const response = await fetch(`${badgeMeta.abiFile}?v=${Date.now()}`);
        const abi = await response.json();
        this.userBadgeContract = this.web3Provider.getContract(this.userBadgeAddress, abi);
    }

    // ── Create badge flow ───────────────────────────────────────────

    displayCreateBadge() {
        const editorContainer = document.getElementById('editor-container');
        const uploadContainer = document.getElementById('upload-container');
        if (!editorContainer || !uploadContainer) return;

        editorContainer.innerHTML = '';
        this.editor = new PixelEditor({
            initialData: new Uint8Array(3072),
            scale: 12,
            onSave: (pixelData) => this.createBadge(pixelData)
        });
        editorContainer.appendChild(this.editor.render());

        uploadContainer.innerHTML = '';
        this.imageUploader = new ImageUploader({
            onImageLoaded: (pixelData) => {
                if (confirm('Load into editor for adjustments?\n\nOK = editor, Cancel = save directly')) {
                    this.editor.loadPixelDataFromImage(pixelData);
                    document.getElementById('mode-editor')?.click();
                } else {
                    this.createBadge(pixelData);
                }
            }
        });
        uploadContainer.appendChild(this.imageUploader.render());
    }

    // ── Edit badge flow ─────────────────────────────────────────────

    async displayExistingBadge() {
        // Always set up the upload container
        const uploadContainer = document.getElementById('upload-container-edit');
        if (uploadContainer) {
            uploadContainer.innerHTML = '';
            const uploader = new ImageUploader({
                onImageLoaded: (pixelData) => {
                    if (confirm('Load into editor for adjustments?\n\nOK = editor, Cancel = save directly')) {
                        if (this.editor) this.editor.loadPixelDataFromImage(pixelData);
                        document.getElementById('edit-mode-editor')?.click();
                    } else {
                        this.editBadge(pixelData);
                    }
                }
            });
            uploadContainer.appendChild(uploader.render());
        }

        try {
            const pixelData = await this.userBadgeContract.pixel_data();
            const pixelBytes = new Uint8Array(ethers.utils.arrayify(pixelData));

            const creationTime = await this.userBadgeContract.creation_time();
            const lastEditTime = await this.userBadgeContract.last_edit_time();
            const editCount = await this.userBadgeContract.edit_count();

            // Render current badge image
            const badgeDisplay = document.getElementById('current-badge-display');
            if (badgeDisplay) {
                badgeDisplay.innerHTML = '';
                badgeDisplay.appendChild(BadgeViewer.create(pixelBytes, { size: 256, showGrid: false, clickToExpand: true }));
            }

            const fmt = (ts) => new Date(ts.toNumber() * 1000).toLocaleString();
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            set('badge-created', fmt(creationTime));
            set('badge-edited', fmt(lastEditTime));
            set('badge-edit-count', editCount.toString());

            const link = document.getElementById('badge-address-link');
            if (link) {
                link.textContent = `${this.userBadgeAddress.slice(0, 6)}...${this.userBadgeAddress.slice(-4)}`;
                link.href = getExplorerUrl(this.userBadgeAddress);
            }

            // Pixel editor with existing data
            const editorContainer = document.getElementById('editor-container-edit');
            if (editorContainer) {
                editorContainer.innerHTML = '';
                this.editor = new PixelEditor({
                    initialData: pixelBytes,
                    scale: 12,
                    onSave: (pd) => this.editBadge(pd)
                });
                const el = this.editor.render();
                const saveBtn = el.querySelector('.btn-primary');
                if (saveBtn) saveBtn.textContent = '💾 Update Badge';
                editorContainer.appendChild(el);
            }
        } catch (error) {
            console.error('Error loading badge data:', error);
            eventBus.emit(EVENTS.TOAST, { message: `❌ Error loading badge data: ${error.message}`, type: 'error' });
        }
    }

    // ── Transactions ────────────────────────────────────────────────

    async createBadge(pixelData) {
        if (!this.web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, { message: '🔐 Please connect your wallet to create a badge', type: 'warning' });
            return;
        }
        try {
            const hexData = '0x' + Array.from(pixelData).map(b => b.toString(16).padStart(2, '0')).join('');
            const gasEstimate = await this.contract.estimateGas.create_badge(hexData);
            const gasLimit = gasEstimate.mul(120).div(100);

            eventBus.emit(EVENTS.TOAST, { message: `⏳ Creating badge... gas ~${gasEstimate}`, type: 'info' });
            const tx = await this.contract.create_badge(hexData, { gasLimit });
            eventBus.emit(EVENTS.TOAST, { message: '⏳ Waiting for confirmation...', type: 'info' });
            await tx.wait();
            eventBus.emit(EVENTS.TOAST, { message: '✅ Badge created!', type: 'success' });
            await this.loadBadgeStatus();
        } catch (error) {
            console.error('Error creating badge:', error);
            const msg = error.message.includes('user rejected') ? 'Cancelled by user'
                : error.message.includes('already has a badge') ? 'You already have a badge'
                : 'Failed to create badge';
            eventBus.emit(EVENTS.TOAST, { message: `❌ ${msg}`, type: 'error' });
        }
    }

    async editBadge(pixelData) {
        if (!this.web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, { message: '🔐 Please connect your wallet to edit your badge', type: 'warning' });
            return;
        }
        if (!this.userBadgeContract) {
            eventBus.emit(EVENTS.TOAST, { message: '❌ Badge contract not loaded', type: 'error' });
            return;
        }
        try {
            const hexData = '0x' + Array.from(pixelData).map(b => b.toString(16).padStart(2, '0')).join('');
            const gasEstimate = await this.userBadgeContract.estimateGas.edit(hexData);
            const gasLimit = gasEstimate.mul(120).div(100);

            eventBus.emit(EVENTS.TOAST, { message: `⏳ Updating badge... gas ~${gasEstimate}`, type: 'info' });
            const tx = await this.userBadgeContract.edit(hexData, { gasLimit });
            eventBus.emit(EVENTS.TOAST, { message: '⏳ Waiting for confirmation...', type: 'info' });
            await tx.wait();
            eventBus.emit(EVENTS.TOAST, { message: '✅ Badge updated!', type: 'success' });
            await this.displayExistingBadge();
        } catch (error) {
            console.error('Error editing badge:', error);
            const msg = error.message.includes('user rejected') ? 'Cancelled by user'
                : error.message.includes('Only owner') ? 'Only the badge owner can edit'
                : 'Failed to update badge';
            eventBus.emit(EVENTS.TOAST, { message: `❌ ${msg}`, type: 'error' });
        }
    }
}
