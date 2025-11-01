/**
 * Web3 Provider Manager
 * Handles wallet connection and Web3 instance
 */

import { eventBus, EVENTS } from './ui/events.js';

class Web3Provider {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
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
        if (!this.isMetaMaskInstalled()) {
            eventBus.emit(EVENTS.TOAST, {
                message: 'Please install MetaMask to use WhaleGames',
                type: 'error'
            });
            return false;
        }

        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create ethers provider
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.address = await this.signer.getAddress();
            
            // Get network
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            
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
     * Get contract instance
     */
    getContract(address, abi) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        return new ethers.Contract(address, abi, this.signer);
    }

    /**
     * Get balance
     */
    async getBalance() {
        if (!this.address) return '0';
        const balance = await this.provider.getBalance(this.address);
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
}

// Global instance
export const web3Provider = new Web3Provider();

