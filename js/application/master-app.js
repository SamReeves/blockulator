/**
 * Master App Controller
 * Single entry point for the entire SPA
 * Initializes shared components and manages sub-apps
 */

import { web3Provider } from '../infrastructure/blockchain/web3-provider.js';
import { WalletConnectComponent, ToastComponent } from '../presentation/components/index.js';
import { initConfetti } from '../presentation/effects/confetti-animation.js';
import { MasterRouter } from './master-router.js';

export class MasterApp {
    constructor() {
        this.web3Provider = web3Provider;
        this.masterRouter = null;
        this.walletComponent = null;
        this.toastComponent = null;
        
        // Sub-apps (lazy loaded)
        this.gamesApp = null;
        this.toolsApp = null;
        this.discussionsApp = null;
        this.futuresApp = null;
        
        console.log('🐋 MasterApp created');
    }

    /**
     * Initialize the entire application
     */
    async init() {
        console.log('🐋 Initializing WhaleGames SPA...');
        
        try {
            // 1. Check for existing wallet connection
            await this.web3Provider.checkConnection();
            
            // 2. Initialize shared components (ONCE)
            this.initSharedComponents();
            
            // 3. Initialize master router
            this.masterRouter = new MasterRouter();
            
            // 4. Register view initializers
            this.registerViews();
            
            // 5. Start routing
            this.masterRouter.init();
            
            console.log('✅ WhaleGames SPA initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            throw error;
        }
    }

    /**
     * Initialize shared components that are used across all views
     */
    initSharedComponents() {
        console.log('🔧 Initializing shared components...');
        
        // Wallet component
        this.walletComponent = new WalletConnectComponent(this.web3Provider);
        this.walletComponent.render();
        
        // Toast notifications
        this.toastComponent = new ToastComponent();
        
        // Confetti effects
        initConfetti();
        
        console.log('✅ Shared components initialized');
    }

    /**
     * Register view initializers with the master router
     */
    registerViews() {
        console.log('📦 Registering views...');
        
        this.masterRouter.registerView('games', () => this.initGamesView());
        this.masterRouter.registerView('tools', () => this.initToolsView());
        this.masterRouter.registerView('discussions', () => this.initDiscussionsView());
        this.masterRouter.registerView('factory', () => this.initFactoryView());
        
        console.log('✅ All views registered');
    }

    /**
     * Initialize Games view (lazy loaded)
     */
    async initGamesView() {
        console.log('🎮 Initializing Games view...');
        
        if (!this.gamesApp) {
            // Import and create games app
            const { GamesApp } = await import('./games-app.js');
            this.gamesApp = new GamesApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.gamesApp.init();
        }
        
        console.log('✅ Games view initialized');
    }

    /**
     * Initialize Calculator view (lazy loaded)
     */
    async initToolsView() {
        console.log('🧮 Initializing Calculator view...');
        
        if (!this.toolsApp) {
            // Import and create tools app
            const { ToolsApp } = await import('./tools-app.js');
            this.toolsApp = new ToolsApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.toolsApp.init();
        }
        
        console.log('✅ Calculator view initialized');
    }

    /**
     * Initialize Discussions view (lazy loaded)
     */
    async initDiscussionsView() {
        console.log('💬 Initializing Discussions view...');
        
        if (!this.discussionsApp) {
            // Import and create discussions app
            const { DiscussionsApp } = await import('../discussions-app.js');
            this.discussionsApp = new DiscussionsApp();
            
            // Don't re-initialize shared components, but do initialize view-specific things
            await this.discussionsApp.initViewOnly();
        } else {
            // Refresh data if already loaded
            await this.discussionsApp.refresh();
        }
        
        console.log('✅ Discussions view initialized');
    }

    /**
     * Initialize Factory view (lazy loaded)
     */
    async initFactoryView() {
        console.log('🏭 Initializing Factory view...');
        
        if (!this.futuresApp) {
            // Import and create futures app
            const { FuturesApp } = await import('../futures-app.js');
            this.futuresApp = new FuturesApp();
            
            // Don't re-initialize shared components, but do initialize view-specific things
            await this.futuresApp.initViewOnly();
        } else {
            // Refresh data if already loaded
            await this.futuresApp.refresh();
        }
        
        console.log('✅ Factory view initialized');
    }
}

