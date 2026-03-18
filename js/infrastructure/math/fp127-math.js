/**
 * FP127 BigInt Math Utilities
 * Pure BigInt arithmetic for lossless decimal-to-fp127 conversion
 * 
 * FP127 Format: 127.128 fixed-point (int256 * 2^128)
 * - 128 integer bits + 128 fractional bits
 * - Signed two's complement
 * - Precision: ~38 decimal digits
 * - Range: ±1.7e38
 */

/**
 * Convert a decimal string to native fp127 BigInt format
 * @param {string} str - Decimal string (e.g., "3.14159265358979323846264338327950288419")
 * @returns {bigint} - FP127 value (int256 * 2^128)
 * 
 * Algorithm:
 *   1. Split into integer and fractional parts
 *   2. Handle sign (two's complement for negatives)
 *   3. Construct: (intPart << 128) + (fracDigits * 2^128 / 10^numDigits)
 * 
 * Examples:
 *   decimalToFp127("1.0") => 340282366920938463463374607431768211456n (1 << 128)
 *   decimalToFp127("2.0") => 680564733841876926926749214863536422912n (2 << 128)
 *   decimalToFp127("-1.0") => -340282366920938463463374607431768211456n
 */
export function decimalToFp127(str) {
    if (!str || str.trim() === '') {
        return 0n;
    }
    
    str = str.trim();
    
    // Handle sign
    const negative = str.startsWith('-');
    if (negative) {
        str = str.slice(1);
    }
    
    // Split on decimal point
    const parts = str.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';
    
    // Validate input
    if (!/^\d+$/.test(intPart) || (fracPart && !/^\d+$/.test(fracPart))) {
        throw new Error(`Invalid decimal string: ${negative ? '-' : ''}${str}`);
    }
    
    // Convert integer part: intPart << 128
    let value = BigInt(intPart) << 128n;
    
    // Convert fractional part: (fracDigits * 2^128) / 10^numDigits
    if (fracPart) {
        // Limit to 39 digits to avoid overflow in intermediate calculation
        // (2^128 * 10^39 fits in ~256 bits)
        const fracDigits = fracPart.slice(0, 39);
        const numDigits = BigInt(fracDigits.length);
        
        // fracValue = (fracDigits * 2^128) / 10^numDigits
        const fracValue = (BigInt(fracDigits) << 128n) / (10n ** numDigits);
        value += fracValue;
    }
    
    // Apply two's complement for negative values
    // JavaScript BigInt handles this automatically with the - operator
    return negative ? -value : value;
}

/**
 * Convert native fp127 BigInt to decimal string
 * @param {bigint} raw - FP127 value (int256 * 2^128)
 * @param {number} decimals - Number of decimal places to display (default: 38)
 * @returns {string} - Decimal string representation
 * 
 * Algorithm:
 *   1. Handle two's complement negative values
 *   2. Extract integer part: abs >> 128
 *   3. Extract fractional bits: abs & ((1 << 128) - 1)
 *   4. Compute fractional digits: (fracBits * 10^decimals) >> 128
 *   5. Pad and concatenate
 * 
 * Examples:
 *   fp127ToDecimal(340282366920938463463374607431768211456n) => "1.00000000000000000000000000000000000000"
 *   fp127ToDecimal(680564733841876926926749214863536422912n) => "2.00000000000000000000000000000000000000"
 */
export function fp127ToDecimal(raw, decimals = 38) {
    if (typeof raw === 'string') {
        raw = BigInt(raw);
    }
    
    // Handle zero
    if (raw === 0n) {
        return '0.' + '0'.repeat(decimals);
    }
    
    // Handle two's complement negative values
    const negative = raw < 0n;
    const abs = negative ? -raw : raw;
    
    // Extract integer part (upper 128 bits)
    const intPart = abs >> 128n;
    
    // Extract fractional bits (lower 128 bits)
    const fracBits = abs & ((1n << 128n) - 1n);
    
    // Convert fractional bits to decimal digits
    // fracDigits = (fracBits * 10^decimals) >> 128
    const fracScaled = (fracBits * (10n ** BigInt(decimals))) >> 128n;
    const fracStr = fracScaled.toString().padStart(decimals, '0');
    
    // Construct result
    const sign = negative ? '-' : '';
    return sign + intPart.toString() + '.' + fracStr;
}

/**
 * Validate a decimal string for fp127 conversion
 * @param {string} str - Decimal string to validate
 * @returns {boolean} - True if valid
 */
export function isValidFp127Decimal(str) {
    if (!str || typeof str !== 'string') {
        return false;
    }
    
    str = str.trim();
    
    // Remove leading sign
    if (str.startsWith('-') || str.startsWith('+')) {
        str = str.slice(1);
    }
    
    // Check format: digits, optional decimal point, optional more digits
    return /^\d+(\.\d+)?$/.test(str);
}

/**
 * Format fp127 decimal string for display (trim trailing zeros)
 * @param {string} decimalStr - Decimal string from fp127ToDecimal
 * @param {number} minDecimals - Minimum decimal places to keep (default: 2)
 * @returns {string} - Formatted string
 * 
 * Examples:
 *   formatFp127Display("1.00000000000000000000000000000000000000") => "1.00"
 *   formatFp127Display("3.14159265358979323846264338327950288419") => "3.14159265358979323846264338327950288419"
 */
export function formatFp127Display(decimalStr, minDecimals = 2) {
    if (!decimalStr.includes('.')) {
        return decimalStr;
    }
    
    const [intPart, fracPart] = decimalStr.split('.');
    
    // Trim trailing zeros but keep at least minDecimals
    let trimmed = fracPart;
    while (trimmed.length > minDecimals && trimmed.endsWith('0')) {
        trimmed = trimmed.slice(0, -1);
    }
    
    return intPart + '.' + trimmed;
}

/**
 * Compare two fp127 values
 * @param {bigint} a - First fp127 value
 * @param {bigint} b - Second fp127 value
 * @returns {number} - -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareFp127(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Check if fp127 value is negative
 * @param {bigint} value - FP127 value
 * @returns {boolean} - True if negative
 */
export function isNegativeFp127(value) {
    return value < 0n;
}

/**
 * Check if fp127 value is zero
 * @param {bigint} value - FP127 value
 * @returns {boolean} - True if zero
 */
export function isZeroFp127(value) {
    return value === 0n;
}

/**
 * Get the absolute value of an fp127 number
 * @param {bigint} value - FP127 value
 * @returns {bigint} - Absolute value
 */
export function absFp127(value) {
    return value < 0n ? -value : value;
}
