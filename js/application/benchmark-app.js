/**
 * Benchmark App - Gas & Precision Comparison
 * Compares fp128, abdk, and solady across arithmetic and transcendental operations.
 * All data derived from precision_distribution.json raw sweep data.
 */

const LIBS = ['fp128', 'abdk', 'solady'];
const FUNCTIONS = ['mul', 'div', 'add', 'sub', 'exp', 'exp2', 'ln', 'log2', 'sqrt', 'pow'];

const LIB_META = {
    fp128:  { name: 'FP128',  format: '128.128 fixed-point', lang: 'Huff',            color: '#2196F3' },
    abdk:   { name: 'ABDK',   format: '64.64 fixed-point',   lang: 'Solidity',        color: '#FF9800' },
    solady: { name: 'Solady', format: 'WAD 18-decimal',      lang: 'Solidity (asm)',   color: '#9C27B0' }
};

export class BenchmarkApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.distData = null;
        this.charts = {};
        this.useMedian = false;
    }

    async init() {
        this.renderHTML();
        await this.loadData();
        this.setupListeners();
        this.renderSummaryTable();
        this.renderDistributions();
        this.renderScatterChart();
    }

    // ── Data Loading ──────────────────────────────────────────────────

    async loadData() {
        try {
            const resp = await fetch(`docs/benchmarks/precision_distribution.json?v=${Date.now()}`);
            if (!resp.ok) throw new Error('Failed to load benchmark data');
            this.distData = await resp.json();
        } catch (error) {
            console.error('Error loading benchmark data:', error);
            document.getElementById('bench-loading').textContent =
                'Error loading benchmark data. Run benchmarks first.';
            throw error;
        }
    }

    // ── HTML Shell ────────────────────────────────────────────────────

    renderHTML() {
        const container = document.getElementById('benchmarks-container');
        container.innerHTML = `
            <div class="bench-shell">
                <div class="bench-header">
                    <h2 class="bench-title">Gas & Precision Benchmarks</h2>
                    <div class="bench-legend">
                        ${LIBS.map(lib => `
                            <span class="bench-legend-item">
                                <span class="bench-legend-dot" style="background:${LIB_META[lib].color}"></span>
                                <strong>${LIB_META[lib].name}</strong>
                                <span class="bench-legend-meta">${LIB_META[lib].format}, ${LIB_META[lib].lang}</span>
                            </span>
                        `).join('')}
                    </div>
                    <p class="bench-subtitle">Precision measured as matching decimal digits vs 100-digit mpmath oracle. Gas from Foundry traces.</p>
                </div>

                <div id="bench-loading" class="bench-loading">Loading benchmark data...</div>

                <div id="bench-content" class="bench-content hidden">
                    <!-- Summary Table -->
                    <section class="bench-section">
                        <div class="bench-section-head">
                            <h3>Summary</h3>
                            <div class="bench-stat-toggle">
                                <button class="bench-toggle active" data-stat="mean">Mean</button>
                                <button class="bench-toggle" data-stat="median">Median</button>
                            </div>
                        </div>
                        <div id="bench-summary-table" class="bench-table-wrap"></div>
                    </section>

                    <!-- Scatter Chart -->
                    <section class="bench-section">
                        <h3>Gas vs Precision Tradeoff</h3>
                        <p class="bench-section-note">Each dot is one function. Upper-left is better (less gas, more precision).</p>
                        <div class="bench-scatter-wrap">
                            <canvas id="bench-scatter-chart"></canvas>
                        </div>
                    </section>

                    <!-- Distribution Histograms -->
                    <section class="bench-section">
                        <h3>Precision Distributions</h3>
                        <p class="bench-section-note">Median digits across hundreds of test inputs for each function.</p>
                        <div id="bench-dist-grid" class="bench-dist-grid"></div>
                    </section>
                </div>
            </div>
        `;
    }

    // ── Event Listeners ───────────────────────────────────────────────

    setupListeners() {
        document.getElementById('bench-loading').classList.add('hidden');
        document.getElementById('bench-content').classList.remove('hidden');

        document.querySelectorAll('.bench-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bench-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.useMedian = btn.dataset.stat === 'median';
                this.renderSummaryTable();
                this.renderScatterChart();
            });
        });
    }

    // ── Summary Table ─────────────────────────────────────────────────

    computeStats(values) {
        if (!values || values.length === 0) return null;
        const sorted = [...values].sort((a, b) => a - b);
        return {
            median: this.percentile(sorted, 50),
            mean: sorted.reduce((a, b) => a + b, 0) / sorted.length
        };
    }

    renderSummaryTable() {
        const raw = this.distData.raw;
        const statLabel = this.useMedian ? 'Median' : 'Mean';

        let html = `<table class="bench-summary">
            <thead>
                <tr>
                    <th class="col-func">Function</th>
                    <th class="col-n">n</th>
                    ${LIBS.map(lib =>
                        `<th class="col-lib" colspan="2">
                            <span class="bench-lib-head" style="border-bottom-color:${LIB_META[lib].color}">${LIB_META[lib].name}</span>
                        </th>`
                    ).join('')}
                </tr>
                <tr class="bench-subhead">
                    <th></th>
                    <th></th>
                    ${LIBS.map(() => `<th>Gas</th><th>Digits</th>`).join('')}
                </tr>
            </thead>
            <tbody>`;

        for (const func of FUNCTIONS) {
            const rowData = {};
            let sampleCount = 0;
            
            for (const lib of LIBS) {
                const rawData = raw[lib]?.[func] || [];
                sampleCount = Math.max(sampleCount, rawData.length);
                
                const gasStats = this.computeStats(rawData.map(d => d.gas));
                const digitStats = this.computeStats(rawData.map(d => d.digits));
                
                rowData[lib] = {
                    gas: gasStats ? (this.useMedian ? gasStats.median : gasStats.mean) : null,
                    digits: digitStats ? (this.useMedian ? digitStats.median : digitStats.mean) : null
                };
            }

            const gasValues = LIBS.map(l => rowData[l].gas).filter(v => v != null && v > 0);
            const digitValues = LIBS.map(l => rowData[l].digits).filter(v => v != null && v > 0);
            const bestGas = gasValues.length > 0 ? Math.min(...gasValues) : null;
            const bestDigits = digitValues.length > 0 ? Math.max(...digitValues) : null;

            html += `<tr>
                <td class="col-func">${func.toUpperCase()}</td>
                <td class="col-n">${sampleCount}</td>`;

            for (const lib of LIBS) {
                const g = rowData[lib].gas;
                const d = rowData[lib].digits;
                const gasClass = g != null && g === bestGas ? 'best' : '';
                const digClass = d != null && d === bestDigits ? 'best' : '';

                html += `<td class="col-gas ${gasClass}">${g != null ? Math.round(g).toLocaleString() : '<span class="na">—</span>'}</td>`;
                html += `<td class="col-digits ${digClass}">${d != null ? d.toFixed(1) : '<span class="na">—</span>'}</td>`;
            }
            html += '</tr>';
        }

        html += '</tbody></table>';
        document.getElementById('bench-summary-table').innerHTML = html;
    }

    // ── Distribution Histograms ───────────────────────────────────────

    renderDistributions() {
        const raw = this.distData.raw;
        let html = '';

        for (const func of FUNCTIONS) {
            let sampleCount = 0;
            const libData = [];
            
            for (const lib of LIBS) {
                const rawData = raw[lib]?.[func] || [];
                if (rawData.length === 0) continue;
                sampleCount = Math.max(sampleCount, rawData.length);
                
                const digits = rawData.map(d => d.digits).sort((a, b) => a - b);
                const median = this.percentile(digits, 50);
                
                if (median > 0) {
                    libData.push({ lib });
                }
            }

            if (libData.length === 0) continue;

            const canvasId = `bench-hist-${func}`;
            html += `
            <div class="bench-dist-card">
                <div class="bench-dist-card-title">${func.toUpperCase()}</div>
                <canvas id="${canvasId}"></canvas>
                <div class="bench-dist-card-note">${sampleCount} cases</div>
            </div>`;
        }

        document.getElementById('bench-dist-grid').innerHTML = html;

        // Render box-whisker charts after DOM is updated
        for (const func of FUNCTIONS) {
            const canvasId = `bench-hist-${func}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) continue;

            const datasets = [];
            for (const lib of LIBS) {
                const rawData = raw[lib]?.[func] || [];
                const digits = rawData.map(d => d.digits).sort((a, b) => a - b);
                
                if (digits.length === 0) continue;
                
                // Compute quartiles from raw data
                const q1 = this.percentile(digits, 25);
                const median = this.percentile(digits, 50);
                const q3 = this.percentile(digits, 75);
                const min = digits[0];
                const max = digits[digits.length - 1];
                
                // Skip if median is 0 (unsupported function)
                if (median <= 0) continue;
                
                datasets.push({
                    label: LIB_META[lib].name,
                    data: [{
                        x: lib,
                        min: min,
                        q1: q1,
                        median: median,
                        q3: q3,
                        max: max
                    }],
                    backgroundColor: LIB_META[lib].color + '40',
                    borderColor: LIB_META[lib].color,
                    borderWidth: 2
                });
            }

            if (datasets.length === 0) continue;

            // Custom box-whisker rendering
            const ctx = canvas.getContext('2d');
            this.renderBoxWhisker(ctx, datasets, func);
        }
    }
    
    percentile(arr, p) {
        if (arr.length === 0) return 0;
        const idx = (p / 100) * (arr.length - 1);
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        const weight = idx - lower;
        return arr[lower] * (1 - weight) + arr[upper] * weight;
    }
    
    renderBoxWhisker(ctx, datasets, func) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        
        // Clear canvas
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        // Y-axis (digits 0-40)
        const maxDigits = 40;
        const yScale = plotHeight / maxDigits;
        
        // Draw y-axis
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + plotHeight);
        ctx.stroke();
        
        // Y-axis labels
        ctx.fillStyle = '#999';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 40; i += 10) {
            const y = padding.top + plotHeight - (i * yScale);
            ctx.fillText(i.toString(), padding.left - 5, y + 3);
            ctx.strokeStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + plotWidth, y);
            ctx.stroke();
        }
        
        // Draw boxes
        const boxWidth = plotWidth / datasets.length;
        datasets.forEach((ds, i) => {
            const d = ds.data[0];
            const x = padding.left + i * boxWidth + boxWidth * 0.2;
            const w = boxWidth * 0.6;
            
            const minY = padding.top + plotHeight - (d.min * yScale);
            const q1Y = padding.top + plotHeight - (d.q1 * yScale);
            const medianY = padding.top + plotHeight - (d.median * yScale);
            const q3Y = padding.top + plotHeight - (d.q3 * yScale);
            const maxY = padding.top + plotHeight - (d.max * yScale);
            
            // Whiskers
            ctx.strokeStyle = ds.borderColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + w/2, minY);
            ctx.lineTo(x + w/2, q1Y);
            ctx.moveTo(x + w/2, q3Y);
            ctx.lineTo(x + w/2, maxY);
            ctx.stroke();
            
            // Min/max caps
            ctx.beginPath();
            ctx.moveTo(x + w*0.3, minY);
            ctx.lineTo(x + w*0.7, minY);
            ctx.moveTo(x + w*0.3, maxY);
            ctx.lineTo(x + w*0.7, maxY);
            ctx.stroke();
            
            // IQR box
            ctx.fillStyle = ds.backgroundColor;
            ctx.fillRect(x, q3Y, w, q1Y - q3Y);
            ctx.strokeStyle = ds.borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, q3Y, w, q1Y - q3Y);
            
            // Median line
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, medianY);
            ctx.lineTo(x + w, medianY);
            ctx.stroke();
            
            // Library label
            ctx.fillStyle = '#ccc';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ds.label, x + w/2, padding.top + plotHeight + 20);
        });
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, padding.top + plotHeight/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillStyle = '#999';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Matching Digits', 0, 0);
        ctx.restore();
    }

    // ── Scatter Chart ─────────────────────────────────────────────────

    renderScatterChart() {
        const raw = this.distData.raw;
        const canvas = document.getElementById('bench-scatter-chart');

        if (this.charts.scatter) {
            this.charts.scatter.destroy();
        }

        const datasets = LIBS.map(lib => {
            const points = [];
            for (const func of FUNCTIONS) {
                const rawData = raw[lib]?.[func] || [];
                if (rawData.length === 0) continue;
                
                // Compute stats from raw data
                const gasValues = rawData.map(d => d.gas);
                const digitValues = rawData.map(d => d.digits);
                const gasStats = this.computeStats(gasValues);
                const digitStats = this.computeStats(digitValues);
                
                if (!gasStats || !digitStats) continue;
                
                const gas = this.useMedian ? gasStats.median : gasStats.mean;
                const digits = this.useMedian ? digitStats.median : digitStats.mean;
                
                // Filter out functions not supported by library (median == 0)
                if (digitStats.median <= 0) continue;
                
                points.push({ x: gas, y: digits, func: func.toUpperCase() });
            }
            return {
                label: LIB_META[lib].name,
                data: points,
                backgroundColor: LIB_META[lib].color,
                borderColor: LIB_META[lib].color,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointStyle: 'circle'
            };
        });

        this.charts.scatter = new Chart(canvas.getContext('2d'), {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#ccc', font: { family: "'Courier New', monospace" } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pt = ctx.raw;
                                return `${ctx.dataset.label} ${pt.func}: ${Math.round(pt.x).toLocaleString()} gas, ${pt.y.toFixed(1)} digits`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: { display: true, text: `Gas (${this.useMedian ? 'median' : 'mean'})`, color: '#888' },
                        ticks: { color: '#888', callback: v => v.toLocaleString() },
                        grid: { color: '#2a2a2a' }
                    },
                    y: {
                        title: { display: true, text: `Matching Digits (${this.useMedian ? 'median' : 'mean'})`, color: '#888' },
                        ticks: { color: '#888' },
                        grid: { color: '#2a2a2a' }
                    }
                }
            }
        });
    }
}
