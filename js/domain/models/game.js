/**
 * Game Base Class
 * Domain layer - abstract base for interactive games
 * Extends InteractiveContract with game-specific features
 * Provides helper methods for common patterns across all games
 */

import { InteractiveContract } from './interactive-contract.js';
import { ValueInput } from '../../presentation/components/value-input.js';
import { AddressBadge } from '../../presentation/components/address-badge.js';
import { getCurrentNetwork } from '../../infrastructure/config/network.js';
import { ADDRESS_ZERO } from '../../shared/constants.js';

export class Game extends InteractiveContract {
    static ADDRESS_ZERO = ADDRESS_ZERO;
    
    constructor() {
        super();
        
        this.components = {
            ValueInput,
            AddressBadge
        };
    }
    
    /**
     * Check if an address is the zero address
     */
    isZeroAddress(address) {
        return !address || address === ADDRESS_ZERO;
    }

    /**
     * Return the contract name from static metadata
     */
    getContractName() {
        return this.constructor.metadata.id;
    }

    /**
     * Hook: After initialization, setup game-specific features
     */
    async onAfterInit() {
        this.setupContractEvents();
        await this.refreshState();
    }

    /**
     * Template method: Render the game UI
     * Subclasses should implement getGameHTML() and initComponents()
     */
    render() {
        this.container.innerHTML = '';
        
        const network = getCurrentNetwork();
        const headerConfig = {
            ...this.metadata,
            contractAddress: this.metadata.contract?.addresses?.[network],
            sourceFile: this.metadata.contract?.source,
            abiFile: this.metadata.contract?.abi
        };
        const header = this.renderer.createGameHeader(headerConfig);
        
        const gameContent = document.createElement('div');
        gameContent.className = 'game-interface';
        gameContent.appendChild(header);
        
        const contentInner = document.createElement('div');
        contentInner.innerHTML = this.getGameHTML();
        gameContent.appendChild(contentInner);
        
        this.container.appendChild(gameContent);
        
        this.initComponents();
        this.bindListeners();
    }

    /**
     * Abstract: Return the inner HTML for the game UI
     * Must be implemented by subclasses
     */
    getGameHTML() {
        throw new Error('Subclass must implement getGameHTML()');
    }

    /**
     * Hook: Initialize UI components (ValueInput, custom components, etc.)
     * Override in subclass
     */
    initComponents() {
        // Override in subclass
    }

    /**
     * Hook: Return a map of element IDs to event handlers
     * Override in subclass to define click handlers
     */
    getListeners() {
        return {};
    }

    /**
     * Bind click listeners from getListeners() map
     */
    bindListeners() {
        const listeners = this.getListeners();
        for (const [elementId, handler] of Object.entries(listeners)) {
            const el = document.getElementById(elementId);
            if (el) {
                el.addEventListener('click', handler);
            }
        }
    }

    /**
     * Setup contract event listeners
     * Override in subclass to listen to blockchain events
     */
    setupContractEvents() {
        // Override in subclass
    }

    /**
     * Template method: Refresh game state with error handling
     * Subclasses implement fetchAndRenderState() instead
     */
    async refreshState() {
        if (!this.contract) return;
        try {
            await this.fetchAndRenderState();
        } catch (error) {
            console.error(`[${this.getContractName()}] Failed to refresh state:`, error);
            this.toast('Failed to load game state', 'error');
        }
    }

    /**
     * Abstract: Fetch state from contract and update UI
     * Implement game-specific logic here without try/catch
     */
    async fetchAndRenderState() {
        throw new Error('Subclass must implement fetchAndRenderState()');
    }

    /**
     * Check if an address belongs to the current connected user
     */
    isCurrentUser(address) {
        return this.web3Provider.isConnected() &&
               this.web3Provider.currentAddress &&
               address.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
    }

    /**
     * Emit a toast notification
     */
    toast(message, type = 'info') {
        this.events.bus.emit(this.events.EVENTS.TOAST, { message, type });
    }

    /**
     * Emit success toast with confetti celebration
     */
    celebrate(message) {
        this.toast(message, 'success');
        this.events.bus.emit(this.events.EVENTS.CONFETTI);
    }

    /**
     * Create a standard donation/payment input component
     */
    createValueInput(containerId, overrides = {}) {
        const input = new this.components.ValueInput(containerId, {
            label: 'Donation Amount',
            hint: 'Enter amount',
            defaultUnit: 'gwei',
            minWei: '1',
            required: true,
            ...overrides
        });
        input.render();
        return input;
    }

    /**
     * Set button loading/ready state
     */
    setButtonState(buttonId, isLoading, loadingText = '⏳ Processing...', defaultText = '💰 Donate') {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = isLoading;
            btn.textContent = isLoading ? loadingText : defaultText;
        }
    }

    /**
     * Execute a blockchain transaction with standard validation and state management
     */
    async executeTransaction({
        inputComponent,
        contractCall,
        buttonId,
        buttonLoadingText = '⏳ Processing...',
        buttonDefaultText = '💰 Submit',
        validationMessage = 'Please enter a valid amount',
        walletAction = 'play',
        extraValidation = null,
        onSuccess = null
    }) {
        if (!this.requiresWallet(walletAction)) return;
        
        const weiAmount = inputComponent.getWeiValue();
        
        if (!weiAmount || weiAmount.lte(0)) {
            this.toast(validationMessage, 'warning');
            return;
        }
        
        if (extraValidation && !(await extraValidation(weiAmount))) {
            return;
        }
        
        try {
            await this.transactionHandler.execute(
                contractCall(weiAmount),
                { game: this.getContractName(), wei: weiAmount.toString() },
                (isLoading) => this.setButtonState(buttonId, isLoading, buttonLoadingText, buttonDefaultText)
            );
            
            inputComponent.reset();
            if (onSuccess) await onSuccess();
            await this.refreshState();
            
        } catch (error) {
            console.error(`[${this.getContractName()}] Transaction failed:`, error);
        }
    }
}

