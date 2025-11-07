/**
 * Discussions App Entry Point
 * Bootstraps the discussion board application
 */

import { web3Provider } from './infrastructure/blockchain/web3-provider.js';
import { eventBus, EVENTS } from './infrastructure/events/event-bus.js';
import { WalletConnectComponent, ToastComponent } from './presentation/components/index.js';
import { initConfetti } from './presentation/effects/confetti-animation.js';
import { DiscussionBoard } from './domain/discussions/discussion-board.js';
import { Discussion } from './domain/discussions/discussion.js';
import { DiscussionList } from './presentation/discussions/discussion-list.js';
import { CreateForm } from './presentation/discussions/create-form.js';
import { GameRenderer } from './presentation/renderers/game-renderer.js';
import { CONTRACT_ADDRESSES, CONTRACT_SOURCES, CONTRACT_ABIS } from './infrastructure/config/contracts.js';

class DiscussionsApp {
    constructor() {
        this.web3Provider = web3Provider;
        this.board = null;
        this.discussionList = null;
        this.createForm = null;
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

            // Initialize UI components
            this.discussionList = new DiscussionList(
                this.board,
                this.web3Provider,
                this.discussionAbi
            );

            this.createForm = new CreateForm(this.board, this.web3Provider);
            this.createForm.init();

            // Setup event listeners
            this.setupEventListeners();

            // Setup UI interactions
            this.setupUIInteractions();

            // Render contract information
            this.renderContractInfo();

            // Initial render
            await this.discussionList.render();

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

        if (!BOARD_ADDRESS || BOARD_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error('Discussion Board address not configured');
        }

        this.board = new DiscussionBoard(
            this.web3Provider,
            BOARD_ADDRESS,
            this.boardAbi
        );

        await this.board.init();
        console.log('✅ Board contract initialized at:', BOARD_ADDRESS);
    }

