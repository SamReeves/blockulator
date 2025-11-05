/**
 * Donation History Component
 * Displays table of all donations from blockchain events
 */

export class DonationHistory {
    /**
     * Render donation history table
     * @param {Array} donations - Array of donation objects from blockchain events
     * @param {string} currentAddress - User's wallet address
     * @param {string} currentLeader - Address of current leader
     */
    static render(donations, currentAddress, currentLeader) {
        const container = document.createElement('div');
        container.className = 'donation-history-container';
        
        const header = document.createElement('h3');
        header.textContent = '🗂️ Donation History';
        container.appendChild(header);
        
        if (donations.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No donations yet. Be the first!';
            container.appendChild(emptyState);
            return container;
        }
        
        // Create table
        const table = document.createElement('table');
        table.className = 'donation-table';
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Donor</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Status</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        
        // Sort by donation number descending (newest first)
        const sortedDonations = [...donations].sort((a, b) => b.donation_number - a.donation_number);
        
        sortedDonations.forEach(donation => {
            const row = document.createElement('tr');
            const isYou = donation.address.toLowerCase() === currentAddress?.toLowerCase();
            const isLeader = donation.address.toLowerCase() === currentLeader?.toLowerCase();
            
            if (isYou) {
                row.classList.add('your-donation');
            }
            
            // Donation number
            const numCell = document.createElement('td');
            numCell.textContent = donation.donation_number;
            row.appendChild(numCell);
            
            // Donor address
            const donorCell = document.createElement('td');
            donorCell.className = 'donor-cell';
            if (isYou) {
                donorCell.innerHTML = `<strong>YOU</strong> <span class="address-hint">(${this.formatAddress(donation.address)})</span>`;
            } else {
                donorCell.textContent = this.formatAddress(donation.address);
            }
            row.appendChild(donorCell);
            
            // Amount
            const amountCell = document.createElement('td');
            amountCell.className = 'amount-cell';
            amountCell.textContent = `${Math.round(donation.weiAmount).toLocaleString()} wei`;
            row.appendChild(amountCell);
            
            // Time
            const timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            timeCell.textContent = this.formatTimestamp(donation.timestamp);
            row.appendChild(timeCell);
            
            // Status
            const statusCell = document.createElement('td');
            statusCell.className = 'status-cell';
            if (isLeader) {
                statusCell.innerHTML = '<span class="leader-badge">👑 Leader</span>';
            } else {
                statusCell.textContent = '-';
            }
            row.appendChild(statusCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        
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
     * Format timestamp to relative time
     */
    static formatTimestamp(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
    
    /**
     * Update existing table with new data
     */
    static update(donations, currentAddress, currentLeader) {
        const container = document.querySelector('.donation-history-container');
        if (container) {
            const newContainer = this.render(donations, currentAddress, currentLeader);
            container.replaceWith(newContainer);
        }
    }
}


