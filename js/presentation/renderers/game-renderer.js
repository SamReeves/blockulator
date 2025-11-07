/**
 * Game Renderer
 * Presentation layer - reusable UI patterns for rendering game interfaces
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class GameRenderer {
    /**
     * Create just the header with contract info (for games with custom UIs)
     */
    static createGameHeader(config) {
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = config.title;
        header.appendChild(title);
        
        if (config.description) {
            const description = document.createElement('p');
            description.className = 'game-description';
            description.textContent = config.description;
            header.appendChild(description);
        }
        
        // Add contract info section
        if (config.contractAddress) {
            const contractInfo = this.createContractInfo(config.contractAddress, config.sourceFile, config.abiFile);
            header.appendChild(contractInfo);
        }
        
        return header;
    }
    
    /**
     * Create modern game interface structure with new component system
     */
    static createGameInterface(config) {
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Add header
        container.appendChild(this.createGameHeader(config));
        
        // Game state bar (universal across all games)
        const gameStateBar = this.createGameStateBar(config);
        container.appendChild(gameStateBar);
        
        // Input section - simplified for wei-only input
        const inputSection = this.createWeiInputSection(config);
        container.appendChild(inputSection);
        
        return container;
    }
    
    /**
     * Create universal game state bar
     */
    static createGameStateBar(config) {
        const stateBar = document.createElement('div');
        stateBar.className = 'game-state-bar';
        stateBar.id = 'game-state-bar';
        
        stateBar.innerHTML = `
            <div class="state-item">
                <div class="state-label">Round Progress</div>
                <div class="state-value" id="round-progress">0/10</div>
            </div>
            <div class="state-item">
                <div class="state-label">Prize Pool (99%)</div>
                <div class="state-value" id="prize-pool">0 wei</div>
            </div>
            <div class="state-item">
                <div class="state-label">Remaining</div>
                <div class="state-value" id="plays-remaining">10 plays</div>
            </div>
        `;
        
        return stateBar;
    }
    
    /**
     * Update game state bar
     */
    static updateGameStateBar(data) {
        const progressEl = document.getElementById('round-progress');
        const prizeEl = document.getElementById('prize-pool');
        const remainingEl = document.getElementById('plays-remaining');
        
        if (progressEl && data.playCount !== undefined) {
            progressEl.textContent = `${data.playCount}/10`;
        }
        
        if (prizeEl && data.prizePool !== undefined) {
            prizeEl.textContent = `${Math.round(data.prizePool).toLocaleString()} wei`;
        }
        
        if (remainingEl && data.playCount !== undefined) {
            const remaining = 10 - data.playCount;
            remainingEl.textContent = `${remaining} play${remaining !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Create wei-only input section (the amount IS the play)
     */
    static createWeiInputSection(config) {
        const section = document.createElement('div');
        section.className = 'wei-input-section';
        
        const explanation = document.createElement('div');
        explanation.className = 'input-explanation';
        explanation.innerHTML = `
            <strong>💡 How to Play:</strong> The wei amount you send IS your play value. 
            There is no separate bet and guess.
        `;
        section.appendChild(explanation);
        
        // Wei input group
        const inputGroup = document.createElement('div');
        inputGroup.className = 'wei-input-group';
        
        const label = document.createElement('label');
        label.textContent = 'Your Play Amount (Wei)';
        label.setAttribute('for', 'play-wei');
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'play-wei';
        input.className = 'wei-input';
        input.placeholder = 'Enter wei amount...';
        input.min = '0';
        input.step = '1';
        
        const ethConversion = document.createElement('div');
        ethConversion.className = 'eth-conversion';
        ethConversion.id = 'eth-conversion';
        ethConversion.textContent = '= 0 ETH';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputGroup.appendChild(ethConversion);
        
        // Quick amount buttons
        const quickAmounts = document.createElement('div');
        quickAmounts.className = 'quick-amounts';
        
        const amounts = [
            { label: '100K', value: 100000 },
            { label: '500K', value: 500000 },
            { label: '1M', value: 1000000 },
            { label: '5M', value: 5000000 },
            { label: '10M', value: 10000000 }
        ];
        
        amounts.forEach(amt => {
            const btn = document.createElement('button');
            btn.className = 'quick-amount-btn';
            btn.textContent = amt.label;
            btn.type = 'button';
            btn.onclick = () => {
                input.value = amt.value;
                input.dispatchEvent(new Event('input'));
            };
            quickAmounts.appendChild(btn);
        });
        
        section.appendChild(inputGroup);
        section.appendChild(quickAmounts);
        
        // Play button
        const playButton = document.createElement('button');
        playButton.className = 'btn-play';
        playButton.textContent = '🎮 Play';
        playButton.id = 'play-button';
        playButton.type = 'button';
        
        section.appendChild(playButton);
        
        // Setup real-time ETH conversion
        input.addEventListener('input', () => {
            const wei = parseFloat(input.value) || 0;
            const eth = wei / 1e18;
            ethConversion.textContent = `≈ ${eth.toFixed(9)} ETH`;
        });
        
        return section;
    }

    /**
     * Create contract info section with address, Etherscan link, and view badge
     */
    static createContractInfo(contractAddress, sourceFile = null, abiFile = null) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'contract-info';
        
        const label = document.createElement('span');
        label.className = 'contract-label';
        label.textContent = 'Contract:';
        
        const addressLink = document.createElement('a');
        addressLink.className = 'contract-address';
        addressLink.href = `https://sepolia.etherscan.io/address/${contractAddress}`;
        addressLink.target = '_blank';
        addressLink.rel = 'noopener noreferrer';
        addressLink.textContent = this.formatAddress(contractAddress);
        addressLink.title = contractAddress; // Full address on hover
        
        const viewBadge = document.createElement('a');
        viewBadge.className = 'contract-badge';
        viewBadge.href = `https://sepolia.etherscan.io/address/${contractAddress}#code`;
        viewBadge.target = '_blank';
        viewBadge.rel = 'noopener noreferrer';
        viewBadge.innerHTML = '📜 View on Etherscan';
        viewBadge.title = 'View contract on Etherscan';
        
        infoContainer.appendChild(label);
        infoContainer.appendChild(addressLink);
        infoContainer.appendChild(viewBadge);
        
        // Add View Source button if source file is provided
        if (sourceFile) {
            const viewSourceBtn = document.createElement('button');
            viewSourceBtn.className = 'contract-badge contract-badge-source';
            viewSourceBtn.innerHTML = '🐍 View Vyper Source';
            viewSourceBtn.title = 'View Vyper source code';
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
        // Remove existing modal if any
        const existingModal = document.getElementById('source-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'source-modal';
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content source-modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">📜 Contract Source Code</h3>
                    <button class="modal-close" id="close-modal">✕</button>
                </div>
                <div class="modal-file-info">
                    <span class="file-path">${sourceFile}</span>
                </div>
                <div class="modal-body">
                    <pre class="source-code"><code class="language-python">${this.escapeHtml(code)}</code></pre>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="copy-source">📋 Copy to Clipboard</button>
                    <button class="btn-primary" id="close-modal-footer">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('#close-modal, #close-modal-footer');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Copy button
        const copyBtn = modal.querySelector('#copy-source');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(code);
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Source code copied to clipboard!',
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
        // Remove existing modal if any
        const existingModal = document.getElementById('abi-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'abi-modal';
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content source-modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">📋 Contract ABI</h3>
                    <button class="modal-close" id="close-abi-modal">✕</button>
                </div>
                <div class="modal-file-info">
                    <span class="file-path">${abiFile}</span>
                </div>
                <div class="modal-body">
                    <pre class="source-code"><code class="language-json">${this.escapeHtml(abiJson)}</code></pre>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="copy-abi">📋 Copy to Clipboard</button>
                    <button class="btn-primary" id="close-abi-modal-footer">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('#close-abi-modal, #close-abi-modal-footer');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Copy button
        const copyBtn = modal.querySelector('#copy-abi');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(abiJson);
                eventBus.emit(EVENTS.TOAST, {
                    message: 'ABI copied to clipboard!',
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
    
    /**
     * Format Ethereum address (0x1234...5678)
     */
    static formatAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Show loading state
     */
    static setLoading(isLoading) {
        const button = document.getElementById('play-button');
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.textContent = '⏳ Processing...';
        } else {
            button.disabled = false;
            button.textContent = '🎮 Play';
        }
    }

    /**
     * Show toast notification
     */
    static showToast(message, type = 'info') {
        eventBus.emit(EVENTS.TOAST, { message, type });
    }
}

