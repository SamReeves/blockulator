/**
 * Future Detail View Component
 * Level 2: Renders detailed view of a single future contract
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { EulerianFuture } from '../../domain/futures/eulerian-future.js';
import { StatusCardRenderer } from '../components/status-card-renderer.js';
import { DOMHelpers } from '../dom/dom-helpers.js';
import { computeCdfValue } from './distribution-cdf.js';

export class FutureDetailView {
    constructor(futureData, factory, web3Provider, futureAbi) {
        this.futureData = futureData;
        this.factory = factory;
        this.web3Provider = web3Provider;
        this.futureAbi = futureAbi;
        this.future = null;
        this.containerElement = null;
        this.chart = null;
    }

    setContainer(element) {
        this.containerElement = element;
    }

    async render() {
        if (!this.containerElement) {
            console.error('Container element not set');
            return;
        }

        this.containerElement.innerHTML = '';
        this.containerElement.appendChild(StatusCardRenderer.createLoadingState('Loading future details...'));

        try {
            console.log('📊 Starting future detail render for:', this.futureData.address);
            
            // Initialize future contract
            this.future = new EulerianFuture(
                this.web3Provider,
                this.futureData.address,
                this.futureAbi
            );
            await this.future.init();

            // Get fresh data
            const [fullData, listing] = await Promise.all([
                this.future.getFullData(),
                this.factory.getListing(this.futureData.address)
            ]);

            console.log('📊 Got full data:', fullData);
            console.log('📊 Got listing:', listing);

            this.futureData = { ...this.futureData, ...fullData, ...listing };
            
            // Ensure lifetime is set (calculate from expiry - creation if not present)
            if (!this.futureData.lifetime && this.futureData.expiryTime && this.futureData.creationTime) {
                this.futureData.lifetime = this.futureData.expiryTime - this.futureData.creationTime;
                console.log('📊 Calculated lifetime from timestamps:', this.futureData.lifetime);
            }
            
            console.log('📊 Merged futureData:', this.futureData);

            // Render view
            this.containerElement.innerHTML = this.renderHTML();

            // Attach event listeners
            this.attachEventListeners();

            // Render chart
            console.log('📊 About to render chart...');
            this.renderChart();

        } catch (error) {
            console.error('Failed to render future view:', error);
            
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-state';
            
            errorContainer.appendChild(StatusCardRenderer.createErrorState('Failed to load future details'));
            
            const backBtn = document.createElement('button');
            backBtn.id = 'back-to-market-btn';
            backBtn.textContent = '← Back to Market';
            backBtn.addEventListener('click', () => {
                eventBus.emit('NAVIGATE_TO_MARKET');
            });
            
            errorContainer.appendChild(backBtn);
            this.containerElement.innerHTML = '';
            this.containerElement.appendChild(errorContainer);
        }
    }

    renderHTML() {
        console.log('📊 renderHTML called with futureData:', this.futureData);
        
        const distName = EulerianFuture.getDistributionName(this.futureData.distributionType);
        const distEmoji = EulerianFuture.getDistributionEmoji(this.futureData.distributionType);
        const distDesc = EulerianFuture.getDistributionDescription(this.futureData.distributionType);
        
        // Ensure balance is a BigNumber
        const balanceValue = ethers.BigNumber.isBigNumber(this.futureData.balance) 
            ? this.futureData.balance 
            : ethers.BigNumber.from(this.futureData.balance || '0');
        const initialValueBN = ethers.BigNumber.isBigNumber(this.futureData.initialValue)
            ? this.futureData.initialValue
            : ethers.BigNumber.from(this.futureData.initialValue || '0');
        const expectedValueBN = ethers.BigNumber.isBigNumber(this.futureData.expectedValue)
            ? this.futureData.expectedValue
            : ethers.BigNumber.from(this.futureData.expectedValue || '0');
            
        const balance = parseFloat(ethers.utils.formatEther(balanceValue)).toFixed(6);
        const initialValue = parseFloat(ethers.utils.formatEther(initialValueBN)).toFixed(6);
        const expectedValue = parseFloat(ethers.utils.formatEther(expectedValueBN)).toFixed(6);
        
        const createdDate = new Date(this.futureData.creationTime * 1000).toLocaleString();
        const expiryDate = new Date(this.futureData.expiryTime * 1000).toLocaleString();
        
        // Calculate lifetime if not present
        const lifetime = this.futureData.lifetime || (this.futureData.expiryTime - this.futureData.creationTime);
        const timeRemaining = this.futureData.timeRemaining !== undefined ? this.futureData.timeRemaining : lifetime;
        const timeLeft = DOMHelpers.formatDuration(timeRemaining);
        
        // Calculate elapsed time more carefully to handle near-zero values
        const elapsed = Math.max(0, lifetime - timeRemaining);
        const progress = lifetime > 0 ? Math.min(100, ((elapsed / lifetime) * 100)).toFixed(1) : '0.0';
        
        console.log('Progress calculation:', {
            lifetime: lifetime,
            timeRemaining: timeRemaining,
            elapsed: elapsed,
            elapsedPercent: ((elapsed / lifetime) * 100).toFixed(4) + '%',
            progress: progress + '%',
            creationTime: this.futureData.creationTime,
            expiryTime: this.futureData.expiryTime,
            currentTime: Math.floor(Date.now() / 1000)
        });
        
        const isMyFuture = this.web3Provider.currentAddress?.toLowerCase() === this.futureData.owner.toLowerCase();

        let actionButtons = '';
        if (isMyFuture) {
            if (this.futureData.isListed) {
                actionButtons = `
                    <button id="delist-btn" class="btn-secondary">
                        Remove Listing
                    </button>
                `;
            } else {
                actionButtons = `
                    <button id="list-btn" class="btn-primary">
                        List for Sale
                    </button>
                `;
            }
        } else if (this.futureData.isListed) {
            const askPrice = parseFloat(ethers.utils.formatEther(this.futureData.askPrice)).toFixed(6);
            actionButtons = `
                <div class="buy-section">
                    <div class="buy-price">
                        <span class="label">Asking Price:</span>
                        <span class="price">${askPrice} ETH</span>
                    </div>
                    <button id="buy-btn" class="btn-primary">
                        Buy Future
                    </button>
                </div>
            `;
        }

        return `
            <div class="future-detail-view">
                <!-- Header -->
                <div class="view-header">
                    <button id="back-to-market-btn" class="btn-back">← Back to Market</button>
                    <h2>Future Contract Details</h2>
                </div>

                <!-- Main Info Card -->
                <div class="info-card">
                    <div class="card-header">
                        <div class="future-type-large">
                            <span class="type-emoji-large">${distEmoji}</span>
                            <div>
                                <h3>${distName} Distribution</h3>
                                <p class="type-description">${distDesc}</p>
                            </div>
                        </div>
                        ${this.futureData.isListed ? '<span class="status-badge status-listed-large">Listed for Sale</span>' : ''}
                    </div>

                    <!-- Value Stats -->
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Current Balance</div>
                            <div class="stat-value">${balance} ETH</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Expected Value</div>
                            <div class="stat-value">${expectedValue} ETH</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Initial Value</div>
                            <div class="stat-value">${initialValue} ETH</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Time Remaining</div>
                            <div class="stat-value">${timeLeft}</div>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="progress-section">
                        <div class="progress-header">
                            <span>Lifecycle Progress</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-labels">
                            <span>Created: ${createdDate}</span>
                            <span>Expires: ${expiryDate}</span>
                        </div>
                    </div>

                    <!-- Chart -->
                    <div class="chart-section">
                        <h4>Value Distribution Over Time</h4>
                        <canvas id="future-chart"></canvas>
                    </div>

                    <!-- Contract Info -->
                    <div class="contract-info">
                        <div class="info-row">
                            <span class="label">Contract Address:</span>
                            <span class="value">${this.futureData.address}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Owner:</span>
                            <span class="value">${this.futureData.owner} ${isMyFuture ? '(You)' : ''}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Distribution Type:</span>
                            <span class="value">Type ${this.futureData.distributionType} - ${distName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Lifetime:</span>
                            <span class="value">${DOMHelpers.formatDuration(this.futureData.lifetime)}</span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="action-section">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Back button
        const backBtn = this.containerElement.querySelector('#back-to-market-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                eventBus.emit('NAVIGATE_TO_MARKET');
            });
        }

        // List button
        const listBtn = this.containerElement.querySelector('#list-btn');
        if (listBtn) {
            listBtn.addEventListener('click', () => this.handleList());
        }

        // Delist button
        const delistBtn = this.containerElement.querySelector('#delist-btn');
        if (delistBtn) {
            delistBtn.addEventListener('click', () => this.handleDelist());
        }

        // Buy button
        const buyBtn = this.containerElement.querySelector('#buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => this.handleBuy());
        }
    }

    async handleList() {
        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet',
                type: 'warning'
            });
            return;
        }

        try {
            // Get suggested prices
            const fair = await this.factory.suggestPrice(this.futureData.address, 0);
            const premium5 = await this.factory.suggestPrice(this.futureData.address, 5);
            const premium10 = await this.factory.suggestPrice(this.futureData.address, 10);

            const fairEth = parseFloat(ethers.utils.formatEther(fair)).toFixed(6);
            const prem5Eth = parseFloat(ethers.utils.formatEther(premium5)).toFixed(6);
            const prem10Eth = parseFloat(ethers.utils.formatEther(premium10)).toFixed(6);

            const priceInput = prompt(
                `List price in ETH?\n\n` +
                `Fair value: ${fairEth} ETH\n` +
                `+5% premium: ${prem5Eth} ETH\n` +
                `+10% premium: ${prem10Eth} ETH\n\n` +
                `Enter your asking price:`
            );
            
            if (!priceInput) return;

            const priceWei = ethers.utils.parseEther(priceInput);
            await this.factory.listFuture(this.futureData.address, priceWei);
            await this.refresh();
        } catch (error) {
            console.error('Failed to list future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to list future: ' + error.message,
                type: 'error'
            });
        }
    }

    async handleDelist() {
        if (!confirm('Remove this future from the marketplace?')) {
            return;
        }

        try {
            await this.factory.delistFuture(this.futureData.address);
            await this.refresh();
        } catch (error) {
            console.error('Failed to delist future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to delist: ' + error.message,
                type: 'error'
            });
        }
    }

    async handleBuy() {
        const priceEth = parseFloat(ethers.utils.formatEther(this.futureData.askPrice)).toFixed(6);
        
        if (!confirm(`Buy this future for ${priceEth} ETH?\n\n1% marketplace fee applies.`)) {
            return;
        }

        try {
            await this.factory.buyFuture(this.futureData.address, this.futureData.askPrice);
            
            // Navigate back to market after successful purchase
            eventBus.emit(EVENTS.TOAST, {
                message: 'Future purchased successfully!',
                type: 'success'
            });
            
            setTimeout(() => {
                eventBus.emit('NAVIGATE_TO_MARKET');
            }, 1500);
        } catch (error) {
            console.error('Failed to buy future:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to buy: ' + error.message,
                type: 'error'
            });
        }
    }

    renderChart() {
        const canvas = this.containerElement.querySelector('#future-chart');
        if (!canvas) {
            console.error('Canvas not found for chart');
            return;
        }

        // ALWAYS calculate lifetime from factory's creationTime and expiryTime
        // Don't trust the contract's lifetime value as it might be stale or different
        const creationTimeNum = typeof this.futureData.creationTime === 'number' 
            ? this.futureData.creationTime 
            : (ethers.BigNumber.isBigNumber(this.futureData.creationTime) 
                ? this.futureData.creationTime.toNumber() 
                : Number(this.futureData.creationTime));
                
        const expiryTimeNum = typeof this.futureData.expiryTime === 'number'
            ? this.futureData.expiryTime
            : (ethers.BigNumber.isBigNumber(this.futureData.expiryTime)
                ? this.futureData.expiryTime.toNumber()
                : Number(this.futureData.expiryTime));
        
        const lifetime = expiryTimeNum - creationTimeNum;
        
        // Calculate time remaining from current timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timeRemaining = Math.max(0, expiryTimeNum - currentTimestamp);
        
        console.log('Rendering chart with data:', {
            lifetime: lifetime,
            timeRemaining: timeRemaining,
            distributionType: this.futureData.distributionType,
            balance: this.futureData.balance,
            creationTime: this.futureData.creationTime,
            expiryTime: this.futureData.expiryTime
        });

        if (!lifetime || lifetime <= 0) {
            console.error('Invalid lifetime for chart:', lifetime);
            canvas.parentElement.innerHTML = '<p style="color: red;">Invalid lifetime data</p>';
            return;
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded!');
            canvas.parentElement.innerHTML = '<p style="color: red;">Chart.js library not loaded</p>';
            return;
        }

        const ctx = canvas.getContext('2d');
        const currentTime = lifetime - timeRemaining;
        const distributionType = this.futureData.distributionType;
        
        // Get initial value in ETH for scaling
        const initialValueBN = ethers.BigNumber.isBigNumber(this.futureData.initialValue)
            ? this.futureData.initialValue
            : ethers.BigNumber.from(this.futureData.initialValue || '0');
        const initialValueEth = parseFloat(ethers.utils.formatEther(initialValueBN));

        // Generate data points
        const points = 100;
        const labels = [];
        const values = [];
        
        // Use the already-calculated values
        const creationTime = creationTimeNum;
        const expiryTime = expiryTimeNum;
        
        // Debug: Log the actual values
        console.log('🔍 Chart Debug:', {
            creationTime,
            expiryTime,
            lifetime,
            creationDate: new Date(creationTime * 1000).toLocaleString(),
            expiryDate: new Date(expiryTime * 1000).toLocaleString(),
            lifetimeHours: lifetime / 3600
        });

        for (let i = 0; i <= points; i++) {
            const t = (i / points) * lifetime;
            
            // Calculate the actual timestamp for this point
            const timestamp = creationTime + t;
            const date = new Date(timestamp * 1000);
            
            // Show labels only at beginning, middle, and end
            let tLabel = '';
            if (i === 0 || i === 50 || i === 100) {
                // Format as date/time
                tLabel = date.toLocaleString('en-US', { 
                    year: 'numeric',
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            labels.push(tLabel);
            
            const value = computeCdfValue(t, lifetime, distributionType);
            
            // Scale to actual ETH amounts
            values.push(value * initialValueEth);
        }

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Create new chart with "current time" marker
        const currentTimeIndex = Math.floor((currentTime / lifetime) * points);
        
        // Plugin to draw vertical line at current time
        const verticalLinePlugin = {
            id: 'verticalLine',
            afterDraw: (chart) => {
                if (chart.tooltip?._active?.length) {
                    return; // Don't draw if tooltip is active
                }
                
                const ctx = chart.ctx;
                const x = chart.scales.x;
                const y = chart.scales.y;
                
                // Calculate x position for current time
                const xPos = x.getPixelForValue(currentTimeIndex);
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(xPos, y.top);
                ctx.lineTo(xPos, y.bottom);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'red';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
                
                // Add label
                ctx.save();
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.fillText('Now', xPos, y.top - 5);
                ctx.restore();
            }
        };
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Payout',
                    data: values,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: initialValueEth * 1.05,
                        title: {
                            display: true,
                            text: 'Cumulative Payout (ETH)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(4) + ' ETH';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Timeline (Creation → End)'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                                enabled: true,
                        callbacks: {
                            label: function(context) {
                                const ethValue = context.parsed.y;
                                const percentage = (ethValue / initialValueEth) * 100;
                                return 'Cumulative: ' + ethValue.toFixed(6) + ' ETH (' + percentage.toFixed(1) + '%)';
                            }
                        }
                    }
                }
            },
            plugins: [verticalLinePlugin]
        });
    }

    async refresh() {
        await this.render();
    }

}

