/**
 * Unified App Entry Point
 * Single implementation for both games and tools pages
 * Automatically detects page type and configures accordingly
 */

import { web3Provider } from './web3-provider.js';
import { eventBus, EVENTS } from './ui/events.js';
import { initConfetti } from './ui/confetti-animation.js';

// Import game modules
import { PissingContest } from './games/pissing-contest.js';
import { PayItForward } from './games/pay-it-forward.js';
import { PayItBackward } from './games/pay-it-backward.js';
import { MessageBoard } from './games/message-board.js';
import { KingOfTheHill } from './games/king-of-the-hill.js';
import { LastCall } from './games/last-call.js';
import { TimeToMakeTheDonuts } from './games/time-to-make-the-donuts.js';
import { DiceGods } from './games/dice-gods.js';

// Import tool modules
import { ECalculator } from './tools/e.js';
import { PiCalculator } from './tools/pi.js';
import { TauCalculator } from './tools/tau.js';
import { SinCalculator } from './tools/sin.js';
import { CosCalculator } from './tools/cos.js';
import { TanhCalculator } from './tools/tanh.js';
import { Pow10Calculator } from './tools/pow10.js';
import { Pow2Calculator } from './tools/pow2.js';
import { LnCalculator } from './tools/ln.js';
import { Log2Calculator } from './tools/log2.js';
import { Log10Calculator } from './tools/log10.js';

class UnifiedApp {
    constructor() {
        console.log('🚀 UnifiedApp initializing...');
        
        // Detect page type by checking which container exists
        const isGamePage = !!document.getElementById('game-container');
        const isToolPage = !!document.getElementById('tool-container');
        
        if (isGamePage) {
            this.setupGamePage();
        } else if (isToolPage) {
            this.setupToolPage();
        } else {
            console.error('Unable to detect page type');
            return;
        }
        
        this.currentModule = null;
        this.init();
    }

    /**
     * Configure for games page
     */
    setupGamePage() {
        this.pageType = 'game';
        this.modules = new Map([
            ['pissing-contest', PissingContest],
            ['pay-it-forward', PayItForward],
            ['pay-it-backward', PayItBackward],
            ['message-board', MessageBoard],
            ['king-of-the-hill', KingOfTheHill],
            ['last-call', LastCall],
            ['time-to-make-the-donuts', TimeToMakeTheDonuts],
            ['dice-gods', DiceGods]
        ]);
        this.config = {
            listSelector: '.game-list',
            detailSelector: '#game-detail',
            containerSelector: '#game-container',
            backButtonId: 'back-to-games',
            cardSelector: '.game-card',
            dataAttr: 'game'
        };
        console.log('📦 Configured as games page');
    }

