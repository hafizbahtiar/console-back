import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { UpdateCurrencyPreferencesDto, CurrencyPreferencesResponseDto, SupportedCurrenciesResponseDto } from '../dto/currency-preferences.dto';
import { getDefaultCurrency, SUPPORTED_CURRENCIES, isValidCurrencyCode } from '../../finance/common/currency-codes';

/**
 * Currency Preferences Service
 * 
 * Manages user currency preferences including base currency and supported currencies list.
 */
@Injectable()
export class CurrencyPreferencesService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    /**
     * Get user's currency preferences
     * Returns base currency and supported currencies, creating defaults if they don't exist
     */
    async getCurrencyPreferences(userId: string): Promise<CurrencyPreferencesResponseDto> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Set defaults if not present
        const baseCurrency = user.baseCurrency || getDefaultCurrency();
        const supportedCurrencies = user.supportedCurrencies && user.supportedCurrencies.length > 0
            ? user.supportedCurrencies
            : [getDefaultCurrency()];

        // Update user if defaults were applied
        if (!user.baseCurrency || !user.supportedCurrencies || user.supportedCurrencies.length === 0) {
            user.baseCurrency = baseCurrency;
            user.supportedCurrencies = supportedCurrencies;
            await user.save();
        }

        const userDoc = user.toObject ? user.toObject() : user;
        return {
            baseCurrency,
            supportedCurrencies,
            updatedAt: (userDoc as any).updatedAt,
        };
    }

    /**
     * Update user's currency preferences
     */
    async updateCurrencyPreferences(
        userId: string,
        updateDto: UpdateCurrencyPreferencesDto,
    ): Promise<CurrencyPreferencesResponseDto> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Validate and update base currency
        if (updateDto.baseCurrency !== undefined) {
            const baseCurrency = updateDto.baseCurrency.toUpperCase();
            if (!isValidCurrencyCode(baseCurrency)) {
                throw new BadRequestException(`Invalid base currency code: ${baseCurrency}. Must be a valid ISO 4217 currency code.`);
            }
            user.baseCurrency = baseCurrency;
        }

        // Validate and update supported currencies
        if (updateDto.supportedCurrencies !== undefined) {
            if (updateDto.supportedCurrencies.length === 0) {
                throw new BadRequestException('At least one supported currency is required');
            }

            // Validate all currency codes
            const validatedCurrencies = updateDto.supportedCurrencies.map((currency) => {
                const upperCurrency = currency.toUpperCase();
                if (!isValidCurrencyCode(upperCurrency)) {
                    throw new BadRequestException(`Invalid currency code: ${currency}. Must be a valid ISO 4217 currency code.`);
                }
                return upperCurrency;
            });

            // Remove duplicates
            const uniqueCurrencies = Array.from(new Set(validatedCurrencies));

            // Ensure base currency is in supported currencies
            const baseCurrency = user.baseCurrency || updateDto.baseCurrency || getDefaultCurrency();
            if (!uniqueCurrencies.includes(baseCurrency.toUpperCase())) {
                uniqueCurrencies.push(baseCurrency.toUpperCase());
            }

            user.supportedCurrencies = uniqueCurrencies;
        }

        await user.save();

        const userDoc = user.toObject ? user.toObject() : user;
        return {
            baseCurrency: user.baseCurrency || getDefaultCurrency(),
            supportedCurrencies: user.supportedCurrencies || [getDefaultCurrency()],
            updatedAt: (userDoc as any).updatedAt,
        };
    }

    /**
     * Get list of supported currencies (system-wide)
     * Returns all available currency codes with names
     */
    async getSupportedCurrencies(): Promise<SupportedCurrenciesResponseDto> {
        // Currency names mapping (can be extended)
        const currencyNames: Record<string, string> = {
            MYR: 'Malaysian Ringgit',
            USD: 'US Dollar',
            EUR: 'Euro',
            GBP: 'British Pound',
            SGD: 'Singapore Dollar',
            AUD: 'Australian Dollar',
            JPY: 'Japanese Yen',
            CNY: 'Chinese Yuan',
            HKD: 'Hong Kong Dollar',
            THB: 'Thai Baht',
            IDR: 'Indonesian Rupiah',
            PHP: 'Philippine Peso',
            VND: 'Vietnamese Dong',
            INR: 'Indian Rupee',
            KRW: 'South Korean Won',
            CAD: 'Canadian Dollar',
            NZD: 'New Zealand Dollar',
            CHF: 'Swiss Franc',
        };

        const currencies = SUPPORTED_CURRENCIES.map((code) => ({
            code,
            name: currencyNames[code] || code,
            symbol: this.getCurrencySymbol(code),
        }));

        return { currencies };
    }

    /**
     * Get currency symbol (can be extended with more symbols)
     */
    private getCurrencySymbol(code: string): string {
        const symbols: Record<string, string> = {
            MYR: 'RM',
            USD: '$',
            EUR: '€',
            GBP: '£',
            SGD: 'S$',
            AUD: 'A$',
            JPY: '¥',
            CNY: '¥',
            HKD: 'HK$',
            THB: '฿',
            IDR: 'Rp',
            PHP: '₱',
            VND: '₫',
            INR: '₹',
            KRW: '₩',
            CAD: 'C$',
            NZD: 'NZ$',
            CHF: 'CHF',
        };
        return symbols[code] || code;
    }
}

