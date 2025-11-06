/**
 * Futures App
 * Interface for creating and managing Gaussian futures
 */

import { web3Provider } from './web3-provider.js';
import { eventBus, EVENTS } from './ui/events.js';
import { initConfetti } from './ui/confetti-animation.js';
import { ContractLoader } from './core/contract-loader.js';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.js';
import { config } from './config.js';

class FuturesApp {
    constructor() {
        console.log('🚀 FuturesApp initializing...');
        this.erfContract = null;
        this.currentValue = '';
        this.currentTTL = '';
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupUIListeners();
        this.setupWalletListeners();
        this.setupToastSystem();
        this.setupCanvas();
        
        // Load ERF calculator contract
        await this.loadErfContract();
        
        console.log('✅ Futures app initialized');
    }

    /**
     * Load the ERF calculator contract
     */
    async loadErfContract() {
        try {
            this.erfContract = await ContractLoader.load('erf-calculator', web3Provider);
            if (this.erfContract) {
                console.log('✅ ERF Calculator contract loaded');
                this.updateContractAddressDisplay();
            }
        } catch (error) {
            console.error('Failed to load ERF contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load ERF calculator contract',
                type: 'error'
            });
        }
    }

    /**
     * Update the contract address display
     */
    updateContractAddressDisplay() {
        const addressLink = document.getElementById('erf-contract-address');
        if (addressLink && CONTRACT_ADDRESSES.ERF_CALCULATOR) {
            addressLink.textContent = this.formatAddress(CONTRACT_ADDRESSES.ERF_CALCULATOR);
            addressLink.href = `${config.blockExplorer}/address/${CONTRACT_ADDRESSES.ERF_CALCULATOR}`;
        }
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Setup UI event listeners
     */
    setupUIListeners() {
        console.log('🔧 Setting up UI listeners...');
        
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                console.log('🔘 Connect wallet button clicked!');
                this.handleConnectWallet();
            });
        }

        // Value input
        const valueInput = document.getElementById('future-value');
        if (valueInput) {
            valueInput.addEventListener('input', (e) => {
                this.currentValue = e.target.value;
                this.updatePreview();
            });
        }

        // TTL input
        const ttlInput = document.getElementById('time-to-live');
        if (ttlInput) {
            ttlInput.addEventListener('input', (e) => {
                this.currentTTL = e.target.value;
                this.updatePreview();
            });
        }

        // Quick time buttons
        const timeButtons = document.querySelectorAll('.quick-amount-btn[data-time]');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = e.target.dataset.time;
                if (ttlInput) {
                    ttlInput.value = time;
                    this.currentTTL = time;
                    this.updatePreview();
                }
            });
        });

        // Create future button (disabled for now)
        const createBtn = document.getElementById('create-future-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Futures contract coming soon! Currently in development.',
                    type: 'info'
                });
            });
        }

        // Joy button (confetti test)
        const joyBtn = document.getElementById('joy-button');
        if (joyBtn) {
            joyBtn.addEventListener('click', () => {
                console.log('🎉 Joy button clicked - triggering confetti!');
                eventBus.emit(EVENTS.CONFETTI);
            });
        }
    }

    /**
     * Update ERF calculation preview
     */
    async updatePreview() {
        const previewDiv = document.getElementById('erf-preview');
        if (!previewDiv) return;

        // Need both value and TTL to calculate
        if (!this.currentValue || !this.currentTTL) {
            previewDiv.classList.add('hidden');
            return;
        }

        try {
            // Parse inputs
            const value = ethers.BigNumber.from(this.currentValue);
            const ttl = parseInt(this.currentTTL);

            // Calculate a sample ERF input based on value and time
            // For demonstration: normalize value to a reasonable range for ERF (-5 to 5)
            // This is a simplified calculation - actual futures contract will have proper logic
            const normalizedInput = this.normalizeForErf(value, ttl);
            
            if (!this.erfContract) {
                console.log('ERF contract not loaded yet');
                return;
            }

            // Call ERF calculator
            const erfResult = await this.erfContract.erf(
                ethers.utils.parseUnits(normalizedInput.toString(), 10)
            );
            const erfValue = parseFloat(ethers.utils.formatUnits(erfResult, 10));
            
            // Calculate probability (normalize ERF output from [-1,1] to [0,1])
            const probability = ((erfValue + 1) / 2 * 100).toFixed(2);

            // Show results
            document.getElementById('erf-input').textContent = normalizedInput.toFixed(4);
            document.getElementById('erf-result').textContent = erfValue.toFixed(6);
            document.getElementById('probability').textContent = `${probability}%`;
            
            previewDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to calculate ERF:', error);
            previewDiv.classList.add('hidden');
        }
    }

    /**
     * Normalize value for ERF input (simplified for demo)
     * Maps value to reasonable ERF input range (-5 to 5)
     */
    normalizeForErf(value, ttl) {
        // Convert wei to eth for easier calculation
        const ethValue = parseFloat(ethers.utils.formatEther(value));
        
        // Normalize based on value and time
        // This is a placeholder - actual implementation would use proper Gaussian distribution
        const timeFactor = Math.log(ttl) / 10; // Logarithmic time scaling
        const valueFactor = Math.log(ethValue + 1) / 2; // Logarithmic value scaling
        
        // Map to [-5, 5] range
        const normalized = (valueFactor - timeFactor);
        return Math.max(-5, Math.min(5, normalized));
    }

    /**
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        eventBus.on(EVENTS.WALLET_CONNECTED, async (data) => {
            await this.updateWalletUI(data.address);
            // Reload ERF contract with signer
            await this.loadErfContract();
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, async () => {
            await this.updateWalletUI(null);
            // Reload ERF contract in read-only mode
            await this.loadErfContract();
        });

        eventBus.on(EVENTS.WALLET_CHANGED, async (data) => {
            await this.updateWalletUI(data.address);
            await this.loadErfContract();
        });
    }

    /**
     * Setup toast notification system
     */
    setupToastSystem() {
        eventBus.on(EVENTS.TOAST, (data) => {
            this.showToast(data.message, data.type);
        });
    }

    /**
     * Setup canvas for animations
     */
    setupCanvas() {
        const canvas = document.getElementById('effects-canvas');
        if (!canvas) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        window.effectsCanvas = canvas;
        window.effectsCtx = canvas.getContext('2d');
        
        // Initialize confetti
        initConfetti();
    }

    /**
     * Handle wallet connection
     */
    async handleConnectWallet() {
        console.log('🔌 handleConnectWallet called');
        const success = await web3Provider.connect();
        if (success) {
            console.log('Wallet connected successfully');
        }
    }

    /**
     * Update wallet UI
     */
    async updateWalletUI(address) {
        const connectBtn = document.getElementById('connect-wallet');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddress = document.getElementById('wallet-address');
        const walletBalance = document.getElementById('wallet-balance');
        const readonlyBadge = document.getElementById('readonly-badge');

        if (address) {
            // Connected mode
            connectBtn?.classList.add('hidden');
            walletInfo?.classList.remove('hidden');
            readonlyBadge?.classList.add('hidden');
            
            if (walletAddress) {
                walletAddress.textContent = web3Provider.formatAddress(address);
            }

            // Update balance
            if (walletBalance) {
                const balance = await web3Provider.getBalance();
                walletBalance.textContent = `${parseFloat(balance).toFixed(4)} ETH`;
            }
        } else {
            // Read-only mode
            connectBtn?.classList.remove('hidden');
            walletInfo?.classList.add('hidden');
            readonlyBadge?.classList.remove('hidden');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
console.log('📦 futures-app.js loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, initializing FuturesApp...');
        new FuturesApp();
    });
} else {
    console.log('✅ DOM already ready, initializing FuturesApp...');
    new FuturesApp();
}

