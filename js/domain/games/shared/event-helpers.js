/**
 * Event Helpers
 * Shared event handling utilities for game components
 */

import { eventBus, EVENTS } from '../../../infrastructure/events/event-bus.js';

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'info', 'success', 'warning', 'error'
 */
export function toast(message, type = 'info') {
    eventBus.emit(EVENTS.TOAST, { message, type });
}

/**
 * Trigger confetti celebration
 */
export function celebrate() {
    eventBus.emit(EVENTS.CONFETTI);
}

/**
 * Show success toast with confetti
 * @param {string} message - Success message
 */
export function celebrateWithMessage(message) {
    toast(message, 'success');
    celebrate();
}

/**
 * Handle a user event with appropriate feedback
 * @param {boolean} isCurrentUser - Whether the event involves the current user
 * @param {string} userMessage - Message for current user
 * @param {string} otherMessage - Message for other users
 * @param {string} userType - Toast type for current user (default 'success')
 * @param {string} otherType - Toast type for others (default 'info')
 */
export function handleUserEvent(isCurrentUser, userMessage, otherMessage, userType = 'success', otherType = 'info') {
    if (isCurrentUser) {
        toast(userMessage, userType);
    } else if (otherMessage) {
        toast(otherMessage, otherType);
    }
}

/**
 * Create a standardized contract event handler
 * @param {Object} options - Handler options
 * @param {Function} options.refreshState - Function to refresh game state
 * @param {Function} options.isCurrentUser - Function to check if address is current user
 * @param {Function} options.onUserEvent - Callback when current user is involved
 * @param {Function} options.onOtherEvent - Callback when another user is involved
 * @returns {Function} Event handler function
 */
export function createEventHandler({ refreshState, isCurrentUser, onUserEvent, onOtherEvent }) {
    return async (...args) => {
        await refreshState();
        
        const address = args[0];
        
        if (isCurrentUser && isCurrentUser(address)) {
            if (onUserEvent) onUserEvent(...args);
        } else {
            if (onOtherEvent) onOtherEvent(...args);
        }
    };
}
