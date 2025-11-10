/**
 * Wallet Connect Component
 * Presentation layer - reusable wallet connection UI
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { BadgeViewer } from './badge-viewer.js';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class WalletConnectComponent {
    constructor(web3Provider) {
        this.web3Provider = web3Provider;
        this.badgeFactoryContract = null;
    }

    /**
     * Render wallet connect button and info
     */
    render(containerSelector = 'header') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const connectBtn = container.querySelector('#connect-wallet');
        const walletInfo = container.querySelector('#wallet-info');
        const readonlyBadge = container.querySelector('#readonly-badge');
        const copyBtn = container.querySelector('#copy-address');

        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                await this.web3Provider.connect();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyAddress();
            });
        }

        // Set initial state based on connection
        if (this.web3Provider.isConnected()) {
            if (connectBtn) connectBtn.classList.add('hidden');
            if (readonlyBadge) readonlyBadge.classList.add('hidden');
            if (walletInfo) {
                walletInfo.classList.remove('hidden');
                this.updateWalletDisplay(this.web3Provider.address);
            }
        }

        // Mark header as ready to show (fade in)
        const headerRight = container.querySelector('.header-right');
        if (headerRight) {
            headerRight.classList.add('ready');
        }

        // Listen for wallet events
        this.setupEventListeners(connectBtn, walletInfo, readonlyBadge);
    }

    setupEventListeners(connectBtn, walletInfo, readonlyBadge) {
        eventBus.on(EVENTS.WALLET_CONNECTED, ({ address }) => {
            if (connectBtn) connectBtn.classList.add('hidden');
            if (readonlyBadge) readonlyBadge.classList.add('hidden');
            if (walletInfo) {
                walletInfo.classList.remove('hidden');
                this.updateWalletDisplay(address);
            }
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, () => {
            if (connectBtn) connectBtn.classList.remove('hidden');
            if (readonlyBadge) readonlyBadge.classList.remove('hidden');
            if (walletInfo) walletInfo.classList.add('hidden');
        });

        eventBus.on(EVENTS.WALLET_CHANGED, ({ address }) => {
            this.updateWalletDisplay(address);
        });
    }

    async updateWalletDisplay(address) {
        const addressEl = document.getElementById('wallet-address');
        const balanceEl = document.getElementById('wallet-balance');
        
        if (addressEl) {
            addressEl.textContent = this.web3Provider.formatAddress(address);
        }
        
        if (balanceEl) {
            try {
                const balance = await this.web3Provider.getBalance();
                balanceEl.textContent = `${parseFloat(balance).toFixed(4)} ETH`;
            } catch (error) {
                balanceEl.textContent = '-.---- ETH';
            }
        }

        // Load and display badge if exists
        await this.loadBadge(address);
    }

    /**
     * Load and display user's badge in header
     */
    async loadBadge(address) {
        try {
            // Check if badge factory is deployed
            if (!CONTRACT_ADDRESSES.BADGE_FACTORY || 
                CONTRACT_ADDRESSES.BADGE_FACTORY === '0x0000000000000000000000000000000000000000' ||
                CONTRACT_ADDRESSES.BADGE_FACTORY === '0x0') {
                console.log('Badge system not deployed yet, skipping badge load');
                return; // Badge system not deployed yet
            }

            // Load badge factory contract if not loaded
            if (!this.badgeFactoryContract) {
                const factoryAbi = await fetch(`${CONTRACT_ABIS.BADGE_FACTORY}?v=${Date.now()}`).then(r => r.json());
                this.badgeFactoryContract = this.web3Provider.getContract(
                    CONTRACT_ADDRESSES.BADGE_FACTORY,
                    factoryAbi
                );
            }

            // Check if user has a badge
            const badgeAddress = await this.badgeFactoryContract.get_badge(address);
            const hasBadge = badgeAddress !== '0x0000000000000000000000000000000000000000';

            // Get or create badge container - place it inline with address on the left
            let badgeContainer = document.getElementById('wallet-badge-container');
            if (!badgeContainer) {
                // Find the first wallet-line (the one with the address)
                const addressLine = document.querySelector('#wallet-info .wallet-line');
                if (!addressLine) return;

                // Create badge container as an inline element
                badgeContainer = document.createElement('span');
                badgeContainer.id = 'wallet-badge-container';
                badgeContainer.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    margin-right: 0.5rem;
                    vertical-align: middle;
                `;
                // Insert at the beginning of the address line
                addressLine.insertBefore(badgeContainer, addressLine.firstChild);
            }

            if (hasBadge) {
                // Load badge contract
                const badgeAbi = await fetch(`${CONTRACT_ABIS.BADGE}?v=${Date.now()}`).then(r => r.json());
                const badgeContract = this.web3Provider.getContract(
                    badgeAddress,
                    badgeAbi
                );

                // Load pixel data
                const pixelData = await badgeContract.pixel_data();
                const pixelBytes = new Uint8Array(ethers.utils.arrayify(pixelData));

                // Display badge (no label, just the badge itself)
                badgeContainer.innerHTML = '';
                badgeContainer.style.display = 'inline-flex';  // Make sure it's visible

                const viewer = BadgeViewer.create(pixelBytes, {
                    size: 24,  // Smaller for inline display
                    showGrid: false,
                    clickToExpand: true
                });
                viewer.style.borderRadius = '4px';
                viewer.style.overflow = 'hidden';
                viewer.title = 'Your badge - click to view full size';

                badgeContainer.appendChild(viewer);
            } else {
                // No badge - hide the container
                if (badgeContainer) {
                    badgeContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.log('Badge loading failed (contract may not be deployed):', error.message);
            // Silently fail - badge is optional
            // Remove any partial badge container
            const badgeContainer = document.getElementById('wallet-badge-container');
            if (badgeContainer) {
                badgeContainer.remove();
            }
        }
    }

    /**
     * Copy address to clipboard
     */
    async copyAddress() {
        const address = this.web3Provider.address;
        if (!address) return;

        try {
            await navigator.clipboard.writeText(address);
            
            // Visual feedback
            const copyBtn = document.getElementById('copy-address');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.classList.add('copied');
                copyBtn.textContent = '✓';
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.textContent = originalText;
                }, 2000);
            }

            // Toast notification
            eventBus.emit(EVENTS.TOAST, {
                message: 'Address copied to clipboard',
                type: 'success'
            });
        } catch (error) {
            console.error('Failed to copy address:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to copy address',
                type: 'error'
            });
        }
    }
}

