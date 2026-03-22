/**
 * DOM Helper Functions
 * Presentation layer - reusable DOM building and formatting utilities
 */

export const DOMHelpers = {
    /**
     * Create game/tool header
     */
    createHeader(title, description) {
        const header = document.createElement('div');
        header.className = 'game-header';
        
        const titleEl = document.createElement('h2');
        titleEl.className = 'game-title';
        titleEl.textContent = title;
        
        const descEl = document.createElement('p');
        descEl.className = 'game-description';
        descEl.textContent = description;
        
        header.appendChild(titleEl);
        header.appendChild(descEl);
        return header;
    },

    /**
     * Create input group
     */
    createInput(config) {
        const { 
            id, 
            label, 
            type = 'number', 
            placeholder = '', 
            min, 
            max, 
            step 
        } = config;
        
        const div = document.createElement('div');
        div.className = 'input-group';
        
        const labelEl = document.createElement('label');
        labelEl.setAttribute('for', id);
        labelEl.textContent = label;
        
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.placeholder = placeholder;
        if (min !== undefined) input.min = min;
        if (max !== undefined) input.max = max;
        if (step !== undefined) input.step = step;
        
        div.appendChild(labelEl);
        div.appendChild(input);
        return div;
    },

    /**
     * Create textarea group
     */
    createTextarea(config) {
        const { id, label, placeholder = '', rows = 3, maxlength } = config;
        
        const div = document.createElement('div');
        div.className = 'input-group';
        
        const labelEl = document.createElement('label');
        labelEl.setAttribute('for', id);
        labelEl.textContent = label;
        
        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.placeholder = placeholder;
        textarea.rows = rows;
        if (maxlength) textarea.maxLength = maxlength;
        
        div.appendChild(labelEl);
        div.appendChild(textarea);
        return div;
    },

    /**
     * Create button
     */
    createButton(id, text, className = 'button-primary') {
        const button = document.createElement('button');
        button.id = id;
        button.className = className;
        button.textContent = text;
        return button;
    },

    /**
     * Create info panel with grid items
     */
    createInfoPanel(title, items) {
        const panel = document.createElement('div');
        panel.className = 'contest-info-panel';
        
        const heading = document.createElement('h3');
        heading.textContent = title;
        panel.appendChild(heading);
        
        const grid = document.createElement('div');
        grid.className = 'info-grid';
        
        items.forEach(({ label, id, defaultValue = 'Loading...' }) => {
            const item = document.createElement('div');
            item.className = 'info-item';
            
            const labelEl = document.createElement('div');
            labelEl.className = 'info-label';
            labelEl.textContent = label;
            
            const valueEl = document.createElement('div');
            valueEl.className = 'info-value';
            valueEl.id = id;
            valueEl.textContent = defaultValue;
            
            item.appendChild(labelEl);
            item.appendChild(valueEl);
            grid.appendChild(item);
        });
        
        panel.appendChild(grid);
        return panel;
    },

    /**
     * Update info value by ID
     */
    updateInfo(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    /**
     * Format wei to readable string
     */
    formatWei(wei, threshold = 0.001) {
        try {
            const eth = parseFloat(ethers.utils.formatEther(wei));
            return eth >= threshold 
                ? `${eth.toFixed(4)} ETH`
                : `${wei.toString()} wei`;
        } catch (error) {
            return `${wei.toString()} wei`;
        }
    },

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address || address === '0x0000000000000000000000000000000000000000') {
            return 'None';
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    /**
     * Format timestamp to readable date
     */
    formatTimestamp(timestamp) {
        if (!timestamp || timestamp === 0) {
            return 'Never';
        }
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    },

    /**
     * Format duration in seconds to readable string
     * Handles minutes, hours, days, months, and years
     */
    formatDuration(seconds) {
        if (seconds === 0) return 'Now';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return s > 0 ? `${m}m ${s}s` : `${m}m`;
        }
        if (seconds < 86400) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        if (seconds < 2592000) { // < 30 days
            const d = Math.floor(seconds / 86400);
            const h = Math.floor((seconds % 86400) / 3600);
            return h > 0 ? `${d}d ${h}h` : `${d}d`;
        }
        if (seconds < 31557600) { // < 1 year (365.25 days)
            const months = Math.floor(seconds / 2592000);
            const days = Math.floor((seconds % 2592000) / 86400);
            return days > 0 ? `${months}mo ${days}d` : `${months}mo`;
        }
        // Years
        const years = Math.floor(seconds / 31557600);
        const months = Math.floor((seconds % 31557600) / 2592000);
        return months > 0 ? `${years}y ${months}mo` : `${years}y`;
    },

    /**
     * Format expiry date/time in compressed format
     * Shows: "Mar 25 '26 14:30" or "Today 14:30" or "Tomorrow 09:15"
     */
    formatExpiryDate(expiryTimestamp) {
        const expiry = new Date(expiryTimestamp * 1000);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 86400000);
        const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
        
        const timeStr = expiry.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        if (expiryDay.getTime() === today.getTime()) {
            return `Today ${timeStr}`;
        }
        if (expiryDay.getTime() === tomorrow.getTime()) {
            return `Tomorrow ${timeStr}`;
        }
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[expiry.getMonth()];
        const day = expiry.getDate();
        const year = expiry.getFullYear();
        const currentYear = now.getFullYear();
        
        if (year === currentYear) {
            return `${month} ${day} ${timeStr}`;
        }
        // Show 2-digit year for other years
        const shortYear = String(year).slice(-2);
        return `${month} ${day} '${shortYear} ${timeStr}`;
    },

    /**
     * Format lifetime with both duration and exact expiry
     * Returns: "2d 4h → Mar 25 14:30"
     */
    formatLifetimeWithExpiry(seconds) {
        const duration = this.formatDuration(seconds);
        const expiryTimestamp = Math.floor(Date.now() / 1000) + seconds;
        const expiry = this.formatExpiryDate(expiryTimestamp);
        return { duration, expiry, full: `${duration} → ${expiry}` };
    }
};

