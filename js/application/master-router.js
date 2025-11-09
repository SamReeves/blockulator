/**
 * Master Router
 * Handles top-level navigation between major views (games, tools, discussions, factory)
 * Manages URL state and browser history without page reloads
 */

export class MasterRouter {
    constructor() {
        this.currentView = null;
        this.viewInitializers = new Map(); // view name -> initializer function
        this.initializedViews = new Set(); // track which views have been initialized
        
        console.log('📍 MasterRouter created');
    }

    /**
     * Initialize router - setup event listeners and load initial route
     */
    init() {
        console.log('📍 MasterRouter initializing...');
        
        // Intercept navigation link clicks
        this.interceptNavigation();
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });
        
        // Load initial route from URL
        const route = this.parseRoute();
        this.navigateTo(route.view, { replace: true, skipPush: true });
        
        console.log('✅ MasterRouter initialized');
    }

    /**
     * Register a view initializer function
     * This function will be called the first time the view is navigated to
     */
    registerView(viewName, initializerFn) {
        this.viewInitializers.set(viewName, initializerFn);
        console.log(`📍 Registered view: ${viewName}`);
    }

    /**
     * Parse current URL to determine route
     */
    parseRoute() {
        // Support both hash-based (#/games) and path-based (/games) routing
        let path = window.location.hash.slice(1); // Remove #
        
        if (!path || path === '/') {
            path = '/games'; // Default route
        }
        
        // Remove leading slash if present
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        
        const parts = path.split('/').filter(Boolean);
        const view = parts[0] || 'games';
        const subRoute = parts.slice(1).join('/');
        
        return { view, subRoute };
    }

    /**
     * Navigate to a view
     * @param {string} viewName - Name of view to navigate to (games, tools, discussions, factory)
     * @param {object} options - Navigation options
     */
    async navigateTo(viewName, options = {}) {
        const { replace = false, skipPush = false } = options;
        
        console.log(`🧭 Navigating to: ${viewName}`);
        
        // Validate view exists
        const viewElement = document.getElementById(`${viewName}-view`);
        if (!viewElement) {
            console.error(`❌ View not found: ${viewName}`);
            return;
        }
        
        // Hide current view
        if (this.currentView) {
            const currentElement = document.getElementById(`${this.currentView}-view`);
            if (currentElement) {
                currentElement.classList.add('hidden');
            }
        }
        
        // Show target view
        viewElement.classList.remove('hidden');
        
        // Update URL if not skipping push
        if (!skipPush) {
            const url = `#/${viewName}`;
            if (replace) {
                window.history.replaceState({ view: viewName }, '', url);
            } else {
                window.history.pushState({ view: viewName }, '', url);
            }
        }
        
        // Update active nav link
        this.setActiveNavLink(viewName);
        
        // Initialize view if first time
        if (!this.initializedViews.has(viewName)) {
            const initializer = this.viewInitializers.get(viewName);
            if (initializer) {
                console.log(`🔧 Initializing view: ${viewName}`);
                try {
                    await initializer();
                    this.initializedViews.add(viewName);
                } catch (error) {
                    console.error(`❌ Failed to initialize ${viewName}:`, error);
                }
            } else {
                console.warn(`⚠️ No initializer registered for ${viewName}`);
            }
        }
        
        // Update current view
        this.currentView = viewName;
        
        console.log(`✅ Navigated to: ${viewName}`);
    }

    /**
     * Intercept clicks on navigation links
     */
    interceptNavigation() {
        // Find all nav links with data-route attribute
        const navLinks = document.querySelectorAll('.nav-link[data-route]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                const route = link.dataset.route;
                if (route) {
                    this.navigateTo(route);
                }
            });
        });
        
        console.log(`📍 Intercepted ${navLinks.length} navigation links`);
    }

    /**
     * Handle browser back/forward buttons
     */
    handlePopState(event) {
        console.log('⬅️ Browser back/forward detected');
        
        const route = this.parseRoute();
        this.navigateTo(route.view, { skipPush: true });
    }

    /**
     * Update active state on nav links
     */
    setActiveNavLink(viewName) {
        const navLinks = document.querySelectorAll('.nav-link[data-route]');
        
        navLinks.forEach(link => {
            if (link.dataset.route === viewName) {
                link.classList.add('nav-link-active');
            } else {
                link.classList.remove('nav-link-active');
            }
        });
    }

    /**
     * Get current view name
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Check if view has been initialized
     */
    isViewInitialized(viewName) {
        return this.initializedViews.has(viewName);
    }
}

