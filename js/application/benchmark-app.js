/**
 * Benchmark App - Gas & Precision Comparison
 * Compares fp127, abdk, solady, and prbmath across arithmetic and transcendental operations.
 * All data derived from precision_distribution.json raw sweep data.
 */

const LIBS = ['fp127', 'abdk', 'solady', 'prb'];

// Preferred display order for functions (new functions will be appended)
const PREFERRED_FUNCTION_ORDER = ['mul', 'div', 'add', 'sub', 'exp', 'exp2', 'ln', 'log2', 'sqrt', 'pow', 'abs', 'inv', 'min', 'max', 'avg', 'dist', 'gavg', 'log10', 'exp10', 'sign', 'floor', 'ceil', 'frac', 'cbrt', 'lerp', 'hypot', 'round', 'log2up', 'gcd', 'factorial', 'lambertw0'];

const LIB_META = {
    fp127:  { name: 'FP127',    format: '128.128 fixed-point', lang: 'Huff',            color: '#2196F3' },
    abdk:   { name: 'ABDK',     format: '64.64 fixed-point',   lang: 'Solidity',        color: '#FF9800' },
    solady: { name: 'Solady',   format: 'WAD 18-decimal',      lang: 'Solidity (asm)',   color: '#9C27B0' },
    prb:    { name: 'PRBMath',  format: 'WAD 18-decimal',      lang: 'Solidity',         color: '#4CAF50' }
};

const INTEGER_ONLY_FUNCTIONS = new Set([
    'sign', 'floor', 'ceil', 'round', 'log2up', 'gcd', 'factorial'
]);

