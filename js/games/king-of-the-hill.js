/**
 * King of the Hill - Winner Takes All Edition
 * Pay to dethrone and claim the prize. No refunds. Stakes grow exponentially.
 */

import { eventBus, EVENTS } from '../ui/events.js';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses.js';

export class KingOfTheHill {
    constructor() {
        this.contract = null;
        this.container = null;
        this.web3Provider = null;
        this.gameType = 'king-of-the-hill';
        this.updateInterval = null;
    }

    async init(container, web3Provider) {
        this.container = container;
        this.web3Provider = web3Provider;
        
        if (!web3Provider.isConnected() || !web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'error'
            });
            return;
        }
        
        try {
            const response = await fetch('/contracts/abis/king-of-the-hill.json');
            const abi = await response.json();
            
            this.contract = web3Provider.getContract(
                CONTRACT_ADDRESSES.KING_OF_THE_HILL,
                abi
            );
            
            console.log('✅ King of the Hill loaded');
            
        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load contract',
                type: 'error'
            });
            return;
        }
        
        this.render();
        this.setupListeners();
        this.setupContractEvents();
        await this.loadState();
        
        // Update reign timer every second
        this.updateInterval = setInterval(() => this.updateReign(), 1000);
    }

    render() {
        this.container.innerHTML = `
            <div class="game-interface">
                <div class="game-header">
                    <h2 class="game-title">👑 King of the Hill</h2>
                    <p class="game-description">Pay to dethrone and win the prize. No refunds. Stakes grow forever.</p>
                </div>

                <div class="game-sections">
                    <!-- Current King Display -->
                    <div class="contest-info-panel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h3 style="color: white;">👑 CURRENT KING</h3>
                        <div style="text-align: center; padding: 2rem 0;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Reigning Champion</div>
                            <div id="king-address" style="font-family: monospace; font-size: 1.25rem; font-weight: bold; word-break: break-all; margin-bottom: 1rem;">
                                Loading...
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                                <div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.25rem;">CURRENT PRIZE</div>
                                    <div id="current-prize" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.25rem;">REIGN TIME</div>
                                    <div id="reign-time" style="font-size: 1.5rem; font-weight: bold;">0s</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Dethrone Panel -->
                    <div class="contest-info-panel">
                        <h3>⚔️ Claim the Throne</h3>
                        <div class="game-controls">
                            <div class="info-grid" style="margin-bottom: 1rem;">
                                <div class="info-item">
                                    <div class="info-label">Minimum Payment</div>
                                    <div class="info-value" id="min-payment">0 wei</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Required Increase</div>
                                    <div class="info-value">+1000 wei AND +1%</div>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label for="throne-payment">Your Payment (wei)</label>
                                <input 
                                    type="number" 
                                    id="throne-payment" 
                                    placeholder="Minimum..."
                                    min="0"
                                />
                            </div>
                            
                            <button id="claim-btn" class="button-primary" style="width: 100%;">
                                👑 CLAIM THRONE
                            </button>
                            
                            <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 8px; font-size: 0.875rem;">
                                <strong>How it works:</strong><br>
                                • Pay BOTH: +1000 wei AND +1% (both conditions required)<br>
                                • You immediately win the current prize<br>
                                • Your payment becomes the new prize<br>
                                • No refunds - prize pot grows forever!
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Panel -->
                    <div class="contest-info-panel">
                        <h3>📊 Statistics</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Total Dethronements</div>
                                <div class="info-value" id="total-dethrone">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Contract Balance</div>
                                <div class="info-value" id="contract-balance">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Your Times Crowned</div>
                                <div class="info-value" id="your-crowns">0</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Your Total Reign</div>
                                <div class="info-value" id="your-reign">0s</div>
                            </div>
                        </div>
                    </div>

                    <!-- History Panel -->
                    <div class="contest-info-panel">
                        <h3>📜 Recent Kings</h3>
                        <div id="history" style="max-height: 400px; overflow-y: auto;">
                            <div class="loading">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupListeners() {
        const claimBtn = document.getElementById('claim-btn');
        const paymentInput = document.getElementById('throne-payment');
        
        claimBtn.addEventListener('click', () => this.claimThrone());
        
        // Auto-fill minimum payment
        paymentInput.addEventListener('focus', async () => {
            if (!paymentInput.value) {
                const minPayment = await this.contract.get_minimum_payment();
                paymentInput.value = minPayment.toString();
            }
        });
    }

    async claimThrone() {
        const payment = document.getElementById('throne-payment').value;
        
        if (!payment || payment <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a payment amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            const minPayment = await this.contract.get_minimum_payment();
            const paymentBN = ethers.BigNumber.from(payment);
            
            if (paymentBN.lt(minPayment)) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `Payment too low. Minimum: ${minPayment.toString()} wei`,
                    type: 'error'
                });
                return;
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Claiming throne...',
                type: 'info'
            });
            
            const tx = await this.contract.claim_throne({
                value: paymentBN
            });
            
            await tx.wait();
            
            eventBus.emit(EVENTS.TOAST, {
                message: '👑 You are now KING!',
                type: 'success'
            });
            
            document.getElementById('throne-payment').value = '';
            await this.loadState();
            
        } catch (error) {
            console.error('Claim failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed: ' + (error.reason || error.message),
                type: 'error'
            });
        }
    }

    async loadState() {
        try {
            const [
                currentKing,
                currentPrize,
                coronationTime,
                totalDethronements,
                contractBalance,
                minPayment,
                userStats
            ] = await Promise.all([
                this.contract.current_king(),
                this.contract.current_prize(),
                this.contract.coronation_time(),
                this.contract.total_dethronements(),
                this.contract.get_contract_balance(),
                this.contract.get_minimum_payment(),
                this.contract.get_king_stats(this.web3Provider.currentAddress)
            ]);
            
            // Update king display
            const kingDisplay = currentKing === '0x0000000000000000000000000000000000000000' 
                ? 'No King Yet' 
                : this.formatAddress(currentKing);
            
            document.getElementById('king-address').textContent = kingDisplay;
            
            const isYouKing = currentKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            if (isYouKing) {
                document.getElementById('king-address').innerHTML = 
                    `<span style="color: #ffd700;">YOU!</span><br><span style="font-size: 0.875rem; opacity: 0.9;">${kingDisplay}</span>`;
            }
            
            // Update prize
            const prizeEth = parseFloat(ethers.utils.formatEther(currentPrize));
            document.getElementById('current-prize').textContent = 
                prizeEth >= 0.001 ? `${prizeEth.toFixed(4)} ETH` : `${currentPrize.toString()} wei`;
            
            // Update reign time
            this.updateReign();
            
            // Update minimum payment
            const minEth = parseFloat(ethers.utils.formatEther(minPayment));
            document.getElementById('min-payment').textContent = 
                minEth >= 0.001 ? `${minEth.toFixed(4)} ETH` : `${minPayment.toString()} wei`;
            
            document.getElementById('throne-payment').placeholder = `Minimum: ${minPayment.toString()}`;
            
            // Update stats
            document.getElementById('total-dethrone').textContent = totalDethronements.toString();
            
            const balanceEth = parseFloat(ethers.utils.formatEther(contractBalance));
            document.getElementById('contract-balance').textContent = 
                balanceEth >= 0.001 ? `${balanceEth.toFixed(4)} ETH` : `${contractBalance.toString()} wei`;
            
            // User stats
            document.getElementById('your-crowns').textContent = userStats[0].toString();
            document.getElementById('your-reign').textContent = this.formatDuration(userStats[1].toNumber());
            
            // Load history
            await this.loadHistory();
            
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    async loadHistory() {
        try {
            const recentKings = await this.contract.get_recent_kings(20);
            
            if (recentKings.length === 0) {
                document.getElementById('history').innerHTML = 
                    '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">No kings yet. Be the first!</div>';
                return;
            }
            
            // Reverse to show most recent first
            const kings = [...recentKings].reverse();
            
            let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
            kings.forEach((king, idx) => {
                const position = recentKings.length - idx;
                const isYou = king.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
                html += `
                    <div style="padding: 0.75rem; background: rgba(0,0,0,0.1); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: bold; color: ${isYou ? '#ffd700' : 'inherit'};">
                                ${isYou ? '👑 YOU' : `#${position}`}
                            </span>
                        </div>
                        <div style="font-family: monospace; font-size: 0.875rem;">
                            ${this.formatAddress(king)}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            document.getElementById('history').innerHTML = html;
            
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    updateReign() {
        // This gets called every second to update the reign timer
        // We'll calculate based on the coronation time we already have
        if (!this.contract) return;
        
        this.contract.get_current_reign_duration()
            .then(duration => {
                const seconds = duration.toNumber();
                document.getElementById('reign-time').textContent = this.formatDuration(seconds);
            })
            .catch(err => console.error('Failed to update reign:', err));
    }

    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }

    formatAddress(addr) {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    setupContractEvents() {
        if (!this.contract) return;
        
        this.contract.on('NewKing', (newKing, previousKing, payment, prizeWon, newPrize, dethroneNum, timestamp) => {
            const isYou = newKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            const wasYou = previousKing.toLowerCase() === this.web3Provider.currentAddress.toLowerCase();
            
            if (isYou) {
                const prizeEth = parseFloat(ethers.utils.formatEther(prizeWon));
                const prizeDisplay = prizeEth >= 0.001 ? `${prizeEth.toFixed(4)} ETH` : `${prizeWon.toString()} wei`;
                eventBus.emit(EVENTS.TOAST, {
                    message: `👑 You won ${prizeDisplay}!`,
                    type: 'success'
                });
            } else if (wasYou) {
                eventBus.emit(EVENTS.TOAST, {
                    message: '⚔️ You were dethroned!',
                    type: 'warning'
                });
            } else {
                eventBus.emit(EVENTS.TOAST, {
                    message: `👑 New king: ${this.formatAddress(newKing)}`,
                    type: 'info'
                });
            }
            
            this.loadState();
        });
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }
}

