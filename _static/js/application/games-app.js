/**
 * Games App
 * Sub-app for the Games view
 * Manages game modules and their navigation with URL routing
 */

import { ModuleRegistry } from './module-registry.js';
import { gameStatusService } from './game-status-service.js';
import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';
import { StatusCardRenderer } from '../presentation/components/status-card-renderer.js';

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
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.moduleRegistry = new ModuleRegistry();
        this.currentGame = null;
        
        console.log('🎮 GamesApp created');
    }

    /**
     * Initialize games view
     */
    async init() {
        console.log('🎮 Initializing Games app...');
        
        // Register all games
        this.registerGames();
        
        // Setup navigation handlers
        this.setupNavigation();
        
        // Load game statuses for overview
        await this.loadGameStatuses();
        
        console.log(`✅ Games app initialized`);
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

    /**
     * Setup navigation handlers
     */
    setupNavigation() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-games');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                gameStatusService.clearCache();
                this.loadGameStatuses();
            });
        }

        // Back button
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

        // Show loading state
        listContainer.innerHTML = '<div class="loading-state">Loading game statuses...</div>';

        try {
            const statuses = await gameStatusService.getAllGameStatuses();
            
            // Render status cards
            listContainer.innerHTML = '';
            
            statuses.forEach((gameData, gameName) => {
                const card = this.createStatusCard(gameName, gameData);
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
     * Create a status card for a game (using reusable renderer with custom styling)
     */
    createStatusCard(gameName, gameData) {
        const card = StatusCardRenderer.createCard({
            id: gameName,
            icon: gameData.emoji,
            title: gameData.title,
            description: gameData.description,
            status: gameData.status || 'Loading...',
            details: gameData.details,
            onClick: (id) => this.navigateToGame(id),
            clickable: true
        });
        
        // Add game-specific data attribute for gradient styling
        card.dataset.game = gameName;
        
        // Add large faded emoji background on the right
        const emojiBackground = document.createElement('div');
        emojiBackground.className = 'status-card-bg-emoji';
        emojiBackground.textContent = gameData.emoji;
        card.appendChild(emojiBackground);
        
        return card;
    }

    /**
     * Navigate to a specific game (with URL update)
     */
    navigateToGame(gameName) {
        console.log(`🎮 Navigating to game: ${gameName}`);
        
        // Update URL
        window.location.hash = `#/games/${gameName}`;
        
        // Show game view
        this.showGameView(gameName);
    }

    /**
     * Navigate back to games list
     */
    navigateToGamesList() {
        console.log('🎮 Navigating back to games list');
        
        // Update URL
        window.location.hash = '#/games';
        
        // Show list view
        this.showListView();
    }

    /**
     * Show game detail view
     */
    async showGameView(gameName) {
        const listContainer = document.getElementById('games-list-container');
        const detailContainer = document.getElementById('game-detail');
        const gameContainer = document.getElementById('game-container');

        if (!listContainer || !detailContainer || !gameContainer) {
            console.error('Required containers not found');
            return;
        }

        // Hide list, show detail
        listContainer.style.display = 'none';
        detailContainer.classList.remove('hidden');
        detailContainer.style.display = 'block';

        // Cleanup previous game
        if (this.currentGame) {
            if (this.currentGame.destroy) {
                this.currentGame.destroy();
            }
            this.currentGame = null;
        }

        // Clear container
        gameContainer.innerHTML = '';

        // Load game module
        try {
            this.currentGame = await this.moduleRegistry.load(
                gameName,
                gameContainer,
                this.web3Provider
            );
            
            eventBus.emit(EVENTS.GAME_LOADED, { name: gameName });
            console.log(`✅ Game loaded: ${gameName}`);
        } catch (error) {
            console.error(`Failed to load game ${gameName}:`, error);
            eventBus.emit(EVENTS.TOAST, {
                message: `Failed to load ${gameName}`,
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

        // Cleanup current game
        if (this.currentGame) {
            if (this.currentGame.destroy) {
                this.currentGame.destroy();
            }
            this.currentGame = null;
        }

        // Show list, hide detail
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
            // Navigate to specific game
            await this.showGameView(subRoute);
        } else {
            // Show games list
            this.showListView();
        }
    }
}