const LIB_UNSUPPORTED = {
    fp127:  new Set(),
    abdk:   new Set(['sign', 'floor', 'ceil', 'frac', 'cbrt', 'lerp', 'hypot', 'round', 'log2up', 'gcd', 'factorial', 'lambertw0']),
    solady: new Set(['exp2', 'log2', 'sign', 'floor', 'ceil', 'frac', 'lerp', 'hypot', 'round', 'log2up']),
    prb:    new Set(['min', 'max', 'dist', 'exp10', 'sign', 'cbrt', 'lerp', 'hypot', 'round', 'log2up', 'gcd', 'factorial', 'lambertw0'])
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
        this.renderScatterChart();
    }

    // ── Data Loading ──────────────────────────────────────────────────

    async loadData() {
        try {
            const resp = await fetch(`docs/benchmarks/precision_distribution.json?v=${Date.now()}`);
            if (!resp.ok) throw new Error('Failed to load benchmark data');
            this.distData = await resp.json();
            
            // Auto-discover functions from JSON data
            this.functions = this.discoverFunctions();
        } catch (error) {
            console.error('Error loading benchmark data:', error);
            document.getElementById('bench-loading').textContent =
                'Error loading benchmark data. Run benchmarks first.';
            throw error;
        }
    }

    discoverFunctions() {
        // Collect all functions from all libraries in the JSON
        const allFunctions = new Set();
        const raw = this.distData.raw || {};
        
        for (const lib of LIBS) {
            if (raw[lib]) {
                Object.keys(raw[lib]).forEach(func => allFunctions.add(func));
            }
        }
        
        // Sort by preferred order, then append any new functions alphabetically
        const discovered = Array.from(allFunctions);
        const ordered = [];
        
        // Add functions in preferred order
        for (const func of PREFERRED_FUNCTION_ORDER) {
            if (discovered.includes(func)) {
                ordered.push(func);
            }
        }
        
        // Add any new functions not in preferred order (alphabetically)
        const remaining = discovered
            .filter(f => !PREFERRED_FUNCTION_ORDER.includes(f))
            .sort();
        
        return [...ordered, ...remaining];
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
                    <!-- Scatter Chart -->
                    <section class="bench-section">
                        <h3>Gas vs Precision Tradeoff</h3>
                        <p class="bench-section-note">Each candlestick shows precision spread across 50 test inputs. Upper-left is better (less gas, more precision).</p>
                        <div class="bench-scatter-container">
                            <div class="bench-scatter-wrap">
                                <canvas id="bench-scatter-chart"></canvas>
                            </div>
                            <div class="bench-scatter-legend">
                                <h4>How to Read</h4>
                                <div class="legend-candlestick">
                                    <svg width="60" height="120" viewBox="0 0 60 120">
                                        <!-- Max whisker cap -->
                                        <line x1="20" y1="10" x2="40" y2="10" stroke="#888" stroke-width="1.5"/>
                                        <!-- Upper whisker -->
                                        <line x1="30" y1="10" x2="30" y2="30" stroke="#888" stroke-width="1.5"/>
                                        <!-- IQR box -->
                                        <rect x="22" y="30" width="16" height="40" fill="#2196F340" stroke="#2196F3" stroke-width="2"/>
                                        <!-- Median line -->
                                        <line x1="22" y1="50" x2="38" y2="50" stroke="#fff" stroke-width="2"/>
                                        <!-- Lower whisker -->
                                        <line x1="30" y1="70" x2="30" y2="90" stroke="#888" stroke-width="1.5"/>
                                        <!-- Min whisker cap -->
                                        <line x1="20" y1="90" x2="40" y2="90" stroke="#888" stroke-width="1.5"/>
                                        <!-- Labels -->
                                        <text x="45" y="13" fill="#aaa" font-size="10">Max</text>
                                        <text x="45" y="43" fill="#aaa" font-size="10">Q3</text>
                                        <text x="45" y="53" fill="#fff" font-size="10">Median</text>
                                        <text x="45" y="73" fill="#aaa" font-size="10">Q1</text>
                                        <text x="45" y="93" fill="#aaa" font-size="10">Min</text>
                                    </svg>
                                </div>
                                <div class="legend-note">
                                    <strong>Upper-left is better:</strong><br>
                                    Lower gas cost, higher precision
                                </div>
                                <div class="legend-colors">
                                    <h5>Libraries</h5>
                                    ${LIBS.map(lib => `
                                        <div class="legend-color-item">
                                            <span class="legend-color-box" style="background:${LIB_META[lib].color}"></span>
                                            <span>${LIB_META[lib].name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </section>

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

        for (const func of this.functions) {
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

            const supportedLibs = LIBS.filter(l => !LIB_UNSUPPORTED[l]?.has(func));
            const gasValues = supportedLibs.map(l => rowData[l].gas).filter(v => v != null && v > 0);
            const digitValues = supportedLibs.map(l => rowData[l].digits).filter(v => v != null && v > 0);
            const bestGas = gasValues.length > 0 ? Math.min(...gasValues) : null;
            const bestDigits = digitValues.length > 0 ? Math.max(...digitValues) : null;

            html += `<tr>
                <td class="col-func">${func.toUpperCase()}</td>
                <td class="col-n">${sampleCount}</td>`;

            const isIntOnly = INTEGER_ONLY_FUNCTIONS.has(func);

            for (const lib of LIBS) {
                const unsupported = LIB_UNSUPPORTED[lib]?.has(func);
                const g = rowData[lib].gas;
                const d = rowData[lib].digits;
                const gasClass = g != null && g === bestGas ? 'best' : '';
                const digClass = d != null && d === bestDigits ? 'best' : '';

                if (unsupported) {
                    html += `<td class="col-gas"><span class="unsupported">✗</span></td>`;
                    html += `<td class="col-digits"><span class="unsupported">✗</span></td>`;
                } else {
                    html += `<td class="col-gas ${gasClass}">${g != null ? Math.round(g).toLocaleString() : '<span class="na">—</span>'}</td>`;
                    const digitDisplay = isIntOnly
                        ? '<span class="int-only">i</span>'
                        : (d != null ? d.toFixed(1) : '<span class="na">—</span>');
                    html += `<td class="col-digits ${digClass}">${digitDisplay}</td>`;
                }
            }
            html += '</tr>';
        }

        html += '</tbody></table>';
        document.getElementById('bench-summary-table').innerHTML = html;
    }

    percentile(arr, p) {
        if (arr.length === 0) return 0;
        const idx = (p / 100) * (arr.length - 1);
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        const weight = idx - lower;
        return arr[lower] * (1 - weight) + arr[upper] * weight;
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
            for (const func of this.functions) {
                const rawData = raw[lib]?.[func] || [];
                if (rawData.length === 0) continue;
                
                // Compute stats from raw data
                const gasValues = rawData.map(d => d.gas);
                const digitValues = rawData.map(d => d.digits).sort((a, b) => a - b);
                const gasStats = this.computeStats(gasValues);
                
                if (!gasStats) continue;
                
                const gas = this.useMedian ? gasStats.median : gasStats.mean;
                
                // Compute digit quartiles for candlestick
                const min = digitValues[0];
                const q1 = this.percentile(digitValues, 25);
                const median = this.percentile(digitValues, 50);
                const q3 = this.percentile(digitValues, 75);
                const max = digitValues[digitValues.length - 1];
                
                // Filter out functions not supported by library (median == 0)
                if (median <= 0) continue;
                
                points.push({ 
                    x: gas, 
                    y: median,
                    min: min,
                    q1: q1,
                    q3: q3,
                    max: max,
                    func: func.toUpperCase() 
                });
            }
            return {
                label: LIB_META[lib].name,
                data: points,
                backgroundColor: LIB_META[lib].color + '40',
                borderColor: LIB_META[lib].color,
                pointRadius: 0,
                pointHoverRadius: 12
            };
        });

        // Custom plugin to draw candlesticks
        const candlestickPlugin = {
            id: 'candlestick',
            afterDatasetsDraw: (chart) => {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta.hidden) {
                        meta.data.forEach((element, index) => {
                            const pt = dataset.data[index];
                            const x = element.x;
                            
                            // Convert digit values to y coordinates
                            const yScale = chart.scales.y;
                            const yMin = yScale.getPixelForValue(pt.min);
                            const yQ1 = yScale.getPixelForValue(pt.q1);
                            const yMedian = yScale.getPixelForValue(pt.y);
                            const yQ3 = yScale.getPixelForValue(pt.q3);
                            const yMax = yScale.getPixelForValue(pt.max);
                            
                            const boxWidth = 8;
                            
                            // Draw whiskers
                            ctx.strokeStyle = dataset.borderColor;
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            ctx.moveTo(x, yMin);
                            ctx.lineTo(x, yQ1);
                            ctx.moveTo(x, yQ3);
                            ctx.lineTo(x, yMax);
                            ctx.stroke();
                            
                            // Draw min/max caps
                            ctx.beginPath();
                            ctx.moveTo(x - boxWidth/2, yMin);
                            ctx.lineTo(x + boxWidth/2, yMin);
                            ctx.moveTo(x - boxWidth/2, yMax);
                            ctx.lineTo(x + boxWidth/2, yMax);
                            ctx.stroke();
                            
                            // Draw IQR box
                            ctx.fillStyle = dataset.backgroundColor;
                            ctx.fillRect(x - boxWidth/2, yQ3, boxWidth, yQ1 - yQ3);
                            ctx.strokeStyle = dataset.borderColor;
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x - boxWidth/2, yQ3, boxWidth, yQ1 - yQ3);
                            
                            // Draw median line
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(x - boxWidth/2, yMedian);
                            ctx.lineTo(x + boxWidth/2, yMedian);
                            ctx.stroke();
                        });
                    }
                });
            }
        };

        this.charts.scatter = new Chart(canvas.getContext('2d'), {
            type: 'scatter',
            data: { datasets },
            plugins: [candlestickPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#ccc', font: { family: "'Courier New', monospace" } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pt = ctx.raw;
                                return `${ctx.dataset.label} ${pt.func}: ${Math.round(pt.x).toLocaleString()} gas, digits: ${pt.min.toFixed(0)}-${pt.y.toFixed(0)}-${pt.max.toFixed(0)}`;
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
                        min: 0,
                        title: { display: true, text: 'Matching Digits (spread)', color: '#888' },
                        ticks: { color: '#888' },
                        grid: { color: '#2a2a2a' }
                    }
                }
            }
        });
    }
}
