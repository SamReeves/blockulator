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
        this.calculatorApp = null;
        this.discussionsApp = null;
        this.futuresApp = null;
        this.badgesModule = null;
        
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
        this.masterRouter.registerView('calculator', () => this.initCalculatorView());
        this.masterRouter.registerView('discussions', () => this.initDiscussionsView());
        this.masterRouter.registerView('factory', () => this.initFactoryView());
        this.masterRouter.registerView('badges', () => this.initBadgesView());
        this.masterRouter.registerView('about', () => this.initAboutView());
        
        // Register sub-route handlers
        this.masterRouter.registerSubRouteHandler('games', (subRoute) => {
            if (this.gamesApp) {
                this.gamesApp.handleSubRoute(subRoute);
            }
        });
        
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
    async initCalculatorView() {
        console.log('🧮 Initializing Calculator view...');
        
        if (!this.calculatorApp) {
            // Import and create calculator app
            const { CalculatorApp } = await import('./calculator-app.js');
            this.calculatorApp = new CalculatorApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.calculatorApp.init();
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
        
        // Load Chart.js before initializing factory (needed for distribution charts)
        await this.loadChartJs();
        
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

    /**
     * Initialize Badges view (lazy loaded)
     */
    async initBadgesView() {
        console.log('🎨 Initializing Badges view...');
        
        if (!this.badgesModule) {
            // Import BadgeManager
            const { BadgeManager } = await import('../domain/identity/badge-manager.js');
            this.badgesModule = new BadgeManager();
            
            // Initialize the module
            const container = document.getElementById('badges-view');
            if (container) {
                await this.badgesModule.init(container, this.web3Provider);
            } else {
                console.error('❌ Badges view container not found');
            }
        }
        
        console.log('✅ Badges view initialized');
    }

    /**
     * Initialize About view (static page, no lazy loading needed)
     */
    async initAboutView() {
        console.log('📖 About view accessed');
        // About page is static HTML, no initialization needed
    }

    /**
     * Lazy load Chart.js library
     * Only loaded when factory view is accessed (for distribution charts)
     */
    async loadChartJs() {
        // Check if already loaded
        if (window.Chart) {
            console.log('✅ Chart.js already loaded');
            return;
        }
        
        console.log('📊 Loading Chart.js library...');
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.async = true;
            
            script.onload = () => {
                const loadTime = (performance.now() - startTime).toFixed(2);
                console.log(`✅ Chart.js loaded in ${loadTime}ms`);
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Chart.js');
                reject(new Error('Failed to load Chart.js'));
            };
            
            document.head.appendChild(script);
        });
    }
}

