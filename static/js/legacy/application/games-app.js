/**
 * Games App
 * Sub-app for the Games view
 * Manages game modules and their navigation with URL routing
 */

import { gameRegistry } from '../core/GameRegistry.js';
import { gameStatusService } from './game-status-service.js';
import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';
import { GameStatusCard } from '../presentation/components/GameStatusCard.js';

export class GamesApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.currentGame = null;
        
        console.log('🎮 GamesApp created');
    }

    /**
     * Initialize games view
     */
    async init() {
        console.log('🎮 Initializing Games app...');
        
        this.setupNavigation();
        await this.loadGameStatuses();
        
        console.log(`✅ Games app initialized with ${gameRegistry.getAll().length} games`);
    }

    /**
     * Setup navigation handlers
     */
    setupNavigation() {
        const refreshBtn = document.getElementById('refresh-games');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                gameStatusService.clearCache();
                this.loadGameStatuses();
            });
        }

        const backButton = document.getElementById('back-to-games');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.navigateToGamesList();
            });
        }
    }

    /**
     * Load and display game statuses
     */
    async loadGameStatuses() {
        const listContainer = document.getElementById('games-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<div class="loading-state">Loading game statuses...</div>';

        try {
            const statuses = await gameStatusService.getAllGameStatuses();
            
            listContainer.innerHTML = '';
            
            statuses.forEach((statusData, gameId) => {
                const card = GameStatusCard.render(statusData, (id) => this.navigateToGame(id));
                listContainer.appendChild(card);
            });

            console.log('✅ Game statuses loaded');
        } catch (error) {
            console.error('Failed to load game statuses:', error);
            listContainer.innerHTML = '<div class="error-state">Failed to load games. Please refresh.</div>';
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game statuses',
                type: 'error'
            });
        }
    }

    /**
     * Navigate to a specific game (with URL update)
     */
    navigateToGame(gameId) {
        console.log(`🎮 Navigating to game: ${gameId}`);
        window.location.hash = `#/games/${gameId}`;
        this.showGameView(gameId);
    }

    /**
     * Navigate back to games list
     */
    navigateToGamesList() {
        console.log('🎮 Navigating back to games list');
        window.location.hash = '#/games';
        this.showListView();
    }

    /**
     * Show game detail view
     */
    async showGameView(gameId) {
        const listContainer = document.getElementById('games-list-container');
        const detailContainer = document.getElementById('game-detail');
        const gameContainer = document.getElementById('game-container');

        if (!listContainer || !detailContainer || !gameContainer) {
            console.error('Required containers not found');
            return;
        }

        listContainer.style.display = 'none';
        detailContainer.classList.remove('hidden');
        detailContainer.style.display = 'block';

        if (this.currentGame) {
            if (this.currentGame.destroy) {
                this.currentGame.destroy();
            }
            this.currentGame = null;
        }

        gameContainer.innerHTML = '';

        try {
            const GameClass = gameRegistry.get(gameId);
            if (!GameClass) {
                throw new Error(`Unknown game: ${gameId}`);
            }

            const instance = new GameClass();
            await instance.init(gameContainer, this.web3Provider);
            this.currentGame = instance;
            
            eventBus.emit(EVENTS.GAME_LOADED, { name: gameId });
            console.log(`✅ Game loaded: ${gameId}`);
        } catch (error) {
            console.error(`Failed to load game ${gameId}:`, error);
            eventBus.emit(EVENTS.TOAST, {
                message: `Failed to load ${gameId}`,
                type: 'error'
            });
            this.navigateToGamesList();
        }
    }

    /**
     * Show games list view
     */
    showListView() {
        const listContainer = document.getElementById('games-list-container');
        const detailContainer = document.getElementById('game-detail');
        const gameContainer = document.getElementById('game-container');

        if (!listContainer || !detailContainer) return;

        if (this.currentGame) {
            if (this.currentGame.destroy) {
                this.currentGame.destroy();
            }
            this.currentGame = null;
        }

        listContainer.style.display = 'block';
        detailContainer.classList.add('hidden');
        detailContainer.style.display = 'none';
        
        if (gameContainer) {
            gameContainer.innerHTML = '';
        }
    }

    /**
     * Handle sub-route navigation (called by MasterRouter)
     */
    async handleSubRoute(subRoute) {
        if (subRoute) {
            await this.showGameView(subRoute);
        } else {
            this.showListView();
        }
    }
}