    setupEventListeners() {
        // Listen to wallet changes
        eventBus.on(EVENTS.WALLET_CONNECTED, async () => {
            console.log('Wallet connected, refreshing...');
            await this.onWalletChanged();
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, async () => {
            console.log('Wallet disconnected, refreshing...');
            await this.onWalletChanged();
        });

        // Listen to discussion created event
        eventBus.on('DISCUSSION_CREATED', async () => {
            console.log('Discussion created, refreshing list...');
            await this.discussionList.refresh();
        });

        // Listen for discussion selection
        eventBus.on('DISCUSSION_SELECTED', async (discussion) => {
            console.log('Discussion selected:', discussion);
            await this.openDiscussionModal(discussion);
        });

        // Listen to board events
        this.board.subscribeToEvents({
            DiscussionCreated: async (event) => {
                console.log('New discussion created:', event);
                
                eventBus.emit(EVENTS.TOAST, {
                    message: `📝 New discussion: "${event.subject}"`,
                    type: 'info'
                });

                // Refresh list
                await this.discussionList.refresh();
            },

            DiscussionTerminated: async (event) => {
                console.log('Discussion terminated:', event);
                
                const eth = ethers.utils.formatEther(event.finalPool);
                eventBus.emit(EVENTS.TOAST, {
                    message: `⚫ Discussion terminated. Final pool: ${parseFloat(eth).toFixed(4)} ETH`,
                    type: 'info'
                });

                // Refresh list
                await this.discussionList.refresh();
            },

            DiscussionReplaced: async (event) => {
                console.log('Discussion replaced:', event);
                
                eventBus.emit(EVENTS.TOAST, {
                    message: '🔄 Discussion replaced',
                    type: 'info'
                });

                // Refresh list
                await this.discussionList.refresh();
            },

            ActivityUpdated: async (event) => {
                console.log('Activity updated:', event.discussionAddress);
            }
        });
    }

    setupUIInteractions() {
        // Toggle create form
        const toggleButton = document.getElementById('toggle-create-form');
        const formContainer = document.getElementById('create-form-container');
        const cancelButton = document.getElementById('cancel-create-btn');

        if (toggleButton && formContainer) {
            toggleButton.addEventListener('click', () => {
                const isHidden = formContainer.classList.contains('hidden');
                
                if (isHidden) {
                    // Check wallet connection
                    if (!this.web3Provider.currentAddress) {
                        eventBus.emit(EVENTS.TOAST, {
                            message: 'Please connect your wallet first',
                            type: 'warning'
                        });
                        return;
                    }
                    
                    formContainer.classList.remove('hidden');
                    toggleButton.textContent = '✖️ Cancel';
                } else {
                    formContainer.classList.add('hidden');
                    toggleButton.textContent = '+ New Discussion';
                }
            });
        }

        if (cancelButton && formContainer && toggleButton) {
            cancelButton.addEventListener('click', () => {
                formContainer.classList.add('hidden');
                toggleButton.textContent = '+ New Discussion';
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
                await this.discussionList.setFilter(filter);
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                await this.discussionList.setSortBy(e.target.value);
            });
        }
    }

    async onWalletChanged() {
        // Reinitialize board with new signer
        await this.loadBoard();

        // Refresh list
        if (this.discussionList) {
            await this.discussionList.refresh();
        }
    }

    renderContractInfo() {
        // Render Board contract info
        const boardDetailsEl = document.getElementById('board-contract-details');
        if (boardDetailsEl) {
            boardDetailsEl.innerHTML = '';
            const boardInfo = GameRenderer.createContractInfo(
                CONTRACT_ADDRESSES.DISCUSSION_BOARD,
                CONTRACT_SOURCES.DISCUSSION_BOARD,
                CONTRACT_ABIS.DISCUSSION_BOARD
            );
            boardDetailsEl.appendChild(boardInfo);
        }

        // Render Discussion Blueprint contract info
        const discussionDetailsEl = document.getElementById('discussion-contract-details');
        if (discussionDetailsEl) {
            discussionDetailsEl.innerHTML = '';
            const discussionInfo = GameRenderer.createContractInfo(
                CONTRACT_ADDRESSES.DISCUSSION_BLUEPRINT,
                CONTRACT_SOURCES.DISCUSSION_BLUEPRINT,
                CONTRACT_ABIS.DISCUSSION_BLUEPRINT
            );
            discussionDetailsEl.appendChild(discussionInfo);
        }
    }

    async openDiscussionModal(discussion) {
        const modal = document.getElementById('discussion-modal');
        
        // Show modal
        modal.style.display = 'block';
        
        // Populate basic info
        document.getElementById('modal-subject').textContent = discussion.subject;
        document.getElementById('modal-creator').textContent = `Creator: ${discussion.creator.substring(0, 6)}...${discussion.creator.substring(38)}`;
        document.getElementById('modal-created').textContent = `Created: ${new Date(discussion.creationTime * 1000).toLocaleString()}`;
        document.getElementById('modal-body').textContent = discussion.body;
        document.getElementById('modal-pool').textContent = ethers.utils.formatEther(discussion.totalPool) + ' ETH';
        document.getElementById('modal-messages').textContent = discussion.messageCount;
        document.getElementById('modal-survivors').textContent = discussion.survivorCount;
        document.getElementById('modal-status').textContent = discussion.terminated ? 'Terminated ❌' : 'Active ✅';
        document.getElementById('modal-address').textContent = discussion.address;
        document.getElementById('modal-etherscan').href = `https://sepolia.etherscan.io/address/${discussion.address}`;
        document.getElementById('modal-min-donation').textContent = ethers.utils.formatEther(discussion.minDonation || '0');
        
        // Load messages
        await this.loadDiscussionMessages(discussion.address);
        
        // Setup modal close handlers
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        document.getElementById('close-modal').onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        // Setup post message handler
        document.getElementById('post-message-btn').onclick = async () => {
            await this.postMessage(discussion.address);
        };
    }

    async loadDiscussionMessages(discussionAddress) {
        const messagesList = document.getElementById('modal-messages-list');
        messagesList.innerHTML = '<p style="text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 2rem;">Loading messages...</p>';
        
        try {
            const discussion = new Discussion(
                this.web3Provider,
                discussionAddress,
                this.discussionAbi
            );
            await discussion.init();
            
            const messages = await discussion.getAllMessages();
            
            if (messages.length === 0) {
                messagesList.innerHTML = '<p style="text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 2rem;">No messages yet. Be the first to post!</p>';
                return;
            }
            
            messagesList.innerHTML = messages.map((msg, i) => `
                <div style="padding: 1.5rem; margin-bottom: 1rem; background: var(--md-sys-color-surface-variant); border-radius: 12px; border-left: 4px solid #6366f1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong style="color: var(--md-sys-color-primary);">${msg.author.substring(0, 6)}...${msg.author.substring(38)}</strong>
                        <span style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem;">${ethers.utils.formatEther(msg.donation)} ETH</span>
                    </div>
                    <p style="color: var(--md-sys-color-on-surface); white-space: pre-wrap; margin-bottom: 0.5rem;">${msg.content}</p>
                    <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                        ${new Date(msg.timestamp * 1000).toLocaleString()}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesList.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load messages</p>';
        }
    }

    async postMessage(discussionAddress) {
        const content = document.getElementById('message-content').value.trim();
        const donationEth = document.getElementById('message-donation').value;
        
        if (!content) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a message',
                type: 'warning'
            });
            return;
        }
        
        if (!donationEth || parseFloat(donationEth) <= 0) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a donation amount',
                type: 'warning'
            });
            return;
        }
        
        try {
            const discussion = new Discussion(
                this.web3Provider,
                discussionAddress,
                this.discussionAbi
            );
            await discussion.init();
            
            const donationWei = ethers.utils.parseEther(donationEth);
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Posting message...',
                type: 'info'
            });
            
            await discussion.postMessage(content, donationWei);
            
            // Clear form
            document.getElementById('message-content').value = '';
            document.getElementById('message-donation').value = '';
            
            eventBus.emit(EVENTS.TOAST, {
                message: '🎉 Message posted successfully!',
                type: 'success'
            });
            
            // Reload messages after a short delay
            setTimeout(() => {
                this.loadDiscussionMessages(discussionAddress);
            }, 2000);
            
        } catch (error) {
            console.error('Error posting message:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: error.message || 'Failed to post message',
                type: 'error'
            });
        }
    }
}

// Initialize app
const app = new DiscussionsApp();
app.init();

console.log('🎙️ Discussion Board ready!');

