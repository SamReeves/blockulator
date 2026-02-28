/**
 * Router
 * Application layer - handles page routing and navigation
 * Detects page type and manages module lifecycle
 */

import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';

export class Router {
    constructor(moduleRegistry, web3Provider, containerSelector = null) {
        this.moduleRegistry = moduleRegistry;
        this.web3Provider = web3Provider;
        this.currentModule = null;
        this.pageType = null;
        this.config = null;
        this.containerSelector = containerSelector; // Optional: scope to specific view
        
        this.detectPageType();
    }

    /**
     * Detect page type from DOM
     */
    detectPageType() {
        // Scope queries to container if provided
        const root = this.containerSelector 
            ? document.querySelector(this.containerSelector) 
            : document;
        
        if (!root) {
            console.error('❌ Container not found:', this.containerSelector);
            return;
        }
        
        const isGamePage = !!root.querySelector('#game-container');
        const isToolPage = !!root.querySelector('#tool-container');
        
        if (isGamePage) {
            this.pageType = 'game';
            this.config = {
                listSelector: '.game-list',
                detailSelector: '#game-detail',
                containerSelector: '#game-container',
                backButtonId: 'back-to-games',
                cardSelector: '.game-card',
                dataAttr: 'game'
            };
            console.log('📦 Detected: Games page');
        } else if (isToolPage) {
            this.pageType = 'tool';
            this.config = {
                listSelector: '.tool-list',
                detailSelector: '#tool-detail',
                containerSelector: '#tool-container',
                backButtonId: 'back-to-tools',
                cardSelector: '.tool-card',
                dataAttr: 'tool'
            };
            console.log('📦 Detected: Calculator page');
        } else {
            console.error('❌ Unable to detect page type');
        }
    }

    /**
     * Initialize router and setup navigation
     */
    init() {
        if (!this.config) {
            console.error('No page configuration');
            return;
        }

        // Setup navigation for list-detail pages (games only)
        if (this.pageType === 'game') {
            this.setupListDetailNavigation();
        }
        
        // Tools page auto-loads scientific calculator
        if (this.pageType === 'tool') {
            this.loadToolsPage();
        }
        
        console.log('✅ Router initialized');
    }

    /**
     * Load tools page (scientific calculator or specific tool via URL param)
     */
    async loadToolsPage() {
        const root = this.containerSelector 
            ? document.querySelector(this.containerSelector) 
            : document;
            
        const container = root.querySelector(this.config.containerSelector);
        
        if (!container) {
            console.error('Tool container not found');
            return;
        }
        
        // Check for URL parameter to load specific tool
        const urlParams = new URLSearchParams(window.location.search);
        const toolParam = urlParams.get('tool');
        
        let moduleName = 'scientific-calculator'; // default
        
        if (toolParam && this.moduleRegistry.has(toolParam)) {
            moduleName = toolParam;
            console.log(`🔧 Loading individual calculator: ${moduleName}`);
        } else {
            console.log('🧮 Loading scientific calculator');
        }
        
        try {
            this.currentModule = await this.moduleRegistry.load(
                moduleName,
                container,
                this.web3Provider
            );
            console.log(`✅ ${moduleName} loaded`);
        } catch (error) {
            console.error(`Failed to load ${moduleName}:`, error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load calculator',
                type: 'error'
            });
        }
    }

    /**
     * Setup list-detail navigation pattern
     */
    setupListDetailNavigation() {
        const root = this.containerSelector 
            ? document.querySelector(this.containerSelector) 
            : document;
        
        // Card click handlers
        const cards = root.querySelectorAll(this.config.cardSelector);
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const moduleName = card.dataset[this.config.dataAttr];
                if (moduleName) {
                    this.navigateTo(moduleName);
                }
            });
        });

        // Back button handler
        const backButton = root.querySelector('#' + this.config.backButtonId);
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.navigateBack();
            });
        }

        console.log(`✅ Navigation setup complete for ${this.pageType} page`);
    }

    /**
     * Navigate to a module
     */
    async navigateTo(moduleName) {
        console.log(`🧭 Navigating to: ${moduleName}`);

        const root = this.containerSelector 
            ? document.querySelector(this.containerSelector) 
            : document;

        // Cleanup previous module
        if (this.currentModule) {
            if (this.currentModule.destroy) {
                this.currentModule.destroy();
            }
            this.currentModule = null;
        }

        // Clear detail container
        const detailContainer = root.querySelector(this.config.detailSelector);
        if (detailContainer) {
            detailContainer.innerHTML = '';
        }

        // Hide list, show detail
        const listEl = root.querySelector(this.config.listSelector);
        if (listEl) listEl.style.display = 'none';
        if (detailContainer) {
            detailContainer.classList.remove('hidden');
            detailContainer.style.display = 'block';
        }

        // Load module
        try {
            this.currentModule = await this.moduleRegistry.load(
                moduleName,
                detailContainer,
                this.web3Provider
            );
            
            eventBus.emit(EVENTS.GAME_LOADED, { name: moduleName });
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            eventBus.emit(EVENTS.TOAST, {
                message: `Failed to load ${moduleName}`,
                type: 'error'
            });
            this.navigateBack();
        }
    }

    /**
     * Navigate back to list
     */
    navigateBack() {
        console.log('🔙 Navigating back to list');

        const root = this.containerSelector 
            ? document.querySelector(this.containerSelector) 
            : document;

        // Cleanup current module
        if (this.currentModule) {
            if (this.currentModule.destroy) {
                this.currentModule.destroy();
            }
            this.currentModule = null;
        }

        // Show list, hide detail
        const listEl = root.querySelector(this.config.listSelector);
        const detailEl = root.querySelector(this.config.detailSelector);
        
        if (listEl) listEl.style.display = 'grid';
        if (detailEl) {
            detailEl.classList.add('hidden');
            detailEl.style.display = 'none';
            detailEl.innerHTML = '';
        }
    }

    /**
     * Get current page type
     */
    getPageType() {
        return this.pageType;
    }
}

