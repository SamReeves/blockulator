/**
 * Router
 * Application layer - handles page routing and navigation
 * Detects page type and manages module lifecycle
 */

import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';

export class Router {
    constructor(moduleRegistry, web3Provider) {
        this.moduleRegistry = moduleRegistry;
        this.web3Provider = web3Provider;
        this.currentModule = null;
        this.pageType = null;
        this.config = null;
        
        this.detectPageType();
    }

    /**
     * Detect page type from DOM
     */
    detectPageType() {
        const isGamePage = !!document.getElementById('game-container');
        const isToolPage = !!document.getElementById('tool-container');
        const isFuturePage = !!document.getElementById('futures-container');
        
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
            console.log('📦 Detected: Tools page');
        } else if (isFuturePage) {
            this.pageType = 'future';
            this.config = {
                containerSelector: '#futures-container'
            };
            console.log('📦 Detected: Futures page');
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
        const container = document.querySelector(this.config.containerSelector);
        
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
        // Card click handlers
        const cards = document.querySelectorAll(this.config.cardSelector);
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const moduleName = card.dataset[this.config.dataAttr];
                if (moduleName) {
                    this.navigateTo(moduleName);
                }
            });
        });

        // Back button handler
        const backButton = document.getElementById(this.config.backButtonId);
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

        // Cleanup previous module
        if (this.currentModule) {
            if (this.currentModule.destroy) {
                this.currentModule.destroy();
            }
            this.currentModule = null;
        }

        // Clear detail container
        const detailContainer = document.querySelector(this.config.detailSelector);
        if (detailContainer) {
            detailContainer.innerHTML = '';
        }

        // Hide list, show detail
        const listEl = document.querySelector(this.config.listSelector);
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

        // Cleanup current module
        if (this.currentModule) {
            if (this.currentModule.destroy) {
                this.currentModule.destroy();
            }
            this.currentModule = null;
        }

        // Show list, hide detail
        const listEl = document.querySelector(this.config.listSelector);
        const detailEl = document.querySelector(this.config.detailSelector);
        
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

