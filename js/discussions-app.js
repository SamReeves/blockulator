/**
 * Discussions App Entry Point
 * Bootstraps the discussion board application with ViewRouter architecture
 */

import { web3Provider } from './infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from './infrastructure/events/event-bus.js';
import { WalletConnectComponent, ToastComponent } from './presentation/components/index.js';
import { initConfetti } from './presentation/effects/confetti-animation.js';
import { DiscussionBoard } from './domain/discussions/discussion-board.js';
import { ViewRouter, ViewState } from './presentation/router/view-router.js';
import { BoardTable } from './presentation/tables/board-table.js';
import { DiscussionDetailView } from './presentation/views/discussion-detail-view.js';
import { CreateForm } from './presentation/discussions/create-form.js';
import { MechanicsPanel } from './presentation/panels/mechanics-panel.js';
import { TechnicalPanel } from './presentation/panels/technical-panel.js';
import { CONTRACT_ADDRESSES } from './infrastructure/config/contracts.js';

class DiscussionsApp {
    constructor() {
        this.web3Provider = web3Provider;
        this.board = null;
        this.viewRouter = null;
        this.boardTable = null;
        this.currentDiscussionView = null;
        this.createForm = null;
        this.mechanicsPanel = null;
        this.technicalPanel = null;
        this.walletComponent = null;
        this.toastComponent = null;
        this.boardAbi = null;
        this.discussionAbi = null;
    }

