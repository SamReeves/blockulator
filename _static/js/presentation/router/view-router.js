/**
 * View Router
 * Manages navigation between Board View (Level 1) and Discussion View (Level 2)
 * Pure state machine implementation
 */

export const ViewState = {
    BOARD_VIEW: 'BOARD_VIEW',
    DISCUSSION_VIEW: 'DISCUSSION_VIEW'
};

export class ViewRouter {
    constructor() {
        this.currentState = ViewState.BOARD_VIEW;
        this.selectedDiscussion = null;
        this.listeners = [];
        this.stateHistory = [];
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Called with (newState, data)
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        const data = {
            state: this.currentState,
            discussion: this.selectedDiscussion
        };
        this.listeners.forEach(callback => callback(data));
    }

    /**
     * Navigate to board view (Level 1)
     */
    navigateToBoard() {
        if (this.currentState !== ViewState.BOARD_VIEW) {
            this.stateHistory.push(this.currentState);
            this.currentState = ViewState.BOARD_VIEW;
            this.selectedDiscussion = null;
            this.notifyListeners();
            console.log('📍 Navigated to: BOARD_VIEW');
        }
    }

    /**
     * Navigate to discussion view (Level 2)
     * @param {Object} discussion - Discussion data object
     */
    navigateToDiscussion(discussion) {
        if (!discussion || !discussion.address) {
            console.error('Invalid discussion object');
            return;
        }

        this.stateHistory.push(this.currentState);
        this.currentState = ViewState.DISCUSSION_VIEW;
        this.selectedDiscussion = discussion;
        this.notifyListeners();
        console.log('📍 Navigated to: DISCUSSION_VIEW', discussion.address);
    }

    /**
     * Navigate back to previous view
     */
    goBack() {
        if (this.stateHistory.length > 0) {
            const previousState = this.stateHistory.pop();
            this.currentState = previousState;
            
            if (previousState === ViewState.BOARD_VIEW) {
                this.selectedDiscussion = null;
            }
            
            this.notifyListeners();
            console.log('📍 Navigated back to:', this.currentState);
        } else {
            // Default to board view
            this.navigateToBoard();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.currentState,
            discussion: this.selectedDiscussion
        };
    }

    /**
     * Check if currently viewing board
     */
    isViewingBoard() {
        return this.currentState === ViewState.BOARD_VIEW;
    }

    /**
     * Check if currently viewing a discussion
     */
    isViewingDiscussion() {
        return this.currentState === ViewState.DISCUSSION_VIEW;
    }

    /**
     * Refresh current view (useful after transactions)
     */
    refresh() {
        this.notifyListeners();
        console.log('🔄 Refreshing current view:', this.currentState);
    }
}

