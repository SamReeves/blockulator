/**
 * Benchmark App - Gas & Precision Comparison
 * Compares fp127, abdk, solady, and prbmath across arithmetic and transcendental operations.
 * All data derived from precision_distribution.json raw sweep data.
 */

const LIBS = ['fp127', 'abdk', 'solady', 'prb'];

// Preferred display order for functions (new functions will be appended)
const PREFERRED_FUNCTION_ORDER = ['mul', 'div', 'add', 'sub', 'exp', 'exp2', 'ln', 'log2', 'sqrt', 'pow', 'abs', 'inv', 'min', 'max', 'avg', 'dist', 'gavg', 'log10', 'exp10', 'sign', 'floor', 'ceil', 'frac', 'cbrt', 'lerp', 'hypot', 'round', 'log2up', 'gcd', 'factorial', 'lambertw0'];

const LIB_META = {
    fp127:  { name: 'FP127',    format: '127.128 fixed-point', lang: 'Huff',            color: '#2196F3' },
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
        // Defer charts to next frame so containers have layout dimensions
        requestAnimationFrame(() => {
            this.renderParallelCoords();
            this.renderScatterChart();
        });
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
                    <p class="bench-subtitle">Each dot is one test input. Precision measured as matching decimal digits vs 100-digit mpmath oracle. Upper-left is better.</p>
                </div>

                <div id="bench-loading" class="bench-loading">Loading benchmark data...</div>

                <div id="bench-content" class="bench-content hidden">
                    <section class="bench-section">
                        <h3>Precision by Function</h3>
                        <p class="bench-section-note">Each line is a library. Higher is better precision. Hover for details.</p>
                        <div class="bench-parallel-wrap" id="bench-parallel"></div>
                    </section>

                    <section class="bench-section">
                        <h3>Gas vs Precision</h3>
                        <p class="bench-section-note">Each dot is one test case. Upper-left (low gas, high precision) is better.</p>
                        <div class="bench-scatter-wrap" id="bench-scatter"></div>
                    </section>

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

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
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
                const tint = this.hexToRgba(LIB_META[lib].color, 0.08);

                if (unsupported) {
                    html += `<td class="col-gas" style="background:${tint}"><span class="unsupported">✗</span></td>`;
                    html += `<td class="col-digits" style="background:${tint}"><span class="unsupported">✗</span></td>`;
                } else {
                    html += `<td class="col-gas ${gasClass}" style="background:${tint}">${g != null ? Math.round(g).toLocaleString() : '<span class="na">—</span>'}</td>`;
                    const digitDisplay = isIntOnly
                        ? '<span class="int-only">int</span>'
                        : (d != null ? d.toFixed(1) : '<span class="na">—</span>');
                    html += `<td class="col-digits ${digClass}" style="background:${tint}">${digitDisplay}</td>`;
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

    // ── Parallel Coordinates Chart (Plotly.js) ───────────────────────

    renderParallelCoords() {
        const container = document.getElementById('bench-parallel');
        if (!container || typeof Plotly === 'undefined') return;

        const raw = this.distData.raw;

        // Compute median digits per function per library
        const funcMedians = {};
        for (const func of this.functions) {
            funcMedians[func] = {};
            for (const lib of LIBS) {
                const rawData = raw[lib]?.[func] || [];
                const digits = rawData.map(d => d.digits).filter(d => d > 0).sort((a, b) => a - b);
                if (digits.length > 0) {
                    const mid = Math.floor(digits.length / 2);
                    funcMedians[func][lib] = digits.length % 2 ? digits[mid] : (digits[mid - 1] + digits[mid]) / 2;
                } else {
                    funcMedians[func][lib] = null;
                }
            }
        }

        // Filter to functions where at least 2 libs have data
        const validFuncs = this.functions.filter(func => {
            const count = LIBS.filter(lib => funcMedians[func][lib] !== null).length;
            return count >= 2;
        });

        // Build one trace per library (line across all functions)
        const traces = LIBS.map(lib => {
            const y = validFuncs.map(func => funcMedians[func][lib]);
            const hasData = y.some(v => v !== null);
            if (!hasData) return null;

            return {
                type: 'scatter',
                mode: 'lines+markers',
                name: LIB_META[lib].name,
                x: validFuncs.map(f => f.toUpperCase()),
                y: y,
                line: { color: LIB_META[lib].color, width: 2 },
                marker: { size: 6, color: LIB_META[lib].color },
                connectgaps: false,
                hovertemplate: '%{x}: %{y:.1f} digits<extra>' + LIB_META[lib].name + '</extra>'
            };
        }).filter(t => t !== null);

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Courier New, monospace', color: '#888' },
            margin: { l: 50, r: 20, t: 10, b: 100 },
            xaxis: {
                tickangle: -45,
                tickfont: { size: 10 },
                gridcolor: '#1a1a1a'
            },
            yaxis: {
                title: { text: 'Median Digits', font: { size: 11 } },
                gridcolor: '#222',
                zerolinecolor: '#333',
                range: [0, 42]
            },
            legend: {
                x: 0.5,
                y: -0.25,
                xanchor: 'center',
                yanchor: 'top',
                orientation: 'h',
                font: { size: 11 }
            },
            hovermode: 'x unified'
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(container, traces, layout, config);
    }

    // ── Scatter Chart (Plotly.js) ────────────────────────────────────

    renderScatterChart() {
        const container = document.getElementById('bench-scatter');
        if (!container || typeof Plotly === 'undefined') {
            if (container) container.innerHTML = '<p style="color:#f66;text-align:center;padding:2rem;">Failed to load charting library</p>';
            return;
        }

        const raw = this.distData.raw;

        const traces = LIBS.map(lib => {
            const x = [], y = [], text = [], sizes = [];

            for (const func of this.functions) {
                const rawData = raw[lib]?.[func] || [];
                for (const d of rawData) {
                    if (d.gas <= 0 || d.digits <= 0) continue;

                    x.push(d.gas);
                    y.push(d.digits);
                    text.push(`${func.toUpperCase()}: ${d.gas.toLocaleString()} gas, ${d.digits} digits`);
                    sizes.push(6);
                }
            }

            return {
                type: 'scatter',
                mode: 'markers',
                name: LIB_META[lib].name,
                x: x,
                y: y,
                text: text,
                hovertemplate: '%{text}<extra>' + LIB_META[lib].name + '</extra>',
                marker: {
                    size: sizes,
                    color: LIB_META[lib].color,
                    opacity: 0.6,
                    line: { width: 0 }
                }
            };
        });

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Courier New, monospace', color: '#888' },
            margin: { l: 60, r: 20, t: 30, b: 60 },
            xaxis: {
                title: { text: 'Gas (log scale)', font: { size: 11 } },
                type: 'log',
                gridcolor: '#222',
                zerolinecolor: '#333'
            },
            yaxis: {
                title: { text: 'Precision (digits)', font: { size: 11 } },
                gridcolor: '#222',
                zerolinecolor: '#333',
                range: [0, 42]
            },
            legend: {
                x: 0.5,
                y: -0.15,
                xanchor: 'center',
                orientation: 'h',
                font: { size: 11 }
            },
            showlegend: true,
            hovermode: 'closest'
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.newPlot(container, traces, layout, config);
    }
}
