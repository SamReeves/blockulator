/**
 * StatisticsPanel Components
 * Game-specific statistical displays
 */

export class StatisticsPanel {
    /**
     * Render statistics for Pissing Contest
     */
    static renderPissingContest(plays, currentUserAddress) {
        const container = document.createElement('div');
        container.className = 'statistics-panel pissing-contest-stats';
        
        const title = document.createElement('h3');
        title.textContent = '💦 Current Leader';
        container.appendChild(title);
        
        if (plays.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'stats-empty';
            emptyState.textContent = 'No plays yet. First player sets the pace!';
            container.appendChild(emptyState);
            return container;
        }
        
        // Find max play
        const maxPlay = plays.reduce((max, play) => 
            play.weiAmount > max.weiAmount ? play : max
        );
        
        // Leader info
        const leaderCard = document.createElement('div');
        leaderCard.className = 'leader-card';
        
        const leaderAddress = document.createElement('div');
        leaderAddress.className = 'leader-address';
        leaderAddress.textContent = this.formatAddress(maxPlay.address);
        
        const leaderAmount = document.createElement('div');
        leaderAmount.className = 'leader-amount';
        leaderAmount.textContent = `${parseInt(maxPlay.weiAmount).toLocaleString()} wei`;
        
        const leaderEth = document.createElement('div');
        leaderEth.className = 'leader-eth';
        leaderEth.textContent = `≈ ${(parseFloat(maxPlay.weiAmount) / 1e18).toFixed(6)} ETH`;
        
        leaderCard.appendChild(leaderAddress);
        leaderCard.appendChild(leaderAmount);
        leaderCard.appendChild(leaderEth);
        container.appendChild(leaderCard);
        
        // Current user's position
        const userPlay = plays.find(p => 
            p.address.toLowerCase() === currentUserAddress?.toLowerCase()
        );
        
        if (userPlay) {
            const userStatus = document.createElement('div');
            userStatus.className = 'user-status';
            
            const isWinning = userPlay.weiAmount >= maxPlay.weiAmount;
            const statusIcon = isWinning ? '✅' : '❌';
            const statusText = isWinning ? 'WINNING' : 'LOSING';
            const diff = userPlay.weiAmount - maxPlay.weiAmount;
            
            userStatus.innerHTML = `
                <div class="status-header">YOUR PLAY</div>
                <div class="status-amount">${parseInt(userPlay.weiAmount).toLocaleString()} wei</div>
                <div class="status-result ${isWinning ? 'winning' : 'losing'}">
                    ${statusIcon} ${statusText} ${!isWinning ? `(${diff.toLocaleString()} behind)` : ''}
                </div>
            `;
            
            container.appendChild(userStatus);
            
            if (!isWinning) {
                const suggestion = document.createElement('div');
                suggestion.className = 'strategic-suggestion';
                suggestion.innerHTML = `
                    <div class="suggestion-icon">💡</div>
                    <div>To win, play more than ${parseInt(maxPlay.weiAmount).toLocaleString()} wei</div>
                `;
                container.appendChild(suggestion);
            }
        }
        
        return container;
    }
    
