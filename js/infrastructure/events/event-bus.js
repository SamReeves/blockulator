/**
 * Central Event Bus
 * Infrastructure layer - provides event-driven communication
 * Allows loose coupling between layers
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName 
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(eventName);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Emit an event
     * @param {string} eventName 
     * @param {*} data 
     */
    emit(eventName, data) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Subscribe to an event once
     * @param {string} eventName 
     * @param {Function} callback 
     */
    once(eventName, callback) {
        const unsubscribe = this.on(eventName, (data) => {
            unsubscribe();
            callback(data);
        });
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName 
     */
    off(eventName) {
        this.listeners.delete(eventName);
    }

    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
    }
}

// Global event bus instance
export const eventBus = new EventBus();

// Common events
export const EVENTS = {
    // Network events
    NETWORK_CHANGED: 'network:changed',
    
    // Wallet events
    WALLET_CONNECTED: 'wallet:connected',
    WALLET_DISCONNECTED: 'wallet:disconnected',
    WALLET_CHANGED: 'wallet:changed',
    
    // Game events
    GAME_LOADED: 'game:loaded',
    PLAY_SUBMITTED: 'play:submitted',
    PLAY_CONFIRMED: 'play:confirmed',
    PLAY_FAILED: 'play:failed',
    WINNER_DETERMINED: 'winner:determined',
    
    // Animation triggers
    WHALE_APPEARS: 'animation:whale',
    CONFETTI: 'animation:confetti',
    SPLASH: 'animation:splash',
    
    // UI events
    TOAST: 'ui:toast',
    LOADING: 'ui:loading'
};

