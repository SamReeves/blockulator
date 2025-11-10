/**
 * Page Initializer
 * Common initialization logic for all pages
 */

import { web3Provider } from '../../js/infrastructure/blockchain/web3-provider.js';
import { WalletConnectComponent, ToastComponent } from '../../js/presentation/components/index.js';
import { initConfetti } from '../../js/presentation/effects/confetti-animation.js';
import { loadHeader, loadFooter } from './layout-loader.js';

let walletComponent = null;
let toastComponent = null;

/**
 * Initialize common page components
 */
export async function initializePage() {
    console.log('🔧 Initializing page...');
    
    try {
        // 1. Load layout components
        await Promise.all([
            loadHeader(),
            loadFooter()
        ]);
        
        // 2. Check for existing wallet connection
        await web3Provider.checkConnection();
        
        // 3. Initialize wallet component
        walletComponent = new WalletConnectComponent(web3Provider);
        walletComponent.render();
        
        // 4. Initialize toast notifications
        toastComponent = new ToastComponent();
        
        // 5. Initialize confetti effects
        initConfetti();
        
        console.log('✅ Page initialized');
        
        return {
            web3Provider,
            walletComponent,
            toastComponent
        };
    } catch (error) {
        console.error('❌ Failed to initialize page:', error);
        throw error;
    }
}

/**
 * Get the shared web3Provider instance
 */
export function getWeb3Provider() {
    return web3Provider;
}

/**
 * Get the wallet component instance
 */
export function getWalletComponent() {
    return walletComponent;
}

/**
 * Get the toast component instance
 */
export function getToastComponent() {
    return toastComponent;
}

