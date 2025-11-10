/**
 * BarGraph3D Component - CSS 3D Transform Bar Graph
 * Displays donations/plays as 3D bars with interactive hover effects
 * Following the same architectural pattern as DiceThreeD
 */

export class BarGraph3D {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.data = []; // Array of { address, value, label, badge }
        this.maxBars = options.maxBars || 10;
        this.colorScheme = options.colorScheme || 'gradient';
        this.onBarClick = options.onBarClick || (() => {});
        this.onBarHover = options.onBarHover || (() => {});
        
        // 3D perspective settings
        this.perspective = options.perspective || 1200;
        this.rotationX = options.rotationX || -15;
        this.rotationY = options.rotationY || 25;
        
        this.sceneElement = null;
        this.barsContainer = null;
        this.isAnimating = false;
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
        this.sceneElement = container.querySelector('.bar-graph-scene');
        this.barsContainer = container.querySelector('.bars-container');
        
        this.attachEventListeners();
        this.updateRotation();
    }
    
    getHTML() {
        return `
            <div class="bar-graph-scene" style="
                width: 100%;
                height: 350px;
                position: relative;
                display: flex;
                align-items: flex-end;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.02);
                border-radius: 8px;
            ">
                <div class="bars-container" style="
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    gap: 1rem;
                ">
                    <!-- Bars will be rendered here -->
                </div>
            </div>
            
            <!-- Value axis and legend -->
            <div class="graph-legend" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 0.5rem;
                padding: 0 1rem;
                font-size: 0.75rem;
                color: var(--md-sys-color-on-surface-variant);
            ">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 600;">Range:</span>
                    <span id="min-value">0</span>
                    <span>→</span>
                    <span id="max-value">Loading...</span>
                </div>
                <div style="font-size: 0.7rem; opacity: 0.7;">
                    Hover to highlight • Top 10 largest
                </div>
            </div>
        `;
    }
    
    /**
     * Update the graph with new data
     * @param {Array} data - Array of { address, value, label, isCurrentUser, badge }
     */
    setData(data) {
        this.data = data.slice(0, this.maxBars);
        this.render();
    }
    
    render() {
        if (!this.barsContainer) return;
        
        // Clear existing bars
        this.barsContainer.innerHTML = '';
        
        if (this.data.length === 0) {
            this.barsContainer.innerHTML = `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: var(--md-sys-color-on-surface-variant);
                    font-size: 1rem;
                ">
                    <div style="font-size: 3rem; opacity: 0.3; margin-bottom: 0.5rem;">📊</div>
                    <div>No donations yet</div>
                </div>
            `;
            return;
        }
        
        // Find max value for scaling
        const maxValue = Math.max(...this.data.map(d => Number(d.value)));
        const minValue = Math.min(...this.data.map(d => Number(d.value)));
        
        // Update legend
        document.getElementById('max-value').textContent = this.formatValue(maxValue);
        document.getElementById('min-value').textContent = this.formatValue(minValue);
        
        // Render each bar
        this.data.forEach((item, index) => {
            const barHeight = (Number(item.value) / maxValue) * 85; // percentage of container height
            
            const bar = this.createBar({
                data: item,
                height: Math.max(barHeight, 5), // Minimum 5% height
                index,
                color: this.getBarColor(index, item.isCurrentUser),
                rank: index + 1
            });
            
            this.barsContainer.appendChild(bar);
        });
    }
    
    createBar({ data, height, index, color, rank }) {
        const bar = document.createElement('div');
        bar.className = 'bar-3d';
        bar.dataset.address = data.address;
        bar.dataset.index = index;
        bar.dataset.rank = rank;
        
        // Medal emoji for top 3
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        
        // Simple 2D bar with more width
        bar.style.cssText = `
            position: relative;
            flex: 1;
            min-width: 70px;
            max-width: 120px;
            height: ${height}%;
            transition: all 0.3s ease;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 0.75rem 0.5rem;
            box-sizing: border-box;
            background: linear-gradient(180deg, ${color} 0%, ${color}dd 100%);
            border: 2px solid ${color};
            border-radius: 8px 8px 0 0;
            box-shadow: 0 2px 8px ${color}44;
        `;
        
        // Medal at very top
        if (medal) {
            const medalSpan = document.createElement('div');
            medalSpan.textContent = medal;
            medalSpan.style.cssText = `
                font-size: 2rem;
                line-height: 1;
                margin-bottom: 0.5rem;
            `;
            bar.appendChild(medalSpan);
        }
        
        // Value below medal
        const valueDiv = document.createElement('div');
        valueDiv.className = 'bar-value';
        valueDiv.textContent = this.formatValue(data.value);
        valueDiv.style.cssText = `
            font-size: 0.85rem;
            font-weight: bold;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            text-align: center;
            line-height: 1.2;
            margin-bottom: 0.5rem;
        `;
        bar.appendChild(valueDiv);
        
        // Spacer to push badge and label to bottom
        const spacer = document.createElement('div');
        spacer.style.cssText = `
            flex: 1;
            min-height: 1rem;
        `;
        bar.appendChild(spacer);
        
        // Badge and label at bottom
        const bottomSection = document.createElement('div');
        bottomSection.className = 'bar-label-section';
        bottomSection.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            margin-top: auto;
        `;
        
        // Add badge if available
        if (data.badge) {
            const badgeContainer = document.createElement('div');
            badgeContainer.style.cssText = `
                display: flex;
                justify-content: center;
            `;
            badgeContainer.appendChild(data.badge);
            bottomSection.appendChild(badgeContainer);
        }
        
        // Address label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'bar-label';
        labelDiv.textContent = data.label || `${data.address.slice(0, 4)}...${data.address.slice(-2)}`;
        labelDiv.style.cssText = `
            font-size: 0.7rem;
            color: rgba(255,255,255,0.95);
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            font-family: monospace;
        `;
        bottomSection.appendChild(labelDiv);
        
        bar.appendChild(bottomSection);
        
        return bar;
    }
    
    getBarColor(index, isCurrentUser) {
        if (isCurrentUser) {
            return '#10b981'; // Green for current user
        }
        
        // Color palette matching dice gods
        const colors = [
            '#ef4444', // red
            '#f59e0b', // amber
            '#3b82f6', // blue
            '#8b5cf6', // violet
            '#ec4899', // pink
            '#14b8a6', // teal
            '#f97316', // orange
            '#06b6d4', // cyan
            '#a855f7', // purple
            '#84cc16'  // lime
        ];
        
        return colors[index % colors.length];
    }
    
    formatValue(value) {
        // Convert wei to appropriate unit
        const num = Number(value);
        if (num >= 1e18) return `${(num / 1e18).toFixed(3)} ETH`;
        if (num >= 1e15) return `${(num / 1e15).toFixed(2)} mETH`;
        if (num >= 1e9) return `${(num / 1e9).toFixed(1)} gwei`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)} Mwei`;
        return `${num} wei`;
    }
    
    attachEventListeners() {
        // Delegate event handling to container
        this.barsContainer.addEventListener('click', (e) => {
            const bar = e.target.closest('.bar-3d');
            if (bar) {
                const address = bar.dataset.address;
                const data = this.data.find(d => d.address === address);
                this.onBarClick(data);
            }
        });
        
        this.barsContainer.addEventListener('mouseover', (e) => {
            const bar = e.target.closest('.bar-3d');
            if (bar) {
                // Simple hover effect
                bar.style.transform = 'translateY(-5px) scale(1.05)';
                bar.style.filter = 'brightness(1.15)';
                bar.style.zIndex = '100';
                
                const address = bar.dataset.address;
                const data = this.data.find(d => d.address === address);
                this.onBarHover(data);
            }
        });
        
        this.barsContainer.addEventListener('mouseout', (e) => {
            const bar = e.target.closest('.bar-3d');
            if (bar) {
                bar.style.transform = '';
                bar.style.filter = '';
                bar.style.zIndex = '';
            }
        });
    }
    
    updateRotation() {
        // No rotation needed for 2D view
    }
    
    destroy() {
        // Cleanup event listeners if needed
        if (this.barsContainer) {
            this.barsContainer.innerHTML = '';
        }
        this.sceneElement = null;
        this.barsContainer = null;
    }
}

