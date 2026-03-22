/**
 * Interactive Contract Base Class
 * Domain layer - abstract base for all contract interactions
 * Implements template method pattern for consistent contract-based modules
 * Provides dependency injection and unified metadata access
 */

import { ContractLoader } from '../../infrastructure/blockchain/contract-loader.js';
import { getContractMetadata, hasContract } from '../../infrastructure/config/contract-registry.js';
import { BlockchainMath } from '../../infrastructure/utils/blockchain-math.js';
import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { TransactionHandler } from '../../infrastructure/blockchain/transaction-handler.js';
import { DOMHelpers } from '../../presentation/dom/dom-helpers.js';
import { GameRenderer } from '../../presentation/renderers/game-renderer.js';

export class InteractiveContract {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.metadata = this.constructor.metadata || null;
        
        // Dependency injection - all subclasses get these utilities
        this.math = BlockchainMath;
        this.events = { bus: eventBus, EVENTS };
        this.transactionHandler = TransactionHandler;
        this.dom = DOMHelpers;
        this.renderer = GameRenderer;
    }

    /**
     * Initialize the module - template method
     * Subclasses can override onBeforeInit() and onAfterInit()
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // For non-game contracts (calculators, badges) without static metadata
        if (!this.metadata) {
            const contractName = this.getContractName();
            if (hasContract(contractName)) {
                this.metadata = getContractMetadata(contractName);
            }
        }
        
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
     * Hook: Setup DOM event listeners
     * Override in subclass if needed
     * Game subclasses use getListeners() + bindListeners() instead
     */
    setupListeners() {
        // No-op by default
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

    /**
     * Execute operation with button state management
     * Automatically handles disabled state and loading text
     * 
     * @param {string} buttonId - Button element ID
     * @param {Function} operation - Async operation to execute
     * @param {Object} states - Optional custom button states
     * @returns {Promise} Result of operation
     */
    async withButtonState(buttonId, operation, states = {}) {
        const button = document.getElementById(buttonId);
        if (!button) return await operation();
        
        const originalText = button.textContent;
        const originalDisabled = button.disabled;
        
        button.disabled = true;
        button.textContent = states.loading || 'Processing...';
        
        try {
            return await operation();
        } finally {
            button.disabled = originalDisabled;
            button.textContent = originalText;
        }
    }
}

