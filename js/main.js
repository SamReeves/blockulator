/**
 * Main App Entry Point
 * Handles initialization, routing, and UI coordination
 */

import { web3Provider } from './web3-provider.js';
import { eventBus, EVENTS } from './ui/events.js';
import { GameRenderer } from './ui/game-renderer.js';

// Import game modules
import { PissingContest } from './games/pissing-contest.js';
import { PayItForward } from './games/pay-it-forward.js';
import { PayItBackward } from './games/pay-it-backward.js';
import { MessageBoard } from './games/message-board.js';
import { KingOfTheHill } from './games/king-of-the-hill.js';

// Import tool modules
import { ECalculator } from './tools/e.js';
import { PiCalculator } from './tools/pi.js';
import { TauCalculator } from './tools/tau.js';

class App {
    constructor() {
        console.log('🚀 App constructor called');
        
        try {
            this.currentGame = null;
            this.currentTool = null;
            this.games = new Map([
                ['pissing-contest', PissingContest],
                ['pay-it-forward', PayItForward],
                ['pay-it-backward', PayItBackward],
                ['message-board', MessageBoard],
                ['king-of-the-hill', KingOfTheHill]
            ]);
            this.tools = new Map([
                ['e-calculator', ECalculator],
                ['pi-calculator', PiCalculator],
                ['tau-calculator', TauCalculator]
            ]);
            
            console.log('✅ Maps created successfully');
            
            this.init();
        } catch (error) {
            console.error('❌ Error in App constructor:', error);
            alert('Failed to initialize app: ' + error.message);
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
        
        console.log('🐋 WhaleGames initialized');
    }

    /**
     * Setup UI event listeners
     */
    setupUIListeners() {
        console.log('🔧 Setting up UI listeners...');
        
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        console.log('Connect button found:', !!connectBtn);
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                console.log('Connect wallet button clicked!');
                this.handleConnectWallet();
            });
        }
        
        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('Nav buttons found:', navButtons.length);
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Nav button clicked:', e.target.dataset.section);
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Game cards
        const gameCards = document.querySelectorAll('.game-card');
        console.log('Game cards found:', gameCards.length);
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const gameId = e.currentTarget.dataset.game;
                console.log('Game card clicked:', gameId);
                this.loadGame(gameId);
            });
        });
        
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
        
        // Back buttons
        const backToGames = document.getElementById('back-to-games');
        const backToTools = document.getElementById('back-to-tools');
        console.log('Back buttons found:', !!backToGames, !!backToTools);
        
        if (backToGames) {
            backToGames.addEventListener('click', () => {
                console.log('Back to games clicked');
                this.showGameList();
            });
        }
        
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
            // Enable game interactions
            console.log('Wallet connected, ready to play');
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
     * Switch between sections
     */
    switchSection(sectionName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });
        
        // Update sections - need to handle both active and hidden classes
        document.querySelectorAll('.section').forEach(section => {
            const isTarget = section.id === `${sectionName}-section`;
            if (isTarget) {
                section.classList.add('active');
                section.classList.remove('hidden');
            } else {
                section.classList.remove('active');
                section.classList.add('hidden');
            }
        });
        
        // Reset views
        if (sectionName === 'games') {
            this.showGameList();
        } else if (sectionName === 'tools') {
            this.showToolList();
        }
    }

    /**
     * Load a game
     */
    async loadGame(gameId) {
        if (!web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }
        
        // Extra check: ensure address is available
        if (!web3Provider.currentAddress) {
            console.warn('Wallet connected but address not available, retrying...');
            // Try to reconnect
            const success = await web3Provider.connect();
            if (!success || !web3Provider.currentAddress) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Please reconnect your wallet',
                    type: 'error'
                });
                return;
            }
        }
        
        console.log('🎮 Loading game:', gameId, 'for address:', web3Provider.currentAddress);
        
        const GameClass = this.games.get(gameId);
        if (!GameClass) {
            console.error(`Game not found: ${gameId}`);
            return;
        }
        
        // Cleanup previous game
        if (this.currentGame && this.currentGame.destroy) {
            this.currentGame.destroy();
        }
        
        // Show game detail view
        document.querySelector('.game-list').classList.add('hidden');
        document.getElementById('game-detail').classList.remove('hidden');
        
        // Initialize game
        const container = document.getElementById('game-container');
        container.innerHTML = '';
        
        this.currentGame = new GameClass();
        await this.currentGame.init(container, web3Provider);
        
        eventBus.emit(EVENTS.GAME_LOADED, { gameId });
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
     * Show game list
     */
    showGameList() {
        if (this.currentGame && this.currentGame.destroy) {
            this.currentGame.destroy();
        }
        this.currentGame = null;
        
        document.querySelector('.game-list').classList.remove('hidden');
        document.getElementById('game-detail').classList.add('hidden');
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
console.log('📦 Main.js loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, initializing App...');
        new App();
    });
} else {
    console.log('✅ DOM already ready, initializing App...');
    new App();
}

