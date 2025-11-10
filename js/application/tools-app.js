/**
 * Tools App
 * Sub-app for the Tools view
 * Manages calculator modules
 */

import { ModuleRegistry } from './module-registry.js';
import { Router } from './router.js';

export class ToolsApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent; // Shared, not created here
        this.toastComponent = toastComponent;   // Shared, not created here
        this.moduleRegistry = new ModuleRegistry();
        this.router = null;
        
        console.log('🧮 CalculatorApp created');
    }

    /**
     * Initialize calculator view
     */
    async init() {
        console.log('🧮 Initializing Calculator app...');
        
        // Register all calculators
        this.registerCalculators();
        
        // Initialize router scoped to tools view
        this.router = new Router(this.moduleRegistry, this.web3Provider, '#tools-view');
        this.router.init();
        
        console.log(`✅ Calculator app initialized (${this.moduleRegistry.getCategory('calculator').length} calculators)`);
    }

    /**
     * Register all calculator modules
     */
    registerCalculators() {
        console.log('🧮 Registering calculators...');
        
        this.moduleRegistry.register('scientific-calculator', 'tool');
        this.moduleRegistry.register('pi-calculator', 'calculator');
        this.moduleRegistry.register('e-calculator', 'calculator');
        this.moduleRegistry.register('tau-calculator', 'calculator');
        this.moduleRegistry.register('sin-calculator', 'calculator');
        this.moduleRegistry.register('cos-calculator', 'calculator');
        this.moduleRegistry.register('tanh-calculator', 'calculator');
        this.moduleRegistry.register('pow10-calculator', 'calculator');
        this.moduleRegistry.register('pow2-calculator', 'calculator');
        this.moduleRegistry.register('ln-calculator', 'calculator');
        this.moduleRegistry.register('log2-calculator', 'calculator');
        this.moduleRegistry.register('log10-calculator', 'calculator');
        this.moduleRegistry.register('sqrt-calculator', 'calculator');
        this.moduleRegistry.register('erf-calculator', 'calculator');
    }
}

