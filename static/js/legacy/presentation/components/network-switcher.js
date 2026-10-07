/**
 * Network Switcher Component
 * Presentation layer - handles network badge interaction and switching UI
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { getCurrentNetwork, getNetworks, switchNetwork, getConfig } from '../../infrastructure/config/network.js';

export class NetworkSwitcherComponent {
    constructor() {
        this.badge = null;
        this.dropdown = null;
        this.isDropdownOpen = false;
    }

    /**
     * Render network badge and switcher
     */
    render(containerSelector = 'header') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        this.badge = container.querySelector('.testnet-badge');
        if (!this.badge) {
            console.warn('Network badge not found in header');
            return;
        }

        // Set initial badge text
        this.updateBadge();

        // Make badge clickable
        this.badge.style.cursor = 'pointer';
        this.badge.title = 'Click to switch networks';
        
        // Add dropdown indicator
        this.badge.innerHTML = `<span>${getConfig().displayName}</span> <span class="dropdown-arrow">▼</span>`;

        // Create dropdown element
        this.createDropdown();

        // Setup event listeners
        this.setupEventListeners();

        console.log('🌐 Network switcher initialized');
    }

    /**
     * Create the dropdown menu
     */
    createDropdown() {
        // Remove existing dropdown if any
        const existing = document.querySelector('.network-dropdown');
        if (existing) existing.remove();

        this.dropdown = document.createElement('div');
        this.dropdown.className = 'network-dropdown hidden';
        
        const networks = getNetworks();
        const currentNetwork = getCurrentNetwork();

        // Build dropdown content
        let html = '<div class="network-dropdown-content">';
        
        for (const [key, config] of Object.entries(networks)) {
            const isActive = key === currentNetwork;
            const activeClass = isActive ? 'active' : '';
            const checkmark = isActive ? '✓ ' : '';
            
            html += `
                <button class="network-option ${activeClass}" data-network="${key}">
                    <span class="network-label">${checkmark}${config.name}</span>
                    <span class="network-chain-id">Chain ID: ${config.chainId}</span>
                </button>
            `;
        }
        
        html += '</div>';
        this.dropdown.innerHTML = html;

        // Insert dropdown after the badge
        this.badge.parentElement.appendChild(this.dropdown);

        // Setup dropdown click handlers
        this.dropdown.querySelectorAll('.network-option').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const network = button.dataset.network;
                if (network !== currentNetwork) {
                    this.handleNetworkSwitch(network);
                }
                this.closeDropdown();
            });
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Badge click - toggle dropdown
        this.badge.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isDropdownOpen && 
                !this.badge.contains(e.target) && 
                !this.dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Listen for network change events
        eventBus.on(EVENTS.NETWORK_CHANGED, () => {
            this.updateBadge();
            this.createDropdown(); // Recreate to update active state
        });
    }

    /**
     * Update badge text based on current network
     */
    updateBadge() {
        const config = getConfig();
        if (this.badge) {
            this.badge.innerHTML = `<span>${config.displayName}</span> <span class="dropdown-arrow">▼</span>`;
            
            // Update badge color based on network
            this.badge.classList.remove('testnet', 'mainnet');
            if (getCurrentNetwork() === 'mainnet') {
                this.badge.classList.add('mainnet');
            } else {
                this.badge.classList.add('testnet');
            }
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * Open dropdown
     */
    openDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.remove('hidden');
        this.isDropdownOpen = true;

        // Position dropdown below badge
        const badgeRect = this.badge.getBoundingClientRect();
        this.dropdown.style.top = `${badgeRect.bottom + 5}px`;
        this.dropdown.style.left = `${badgeRect.left}px`;
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.add('hidden');
        this.isDropdownOpen = false;
    }

    /**
     * Handle network switch
     */
    handleNetworkSwitch(network) {
        const networks = getNetworks();
        const targetNetwork = networks[network];
        
        if (!targetNetwork) {
            console.error(`Invalid network: ${network}`);
            return;
        }

        console.log(`🔄 User switching to ${targetNetwork.name}...`);

        // Show toast notification
        eventBus.emit(EVENTS.TOAST, {
            message: `Switching to ${targetNetwork.name}...`,
            type: 'info'
        });

        // Switch network (this will emit NETWORK_CHANGED event)
        const success = switchNetwork(network);

        if (success) {
            eventBus.emit(EVENTS.TOAST, {
                message: `✅ Switched to ${targetNetwork.name}`,
                type: 'success'
            });

            // Reload the page to reinitialize everything with new network
            // This is the simplest and most reliable approach
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    }
}









