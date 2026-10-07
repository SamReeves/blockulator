/**
 * Futures App
 * Sub-app for the Futures view
 * Manages futures marketplace with ViewRouter architecture
 */

import { eventBus, EVENTS } from '../infrastructure/events/event-bus.js';
import { getExplorerUrl } from '../infrastructure/config/network.js';
import { FutureFactory } from '../domain/futures/future-factory.js';
import { ViewRouter, ViewState } from '../presentation/router/view-router.js';
import { MarketTable } from '../presentation/tables/market-table.js';
import { FutureDetailView } from '../presentation/futures/future-detail-view.js';
import { CreateFutureForm } from '../presentation/futures/create-future-form.js';
import { ContractInfoRenderer } from '../presentation/renderers/contract-info-renderer.js';
import { getContractsByType, getContractMetadata } from '../infrastructure/config/contract-registry.js';

export class FuturesApp {
    constructor(web3Provider, walletComponent, toastComponent) {
        this.web3Provider = web3Provider;
        this.walletComponent = walletComponent;
        this.toastComponent = toastComponent;
        this.factory = null;
        this.viewRouter = null;
        this.marketTable = null;
        this.currentFutureView = null;
        this.createForm = null;
        this.factoryAbi = null;
        this.futureAbi = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            await this.refresh();
            return;
        }

        console.log('[Futures] Initializing...');

        // Step 1: DOM event listeners (always works, no async deps)
        this.setupEventListeners();
        console.log('[Futures] Event listeners bound.');

        // Step 2: Load ABIs
        try {
            await this.loadAbis();
            console.log('[Futures] ABIs loaded.');
        } catch (err) {
            console.error('[Futures] Failed to load ABIs:', err);
            this.showStatus('Could not load futures contract ABIs. Check console for details.');
            return;
        }

        // Step 3: Load factory contract
        try {
            await this.loadFactory();
            console.log('[Futures] Factory loaded:', this.factory.contractAddress);
        } catch (err) {
            console.error('[Futures] Failed to load factory:', err);
            this.showStatus('Could not connect to the Future Factory contract.');
            return;
        }

        // Step 4: ViewRouter
        this.viewRouter = new ViewRouter();
        this.viewRouter.subscribe(() => this.renderCurrentView());

        // Step 5: Components (market table + create form)
        this.initializeComponents();
        console.log('[Futures] Components initialized.');

        // Step 6: Contract events
        this.setupFactoryEvents();

        // Step 7: Render
        try {
            await this.renderCurrentView();
        } catch (err) {
            console.error('[Futures] Failed to render initial view:', err);
        }

        // Step 8: Contract info panel
        this.renderContractInfo();

