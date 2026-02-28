/**
 * Address Badge Component
 * Displays a small badge next to an address anywhere in the app
 * Used in games, discussions, futures, etc.
 */

import { BadgeViewer } from './badge-viewer.js';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../../infrastructure/config/contracts.js';

export class AddressBadge {
    static factoryContract = null;
    static badgeCache = new Map(); // Cache badge data to avoid repeated calls
    
    /**
     * Create a badge element for an address
     * @param {string} address - Ethereum address
     * @param {Object} web3Provider - Web3 provider instance
     * @param {Object} options - Display options
     * @returns {Promise<HTMLElement|null>} Badge element or null if no badge
     */
    static async create(address, web3Provider, options = {}) {
        const {
            size = 20,           // Size of badge (default 20px)
            showGrid = false,
            clickToExpand = true,
            style = ''           // Additional CSS styles
        } = options;

        try {
            // Check if badge system is deployed
            if (!CONTRACT_ADDRESSES.BADGE_FACTORY || 
                CONTRACT_ADDRESSES.BADGE_FACTORY === '0x0000000000000000000000000000000000000000') {
                return null;
            }

            // Load factory contract if not loaded
            if (!this.factoryContract) {
                const factoryAbi = await fetch(`${CONTRACT_ABIS.BADGE_FACTORY}?v=${Date.now()}`).then(r => r.json());
                this.factoryContract = web3Provider.getContract(
                    CONTRACT_ADDRESSES.BADGE_FACTORY,
                    factoryAbi
                );
            }

            // Check cache first
            const cacheKey = address.toLowerCase();
            if (!this.badgeCache.has(cacheKey)) {
                // Get badge address
                const badgeAddress = await this.factoryContract.get_badge(address);
                const hasBadge = badgeAddress !== '0x0000000000000000000000000000000000000000';
                
                if (!hasBadge) {
                    this.badgeCache.set(cacheKey, null);
                    return null;
                }

                // Load badge contract and pixel data
                const badgeAbi = await fetch(`${CONTRACT_ABIS.BADGE}?v=${Date.now()}`).then(r => r.json());
                const badgeContract = web3Provider.getContract(badgeAddress, badgeAbi);
                const pixelData = await badgeContract.pixel_data();
                const pixelBytes = new Uint8Array(ethers.utils.arrayify(pixelData));
                
                this.badgeCache.set(cacheKey, pixelBytes);
            }

            const pixelBytes = this.badgeCache.get(cacheKey);
            if (!pixelBytes) return null;

            // Create badge viewer
            const viewer = BadgeViewer.create(pixelBytes, {
                size,
                showGrid,
                clickToExpand
            });
            
            viewer.style.cssText = `
                border-radius: 4px;
                overflow: hidden;
                vertical-align: middle;
                display: inline-block;
                ${style}
            `;
            viewer.title = 'User badge - click to view full size';

            return viewer;

        } catch (error) {
            console.log('Failed to load badge for', address, ':', error.message);
            return null;
        }
    }

    /**
     * Clear the badge cache (useful when badges are updated)
     */
    static clearCache() {
        this.badgeCache.clear();
    }

    /**
     * Create an inline badge wrapper with address
     * Returns a span containing badge + formatted address
     * @param {string} address - Ethereum address
     * @param {Object} web3Provider - Web3 provider instance
     * @param {Object} options - Display options
     * @returns {Promise<HTMLElement>} Span element with badge and address
     */
    static async createWithAddress(address, web3Provider, options = {}) {
        const {
            size = 20,
            formatAddress = true,  // Whether to format address (0xca9d...5ee4)
            addressStyle = '',
            badgeStyle = ''
        } = options;

        const container = document.createElement('span');
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        `;

        // Try to load badge
        const badge = await this.create(address, web3Provider, { size, style: badgeStyle });
        if (badge) {
            container.appendChild(badge);
        }

        // Add address
        const addressSpan = document.createElement('span');
        addressSpan.textContent = formatAddress 
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : address;
        addressSpan.style.cssText = addressStyle;
        container.appendChild(addressSpan);

        return container;
    }
}

