import { Expose, Exclude } from 'class-transformer';

export class ExchangeRateResponseDto {
    @Expose()
    fromCurrency: string;

    @Expose()
    toCurrency: string;

    @Expose()
    rate: number;

    @Expose()
    date?: string; // Date for historical rates (YYYY-MM-DD format)

    @Expose()
    timestamp: Date; // When the rate was fetched/cached
}

@Exclude()
export class ConvertCurrencyResponseDto {
    @Expose()
    amount: number;

    @Expose()
    fromCurrency: string;

    @Expose()
    toCurrency: string;

    @Expose()
    convertedAmount: number;

    @Expose()
    exchangeRate: number;

    @Expose()
    date?: string; // Date for historical rates (YYYY-MM-DD format)
}

