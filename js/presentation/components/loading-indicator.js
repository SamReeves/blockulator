/**
 * Loading Indicator Component
 * Presentation layer - reusable loading states
 */

export class LoadingIndicator {
    /**
     * Set loading state on a button
     */
    static setButtonLoading(buttonId, isLoading, loadingText = '⏳ Processing...', defaultText = '🎮 Play') {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || defaultText;
        }
    }

    /**
     * Create a loading spinner element
     */
    static createSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        return spinner;
    }

    /**
     * Show loading overlay
     */
    static showOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                ${this.createSpinner().outerHTML}
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * Hide loading overlay
     */
    static hideOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

