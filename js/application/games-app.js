/**
 * Games App
 * Sub-app for the Games view
 * Manages game modules and their navigation
 */

import { ModuleRegistry } from './module-registry.js';
import { Router } from './router.js';

// Import all game modules
import { PissingContest } from '../domain/games/pissing-contest.js';
import { PayItForward } from '../domain/games/pay-it-forward.js';
import { MessageBoard } from '../domain/games/message-board.js';
import { PayItBackward } from '../domain/games/pay-it-backward.js';
import { KingOfTheHill } from '../domain/games/king-of-the-hill.js';
import { LastCall } from '../domain/games/last-call.js';
import { TimeToMakeTheDonuts } from '../domain/games/time-to-make-the-donuts.js';
import { DiceGods } from '../domain/games/dice-gods.js';
import { SatanMolochBaal } from '../domain/games/satan-moloch-baal.js';

export class GamesApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent; // Shared, not created here
        this.toastComponent = toastComponent;   // Shared, not created here
        this.moduleRegistry = new ModuleRegistry();
        this.router = null;
        
        console.log('🎮 GamesApp created');
    }

    /**
     * Initialize games view
     */
    async init() {
        console.log('🎮 Initializing Games app...');
        
        // Register all games
        this.registerGames();
        
        // Initialize router scoped to games view
        this.router = new Router(this.moduleRegistry, this.web3Provider, '#games-view');
        this.router.init();
        
        console.log(`✅ Games app initialized (${this.moduleRegistry.getCategory('game').length} games)`);
    }

    /**
     * Register all game modules
     */
    registerGames() {
        console.log('🎮 Registering games...');
        
        this.moduleRegistry.register('pissing-contest', PissingContest, 'game');
        this.moduleRegistry.register('pay-it-forward', PayItForward, 'game');
        this.moduleRegistry.register('message-board', MessageBoard, 'game');
        this.moduleRegistry.register('pay-it-backward', PayItBackward, 'game');
        this.moduleRegistry.register('king-of-the-hill', KingOfTheHill, 'game');
        this.moduleRegistry.register('last-call', LastCall, 'game');
        this.moduleRegistry.register('time-to-make-the-donuts', TimeToMakeTheDonuts, 'game');
        this.moduleRegistry.register('dice-gods', DiceGods, 'game');
        this.moduleRegistry.register('satan-moloch-baal', SatanMolochBaal, 'game');
    }
}

