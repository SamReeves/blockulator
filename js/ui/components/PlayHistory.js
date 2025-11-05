/**
 * PlayHistory Component
 * Displays all plays in the current round with sorting and highlighting
 */

export class PlayHistory {
    /**
     * Create play history display
     * @param {Array} plays - Array of {address, weiAmount, timestamp, blockNumber}
     * @param {string} currentUserAddress - Current user's address to highlight
     */
    static render(plays = [], currentUserAddress = null) {
        const container = document.createElement('div');
        container.className = 'play-history';
        
        const header = document.createElement('div');
        header.className = 'play-history-header';
        
        const title = document.createElement('h3');
        title.textContent = '📊 All Plays This Round';
        
        const sortControls = this.createSortControls();
        
        header.appendChild(title);
        header.appendChild(sortControls);
        container.appendChild(header);
        
        if (plays.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'play-history-empty';
            emptyState.textContent = 'No plays yet. Be the first to play!';
            container.appendChild(emptyState);
            return container;
        }
        
        const table = this.createTable(plays, currentUserAddress);
        container.appendChild(table);
        
        const summary = document.createElement('div');
        summary.className = 'play-history-summary';
        summary.textContent = `${plays.length}/10 plays completed • ${10 - plays.length} remaining`;
        container.appendChild(summary);
        
        return container;
    }
    
    /**
     * Create sort controls
     */
    static createSortControls() {
        const controls = document.createElement('div');
        controls.className = 'sort-controls';
        
        const sortByTime = document.createElement('button');
        sortByTime.className = 'sort-btn active';
        sortByTime.dataset.sort = 'time';
        sortByTime.textContent = '🕐 Time';
        
        const sortByAmount = document.createElement('button');
        sortByAmount.className = 'sort-btn';
        sortByAmount.dataset.sort = 'amount';
        sortByAmount.textContent = '💰 Amount';
        
        controls.appendChild(sortByTime);
        controls.appendChild(sortByAmount);
        
        return controls;
    }
    
    /**
     * Create plays table
     */
    static createTable(plays, currentUserAddress) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'play-history-table';
        
        const table = document.createElement('table');
        
        // Header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Player</th>
                <th>Wei Amount</th>
                <th>Time</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        tbody.id = 'play-history-tbody';
        
        plays.forEach((play, index) => {
            const row = this.createPlayRow(play, index + 1, currentUserAddress);
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        return tableContainer;
    }
    
    /**
     * Create a single play row
     */
    static createPlayRow(play, playNumber, currentUserAddress) {
        const row = document.createElement('tr');
        
        const isCurrentUser = currentUserAddress && 
            play.address.toLowerCase() === currentUserAddress.toLowerCase();
        
        if (isCurrentUser) {
            row.classList.add('current-user-row');
        }
        
        // Play number
        const numCell = document.createElement('td');
        numCell.className = 'play-number';
        numCell.textContent = playNumber;
        
        // Player address
        const addressCell = document.createElement('td');
        addressCell.className = 'play-address';
        const addressSpan = document.createElement('span');
        addressSpan.textContent = this.formatAddress(play.address);
        if (isCurrentUser) {
            const youBadge = document.createElement('span');
            youBadge.className = 'you-badge';
            youBadge.textContent = '👤 YOU';
            addressCell.appendChild(youBadge);
            addressCell.appendChild(document.createElement('br'));
        }
        addressCell.appendChild(addressSpan);
        
        // Wei amount
        const weiCell = document.createElement('td');
        weiCell.className = 'play-wei';
        const weiAmount = document.createElement('div');
        weiAmount.className = 'wei-amount';
        weiAmount.textContent = this.formatWei(play.weiAmount);
        const ethAmount = document.createElement('div');
        ethAmount.className = 'eth-amount';
        ethAmount.textContent = this.weiToEth(play.weiAmount);
        weiCell.appendChild(weiAmount);
        weiCell.appendChild(ethAmount);
        
        // Time
        const timeCell = document.createElement('td');
        timeCell.className = 'play-time';
        timeCell.textContent = this.formatTime(play.timestamp);
        
        row.appendChild(numCell);
        row.appendChild(addressCell);
        row.appendChild(weiCell);
        row.appendChild(timeCell);
        
        return row;
    }
    
    /**
     * Update existing play history (for dynamic updates)
     */
    static update(plays, currentUserAddress) {
        const tbody = document.getElementById('play-history-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        plays.forEach((play, index) => {
            const row = this.createPlayRow(play, index + 1, currentUserAddress);
            tbody.appendChild(row);
        });
        
        // Update summary
        const summary = document.querySelector('.play-history-summary');
        if (summary) {
            summary.textContent = `${plays.length}/10 plays completed • ${10 - plays.length} remaining`;
        }
    }
    
    /**
     * Setup sort functionality
     */
    static setupSortHandlers(plays, currentUserAddress, updateCallback) {
        const sortButtons = document.querySelectorAll('.sort-btn');
        
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                sortButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sortType = btn.dataset.sort;
                let sortedPlays = [...plays];
                
                if (sortType === 'amount') {
                    sortedPlays.sort((a, b) => b.weiAmount - a.weiAmount);
                } else {
                    sortedPlays.sort((a, b) => a.timestamp - b.timestamp);
                }
                
                this.update(sortedPlays, currentUserAddress);
                
                if (updateCallback) {
                    updateCallback(sortedPlays);
                }
            });
        });
    }
    
    // Utility formatters
    static formatAddress(address) {
        if (!address) return 'Unknown';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    
    static formatWei(wei) {
        if (!wei) return '0 wei';
        return `${parseInt(wei).toLocaleString()} wei`;
    }
    
    static weiToEth(wei) {
        if (!wei) return '0 ETH';
        const eth = parseFloat(wei) / 1e18;
        return `≈ ${eth.toFixed(6)} ETH`;
    }
    
    static formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
}




