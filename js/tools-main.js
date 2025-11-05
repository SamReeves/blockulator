/**
 * Tools Page Entry Point
 * Handles initialization and UI coordination for calculator tools
 */

import { web3Provider } from './web3-provider.js';
import { eventBus, EVENTS } from './ui/events.js';

// Import tool modules
import { ECalculator } from './tools/e.js';
import { PiCalculator } from './tools/pi.js';
import { TauCalculator } from './tools/tau.js';

class ToolsApp {
    constructor() {
        console.log('🚀 ToolsApp constructor called');
        
        try {
            this.currentTool = null;
            this.tools = new Map([
                ['e-calculator', ECalculator],
                ['pi-calculator', PiCalculator],
                ['tau-calculator', TauCalculator]
            ]);
            
            console.log('✅ Tools map created successfully');
            
            this.init();
        } catch (error) {
            console.error('❌ Error in ToolsApp constructor:', error);
            alert('Failed to initialize tools: ' + error.message);
            throw error;
        }
    }

    /**
     * Initialize the app
     */
    init() {
        // Setup UI event listeners
        this.setupUIListeners();
        
        // Setup wallet listeners
        this.setupWalletListeners();
        
        // Setup toast system
        this.setupToastSystem();
        
        // Setup canvas for effects
        this.setupCanvas();
        
        console.log('🔧 WhaleGames Tools initialized');
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
                console.log('Connect wallet button clicked!');
                this.handleConnectWallet();
            });
        }
        
        // Tool cards
        const toolCards = document.querySelectorAll('.tool-card');
        console.log('Tool cards found:', toolCards.length);
        toolCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const toolId = e.currentTarget.dataset.tool;
                console.log('Tool card clicked:', toolId);
                this.loadTool(toolId);
            });
        });
        
        // Back button
        const backToTools = document.getElementById('back-to-tools');
        if (backToTools) {
            backToTools.addEventListener('click', () => {
                console.log('Back to tools clicked');
                this.showToolList();
            });
        }
        
        console.log('✅ UI listeners setup complete');
    }

    /**
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        eventBus.on(EVENTS.WALLET_CONNECTED, (data) => {
            this.updateWalletUI(data.address);
        });
        
        eventBus.on(EVENTS.WALLET_DISCONNECTED, () => {
            this.updateWalletUI(null);
        });
        
        eventBus.on(EVENTS.WALLET_CHANGED, (data) => {
            this.updateWalletUI(data.address);
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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Resize handler
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        // Store context globally for animation access
        window.effectsCanvas = canvas;
        window.effectsCtx = canvas.getContext('2d');
    }

    /**
     * Handle wallet connection
     */
    async handleConnectWallet() {
        const success = await web3Provider.connect();
        if (success) {
            console.log('Wallet connected, tools ready');
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
        
        if (address) {
            connectBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            walletAddress.textContent = web3Provider.formatAddress(address);
            
            // Update balance
            const balance = await web3Provider.getBalance();
            walletBalance.textContent = `${parseFloat(balance).toFixed(4)} ETH`;
        } else {
            connectBtn.classList.remove('hidden');
            walletInfo.classList.add('hidden');
        }
    }

    /**
     * Load a tool
     */
    loadTool(toolId) {
        if (!web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }
        
        const ToolClass = this.tools.get(toolId);
        if (!ToolClass) {
            console.error(`Tool not found: ${toolId}`);
            return;
        }
        
        // Cleanup previous tool
        if (this.currentTool && this.currentTool.destroy) {
            this.currentTool.destroy();
        }
        
        // Show tool detail view
        document.querySelector('.tool-list').classList.add('hidden');
        document.getElementById('tool-detail').classList.remove('hidden');
        
        // Initialize tool
        const container = document.getElementById('tool-container');
        container.innerHTML = '';
        
        this.currentTool = new ToolClass();
        this.currentTool.init(container, web3Provider);
    }

    /**
     * Show tool list
     */
    showToolList() {
        if (this.currentTool && this.currentTool.destroy) {
            this.currentTool.destroy();
        }
        this.currentTool = null;
        
        document.querySelector('.tool-list').classList.remove('hidden');
        document.getElementById('tool-detail').classList.add('hidden');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
console.log('📦 Tools-main.js loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, initializing ToolsApp...');
        new ToolsApp();
    });
} else {
    console.log('✅ DOM already ready, initializing ToolsApp...');
    new ToolsApp();
}

