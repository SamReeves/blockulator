/**
 * Technical Panel Component
 * Renders contract addresses, source code, ABIs, and Etherscan links
 */

import { CONTRACT_ADDRESSES, CONTRACT_SOURCES } from '../../infrastructure/config/contracts.js';

export class TechnicalPanel {
    constructor(boardAddress, boardAbi, discussionAbi) {
        this.boardAddress = boardAddress;
        this.boardAbi = boardAbi;
        this.discussionAbi = discussionAbi;
        this.containerElement = null;
        this.network = 'sepolia'; // TODO: Get from provider
    }

    /**
     * Set the container element
     */
    setContainer(element) {
        this.containerElement = element;
    }

    /**
     * Render the panel
     */
    render() {
        if (!this.containerElement) {
            console.error('Container element not set');
            return;
        }

        const etherscanBase = this.getEtherscanBase();
        const boardSource = CONTRACT_SOURCES.DISCUSSION_BOARD || '/contracts/src/discussions/board.vy';
        const discussionSource = CONTRACT_SOURCES.DISCUSSION || '/contracts/src/discussions/discussion.vy';

        this.containerElement.innerHTML = `
            <details class="info-panel technical-panel">
                <summary class="panel-summary">
                    <span class="panel-icon">⚙️</span>
                    <span class="panel-title">Technical Information</span>
                    <span class="panel-arrow">▼</span>
                </summary>
                
                <div class="panel-content">
                    <div class="technical-grid">
                        <!-- Board Contract -->
                        <div class="contract-section">
                            <h3>📋 Discussion Board Contract</h3>
                            
                            <div class="contract-info">
                                <div class="info-item">
                                    <span class="info-label">Address:</span>
                                    <code class="info-value address">${this.boardAddress}</code>
                                    <button class="btn-copy" data-copy="${this.boardAddress}" title="Copy address">
                                        📋
                                    </button>
                                </div>
                                
                                <div class="info-item">
                                    <span class="info-label">Network:</span>
                                    <span class="info-value">${this.network}</span>
                                </div>

                                <div class="info-links">
                                    <a href="${etherscanBase}/address/${this.boardAddress}" 
                                       target="_blank" 
                                       class="btn-link">
                                        View on Etherscan ↗
                                    </a>
                                    <a href="${boardSource}" 
                                       target="_blank" 
                                       class="btn-link">
                                        View Source Code ↗
                                    </a>
                                    <button class="btn-link btn-view-abi" data-contract="board">
                                        View ABI
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Discussion Blueprint Contract -->
                        <div class="contract-section">
                            <h3>💬 Discussion Blueprint Contract</h3>
                            
                            <div class="contract-info">
                                <div class="info-item">
                                    <span class="info-label">Type:</span>
                                    <span class="info-value">Factory Blueprint</span>
                                </div>
                                
                                <div class="info-item">
                                    <span class="info-label">Description:</span>
                                    <span class="info-value">Individual discussions are deployed from this blueprint</span>
                                </div>

                                <div class="info-links">
                                    <a href="${discussionSource}" 
                                       target="_blank" 
                                       class="btn-link">
                                        View Source Code ↗
                                    </a>
                                    <button class="btn-link btn-view-abi" data-contract="discussion">
                                        View ABI
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Language & Tools -->
                        <div class="contract-section">
                            <h3>🛠️ Technology Stack</h3>
                            
                            <div class="tech-info">
                                <div class="tech-item">
                                    <strong>Smart Contracts:</strong> Vyper 0.4.3
                                </div>
                                <div class="tech-item">
                                    <strong>Frontend:</strong> Vanilla JavaScript (ES6 Modules)
                                </div>
                                <div class="tech-item">
                                    <strong>Web3 Library:</strong> ethers.js v5
                                </div>
                                <div class="tech-item">
                                    <strong>Pattern:</strong> Factory + Blueprint deployment
                                </div>
                                <div class="tech-item">
                                    <strong>Architecture:</strong> Event-driven, domain-driven design
                                </div>
                            </div>
                        </div>

                        <!-- Contract Features -->
                        <div class="contract-section">
                            <h3>✨ Contract Features</h3>
                            
                            <div class="features-list">
                                <div class="feature-item">
                                    <span class="feature-check">✓</span>
                                    <span>No owner or admin privileges</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-check">✓</span>
                                    <span>Fully algorithmic curation</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-check">✓</span>
                                    <span>Immutable discussion settings</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-check">✓</span>
                                    <span>Anti-spam cooldowns</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-check">✓</span>
                                    <span>Automatic prize distribution</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-check">✓</span>
                                    <span>Message boosting mechanism</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ABI Viewers (Initially Hidden) -->
                    <div id="board-abi-viewer" class="abi-viewer hidden">
                        <div class="abi-header">
                            <h4>Board Contract ABI</h4>
                            <button class="btn-close-abi">✖</button>
                        </div>
                        <pre class="abi-content"><code>${this.escapeHtml(JSON.stringify(this.boardAbi, null, 2))}</code></pre>
                        <button class="btn-copy-abi" data-copy="${this.escapeHtml(JSON.stringify(this.boardAbi))}">
                            Copy ABI to Clipboard
                        </button>
                    </div>

                    <div id="discussion-abi-viewer" class="abi-viewer hidden">
                        <div class="abi-header">
                            <h4>Discussion Contract ABI</h4>
                            <button class="btn-close-abi">✖</button>
                        </div>
                        <pre class="abi-content"><code>${this.escapeHtml(JSON.stringify(this.discussionAbi, null, 2))}</code></pre>
                        <button class="btn-copy-abi" data-copy="${this.escapeHtml(JSON.stringify(this.discussionAbi))}">
                            Copy ABI to Clipboard
                        </button>
                    </div>
                </div>
            </details>
        `;

        this.attachEventListeners();
    }

