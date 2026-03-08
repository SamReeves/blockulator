/**
 * Benchmark App - Gas & Precision Comparison
 * Compares fp128, abdk, and solady across arithmetic and transcendental operations.
 * Data driven from precision_distribution.json (statistical sweep) and benchmark-data.json (named cases).
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
        this.caseData = null;
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
            const [distResp, caseResp] = await Promise.all([
                fetch(`docs/benchmarks/precision_distribution.json?v=${Date.now()}`),
                fetch(`docs/benchmarks/benchmark-data.json?v=${Date.now()}`)
            ]);
            if (!distResp.ok || !caseResp.ok) throw new Error('Failed to load benchmark data');
            this.distData = await distResp.json();
            this.caseData = await caseResp.json();
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

    getStatValue(distEntry, metric) {
        if (!distEntry) return null;
        return this.useMedian ? distEntry[metric]?.median : distEntry[metric]?.mean;
    }

    renderSummaryTable() {
        const stats = this.distData.stats;
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
                const entry = stats[lib]?.[func];
                if (entry) sampleCount = Math.max(sampleCount, entry.count || 0);
                rowData[lib] = {
                    gas: this.getStatValue(entry, 'gas'),
                    digits: this.getStatValue(entry, 'digits')
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
        const stats = this.distData.stats;
        let html = '';

        for (const func of FUNCTIONS) {
            let sampleCount = 0;
            const libData = [];
            
            for (const lib of LIBS) {
                const entry = stats[lib]?.[func];
                if (!entry) continue;
                sampleCount = Math.max(sampleCount, entry.count || 0);
                const median = entry.digits?.median;
                if (median != null && median > 0) {
                    libData.push({ lib, median });
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

        // Render charts after DOM is updated
        for (const func of FUNCTIONS) {
            const canvasId = `bench-hist-${func}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) continue;

            const libData = [];
            for (const lib of LIBS) {
                const entry = stats[lib]?.[func];
                if (!entry) continue;
                const median = entry.digits?.median;
                if (median != null && median > 0) {
                    libData.push({ lib, median });
                }
            }

            if (libData.length === 0) continue;

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: libData.map(d => LIB_META[d.lib].name),
                    datasets: [{
                        data: libData.map(d => d.median),
                        backgroundColor: libData.map(d => LIB_META[d.lib].color),
                        borderColor: libData.map(d => LIB_META[d.lib].color),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleColor: '#fff',
                            bodyColor: '#ccc',
                            borderColor: '#444',
                            borderWidth: 1,
                            padding: 8,
                            displayColors: false,
                            callbacks: {
                                label: (ctx) => `${ctx.parsed.y.toFixed(1)} digits`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 40,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#999', font: { size: 10 } },
                            title: { display: false }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#ccc', font: { size: 10 } }
                        }
                    }
                }
            });
        }
    }

    // ── Scatter Chart ─────────────────────────────────────────────────

    renderScatterChart() {
        const stats = this.distData.stats;
        const canvas = document.getElementById('bench-scatter-chart');

        if (this.charts.scatter) {
            this.charts.scatter.destroy();
        }

        const datasets = LIBS.map(lib => {
            const points = [];
            for (const func of FUNCTIONS) {
                const entry = stats[lib]?.[func];
                if (!entry) continue;
                const gas = this.useMedian ? entry.gas?.median : entry.gas?.mean;
                const digits = this.useMedian ? entry.digits?.median : entry.digits?.mean;
                // Filter out functions not supported by library (median == 0 indicates no support)
                if (gas == null || digits == null || entry.digits?.median <= 0) continue;
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
