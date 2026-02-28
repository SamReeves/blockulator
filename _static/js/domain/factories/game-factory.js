/**
 * Game Factory
 * Domain layer - Dynamic loading and instantiation of game modules
 * Eliminates manual registration and enables lazy loading
 */

// Map of game names to their module loaders
const GAME_MODULES = {
    'pissing-contest': () => import('../games/pissing-contest.js').then(m => m.PissingContest),
    'pay-it-forward': () => import('../games/pay-it-forward.js').then(m => m.PayItForward),
    'pay-it-backward': () => import('../games/pay-it-backward.js').then(m => m.PayItBackward),
    'message-board': () => import('../games/message-board.js').then(m => m.MessageBoard),
    'king-of-the-hill': () => import('../games/king-of-the-hill.js').then(m => m.KingOfTheHill),
    'last-call': () => import('../games/last-call.js').then(m => m.LastCall),
    'time-to-make-the-donuts': () => import('../games/time-to-make-the-donuts.js').then(m => m.TimeToMakeTheDonuts),
    'dice-gods': () => import('../games/dice-gods.js').then(m => m.DiceGods),
    'satan-moloch-baal': () => import('../games/satan-moloch-baal.js').then(m => m.SatanMolochBaal)
};

/**
 * GameFactory - Factory for creating game instances
 * Uses dynamic imports for code splitting and lazy loading
 */
export class GameFactory {
    /**
     * Create and initialize a game instance
     * @param {string} gameName - Game identifier (e.g., 'dice-gods')
     * @param {HTMLElement} container - DOM container for the game
     * @param {Web3Provider} web3Provider - Web3 provider instance
     * @returns {Promise<Game>} Initialized game instance
     * 
     * @example
     * const game = await GameFactory.create('dice-gods', container, web3Provider);
     */
    static async create(gameName, container, web3Provider) {
        const loader = GAME_MODULES[gameName];
        
        if (!loader) {
            throw new Error(`Unknown game: ${gameName}. Available games: ${this.getAvailableGames().join(', ')}`);
        }
        
        try {
            // Dynamically import the game module
            const GameClass = await loader();
            
            // Instantiate the game
            const game = new GameClass();
            
            // Initialize with container and web3 provider
            await game.init(container, web3Provider);
            
            return game;
        } catch (error) {
            console.error(`Failed to load game '${gameName}':`, error);
            throw new Error(`Failed to load game '${gameName}': ${error.message}`);
        }
    }
    
    /**
     * Get list of all available games
     * @returns {Array<string>} Array of game identifiers
     */
    static getAvailableGames() {
        return Object.keys(GAME_MODULES);
    }
    
    /**
     * Check if a game exists
     * @param {string} gameName - Game identifier
     * @returns {boolean} True if game exists
     */
    static has(gameName) {
        return gameName in GAME_MODULES;
    }
    
    /**
     * Preload a game module (without instantiating)
     * Useful for warming up the cache
     * @param {string} gameName - Game identifier
     * @returns {Promise<Function>} Game class constructor
     */
    static async preload(gameName) {
        const loader = GAME_MODULES[gameName];
        if (!loader) {
            throw new Error(`Unknown game: ${gameName}`);
        }
        return await loader();
    }
    
    /**
     * Preload all game modules
     * @returns {Promise<void>}
     */
    static async preloadAll() {
        const promises = Object.values(GAME_MODULES).map(loader => loader());
        await Promise.all(promises);
    }
}


