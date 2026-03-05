/**
 * Contract Info Renderer
 * Presentation layer - displays contract information and source/ABI modals
 * Extracted from game-renderer for reuse across the app
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { getExplorerUrl } from '../../infrastructure/config/network.js';
import { DOMHelpers } from '../dom/dom-helpers.js';

export class ContractInfoRenderer {
    /**
     * Create contract info section with address, Etherscan link, and view badges
     */
    static createContractInfo(contractAddress, sourceFile = null, abiFile = null) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'contract-info';
        
        const label = document.createElement('span');
        label.className = 'contract-label';
        label.textContent = 'Contract:';
        
        const addressLink = document.createElement('a');
        addressLink.className = 'contract-address';
        addressLink.href = getExplorerUrl(contractAddress);
        addressLink.target = '_blank';
        addressLink.rel = 'noopener noreferrer';
        addressLink.textContent = DOMHelpers.formatAddress(contractAddress);
        addressLink.title = contractAddress; // Full address on hover
        
        const viewBadge = document.createElement('a');
        viewBadge.className = 'contract-badge';
        viewBadge.href = `${getExplorerUrl(contractAddress)}#code`;
        viewBadge.target = '_blank';
        viewBadge.rel = 'noopener noreferrer';
        viewBadge.innerHTML = '📜 View on Etherscan';
        viewBadge.title = 'View contract on Etherscan';
        
        infoContainer.appendChild(label);
        infoContainer.appendChild(addressLink);
        infoContainer.appendChild(viewBadge);
        
        // Add View Source button if source file is provided
        if (sourceFile) {
            const sourceLabel = '📜 View Source';
            const sourceTitle = 'View contract source code';
            
            const viewSourceBtn = document.createElement('button');
            viewSourceBtn.className = 'contract-badge contract-badge-source';
            viewSourceBtn.innerHTML = sourceLabel;
            viewSourceBtn.title = sourceTitle;
            viewSourceBtn.onclick = () => this.showSourceModal(sourceFile);
            infoContainer.appendChild(viewSourceBtn);
        }
        
        // Add View ABI button if ABI file is provided
        if (abiFile) {
            const viewAbiBtn = document.createElement('button');
            viewAbiBtn.className = 'contract-badge contract-badge-abi';
            viewAbiBtn.innerHTML = '📋 View ABI';
            viewAbiBtn.title = 'View contract ABI (JSON)';
            viewAbiBtn.onclick = () => this.showAbiModal(abiFile);
            infoContainer.appendChild(viewAbiBtn);
        }
        
        return infoContainer;
    }
    
    /**
     * Show source code modal
     */
    static async showSourceModal(sourceFile) {
        try {
            const response = await fetch(sourceFile);
            if (!response.ok) {
                throw new Error('Failed to load source code');
            }
            const code = await response.text();
            this.createSourceModal(code, sourceFile);
        } catch (error) {
            console.error('Error loading source:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load source code',
                type: 'error'
            });
        }
    }
    
    /**
     * Create and show source code modal
     */
    static createSourceModal(code, sourceFile) {
        const isHuff = sourceFile.endsWith('.huff');
        const langClass = isHuff ? 'language-asm' : 'language-python';
        const titleEmoji = isHuff ? '0x' : '📜';
        
        this.createModal({
            modalId: 'source-modal',
            title: `${titleEmoji} Contract Source Code`,
            filePath: sourceFile,
            code: code,
            langClass: langClass,
            copyBtnId: 'copy-source',
            closeBtnId: 'close-modal',
            closeFooterBtnId: 'close-modal-footer',
            copySuccessMessage: 'Source code copied to clipboard!'
        });
    }
    
    /**
     * Show ABI modal
     */
    static async showAbiModal(abiFile) {
        try {
            const response = await fetch(abiFile);
            if (!response.ok) {
                throw new Error('Failed to load ABI');
            }
            const abi = await response.json();
            const formattedAbi = JSON.stringify(abi, null, 2);
            this.createAbiModal(formattedAbi, abiFile);
        } catch (error) {
            console.error('Error loading ABI:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load ABI',
                type: 'error'
            });
        }
    }
    
    /**
     * Create and show ABI modal
     */
    static createAbiModal(abiJson, abiFile) {
        this.createModal({
            modalId: 'abi-modal',
            title: '📋 Contract ABI',
            filePath: abiFile,
            code: abiJson,
            langClass: 'language-json',
            copyBtnId: 'copy-abi',
            closeBtnId: 'close-abi-modal',
            closeFooterBtnId: 'close-abi-modal-footer',
            copySuccessMessage: 'ABI copied to clipboard!'
        });
    }
    
    /**
     * Generic modal creator for source code and ABI display
     */
    static createModal({ modalId, title, filePath, code, langClass, copyBtnId, closeBtnId, closeFooterBtnId, copySuccessMessage }) {
        // Remove existing modal if any
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content source-modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" id="${closeBtnId}">✕</button>
                </div>
                <div class="modal-file-info">
                    <span class="file-path">${filePath}</span>
                </div>
                <div class="modal-body">
                    <pre class="source-code"><code class="${langClass}">${this.escapeHtml(code)}</code></pre>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="${copyBtnId}">📋 Copy to Clipboard</button>
                    <button class="btn-primary" id="${closeFooterBtnId}">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll(`#${closeBtnId}, #${closeFooterBtnId}`);
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Copy button
        const copyBtn = modal.querySelector(`#${copyBtnId}`);
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(code);
                eventBus.emit(EVENTS.TOAST, {
                    message: copySuccessMessage,
                    type: 'success'
                });
            } catch (error) {
                console.error('Copy failed:', error);
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Failed to copy to clipboard',
                    type: 'error'
                });
            }
        });
        
        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    /**
     * Escape HTML for safe display
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