    /**
     * Get Etherscan base URL
     */
    getEtherscanBase() {
        const etherscanUrls = {
            'mainnet': 'https://etherscan.io',
            'sepolia': 'https://sepolia.etherscan.io',
            'goerli': 'https://goerli.etherscan.io',
            'localhost': 'http://localhost:8545'
        };
        return etherscanUrls[this.network] || etherscanUrls.sepolia;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const details = this.containerElement.querySelector('details');
        if (details) {
            details.addEventListener('toggle', () => {
                const arrow = details.querySelector('.panel-arrow');
                if (arrow) {
                    arrow.textContent = details.open ? '▲' : '▼';
                }
            });
        }

        // Copy buttons
        const copyButtons = this.containerElement.querySelectorAll('.btn-copy');
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const text = button.dataset.copy;
                this.copyToClipboard(text);
            });
        });

        // View ABI buttons
        const viewAbiButtons = this.containerElement.querySelectorAll('.btn-view-abi');
        viewAbiButtons.forEach(button => {
            button.addEventListener('click', () => {
                const contract = button.dataset.contract;
                this.showAbiViewer(contract);
            });
        });

        // Close ABI buttons
        const closeAbiButtons = this.containerElement.querySelectorAll('.btn-close-abi');
        closeAbiButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const viewer = e.target.closest('.abi-viewer');
                if (viewer) viewer.classList.add('hidden');
            });
        });

        // Copy ABI buttons
        const copyAbiButtons = this.containerElement.querySelectorAll('.btn-copy-abi');
        copyAbiButtons.forEach(button => {
            button.addEventListener('click', () => {
                const text = button.dataset.copy;
                this.copyToClipboard(text);
            });
        });
    }

    /**
     * Show ABI viewer
     */
    showAbiViewer(contract) {
        // Hide all viewers first
        const viewers = this.containerElement.querySelectorAll('.abi-viewer');
        viewers.forEach(v => v.classList.add('hidden'));

        // Show the requested viewer
        const viewerId = `${contract}-abi-viewer`;
        const viewer = this.containerElement.querySelector(`#${viewerId}`);
        if (viewer) {
            viewer.classList.remove('hidden');
            viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Show toast (if available)
            if (window.eventBus) {
                const { eventBus, EVENTS } = await import('../../infrastructure/events/event-bus.js');
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Copied to clipboard!',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            
            // Fallback: Select text
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Fallback copy failed:', err);
            }
            document.body.removeChild(textArea);
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

