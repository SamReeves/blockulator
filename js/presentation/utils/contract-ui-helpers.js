/**
 * Contract UI Helpers
 * 
 * Reusable UI components for displaying contract information.
 * This eliminates duplication across calculator and game implementations.
 */

/**
 * Renders a contract address display with proper formatting
 * @param {string} address - The contract address
 * @param {string} label - Optional label (defaults to "Contract Address")
 * @returns {string} HTML string
 */
export function renderContractAddress(address, label = 'Contract Address') {
    return `<p class="note">📍 <strong>${label}:</strong> <code style="word-break: break-all;">${address}</code></p>`;
}

/**
 * Renders an Etherscan link for a contract
 * @param {string} address - The contract address
 * @param {string} network - Network name (e.g., 'sepolia', 'mainnet')
 * @returns {string} HTML string
 */
export function renderEtherscanLink(address, network = 'sepolia') {
    const baseUrl = network === 'mainnet' 
        ? 'https://etherscan.io' 
        : `https://${network}.etherscan.io`;
    return `<p class="note">🔍 <strong>View on Etherscan:</strong> <a href="${baseUrl}/address/${address}" target="_blank" rel="noopener noreferrer">${address.substring(0, 10)}...${address.substring(address.length - 8)}</a></p>`;
}

/**
 * Renders a Vyper code example for using a contract
 * @param {string} contractName - Name of the contract (e.g., "PiCalculator")
 * @param {string} contractAddress - The contract address
 * @param {string} interfaceCode - The interface definition
 * @param {string} exampleUsage - Example usage code
 * @returns {string} HTML string
 */
export function renderVyperExample(contractName, contractAddress, interfaceCode, exampleUsage) {
    return `
        <h3>🔧 Use in Your Smart Contract</h3>
        <div class="tool-info">
            <p>You can call this contract from your own smart contracts! Here's an example in Vyper:</p>
            <pre><code># Interface for ${contractName}
${interfaceCode}

# Use the contract
CALC: constant(address) = ${contractAddress}

${exampleUsage}
</code></pre>
            <p class="note">✨ <strong>Free to use:</strong> All view functions have no gas cost!</p>
            ${renderContractAddress(contractAddress)}
        </div>
    `;
}

/**
 * Renders a standard "Free to use" note
 * @returns {string} HTML string
 */
export function renderFreeToUseNote() {
    return `<p class="note">✨ <strong>Free to use:</strong> All calculations are view functions with no gas cost!</p>`;
}

/**
 * Renders an on-chain calculation note
 * @param {string} customText - Optional custom description
 * @returns {string} HTML string
 */
export function renderOnChainNote(customText = 'Results are computed on the blockchain.') {
    return `<p class="note">🔒 <strong>On-chain calculation:</strong> ${customText}</p>`;
}

/**
 * Renders a complete technical panel for a calculator
 * @param {Object} config - Configuration object
 * @param {string} config.name - Calculator name
 * @param {string} config.symbol - Mathematical symbol
 * @param {string} config.address - Contract address
 * @param {string} config.description - HTML description of the calculator
 * @param {string} config.interfaceCode - Vyper interface definition
 * @param {string} config.exampleCode - Example usage code
 * @param {string} config.network - Network name (default: 'sepolia')
 * @returns {string} HTML string
 */
export function renderCalculatorTechnicalPanel(config) {
    const {
        name,
        symbol,
        address,
        description,
        interfaceCode,
        exampleCode,
        network = 'sepolia'
    } = config;

    return `
        <h3>📖 About ${name}</h3>
        <div class="tool-info">
            ${description}
            ${renderOnChainNote()}
        </div>
        
        ${renderVyperExample(name, address, interfaceCode, exampleCode)}
        
        <h3>📡 Contract Details</h3>
        <div class="tool-info">
            ${renderContractAddress(address)}
            ${renderEtherscanLink(address, network)}
            ${renderFreeToUseNote()}
        </div>
    `;
}

/**
 * Renders a game status card
 * @param {string} title - Card title
 * @param {string} value - Value to display
 * @param {string} icon - Optional icon/emoji
 * @returns {string} HTML string
 */
export function renderStatusCard(title, value, icon = '📊') {
    return `
        <div class="status-card">
            <div class="status-title">${icon} ${title}</div>
            <div class="status-value">${value}</div>
        </div>
    `;
}

/**
 * Renders a transaction loading state
 * @param {string} message - Loading message
 * @returns {string} HTML string
 */
export function renderLoadingState(message = 'Processing transaction...') {
    return `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Renders an error message
 * @param {string} message - Error message
 * @param {string} details - Optional error details
 * @returns {string} HTML string
 */
export function renderErrorMessage(message, details = '') {
    return `
        <div class="error-message">
            <strong>❌ Error:</strong> ${message}
            ${details ? `<div class="error-details">${details}</div>` : ''}
        </div>
    `;
}

/**
 * Renders a success message
 * @param {string} message - Success message
 * @returns {string} HTML string
 */
export function renderSuccessMessage(message) {
    return `
        <div class="success-message">
            <strong>✅ Success:</strong> ${message}
        </div>
    `;
}

/**
 * Formats an Ethereum address for display (shortened)
 * @param {string} address - Full address
 * @param {number} startChars - Characters to show at start (default: 6)
 * @param {number} endChars - Characters to show at end (default: 4)
 * @returns {string} Formatted address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) {
        return address;
    }
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Formats a number with commas for display
 * @param {number|string} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 2) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Formats Wei to ETH for display
 * @param {string|number} wei - Wei amount
 * @param {number} decimals - Decimal places (default: 4)
 * @returns {string} Formatted ETH amount
 */
export function formatWeiToEth(wei, decimals = 4) {
    try {
        const eth = parseFloat(wei) / 1e18;
        return formatNumber(eth, decimals);
    } catch (error) {
        return '0.0000';
    }
}

