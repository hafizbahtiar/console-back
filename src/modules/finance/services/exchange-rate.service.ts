import { Injectable, Logger } from '@nestjs/common';
import { getDefaultCurrency } from '../common/currency-codes';

/**
 * Exchange Rate Service
 * 
 * Handles currency conversion and exchange rate fetching.
 * 
 * Note: This is a basic implementation. Phase 3 will add:
 * - External API integration (ExchangeRate-API, Fixer.io, etc.)
 * - Caching (Redis or in-memory)
 * - Historical exchange rates
 * - Fallback rates
 */
@Injectable()
export class ExchangeRateService {
    private readonly logger = new Logger(ExchangeRateService.name);

    /**
     * Get exchange rate from one currency to another
     * 
     * @param from - Source currency code (ISO 4217)
     * @param to - Target currency code (ISO 4217)
     * @param date - Optional date for historical rates (default: today)
     * @returns Exchange rate (1 unit of 'from' = X units of 'to')
     */
    async getExchangeRate(from: string, to: string, date?: Date): Promise<number> {
        // Normalize currency codes
        const fromCurrency = from.toUpperCase();
        const toCurrency = to.toUpperCase();

        // Same currency = 1.0
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        // TODO: Phase 3 - Implement external API integration
        // For now, return 1.0 as placeholder
        // This will be replaced with actual API calls in Phase 3
        this.logger.warn(
            `Exchange rate requested for ${fromCurrency} to ${toCurrency}. ` +
            `Returning 1.0 as placeholder. API integration pending in Phase 3.`
        );

        // Placeholder: return 1.0
        // In Phase 3, this will:
        // 1. Check cache first
        // 2. Call external API if not cached
        // 3. Use fallback rates if API fails
        return 1.0;
    }

    /**
     * Convert amount from one currency to another
     * 
     * @param amount - Amount to convert
     * @param from - Source currency code (ISO 4217)
     * @param to - Target currency code (ISO 4217)
     * @param date - Optional date for historical rates (default: today)
     * @returns Converted amount
     */
    async convertAmount(amount: number, from: string, to: string, date?: Date): Promise<number> {
        const exchangeRate = await this.getExchangeRate(from, to, date);
        const convertedAmount = amount * exchangeRate;
        
        // Round to 2 decimal places for financial precision
        return Math.round(convertedAmount * 100) / 100;
    }

    /**
     * Get exchange rate synchronously (for cases where async is not needed)
     * This is a simplified version that returns 1.0 for same currency, 1.0 for different currencies (placeholder)
     * 
     * @param from - Source currency code (ISO 4217)
     * @param to - Target currency code (ISO 4217)
     * @returns Exchange rate
     */
    getExchangeRateSync(from: string, to: string): number {
        const fromCurrency = from.toUpperCase();
        const toCurrency = to.toUpperCase();

        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        // Placeholder: return 1.0
        // TODO: Phase 3 - Replace with cached rates or API call
        return 1.0;
    }

    /**
     * Convert amount synchronously
     * 
     * @param amount - Amount to convert
     * @param from - Source currency code (ISO 4217)
     * @param to - Target currency code (ISO 4217)
     * @returns Converted amount
     */
    convertAmountSync(amount: number, from: string, to: string): number {
        const exchangeRate = this.getExchangeRateSync(from, to);
        const convertedAmount = amount * exchangeRate;
        
        // Round to 2 decimal places for financial precision
        return Math.round(convertedAmount * 100) / 100;
    }
}

