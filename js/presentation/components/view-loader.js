/**
 * View Loader Component
 * Shows loading state during dynamic imports
 * Provides visual feedback when modules are being loaded
 */

export class ViewLoader {
    /**
     * Show a loading indicator in a container
     * @param {HTMLElement} container - Container to show loader in
     * @param {string} message - Optional loading message
     * @returns {HTMLElement} The loader element (for later removal)
     */
    static show(container, message = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'view-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p class="loader-message">${message}</p>
        `;
        container.appendChild(loader);
        return loader;
    }
    
    /**
     * Hide and remove a loader element
     * @param {HTMLElement} loader - The loader element to remove
     */
    static hide(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }
    
    /**
     * Show loader with automatic removal after promise resolves
     * @param {HTMLElement} container - Container to show loader in
     * @param {Promise} promise - Promise to wait for
     * @param {string} message - Optional loading message
     * @returns {Promise} The original promise
     */
    static async showDuring(container, promise, message = 'Loading...') {
        const loader = ViewLoader.show(container, message);
        
        try {
            const result = await promise;
            ViewLoader.hide(loader);
            return result;
        } catch (error) {
            ViewLoader.hide(loader);
            throw error;
        }
    }
    
    /**
     * Show a minimal inline loader (for smaller UI elements)
     * @param {HTMLElement} container - Container to show loader in
     * @returns {HTMLElement} The loader element
     */
    static showInline(container) {
        const loader = document.createElement('span');
        loader.className = 'loader-inline';
        loader.innerHTML = '<span class="loader-spinner-small"></span>';
        container.appendChild(loader);
        return loader;
    }
}

