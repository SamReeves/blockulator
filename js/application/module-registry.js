/**
 * Module Registry
 * Application layer - manages module registration and loading
 * Provides dependency injection and module discovery
 */

export class ModuleRegistry {
    constructor() {
        this.modules = new Map();
    }

    /**
     * Register a module
     * @param {string} name - Module name in kebab-case
     * @param {Class} ModuleClass - Module class
     * @param {string} category - Module category ('game' or 'calculator')
     */
    register(name, ModuleClass, category) {
        this.modules.set(name, {
            class: ModuleClass,
            category: category,
            name: name
        });
        console.log(`📦 Registered ${category}: ${name}`);
    }

    /**
     * Load and instantiate a module
     * @param {string} name - Module name
     * @param {HTMLElement} container - DOM container
     * @param {Object} web3Provider - Web3 provider instance
     * @returns {Promise<Object>} Module instance
     */
    async load(name, container, web3Provider) {
        const moduleInfo = this.modules.get(name);
        
        if (!moduleInfo) {
            throw new Error(`Module not found: ${name}`);
        }

        console.log(`🚀 Loading ${moduleInfo.category}: ${name}`);
        
        // Instantiate and initialize
        const instance = new moduleInfo.class();
        await instance.init(container, web3Provider);
        
        return instance;
    }

    /**
     * Get all modules in a category
     * @param {string} category - Category name
     * @returns {Array} Array of module names
     */
    getCategory(category) {
        const result = [];
        for (const [name, info] of this.modules.entries()) {
            if (info.category === category) {
                result.push(name);
            }
        }
        return result;
    }

    /**
     * Check if module exists
     * @param {string} name - Module name
     * @returns {boolean}
     */
    has(name) {
        return this.modules.has(name);
    }

    /**
     * Get module count
     * @returns {number}
     */
    get size() {
        return this.modules.size;
    }
}

