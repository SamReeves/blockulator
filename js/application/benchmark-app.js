/**
 * Benchmark App - Gas and Precision Comparison
 * Displays interactive benchmarks for fp128, vyper, abdk, and solady
 */

export class BenchmarkApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.benchmarkData = null;
        this.enabledLibs = {
            fp128: true,
            vyper: true,
            abdk: true,
            solady: true
        };
        this.charts = {};
        
        console.log('BenchmarkApp created');
    }

    async init() {
        console.log('Initializing Benchmark app...');
        
        this.renderHTML();
        await this.loadBenchmarkData();
        this.setupListeners();
        await this.renderCharts();
        this.renderDetailTables();
        this.renderPrecisionTable();
        
        console.log('Benchmark app initialized');
    }

    renderHTML() {
        const container = document.getElementById('benchmarks-container');
        container.innerHTML = `
            <div class="benchmark-shell">
                <!-- Header -->
                <div class="benchmark-header">
                    <h2 class="benchmark-title">Gas & Precision Benchmarks</h2>
                    <p class="benchmark-subtitle">Compare on-chain math libraries across operations and test cases</p>
                </div>

                <!-- Library Toggles -->
                <div class="library-toggles">
                    <button class="lib-toggle active" data-lib="fp128">
                        <span class="toggle-color" style="background: #2196F3"></span>
                        <span class="toggle-label">FP128</span>
                    </button>
                    <button class="lib-toggle active" data-lib="vyper">
                        <span class="toggle-color" style="background: #4CAF50"></span>
                        <span class="toggle-label">Vyper</span>
                    </button>
                    <button class="lib-toggle active" data-lib="abdk">
                        <span class="toggle-color" style="background: #FF9800"></span>
                        <span class="toggle-label">ABDK</span>
                    </button>
                    <button class="lib-toggle active" data-lib="solady">
                        <span class="toggle-color" style="background: #9C27B0"></span>
                        <span class="toggle-label">Solady</span>
                    </button>
                </div>

                <!-- Loading State -->
                <div id="benchmark-loading" class="benchmark-loading">
                    Loading benchmark data...
                </div>

                <!-- Charts Container -->
                <div id="benchmark-charts" class="benchmark-charts hidden">
                    <section class="chart-section">
                        <h3>Arithmetic Operations</h3>
                        <div class="chart-row">
                            <div class="chart-container">
                                <canvas id="arithmetic-gas-chart"></canvas>
                            </div>
                            <div class="chart-container">
                                <canvas id="arithmetic-precision-chart"></canvas>
                            </div>
                        </div>
                    </section>

                    <section class="chart-section">
                        <h3>Transcendental Functions</h3>
                        <div class="chart-row">
                            <div class="chart-container">
                                <canvas id="transcendental-gas-chart"></canvas>
                            </div>
                            <div class="chart-container">
                                <canvas id="transcendental-precision-chart"></canvas>
                            </div>
                        </div>
                    </section>

                    <!-- Detail Tables -->
                    <section class="detail-section">
                        <h3>Per-Case Details</h3>
                        <div class="table-tabs">
                            <button class="table-tab active" data-tab="arithmetic-detail">Arithmetic</button>
                            <button class="table-tab" data-tab="transcendental-detail">Transcendental</button>
                        </div>
                        <div id="arithmetic-detail" class="detail-table-container">
                            <!-- Filled by JS -->
                        </div>
                        <div id="transcendental-detail" class="detail-table-container hidden">
                            <!-- Filled by JS -->
                        </div>
                    </section>

                    <!-- Oracle Accuracy Comparison -->
                    <section class="precision-comparison-section">
                        <h3>Oracle Accuracy Comparison</h3>
                        <p class="section-subtitle">Average matching decimal digits vs 100-digit mpmath oracle</p>
                        <div id="precision-comparison-table">
                            <!-- Filled by JS -->
                        </div>
                    </section>

                    <!-- Library Info Cards -->
                    <section class="library-info-section">
                        <h3>Library Details</h3>
                        <div id="library-info-cards" class="library-info-grid">
                            <!-- Filled by JS -->
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    async loadBenchmarkData() {
        try {
            const response = await fetch('docs/benchmarks/benchmark-data.json');
            if (!response.ok) {
                throw new Error('Failed to load benchmark data');
            }
            this.benchmarkData = await response.json();
            console.log('Benchmark data loaded:', this.benchmarkData);
        } catch (error) {
            console.error('Error loading benchmark data:', error);
            document.getElementById('benchmark-loading').textContent = 
                'Error loading benchmark data. Please run benchmarks first.';
            throw error;
        }
    }

    setupListeners() {
        // Library toggle buttons
        document.querySelectorAll('.lib-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const lib = btn.dataset.lib;
                this.enabledLibs[lib] = !this.enabledLibs[lib];
                btn.classList.toggle('active');
                this.updateCharts();
                this.renderDetailTables();
                this.renderPrecisionTable();
            });
        });

        // Table tabs
        document.querySelectorAll('.table-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.table-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.detail-table-container').forEach(c => c.classList.add('hidden'));
                document.getElementById(tab).classList.remove('hidden');
            });
        });
    }

    async renderCharts() {
        document.getElementById('benchmark-loading').classList.add('hidden');
        document.getElementById('benchmark-charts').classList.remove('hidden');

        const colors = {
            fp128: '#2196F3',
            vyper: '#4CAF50',
            abdk: '#FF9800',
            solady: '#9C27B0'
        };

        // Arithmetic Gas Chart
        const arithGasCtx = document.getElementById('arithmetic-gas-chart').getContext('2d');
        this.charts.arithmeticGas = new Chart(arithGasCtx, {
            type: 'bar',
            data: this.getArithmeticGasData(colors),
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: 'Gas Cost by Operation', font: { size: 14, weight: 'bold' } },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Gas' } },
                    x: { title: { display: true, text: 'Operation' } }
                }
            }
        });

        // Arithmetic Precision Chart
        const arithPrecisionData = this.getArithmeticPrecisionData(colors);
        const arithPrecisionCtx = document.getElementById('arithmetic-precision-chart').getContext('2d');
        this.charts.arithmeticPrecision = new Chart(arithPrecisionCtx, {
            type: 'bar',
            data: arithPrecisionData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: arithPrecisionData.useDigits ? 'Precision by Operation (Matching Digits)' : 'Precision by Operation (log scale)', font: { size: 14, weight: 'bold' } },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { 
                        type: arithPrecisionData.useDigits ? 'linear' : 'logarithmic', 
                        title: { display: true, text: arithPrecisionData.useDigits ? 'Matching Decimal Digits' : 'Error (wei)' } 
                    },
                    x: { title: { display: true, text: 'Operation' } }
                }
            }
        });

        // Transcendental Gas Chart
        const transGasCtx = document.getElementById('transcendental-gas-chart').getContext('2d');
        this.charts.transcendentalGas = new Chart(transGasCtx, {
            type: 'bar',
            data: this.getTranscendentalGasData(colors),
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: 'Gas Cost by Function', font: { size: 14, weight: 'bold' } },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Gas' } },
                    x: { title: { display: true, text: 'Function' } }
                }
            }
        });

        // Transcendental Precision Chart
        const transPrecisionData = this.getTranscendentalPrecisionData(colors);
        const transPrecisionCtx = document.getElementById('transcendental-precision-chart').getContext('2d');
        this.charts.transcendentalPrecision = new Chart(transPrecisionCtx, {
            type: 'bar',
            data: transPrecisionData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: transPrecisionData.useDigits ? 'Precision by Function (Matching Digits)' : 'Precision by Function (log scale)', font: { size: 14, weight: 'bold' } },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { 
                        type: transPrecisionData.useDigits ? 'linear' : 'logarithmic', 
                        title: { display: true, text: transPrecisionData.useDigits ? 'Matching Decimal Digits' : 'Error (wei)' } 
                    },
                    x: { title: { display: true, text: 'Function' } }
                }
            }
        });

        // Library Info Cards
        this.renderLibraryCards();
    }

    getArithmeticGasData(colors) {
        const ops = ['mul', 'div', 'add', 'sub'];
        const datasets = [];

        for (const lib of Object.keys(this.enabledLibs)) {
            if (!this.enabledLibs[lib]) continue;

            const data = ops.map(op => {
                const cases = this.benchmarkData.arithmetic.filter(c => c.op === op && c.results[lib]);
                if (cases.length === 0) return 0;
                const avg = cases.reduce((sum, c) => sum + c.results[lib].gas, 0) / cases.length;
                return Math.round(avg);
            });

            datasets.push({
                label: this.benchmarkData.libraries[lib].name,
                data: data,
                backgroundColor: colors[lib],
                borderColor: colors[lib],
                borderWidth: 1
            });
        }

        return { labels: ops.map(o => o.toUpperCase()), datasets };
    }

    getArithmeticPrecisionData(colors) {
        const ops = ['mul', 'div', 'add', 'sub'];
        const datasets = [];
        
        // Check if we have digits data (new format) or error data (old format)
        const useDigits = this.benchmarkData.arithmetic.length > 0 && 
                         this.benchmarkData.arithmetic[0].results[Object.keys(this.benchmarkData.arithmetic[0].results)[0]]?.digits !== undefined;

        for (const lib of Object.keys(this.enabledLibs)) {
            if (!this.enabledLibs[lib]) continue;

            const data = ops.map(op => {
                const cases = this.benchmarkData.arithmetic.filter(c => c.op === op && c.results[lib]);
                if (cases.length === 0) return useDigits ? 0 : 0.1;
                
                if (useDigits) {
                    const avg = cases.reduce((sum, c) => sum + (c.results[lib].digits || 0), 0) / cases.length;
                    return Math.max(avg, 0);
                } else {
                    const avg = cases.reduce((sum, c) => sum + c.results[lib].error, 0) / cases.length;
                    return Math.max(avg, 0.1); // Clamp to minimum for log scale
                }
            });

            datasets.push({
                label: this.benchmarkData.libraries[lib].name,
                data: data,
                backgroundColor: colors[lib],
                borderColor: colors[lib],
                borderWidth: 1
            });
        }

        return { labels: ops.map(o => o.toUpperCase()), datasets, useDigits };
    }

    getTranscendentalGasData(colors) {
        const funcs = ['exp', 'ln', 'sqrt'];
        const datasets = [];
        const transLibs = ['fp128', 'abdk', 'solady'];

        for (const lib of transLibs) {
            if (!this.enabledLibs[lib]) continue;

            const data = funcs.map(func => {
                const cases = this.benchmarkData.transcendental.filter(c => c.func === func && c.results[lib]);
                if (cases.length === 0) return 0;
                const avg = cases.reduce((sum, c) => sum + c.results[lib].gas, 0) / cases.length;
                return Math.round(avg);
            });

            datasets.push({
                label: this.benchmarkData.libraries[lib].name,
                data: data,
                backgroundColor: colors[lib],
                borderColor: colors[lib],
                borderWidth: 1
            });
        }

        return { labels: funcs.map(f => f.toUpperCase()), datasets };
    }

    getTranscendentalPrecisionData(colors) {
        const funcs = ['exp', 'ln', 'sqrt'];
        const datasets = [];
        const transLibs = ['fp128', 'abdk', 'solady'];
        
        // Check if we have digits data
        const useDigits = this.benchmarkData.transcendental.length > 0 &&
                         this.benchmarkData.transcendental[0].results[Object.keys(this.benchmarkData.transcendental[0].results)[0]]?.digits !== undefined;

        for (const lib of transLibs) {
            if (!this.enabledLibs[lib]) continue;

            const data = funcs.map(func => {
                const cases = this.benchmarkData.transcendental.filter(c => c.func === func && c.results[lib]);
                if (cases.length === 0) return useDigits ? 0 : 0.1;
                
                if (useDigits) {
                    const avg = cases.reduce((sum, c) => sum + (c.results[lib].digits || 0), 0) / cases.length;
                    return Math.max(avg, 0);
                } else {
                    const avg = cases.reduce((sum, c) => sum + c.results[lib].error, 0) / cases.length;
                    return Math.max(avg, 0.1);
                }
            });

            datasets.push({
                label: this.benchmarkData.libraries[lib].name,
                data: data,
                backgroundColor: colors[lib],
                borderColor: colors[lib],
                borderWidth: 1
            });
        }

        return { labels: funcs.map(f => f.toUpperCase()), datasets, useDigits };
    }

    updateCharts() {
        const colors = {
            fp128: '#2196F3',
            vyper: '#4CAF50',
            abdk: '#FF9800',
            solady: '#9C27B0'
        };

        this.charts.arithmeticGas.data = this.getArithmeticGasData(colors);
        this.charts.arithmeticGas.update();

        const arithPrecisionData = this.getArithmeticPrecisionData(colors);
        this.charts.arithmeticPrecision.data = arithPrecisionData;
        
        // Update chart config based on data type
        if (arithPrecisionData.useDigits) {
            this.charts.arithmeticPrecision.options.plugins.title.text = 'Precision by Operation (Matching Digits)';
            this.charts.arithmeticPrecision.options.scales.y.type = 'linear';
            this.charts.arithmeticPrecision.options.scales.y.title.text = 'Matching Decimal Digits';
        } else {
            this.charts.arithmeticPrecision.options.plugins.title.text = 'Precision by Operation (log scale)';
            this.charts.arithmeticPrecision.options.scales.y.type = 'logarithmic';
            this.charts.arithmeticPrecision.options.scales.y.title.text = 'Error (wei)';
        }
        this.charts.arithmeticPrecision.update();

        this.charts.transcendentalGas.data = this.getTranscendentalGasData(colors);
        this.charts.transcendentalGas.update();

        const transPrecisionData = this.getTranscendentalPrecisionData(colors);
        this.charts.transcendentalPrecision.data = transPrecisionData;
        
        // Update chart config based on data type
        if (transPrecisionData.useDigits) {
            this.charts.transcendentalPrecision.options.plugins.title.text = 'Precision by Function (Matching Digits)';
            this.charts.transcendentalPrecision.options.scales.y.type = 'linear';
            this.charts.transcendentalPrecision.options.scales.y.title.text = 'Matching Decimal Digits';
        } else {
            this.charts.transcendentalPrecision.options.plugins.title.text = 'Precision by Function (log scale)';
            this.charts.transcendentalPrecision.options.scales.y.type = 'logarithmic';
            this.charts.transcendentalPrecision.options.scales.y.title.text = 'Error (wei)';
        }
        this.charts.transcendentalPrecision.update();
    }

    renderDetailTables() {
        // Check if we have digits data
        const useDigits = this.benchmarkData.arithmetic.length > 0 && 
                         this.benchmarkData.arithmetic[0].results[Object.keys(this.benchmarkData.arithmetic[0].results)[0]]?.digits !== undefined;
        
        const precisionLabel = useDigits ? 'Digits' : 'Error';
        
        // Arithmetic table
        const arithContainer = document.getElementById('arithmetic-detail');
        let arithHTML = '<table class="benchmark-detail-table"><thead><tr><th>Case</th><th>Op</th>';
        
        for (const lib of Object.keys(this.enabledLibs)) {
            if (this.enabledLibs[lib]) {
                arithHTML += `<th>${this.benchmarkData.libraries[lib].name}<br><small>Gas / ${precisionLabel}</small></th>`;
            }
        }
        arithHTML += '</tr></thead><tbody>';

        for (const c of this.benchmarkData.arithmetic) {
            arithHTML += `<tr><td>${c.name}</td><td>${c.op.toUpperCase()}</td>`;
            for (const lib of Object.keys(this.enabledLibs)) {
                if (this.enabledLibs[lib]) {
                    if (c.results[lib]) {
                        const gasClass = this.getBestClass(c.results, lib, 'gas', false);
                        const precisionMetric = useDigits ? 'digits' : 'error';
                        const precisionClass = this.getBestClass(c.results, lib, precisionMetric, useDigits);
                        const precisionValue = useDigits ? this.formatDigits(c.results[lib].digits) : this.formatError(c.results[lib].error);
                        arithHTML += `<td><span class="${gasClass}">${c.results[lib].gas}</span> / <span class="${precisionClass}">${precisionValue}</span></td>`;
                    } else {
                        arithHTML += '<td>N/A</td>';
                    }
                }
            }
            arithHTML += '</tr>';
        }
        arithHTML += '</tbody></table>';
        arithContainer.innerHTML = arithHTML;

        // Transcendental table
        const transUseDigits = this.benchmarkData.transcendental.length > 0 &&
                              this.benchmarkData.transcendental[0].results[Object.keys(this.benchmarkData.transcendental[0].results)[0]]?.digits !== undefined;
        const transPrecisionLabel = transUseDigits ? 'Digits' : 'Error';
        
        const transContainer = document.getElementById('transcendental-detail');
        let transHTML = '<table class="benchmark-detail-table"><thead><tr><th>Case</th><th>Func</th>';
        
        const transLibs = ['fp128', 'abdk', 'solady'];
        for (const lib of transLibs) {
            if (this.enabledLibs[lib]) {
                transHTML += `<th>${this.benchmarkData.libraries[lib].name}<br><small>Gas / ${transPrecisionLabel}</small></th>`;
            }
        }
        transHTML += '</tr></thead><tbody>';

        for (const c of this.benchmarkData.transcendental) {
            transHTML += `<tr><td>${c.name}</td><td>${c.func.toUpperCase()}</td>`;
            for (const lib of transLibs) {
                if (this.enabledLibs[lib]) {
                    if (c.results[lib]) {
                        const gasClass = this.getBestClass(c.results, lib, 'gas', false);
                        const precisionMetric = transUseDigits ? 'digits' : 'error';
                        const precisionClass = this.getBestClass(c.results, lib, precisionMetric, transUseDigits);
                        const precisionValue = transUseDigits ? this.formatDigits(c.results[lib].digits) : this.formatError(c.results[lib].error);
                        transHTML += `<td><span class="${gasClass}">${c.results[lib].gas}</span> / <span class="${precisionClass}">${precisionValue}</span></td>`;
                    } else {
                        transHTML += '<td>N/A</td>';
                    }
                }
            }
            transHTML += '</tr>';
        }
        transHTML += '</tbody></table>';
        transContainer.innerHTML = transHTML;
    }

    getBestClass(results, lib, metric, higherIsBetter = false) {
        const values = Object.entries(results)
            .filter(([l, _]) => this.enabledLibs[l])
            .map(([_, r]) => r[metric]);
        
        if (values.length === 0) return '';
        
        const bestValue = higherIsBetter ? Math.max(...values) : Math.min(...values);
        return results[lib][metric] === bestValue ? 'best-value' : '';
    }

    formatError(error) {
        if (error === 0) return '0';
        if (error < 0.01) return error.toExponential(1);
        if (error < 1) return error.toFixed(2);
        if (error < 1000) return Math.round(error).toString();
        return error.toExponential(1);
    }
    
    formatDigits(digits) {
        if (digits === undefined || digits === null) return 'N/A';
        if (digits >= 100) return '100+';
        return digits.toFixed(1);
    }

    renderLibraryCards() {
        const container = document.getElementById('library-info-cards');
        let html = '';

        for (const [lib, info] of Object.entries(this.benchmarkData.libraries)) {
            // Compute stats if not present (for backward compatibility)
            let stats = info.stats;
            if (!stats) {
                stats = this.computeLibraryStats(lib);
            }

            html += `
                <div class="library-card">
                    <h4>${info.name}</h4>
                    <div class="library-card-details">
                        <p><strong>Format:</strong> ${info.format}</p>
                        <p><strong>Language:</strong> ${info.lang}</p>
                        <p><strong>Range:</strong> ${info.range}</p>
                    </div>
                    <div class="library-card-stats">
                        <h5>Measured Precision</h5>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <span class="stat-label">Avg Digits (Overall)</span>
                                <span class="stat-value">${this.formatDigits(stats.overall.avgDigits)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Min Digits</span>
                                <span class="stat-value">${stats.overall.minDigits !== undefined ? this.formatDigits(stats.overall.minDigits) : 'N/A'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Exact Match Rate</span>
                                <span class="stat-value">${((stats.overall.zeroCount / stats.overall.total) * 100).toFixed(0)}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Avg Error (wei)</span>
                                <span class="stat-value">${this.formatError(stats.overall.avgError)}</span>
                            </div>
                        </div>
                        <details class="precision-breakdown">
                            <summary>By Operation Type</summary>
                            <div class="breakdown-content">
                                <div class="breakdown-row">
                                    <strong>Arithmetic:</strong> ${this.formatDigits(stats.arithmetic.avgDigits)} avg digits, 
                                    ${stats.arithmetic.zeroCount}/${stats.arithmetic.total} exact matches
                                </div>
                                ${stats.transcendental.total > 0 ? `
                                <div class="breakdown-row">
                                    <strong>Transcendental:</strong> ${this.formatDigits(stats.transcendental.avgDigits)} avg digits, 
                                    ${stats.transcendental.zeroCount}/${stats.transcendental.total} exact matches
                                </div>
                                ` : ''}
                            </div>
                        </details>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    computeLibraryStats(lib) {
        // Fallback computation if stats not in JSON
        const arithStats = this.computeStatsForCases(this.benchmarkData.arithmetic, lib);
        const transLibs = ['fp128', 'abdk', 'solady'];
        const transStats = transLibs.includes(lib) 
            ? this.computeStatsForCases(this.benchmarkData.transcendental, lib)
            : { avgError: 0, maxError: 0, avgDigits: 0, minDigits: 0, zeroCount: 0, total: 0 };
        
        const allCases = [...this.benchmarkData.arithmetic];
        if (transLibs.includes(lib)) {
            allCases.push(...this.benchmarkData.transcendental);
        }
        const overallStats = this.computeStatsForCases(allCases, lib);

        return {
            arithmetic: arithStats,
            transcendental: transStats,
            overall: overallStats
        };
    }

    computeStatsForCases(cases, lib) {
        const results = cases.filter(c => c.results[lib]).map(c => c.results[lib]);
        if (results.length === 0) {
            return { avgError: 0, maxError: 0, avgDigits: 0, minDigits: 0, zeroCount: 0, total: 0 };
        }

        // Check if we have digits data directly
        const useDigits = results[0].digits !== undefined;
        
        if (useDigits) {
            // New format: use digits directly
            const digits = results.map(r => r.digits || 0);
            const avgDigits = digits.reduce((a, b) => a + b, 0) / digits.length;
            const minDigits = Math.min(...digits);
            const zeroCount = digits.filter(d => d >= 100).length; // 100+ digits = exact match
            
            return {
                avgError: 0,
                maxError: 0,
                avgDigits: Math.round(avgDigits * 10) / 10,
                minDigits: Math.round(minDigits * 10) / 10,
                zeroCount,
                total: results.length
            };
        } else {
            // Old format: compute from errors
            let errors = [];
            let digits = [];
            let zeroCount = 0;
            let maxError = 0;

            for (const c of cases) {
                if (!c.results[lib]) continue;

                const err = c.results[lib].error;
                const expected = Math.abs(parseInt(c.expected || '1000000000000000000'));

                errors.push(err);
                if (err > maxError) maxError = err;

                if (err === 0) {
                    zeroCount++;
                } else if (expected > 0 && err > 0) {
                    const matching = Math.floor(Math.log10(expected / err));
                    digits.push(Math.max(0, matching));
                }
            }

            const avgError = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
            const avgDigits = digits.length > 0 ? digits.reduce((a, b) => a + b, 0) / digits.length : 18;

            return {
                avgError: Math.round(avgError * 100) / 100,
                maxError: maxError,
                avgDigits: Math.round(avgDigits * 10) / 10,
                minDigits: 0,
                zeroCount: zeroCount,
                total: errors.length
            };
        }
    }

    renderPrecisionTable() {
        const container = document.getElementById('precision-comparison-table');
        
        // Compute per-function stats for each library
        const functions = ['mul', 'div', 'add', 'sub', 'exp', 'ln', 'sqrt'];
        const libs = Object.keys(this.benchmarkData.libraries);
        
        const functionStats = {};
        
        for (const func of functions) {
            functionStats[func] = {};
            
            for (const lib of libs) {
                // Get cases for this function
                let cases;
                if (['mul', 'div', 'add', 'sub'].includes(func)) {
                    cases = this.benchmarkData.arithmetic.filter(c => c.op === func);
                } else {
                    cases = this.benchmarkData.transcendental.filter(c => c.func === func);
                }
                
                const stats = this.computeStatsForCases(cases, lib);
                functionStats[func][lib] = stats.avgDigits;
            }
        }
        
        // Build table HTML
        let html = '<table class="precision-table">';
        
        // Header
        html += '<thead><tr><th>Function</th>';
        for (const lib of libs) {
            if (this.enabledLibs[lib]) {
                html += `<th>${this.benchmarkData.libraries[lib].name}</th>`;
            }
        }
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        for (const func of functions) {
            const funcLabel = func.toUpperCase();
            html += `<tr><td class="func-name">${funcLabel}</td>`;
            
            for (const lib of libs) {
                if (this.enabledLibs[lib]) {
                    const digits = functionStats[func][lib];
                    const cellClass = this.getBestPrecisionClass(functionStats[func], lib);
                    
                    if (digits > 0) {
                        html += `<td class="${cellClass}">${digits.toFixed(1)}</td>`;
                    } else {
                        html += '<td class="na">N/A</td>';
                    }
                }
            }
            
            html += '</tr>';
        }
        html += '</tbody></table>';
        
        container.innerHTML = html;
    }

    getBestPrecisionClass(funcStats, lib) {
        const values = Object.entries(funcStats)
            .filter(([l, _]) => this.enabledLibs[l])
            .map(([_, v]) => v);
        
        if (values.length === 0) return '';
        
        const bestValue = Math.max(...values);
        return funcStats[lib] === bestValue && bestValue > 0 ? 'best-precision' : '';
    }
}
