/**
 * Futures App
 * Interface for creating and managing Gaussian futures
 */

import { web3Provider } from './web3-provider.js';
import { eventBus, EVENTS } from './ui/events.js';
import { initConfetti } from './ui/confetti-animation.js';
import { ContractLoader } from './core/contract-loader.js';
import { ContractDeployer } from './core/contract-deployer.js';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.js';
import { config } from './config.js';

class FuturesApp {
    constructor() {
        console.log('🚀 FuturesApp initializing...');
        this.currentValue = '';
        this.currentTTL = '';
        this.deployedFutures = [];
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupUIListeners();
        this.setupWalletListeners();
        this.setupToastSystem();
        this.setupCanvas();
        
        // Load deployment history
        this.loadFuturesHistory();
        
        console.log('✅ Futures app initialized');
    }


    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Setup UI event listeners
     */
    setupUIListeners() {
        console.log('🔧 Setting up UI listeners...');
        
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                console.log('🔘 Connect wallet button clicked!');
                this.handleConnectWallet();
            });
        }

        // Value input
        const valueInput = document.getElementById('future-value');
        if (valueInput) {
            valueInput.addEventListener('input', (e) => {
                this.currentValue = e.target.value;
            });
        }

        // TTL input
        const ttlInput = document.getElementById('time-to-live');
        if (ttlInput) {
            ttlInput.addEventListener('input', (e) => {
                this.currentTTL = e.target.value;
            });
        }

        // Quick time buttons - ADD to current value
        const timeButtons = document.querySelectorAll('.quick-amount-btn[data-time]');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeToAdd = parseInt(e.target.dataset.time);
                if (ttlInput) {
                    const currentValue = parseInt(ttlInput.value) || 0;
                    const newValue = currentValue + timeToAdd;
                    ttlInput.value = newValue;
                    this.currentTTL = newValue.toString();
                }
            });
        });

        // Create future button
        const createBtn = document.getElementById('create-future-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.handleCreateFuture();
            });
        }

        // Load contract button
        const loadContractBtn = document.getElementById('load-contract-btn');
        if (loadContractBtn) {
            loadContractBtn.addEventListener('click', () => {
                this.handleLoadContract();
            });
        }

        // Transfer ownership button
        const transferBtn = document.getElementById('transfer-ownership-btn');
        if (transferBtn) {
            transferBtn.addEventListener('click', () => {
                this.handleTransferOwnership();
            });
        }

        // View Bytecode button
        const viewBytecodeBtn = document.getElementById('view-bytecode-btn');
        if (viewBytecodeBtn) {
            viewBytecodeBtn.addEventListener('click', () => {
                this.handleViewBytecode();
            });
        }

        // View ABI button
        const viewAbiBtn = document.getElementById('view-abi-btn');
        if (viewAbiBtn) {
            viewAbiBtn.addEventListener('click', () => {
                this.handleViewAbi();
            });
        }

        // Joy button (confetti test)
        const joyBtn = document.getElementById('joy-button');
        if (joyBtn) {
            joyBtn.addEventListener('click', () => {
                console.log('🎉 Joy button clicked - triggering confetti!');
                eventBus.emit(EVENTS.CONFETTI);
            });
        }

        // Draw the distribution graph
        this.drawDistributionGraph();

        // Setup copy buttons
        this.setupCopyButtons();
    }

    /**
     * Setup copy to clipboard functionality
     */
    setupCopyButtons() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('copy-btn')) {
                const button = e.target;
                
                // Get the text to copy
                let textToCopy = '';
                if (button.dataset.copyText) {
                    // Direct text from data attribute
                    textToCopy = button.dataset.copyText;
                } else if (button.dataset.copy) {
                    // Copy from element by ID
                    const element = document.getElementById(button.dataset.copy);
                    textToCopy = element ? element.textContent : '';
                } else if (button.dataset.copyTarget) {
                    // Copy from target element
                    const element = document.getElementById(button.dataset.copyTarget);
                    textToCopy = element ? element.textContent : '';
                }

                if (!textToCopy || textToCopy === '-' || textToCopy === 'Loading...') {
                    return;
                }

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    
                    // Visual feedback
                    const originalText = button.textContent;
                    button.textContent = '✅';
                    button.classList.add('copied');
                    
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.classList.remove('copied');
                    }, 1500);

                    eventBus.emit(EVENTS.TOAST, {
                        message: 'Copied to clipboard',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Failed to copy:', error);
                    eventBus.emit(EVENTS.TOAST, {
                        message: 'Failed to copy to clipboard',
                        type: 'error'
                    });
                }
            }
        });
    }


    /**
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        eventBus.on(EVENTS.WALLET_CONNECTED, async (data) => {
            await this.updateWalletUI(data.address);
            
            // Enable create button when wallet connected
            const createBtn = document.getElementById('create-future-btn');
            if (createBtn) {
                createBtn.disabled = false;
            }

            // Enable load contract button
            const loadBtn = document.getElementById('load-contract-btn');
            if (loadBtn) {
                loadBtn.disabled = false;
            }
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, async () => {
            await this.updateWalletUI(null);
            
            // Disable create button when wallet disconnected
            const createBtn = document.getElementById('create-future-btn');
            if (createBtn) {
                createBtn.disabled = true;
            }

            // Disable load contract button
            const loadBtn = document.getElementById('load-contract-btn');
            if (loadBtn) {
                loadBtn.disabled = true;
            }

            // Disable transfer button
            const transferBtn = document.getElementById('transfer-ownership-btn');
            if (transferBtn) {
                transferBtn.disabled = true;
            }
        });

        eventBus.on(EVENTS.WALLET_CHANGED, async (data) => {
            await this.updateWalletUI(data.address);
        });
    }

    /**
     * Setup toast notification system
     */
    setupToastSystem() {
        eventBus.on(EVENTS.TOAST, (data) => {
            this.showToast(data.message, data.type);
        });
    }

    /**
     * Setup canvas for animations
     */
    setupCanvas() {
        const canvas = document.getElementById('effects-canvas');
        if (!canvas) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        window.effectsCanvas = canvas;
        window.effectsCtx = canvas.getContext('2d');
        
        // Initialize confetti
        initConfetti();
    }

    /**
     * Handle wallet connection
     */
    async handleConnectWallet() {
        console.log('🔌 handleConnectWallet called');
        const success = await web3Provider.connect();
        if (success) {
            console.log('Wallet connected successfully');
        }
    }

    /**
     * Update wallet UI
     */
    async updateWalletUI(address) {
        const connectBtn = document.getElementById('connect-wallet');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddress = document.getElementById('wallet-address');
        const walletBalance = document.getElementById('wallet-balance');
        const readonlyBadge = document.getElementById('readonly-badge');

        if (address) {
            // Connected mode
            connectBtn?.classList.add('hidden');
            walletInfo?.classList.remove('hidden');
            readonlyBadge?.classList.add('hidden');
            
            if (walletAddress) {
                walletAddress.textContent = web3Provider.formatAddress(address);
            }

            // Update balance
            if (walletBalance) {
                const balance = await web3Provider.getBalance();
                walletBalance.textContent = `${parseFloat(balance).toFixed(4)} ETH`;
            }
        } else {
            // Read-only mode
            connectBtn?.classList.remove('hidden');
            walletInfo?.classList.add('hidden');
            readonlyBadge?.classList.remove('hidden');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Handle creating a new Gaussian future
     */
    async handleCreateFuture() {
        if (!web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet to create a future',
                type: 'warning'
            });
            return;
        }

        const valueInput = document.getElementById('future-value');
        const ttlInput = document.getElementById('time-to-live');
        
        if (!valueInput.value || !ttlInput.value) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter both value and time to live',
                type: 'error'
            });
            return;
        }

        try {
            const value = ethers.BigNumber.from(valueInput.value);
            const epoch = parseInt(ttlInput.value);

            // Validate
            if (epoch <= 0) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'Time to live must be greater than zero',
                    type: 'error'
                });
                return;
            }

            // Estimate gas first
            eventBus.emit(EVENTS.TOAST, {
                message: 'Estimating deployment cost...',
                type: 'info'
            });

            const estimatedGas = await ContractDeployer.estimateDeploymentGas(
                'gaussian-future',
                web3Provider,
                [epoch],  // Constructor args: _lifetime
                { value }
            );

            if (estimatedGas) {
                const gasPrice = await web3Provider.getProvider().getGasPrice();
                const gasCost = estimatedGas.mul(gasPrice);
                const totalCost = gasCost.add(value);
                
                console.log(`Estimated gas: ${ethers.utils.formatEther(gasCost)} ETH`);
                console.log(`Future value: ${ethers.utils.formatEther(value)} ETH`);
                console.log(`Total cost: ${ethers.utils.formatEther(totalCost)} ETH`);
            }

            // Deploy
            const createBtn = document.getElementById('create-future-btn');
            createBtn.disabled = true;
            createBtn.textContent = 'Deploying...';

            eventBus.emit(EVENTS.TOAST, {
                message: 'Deploying Gaussian Future contract...',
                type: 'info'
            });

            const { contract, address, deployTransaction } = await ContractDeployer.deploy(
                'gaussian-future',
                web3Provider,
                [epoch],  // Constructor args: _lifetime
                { value }  // Send ETH with deployment
            );

            // Track the deployed future
            this.deployedFutures.push({
                address,
                epoch,
                value: value.toString(),
                deployedAt: Math.floor(Date.now() / 1000),
                txHash: deployTransaction.hash
            });

            // Save to localStorage
            this.saveFuturesHistory();

            // Show success
            eventBus.emit(EVENTS.TOAST, {
                message: `🎉 Future deployed at ${address}`,
                type: 'success'
            });

            eventBus.emit(EVENTS.CONFETTI);

            // Show deployed contract info
            this.showDeployedContract(address, epoch, value, deployTransaction.hash);

            // Reset form
            valueInput.value = '';
            ttlInput.value = '';
            this.currentValue = '';
            this.currentTTL = '';
            this.updatePreview();

        } catch (error) {
            console.error('Failed to deploy future:', error);
            
            let message = 'Failed to deploy future';
            if (error.message.includes('user rejected')) {
                message = 'Deployment cancelled';
            } else if (error.message.includes('insufficient funds')) {
                message = 'Insufficient funds for deployment';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message,
                type: 'error'
            });
        } finally {
            const createBtn = document.getElementById('create-future-btn');
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.textContent = 'Create Future';
            }
        }
    }

    /**
     * Save deployment history to localStorage
     */
    saveFuturesHistory() {
        try {
            localStorage.setItem('deployedFutures', JSON.stringify(this.deployedFutures));
        } catch (error) {
            console.error('Failed to save futures history:', error);
        }
    }

    /**
     * Load deployment history from localStorage
     */
    loadFuturesHistory() {
        try {
            const saved = localStorage.getItem('deployedFutures');
            if (saved) {
                this.deployedFutures = JSON.parse(saved);
                this.displayFuturesHistory();
            }
        } catch (error) {
            console.error('Failed to load futures history:', error);
        }
    }

    /**
     * Display deployed contract info
     */
    showDeployedContract(address, epoch, value, txHash) {
        const container = document.getElementById('deployed-contracts');
        if (!container) return;

        const contractDiv = document.createElement('div');
        contractDiv.className = 'deployed-contract';
        contractDiv.innerHTML = `
            <h4>✅ Future Contract Deployed</h4>
            <div class="contract-details">
                <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <a href="${config.blockExplorer}/address/${address}" 
                           target="_blank" 
                           class="contract-address"
                           style="color: white;">${address}</a>
                        <button class="copy-btn" data-copy-text="${address}" title="Copy to clipboard">📋</button>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Value:</span>
                    <span>${ethers.utils.formatEther(value)} ETH</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span>${epoch} seconds (${(epoch / 86400).toFixed(1)} days)</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction:</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <a href="${config.blockExplorer}/tx/${txHash}" 
                           target="_blank" 
                           class="contract-address"
                           style="color: white;">${txHash}</a>
                        <button class="copy-btn" data-copy-text="${txHash}" title="Copy to clipboard">📋</button>
                    </div>
                </div>
            </div>
        `;

        container.prepend(contractDiv);
        container.classList.remove('hidden');
    }

    /**
     * Display futures deployment history
     */
    displayFuturesHistory() {
        const container = document.getElementById('deployed-contracts');
        if (!container || this.deployedFutures.length === 0) return;

        container.classList.remove('hidden');
        
        this.deployedFutures.forEach(future => {
            this.showDeployedContract(
                future.address,
                future.epoch,
                ethers.BigNumber.from(future.value),
                future.txHash
            );
        });
    }

    /**
     * Handle loading contract information
     */
    async handleLoadContract() {
        const contractAddress = document.getElementById('contract-address')?.value;
        
        if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid contract address',
                type: 'error'
            });
            return;
        }

        try {
            // Load the contract ABI
            const response = await fetch('/contracts/bytecode/gaussian-future.json');
            const { abi } = await response.json();
            
            // Create contract instance
            const provider = web3Provider.getProvider();
            const contract = new ethers.Contract(contractAddress, abi, provider);

            // Fetch contract data
            const [owner, initialValue, balance, timeRemaining, startTime, lifetime, mean, lastT, lastCdf] = 
                await Promise.all([
                    contract.current_owner(),
                    contract.initial_value(),
                    contract.get_balance(),
                    contract.time_remaining(),
                    contract.start_time(),
                    contract.lifetime(),
                    contract.mean(),
                    contract.last_t(),
                    contract.last_tail()
                ]);

            // Calculate current time position
            const elapsed = lastT.toNumber();
            const total = lifetime.toNumber();
            const percentComplete = (elapsed / total * 100).toFixed(1);

            // Format time remaining
            const timeRemainingSeconds = timeRemaining.toNumber();
            const hours = Math.floor(timeRemainingSeconds / 3600);
            const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            // Calculate expected payout (simplified - actual would need CDF calculation)
            const currentTime = Math.floor(Date.now() / 1000);
            const contractStartTime = startTime.toNumber();
            const elapsedNow = currentTime - contractStartTime;
            const distanceFromMean = Math.abs(elapsedNow - mean.toNumber());
            
            // Simple payout estimate (this is approximate)
            const maxPayout = balance.mul(30).div(100); // Assume max ~30% of remaining
            const payoutFactor = Math.max(0, 1 - (distanceFromMean / mean.toNumber()));
            const estimatedPayout = maxPayout.mul(Math.floor(payoutFactor * 100)).div(100);

            // Display information
            document.getElementById('info-owner').textContent = owner;
            document.getElementById('info-owner').style.color = 'white';
            document.getElementById('info-value').textContent = `${ethers.utils.formatEther(initialValue)} ETH`;
            document.getElementById('info-balance').textContent = `${ethers.utils.formatEther(balance)} ETH`;
            document.getElementById('info-time').textContent = timeStr;
            document.getElementById('info-position').textContent = `${percentComplete}% (${elapsed}s / ${total}s)`;
            document.getElementById('info-payout').textContent = `~${ethers.utils.formatEther(estimatedPayout)} ETH`;

            document.getElementById('contract-info').classList.remove('hidden');
            
            // Show copy button for owner address
            document.getElementById('copy-owner').classList.remove('hidden');

            // Enable transfer button if connected and owner
            if (web3Provider.isConnected()) {
                const userAddress = await web3Provider.getAddress();
                const isOwner = userAddress.toLowerCase() === owner.toLowerCase();
                document.getElementById('transfer-ownership-btn').disabled = !isOwner;
                
                if (!isOwner) {
                    eventBus.emit(EVENTS.TOAST, {
                        message: 'You are not the owner of this contract',
                        type: 'warning'
                    });
                }
            }

        } catch (error) {
            console.error('Failed to load contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load contract information',
                type: 'error'
            });
        }
    }

    /**
     * Handle transferring ownership and claiming payout
     */
    async handleTransferOwnership() {
        if (!web3Provider.isConnected()) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please connect your wallet first',
                type: 'warning'
            });
            return;
        }

        const contractAddress = document.getElementById('contract-address')?.value;
        const newOwnerAddress = document.getElementById('new-owner-address')?.value;

        if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid contract address',
                type: 'error'
            });
            return;
        }

        if (!newOwnerAddress || !ethers.utils.isAddress(newOwnerAddress)) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please enter a valid new owner address',
                type: 'error'
            });
            return;
        }

        try {
            // Load the contract ABI
            const response = await fetch('/contracts/bytecode/gaussian-future.json');
            const { abi } = await response.json();
            
            // Create contract instance with signer
            const signer = web3Provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);

            // Check ownership
            const currentOwner = await contract.current_owner();
            const userAddress = await web3Provider.getAddress();
            
            if (currentOwner.toLowerCase() !== userAddress.toLowerCase()) {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'You are not the owner of this contract',
                    type: 'error'
                });
                return;
            }

            // Get balance before transfer
            const balanceBefore = await contract.get_balance();

            eventBus.emit(EVENTS.TOAST, {
                message: 'Transferring ownership...',
                type: 'info'
            });

            // Call transfer function
            const tx = await contract.transfer(newOwnerAddress);
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Transaction sent, waiting for confirmation...',
                type: 'info'
            });

            const receipt = await tx.wait();

            // Get balance after transfer to calculate payout
            const balanceAfter = await contract.get_balance();
            const payout = balanceBefore.sub(balanceAfter);

            eventBus.emit(EVENTS.TOAST, {
                message: `✅ Transfer complete! You received ${ethers.utils.formatEther(payout)} ETH`,
                type: 'success'
            });

            eventBus.emit(EVENTS.CONFETTI);

            // Refresh contract info
            await this.handleLoadContract();

            // Clear new owner input
            document.getElementById('new-owner-address').value = '';

        } catch (error) {
            console.error('Failed to transfer ownership:', error);
            
            let message = 'Failed to transfer ownership';
            if (error.message.includes('user rejected')) {
                message = 'Transaction cancelled';
            } else if (error.message.includes('expired')) {
                message = 'Contract has expired';
            }
            
            eventBus.emit(EVENTS.TOAST, {
                message,
                type: 'error'
            });
        }
    }

    /**
     * Handle viewing bytecode
     */
    async handleViewBytecode() {
        try {
            const response = await fetch('/contracts/bytecode/gaussian-future.json');
            const data = await response.json();
            
            const bytecode = data.bytecode;
            
            // Create a new window with formatted content
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Gaussian Future - Bytecode</title>
                    <style>
                        body {
                            font-family: monospace;
                            padding: 20px;
                            background: #1a1a1a;
                            color: #00ff00;
                            line-height: 1.6;
                        }
                        h1 {
                            color: #00ff00;
                            border-bottom: 2px solid #00ff00;
                            padding-bottom: 10px;
                        }
                        .bytecode {
                            background: #000;
                            padding: 20px;
                            border-radius: 8px;
                            word-break: break-all;
                            font-size: 12px;
                            max-height: 80vh;
                            overflow-y: auto;
                        }
                        .stats {
                            margin: 20px 0;
                            padding: 15px;
                            background: rgba(0, 255, 0, 0.1);
                            border-radius: 8px;
                        }
                        button {
                            background: #00ff00;
                            color: #000;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: monospace;
                            font-weight: bold;
                            margin-top: 10px;
                        }
                        button:hover {
                            background: #00cc00;
                        }
                    </style>
                </head>
                <body>
                    <h1>📦 Gaussian Future - Compiled Bytecode</h1>
                    <div class="stats">
                        <strong>Size:</strong> ${(bytecode.length - 2) / 2} bytes<br>
                        <strong>Max Contract Size:</strong> 24,576 bytes<br>
                        <strong>Status:</strong> ${(bytecode.length - 2) / 2 <= 24576 ? '✅ Within EVM Limits' : '❌ Exceeds Limits'}
                        <br><br>
                        <button onclick="navigator.clipboard.writeText('${bytecode}').then(() => alert('Bytecode copied to clipboard!'))">
                            📋 Copy Bytecode
                        </button>
                    </div>
                    <div class="bytecode">${bytecode}</div>
                </body>
                </html>
            `);
            newWindow.document.close();
        } catch (error) {
            console.error('Failed to load bytecode:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load bytecode',
                type: 'error'
            });
        }
    }

    /**
     * Handle viewing ABI
     */
    async handleViewAbi() {
        try {
            const response = await fetch('/contracts/abis/gaussian-future.json');
            const abi = await response.json();
            
            const formattedAbi = JSON.stringify(abi, null, 2);
            
            // Create a new window with formatted content
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Gaussian Future - ABI</title>
                    <style>
                        body {
                            font-family: monospace;
                            padding: 20px;
                            background: #1a1a1a;
                            color: #00ff00;
                            line-height: 1.6;
                        }
                        h1 {
                            color: #00ff00;
                            border-bottom: 2px solid #00ff00;
                            padding-bottom: 10px;
                        }
                        .abi {
                            background: #000;
                            padding: 20px;
                            border-radius: 8px;
                            font-size: 12px;
                            max-height: 80vh;
                            overflow-y: auto;
                            white-space: pre-wrap;
                        }
                        .stats {
                            margin: 20px 0;
                            padding: 15px;
                            background: rgba(0, 255, 0, 0.1);
                            border-radius: 8px;
                        }
                        button {
                            background: #00ff00;
                            color: #000;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: monospace;
                            font-weight: bold;
                            margin-top: 10px;
                        }
                        button:hover {
                            background: #00cc00;
                        }
                    </style>
                </head>
                <body>
                    <h1>📋 Gaussian Future - ABI (Application Binary Interface)</h1>
                    <div class="stats">
                        <strong>Functions:</strong> ${abi.filter(item => item.type === 'function').length}<br>
                        <strong>Constructor:</strong> ${abi.filter(item => item.type === 'constructor').length}<br>
                        <strong>Fallback:</strong> ${abi.filter(item => item.type === 'fallback').length}
                        <br><br>
                        <button onclick="navigator.clipboard.writeText(\`${formattedAbi.replace(/`/g, '\\`')}\`).then(() => alert('ABI copied to clipboard!'))">
                            📋 Copy ABI
                        </button>
                    </div>
                    <div class="abi">${formattedAbi}</div>
                </body>
                </html>
            `);
            newWindow.document.close();
        } catch (error) {
            console.error('Failed to load ABI:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load ABI',
                type: 'error'
            });
        }
    }

    /**
     * Draw the Gaussian distribution graph
     */
    drawDistributionGraph() {
        const canvas = document.getElementById('distribution-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const graphWidth = width - 2 * padding;
        const graphHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Gaussian parameters
        const mean = 0.5; // Center at 50% of time
        const stdDev = 0.144; // ~1/sqrt(12) for uniform distribution

        // Function to calculate Gaussian PDF
        const gaussian = (x) => {
            const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
            return Math.exp(exponent) / (stdDev * Math.sqrt(2 * Math.PI));
        };

        // Find max value for scaling
        const maxY = gaussian(mean);

        // Draw axes
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw the Gaussian curve
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();

        for (let i = 0; i <= 200; i++) {
            const t = i / 200; // Time from 0 to 1
            const y = gaussian(t);
            const x = padding + t * graphWidth;
            const yPos = height - padding - (y / maxY) * graphHeight;
            
            if (i === 0) {
                ctx.moveTo(x, yPos);
            } else {
                ctx.lineTo(x, yPos);
            }
        }
        ctx.stroke();

        // Fill area under curve
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        for (let i = 0; i <= 200; i++) {
            const t = i / 200;
            const y = gaussian(t);
            const x = padding + t * graphWidth;
            const yPos = height - padding - (y / maxY) * graphHeight;
            ctx.lineTo(x, yPos);
        }
        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();
        ctx.fill();

        // Mark the mean
        const meanX = padding + mean * graphWidth;
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(meanX, padding);
        ctx.lineTo(meanX, height - padding);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = '#ddd';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        
        // X-axis labels
        ctx.fillText('Start', padding, height - 10);
        ctx.fillText('Midpoint', meanX, height - 10);
        ctx.fillText('End', width - padding, height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Payout Rate', 0, 0);
        ctx.restore();

        // Title
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Value Distribution Over Time', width / 2, 25);
    }
}

// Initialize app when DOM is loaded
console.log('📦 futures-app.js loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, initializing FuturesApp...');
        new FuturesApp();
    });
} else {
    console.log('✅ DOM already ready, initializing FuturesApp...');
    new FuturesApp();
}

