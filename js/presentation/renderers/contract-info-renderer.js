/**
 * Contract Info Renderer
 * Presentation layer - displays contract information and source/ABI modals
 * Extracted from game-renderer for reuse across the app
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { getExplorerUrl } from '../../infrastructure/config/network.js';
import { DOMHelpers } from '../dom/dom-helpers.js';
import { SourceViewer } from '../components/source-viewer.js';

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
     * Show source code in fullscreen minimal view
     */
    static showSourceModal(sourceFile) {
        const title = sourceFile.split('/').pop();
        const overlay = SourceViewer.createFullscreen({
            sourceUrl: sourceFile,
            title: title
        });
        document.body.appendChild(overlay);
    }
    
    /**
     * Show ABI in fullscreen minimal view
     */
    static showAbiModal(abiFile) {
        const title = abiFile.split('/').pop();
        const overlay = SourceViewer.createFullscreen({
            sourceUrl: abiFile,
            title: title
        });
        document.body.appendChild(overlay);
    }
    
    /**
     * Create inline collapsed source viewers for a contract
     * @param {string} sourceFile - Path to source file
     * @param {string} abiFile - Path to ABI file
     * @returns {HTMLElement}
     */
    static createInlineSourceViewers(sourceFile, abiFile) {
        const sources = [];
        
        if (sourceFile) {
            const lang = sourceFile.endsWith('.huff') ? 'asm' : 
                        sourceFile.endsWith('.vy') ? 'python' : null;
            sources.push({
                sourceUrl: sourceFile,
                title: sourceFile.split('/').pop(),
                language: lang
            });
        }
        
        if (abiFile) {
            sources.push({
                sourceUrl: abiFile,
                title: 'ABI',
                language: 'json'
            });
        }
        
        return SourceViewer.createGroup(sources);
    }
}
