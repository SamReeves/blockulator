/**
 * Pissing Contest Game
 * Compete to make the biggest splash - highest wei wins!
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { PlayHistory } from '../ui/components/PlayHistory.js';
import { StatisticsPanel } from '../ui/components/StatisticsPanel.js';
import { SimulationPanel } from '../ui/components/SimulationPanel.js';
import { VisualDistribution } from '../ui/components/VisualDistribution.js';

export class PissingContest {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.plays = []; // Store current round plays
        this.gameType = 'pissing-contest';
    }

    /**
     * Initialize the game
     */
    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        // Load contract (placeholder - update with actual ABI and address)
        try {
            // TODO: Load actual contract ABI from contracts/abis/pissing-contest.json
            // this.contract = web3Provider.getContract(CONTRACT_ADDRESS, CONTRACT_ABI);
            console.log('Pissing Contest: Contract loading (placeholder)');
            
            // Load mock plays for demonstration
            this.loadMockPlays();
        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load game contract',
                type: 'error'
            });
            return;
        }
        
        // Render UI
        this.render();
        
        // Setup event listeners
        this.setupListeners();
        
        // Load initial state
        await this.refreshState();
    }

    /**
     * Load mock plays for demonstration
     */
    loadMockPlays() {
        this.plays = [
            { address: '0xabcd1234567890abcd1234567890abcd12345678', weiAmount: 500000, timestamp: Math.floor(Date.now() / 1000) - 900 },
            { address: '0x1234567890abcdef1234567890abcdef12345678', weiAmount: 750000, timestamp: Math.floor(Date.now() / 1000) - 720 },
            { address: '0xef012345678901234567890123456789abcdef01', weiAmount: 200000, timestamp: Math.floor(Date.now() / 1000) - 600 },
            { address: '0x9876543210fedcba9876543210fedcba98765432', weiAmount: 1000000, timestamp: Math.floor(Date.now() / 1000) - 480 },
            { address: '0x5678901234567890123456789012345678901234', weiAmount: 300000, timestamp: Math.floor(Date.now() / 1000) - 360 },
            { address: '0x3456789012345678901234567890123456789012', weiAmount: 600000, timestamp: Math.floor(Date.now() / 1000) - 240 },
            { address: '0x7890123456789012345678901234567890123456', weiAmount: 450000, timestamp: Math.floor(Date.now() / 1000) - 120 }
        ];
    }

    /**
     * Render the game interface
     */
    render() {
        // Main game interface
        const ui = GameRenderer.createGameInterface({
            title: '💦 Pissing Contest',
            description: 'The player who sends the HIGHEST wei amount wins 99% of the pot. Last mover advantage is real!'
        });
        this.container.appendChild(ui);
        
        // Content sections container
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Statistics panel
        const statsPanel = StatisticsPanel.renderPissingContest(
            this.plays,
            this.web3Provider.currentAddress
        );
        sectionsContainer.appendChild(statsPanel);
        
        // Play history
        const historyPanel = PlayHistory.render(
            this.plays,
            this.web3Provider.currentAddress
        );
        sectionsContainer.appendChild(historyPanel);
        
        // Visual distribution
        const maxPlay = this.plays.length > 0
            ? Math.max(...this.plays.map(p => parseFloat(p.weiAmount)))
            : null;
        const distribution = VisualDistribution.renderNumberLine(
            this.plays,
            this.web3Provider.currentAddress,
            maxPlay
        );
        const distContainer = document.createElement('div');
        distContainer.className = 'distribution-container';
        const distTitle = document.createElement('h3');
        distTitle.textContent = '📊 Play Distribution';
        distContainer.appendChild(distTitle);
        distContainer.appendChild(distribution);
        sectionsContainer.appendChild(distContainer);
        
        this.container.appendChild(sectionsContainer);
        
        // Simulation panel (initially hidden)
        const simPanel = SimulationPanel.render(this.gameType);
        document.body.appendChild(simPanel);
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        const playButton = document.getElementById('play-button');
        const simulateButton = document.getElementById('simulate-button');
        const weiInput = document.getElementById('play-wei');
        
        const handlePlay = () => this.play(weiInput.value);
        
        playButton.addEventListener('click', handlePlay);
        
        // Simulate button
        simulateButton.addEventListener('click', () => {
            SimulationPanel.show();
            SimulationPanel.setupHandlers(this.plays, this.gameType, (amount) => {
                weiInput.value = amount;
                this.play(amount);
            });
        });
        
        // Enter key support
        weiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlePlay();
        });
        
        // Setup sort handlers for play history
        PlayHistory.setupSortHandlers(this.plays, this.web3Provider.currentAddress);
        
        // Store for cleanup
        this.eventListeners.push({ element: playButton, handler: handlePlay });
    }

    /**
     * Play the game
     */
    async play(weiAmount) {
        if (!weiAmount || parseFloat(weiAmount) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid wei amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            GameRenderer.setLoading(true);
            
            eventBus.emit(EVENTS.PLAY_SUBMITTED, {
                game: 'pissing-contest',
                wei: weiAmount
            });
            
            // TODO: Call actual contract method
            // const tx = await this.contract.play({
            //     value: ethers.BigNumber.from(weiAmount)
            // });
            // await tx.wait();
            
            // Placeholder success
            console.log(`Playing Pissing Contest: ${weiAmount} wei`);
            
            // Simulate transaction delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Add play to mock data
            this.plays.push({
                address: this.web3Provider.currentAddress || '0xYourAddress',
                weiAmount: parseFloat(weiAmount),
                timestamp: Math.floor(Date.now() / 1000)
            });
            
            eventBus.emit(EVENTS.PLAY_CONFIRMED, {
                game: 'pissing-contest',
                wei: weiAmount
            });
            
            // Trigger splash animation
            eventBus.emit(EVENTS.SPLASH, { intensity: parseFloat(weiAmount) });
            
            eventBus.emit(EVENTS.TOAST, {
                message: `Played ${parseInt(weiAmount).toLocaleString()} wei!`,
                type: 'success'
            });
            
            // Refresh state
            await this.refreshState();
            
        } catch (error) {
            console.error('Play failed:', error);
            eventBus.emit(EVENTS.PLAY_FAILED, { error });
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction failed: ' + error.message,
                type: 'error'
            });
        } finally {
            GameRenderer.setLoading(false);
        }
    }

    /**
     * Refresh game state from blockchain
     */
    async refreshState() {
        try {
            // TODO: Load actual contract state
            // const plays = await this.contract.getCurrentRoundPlays();
            // this.plays = plays;
            
            // Calculate prize pool
            const totalPot = this.plays.reduce((sum, p) => sum + parseFloat(p.weiAmount), 0);
            const prizePool = totalPot * 0.99;
            
            // Update game state bar
            GameRenderer.updateGameStateBar({
                playCount: this.plays.length,
                prizePool: prizePool
            });
            
            // Re-render components with new data
            this.updateComponents();
            
        } catch (error) {
            console.error('Failed to refresh state:', error);
        }
    }

    /**
     * Update all components with current data
     */
    updateComponents() {
        // Update statistics
        const statsPanel = document.querySelector('.pissing-contest-stats');
        if (statsPanel) {
            const newStats = StatisticsPanel.renderPissingContest(
                this.plays,
                this.web3Provider.currentAddress
            );
            statsPanel.replaceWith(newStats);
        }
        
        // Update play history
        PlayHistory.update(this.plays, this.web3Provider.currentAddress);
        PlayHistory.setupSortHandlers(this.plays, this.web3Provider.currentAddress);
        
        // Update distribution
        const maxPlay = this.plays.length > 0
            ? Math.max(...this.plays.map(p => parseFloat(p.weiAmount)))
            : null;
        const distContainer = document.querySelector('.number-line');
        if (distContainer?.parentElement) {
            const newDist = VisualDistribution.renderNumberLine(
                this.plays,
                this.web3Provider.currentAddress,
                maxPlay
            );
            distContainer.replaceWith(newDist);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners = [];
        
        // Remove simulation panel
        const simPanel = document.getElementById('simulation-panel');
        if (simPanel) {
            simPanel.remove();
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
