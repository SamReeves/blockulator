/**
 * Interactive Contract Base Class
 * Domain layer - abstract base for all contract interactions
 * Implements template method pattern for consistent contract-based modules
 */

import { ContractLoader } from '../../infrastructure/blockchain/contract-loader.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class InteractiveContract {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
    }

    /**
     * Initialize the module - template method
     * Subclasses can override onBeforeInit() and onAfterInit()
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        await this.onBeforeInit();
        
        // Load contract using infrastructure layer
        this.contract = await ContractLoader.load(this.getContractName(), web3Provider);
        if (!this.contract) return;
        
        // Execute subclass-specific initialization sequence
        this.render();
        this.setupListeners();
        await this.onAfterInit();
    }

    /**
     * Hook: Called before contract loading
     * Override to perform pre-initialization logic
     */
    async onBeforeInit() {}

    /**
     * Hook: Called after contract loaded and rendered
     * Override to perform post-initialization logic
     */
    async onAfterInit() {}

    /**
     * Abstract method: Get contract name for loading
     * Must return kebab-case name (e.g., 'pissing-contest')
     */
    getContractName() {
        throw new Error('Subclass must implement getContractName()');
    }

    /**
     * Abstract method: Render the UI
     * Subclasses must implement their specific UI
     */
    render() {
        throw new Error('Subclass must implement render()');
    }

    /**
     * Abstract method: Setup event listeners
     * Subclasses must implement their specific listeners
     */
    setupListeners() {
        throw new Error('Subclass must implement setupListeners()');
    }

    /**
     * Cleanup - can be overridden
     */
    destroy() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Check if wallet is connected
     */
    requiresWallet(action = 'perform this action') {
        if (!this.web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: `🔐 Please connect your wallet to ${action}`,
                type: 'warning'
            });
            return false;
        }
        return true;
    }
}

