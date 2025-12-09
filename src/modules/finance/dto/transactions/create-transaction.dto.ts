import {
    IsNumber,
    IsString,
    IsEnum,
    IsOptional,
    IsDateString,
    IsArray,
    Min,
    MaxLength,
    ArrayMaxSize,
    ValidateIf,
    IsNotEmpty,
    Matches
} from 'class-validator';
import { TransactionType } from '../../schemas/finance-transaction.schema';

export class CreateTransactionDto {
    @IsNumber({}, { message: 'Amount must be a valid number' })
    @Min(0.01, { message: 'Amount must be greater than 0' })
    amount: number;

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a valid ISO 4217 currency code (3 uppercase letters, e.g., MYR, USD, EUR)' })
    currency?: string; // ISO 4217 currency code (default: 'MYR' if not provided)

    @IsNumber({}, { message: 'Exchange rate must be a valid number' })
    @IsOptional()
    @Min(0, { message: 'Exchange rate must be greater than or equal to 0' })
    exchangeRate?: number; // Exchange rate at transaction time (optional, calculated if not provided)

    @IsNumber({}, { message: 'Base amount must be a valid number' })
    @IsOptional()
    @Min(0, { message: 'Base amount must be greater than or equal to 0' })
    baseAmount?: number; // Amount in base currency (optional, calculated if not provided)

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}$/, { message: 'Base currency must be a valid ISO 4217 currency code (3 uppercase letters)' })
    baseCurrency?: string; // User's base currency (default: 'MYR' if not provided)

    @IsDateString({}, { message: 'Date must be a valid date string (ISO format)' })
    @IsNotEmpty({ message: 'Date is required' })
    date: string;

    @IsString()
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description: string;

    @IsEnum(TransactionType, { message: 'Type must be either "expense" or "income"' })
    type: TransactionType;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.categoryId !== null && o.categoryId !== undefined && o.categoryId !== '')
    @IsNotEmpty({ message: 'Category ID must be a valid string if provided' })
    categoryId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Notes must not exceed 100 characters' })
    notes?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ArrayMaxSize(10, { message: 'Maximum 10 tags allowed' })
    tags?: string[];

    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'Payment method must not exceed 50 characters' })
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200, { message: 'Reference must not exceed 200 characters' })
    reference?: string;
}

