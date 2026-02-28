/**
 * Futures App Entry Point
 * Bootstraps the futures marketplace application with ViewRouter architecture
 */

import { web3Provider } from './infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from './infrastructure/events/event-bus.js';
import { getExplorerUrl } from './infrastructure/config/network.js';
import { WalletConnectComponent, ToastComponent } from './presentation/components/index.js';
import { initConfetti } from './presentation/effects/confetti-animation.js';
import { FutureFactory } from './domain/futures/future-factory.js';
import { ViewRouter, ViewState } from './presentation/router/view-router.js';
import { MarketTable } from './presentation/tables/market-table.js';
import { FutureDetailView } from './presentation/futures/future-detail-view.js';
import { CreateFutureForm } from './presentation/futures/create-future-form.js';
import { GameRenderer } from './presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from './infrastructure/config/contracts.js';

class FuturesApp {
    constructor() {
        this.web3Provider = web3Provider;
        this.factory = null;
        this.viewRouter = null;
        this.marketTable = null;
        this.currentFutureView = null;
        this.createForm = null;
        this.walletComponent = null;
        this.toastComponent = null;
        this.factoryAbi = null;
        this.futureAbi = null;
    }

    async init() {
        console.log('📈 Initializing Futures Marketplace app...');

        try {
            // Check for existing wallet connection FIRST
            await this.web3Provider.checkConnection();

            // Initialize wallet component
            this.walletComponent = new WalletConnectComponent(this.web3Provider);
            this.walletComponent.render();

            // Initialize toast notifications
            this.toastComponent = new ToastComponent();

            // Initialize confetti
            initConfetti();

            // Initialize view-specific components
            await this.initViewOnly();

        } catch (error) {
            console.error('Failed to initialize futures app:', error);
        }
    }

