/**
 * GameStatusCard
 * Renders a game status card from plain data returned by game getStatus() methods
 * Handles the presentation logic separately from data fetching
 * 
 * Extends the patterns from StatusCardRenderer with game-specific rendering logic.
 */

import { DOMHelpers } from '../dom/dom-helpers.js';
import { AddressBadge } from './address-badge.js';
import { StatusCardRenderer } from './status-card-renderer.js';
import { web3Provider } from '../../infrastructure/blockchain/web3-provider.js';
import { ADDRESS_ZERO } from '../../shared/constants.js';

const ZERO_ADDRESS = ADDRESS_ZERO;

export class GameStatusCard {
    /**
     * Render a game status card
     * @param {Object} statusData - Combined metadata + status from StatusService
     * @param {Function} onClick - Click handler receiving game id
     * @returns {HTMLElement} The card element
     */
    static render(statusData, onClick) {
        const { id, title, emoji, description, color, error } = statusData;
        
        const card = document.createElement('div');
        card.className = 'status-card status-card-clickable';
        card.dataset.item = id;
        card.dataset.game = id;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        
        // Create header
        const header = document.createElement('div');
        header.className = 'status-card-header';
        header.innerHTML = `
            <div class="status-icon">${emoji}</div>
            <div class="status-info">
                <h3 class="status-title">${title}</h3>
                <span class="status-description">${description}</span>
            </div>
        `;
        card.appendChild(header);
        
        // Create data section
        const dataDiv = document.createElement('div');
        dataDiv.className = 'status-data';
        
        if (error) {
            dataDiv.innerHTML = '<span class="status-value">Loading...</span>';
        } else {
            this.populateStatusData(dataDiv, id, statusData);
        }
        
        card.appendChild(dataDiv);
        
        // Add large faded emoji background on the right
        const emojiBackground = document.createElement('div');
        emojiBackground.className = 'status-card-bg-emoji';
        emojiBackground.textContent = emoji;
        card.appendChild(emojiBackground);

        // Click handlers
        card.addEventListener('click', () => onClick(id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(id);
            }
        });

