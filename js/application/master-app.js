/**
 * Master App Controller
 * Single entry point for the entire SPA
 * Initializes shared components and manages sub-apps
 */

import { web3Provider } from '../infrastructure/blockchain/web3-provider.js';
import { WalletConnectComponent, ToastComponent } from '../presentation/components/index.js';
import { initConfetti } from '../presentation/effects/confetti-animation.js';
import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';
import { MasterRouter } from './master-router.js';

export class MasterApp {
    constructor() {
        this.web3Provider = web3Provider;
        this.masterRouter = null;
        this.walletComponent = null;
        this.toastComponent = null;
        
        // Sub-apps (lazy loaded)
        this.gamesApp = null;
        this.vyperApp = null;
        this.fp128App = null;
        this.benchmarkApp = null;
        this.futuresApp = null;
        this.badgesModule = null;
        
        console.log('MasterApp created');
    }

    /**
     * SUB-APP CONTRACT
     * 
     * All sub-apps (games, calculator, arithmetic, futures, badges) follow a consistent pattern:
     * 
     * Constructor signature:
     *   new SubApp(web3Provider, walletComponent, toastComponent)
     * 
     * Public methods:
     *   async init()     - Initialize the sub-app (called once when view first loads)
     *   async refresh()  - Optional: refresh data when returning to view
     * 
     * Sub-apps receive shared components (wallet, toast) instead of creating their own.
     * Shared components (wallet, toast, confetti) are initialized once in MasterApp.
     * 
     * Note: BadgeManager uses a different API by design: init(container, web3Provider)
     */

    /**
     * Initialize the entire application
     */
    async init() {
        console.log('Initializing Blockulator SPA...');
        
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
            
            console.log('✅ Blockulator SPA initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            eventBus.emit(EVENTS.APP_ERROR, {
                message: 'Failed to initialize application. Please refresh the page.'
            });
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
        
        // App-level error handling
        this.initErrorHandling();
        
        console.log('✅ Shared components initialized');
    }

    /**
     * Initialize app-level error handling
     * Subscribes to APP_ERROR events and manages the global error banner
     */
    initErrorHandling() {
        const errorBanner = document.getElementById('app-error');
        const errorMessage = document.getElementById('app-error-message');
        const dismissBtn = document.getElementById('app-error-dismiss');
        
        if (!errorBanner || !errorMessage || !dismissBtn) {
            console.warn('⚠️ App error banner elements not found');
            return;
        }
        
        // Show error banner
        eventBus.on(EVENTS.APP_ERROR, ({ message }) => {
            errorMessage.textContent = message;
            errorBanner.classList.remove('hidden');
        });
        
        // Clear error banner
        eventBus.on(EVENTS.APP_ERROR_CLEAR, () => {
            errorBanner.classList.add('hidden');
            errorMessage.textContent = '';
        });
        
        // Dismiss button
        dismissBtn.addEventListener('click', () => {
            eventBus.emit(EVENTS.APP_ERROR_CLEAR);
        });
    }

    /**
     * Register view initializers with the master router
     */
    registerViews() {
        console.log('📦 Registering views...');
        
        this.masterRouter.registerView('games', () => this.initGamesView());
        this.masterRouter.registerView('vyper', () => this.initVyperView());
        this.masterRouter.registerView('fp128', () => this.initFp128View());
        this.masterRouter.registerView('benchmarks', () => this.initBenchmarksView());
        this.masterRouter.registerView('futures', () => this.initFuturesView());
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
     * Initialize Vyper view (lazy loaded)
     */
    async initVyperView() {
        console.log('🧮 Initializing Vyper view...');
        
        if (!this.vyperApp) {
            // Import and create vyper app
            const { CalculatorApp } = await import('./calculator-app.js');
            this.vyperApp = new CalculatorApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.vyperApp.init();
        }
        
        console.log('✅ Vyper view initialized');
    }

    /**
     * Initialize FP128 view (lazy loaded)
     */
    async initFp128View() {
        console.log('🔢 Initializing FP128 view...');
        
        if (!this.fp128App) {
            // Import and create fp128 app
            const { ArithmeticApp } = await import('./arithmetic-app.js');
            this.fp128App = new ArithmeticApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.fp128App.init();
        }
        
        console.log('✅ FP128 view initialized');
    }

    /**
     * Initialize Benchmarks view (lazy loaded)
     */
    async initBenchmarksView() {
        console.log('📊 Initializing Benchmarks view...');
        
        // Load Chart.js before initializing benchmarks (needed for charts)
        await this.loadChartJs();
        
        if (!this.benchmarkApp) {
            // Import and create benchmark app
            const { BenchmarkApp } = await import('./benchmark-app.js');
            this.benchmarkApp = new BenchmarkApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.benchmarkApp.init();
        }
        
        console.log('✅ Benchmarks view initialized');
    }

    /**
     * Initialize Futures view (lazy loaded)
     */
    async initFuturesView() {
        console.log('📈 Initializing Futures view...');
        
        // Load Chart.js before initializing futures (needed for distribution charts)
        await this.loadChartJs();
        
        if (!this.futuresApp) {
            // Import and create futures app with shared dependencies
            const { FuturesApp } = await import('./futures-app.js');
            this.futuresApp = new FuturesApp(this.web3Provider, this.walletComponent, this.toastComponent);
            await this.futuresApp.init();
        } else {
            // Refresh data if already loaded
            await this.futuresApp.refresh();
        }
        
        console.log('✅ Futures view initialized');
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
     * Only loaded when futures view is accessed (for distribution charts)
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