        this.initialized = true;
        console.log('[Futures] Ready.');
    }

    // ── Helpers ────────────────────────────────────────────────────────

    showStatus(message) {
        const container = document.getElementById('market-table-container');
        if (container) {
            container.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
        }
    }

    // ── ABI Loading ───────────────────────────────────────────────────

    async loadAbis() {
        const bust = `?v=${Date.now()}`;

        const [factoryRes, futureRes] = await Promise.all([
            fetch(`/contracts/build/abis/future-factory.json${bust}`),
            fetch(`/contracts/build/abis/eulerian-future.json${bust}`)
        ]);

        if (!factoryRes.ok) throw new Error(`Factory ABI HTTP ${factoryRes.status}`);
        if (!futureRes.ok) throw new Error(`Future ABI HTTP ${futureRes.status}`);

        const factoryText = await factoryRes.text();
        const futureText = await futureRes.text();

        try {
            this.factoryAbi = JSON.parse(factoryText);
        } catch (e) {
            console.error('[Futures] Factory ABI parse error. First 200 chars:', factoryText.slice(0, 200));
            throw new Error('Factory ABI is not valid JSON');
        }

        try {
            this.futureAbi = JSON.parse(futureText);
        } catch (e) {
            console.error('[Futures] Future ABI parse error. First 200 chars:', futureText.slice(0, 200));
            throw new Error('Future ABI is not valid JSON');
        }
    }

    // ── Factory ───────────────────────────────────────────────────────

    async loadFactory() {
        const meta = getContractMetadata('future-factory');
        const addr = meta.contractAddress;

        if (!addr || addr === '0x0000000000000000000000000000000000000000') {
            throw new Error('Future Factory not deployed on this network');
        }

        this.factory = new FutureFactory(this.web3Provider, addr, this.factoryAbi);
        await this.factory.init();
    }

    // ── Components ────────────────────────────────────────────────────

    initializeComponents() {
        // Market table
        this.marketTable = new MarketTable(this.factory, this.web3Provider);
        const tableEl = document.getElementById('market-table-container');
        if (tableEl) this.marketTable.setContainer(tableEl);

        // Create form
        this.createForm = new CreateFutureForm(this.factory, this.web3Provider);
        this.createForm.init();
    }

    // ── Event Listeners ───────────────────────────────────────────────

    setupEventListeners() {
        // Wallet changes
        eventBus.on(EVENTS.WALLET_CONNECTED, () => this.onWalletChanged());
        eventBus.on(EVENTS.WALLET_DISCONNECTED, () => this.onWalletChanged());

        // Future created → hide form, refresh table
        eventBus.on(EVENTS.FUTURE_CREATED, async () => {
            const formContainer = document.getElementById('create-future-form-container');
            if (formContainer) formContainer.classList.add('hidden');
            if (this.viewRouter?.isViewingBoard() && this.marketTable) {
                await this.marketTable.refresh();
            }
        });

        // Navigation events
        eventBus.on(EVENTS.FUTURE_SELECTED, (future) => {
            this.viewRouter?.navigateToDiscussion(future);
        });
        eventBus.on(EVENTS.NAVIGATE_TO_MARKET, () => this.viewRouter?.navigateToBoard());
        eventBus.on(EVENTS.NAVIGATE_TO_BOARD, () => this.viewRouter?.navigateToBoard());

        // Create future button — toggles form visibility
        const createBtn = document.getElementById('create-future-btn');
        const formContainer = document.getElementById('create-future-form-container');
        const closeFormBtn = document.getElementById('close-create-form');
        const cancelBtn = document.getElementById('cancel-create-btn');

        if (createBtn && formContainer) {
            createBtn.addEventListener('click', () => {
                console.log('[Futures] Create button clicked. Wallet:', this.web3Provider.currentAddress);
                if (!this.web3Provider.currentAddress) {
                    eventBus.emit(EVENTS.TOAST, { message: 'Please connect your wallet first', type: 'warning' });
                    return;
                }
                formContainer.classList.toggle('hidden');
            });
        } else {
            console.warn('[Futures] create-future-btn or form-container not found in DOM');
        }

        if (closeFormBtn && formContainer) {
            closeFormBtn.addEventListener('click', () => formContainer.classList.add('hidden'));
        }

        if (cancelBtn && formContainer) {
            cancelBtn.addEventListener('click', () => {
                formContainer.classList.add('hidden');
                document.getElementById('create-future-form')?.reset();
            });
        }

        // Filter tabs
        document.querySelectorAll('.filter-tabs .tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                if (this.marketTable) await this.marketTable.setFilter(e.target.dataset.filter);
            });
        });

        // Sort select
        const sortSelect = document.getElementById('market-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                if (this.marketTable) await this.marketTable.setSortBy(e.target.value);
            });
        }

        // Direct transfer form
        const transferForm = document.getElementById('direct-transfer-form');
        if (transferForm) {
            transferForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleDirectTransfer();
            });
        }

        // Etherscan link
        const etherscanLink = document.getElementById('view-factory-etherscan');
        if (etherscanLink) {
            etherscanLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.factory) {
                    window.open(getExplorerUrl(this.factory.contractAddress), '_blank');
                }
            });
        }
    }

    // ── Factory Events ────────────────────────────────────────────────

    setupFactoryEvents() {
        if (!this.factory) return;

        this.factory.subscribeToEvents({
            FutureCreated: () => {
                eventBus.emit(EVENTS.TOAST, { message: 'New future created!', type: 'info' });
                this.refreshCurrentView();
            },
            FutureListed: () => {
                eventBus.emit(EVENTS.TOAST, { message: 'Future listed for sale', type: 'info' });
                this.refreshCurrentView();
            },
            FutureSold: (ev) => {
                const price = ethers.utils.formatEther(ev.price);
                eventBus.emit(EVENTS.TOAST, { message: `Future sold for ${parseFloat(price).toFixed(4)} ETH`, type: 'success' });
                this.refreshCurrentView();
            },
            FutureDelisted: () => {
                eventBus.emit(EVENTS.TOAST, { message: 'Future removed from marketplace', type: 'info' });
                this.refreshCurrentView();
            },
            FutureReplaced: () => {
                eventBus.emit(EVENTS.TOAST, { message: 'Future replaced', type: 'info' });
                this.refreshCurrentView();
            }
        });
    }

    // ── View Rendering ────────────────────────────────────────────────

    async refresh() {
        await this.renderCurrentView();
    }

    async renderCurrentView() {
        if (!this.viewRouter) return;

        const { state, discussion } = this.viewRouter.getState();
        const marketView = document.getElementById('market-view');
        const futureView = document.getElementById('future-view');

        if (state === ViewState.BOARD_VIEW) {
            if (marketView) marketView.classList.remove('hidden');
            if (futureView) futureView.classList.add('hidden');
            if (this.marketTable) await this.marketTable.render();
        } else if (state === ViewState.DISCUSSION_VIEW) {
            if (marketView) marketView.classList.add('hidden');
            if (futureView) futureView.classList.remove('hidden');
            await this.renderFutureView(discussion);
        }
    }

    async renderFutureView(future) {
        const container = document.getElementById('future-view');
        if (!container) return;

        try {
            this.currentFutureView = new FutureDetailView(future, this.factory, this.web3Provider);
            this.currentFutureView.setContainer(container);
            await this.currentFutureView.render();
        } catch (error) {
            console.error('[Futures] Failed to render future view:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p>Failed to load future details</p>
                    <button id="back-to-market-error">← Back to Market</button>
                </div>
            `;
            container.querySelector('#back-to-market-error')
                ?.addEventListener('click', () => eventBus.emit(EVENTS.NAVIGATE_TO_MARKET));
        }
    }

    async refreshCurrentView() {
        if (!this.viewRouter) return;
        const { state } = this.viewRouter.getState();
        if (state === ViewState.BOARD_VIEW && this.marketTable) {
            await this.marketTable.refresh();
        } else if (state === ViewState.DISCUSSION_VIEW && this.currentFutureView) {
            await this.currentFutureView.refresh();
        }
    }

    // ── Contract Info ─────────────────────────────────────────────────

    renderContractInfo() {
        const container = document.getElementById('futures-contract-info');
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
        container.style.gap = '1.5rem';

        const futureContracts = getContractsByType('future');

        futureContracts.forEach(contractKey => {
            const metadata = getContractMetadata(contractKey);

            const card = document.createElement('div');
            card.className = 'contract-info-card';
            card.innerHTML = `
                <div class="contract-card-header">
                    <h4>${metadata.emoji} ${metadata.name}</h4>
                    <p class="contract-card-description">${metadata.description}</p>
                </div>
            `;

            const contractInfo = ContractInfoRenderer.createContractInfo(
                metadata.contractAddress,
                metadata.sourceFile,
                metadata.abiFile
            );
            contractInfo.style.marginTop = '1rem';
            card.appendChild(contractInfo);
            container.appendChild(card);
        });
    }

    // ── Direct Transfer ───────────────────────────────────────────────

    async handleDirectTransfer() {
        const futureAddress = document.getElementById('transfer-future-address')?.value.trim();
        const newOwner = document.getElementById('transfer-new-owner')?.value.trim();

        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, { message: 'Please connect your wallet', type: 'warning' });
            return;
        }

        if (!futureAddress || !ethers.utils.isAddress(futureAddress)) {
            eventBus.emit(EVENTS.TOAST, { message: 'Invalid future contract address', type: 'error' });
            return;
        }

        if (!newOwner || !ethers.utils.isAddress(newOwner)) {
            eventBus.emit(EVENTS.TOAST, { message: 'Invalid new owner address', type: 'error' });
            return;
        }

        try {
            const { EulerianFuture } = await import('../domain/futures/eulerian-future.js');
            const future = new EulerianFuture(this.web3Provider, futureAddress, this.futureAbi);
            await future.init();

            const currentOwner = await future.getCurrentOwner();
            if (currentOwner.toLowerCase() !== this.web3Provider.currentAddress.toLowerCase()) {
                eventBus.emit(EVENTS.TOAST, { message: 'You are not the owner of this future', type: 'error' });
                return;
            }

            eventBus.emit(EVENTS.TOAST, { message: 'Initiating transfer...', type: 'info' });
            await future.transfer(newOwner);
            eventBus.emit(EVENTS.TOAST, { message: 'Transfer successful!', type: 'success' });

            document.getElementById('direct-transfer-form')?.reset();

            if (this.viewRouter?.isViewingBoard() && this.marketTable) {
                await this.marketTable.refresh();
            }
        } catch (error) {
            console.error('[Futures] Transfer failed:', error);
            eventBus.emit(EVENTS.TOAST, { message: error.message || 'Transfer failed', type: 'error' });
        }
    }

    // ── Wallet Change ─────────────────────────────────────────────────

    async onWalletChanged() {
        if (this.factory && this.factoryAbi) {
            try {
                await this.loadFactory();
            } catch (err) {
                console.warn('[Futures] Factory reload on wallet change failed:', err.message);
            }
        }
        await this.refreshCurrentView();
    }
}
