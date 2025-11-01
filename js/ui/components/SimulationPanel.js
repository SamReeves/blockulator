/**
 * SimulationPanel Component
 * Allows users to test plays before committing
 */

export class SimulationPanel {
    /**
     * Create simulation panel
     * @param {string} gameType - 'pissing-contest', 'mean-whale', or 'median-whale'
     */
    static render(gameType) {
        const container = document.createElement('div');
        container.className = 'simulation-panel';
        container.id = 'simulation-panel';
        
        const header = document.createElement('div');
        header.className = 'simulation-header';
        
        const title = document.createElement('h3');
        title.textContent = '🔮 Simulate Your Play';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'simulation-close';
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        container.appendChild(header);
        
        const inputSection = document.createElement('div');
        inputSection.className = 'simulation-input';
        
        const label = document.createElement('label');
        label.textContent = 'Test Amount (Wei)';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'simulation-wei-input';
        input.className = 'simulation-wei-input';
        input.placeholder = 'Enter wei amount...';
        input.min = '0';
        
        const quickButtons = document.createElement('div');
        quickButtons.className = 'quick-amounts';
        
        const amounts = [
            { label: '100K', value: 100000 },
            { label: '500K', value: 500000 },
            { label: '1M', value: 1000000 },
            { label: '5M', value: 5000000 }
        ];
        
        amounts.forEach(amt => {
            const btn = document.createElement('button');
            btn.className = 'quick-amount-btn';
            btn.textContent = amt.label;
            btn.onclick = () => {
                input.value = amt.value;
                input.dispatchEvent(new Event('input'));
            };
            quickButtons.appendChild(btn);
        });
        
        inputSection.appendChild(label);
        inputSection.appendChild(input);
        inputSection.appendChild(quickButtons);
        container.appendChild(inputSection);
        
        const resultsSection = document.createElement('div');
        resultsSection.className = 'simulation-results';
        resultsSection.id = 'simulation-results';
        resultsSection.innerHTML = '<p class="simulation-placeholder">Enter an amount to see results</p>';
        container.appendChild(resultsSection);
        
        const actions = document.createElement('div');
        actions.className = 'simulation-actions';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'btn-play-simulated';
        playBtn.textContent = '🎮 Play This Amount';
        playBtn.id = 'play-simulated-btn';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel-simulation';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => this.hide();
        
        actions.appendChild(playBtn);
        actions.appendChild(cancelBtn);
        container.appendChild(actions);
        
        // Store game type
        container.dataset.gameType = gameType;
        
        return container;
    }
    
    /**
     * Simulate for Pissing Contest
     */
    static simulatePissingContest(amount, plays) {
        const maxPlay = plays.length > 0
            ? Math.max(...plays.map(p => parseFloat(p.weiAmount)))
            : 0;
        
        const wouldWin = amount > maxPlay;
        
        return {
            wouldWin,
            summary: wouldWin
                ? `You would become the NEW LEADER`
                : `You would NOT win (current max: ${Math.round(maxPlay).toLocaleString()} wei)`,
            details: [
                { label: 'Current Max', value: `${Math.round(maxPlay).toLocaleString()} wei` },
                { label: 'Your Play', value: `${Math.round(amount).toLocaleString()} wei` },
                { label: 'Difference', value: `${Math.round(amount - maxPlay).toLocaleString()} wei` },
                { label: 'Result', value: wouldWin ? '✅ WINNING' : '❌ LOSING', isResult: true, winning: wouldWin }
            ],
            suggestion: wouldWin
                ? '⚠️ Note: Later players can still outbid you'
                : `💡 Try playing more than ${Math.round(maxPlay).toLocaleString()} wei to win`
        };
    }
    
    /**
     * Simulate for Mean Whale
     */
    static simulateMeanWhale(amount, plays) {
        if (plays.length === 0) {
            return {
                wouldWin: true,
                summary: 'You would be the first player',
                details: [
                    { label: 'Your Play', value: `${Math.round(amount).toLocaleString()} wei` },
                    { label: 'New Mean', value: `${Math.round(amount).toLocaleString()} wei` }
                ],
                suggestion: '⚠️ As first player, you set the initial mean'
            };
        }
        
        const currentAmounts = plays.map(p => parseFloat(p.weiAmount));
        const currentMean = currentAmounts.reduce((a, b) => a + b, 0) / currentAmounts.length;
        
        // Calculate new mean with user's play
        const newAmounts = [...currentAmounts, amount];
        const newMean = newAmounts.reduce((a, b) => a + b, 0) / newAmounts.length;
        
        const userDistance = Math.abs(amount - newMean);
        
        // Find current best distance
        const currentDistances = plays.map(p => Math.abs(parseFloat(p.weiAmount) - newMean));
        const bestCurrentDistance = Math.min(...currentDistances);
        
        const wouldWin = userDistance < bestCurrentDistance;
        
        return {
            wouldWin,
            summary: wouldWin
                ? `You would be CLOSEST to the mean`
                : `You would NOT be closest to mean`,
            details: [
                { label: 'Current Mean', value: `${Math.round(currentMean).toLocaleString()} wei` },
                { label: 'New Mean (with you)', value: `${Math.round(newMean).toLocaleString()} wei` },
                { label: 'Your Distance', value: `${Math.round(userDistance).toLocaleString()} wei` },
                { label: 'Best Distance', value: `${Math.round(bestCurrentDistance).toLocaleString()} wei` },
                { label: 'Result', value: wouldWin ? '✅ WINNING' : '❌ LOSING', isResult: true, winning: wouldWin }
            ],
            suggestion: wouldWin
                ? '⚠️ Note: Later players can change the mean'
                : `💡 Try playing between ${Math.round(newMean - bestCurrentDistance).toLocaleString()} - ${Math.round(newMean + bestCurrentDistance).toLocaleString()} wei`
        };
    }
    