    async init() {
        console.log('🎙️ Initializing Discussion Board app...');

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

            // Load ABIs
            await this.loadAbis();

            // Load board contract
            await this.loadBoard();

            // Initialize ViewRouter
            this.viewRouter = new ViewRouter();
            this.viewRouter.subscribe((data) => this.onRouteChange(data));

            // Initialize components
            await this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Setup board event subscriptions
            this.setupBoardEvents();

            // Initial render (Board View)
            await this.renderCurrentView();

            console.log('✅ Discussion Board app initialized');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to initialize application',
                type: 'error'
            });
        }
    }

    async loadAbis() {
        try {
            // Load Board ABI
            const boardResponse = await fetch('/contracts/build/abis/board.json');
            if (!boardResponse.ok) {
                throw new Error('Board ABI not found');
            }
            this.boardAbi = await boardResponse.json();

            // Load Discussion ABI
            const discussionResponse = await fetch('/contracts/build/abis/discussion.json');
            if (!discussionResponse.ok) {
                throw new Error('Discussion ABI not found');
            }
            this.discussionAbi = await discussionResponse.json();

            console.log('✅ ABIs loaded');
        } catch (error) {
            console.error('Failed to load ABIs:', error);
            throw error;
        }
    }

    async loadBoard() {
        const BOARD_ADDRESS = CONTRACT_ADDRESSES.DISCUSSION_BOARD;

        console.log('📍 Loading board with address:', BOARD_ADDRESS);
        console.log('📍 Wallet Network ChainId:', this.web3Provider.chainId);
        console.log('📍 Connected:', this.web3Provider.isConnected());
        console.log('📍 Expected Network: Sepolia (11155111)');

        if (!BOARD_ADDRESS || BOARD_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error('Discussion Board address not configured');
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

        this.board = new DiscussionBoard(
            this.web3Provider,
            BOARD_ADDRESS,
            this.boardAbi
        );

        await this.board.init();
        console.log('✅ Board contract initialized at:', BOARD_ADDRESS);
    }

    async initializeComponents() {
        // Initialize Board Table (Level 1)
        this.boardTable = new BoardTable(
            this.board,
            this.web3Provider,
            this.discussionAbi
        );

        const boardTableContainer = document.getElementById('board-table-container');
        if (boardTableContainer) {
            this.boardTable.setContainer(boardTableContainer);
        }

        // Initialize Create Form
        this.createForm = new CreateForm(this.board, this.web3Provider);
        // Note: CreateForm expects 'create-form' to exist in HTML, which we've added
        this.createForm.init();

        // Initialize Mechanics Panel
        this.mechanicsPanel = new MechanicsPanel();
        const mechanicsContainer = document.getElementById('mechanics-panel');
        if (mechanicsContainer) {
            this.mechanicsPanel.setContainer(mechanicsContainer);
            this.mechanicsPanel.render();
        }

        // Initialize Technical Panel
        this.technicalPanel = new TechnicalPanel(
            CONTRACT_ADDRESSES.DISCUSSION_BOARD,
            this.boardAbi,
            this.discussionAbi
        );
        const technicalContainer = document.getElementById('technical-panel');
        if (technicalContainer) {
            this.technicalPanel.setContainer(technicalContainer);
            this.technicalPanel.render();
        }

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

        // Discussion created
        eventBus.on('DISCUSSION_CREATED', async () => {
            console.log('Discussion created, refreshing...');
            
            // Hide create form
            const formContainer = document.getElementById('create-discussion-form-container');
            if (formContainer) {
                formContainer.classList.add('hidden');
            }
            
            // Refresh board table if in board view
            if (this.viewRouter.isViewingBoard()) {
                await this.boardTable.refresh();
            }
        });

        // Discussion selected
        eventBus.on('DISCUSSION_SELECTED', async (discussion) => {
            console.log('Discussion selected:', discussion);
            this.viewRouter.navigateToDiscussion(discussion);
        });

        // Navigate to board
        eventBus.on('NAVIGATE_TO_BOARD', () => {
            console.log('Navigating to board...');
            this.viewRouter.navigateToBoard();
        });

        // Create discussion button
        const createBtn = document.getElementById('create-discussion-btn');
        const formContainer = document.getElementById('create-discussion-form-container');
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
                document.getElementById('create-form')?.reset();
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
                await this.boardTable.setFilter(filter);
            });
        });

        // Sort select
        const sortSelect = document.getElementById('board-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                await this.boardTable.setSortBy(e.target.value);
            });
        }
    }

    setupBoardEvents() {
        // Listen to board contract events
        this.board.subscribeToEvents({
            DiscussionCreated: async (event) => {
                console.log('New discussion created:', event);
                
                eventBus.emit(EVENTS.TOAST, {
                    message: `📝 New discussion: "${event.subject}"`,
                    type: 'info'
                });

                // Refresh current view
                await this.refreshCurrentView();
            },

            DiscussionTerminated: async (event) => {
                console.log('Discussion terminated:', event);
                
                const eth = ethers.utils.formatEther(event.finalPool);
                eventBus.emit(EVENTS.TOAST, {
                    message: `⚫ Discussion terminated. Final pool: ${parseFloat(eth).toFixed(4)} ETH`,
                    type: 'info'
                });

                // Refresh current view
                await this.refreshCurrentView();
            },

            DiscussionReplaced: async (event) => {
                console.log('Discussion replaced:', event);
                
                eventBus.emit(EVENTS.TOAST, {
                    message: '🔄 Discussion replaced',
                    type: 'info'
                });

                // Refresh current view
                await this.refreshCurrentView();
            },

            ActivityUpdated: async (event) => {
                console.log('Activity updated:', event.discussionAddress);
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
        const boardView = document.getElementById('board-view');
        const discussionView = document.getElementById('discussion-view');

        if (state.state === ViewState.BOARD_VIEW) {
            // Show board view
            if (boardView) boardView.classList.remove('hidden');
            if (discussionView) discussionView.classList.add('hidden');

            // Render board table (this also updates stats)
            await this.boardTable.render();

        } else if (state.state === ViewState.DISCUSSION_VIEW) {
            // Show discussion view
            if (boardView) boardView.classList.add('hidden');
            if (discussionView) discussionView.classList.remove('hidden');

            // Render discussion detail view
            await this.renderDiscussionView(state.discussion);
        }
    }

    /**
     * Render discussion detail view (Level 2)
     */
    async renderDiscussionView(discussion) {
        const container = document.getElementById('discussion-view');
        if (!container) return;

        try {
            this.currentDiscussionView = new DiscussionDetailView(
                discussion,
                this.web3Provider,
                this.discussionAbi
            );

            this.currentDiscussionView.setContainer(container);
            await this.currentDiscussionView.render();

        } catch (error) {
            console.error('Failed to render discussion view:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p>Failed to load discussion</p>
                    <button onclick="eventBus.emit('NAVIGATE_TO_BOARD')">← Back to Board</button>
                </div>
            `;
        }
    }

    /**
     * Refresh current view
     */
    async refreshCurrentView() {
        const state = this.viewRouter.getState();

        if (state.state === ViewState.BOARD_VIEW) {
            // BoardTable.refresh() handles both table and stats
            await this.boardTable.refresh();
        } else if (state.state === ViewState.DISCUSSION_VIEW) {
            if (this.currentDiscussionView) {
                await this.currentDiscussionView.refresh();
            }
        }
    }

    async onWalletChanged() {
        // Reinitialize board with new signer
        await this.loadBoard();
        
        // Refresh current view
        await this.refreshCurrentView();
    }
}

// Export the class for manual initialization
export { DiscussionsApp };
