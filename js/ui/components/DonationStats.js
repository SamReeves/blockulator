/**
 * Donation Statistics Component
 * Displays aggregate statistics about donations
 */

export class DonationStats {
    /**
     * Render statistics panel
     * @param {Array} donations - Array of donation objects
     * @param {string} currentAddress - User's wallet address
     * @param {Object} contestInfo - Contest information
     */
    static render(donations, currentAddress, contestInfo) {
        const container = document.createElement('div');
        container.className = 'donation-stats-container';
        
        const header = document.createElement('h3');
        header.textContent = '📊 Donation Statistics';
        container.appendChild(header);
        
        if (donations.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No donations yet.';
            container.appendChild(emptyState);
            return container;
        }
        
        // Calculate stats
        const stats = this.calculateStats(donations, currentAddress);
        
        // Create stats grid
        const grid = document.createElement('div');
        grid.className = 'stats-grid';
        
        // Total Donations
        grid.appendChild(this.createStatCard(
            'Total Donations',
            donations.length,
            ''
        ));
        
        // Average Donation
        grid.appendChild(this.createStatCard(
            'Average Donation',
            Math.round(stats.average).toLocaleString(),
            'wei'
        ));
        
        // Highest Donation
        grid.appendChild(this.createStatCard(
            'Highest Donation',
            Math.round(stats.highest).toLocaleString(),
            'wei',
            '👑'
        ));
        
        // Your Total
        if (stats.yourTotal > 0) {
            grid.appendChild(this.createStatCard(
                'Your Total',
                Math.round(stats.yourTotal).toLocaleString(),
                'wei',
                '💰'
            ));
        }
        
        // Your Position
        if (stats.yourPosition > 0) {
            grid.appendChild(this.createStatCard(
                'Your Position',
                this.getPositionText(stats.yourPosition, donations.length),
                '',
                stats.yourPosition === 1 ? '🥇' : (stats.yourPosition === 2 ? '🥈' : '🥉')
            ));
        }
        
        container.appendChild(grid);
        
        return container;
    }
    
    /**
     * Calculate statistics from donations
     */
    static calculateStats(donations, currentAddress) {
        const amounts = donations.map(d => d.weiAmount);
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        const average = total / donations.length;
        const highest = Math.max(...amounts);
        
        // Get user's donations
        const userDonations = donations.filter(
            d => d.address.toLowerCase() === currentAddress?.toLowerCase()
        );
        const yourTotal = userDonations.reduce((sum, d) => sum + d.weiAmount, 0);
        
        // Calculate position (by highest single donation)
        const userHighest = userDonations.length > 0 
            ? Math.max(...userDonations.map(d => d.weiAmount))
            : 0;
        
        // Find unique donors and their highest donations
        const donorMap = new Map();
        donations.forEach(d => {
            const existing = donorMap.get(d.address.toLowerCase()) || 0;
            donorMap.set(d.address.toLowerCase(), Math.max(existing, d.weiAmount));
        });
        
        // Sort by highest donation
        const sortedDonors = Array.from(donorMap.entries())
            .sort((a, b) => b[1] - a[1]);
        
        const yourPosition = sortedDonors.findIndex(
            ([addr]) => addr === currentAddress?.toLowerCase()
        ) + 1;
        
        return {
            total,
            average,
            highest,
            yourTotal,
            yourPosition
        };
    }
    
    /**
     * Create a stat card
     */
    static createStatCard(label, value, unit, emoji = '') {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        card.innerHTML = `
            <div class="stat-label">${label}</div>
            <div class="stat-value">
                ${emoji ? `<span class="stat-emoji">${emoji}</span>` : ''}
                ${value}${unit ? ` ${unit}` : ''}
            </div>
        `;
        
        return card;
    }
    
    /**
     * Get position text with suffix
     */
    static getPositionText(position, total) {
        const suffix = ['th', 'st', 'nd', 'rd'][position > 3 ? 0 : position];
        return `${position}${suffix} of ${total}`;
    }
    
    /**
     * Update existing stats
     */
    static update(donations, currentAddress, contestInfo) {
        const container = document.querySelector('.donation-stats-container');
        if (container) {
            const newContainer = this.render(donations, currentAddress, contestInfo);
            container.replaceWith(newContainer);
        }
    }
}


