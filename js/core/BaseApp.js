/**
 * BaseApp - Base class for application sub-apps
 * Provides common patterns for initialization, event handling, and lifecycle management
 */

import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';

export class BaseApp {
    /**
     * Create a new app instance
     * @param {Object} web3Provider - Web3 provider instance
     * @param {Object} walletComponent - Wallet UI component
     * @param {Object} toastComponent - Toast notification component
     */
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        
        this.initialized = false;
        this.eventListeners = [];
    }

    /**
     * Initialize the app
     * Template method - subclasses should override specific hooks
     */
    async init() {
        if (this.initialized) {
            await this.refresh();
            return;
        }

        try {
            this.renderHTML();
            await this.loadData();
            this.setupEventListeners();
            await this.onInit();
            
            this.initialized = true;
        } catch (error) {
            console.error(`[${this.constructor.name}] Initialization failed:`, error);
            this.toast('Failed to initialize view', 'error');
        }
    }

    /**
     * Render the app's HTML structure
     * Override in subclass
     */
    renderHTML() {
        // Override in subclass
    }

    /**
     * Load initial data (async)
     * Override in subclass
     */
    async loadData() {
        // Override in subclass
    }

    /**
     * Setup event listeners
     * Override in subclass, but call super.setupEventListeners() first
     */
    setupEventListeners() {
        // Listen for wallet connection changes
        this.registerEvent(EVENTS.WALLET_CONNECTED, () => this.onWalletConnected());
        this.registerEvent(EVENTS.WALLET_DISCONNECTED, () => this.onWalletDisconnected());
    }

    /**
     * Hook called after initialization completes
     * Override in subclass for additional setup
     */
    async onInit() {
        // Override in subclass
    }

    /**
     * Refresh the app state
     * Override in subclass
     */
    async refresh() {
        // Override in subclass
    }

    /**
     * Hook called when wallet connects
     * Override in subclass
     */
    onWalletConnected() {
        // Override in subclass
    }

    /**
     * Hook called when wallet disconnects
     * Override in subclass
     */
    onWalletDisconnected() {
        // Override in subclass
    }

    /**
     * Cleanup and destroy the app
     * Called when navigating away from this view
     */
    destroy() {
        this.eventListeners.forEach(({ event, handler }) => {
            eventBus.off(event, handler);
        });
        this.eventListeners = [];
        this.initialized = false;
    }

    /**
     * Register an event listener (for cleanup)
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    registerEvent(event, handler) {
        eventBus.on(event, handler);
        this.eventListeners.push({ event, handler });
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'info', 'success', 'warning', 'error'
     */
    toast(message, type = 'info') {
        eventBus.emit(EVENTS.TOAST, { message, type });
    }

    /**
     * Check if wallet is connected
     * @returns {boolean}
     */
    isWalletConnected() {
        return this.web3Provider?.isConnected() ?? false;
    }

    /**
     * Get current wallet address
     * @returns {string|null}
     */
    getCurrentAddress() {
        return this.web3Provider?.currentAddress ?? null;
    }

    /**
     * Set loading state on the view
     * @param {boolean} isLoading - Whether to show loading state
     * @param {string} containerId - ID of the container element
     * @param {string} loadingText - Text to show while loading
     */
    setLoadingState(containerId, isLoading, loadingText = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (isLoading) {
            container.innerHTML = `<div class="loading-state">${loadingText}</div>`;
        }
    }

    /**
     * Set error state on the view
     * @param {string} containerId - ID of the container element
     * @param {string} errorText - Error message to display
     */
    setErrorState(containerId, errorText = 'An error occurred') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `<div class="error-state">${errorText}</div>`;
    }
}
