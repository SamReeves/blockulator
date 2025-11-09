/**
 * Tools App
 * Sub-app for the Tools view
 * Manages calculator modules
 */

import { ModuleRegistry } from './module-registry.js';
import { Router } from './router.js';

// Import all calculator modules
import { PiCalculator } from '../domain/calculators/pi-calculator.js';
import { ECalculator } from '../domain/calculators/e-calculator.js';
import { TauCalculator } from '../domain/calculators/tau-calculator.js';
import { SinCalculator } from '../domain/calculators/sin-calculator.js';
import { SqrtCalculator } from '../domain/calculators/sqrt-calculator.js';
import { CosCalculator } from '../domain/calculators/cos-calculator.js';
import { TanhCalculator } from '../domain/calculators/tanh-calculator.js';
import { Pow10Calculator } from '../domain/calculators/pow10-calculator.js';
import { Pow2Calculator } from '../domain/calculators/pow2-calculator.js';
import { LnCalculator } from '../domain/calculators/ln-calculator.js';
import { Log2Calculator } from '../domain/calculators/log2-calculator.js';
import { Log10Calculator } from '../domain/calculators/log10-calculator.js';
import { ErfCalculator } from '../domain/calculators/erf-calculator.js';
import { ScientificCalculator } from '../tools/scientific-calculator.js';

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
        
        this.moduleRegistry.register('scientific-calculator', ScientificCalculator, 'calculator');
        this.moduleRegistry.register('pi-calculator', PiCalculator, 'calculator');
        this.moduleRegistry.register('e-calculator', ECalculator, 'calculator');
        this.moduleRegistry.register('tau-calculator', TauCalculator, 'calculator');
        this.moduleRegistry.register('sin-calculator', SinCalculator, 'calculator');
        this.moduleRegistry.register('cos-calculator', CosCalculator, 'calculator');
        this.moduleRegistry.register('tanh-calculator', TanhCalculator, 'calculator');
        this.moduleRegistry.register('pow10-calculator', Pow10Calculator, 'calculator');
        this.moduleRegistry.register('pow2-calculator', Pow2Calculator, 'calculator');
        this.moduleRegistry.register('ln-calculator', LnCalculator, 'calculator');
        this.moduleRegistry.register('log2-calculator', Log2Calculator, 'calculator');
        this.moduleRegistry.register('log10-calculator', Log10Calculator, 'calculator');
        this.moduleRegistry.register('sqrt-calculator', SqrtCalculator, 'calculator');
        this.moduleRegistry.register('erf-calculator', ErfCalculator, 'calculator');
    }
}

