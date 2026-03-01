/**
 * Game Renderer
 * Presentation layer - reusable UI patterns for rendering game interfaces
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { ContractInfoRenderer } from './contract-info-renderer.js';

export class GameRenderer {
    /**
     * Create just the header with contract info (for games with custom UIs)
     */
    static createGameHeader(config) {
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const title = document.createElement('h2');
        title.className = 'game-title';
        title.textContent = config.title;
        header.appendChild(title);
        
        if (config.description) {
            const description = document.createElement('p');
            description.className = 'game-description';
            description.textContent = config.description;
            header.appendChild(description);
        }
        
        // Add contract info section
        if (config.contractAddress) {
            const contractInfo = ContractInfoRenderer.createContractInfo(config.contractAddress, config.sourceFile, config.abiFile);
            header.appendChild(contractInfo);
        }
        
        return header;
    }
    
    /**
     * Create modern game interface structure with new component system
     */
    static createGameInterface(config) {
        const container = document.createElement('div');
        container.className = 'game-interface';
        
        // Add header
        container.appendChild(this.createGameHeader(config));
        
        // Game state bar (universal across all games)
        const gameStateBar = this.createGameStateBar(config);
        container.appendChild(gameStateBar);
        
        // Input section - simplified for wei-only input
        const inputSection = this.createWeiInputSection(config);
        container.appendChild(inputSection);
        
        return container;
    }
    
    /**
     * Create universal game state bar
     */
    static createGameStateBar(config) {
        const stateBar = document.createElement('div');
        stateBar.className = 'game-state-bar';
        stateBar.id = 'game-state-bar';
        
        stateBar.innerHTML = `
            <div class="state-item">
                <div class="state-label">Round Progress</div>
                <div class="state-value" id="round-progress">0/10</div>
            </div>
            <div class="state-item">
                <div class="state-label">Prize Pool (99%)</div>
                <div class="state-value" id="prize-pool">0 wei</div>
            </div>
            <div class="state-item">
                <div class="state-label">Remaining</div>
                <div class="state-value" id="plays-remaining">10 plays</div>
            </div>
        `;
        
        return stateBar;
    }
    
    /**
     * Update game state bar
     */
    static updateGameStateBar(data) {
        const progressEl = document.getElementById('round-progress');
        const prizeEl = document.getElementById('prize-pool');
        const remainingEl = document.getElementById('plays-remaining');
        
        if (progressEl && data.playCount !== undefined) {
            progressEl.textContent = `${data.playCount}/10`;
        }
        
        if (prizeEl && data.prizePool !== undefined) {
            prizeEl.textContent = `${Math.round(data.prizePool).toLocaleString()} wei`;
        }
        
        if (remainingEl && data.playCount !== undefined) {
            const remaining = 10 - data.playCount;
            remainingEl.textContent = `${remaining} play${remaining !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Create wei-only input section (the amount IS the play)
     */
    static createWeiInputSection(config) {
        const section = document.createElement('div');
        section.className = 'wei-input-section';
        
        const explanation = document.createElement('div');
        explanation.className = 'input-explanation';
        explanation.innerHTML = `
            <strong>💡 How to Play:</strong> The wei amount you send IS your play value. 
            There is no separate bet and guess.
        `;
        section.appendChild(explanation);
        
        // Wei input group
        const inputGroup = document.createElement('div');
        inputGroup.className = 'wei-input-group';
        
        const label = document.createElement('label');
        label.textContent = 'Your Play Amount (Wei)';
        label.setAttribute('for', 'play-wei');
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'play-wei';
        input.className = 'wei-input';
        input.placeholder = 'Enter wei amount...';
        input.min = '0';
        input.step = '1';
        
        const ethConversion = document.createElement('div');
        ethConversion.className = 'eth-conversion';
        ethConversion.id = 'eth-conversion';
        ethConversion.textContent = '= 0 ETH';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputGroup.appendChild(ethConversion);
        
        // Quick amount buttons
        const quickAmounts = document.createElement('div');
        quickAmounts.className = 'quick-amounts';
        
        const amounts = [
            { label: '100K', value: 100000 },
            { label: '500K', value: 500000 },
            { label: '1M', value: 1000000 },
            { label: '5M', value: 5000000 },
            { label: '10M', value: 10000000 }
        ];
        
        amounts.forEach(amt => {
            const btn = document.createElement('button');
            btn.className = 'quick-amount-btn';
            btn.textContent = amt.label;
            btn.type = 'button';
            btn.onclick = () => {
                input.value = amt.value;
                input.dispatchEvent(new Event('input'));
            };
            quickAmounts.appendChild(btn);
        });
        
        section.appendChild(inputGroup);
        section.appendChild(quickAmounts);
        
        // Play button
        const playButton = document.createElement('button');
        playButton.className = 'btn-play';
        playButton.textContent = '🎮 Play';
        playButton.id = 'play-button';
        playButton.type = 'button';
        
        section.appendChild(playButton);
        
        // Setup real-time ETH conversion
        input.addEventListener('input', () => {
            const wei = parseFloat(input.value) || 0;
            const eth = wei / 1e18;
            ethConversion.textContent = `≈ ${eth.toFixed(9)} ETH`;
        });
        
        return section;
    }


    /**
     * Show loading state
     */
    static setLoading(isLoading) {
        const button = document.getElementById('play-button');
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.textContent = '⏳ Processing...';
        } else {
            button.disabled = false;
            button.textContent = '🎮 Play';
        }
    }

    /**
     * Show toast notification
     */
    static showToast(message, type = 'info') {
        eventBus.emit(EVENTS.TOAST, { message, type });
    }
}

