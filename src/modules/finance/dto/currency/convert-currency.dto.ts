import { IsString, IsNumber, IsOptional, Matches, Min, ValidateIf } from 'class-validator';
import { isValidCurrencyCode } from '../../common/currency-codes';

export class ConvertCurrencyDto {
    @IsNumber({}, { message: 'Amount must be a valid number' })
    @Min(0, { message: 'Amount must be greater than or equal to 0' })
    amount: number;

    @IsString()
    @Matches(/^[A-Z]{3}$/, { message: 'From currency must be a valid ISO 4217 currency code (3 uppercase letters)' })
    @ValidateIf((o) => {
        if (o.fromCurrency !== undefined && o.fromCurrency !== null && o.fromCurrency !== '') {
            return isValidCurrencyCode(o.fromCurrency);
        }
        return true;
    })
    fromCurrency: string;

    @IsString()
    @Matches(/^[A-Z]{3}$/, { message: 'To currency must be a valid ISO 4217 currency code (3 uppercase letters)' })
    @ValidateIf((o) => {
        if (o.toCurrency !== undefined && o.toCurrency !== null && o.toCurrency !== '') {
            return isValidCurrencyCode(o.toCurrency);
        }
        return true;
    })
    toCurrency: string;

    @IsOptional()
    @IsString()
    date?: string; // Optional date for historical rates (YYYY-MM-DD format)
}

