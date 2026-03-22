/**
 * Address Utilities
 * Shared address-related utilities for game components
 */

import { ADDRESS_ZERO } from '../../../shared/constants.js';
import { AddressBadge } from '../../../presentation/components/address-badge.js';
import { DOMHelpers } from '../../../presentation/dom/dom-helpers.js';

/**
 * Check if an address is the zero address or empty
 * @param {string} address - Ethereum address
 * @returns {boolean}
 */
export function isZeroAddress(address) {
    return !address || address === ADDRESS_ZERO;
}

/**
 * Format an address for display (truncated)
 * @param {string} address - Full Ethereum address
 * @param {number} startChars - Characters to show at start (default 6)
 * @param {number} endChars - Characters to show at end (default 4)
 * @returns {string} Formatted address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Render an address with badge into a DOM element
 * @param {string} elementId - ID of the container element
 * @param {string} address - Ethereum address
 * @param {Object} web3Provider - Web3 provider instance
 * @param {Object} options - Display options
 */
export async function renderAddressInElement(elementId, address, web3Provider, options = {}) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const {
        showBadge = true,
        emptyText = 'None',
        isCurrentUser = false,
        currentUserSuffix = '(You)'
    } = options;
    
    if (isZeroAddress(address)) {
        element.innerHTML = `<span style="color: var(--md-sys-color-on-surface-variant);">${emptyText}</span>`;
        return;
    }
    
    const addressHtml = `
        <span class="address-display" style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-family: monospace; font-size: 0.85rem;">${formatAddress(address)}</span>
            ${isCurrentUser ? `<span style="color: var(--md-sys-color-primary); font-size: 0.75rem;">${currentUserSuffix}</span>` : ''}
            <span id="${elementId}-badge"></span>
        </span>
    `;
    
    element.innerHTML = addressHtml;
    
    if (showBadge && web3Provider) {
        const badgeContainer = document.getElementById(`${elementId}-badge`);
        if (badgeContainer) {
            const badge = await AddressBadge.create(address, web3Provider, { size: 16 });
            if (badge) {
                badgeContainer.appendChild(badge);
            }
        }
    }
}

/**
 * Check if an address belongs to the current user
 * @param {string} address - Address to check
 * @param {Object} web3Provider - Web3 provider instance
 * @returns {boolean}
 */
export function isCurrentUser(address, web3Provider) {
    return web3Provider?.isConnected() &&
           web3Provider?.currentAddress &&
           address?.toLowerCase() === web3Provider.currentAddress.toLowerCase();
}
