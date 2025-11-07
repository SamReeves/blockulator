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
        this.erfContract = null;
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
        
        // Load ERF calculator contract
        await this.loadErfContract();
        
        // Load deployment history
        this.loadFuturesHistory();
        
        console.log('✅ Futures app initialized');
    }

    /**
     * Load the ERF calculator contract
     */
    async loadErfContract() {
        try {
            this.erfContract = await ContractLoader.load('erf-calculator', web3Provider);
            if (this.erfContract) {
                console.log('✅ ERF Calculator contract loaded');
                this.updateContractAddressDisplay();
            }
        } catch (error) {
            console.error('Failed to load ERF contract:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to load ERF calculator contract',
                type: 'error'
            });
        }
    }

    /**
     * Update the contract address display
     */
    updateContractAddressDisplay() {
        const addressLink = document.getElementById('erf-contract-address');
        if (addressLink && CONTRACT_ADDRESSES.ERF_CALCULATOR) {
            addressLink.textContent = this.formatAddress(CONTRACT_ADDRESSES.ERF_CALCULATOR);
            addressLink.href = `${config.blockExplorer}/address/${CONTRACT_ADDRESSES.ERF_CALCULATOR}`;
        }
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
                this.updatePreview();
            });
        }

        // TTL input
        const ttlInput = document.getElementById('time-to-live');
        if (ttlInput) {
            ttlInput.addEventListener('input', (e) => {
                this.currentTTL = e.target.value;
                this.updatePreview();
            });
        }

        // Quick time buttons
        const timeButtons = document.querySelectorAll('.quick-amount-btn[data-time]');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = e.target.dataset.time;
                if (ttlInput) {
                    ttlInput.value = time;
                    this.currentTTL = time;
                    this.updatePreview();
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

        // Joy button (confetti test)
        const joyBtn = document.getElementById('joy-button');
        if (joyBtn) {
            joyBtn.addEventListener('click', () => {
                console.log('🎉 Joy button clicked - triggering confetti!');
                eventBus.emit(EVENTS.CONFETTI);
            });
        }
    }

    /**
     * Update ERF calculation preview
     */
    async updatePreview() {
        const previewDiv = document.getElementById('erf-preview');
        if (!previewDiv) return;

        // Need both value and TTL to calculate
        if (!this.currentValue || !this.currentTTL) {
            previewDiv.classList.add('hidden');
            return;
        }

        try {
            // Parse inputs
            const value = ethers.BigNumber.from(this.currentValue);
            const ttl = parseInt(this.currentTTL);

            // Calculate a sample ERF input based on value and time
            // For demonstration: normalize value to a reasonable range for ERF (-5 to 5)
            // This is a simplified calculation - actual futures contract will have proper logic
            const normalizedInput = this.normalizeForErf(value, ttl);
            
            if (!this.erfContract) {
                console.log('ERF contract not loaded yet');
                return;
            }

            // Call ERF calculator
            // Convert to string with fixed decimal places to avoid scientific notation
            const inputStr = normalizedInput.toFixed(10);
            const erfResult = await this.erfContract.erf(
                ethers.utils.parseUnits(inputStr, 10)
            );
            const erfValue = parseFloat(ethers.utils.formatUnits(erfResult, 10));
            
            // Calculate probability (normalize ERF output from [-1,1] to [0,1])
            const probability = ((erfValue + 1) / 2 * 100).toFixed(2);

            // Show results
            document.getElementById('erf-input').textContent = normalizedInput.toFixed(4);
            document.getElementById('erf-result').textContent = erfValue.toFixed(6);
            document.getElementById('probability').textContent = `${probability}%`;
            
            previewDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to calculate ERF:', error);
            previewDiv.classList.add('hidden');
        }
    }

    /**
     * Normalize value for ERF input (simplified for demo)
     * Maps value to reasonable ERF input range (-5 to 5)
     */
    normalizeForErf(value, ttl) {
        // Convert wei to eth for easier calculation
        const ethValue = parseFloat(ethers.utils.formatEther(value));
        
        // Normalize based on value and time
        // This is a placeholder - actual implementation would use proper Gaussian distribution
        const timeFactor = Math.log(ttl) / 10; // Logarithmic time scaling
        const valueFactor = Math.log(ethValue + 1) / 2; // Logarithmic value scaling
        
        // Map to [-5, 5] range
        const normalized = (valueFactor - timeFactor);
        return Math.max(-5, Math.min(5, normalized));
    }

    /**
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        eventBus.on(EVENTS.WALLET_CONNECTED, async (data) => {
            await this.updateWalletUI(data.address);
            // Reload ERF contract with signer
            await this.loadErfContract();
            
            // Enable create button when wallet connected
            const createBtn = document.getElementById('create-future-btn');
            if (createBtn) {
                createBtn.disabled = false;
            }
        });

        eventBus.on(EVENTS.WALLET_DISCONNECTED, async () => {
            await this.updateWalletUI(null);
            // Reload ERF contract in read-only mode
            await this.loadErfContract();
            
            // Disable create button when wallet disconnected
            const createBtn = document.getElementById('create-future-btn');
            if (createBtn) {
                createBtn.disabled = true;
            }
        });

        eventBus.on(EVENTS.WALLET_CHANGED, async (data) => {
            await this.updateWalletUI(data.address);
            await this.loadErfContract();
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

            // Get ERF calculator address
            const erfCalcAddress = CONTRACT_ADDRESSES.ERF_CALCULATOR;
            if (!erfCalcAddress || erfCalcAddress === '0x0000000000000000000000000000000000000000') {
                eventBus.emit(EVENTS.TOAST, {
                    message: 'ERF calculator address not configured',
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
                [epoch, erfCalcAddress],  // Constructor args: _epoch, _erf_calc
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
                [epoch, erfCalcAddress],  // Constructor args: _epoch, _erf_calc
                { value }  // Send ETH with deployment
            );

            // Track the deployed future
            this.deployedFutures.push({
                address,
                epoch,
                value: value.toString(),
                erfCalc: erfCalcAddress,
                deployedAt: Math.floor(Date.now() / 1000),
                txHash: deployTransaction.hash
            });

            // Save to localStorage
            this.saveFuturesHistory();

            // Show success
            eventBus.emit(EVENTS.TOAST, {
                message: `🎉 Future deployed at ${this.formatAddress(address)}`,
                type: 'success'
            });

            eventBus.emit(EVENTS.CONFETTI);

            // Show deployed contract info
            this.showDeployedContract(address, epoch, value, erfCalcAddress, deployTransaction.hash);

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
    showDeployedContract(address, epoch, value, erfCalc, txHash) {
        const container = document.getElementById('deployed-contracts');
        if (!container) return;

        const contractDiv = document.createElement('div');
        contractDiv.className = 'deployed-contract';
        contractDiv.innerHTML = `
            <h4>✅ Future Contract Deployed</h4>
            <div class="contract-details">
                <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <a href="${config.blockExplorer}/address/${address}" 
                       target="_blank" 
                       class="contract-address">${address}</a>
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
                    <span class="detail-label">ERF Calculator:</span>
                    <a href="${config.blockExplorer}/address/${erfCalc}" 
                       target="_blank" 
                       class="contract-address">${this.formatAddress(erfCalc)}</a>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction:</span>
                    <a href="${config.blockExplorer}/tx/${txHash}" 
                       target="_blank" 
                       class="contract-address">${txHash.slice(0, 10)}...</a>
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
                future.erfCalc,
                future.txHash
            );
        });
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

