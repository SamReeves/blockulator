/**
 * Web3 Provider Manager
 * Handles wallet connection and Web3 instance
 * Supports read-only mode without wallet connection
 */

import { eventBus, EVENTS } from './ui/events.js';
import { config } from './config.js';

class Web3Provider {
    constructor() {
        this.provider = null;           // Wallet provider (when connected)
        this.signer = null;              // Wallet signer
        this.address = null;             // Connected wallet address
        this.chainId = null;             // Connected network chain ID
        this.readOnlyProvider = null;   // Public RPC provider (always available)
        
        // Initialize read-only provider immediately
        this.initReadOnlyProvider();
    }

    /**
     * Initialize read-only provider for viewing blockchain state
     * This works without any wallet connection
     */
    initReadOnlyProvider() {
        try {
            // Initialize with network from config
            this.readOnlyProvider = new ethers.providers.JsonRpcProvider(
                config.rpcUrl
            );
            console.log(`📖 Read-only provider initialized for ${config.name}`);
        } catch (error) {
            console.error('Failed to initialize read-only provider:', error);
        }
    }

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Connect to wallet
     */
    async connect() {
        console.log('🔌 web3Provider.connect() called');
        console.log('MetaMask installed:', this.isMetaMaskInstalled());
        console.log('window.ethereum:', typeof window.ethereum);
        
        if (!this.isMetaMaskInstalled()) {
            console.error('❌ MetaMask not installed');
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please install MetaMask to use WhaleGames',
                type: 'error'
            });
            return false;
        }

        try {
            console.log('📝 Requesting account access...');
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create ethers provider
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.address = await this.signer.getAddress();
            
            // Get network
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            
            console.log('🔗 Connected to network:', {
                chainId: this.chainId,
                chainIdHex: '0x' + this.chainId.toString(16),
                address: this.address
            });
            
            // Check if on correct network
            if (this.chainId !== config.chainId) {
                eventBus.emit(EVENTS.TOAST, {
                    message: `⚠️ Please switch to ${config.name}! Currently on chain ID: ${this.chainId}`,
                    type: 'error'
                });
                
                // Try to switch to correct network
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: config.chainIdHex }],
                    });
                    
                    // Re-get network after switch
                    const newNetwork = await this.provider.getNetwork();
                    this.chainId = newNetwork.chainId;
                    
                    eventBus.emit(EVENTS.TOAST, {
                        message: `✅ Switched to ${config.name}`,
                        type: 'success'
                    });
                } catch (switchError) {
                    console.error('Failed to switch network:', switchError);
                    if (switchError.code === 4902) {
                        // Network not added to MetaMask, try to add it
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: config.chainIdHex,
                                    chainName: config.name,
                                    nativeCurrency: config.nativeCurrency,
                                    rpcUrls: [config.rpcUrl],
                                    blockExplorerUrls: [config.blockExplorer]
                                }]
                            });
                            
                            // Re-get network after adding
                            const newNetwork = await this.provider.getNetwork();
                            this.chainId = newNetwork.chainId;
                            
                            eventBus.emit(EVENTS.TOAST, {
                                message: `✅ Added and switched to ${config.name}`,
                                type: 'success'
                            });
                        } catch (addError) {
                            console.error('Failed to add network:', addError);
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
            
            // Setup listeners
            this.setupListeners();
            
            eventBus.emit(EVENTS.WALLET_CONNECTED, {
                address: this.address,
                chainId: this.chainId
            });
            
            eventBus.emit(EVENTS.TOAST, {
                message: 'Wallet connected successfully',
                type: 'success'
            });
            
            return true;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            eventBus.emit(EVENTS.TOAST, {
                message: 'Failed to connect wallet',
                type: 'error'
            });
            return false;
        }
    }

    /**
     * Setup event listeners for wallet changes
     */
    setupListeners() {
        if (window.ethereum) {
            // Account changed
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.handleAccountChange(accounts[0]);
                }
            });

            // Chain changed
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    /**
     * Handle account change
     */
    async handleAccountChange(newAddress) {
        this.address = newAddress;
        this.signer = this.provider.getSigner();
        
        eventBus.emit(EVENTS.WALLET_CHANGED, {
            address: this.address
        });
        
        eventBus.emit(EVENTS.TOAST, {
            message: 'Wallet account changed',
            type: 'warning'
        });
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        
        eventBus.emit(EVENTS.WALLET_DISCONNECTED);
    }

    /**
     * Get the appropriate provider (wallet if connected, read-only otherwise)
     */
    getProvider() {
        return this.provider || this.readOnlyProvider;
    }

    /**
     * Get signer (only available when wallet is connected)
     */
    getSigner() {
        if (!this.signer) {
            return null;
        }
        return this.signer;
    }

    /**
     * Get contract instance
     * Returns read-only contract if wallet not connected
     * Returns contract with signer if wallet is connected
     */
    getContract(address, abi) {
        const provider = this.getProvider();
        const contract = new ethers.Contract(address, abi, provider);
        
        // If wallet connected, attach signer for write operations
        if (this.signer) {
            return contract.connect(this.signer);
        }
        
        // Return read-only contract
        return contract;
    }

    /**
     * Get balance (requires connected wallet address)
     */
    async getBalance() {
        if (!this.address) return '0';
        const provider = this.getProvider();
        const balance = await provider.getBalance(this.address);
        return ethers.utils.formatEther(balance);
    }

    /**
     * Format address for display
     */
    formatAddress(address = this.address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.provider !== null && this.address !== null;
    }

    /**
     * Get current address (alias for backward compatibility)
     */
    get currentAddress() {
        return this.address;
    }
}

// Global instance
export const web3Provider = new Web3Provider();

