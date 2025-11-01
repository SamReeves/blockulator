/**
 * Median Whale Game
 * Play above the median to win!
 */

import { GameRenderer } from '../ui/game-renderer.js';
import { eventBus, EVENTS } from '../ui/events.js';
import { PlayHistory } from '../ui/components/PlayHistory.js';
import { StatisticsPanel } from '../ui/components/StatisticsPanel.js';
import { SimulationPanel } from '../ui/components/SimulationPanel.js';
import { VisualDistribution } from '../ui/components/VisualDistribution.js';

export class MedianWhale {
    constructor() {
        this.contract = null;
        this.container = null;
        this.eventListeners = [];
        this.plays = [];
        this.gameType = 'median-whale';
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        console.log('Median Whale: Contract loading (placeholder)');
        
        // Load mock plays
        this.loadMockPlays();
        
        this.render();
        this.setupListeners();
        await this.refreshState();
    }

    loadMockPlays() {
        this.plays = [
            { address: '0xabcd1234567890abcd1234567890abcd12345678', weiAmount: 150000, timestamp: Math.floor(Date.now() / 1000) - 900 },
            { address: '0x1234567890abcdef1234567890abcdef12345678', weiAmount: 800000, timestamp: Math.floor(Date.now() / 1000) - 720 },
            { address: '0xef012345678901234567890123456789abcdef01', weiAmount: 350000, timestamp: Math.floor(Date.now() / 1000) - 600 },
            { address: '0x9876543210fedcba9876543210fedcba98765432', weiAmount: 600000, timestamp: Math.floor(Date.now() / 1000) - 480 },
            { address: '0x5678901234567890123456789012345678901234', weiAmount: 250000, timestamp: Math.floor(Date.now() / 1000) - 360 },
            { address: '0x3456789012345678901234567890123456789012', weiAmount: 900000, timestamp: Math.floor(Date.now() / 1000) - 240 },
            { address: '0x7890123456789012345678901234567890123456', weiAmount: 550000, timestamp: Math.floor(Date.now() / 1000) - 120 }
        ];
    }

    render() {
        // Main game interface
        const ui = GameRenderer.createGameInterface({
            title: '🐋 Median Whale',
            description: 'Play ABOVE the median to win! All winners above median split 99% of the pot equally.'
        });
        this.container.appendChild(ui);
        
        // Content sections
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'game-sections';
        
        // Statistics panel
        const statsPanel = StatisticsPanel.renderMedianWhale(
            this.plays,
            this.web3Provider.currentAddress
        );
        sectionsContainer.appendChild(statsPanel);
        
        // Visual distribution with median marker
        const sortedAmounts = [...this.plays]
            .sort((a, b) => a.weiAmount - b.weiAmount)
            .map(p => parseFloat(p.weiAmount));
        const midIndex = Math.floor(sortedAmounts.length / 2);
        const median = sortedAmounts.length > 0
            ? (sortedAmounts.length % 2 === 0
                ? (sortedAmounts[midIndex - 1] + sortedAmounts[midIndex]) / 2
                : sortedAmounts[midIndex])
            : null;
        
        const histogram = VisualDistribution.render(
            this.plays,
            'median-whale',
            median
        );
        sectionsContainer.appendChild(histogram);
        
        // Play history
        const historyPanel = PlayHistory.render(
            this.plays,
            this.web3Provider.currentAddress
        );
        sectionsContainer.appendChild(historyPanel);
        
        this.container.appendChild(sectionsContainer);
        
        // Simulation panel
        const simPanel = SimulationPanel.render(this.gameType);
        document.body.appendChild(simPanel);
    }

    setupListeners() {
        const playButton = document.getElementById('play-button');
        const simulateButton = document.getElementById('simulate-button');
        const weiInput = document.getElementById('play-wei');
        
        const handlePlay = () => this.play(weiInput.value);
        
        playButton.addEventListener('click', handlePlay);
        
        simulateButton.addEventListener('click', () => {
            SimulationPanel.show();
            SimulationPanel.setupHandlers(this.plays, this.gameType, (amount) => {
                weiInput.value = amount;
                this.play(amount);
            });
        });
        
        weiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlePlay();
        });
        
        PlayHistory.setupSortHandlers(this.plays, this.web3Provider.currentAddress);
        
        this.eventListeners.push({ element: playButton, handler: handlePlay });
    }

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
            
            console.log(`Playing Median Whale: ${weiAmount} wei`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Add play
            this.plays.push({
                address: this.web3Provider.currentAddress || '0xYourAddress',
                weiAmount: parseFloat(weiAmount),
                timestamp: Math.floor(Date.now() / 1000)
            });
            
            eventBus.emit(EVENTS.WHALE_APPEARS, { type: 'median' });
            
            eventBus.emit(EVENTS.TOAST, {
                message: `Played ${parseInt(weiAmount).toLocaleString()} wei!`,
                type: 'success'
            });
            
            await this.refreshState();
            
        } catch (error) {
            console.error('Play failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction failed: ' + error.message,
                type: 'error'
            });
        } finally {
            GameRenderer.setLoading(false);
        }
    }

    async refreshState() {
        const totalPot = this.plays.reduce((sum, p) => sum + parseFloat(p.weiAmount), 0);
        const prizePool = totalPot * 0.99;
        
        GameRenderer.updateGameStateBar({
            playCount: this.plays.length,
            prizePool: prizePool
        });
        
        this.updateComponents();
    }

    updateComponents() {
        // Update statistics
        const statsPanel = document.querySelector('.median-whale-stats');
        if (statsPanel) {
            const newStats = StatisticsPanel.renderMedianWhale(
                this.plays,
                this.web3Provider.currentAddress
            );
            statsPanel.replaceWith(newStats);
        }
        
        // Update play history
        PlayHistory.update(this.plays, this.web3Provider.currentAddress);
        PlayHistory.setupSortHandlers(this.plays, this.web3Provider.currentAddress);
        
        // Update distribution
        const sortedAmounts = [...this.plays]
            .sort((a, b) => a.weiAmount - b.weiAmount)
            .map(p => parseFloat(p.weiAmount));
        const midIndex = Math.floor(sortedAmounts.length / 2);
        const median = sortedAmounts.length > 0
            ? (sortedAmounts.length % 2 === 0
                ? (sortedAmounts[midIndex - 1] + sortedAmounts[midIndex]) / 2
                : sortedAmounts[midIndex])
            : null;
        
        const distContainer = document.querySelector('.visual-distribution');
        if (distContainer) {
            const newDist = VisualDistribution.render(
                this.plays,
                'median-whale',
                median
            );
            distContainer.replaceWith(newDist);
        }
    }

    destroy() {
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners = [];
        
        const simPanel = document.getElementById('simulation-panel');
        if (simPanel) {
            simPanel.remove();
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
