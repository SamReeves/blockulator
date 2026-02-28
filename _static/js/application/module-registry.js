/**
 * Module Registry
 * Application layer - manages module registration and loading
 * Provides dependency injection and module discovery
 * Now with dynamic import() for lazy loading
 */

import { MODULE_MANIFEST } from './module-manifest.js';

export class ModuleRegistry {
    constructor() {
        this.modules = new Map();
    }

    /**
     * Register a module (manifest-based, no class needed)
     * @param {string} name - Module name in kebab-case
     * @param {string} category - Module category ('game', 'calculator', or 'tool')
     */
    register(name, category) {
        const manifest = MODULE_MANIFEST[name];
        
        if (!manifest) {
            throw new Error(`Module not found in manifest: ${name}`);
        }
        
        this.modules.set(name, {
            manifest: manifest,
            category: category || manifest.category,
            name: name,
            loaded: false,
            moduleClass: null,
            instance: null
        });
        
        console.log(`📦 Registered ${category || manifest.category}: ${name}`);
    }

    /**
     * Load and instantiate a module (with dynamic import)
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
        
        // Dynamic import if not already loaded
        if (!moduleInfo.loaded) {
            console.log(`📥 Dynamically importing: ${name}`);
            const startTime = performance.now();
            
            const module = await import(moduleInfo.manifest.path);
            const ModuleClass = module[moduleInfo.manifest.export];
            
            const loadTime = (performance.now() - startTime).toFixed(2);
            console.log(`✅ Module imported in ${loadTime}ms: ${name}`);
            
            moduleInfo.moduleClass = ModuleClass;
            moduleInfo.loaded = true;
        }
        
        // Create new instance and initialize
        const instance = new moduleInfo.moduleClass();
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
     * Check if module has been loaded
     * @param {string} name - Module name
     * @returns {boolean}
     */
    isLoaded(name) {
        const moduleInfo = this.modules.get(name);
        return moduleInfo ? moduleInfo.loaded : false;
    }

    /**
     * Get module count
     * @returns {number}
     */
    get size() {
        return this.modules.size;
    }
}

