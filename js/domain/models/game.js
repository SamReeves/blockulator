/**
 * Game Base Class
 * Domain layer - abstract base for interactive games
 * Extends InteractiveContract with game-specific features
 * Injects game-specific UI components
 */

import { InteractiveContract } from './interactive-contract.js';
import { ValueInput } from '../../presentation/components/value-input.js';
import { AddressBadge } from '../../presentation/components/address-badge.js';

export class Game extends InteractiveContract {
    constructor() {
        super();
        
        // Inject game-specific components (available to all game subclasses)
        this.components = {
            ValueInput,
            AddressBadge
        };
    }
    /**
     * Hook: After initialization, setup game-specific features
     */
    async onAfterInit() {
        this.setupContractEvents();
        await this.refreshState();
    }

    /**
     * Abstract method: Setup contract event listeners
     * Games typically listen to blockchain events
     */
    setupContractEvents() {
        // Override in subclass to listen to contract events
    }

    /**
     * Abstract method: Refresh game state from contract
     * Should fetch and update all UI with current contract state
     */
    async refreshState() {
        throw new Error('Subclass must implement refreshState()');
    }

    /**
     * Helper: Get contract metadata for rendering
     * Returns standardized metadata object
     */
    getMetadata() {
        return {
            contractName: this.getContractName(),
            addressKey: this.getAddressKey(),
            sourceKey: this.getSourceKey(),
            abiKey: this.getAbiKey()
        };
    }
}

