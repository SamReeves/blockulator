/**
 * Create Future Form Component
 * Handles future creation with distribution type selection and valuation preview
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';
import { ValueInput } from '../components/value-input.js';
import { DOMHelpers } from '../dom/dom-helpers.js';
import { computeCdfValue } from './distribution-cdf.js';

const DISTRIBUTIONS = {
    0: 'Uniform: Constant payout rate. Linear accumulation - extract 50% at midpoint, 100% at end. Predictable.',
    1: 'Gaussian: S-curve accumulation. Slow at start/end, rapid at middle. Extract ~50% at midpoint. Symmetric.',
    2: 'Exponential Decay: Front-loaded payouts. Extract 95% by midpoint. Heavily favors early holders.',
    3: 'Exponential Growth: Back-loaded payouts. Extract only 5% by midpoint. Heavily favors late holders.',
    4: 'Linear Decay: Accelerating accumulation. Extract ~75% by midpoint. Favors earlier holders.',
    5: 'Linear Growth: Decelerating accumulation. Extract only ~25% by midpoint. Favors later holders.'
};

const CHART_COLORS = [
    { border: 'rgb(54, 162, 235)',  bg: 'rgba(54, 162, 235, 0.2)',  name: 'Uniform - Constant Rate' },
    { border: 'rgb(75, 192, 192)',  bg: 'rgba(75, 192, 192, 0.2)',  name: 'Gaussian - Bell Curve' },
    { border: 'rgb(255, 99, 132)',  bg: 'rgba(255, 99, 132, 0.2)',  name: 'Exponential Decay' },
    { border: 'rgb(75, 192, 75)',   bg: 'rgba(75, 192, 75, 0.2)',   name: 'Exponential Growth' },
    { border: 'rgb(255, 159, 64)',  bg: 'rgba(255, 159, 64, 0.2)',  name: 'Linear Decay' },
    { border: 'rgb(255, 205, 86)',  bg: 'rgba(255, 205, 86, 0.2)',  name: 'Linear Growth' }
];

const MIN_LIFETIME = 300;          // 5 minutes
const MAX_LIFETIME = 31557600000;  // 1000 years
const SLIDER_MAX = 1000;

export class CreateFutureForm {
    constructor(factory, web3Provider) {
        this.factory = factory;
        this.web3Provider = web3Provider;
        this.form = null;
        this.valueInput = null;
        this.chart = null;
        this.submitting = false;
    }

    init() {
        this.form = document.getElementById('create-future-form');
        if (!this.form) {
            console.warn('[CreateFutureForm] Form element not found');
            return;
        }

        this.initValueInput();
        this.bindEvents();
        this.updateDistributionDescription();
        this.updateLifetimeDisplay();
        this.updateChart();

        console.log('[CreateFutureForm] Initialized');
    }

    initValueInput() {
        const container = document.getElementById('initial-value-input');
        if (!container) return;

        this.valueInput = new ValueInput('initial-value-input', {
            label: 'Initial Value',
            minWei: ethers.utils.parseEther('0.0001').toString(),
            hint: 'Minimum 0.0001 ETH. No fees.',
            defaultUnit: 'eth'
        });
        this.valueInput.render();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        const distSelect = document.getElementById('distribution-type');
        if (distSelect) {
            distSelect.addEventListener('change', () => {
                this.updateDistributionDescription();
                this.updateChart();
            });
        }

        const lifetimeSlider = document.getElementById('lifetime');
        if (lifetimeSlider) {
            lifetimeSlider.addEventListener('input', () => this.updateLifetimeDisplay());
            lifetimeSlider.addEventListener('change', () => this.updateChart());
        }
    }

    // ── Slider ↔ Lifetime conversion (logarithmic scale) ──────────────

    sliderToLifetime(sliderValue) {
        const ratio = sliderValue / SLIDER_MAX;
        return Math.round(Math.exp(
            Math.log(MIN_LIFETIME) + ratio * (Math.log(MAX_LIFETIME) - Math.log(MIN_LIFETIME))
        ));
    }

    // ── UI Updates ────────────────────────────────────────────────────

    updateDistributionDescription() {
        const distSelect = document.getElementById('distribution-type');
        const descDiv = document.getElementById('distribution-description');
        if (!distSelect || !descDiv) return;
        descDiv.textContent = DISTRIBUTIONS[distSelect.value] || '';
    }

    updateLifetimeDisplay() {
        const slider = document.getElementById('lifetime');
        const display = document.getElementById('lifetime-display');
        const expiryDisplay = document.getElementById('lifetime-expiry');
        if (!slider || !display) return;
        
        const lifetime = this.sliderToLifetime(parseInt(slider.value));
        const { duration, expiry } = DOMHelpers.formatLifetimeWithExpiry(lifetime);
        
        display.textContent = duration;
        if (expiryDisplay) {
            expiryDisplay.textContent = `Expires: ${expiry}`;
        }
    }

    updateChart() {
        const canvas = document.getElementById('distribution-chart');
        const distSelect = document.getElementById('distribution-type');
        const lifetimeSlider = document.getElementById('lifetime');
        if (!canvas || !distSelect || !lifetimeSlider || typeof Chart === 'undefined') return;

        const distributionType = parseInt(distSelect.value);
        const lifetime = this.sliderToLifetime(parseInt(lifetimeSlider.value));
        const color = CHART_COLORS[distributionType] || CHART_COLORS[0];

        const points = 100;
        const labels = [];
        const values = [];

        for (let i = 0; i <= points; i++) {
            const t = (i / points) * lifetime;
            // Show labels at 0%, 25%, 50%, 75%, 100%
            if (i === 0 || i === 25 || i === 50 || i === 75 || i === 100) {
                labels.push(DOMHelpers.formatDuration(Math.round(t)));
            } else {
                labels.push('');
            }
            values.push(computeCdfValue(t, lifetime, distributionType));
        }

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
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
                        title: { display: true, text: 'Cumulative Payout (% of Total Value)' },
                        ticks: { callback: v => (v * 100).toFixed(0) + '%' }
                    },
                    x: {
                        title: { display: true, text: 'Time Since Creation' }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: ctx => color.name + ': ' + (ctx.parsed.y * 100).toFixed(1) + '%'
                        }
                    }
                }
            }
        });
    }

    // ── Form Submission ───────────────────────────────────────────────

    async handleSubmit(e) {
        e.preventDefault();

        if (this.submitting) return;

        // Validate wallet
        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, { message: 'Please connect your wallet first', type: 'warning' });
            return;
        }

        // Validate factory
        if (!this.factory?.contract) {
            eventBus.emit(EVENTS.TOAST, { message: 'Factory contract not loaded. Try refreshing the page.', type: 'error' });
            return;
        }

        // Read form values
        const distSelect = document.getElementById('distribution-type');
        const lifetimeSlider = document.getElementById('lifetime');
        if (!distSelect || !lifetimeSlider) return;

        const distributionType = parseInt(distSelect.value);
        const lifetime = this.sliderToLifetime(parseInt(lifetimeSlider.value));
        const valueWei = this.valueInput?.getWeiString();

        // Validate amount
        if (!valueWei || valueWei === '0') {
            eventBus.emit(EVENTS.TOAST, { message: 'Please enter an ETH amount', type: 'warning' });
            return;
        }

        const minValue = ethers.utils.parseEther('0.0001');
        if (ethers.BigNumber.from(valueWei).lt(minValue)) {
            eventBus.emit(EVENTS.TOAST, { message: 'Minimum value is 0.0001 ETH', type: 'warning' });
            return;
        }

        const submitBtn = document.getElementById('create-submit-btn');
        this.submitting = true;

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ Creating...';
            }

            console.log('[CreateFutureForm] Creating future:', {
                distributionType,
                lifetime: DOMHelpers.formatDuration(lifetime),
                lifetimeSeconds: lifetime,
                valueWei,
                valueEth: ethers.utils.formatEther(valueWei)
            });

            const result = await this.factory.createFuture(lifetime, distributionType, valueWei);

            console.log('[CreateFutureForm] Future created:', result);

            eventBus.emit(EVENTS.TOAST, { message: '🚀 Future created successfully!', type: 'success' });

            eventBus.emit(EVENTS.FUTURE_CREATED, {
                address: result.futureAddress,
                distributionType,
                lifetime
            });

            // Reset form
            this.form.reset();
            if (this.valueInput) this.valueInput.reset();
            this.updateDistributionDescription();
            this.updateLifetimeDisplay();
            this.updateChart();

        } catch (error) {
            console.error('[CreateFutureForm] Failed:', error);

            let msg = 'Failed to create future';
            if (error.code === 'ACTION_REJECTED' || error.message?.includes('user rejected')) {
                msg = 'Transaction cancelled by user';
            } else if (error.reason) {
                msg = error.reason;
            } else if (error.message) {
                msg = error.message.length > 100 ? error.message.slice(0, 100) + '...' : error.message;
            }

            eventBus.emit(EVENTS.TOAST, { message: msg, type: 'error' });

        } finally {
            this.submitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Create Future';
            }
        }
    }
}