    /**
     * Configure for tools page
     */
    setupToolPage() {
        this.pageType = 'tool';
        this.modules = new Map([
            ['e-calculator', ECalculator],
            ['pi-calculator', PiCalculator],
            ['tau-calculator', TauCalculator],
            ['sin-calculator', SinCalculator],
            ['cos-calculator', CosCalculator],
            ['tanh-calculator', TanhCalculator],
            ['pow10-calculator', Pow10Calculator],
            ['pow2-calculator', Pow2Calculator],
            ['ln-calculator', LnCalculator],
            ['log2-calculator', Log2Calculator],
            ['log10-calculator', Log10Calculator]
        ]);
        this.config = {
            listSelector: '.tool-list',
            detailSelector: '#tool-detail',
            containerSelector: '#tool-container',
            backButtonId: 'back-to-tools',
            cardSelector: '.tool-card',
            dataAttr: 'tool'
        };
        console.log('🔧 Configured as tools page');
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupUIListeners();
        this.setupWalletListeners();
        this.setupToastSystem();
        this.setupCanvas();
        
        console.log(`✅ ${this.pageType} app initialized`);
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
                console.log('🔘 Connect wallet button clicked!');
                this.handleConnectWallet();
            });
        }

        // Module cards (games or tools)
        const cards = document.querySelectorAll(this.config.cardSelector);
        console.log(`Found ${cards.length} ${this.pageType} cards`);
        
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const moduleId = e.currentTarget.dataset[this.config.dataAttr];
                console.log(`${this.pageType} card clicked:`, moduleId);
                this.loadModule(moduleId);
            });
        });

        // Back button
        const backBtn = document.getElementById(this.config.backButtonId);
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('Back button clicked');
                this.showModuleList();
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
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        eventBus.on(EVENTS.WALLET_CONNECTED, async (data) => {
            await this.updateWalletUI(data.address);
            // Refresh current module to show user-specific data
            await this.refreshCurrentModule();
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, async () => {
            await this.updateWalletUI(null);
            // Refresh to show read-only state
            await this.refreshCurrentModule();
        });

        eventBus.on(EVENTS.WALLET_CHANGED, async (data) => {
            await this.updateWalletUI(data.address);
            // Refresh with new wallet address
            await this.refreshCurrentModule();
        });
    }

    /**
     * Refresh the currently loaded module (game or tool)
     * Called when wallet connection state changes
     */
    async refreshCurrentModule() {
        if (!this.currentModule) return;
        
        console.log('🔄 Refreshing current module after wallet state change...');
        
        // Reconnect contract with new signer (if wallet connected)
        if (this.currentModule.contract && web3Provider.getSigner()) {
            console.log('🔗 Reconnecting contract with signer...');
            this.currentModule.contract = this.currentModule.contract.connect(web3Provider.getSigner());
        }
        
        // Check if module has a refresh method
        if (typeof this.currentModule.refreshState === 'function') {
            try {
                await this.currentModule.refreshState();
                console.log('✅ Module refreshed successfully');
            } catch (error) {
                console.error('Failed to refresh module:', error);
            }
        } else if (typeof this.currentModule.loadState === 'function') {
            // Some modules use loadState instead
            try {
                await this.currentModule.loadState();
                console.log('✅ Module refreshed successfully');
            } catch (error) {
                console.error('Failed to refresh module:', error);
            }
        }
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
    }

    /**
     * Handle wallet connection
     */
    async handleConnectWallet() {
        console.log('🔌 handleConnectWallet called');
        console.log('web3Provider:', web3Provider);
        const success = await web3Provider.connect();
        console.log('Connection result:', success);
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
     * Load a module (game or tool)
     * Now works in both read-only mode and connected mode
     */
    async loadModule(moduleId) {
        // No longer blocks on wallet connection!
        // Modules can load in read-only mode to view state
        
        const mode = web3Provider.isConnected() ? 'connected' : 'read-only';
        console.log(`🎮 Loading ${this.pageType}:`, moduleId, `(${mode} mode)`);
        
        if (!web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: '👀 Viewing in read-only mode. Connect wallet to participate!',
                type: 'info'
            });
        }

        const ModuleClass = this.modules.get(moduleId);
        if (!ModuleClass) {
            console.error(`${this.pageType} not found:`, moduleId);
            return;
        }

        // Cleanup previous module
        if (this.currentModule && this.currentModule.destroy) {
            this.currentModule.destroy();
        }

        // Show detail view
        const listEl = document.querySelector(this.config.listSelector);
        const detailEl = document.querySelector(this.config.detailSelector);
        
        if (listEl) listEl.classList.add('hidden');
        if (detailEl) detailEl.classList.remove('hidden');

        // Initialize module
        const container = document.querySelector(this.config.containerSelector);
        if (container) {
            container.innerHTML = '';
            this.currentModule = new ModuleClass();
            await this.currentModule.init(container, web3Provider);
            
            eventBus.emit(EVENTS.GAME_LOADED, { [this.config.dataAttr]: moduleId });
        }
    }

    /**
     * Show module list (go back)
     */
    showModuleList() {
        if (this.currentModule && this.currentModule.destroy) {
            this.currentModule.destroy();
        }
        this.currentModule = null;

        const listEl = document.querySelector(this.config.listSelector);
        const detailEl = document.querySelector(this.config.detailSelector);
        
        if (listEl) listEl.classList.remove('hidden');
        if (detailEl) detailEl.classList.add('hidden');
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
console.log('📦 unified-app.js loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, initializing UnifiedApp...');
        new UnifiedApp();
    });
} else {
    console.log('✅ DOM already ready, initializing UnifiedApp...');
    new UnifiedApp();
}