    /**
     * Initialize only view-specific components (for SPA integration)
     * Assumes shared components (wallet, toast, confetti) are already initialized
     */
    async initViewOnly() {
        console.log('📈 Initializing Futures Marketplace view...');

        try {
            // Load ABIs
            await this.loadAbis();

            // Load factory contract
            await this.loadFactory();

            // Initialize ViewRouter
            this.viewRouter = new ViewRouter();
            this.viewRouter.subscribe((data) => this.onRouteChange(data));

            // Initialize components
            await this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();
                
            // Setup factory event subscriptions
            this.setupFactoryEvents();

            // Initial render (Market View)
            await this.renderCurrentView();

            // Render contract info section
            this.renderContractInfo();

            console.log('✅ Futures Marketplace view initialized');

        } catch (error) {
            console.error('Failed to initialize futures view:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to initialize futures',
                type: 'error'
            });
        }
    }

    /**
     * Render contract info section with links to contracts
     */
    renderContractInfo() {
        const container = document.getElementById('futures-contract-info');
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        container.style.gap = '1rem';

        // Factory Contract
        const factoryInfo = document.createElement('div');
        factoryInfo.className = 'contract-info-card';
        factoryInfo.innerHTML = `
            <div class="contract-card-header">
                <h4>🏭 Future Factory</h4>
                <p class="contract-card-description">Creates and manages Eulerian future contracts</p>
            </div>
        `;
        factoryInfo.appendChild(GameRenderer.createContractInfo(
            CONTRACT_ADDRESSES.FUTURE_FACTORY,
            CONTRACT_SOURCES.FUTURE_FACTORY,
            CONTRACT_ABIS.FUTURE_FACTORY
        ));
        container.appendChild(factoryInfo);

        // Blueprint Contract
        const blueprintInfo = document.createElement('div');
        blueprintInfo.className = 'contract-info-card';
        blueprintInfo.innerHTML = `
            <div class="contract-card-header">
                <h4>📋 Eulerian Future Blueprint</h4>
                <p class="contract-card-description">Template for individual future contracts with time-weighted payouts</p>
            </div>
        `;
        blueprintInfo.appendChild(GameRenderer.createContractInfo(
            CONTRACT_ADDRESSES.EULERIAN_FUTURE_BLUEPRINT,
            CONTRACT_SOURCES.EULERIAN_FUTURE_BLUEPRINT,
            CONTRACT_ABIS.EULERIAN_FUTURE_BLUEPRINT
        ));
        container.appendChild(blueprintInfo);
    }

    /**
     * Refresh data when returning to view
     */
    async refresh() {
        console.log('🔄 Refreshing futures...');
        await this.renderCurrentView();
    }

    async loadAbis() {
        try {
            // Load Future Factory ABI
            const factoryResponse = await fetch('/contracts/build/abis/future-factory.json');
            if (!factoryResponse.ok) {
                throw new Error('Factory ABI not found');
            }
            this.factoryAbi = await factoryResponse.json();

            // Load Eulerian Future ABI
            const futureResponse = await fetch('/contracts/build/abis/eulerian-future.json');
            if (!futureResponse.ok) {
                throw new Error('Future ABI not found');
            }
            this.futureAbi = await futureResponse.json();

            console.log('✅ ABIs loaded');
        } catch (error) {
            console.error('Failed to load ABIs:', error);
            throw error;
        }
    }

    async loadFactory() {
        const FACTORY_ADDRESS = CONTRACT_ADDRESSES.FUTURE_FACTORY || '0x0000000000000000000000000000000000000000';

        console.log('📍 Loading factory with address:', FACTORY_ADDRESS);
        console.log('📍 Wallet Network ChainId:', this.web3Provider.chainId);
        console.log('📍 Connected:', this.web3Provider.isConnected());
        console.log('📍 Expected Network: Sepolia (11155111)');

        if (!FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
            eventBus.emit(EVENTS.TOAST, {
                message: '⚠️ Future Factory not yet deployed. Check back soon!',
                type: 'warning'
            });
            throw new Error('Future Factory address not configured');
        }

        // Check if wallet is on wrong network
        if (this.web3Provider.isConnected() && this.web3Provider.chainId !== 11155111) {
            const networkName = this.web3Provider.getNetworkName();
            eventBus.emit(EVENTS.TOAST, {
                message: `⚠️ Wrong network! Please switch to Sepolia. Currently on: ${networkName}`,
                type: 'error'
            });
            console.error('❌ Wrong network. Expected Sepolia (11155111), got:', this.web3Provider.chainId);
        }

        this.factory = new FutureFactory(
            this.web3Provider,
            FACTORY_ADDRESS,
            this.factoryAbi
        );

        await this.factory.init();
        console.log('✅ Factory contract initialized at:', FACTORY_ADDRESS);
    }

    async initializeComponents() {
        // Initialize Market Table (Level 1)
        this.marketTable = new MarketTable(
            this.factory,
            this.web3Provider,
            this.futureAbi
        );

        const marketTableContainer = document.getElementById('market-table-container');
        if (marketTableContainer) {
            this.marketTable.setContainer(marketTableContainer);
        }

        // Initialize Create Form
        this.createForm = new CreateFutureForm(this.factory, this.web3Provider);
        this.createForm.init();

        console.log('✅ Components initialized');
    }

    setupEventListeners() {
        // Wallet changes
        eventBus.on(EVENTS.WALLET_CONNECTED, async () => {
            console.log('Wallet connected, refreshing...');
            await this.onWalletChanged();
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, async () => {
            console.log('Wallet disconnected, refreshing...');
            await this.onWalletChanged();
        });

        // Future created
        eventBus.on('FUTURE_CREATED', async () => {
            console.log('Future created, refreshing...');
            
            // Hide create form
            const formContainer = document.getElementById('create-future-form-container');
            if (formContainer) {
                formContainer.classList.add('hidden');
            }
            
            // Refresh market table if in market view
            if (this.viewRouter.isViewingBoard()) {
                await this.marketTable.refresh();
    }
        });

        // Future selected
        eventBus.on('FUTURE_SELECTED', async (future) => {
            console.log('Future selected:', future);
            this.viewRouter.navigateToDiscussion(future); // Reuse discussion navigation
        });
            
        // Navigate to market
        eventBus.on('NAVIGATE_TO_MARKET', () => {
            console.log('Navigating to market...');
            this.viewRouter.navigateToBoard(); // Reuse board navigation
        });

        // Navigate to board (alias for market)
        eventBus.on('NAVIGATE_TO_BOARD', () => {
            console.log('Navigating to market...');
            this.viewRouter.navigateToBoard();
        });
            
        // Create future button
        const createBtn = document.getElementById('create-future-btn');
        const formContainer = document.getElementById('create-future-form-container');
        const closeFormBtn = document.getElementById('close-create-form');
        const cancelBtn = document.getElementById('cancel-create-btn');

        if (createBtn && formContainer) {
            createBtn.addEventListener('click', () => {
                // Check wallet connection
                if (!this.web3Provider.currentAddress) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: 'Please connect your wallet first',
                        type: 'warning'
                    });
                    return;
                }
                
                formContainer.classList.toggle('hidden');
            });
        }

        if (closeFormBtn && formContainer) {
            closeFormBtn.addEventListener('click', () => {
                formContainer.classList.add('hidden');
            });
        }

        if (cancelBtn && formContainer) {
            cancelBtn.addEventListener('click', () => {
                formContainer.classList.add('hidden');
                document.getElementById('create-future-form')?.reset();
            });
        }

        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tabs .tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', async (e) => {
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // Update filter
                const filter = e.target.dataset.filter;
                await this.marketTable.setFilter(filter);
            });
        });

        // Sort select
        const sortSelect = document.getElementById('market-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                await this.marketTable.setSortBy(e.target.value);
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
                const factoryAddress = this.factory.contractAddress;
                window.open(getExplorerUrl(factoryAddress), '_blank');
            });
        }
    }

    setupFactoryEvents() {
        // Listen to factory contract events
        this.factory.subscribeToEvents({
            FutureCreated: async (event) => {
                console.log('New future created:', event);
                
                eventBus.emit(EVENTS.TOAST, {
                    message: `📈 New future created!`,
                    type: 'info'
                });

                // Refresh current view
                await this.refreshCurrentView();
            },

            FutureListed: async (event) => {
                console.log('Future listed:', event);

            eventBus.emit(EVENTS.TOAST, {
                    message: `📋 Future listed for sale`,
                type: 'info'
            });

                // Refresh current view
                await this.refreshCurrentView();
            },

            FutureSold: async (event) => {
                console.log('Future sold:', event);
                
                const price = ethers.utils.formatEther(event.price);
                eventBus.emit(EVENTS.TOAST, {
                    message: `💰 Future sold for ${parseFloat(price).toFixed(4)} ETH`,
                    type: 'success'
                });

                // Refresh current view
                await this.refreshCurrentView();
            },

            FutureDelisted: async (event) => {
                console.log('Future delisted:', event);
            
            eventBus.emit(EVENTS.TOAST, {
                    message: '📤 Future removed from marketplace',
                type: 'info'
            });

                // Refresh current view
                await this.refreshCurrentView();
            },

            FutureReplaced: async (event) => {
                console.log('Future replaced:', event);

            eventBus.emit(EVENTS.TOAST, {
                    message: '🔄 Future replaced',
                    type: 'info'
            });

                // Refresh current view
                await this.refreshCurrentView();
            }
        });
    }

    /**
     * Route change handler
     */
    async onRouteChange(data) {
        console.log('Route changed:', data);
        await this.renderCurrentView();
    }

    /**
     * Render current view based on router state
     */
    async renderCurrentView() {
        const state = this.viewRouter.getState();

        // Show/hide view containers
        const marketView = document.getElementById('market-view');
        const futureView = document.getElementById('future-view');

        if (state.state === ViewState.BOARD_VIEW) {
            // Show market view
            if (marketView) marketView.classList.remove('hidden');
            if (futureView) futureView.classList.add('hidden');

            // Render market table (this also updates stats)
            await this.marketTable.render();

        } else if (state.state === ViewState.DISCUSSION_VIEW) {
            // Show future view
            if (marketView) marketView.classList.add('hidden');
            if (futureView) futureView.classList.remove('hidden');

            // Render future detail view
            await this.renderFutureView(state.discussion);
        }
    }

    /**
     * Render future detail view (Level 2)
     */
    async renderFutureView(future) {
        const container = document.getElementById('future-view');
        if (!container) return;

        try {
            this.currentFutureView = new FutureDetailView(
                future,
                this.factory,
                this.web3Provider,
                this.futureAbi
            );

            this.currentFutureView.setContainer(container);
            await this.currentFutureView.render();

        } catch (error) {
            console.error('Failed to render future view:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p>Failed to load future details</p>
                    <button onclick="eventBus.emit('NAVIGATE_TO_MARKET')">← Back to Market</button>
                </div>
            `;
        }
    }

    /**
     * Handle direct transfer of a future
     */
    async handleDirectTransfer() {
        const futureAddress = document.getElementById('transfer-future-address').value.trim();
        const newOwner = document.getElementById('transfer-new-owner').value.trim();

        if (!this.web3Provider.currentAddress) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet',
                type: 'warning'
            });
            return;
        }

        if (!futureAddress || !ethers.utils.isAddress(futureAddress)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Invalid future contract address',
                type: 'error'
            });
            return;
        }

        if (!newOwner || !ethers.utils.isAddress(newOwner)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Invalid new owner address',
                type: 'error'
            });
            return;
        }

        try {
            // Create EulerianFuture instance
            const { EulerianFuture } = await import('./domain/futures/eulerian-future.js');
            const future = new EulerianFuture(this.web3Provider, futureAddress, this.futureAbi);
            await future.init();

            // Check if user is owner
            const currentOwner = await future.getCurrentOwner();
            if (currentOwner.toLowerCase() !== this.web3Provider.currentAddress.toLowerCase()) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'You are not the owner of this future',
                    type: 'error'
                });
                return;
            }

            // Attempt transfer
            eventBus.emit(EVENTS.TOAST, {
                message: 'Initiating transfer...',
                type: 'info'
            });

            await future.transfer(newOwner);

            eventBus.emit(EVENTS.TOAST, {
                message: 'Transfer successful! Payout sent to your wallet.',
                type: 'success'
            });

            // Clear form
            document.getElementById('direct-transfer-form').reset();

            // Refresh market if visible
            if (this.viewRouter.isViewingBoard()) {
                await this.marketTable.refresh();
            }

        } catch (error) {
            console.error('Transfer failed:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Transfer failed',
                type: 'error'
            });
        }
    }

    /**
     * Refresh current view
     */
    async refreshCurrentView() {
        const state = this.viewRouter.getState();

        if (state.state === ViewState.BOARD_VIEW) {
            // MarketTable.refresh() handles both table and stats
            await this.marketTable.refresh();
        } else if (state.state === ViewState.DISCUSSION_VIEW) {
            if (this.currentFutureView) {
                await this.currentFutureView.refresh();
            }
        }
    }

    async onWalletChanged() {
        // Reinitialize factory with new signer
        await this.loadFactory();
        
        // Refresh current view
        await this.refreshCurrentView();
    }
}

// Export the class for manual initialization
export { FuturesApp };
