/**
 * ISO 4217 Currency Codes
 * 
 * Common currency codes supported by the system.
 * This list can be extended as needed.
 */
export const SUPPORTED_CURRENCIES = [
    'MYR', // Malaysian Ringgit (default)
    'USD', // US Dollar
    'EUR', // Euro
    'GBP', // British Pound
    'SGD', // Singapore Dollar
    'AUD', // Australian Dollar
    'JPY', // Japanese Yen
    'CNY', // Chinese Yuan
    'HKD', // Hong Kong Dollar
    'THB', // Thai Baht
    'IDR', // Indonesian Rupiah
    'PHP', // Philippine Peso
    'VND', // Vietnamese Dong
    'INR', // Indian Rupee
    'KRW', // South Korean Won
    'CAD', // Canadian Dollar
    'NZD', // New Zealand Dollar
    'CHF', // Swiss Franc
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

/**
 * Check if a currency code is valid (ISO 4217 format)
 * @param currency - Currency code to validate
 * @returns true if valid, false otherwise
 */
export function isValidCurrencyCode(currency: string): boolean {
    if (!currency || typeof currency !== 'string') {
        return false;
    }
    // ISO 4217 codes are exactly 3 uppercase letters
    if (!/^[A-Z]{3}$/.test(currency)) {
        return false;
    }
    // Check if it's in our supported list (optional - can be removed for full ISO 4217 support)
    return SUPPORTED_CURRENCIES.includes(currency as CurrencyCode);
}

/**
 * Get default currency (MYR)
 */
export function getDefaultCurrency(): string {
    return 'MYR';
}

