// The part of the old SPA shell that the islands still need: the shared wallet,
// toast and error banner, built once per page. Ported from the retired
// js/application/master-app.js without the router, confetti and particles.
import { eventBus, EVENTS } from '../legacy/infrastructure/events/event-bus.js';

export async function boot({ walletHost }) {
    if (typeof window.ethers === 'undefined') {
        showError('The ethers library did not load, so nothing on this page can reach Sepolia. Reload, or check your network.');
        throw new Error('ethers missing');
    }
    // web3-provider builds a JsonRpcProvider at import time, so import it after the guard
    const { web3Provider } = await import('../legacy/infrastructure/blockchain/web3-provider.js');
    const { WalletConnectComponent } = await import('../legacy/presentation/components/wallet-connect.js');
    const { ToastComponent } = await import('../legacy/presentation/components/toast.js');
    const { NetworkSwitcherComponent } = await import('../legacy/presentation/components/network-switcher.js');

    await web3Provider.checkConnection();
    const walletComponent = new WalletConnectComponent(web3Provider);
    walletComponent.render(walletHost);
    new NetworkSwitcherComponent().render(walletHost);
    const toastComponent = new ToastComponent();

    eventBus.on(EVENTS.APP_ERROR, ({ message }) => showError(message));
    eventBus.on(EVENTS.APP_ERROR_CLEAR, () => showError(null));
    document.getElementById('app-error-dismiss')?.addEventListener('click', () => eventBus.emit(EVENTS.APP_ERROR_CLEAR));

    return { web3Provider, walletComponent, toastComponent, eventBus, EVENTS };
}

function showError(message) {
    const banner = document.getElementById('app-error');
    const text = document.getElementById('app-error-message');
    if (!banner || !text) return;
    if (message) { text.textContent = message; banner.classList.remove('hidden'); }
    else { text.textContent = ''; banner.classList.add('hidden'); }
}

// Load a classic script once and resolve when its global exists (Chart.js for the futures market).
export function loadScript(src, globalName) {
    if (window[globalName]) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.async = true;
        s.onload = resolve; s.onerror = () => reject(new Error(`failed to load ${src}`));
        document.head.appendChild(s);
    });
}
