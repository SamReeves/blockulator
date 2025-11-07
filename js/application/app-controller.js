/**
 * Application Controller
 * Application layer - main application coordinator
 * Orchestrates infrastructure, domain, and presentation layers
 */

import { web3Provider } from '../infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';
import { initConfetti } from '../presentation/effects/confetti-animation.js';
import { WalletConnectComponent, ToastComponent } from '../presentation/components/index.js';
import { ModuleRegistry } from './module-registry.js';
import { Router } from './router.js';

export class AppController {
    constructor() {
        console.log('🚀 AppController initializing...');
        
        this.web3Provider = web3Provider;
        this.moduleRegistry = new ModuleRegistry();
        this.router = null;
        this.walletComponent = null;
        this.toastComponent = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        // Check for existing wallet connection FIRST (before rendering UI)
        await this.web3Provider.checkConnection();
        
        // Initialize components
        this.walletComponent = new WalletConnectComponent(this.web3Provider);
        this.walletComponent.render();
        
        this.toastComponent = new ToastComponent();
        
        // Initialize effects
        initConfetti();
        
        // Initialize router
        this.router = new Router(this.moduleRegistry, this.web3Provider);
        this.router.init();
        
        // Setup joy button
        this.setupJoyButton();
        
        console.log('✅ Application initialized');
    }

    /**
     * Setup the joy button to trigger confetti
     */
    setupJoyButton() {
        const joyButton = document.getElementById('joy-button');
        if (joyButton) {
            joyButton.addEventListener('click', () => {
                eventBus.emit(EVENTS.CONFETTI);
            });
            console.log('✨ Joy button ready');
        }
    }

    /**
     * Register a module
     */
    registerModule(name, ModuleClass, category) {
        this.moduleRegistry.register(name, ModuleClass, category);
    }

    /**
     * NOTE: Wallet and Toast functionality now handled by components!
     * - WalletConnectComponent handles wallet UI and events
     * - ToastComponent handles toast notifications
     * 
     * This eliminates ~100 lines of duplicate code from the controller.
     */
}

