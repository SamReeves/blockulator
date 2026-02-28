/**
 * Blockchain Math Utilities
 * Infrastructure layer - Centralized number conversions and blockchain math
 * Handles all Wei <-> ETH, fixed-point, and safe parsing operations
 */

/**
 * BlockchainMath - Static utility class for blockchain number operations
 * Eliminates scattered parseFloat/parseInt/formatUnits calls across codebase
 */
export class BlockchainMath {
    /**
     * Convert decimal to fixed-point representation
     * Used for sending values to contracts that use fixed-point math
     * 
     * @param {number} decimal - Decimal value (e.g., 1.5)
     * @param {number} precision - Decimal places (default 10)
     * @returns {bigint} Fixed-point value (e.g., 15000000000 for 1.5 with precision 10)
     * 
     * @example
     * BlockchainMath.toFixedPoint(1.5, 10)  // 15000000000n
     * BlockchainMath.toFixedPoint(3.14, 2)  // 314n
     */
    static toFixedPoint(decimal, precision = 10) {
        if (decimal === null || decimal === undefined || isNaN(decimal)) {
            return BigInt(0);
        }
        return BigInt(Math.floor(decimal * (10 ** precision)));
    }
    
    /**
     * Convert fixed-point to decimal representation
     * Used for displaying values received from contracts
     * 
     * @param {bigint|string|number} fixedPoint - Fixed-point value
     * @param {number} precision - Decimal places (default 10)
     * @returns {number} Decimal value
     * 
     * @example
     * BlockchainMath.fromFixedPoint(15000000000, 10)  // 1.5
     * BlockchainMath.fromFixedPoint(314, 2)  // 3.14
     */
    static fromFixedPoint(fixedPoint, precision = 10) {
        if (fixedPoint === null || fixedPoint === undefined) {
            return 0;
        }
        return Number(fixedPoint) / (10 ** precision);
    }
    
    /**
     * Format Wei to ETH string for display
     * 
     * @param {bigint|string} wei - Wei value
     * @param {number} decimals - Display decimals (default 4)
     * @returns {string} Formatted ETH string
     * 
     * @example
     * BlockchainMath.formatEth('1000000000000000000')  // "1.0000"
     * BlockchainMath.formatEth('1500000000000000000', 2)  // "1.50"
     */
    static formatEth(wei, decimals = 4) {
        if (!wei || wei === '0') {
            return '0.' + '0'.repeat(decimals);
        }
        const eth = ethers.utils.formatEther(wei);
        return parseFloat(eth).toFixed(decimals);
    }
    
    /**
     * Parse ETH string/number to Wei
     * 
     * @param {string|number} eth - ETH amount
     * @returns {bigint} Wei value
     * 
     * @example
     * BlockchainMath.parseEth('1.5')  // 1500000000000000000n
     * BlockchainMath.parseEth(1.5)    // 1500000000000000000n
     */
    static parseEth(eth) {
        if (!eth || eth === '0' || eth === 0) {
            return ethers.BigNumber.from(0);
        }
        return ethers.utils.parseEther(eth.toString());
    }
    
    /**
     * Format Wei to Gwei string
     * 
     * @param {bigint|string} wei - Wei value
     * @param {number} decimals - Display decimals (default 2)
     * @returns {string} Formatted Gwei string
     */
    static formatGwei(wei, decimals = 2) {
        if (!wei || wei === '0') {
            return '0.' + '0'.repeat(decimals);
        }
        const gwei = ethers.utils.formatUnits(wei, 'gwei');
        return parseFloat(gwei).toFixed(decimals);
    }
    
    /**
     * Safe integer parsing with validation and default value
     * 
     * @param {any} value - Value to parse
     * @param {number} defaultValue - Default if parsing fails (default 0)
     * @returns {number} Parsed integer or default
     * 
     * @example
     * BlockchainMath.parseInt('42')      // 42
     * BlockchainMath.parseInt('abc', 0)  // 0
     * BlockchainMath.parseInt(null, -1)  // -1
     */
    static parseInt(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    /**
     * Safe float parsing with validation and default value
     * 
     * @param {any} value - Value to parse
     * @param {number} defaultValue - Default if parsing fails (default 0)
     * @returns {number} Parsed float or default
     * 
     * @example
     * BlockchainMath.parseFloat('3.14')     // 3.14
     * BlockchainMath.parseFloat('abc', 0)   // 0
     * BlockchainMath.parseFloat(null, -1)   // -1
     */
    static parseFloat(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    /**
     * Format number with thousands separators
     * 
     * @param {number} value - Number to format
     * @param {number} decimals - Decimal places (default 2)
     * @returns {string} Formatted number string
     * 
     * @example
     * BlockchainMath.formatNumber(1234567.89)     // "1,234,567.89"
     * BlockchainMath.formatNumber(1234567.89, 0)  // "1,234,568"
     */
    static formatNumber(value, decimals = 2) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        return value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    /**
     * Format percentage value
     * 
     * @param {number} value - Value between 0 and 1
     * @param {number} decimals - Decimal places (default 1)
     * @returns {string} Formatted percentage string
     * 
     * @example
     * BlockchainMath.formatPercent(0.1234)     // "12.3%"
     * BlockchainMath.formatPercent(0.1234, 2)  // "12.34%"
     */
    static formatPercent(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        return (value * 100).toFixed(decimals) + '%';
    }
    
    /**
     * Clamp value between min and max
     * 
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     * 
     * @example
     * BlockchainMath.clamp(5, 0, 10)   // 5
     * BlockchainMath.clamp(-5, 0, 10)  // 0
     * BlockchainMath.clamp(15, 0, 10)  // 10
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Check if value is a valid number
     * 
     * @param {any} value - Value to check
     * @returns {boolean} True if valid number
     */
    static isValidNumber(value) {
        return value !== null && 
               value !== undefined && 
               value !== '' && 
               !isNaN(parseFloat(value)) && 
               isFinite(value);
    }
    
    /**
     * Round to specified decimal places
     * 
     * @param {number} value - Value to round
     * @param {number} decimals - Decimal places (default 2)
     * @returns {number} Rounded value
     * 
     * @example
     * BlockchainMath.round(3.14159, 2)  // 3.14
     * BlockchainMath.round(3.14159, 0)  // 3
     */
    static round(value, decimals = 2) {
        const multiplier = 10 ** decimals;
        return Math.round(value * multiplier) / multiplier;
    }
    
    /**
     * Calculate percentage of total
     * 
     * @param {number} part - Part value
     * @param {number} total - Total value
     * @returns {number} Percentage (0-1)
     * 
     * @example
     * BlockchainMath.percentOf(25, 100)  // 0.25
     * BlockchainMath.percentOf(0, 100)   // 0
     */
    static percentOf(part, total) {
        if (!total || total === 0) {
            return 0;
        }
        return part / total;
    }
}