        return card;
    }

    /**
     * Populate status data based on game type
     */
    static populateStatusData(container, gameId, data) {
        switch (gameId) {
            case 'pissing-contest':
                this.renderPissingContest(container, data);
                break;
            case 'pay-it-forward':
                this.renderPayItForward(container, data);
                break;
            case 'pay-it-backward':
                this.renderPayItBackward(container, data);
                break;
            case 'message-board':
                this.renderMessageBoard(container, data);
                break;
            case 'king-of-the-hill':
                this.renderKingOfTheHill(container, data);
                break;
            case 'last-call':
                this.renderLastCall(container, data);
                break;
            case 'time-to-make-the-donuts':
                this.renderDonuts(container, data);
                break;
            case 'dice-gods':
                this.renderDiceGods(container, data);
                break;
            case 'satan-moloch-baal':
                this.renderSatanMolochBaal(container, data);
                break;
            default:
                container.innerHTML = '<span class="status-value">Unknown game</span>';
        }
    }

    static async renderPissingContest(container, data) {
        const { leader, pool, donations, players } = data;
        const hasLeader = leader && leader !== ZERO_ADDRESS;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        
        if (hasLeader) {
            const badge = await this.createAddressBadge(leader);
            if (badge) {
                statusSpan.appendChild(badge);
            } else {
                statusSpan.textContent = DOMHelpers.formatAddress(leader);
            }
        } else {
            statusSpan.textContent = 'No donations yet';
        }
        container.appendChild(statusSpan);
        
        const playerLabel = Number(players) === 1 ? 'player' : 'players';
        this.addDetails(container, `Pool: ${DOMHelpers.formatWei(pool?.toString() || '0')} • ${donations?.toString() || '0'} donations • ${players?.toString() || '0'} ${playerLabel}`);
    }

    static async renderPayItForward(container, data) {
        const { pendingDonor, pendingAmount } = data;
        const hasPending = pendingDonor && pendingDonor !== ZERO_ADDRESS;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        
        if (hasPending) {
            const badge = await this.createAddressBadge(pendingDonor);
            if (badge) {
                statusSpan.appendChild(badge);
            } else {
                statusSpan.textContent = DOMHelpers.formatAddress(pendingDonor);
            }
            container.appendChild(statusSpan);
            this.addDetails(container, `Reward: ${DOMHelpers.formatWei(pendingAmount?.toString() || '0')}`);
        } else {
            statusSpan.textContent = 'Awaiting first donor';
            container.appendChild(statusSpan);
            this.addDetails(container, 'Start the chain!');
        }
    }

    static async renderPayItBackward(container, data) {
        const { lastDonor, nextRecipient } = data;
        const hasStarted = lastDonor && lastDonor !== ZERO_ADDRESS;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        
        if (hasStarted) {
            statusSpan.textContent = 'Next: ';
            const badge = await this.createAddressBadge(nextRecipient);
            if (badge) {
                statusSpan.appendChild(badge);
            } else {
                statusSpan.appendChild(document.createTextNode(DOMHelpers.formatAddress(nextRecipient)));
            }
            container.appendChild(statusSpan);
            
            const detailsSpan = document.createElement('span');
            detailsSpan.className = 'status-details';
            detailsSpan.textContent = 'Previous: ';
            const lastBadge = await this.createAddressBadge(lastDonor);
            if (lastBadge) {
                detailsSpan.appendChild(lastBadge);
            } else {
                detailsSpan.appendChild(document.createTextNode(DOMHelpers.formatAddress(lastDonor)));
            }
            this.addSeparator(container);
            container.appendChild(detailsSpan);
        } else {
            statusSpan.textContent = 'Awaiting first donor';
            container.appendChild(statusSpan);
            this.addDetails(container, 'Start the chain!');
        }
    }

    static renderMessageBoard(container, data) {
        const { messageCount } = data;
        const count = Number(messageCount || 0);
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        statusSpan.textContent = `${count} messages`;
        container.appendChild(statusSpan);
        
        this.addDetails(container, count > 0 ? 'Board active' : 'No messages yet');
    }

    static async renderKingOfTheHill(container, data) {
        const { currentKing, currentPrize, totalDethronements } = data;
        const hasKing = currentKing && currentKing !== ZERO_ADDRESS;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        
        if (hasKing) {
            const badge = await this.createAddressBadge(currentKing);
            if (badge) {
                statusSpan.appendChild(badge);
            } else {
                statusSpan.textContent = DOMHelpers.formatAddress(currentKing);
            }
        } else {
            statusSpan.textContent = 'No king yet';
        }
        container.appendChild(statusSpan);
        
        this.addDetails(container, `${totalDethronements?.toString() || '0'} dethronements • Prize: ${DOMHelpers.formatWei(currentPrize?.toString() || '0')}`);
    }

    static async renderLastCall(container, data) {
        const { roundNumber, potValue, lastDonor, canEnd } = data;
        const hasLeader = lastDonor && lastDonor !== ZERO_ADDRESS;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        
        if (hasLeader) {
            const badge = await this.createAddressBadge(lastDonor);
            if (badge) {
                statusSpan.appendChild(badge);
            } else {
                statusSpan.textContent = DOMHelpers.formatAddress(lastDonor);
            }
        } else {
            statusSpan.textContent = canEnd ? 'Round can end' : 'No leader yet';
        }
        container.appendChild(statusSpan);
        
        this.addDetails(container, `Round ${roundNumber?.toString() || '1'} • Pot: ${DOMHelpers.formatWei(potValue?.toString() || '0')}`);
    }

    static async renderDonuts(container, data) {
        const { currentDay, potValue, firstDonor } = data;
        const hasWinner = firstDonor && firstDonor !== ZERO_ADDRESS;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        
        if (hasWinner) {
            const badge = await this.createAddressBadge(firstDonor);
            if (badge) {
                statusSpan.appendChild(badge);
            } else {
                statusSpan.textContent = DOMHelpers.formatAddress(firstDonor);
            }
        } else {
            statusSpan.textContent = 'No winner yet';
        }
        container.appendChild(statusSpan);
        
        this.addDetails(container, `Day ${currentDay?.toString() || '1'} • Pot: ${DOMHelpers.formatWei(potValue?.toString() || '0')}`);
    }

    static renderDiceGods(container, data) {
        const { roundNumber, playCount, totalPot, isActive } = data;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        statusSpan.textContent = isActive ? 'Round active' : 'New round starting';
        container.appendChild(statusSpan);
        
        const playLabel = Number(playCount) === 1 ? 'play' : 'plays';
        this.addDetails(container, `Round ${roundNumber?.toString() || '1'} • Pot: ${DOMHelpers.formatWei(totalPot?.toString() || '0')} • ${playCount?.toString() || '0'} ${playLabel}`);
    }

    static renderSatanMolochBaal(container, data) {
        const { satanTotal, molochTotal, baalTotal, voidBurned } = data;
        
        const totalBurned = BigInt(satanTotal?.toString() || '0') + 
                           BigInt(molochTotal?.toString() || '0') + 
                           BigInt(baalTotal?.toString() || '0') + 
                           BigInt(voidBurned?.toString() || '0');
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-value';
        statusSpan.textContent = `Total burned: ${DOMHelpers.formatWei(totalBurned.toString())}`;
        container.appendChild(statusSpan);
        
        this.addDetails(container, `Satan: ${DOMHelpers.formatWei(satanTotal?.toString() || '0')} • Moloch: ${DOMHelpers.formatWei(molochTotal?.toString() || '0')} • Baal: ${DOMHelpers.formatWei(baalTotal?.toString() || '0')}`);
    }

    static async createAddressBadge(address) {
        try {
            return await AddressBadge.createWithAddress(address, web3Provider, {
                size: 16,
                formatAddress: true,
                addressStyle: 'font-size: 0.8125rem; font-weight: 600;'
            });
        } catch (e) {
            return null;
        }
    }

    static addSeparator(container) {
        const separator = document.createElement('span');
        separator.className = 'status-separator';
        separator.textContent = '•';
        container.appendChild(separator);
    }

    static addDetails(container, text) {
        this.addSeparator(container);
        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'status-details';
        detailsSpan.textContent = text;
        container.appendChild(detailsSpan);
    }

    /**
     * Create a loading state element (delegates to StatusCardRenderer)
     */
    static createLoadingState(message = 'Loading game statuses...') {
        return StatusCardRenderer.createLoadingState(message);
    }

    /**
     * Create an error state element (delegates to StatusCardRenderer)
     */
    static createErrorState(message = 'Failed to load games. Please refresh.') {
        return StatusCardRenderer.createErrorState(message);
    }
}
