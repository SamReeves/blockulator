/**
 * Create Future Form Component
 * Handles future creation with distribution type selection and valuation preview
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { ValueInput } from '../components/value-input.js';

export class CreateFutureForm {
    constructor(factory, web3Provider) {
        this.factory = factory;
        this.web3Provider = web3Provider;
        this.form = null;
        this.valueInput = null;
        this.chart = null;
    }

    init() {
        this.form = document.getElementById('create-future-form');
        if (!this.form) {
            console.error('Create future form not found');
            return;
        }

        // Initialize ETH input
        const valueContainer = document.getElementById('initial-value-input');
        if (valueContainer) {
            this.valueInput = new ValueInput('initial-value-input', {
                label: 'Initial Value',
                minWei: ethers.utils.parseEther('0.0001').toString(),
                hint: '1% creation fee will be deducted',
                defaultUnit: 'eth'
            });
            this.valueInput.render();
        }

        // Setup form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Setup distribution type change
        const distSelect = document.getElementById('distribution-type');
        if (distSelect) {
            distSelect.addEventListener('change', () => this.updateDistributionDescription());
            distSelect.addEventListener('change', () => this.updateChart());
        }

        // Setup lifetime slider
        const lifetimeSlider = document.getElementById('lifetime');
        if (lifetimeSlider) {
            lifetimeSlider.addEventListener('input', () => this.updateLifetimeDisplay());
            lifetimeSlider.addEventListener('change', () => this.updateChart());
        }

        // Initial updates
        this.updateDistributionDescription();
        this.updateLifetimeDisplay();
        this.updateChart();

        console.log('✅ Create Future Form initialized');
    }

    updateDistributionDescription() {
        const distSelect = document.getElementById('distribution-type');
        const descDiv = document.getElementById('distribution-description');
        
        if (!distSelect || !descDiv) return;

        const descriptions = {
            '0': 'Uniform: Constant payout rate. Linear accumulation - extract 50% at midpoint, 100% at end. Predictable.',
            '1': 'Gaussian: S-curve accumulation. Slow at start/end, rapid at middle. Extract ~50% at midpoint. Symmetric.',
            '2': 'Exponential Decay: Front-loaded payouts. Extract 95% by midpoint. Heavily favors early holders. Depreciates rapidly.',
            '3': 'Exponential Growth: Back-loaded payouts. Extract only 5% by midpoint. Heavily favors late holders. High early risk.',
            '4': 'Linear Decay: Accelerating accumulation. Extract ~75% by midpoint. Favors earlier holders, but not as extreme.',
            '5': 'Inverted Gaussian: Fast at edges, slow in middle. Extract 25% early, stalls, then accelerates to 100%. Unusual pattern.',
            '6': 'Linear Growth: Decelerating accumulation. Extract only ~25% by midpoint. Favors later holders, gradual ramp.'
        };

        descDiv.textContent = descriptions[distSelect.value] || '';
    }

    sliderToLifetime(sliderValue) {
        // Logarithmic mapping from slider (0-1000) to lifetime (300s - 31557600000s)
        const MIN_LIFETIME = 300; // 5 minutes
        const MAX_LIFETIME = 31557600000; // 1000 years
        const SLIDER_MAX = 1000;
        
        const ratio = sliderValue / SLIDER_MAX;
        const logMin = Math.log(MIN_LIFETIME);
        const logMax = Math.log(MAX_LIFETIME);
        
        const lifetime = Math.exp(logMin + ratio * (logMax - logMin));
        return Math.round(lifetime);
    }

    lifetimeToSlider(lifetime) {
        // Reverse: convert lifetime to slider position
        const MIN_LIFETIME = 300;
        const MAX_LIFETIME = 31557600000;
        const SLIDER_MAX = 1000;
        
        const logMin = Math.log(MIN_LIFETIME);
        const logMax = Math.log(MAX_LIFETIME);
        const logLifetime = Math.log(lifetime);
        
        const ratio = (logLifetime - logMin) / (logMax - logMin);
        return Math.round(ratio * SLIDER_MAX);
    }

    updateLifetimeDisplay() {
        const lifetimeSlider = document.getElementById('lifetime');
        const displaySpan = document.getElementById('lifetime-display');
        
        if (!lifetimeSlider || !displaySpan) return;

        const sliderValue = parseInt(lifetimeSlider.value);
        const seconds = this.sliderToLifetime(sliderValue);
        displaySpan.textContent = this.formatDuration(seconds);
    }

    updateChart() {
        const canvas = document.getElementById('distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const distSelect = document.getElementById('distribution-type');
        const lifetimeSlider = document.getElementById('lifetime');
        
        if (!distSelect || !lifetimeSlider) return;

        const distributionType = parseInt(distSelect.value);
        const sliderValue = parseInt(lifetimeSlider.value);
        const lifetime = this.sliderToLifetime(sliderValue);

        // Generate data points
        const points = 100;
        const labels = [];
        const values = [];

        for (let i = 0; i <= points; i++) {
            const t = (i / points) * lifetime;
            const tLabel = this.formatDuration(t);
            labels.push(i % 10 === 0 ? tLabel : ''); // Only show every 10th label
            
            let value = 1.0;
            
            if (distributionType === 0) {
                // UNIFORM: Constant rate → Linear payout
                // If you hold from 0 to t, you extract t/T of total value
                value = (t / lifetime);
                
            } else if (distributionType === 1) {
                // GAUSSIAN: Bell curve - cumulative payout via error function
                // Approximation of cumulative distribution
                const mean = lifetime / 2;
                const stddev = lifetime / 3.464101615;
                const z = (t - mean) / stddev;
                // Approximate CDF using tanh approximation
                value = 0.5 * (1 + Math.tanh(z / Math.sqrt(2)));
                
            } else if (distributionType === 2) {
                // EXPONENTIAL DECAY: Heavily weighted toward early payouts
                // CDF: F(t) = 1 - e^(-λt), most value extracted early
                const lambda = 3 / lifetime;
                value = 1.0 - Math.exp(-lambda * t);
                
            } else if (distributionType === 3) {
                // EXPONENTIAL GROWTH: Heavily weighted toward late payouts  
                // Value accumulates slowly at first, rapidly at end
                // Using λe^(αt) form where α is positive
                const lambda = 3 / lifetime;
                // Inverse: starts near 0, accelerates to ~95% at end
                value = (Math.exp(lambda * t / 3) - 1) / (Math.exp(lambda) - 1);
                
            } else if (distributionType === 4) {
                // LINEAR DECAY: Triangular, high rate at start
                // CDF of P(t) = (T-t)/T → F(t) = 1 - (1-t/T)^2 = 2t/T - (t/T)^2
                const ratio = t / lifetime;
                value = 2 * ratio - ratio * ratio;
                
            } else if (distributionType === 5) {
                // INVERTED GAUSSIAN: U-shaped, high at extremes
                // Fast payout at start, slow in middle, fast at end
                const mean = lifetime / 2;
                const stddev = lifetime / 3.464101615;
                
                // For inverted: integrate U-shaped PDF
                // Approximation: fast early (like exp decay), slow middle, fast late
                if (t < mean) {
                    // First half: fast start, slowing down
                    value = 0.5 * (1.0 - Math.exp(-6 * t / lifetime));
                } else {
                    // Second half: slow start, accelerating
                    const secondHalfRatio = (t - mean) / (lifetime / 2);
                    value = 0.5 + 0.5 * Math.exp(3 * (secondHalfRatio - 1));
                }
                
            } else if (distributionType === 6) {
                // LINEAR GROWTH: Triangular, high rate at end
                // CDF of P(t) = t/T → F(t) = (t/T)^2
                const ratio = t / lifetime;
                value = ratio * ratio;
            }
            
            values.push(value);
        }

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Chart colors and labels based on distribution type
        const colors = [
            { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)', name: 'Uniform - Constant Rate' },
            { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)', name: 'Gaussian - Bell Curve' },
            { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)', name: 'Exponential Decay - Early Payouts' },
            { border: 'rgb(75, 192, 75)', bg: 'rgba(75, 192, 75, 0.2)', name: 'Exponential Growth - Late Payouts' },
            { border: 'rgb(255, 159, 64)', bg: 'rgba(255, 159, 64, 0.2)', name: 'Linear Decay - High → Low' },
            { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)', name: 'Inverted Gaussian - U-Shape' },
            { border: 'rgb(255, 205, 86)', bg: 'rgba(255, 205, 86, 0.2)', name: 'Linear Growth - Low → High' }
        ];

        const color = colors[distributionType] || colors[0];

        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: color.name,
                    data: values,
                    borderColor: color.border,
                    backgroundColor: color.bg,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1.05,
                        title: {
                            display: true,
                            text: 'Cumulative Payout (% of Total Value)'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Since Creation'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return color.name + ': ' + (value * 100).toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }

        const submitBtn = document.getElementById('create-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        try {
            // Get form values
            const distSelect = document.getElementById('distribution-type');
            const lifetimeSlider = document.getElementById('lifetime');
            
            const distributionType = parseInt(distSelect.value);
            const sliderValue = parseInt(lifetimeSlider.value);
            const lifetime = this.sliderToLifetime(sliderValue);
            const valueWei = this.valueInput.getWeiString();

            // Validate
            if (!valueWei || valueWei === '0') {
                throw new Error('Please enter a valid ETH amount');
            }

            const minValue = ethers.utils.parseEther('0.0001');
            if (ethers.BigNumber.from(valueWei).lt(minValue)) {
                throw new Error('Minimum value is 0.0001 ETH');
            }

            // Create future
            console.log('Creating future:', { lifetime, distributionType, valueWei });
            const result = await this.factory.createFuture(lifetime, distributionType, valueWei);

            eventBus.emit(EVENTS.TOAST, {
                message: '🚀 Future created successfully!',
                type: 'success'
            });

            // Emit event for refresh
            eventBus.emit('FUTURE_CREATED', { 
                address: result.futureAddress,
                distributionType,
                lifetime
            });

            // Reset form
            this.form.reset();
            this.valueInput.reset();
            this.updateDistributionDescription();
            this.updateLifetimeDisplay();
            this.updateChart();

        } catch (error) {
            console.error('Failed to create future:', error);
            
            let errorMessage = 'Failed to create future';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled';
            } else if (error.message) {
                errorMessage = error.message;
            }

            eventBus.emit(EVENTS.TOAST, {
                message: errorMessage,
                type: 'error'
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Create Future';
            }
        }
    }

    formatDuration(seconds) {
        if (seconds < 60) return `${seconds} seconds`;
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${mins} minute${mins > 1 ? 's' : ''}`;
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        if (seconds < 31557600) {  // Less than 1 year
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        if (hours > 0) {
            return `${days} day${days > 1 ? 's' : ''} ${hours}h`;
        }
        return `${days} day${days > 1 ? 's' : ''}`;
        }
        // 1 year or more
        const years = Math.floor(seconds / 31557600);
        const remainingSeconds = seconds % 31557600;
        const days = Math.floor(remainingSeconds / 86400);
        if (days > 30) {
            const months = Math.floor(days / 30.44);
            return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
        }
        if (days > 0) {
            return `${years} year${years > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
        }
        return `${years} year${years > 1 ? 's' : ''}`;
    }
}

