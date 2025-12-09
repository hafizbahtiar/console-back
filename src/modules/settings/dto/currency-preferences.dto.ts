import { IsString, IsArray, IsOptional, Matches, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { isValidCurrencyCode, SUPPORTED_CURRENCIES } from '../../finance/common/currency-codes';

/**
 * DTO for updating currency preferences
 */
export class UpdateCurrencyPreferencesDto {
    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}$/, { message: 'Base currency must be a valid ISO 4217 currency code (3 uppercase letters, e.g., MYR, USD, EUR)' })
    baseCurrency?: string; // User's base currency (default: 'MYR')

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ArrayMinSize(1, { message: 'At least one supported currency is required' })
    @ArrayMaxSize(20, { message: 'Maximum 20 supported currencies allowed' })
    supportedCurrencies?: string[]; // List of currencies user wants to work with
}

/**
 * DTO for currency preferences response
 */
export class CurrencyPreferencesResponseDto {
    baseCurrency: string;
    supportedCurrencies: string[];
    updatedAt?: Date;
}

/**
 * DTO for supported currencies list response
 */
export class SupportedCurrenciesResponseDto {
    currencies: Array<{
        code: string;
        name: string;
        symbol?: string;
    }>;
}