    /**
     * Render statistics for Mean Whale
     */
    static renderMeanWhale(plays, currentUserAddress) {
        const container = document.createElement('div');
        container.className = 'statistics-panel mean-whale-stats';
        
        const title = document.createElement('h3');
        title.textContent = '🐳 Mean Statistics';
        container.appendChild(title);
        
        if (plays.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'stats-empty';
            emptyState.textContent = 'No plays yet. The mean awaits!';
            container.appendChild(emptyState);
            return container;
        }
        
        // Calculate statistics
        const amounts = plays.map(p => parseFloat(p.weiAmount));
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        
        // Find closest to mean
        const distances = plays.map(p => ({
            ...p,
            distance: Math.abs(parseFloat(p.weiAmount) - mean)
        }));
        distances.sort((a, b) => a.distance - b.distance);
        const currentWinner = distances[0];
        
        // Stats display
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        statsGrid.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Current Mean</div>
                <div class="stat-value">${Math.round(mean).toLocaleString()} wei</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Std Deviation</div>
                <div class="stat-value">${Math.round(stdDev).toLocaleString()} wei</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Range</div>
                <div class="stat-value">${Math.round(min).toLocaleString()} - ${Math.round(max).toLocaleString()}</div>
            </div>
        `;
        container.appendChild(statsGrid);
        
        // Current winner
        const winnerCard = document.createElement('div');
        winnerCard.className = 'winner-card';
        winnerCard.innerHTML = `
            <div class="winner-header">CURRENT LEADER</div>
            <div class="winner-address">${this.formatAddress(currentWinner.address)}</div>
            <div class="winner-amount">${parseInt(currentWinner.weiAmount).toLocaleString()} wei</div>
            <div class="winner-distance">Distance: ${Math.round(currentWinner.distance).toLocaleString()} wei</div>
        `;
        container.appendChild(winnerCard);
        
        // User's position
        const userPlay = plays.find(p => 
            p.address.toLowerCase() === currentUserAddress?.toLowerCase()
        );
        
        if (userPlay) {
            const userDistance = Math.abs(parseFloat(userPlay.weiAmount) - mean);
            const userRank = distances.findIndex(p => 
                p.address.toLowerCase() === currentUserAddress?.toLowerCase()
            ) + 1;
            const isWinning = userRank === 1;
            
            const userStatus = document.createElement('div');
            userStatus.className = 'user-status';
            userStatus.innerHTML = `
                <div class="status-header">YOUR PLAY</div>
                <div class="status-amount">${parseInt(userPlay.weiAmount).toLocaleString()} wei</div>
                <div class="status-distance">Distance from mean: ${Math.round(userDistance).toLocaleString()} wei</div>
                <div class="status-result ${isWinning ? 'winning' : 'losing'}">
                    ${isWinning ? '✅' : '❌'} Rank ${userRank}/${plays.length} ${isWinning ? '- WINNING' : ''}
                </div>
            `;
            container.appendChild(userStatus);
            
            // Strategic suggestion
            if (!isWinning) {
                const targetLow = mean - currentWinner.distance;
                const targetHigh = mean + currentWinner.distance;
                const suggestion = document.createElement('div');
                suggestion.className = 'strategic-suggestion';
                suggestion.innerHTML = `
                    <div class="suggestion-icon">💡</div>
                    <div>To win, play between ${Math.round(targetLow).toLocaleString()} - ${Math.round(targetHigh).toLocaleString()} wei<br>
                    <small>(closer to mean than current leader)</small></div>
                `;
                container.appendChild(suggestion);
            }
        }
        
        return container;
    }
    
    /**
     * Render statistics for Median Whale
     */
    static renderMedianWhale(plays, currentUserAddress) {
        const container = document.createElement('div');
        container.className = 'statistics-panel median-whale-stats';
        
        const title = document.createElement('h3');
        title.textContent = '🐋 Median Analysis';
        container.appendChild(title);
        
        if (plays.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'stats-empty';
            emptyState.textContent = 'No plays yet. Find the middle!';
            container.appendChild(emptyState);
            return container;
        }
        
        // Calculate median
        const sortedAmounts = [...plays].sort((a, b) => a.weiAmount - b.weiAmount);
        const midIndex = Math.floor(sortedAmounts.length / 2);
        const median = sortedAmounts.length % 2 === 0
            ? (parseFloat(sortedAmounts[midIndex - 1].weiAmount) + parseFloat(sortedAmounts[midIndex].weiAmount)) / 2
            : parseFloat(sortedAmounts[midIndex].weiAmount);
        
        // Count winners (above median)
        const winners = plays.filter(p => parseFloat(p.weiAmount) > median);
        const losers = plays.filter(p => parseFloat(p.weiAmount) <= median);
        
        // Stats display
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        statsGrid.innerHTML = `
            <div class="stat-item highlight">
                <div class="stat-label">Current Median</div>
                <div class="stat-value">${Math.round(median).toLocaleString()} wei</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Winners (Above)</div>
                <div class="stat-value winning">${winners.length} players</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Losers (Below)</div>
                <div class="stat-value losing">${losers.length} players</div>
            </div>
        `;
        container.appendChild(statsGrid);
        
        // Prize split
        if (winners.length > 0) {
            const totalPot = plays.reduce((sum, p) => sum + parseFloat(p.weiAmount), 0);
            const prizePool = totalPot * 0.99;
            const prizePerWinner = prizePool / winners.length;
            
            const prizeCard = document.createElement('div');
            prizeCard.className = 'prize-card';
            prizeCard.innerHTML = `
                <div class="prize-label">Prize Per Winner</div>
                <div class="prize-amount">${Math.round(prizePerWinner).toLocaleString()} wei</div>
                <div class="prize-subtitle">${Math.round(prizePool).toLocaleString()} wei ÷ ${winners.length} winners</div>
            `;
            container.appendChild(prizeCard);
        }
        
        // Visual median line
        const medianVisual = document.createElement('div');
        medianVisual.className = 'median-visual';
        
        const loserSection = document.createElement('div');
        loserSection.className = 'visual-section losing-section';
        loserSection.innerHTML = `
            <div class="section-label">⬇️ LOSING (${losers.length})</div>
            <div class="section-values">${losers.map(p => Math.round(p.weiAmount / 1000) + 'K').join(', ')}</div>
        `;
        
        const medianLine = document.createElement('div');
        medianLine.className = 'median-line';
        medianLine.innerHTML = `<div class="median-marker">↑ MEDIAN: ${Math.round(median).toLocaleString()} wei ↑</div>`;
        
        const winnerSection = document.createElement('div');
        winnerSection.className = 'visual-section winning-section';
        winnerSection.innerHTML = `
            <div class="section-label">⬆️ WINNING (${winners.length})</div>
            <div class="section-values">${winners.map(p => Math.round(p.weiAmount / 1000) + 'K').join(', ')}</div>
        `;
        
        medianVisual.appendChild(loserSection);
        medianVisual.appendChild(medianLine);
        medianVisual.appendChild(winnerSection);
        container.appendChild(medianVisual);
        
        // User's position
        const userPlay = plays.find(p => 
            p.address.toLowerCase() === currentUserAddress?.toLowerCase()
        );
        
        if (userPlay) {
            const isWinning = parseFloat(userPlay.weiAmount) > median;
            const userStatus = document.createElement('div');
            userStatus.className = 'user-status';
            userStatus.innerHTML = `
                <div class="status-header">YOUR PLAY</div>
                <div class="status-amount">${parseInt(userPlay.weiAmount).toLocaleString()} wei</div>
                <div class="status-result ${isWinning ? 'winning' : 'losing'}">
                    ${isWinning ? '✅ ABOVE MEDIAN - WINNING' : '❌ BELOW MEDIAN - LOSING'}
                </div>
            `;
            container.appendChild(userStatus);
            
            if (!isWinning) {
                const suggestion = document.createElement('div');
                suggestion.className = 'strategic-suggestion';
                suggestion.innerHTML = `
                    <div class="suggestion-icon">💡</div>
                    <div>To win, play more than ${Math.round(median).toLocaleString()} wei</div>
                `;
                container.appendChild(suggestion);
            }
        }
        
        return container;
    }
    
    // Utility
    static formatAddress(address) {
        if (!address) return 'Unknown';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}




