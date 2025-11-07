/**
 * Game Base Class
 * Domain layer - abstract base for interactive games
 * Extends InteractiveContract with game-specific features
 */

import { InteractiveContract } from './interactive-contract.js';

export class Game extends InteractiveContract {
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
        console.log('No contract events configured for this game');
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

    /**
     * Convert contract name to SCREAMING_SNAKE_CASE for lookups
     */
    getAddressKey() {
        return this.getContractName().toUpperCase().replace(/-/g, '_');
    }

    /**
     * Get source file key (same as address key)
     */
    getSourceKey() {
        return this.getAddressKey();
    }

    /**
     * Get ABI file key (same as address key)
     */
    getAbiKey() {
        return this.getAddressKey();
    }
}

