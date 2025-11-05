/**
 * Donation Chart Component
 * Visual bar chart representation of donations
 */

export class DonationChart {
    /**
     * Render donation chart
     * @param {Array} donations - Array of donation objects
     * @param {string} currentAddress - User's wallet address
     * @param {string} currentLeader - Address of current leader
     */
    static render(donations, currentAddress, currentLeader) {
        const container = document.createElement('div');
        container.className = 'donation-chart-container';
        
        const header = document.createElement('h3');
        header.textContent = '📈 Donation Visualization';
        container.appendChild(header);
        
        if (donations.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No donations to display.';
            container.appendChild(emptyState);
            return container;
        }
        
        // Get max amount for scaling
        const maxAmount = Math.max(...donations.map(d => d.weiAmount));
        
        // Create chart
        const chart = document.createElement('div');
        chart.className = 'donation-chart';
        
        // Sort by donation number (chronological)
        const sortedDonations = [...donations].sort((a, b) => a.donation_number - b.donation_number);
        
        sortedDonations.forEach(donation => {
            const barContainer = document.createElement('div');
            barContainer.className = 'bar-container';
            
            // Calculate percentage
            const percentage = (donation.weiAmount / maxAmount) * 100;
            
            // Determine bar color
            const isYou = donation.address.toLowerCase() === currentAddress?.toLowerCase();
            const isLeader = donation.address.toLowerCase() === currentLeader?.toLowerCase();
            
            let barClass = 'bar';
            if (isLeader) {
                barClass += ' bar-leader';
            } else if (isYou) {
                barClass += ' bar-you';
            }
            
            // Create bar
            const bar = document.createElement('div');
            bar.className = barClass;
            bar.style.width = `${percentage}%`;
            bar.style.minWidth = '30px'; // Ensure small amounts are visible
            
            // Bar content
            const barContent = document.createElement('div');
            barContent.className = 'bar-content';
            barContent.innerHTML = `
                <span class="bar-label">#${donation.donation_number}</span>
                <span class="bar-amount">${Math.round(donation.weiAmount).toLocaleString()} wei</span>
                <span class="bar-donor">${this.formatAddress(donation.address)}${isYou ? ' (YOU)' : ''}${isLeader ? ' 👑' : ''}</span>
            `;
            
            bar.appendChild(barContent);
            barContainer.appendChild(bar);
            chart.appendChild(barContainer);
        });
        
        container.appendChild(chart);
        
        // Add legend
        const legend = document.createElement('div');
        legend.className = 'chart-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color bar-leader"></span>
                <span>Current Leader</span>
            </div>
            <div class="legend-item">
                <span class="legend-color bar-you"></span>
                <span>Your Donations</span>
            </div>
            <div class="legend-item">
                <span class="legend-color bar"></span>
                <span>Other Donations</span>
            </div>
        `;
        container.appendChild(legend);
        
        return container;
    }
    
    /**
     * Format address for display
     */
    static formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    /**
     * Update existing chart
     */
    static update(donations, currentAddress, currentLeader) {
        const container = document.querySelector('.donation-chart-container');
        if (container) {
            const newContainer = this.render(donations, currentAddress, currentLeader);
            container.replaceWith(newContainer);
        }
    }
}