    /**
     * Simulate for Median Whale
     */
    static simulateMedianWhale(amount, plays) {
        if (plays.length === 0) {
            return {
                wouldWin: true,
                summary: 'You would be the first player',
                details: [
                    { label: 'Your Play', value: `${Math.round(amount).toLocaleString()} wei` }
                ],
                suggestion: '⚠️ As first player, you\'ll need to wait for others'
            };
        }
        
        // Calculate new median with user's play
        const newAmounts = [...plays.map(p => parseFloat(p.weiAmount)), amount].sort((a, b) => a - b);
        const midIndex = Math.floor(newAmounts.length / 2);
        const newMedian = newAmounts.length % 2 === 0
            ? (newAmounts[midIndex - 1] + newAmounts[midIndex]) / 2
            : newAmounts[midIndex];
        
        const wouldWin = amount > newMedian;
        const winnersCount = newAmounts.filter(a => a > newMedian).length;
        
        const totalPot = newAmounts.reduce((sum, a) => sum + a, 0);
        const prizePool = totalPot * 0.99;
        const prizePerWinner = winnersCount > 0 ? prizePool / winnersCount : 0;
        
        return {
            wouldWin,
            summary: wouldWin
                ? `You would be ABOVE the median (winning!)`
                : `You would be BELOW the median (losing)`,
            details: [
                { label: 'New Median', value: `${Math.round(newMedian).toLocaleString()} wei` },
                { label: 'Your Play', value: `${Math.round(amount).toLocaleString()} wei` },
                { label: 'Winners', value: `${winnersCount} players` },
                { label: 'Prize Per Winner', value: `${Math.round(prizePerWinner).toLocaleString()} wei` },
                { label: 'Result', value: wouldWin ? '✅ ABOVE MEDIAN' : '❌ BELOW MEDIAN', isResult: true, winning: wouldWin }
            ],
            suggestion: wouldWin
                ? `⚠️ You'd share ${Math.round(prizePerWinner).toLocaleString()} wei with ${winnersCount - 1} other winners`
                : `💡 Play more than ${Math.round(newMedian).toLocaleString()} wei to be above median`
        };
    }
    
    /**
     * Update simulation results
     */
    static updateResults(amount, plays, gameType) {
        const resultsDiv = document.getElementById('simulation-results');
        if (!resultsDiv) return;
        
        if (!amount || amount <= 0) {
            resultsDiv.innerHTML = '<p class="simulation-placeholder">Enter an amount to see results</p>';
            return;
        }
        
        let simulation;
        switch (gameType) {
            case 'pissing-contest':
                simulation = this.simulatePissingContest(amount, plays);
                break;
            case 'mean-whale':
                simulation = this.simulateMeanWhale(amount, plays);
                break;
            case 'median-whale':
                simulation = this.simulateMedianWhale(amount, plays);
                break;
            default:
                return;
        }
        
        resultsDiv.innerHTML = '';
        
        // Summary
        const summary = document.createElement('div');
        summary.className = `simulation-summary ${simulation.wouldWin ? 'winning' : 'losing'}`;
        summary.textContent = simulation.summary;
        resultsDiv.appendChild(summary);
        
        // Details
        const detailsGrid = document.createElement('div');
        detailsGrid.className = 'simulation-details';
        
        simulation.details.forEach(detail => {
            const item = document.createElement('div');
            item.className = 'simulation-detail-item';
            
            const label = document.createElement('div');
            label.className = 'detail-label';
            label.textContent = detail.label;
            
            const value = document.createElement('div');
            value.className = detail.isResult 
                ? `detail-value result-value ${detail.winning ? 'winning' : 'losing'}`
                : 'detail-value';
            value.textContent = detail.value;
            
            item.appendChild(label);
            item.appendChild(value);
            detailsGrid.appendChild(item);
        });
        
        resultsDiv.appendChild(detailsGrid);
        
        // Suggestion
        if (simulation.suggestion) {
            const suggestion = document.createElement('div');
            suggestion.className = 'simulation-suggestion';
            suggestion.textContent = simulation.suggestion;
            resultsDiv.appendChild(suggestion);
        }
    }
    
    /**
     * Setup simulation panel handlers
     */
    static setupHandlers(plays, gameType, playCallback) {
        const input = document.getElementById('simulation-wei-input');
        const playBtn = document.getElementById('play-simulated-btn');
        
        if (input) {
            input.addEventListener('input', () => {
                const amount = parseFloat(input.value);
                this.updateResults(amount, plays, gameType);
            });
        }
        
        if (playBtn && playCallback) {
            playBtn.onclick = () => {
                const amount = input?.value;
                if (amount && amount > 0) {
                    playCallback(amount);
                    this.hide();
                }
            };
        }
    }
    
    /**
     * Show simulation panel
     */
    static show() {
        const panel = document.getElementById('simulation-panel');
        if (panel) {
            panel.classList.add('visible');
        }
    }
    
    /**
     * Hide simulation panel
     */
    static hide() {
        const panel = document.getElementById('simulation-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
    }
}


