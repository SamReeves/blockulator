/**
 * VisualDistribution Component
 * Graphical representation of play distributions
 */

export class VisualDistribution {
    /**
     * Render distribution chart
     * @param {Array} plays - Array of plays
     * @param {string} gameType - Type of game
     * @param {number} highlightValue - Value to highlight (e.g., mean, median, user's play)
     */
    static render(plays, gameType, highlightValue = null) {
        const container = document.createElement('div');
        container.className = 'visual-distribution';
        
        if (plays.length === 0) {
            container.innerHTML = '<p class="distribution-empty">No plays to visualize yet</p>';
            return container;
        }
        
        const title = document.createElement('h3');
        title.textContent = '📊 Distribution';
        container.appendChild(title);
        
        // Create histogram
        const histogram = this.createHistogram(plays, highlightValue, gameType);
        container.appendChild(histogram);
        
        return container;
    }
    
    /**
     * Create histogram visualization
     */
    static createHistogram(plays, highlightValue, gameType) {
        const histogramContainer = document.createElement('div');
        histogramContainer.className = 'histogram-container';
        
        const amounts = plays.map(p => parseFloat(p.weiAmount));
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        const range = max - min;
        
        // Create bins
        const numBins = Math.min(10, plays.length);
        const binSize = range / numBins;
        const bins = Array(numBins).fill(0);
        const binLabels = [];
        
        // Fill bins
        amounts.forEach(amount => {
            const binIndex = Math.min(
                Math.floor((amount - min) / binSize),
                numBins - 1
            );
            bins[binIndex]++;
        });
        
        // Create labels
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            binLabels.push(Math.round(binStart));
        }
        
        const maxBinValue = Math.max(...bins);
        
        // Chart
        const chart = document.createElement('div');
        chart.className = 'histogram-chart';
        
        bins.forEach((count, index) => {
            const bar = document.createElement('div');
            bar.className = 'histogram-bar-container';
            
            const barFill = document.createElement('div');
            barFill.className = 'histogram-bar';
            const height = maxBinValue > 0 ? (count / maxBinValue) * 100 : 0;
            barFill.style.height = `${height}%`;
            
            const countLabel = document.createElement('div');
            countLabel.className = 'bar-count';
            countLabel.textContent = count || '';
            
            const binLabel = document.createElement('div');
            binLabel.className = 'bar-label';
            binLabel.textContent = this.formatWeiShort(binLabels[index]);
            
            bar.appendChild(countLabel);
            bar.appendChild(barFill);
            bar.appendChild(binLabel);
            chart.appendChild(bar);
        });
        
        histogramContainer.appendChild(chart);
        
        // Add markers for special values
        if (highlightValue !== null) {
            const marker = this.createMarker(highlightValue, min, max, gameType);
            histogramContainer.appendChild(marker);
        }
        
        return histogramContainer;
    }
    
    /**
     * Create marker for mean/median/etc
     */
    static createMarker(value, min, max, gameType) {
        const marker = document.createElement('div');
        marker.className = 'distribution-marker';
        
        const position = ((value - min) / (max - min)) * 100;
        marker.style.left = `${position}%`;
        
        let label = '';
        switch (gameType) {
            case 'mean-whale':
                label = '📍 Mean';
                break;
            case 'median-whale':
                label = '📍 Median';
                break;
            default:
                label = '📍 Target';
        }
        
        marker.innerHTML = `
            <div class="marker-line"></div>
            <div class="marker-label">${label}: ${this.formatWeiShort(value)}</div>
        `;
        
        return marker;
    }
    
    /**
     * Render scatter plot (alternative visualization)
     */
    static renderScatter(plays, currentUserAddress, highlightValue = null) {
        const container = document.createElement('div');
        container.className = 'scatter-plot';
        
        if (plays.length === 0) {
            container.innerHTML = '<p class="distribution-empty">No plays to visualize yet</p>';
            return container;
        }
        
        const amounts = plays.map(p => parseFloat(p.weiAmount));
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        
        const plotArea = document.createElement('div');
        plotArea.className = 'scatter-plot-area';
        
        plays.forEach((play, index) => {
            const amount = parseFloat(play.weiAmount);
            const position = ((amount - min) / (max - min)) * 100;
            
            const point = document.createElement('div');
            point.className = 'scatter-point';
            point.style.left = `${position}%`;
            point.style.bottom = `${(index * 10) % 80 + 10}%`; // Stagger vertically
            
            const isUser = currentUserAddress && 
                play.address.toLowerCase() === currentUserAddress.toLowerCase();
            
            if (isUser) {
                point.classList.add('user-point');
            }
            
            point.title = `${this.formatAddress(play.address)}: ${this.formatWeiShort(amount)}`;
            
            plotArea.appendChild(point);
        });
        
        // Add highlight line
        if (highlightValue !== null) {
            const highlightLine = document.createElement('div');
            highlightLine.className = 'scatter-highlight-line';
            const position = ((highlightValue - min) / (max - min)) * 100;
            highlightLine.style.left = `${position}%`;
            plotArea.appendChild(highlightLine);
        }
        
        container.appendChild(plotArea);
        
        // Axis
        const axis = document.createElement('div');
        axis.className = 'scatter-axis';
        axis.innerHTML = `
            <span>${this.formatWeiShort(min)}</span>
            <span>${this.formatWeiShort((min + max) / 2)}</span>
            <span>${this.formatWeiShort(max)}</span>
        `;
        container.appendChild(axis);
        
        return container;
    }
    
    /**
     * Render number line (simple linear view)
     */
    static renderNumberLine(plays, currentUserAddress, highlightValue = null) {
        const container = document.createElement('div');
        container.className = 'number-line';
        
        if (plays.length === 0) {
            return container;
        }
        
        const amounts = plays.map(p => parseFloat(p.weiAmount));
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        
        const line = document.createElement('div');
        line.className = 'number-line-track';
        
        // Add highlight marker
        if (highlightValue !== null) {
            const marker = document.createElement('div');
            marker.className = 'number-line-marker highlight-marker';
            const position = ((highlightValue - min) / (max - min)) * 100;
            marker.style.left = `${position}%`;
            marker.textContent = '▼';
            line.appendChild(marker);
        }
        
        // Add play markers
        plays.forEach(play => {
            const amount = parseFloat(play.weiAmount);
            const position = ((amount - min) / (max - min)) * 100;
            
            const marker = document.createElement('div');
            marker.className = 'number-line-marker play-marker';
            marker.style.left = `${position}%`;
            
            const isUser = currentUserAddress && 
                play.address.toLowerCase() === currentUserAddress.toLowerCase();
            
            if (isUser) {
                marker.classList.add('user-marker');
                marker.textContent = '👤';
            } else {
                marker.textContent = '●';
            }
            
            marker.title = `${this.formatAddress(play.address)}: ${this.formatWeiShort(amount)}`;
            
            line.appendChild(marker);
        });
        
        container.appendChild(line);
        
        // Labels
        const labels = document.createElement('div');
        labels.className = 'number-line-labels';
        labels.innerHTML = `
            <span>${this.formatWeiShort(min)}</span>
            <span>${this.formatWeiShort(max)}</span>
        `;
        container.appendChild(labels);
        
        return container;
    }
    
    // Utilities
    static formatWeiShort(wei) {
        const num = Math.round(wei);
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}K`;
        }
        return num.toString();
    }
    
    static formatAddress(address) {
        if (!address) return 'Unknown';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}


