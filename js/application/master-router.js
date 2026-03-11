/**
 * Master Router
 * Handles top-level navigation between major views (games, vyper, fp127, futures, badges)
 * Uses hash-based routing (#/games, #/vyper, etc.) for SPA navigation without page reloads
 * Supports sub-routes: #/games/pissing-contest
 * 
 * Deep links: https://site.com/#/games or https://site.com/#/games/pissing-contest
 * No server configuration required (pure client-side routing)
 */

export class MasterRouter {
    constructor() {
        this.currentView = null;
        this.currentSubRoute = null;
        this.viewInitializers = new Map(); // view name -> initializer function
        this.initializedViews = new Set(); // track which views have been initialized
        this.subRouteHandlers = new Map(); // view name -> sub-route handler
        
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
        this.navigateTo(route.view, { subRoute: route.subRoute, replace: true, skipPush: true });
        
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
     * Register a sub-route handler for a view
     * @param {string} viewName - Parent view name (e.g., 'games')
     * @param {Function} handlerFn - Function to handle sub-routes: (subRoute) => {}
     */
    registerSubRouteHandler(viewName, handlerFn) {
        this.subRouteHandlers.set(viewName, handlerFn);
        console.log(`📍 Registered sub-route handler for: ${viewName}`);
    }

    /**
     * Parse current URL to determine route
     */
    parseRoute() {
        // Hash-based routing: URLs like https://site.com/#/games or https://site.com/#/games/pissing-contest
        let path = window.location.hash.slice(1); // Remove #
        
        if (!path || path === '/') {
            path = '/benchmarks'; // Default route
        }
        
        // Remove leading slash if present
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        
        const parts = path.split('/').filter(Boolean);
        const view = parts[0] || 'benchmarks';
        const subRoute = parts.slice(1).join('/') || null;
        
        return { view, subRoute };
    }

    /**
     * Navigate to a view with optional sub-route
     * @param {string} viewName - Name of view to navigate to (games, vyper, fp127, futures, badges, about)
     * @param {object} options - Navigation options
     */
    async navigateTo(viewName, options = {}) {
        const { replace = false, skipPush = false, subRoute = null } = options;
        
        console.log(`🧭 Navigating to: ${viewName}${subRoute ? '/' + subRoute : ''}`);
        
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
            const url = `#/${viewName}${subRoute ? '/' + subRoute : ''}`;
            if (replace) {
                window.history.replaceState({ view: viewName, subRoute }, '', url);
            } else {
                window.history.pushState({ view: viewName, subRoute }, '', url);
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
        
        // Handle sub-route if present
        if (subRoute) {
            const handler = this.subRouteHandlers.get(viewName);
            if (handler) {
                await handler(subRoute);
            }
        }
        
        // Update current view and sub-route
        this.currentView = viewName;
        this.currentSubRoute = subRoute;
        
        console.log(`✅ Navigated to: ${viewName}${subRoute ? '/' + subRoute : ''}`);
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
        this.navigateTo(route.view, { subRoute: route.subRoute, skipPush: true });
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
     * Get current sub-route
     */
    getCurrentSubRoute() {
        return this.currentSubRoute;
    }

    /**
     * Check if view has been initialized
     */
    isViewInitialized(viewName) {
        return this.initializedViews.has(viewName);
    }
}

