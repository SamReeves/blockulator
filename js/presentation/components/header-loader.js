/**
 * Header Loader - Loads shared header HTML and sets active page
 * Ensures header is consistent across all pages and doesn't bounce
 */
export class HeaderLoader {
    static async load(pageName) {
        try {
            const response = await fetch('/header.html');
            const headerHtml = await response.text();
            
            // Insert header into DOM
            const appContainer = document.getElementById('app');
            if (appContainer) {
                appContainer.insertAdjacentHTML('afterbegin', headerHtml);
            }
            
            // Set active page
            this.setActivePage(pageName);
            
            return true;
        } catch (error) {
            console.error('Failed to load header:', error);
            return false;
        }
    }
    
    static setActivePage(pageName) {
        const links = document.querySelectorAll('.nav-link[data-page]');
        links.forEach(link => {
            if (link.dataset.page === pageName) {
                link.classList.add('nav-link-active');
            } else {
                link.classList.remove('nav-link-active');
            }
        });
    }
}




