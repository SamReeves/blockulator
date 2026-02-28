/**
 * StatusCardRenderer
 * Reusable component for rendering status cards across all sections
 * (games, tools, discussions, factory)
 */

export class StatusCardRenderer {
    /**
     * Create a status card element
     * @param {Object} options - Card configuration
     * @param {string} options.id - Unique identifier
     * @param {string} options.icon - Icon/emoji to display
     * @param {string} options.title - Card title
     * @param {string} options.description - Brief description
     * @param {string|HTMLElement} options.status - Status text or DOM element
     * @param {string|HTMLElement} options.details - Additional details (text or DOM element)
     * @param {Function} options.onClick - Click handler function
     * @param {boolean} options.clickable - Whether card is clickable (default: true)
     * @returns {HTMLElement} The card element
     */
    static createCard(options) {
        const {
            id,
            icon,
            title,
            description,
            status,
            details,
            onClick,
            clickable = true
        } = options;

        const card = document.createElement('div');
        card.className = clickable ? 'status-card status-card-clickable' : 'status-card';
        card.dataset.item = id;
        
        if (clickable) {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
        }
        
        // Create header
        const header = document.createElement('div');
        header.className = 'status-card-header';
        header.innerHTML = `
            <div class="status-icon">${icon}</div>
            <div class="status-info">
                <h3 class="status-title">${title}</h3>
                ${description ? `<span class="status-description">${description}</span>` : ''}
            </div>
        `;
        card.appendChild(header);
        
        // Create data section with proper DOM element support
        const dataDiv = document.createElement('div');
        dataDiv.className = 'status-data';
        
        if (status) {
            const statusSpan = document.createElement('span');
            statusSpan.className = 'status-value';
            // If status is a DOM element, append it; otherwise set as HTML
            if (status instanceof HTMLElement) {
                statusSpan.appendChild(status);
            } else {
                statusSpan.innerHTML = status;
            }
            dataDiv.appendChild(statusSpan);
        }
        
        if (status && details) {
            const separator = document.createElement('span');
            separator.className = 'status-separator';
            separator.textContent = '•';
            dataDiv.appendChild(separator);
        }
        
        if (details) {
            const detailsSpan = document.createElement('span');
            detailsSpan.className = 'status-details';
            // If details is a DOM element, append it; otherwise set as HTML
            if (details instanceof HTMLElement) {
                detailsSpan.appendChild(details);
            } else {
                detailsSpan.innerHTML = details;
            }
            dataDiv.appendChild(detailsSpan);
        }
        
        card.appendChild(dataDiv);

        if (clickable && onClick) {
            // Click handler
            card.addEventListener('click', () => onClick(id));

            // Keyboard accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(id);
                }
            });
        }

        return card;
    }

    /**
     * Create loading state element
     */
    static createLoadingState(message = 'Loading...') {
        const div = document.createElement('div');
        div.className = 'loading-state';
        div.textContent = message;
        return div;
    }

    /**
     * Create error state element
     */
    static createErrorState(message = 'Failed to load. Please refresh.') {
        const div = document.createElement('div');
        div.className = 'error-state';
        div.textContent = message;
        return div;
    }

    /**
     * Render multiple cards into a container
     * @param {HTMLElement} container - Container element
     * @param {Array} items - Array of card options
     */
    static renderCards(container, items) {
        container.innerHTML = '';
        
        if (!items || items.length === 0) {
            container.appendChild(this.createErrorState('No items found'));
            return;
        }

        items.forEach(item => {
            const card = this.createCard(item);
            container.appendChild(card);
        });
    }
}

