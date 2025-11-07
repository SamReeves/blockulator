/**
 * Wallet Connect Component
 * Presentation layer - reusable wallet connection UI
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class WalletConnectComponent {
    constructor(web3Provider) {
        this.web3Provider = web3Provider;
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

