/**
 * GameRegistry - Auto-discovers games from barrel export
 * Core layer - Single registry for all game classes and metadata
 */

import * as Games from '../domain/games/index.js';

class GameRegistry {
    constructor() {
        this.games = new Map();
        for (const [, GameClass] of Object.entries(Games)) {
            if (GameClass.metadata?.id) {
                this.games.set(GameClass.metadata.id, GameClass);
            }
        }
    }

    get(id) {
        return this.games.get(id);
    }

    getAll() {
        return [...this.games.values()];
    }

    getAllMetadata() {
        return this.getAll().map(G => G.metadata);
    }

    has(id) {
        return this.games.has(id);
    }

    getIds() {
        return [...this.games.keys()];
    }
}

export const gameRegistry = new GameRegistry();
