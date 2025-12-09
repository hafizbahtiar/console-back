import {
    IsNumber,
    IsString,
    IsEnum,
    IsOptional,
    IsDateString,
    IsArray,
    IsBoolean,
    Min,
    MaxLength,
    ArrayMaxSize,
    ValidateIf,
    IsNotEmpty,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { RecurringFrequency } from '../../schemas/finance-recurring-transaction.schema';

/**
 * Transaction Template DTO - embedded in recurring transaction (for updates)
 */
export class UpdateTransactionTemplateDto {
    @IsNumber({}, { message: 'Amount must be a valid number' })
    @IsOptional()
    @ValidateIf((o) => o.amount !== undefined && o.amount !== null)
    @Min(0.01, { message: 'Amount must be greater than 0' })
    amount?: number;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description?: string;

    @IsEnum(TransactionType, { message: 'Type must be either "expense" or "income"' })
    @IsOptional()
    type?: TransactionType;

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

export class UpdateRecurringTransactionDto {
    /**
     * Transaction template - embedded object containing transaction data
     * All fields optional for updates
     */
    @ValidateNested()
    @Type(() => UpdateTransactionTemplateDto)
    @IsOptional()
    template?: UpdateTransactionTemplateDto;

    /**
     * Frequency of recurrence
     */
    @IsEnum(RecurringFrequency, {
        message: 'Frequency must be one of: daily, weekly, monthly, yearly, custom',
    })
    @IsOptional()
    frequency?: RecurringFrequency;

    /**
     * Interval for custom frequency (only used when frequency is 'custom')
     */
    @IsNumber({}, { message: 'Interval must be a valid number' })
    @IsOptional()
    @Min(1, { message: 'Interval must be at least 1' })
    interval?: number;

    /**
     * Start date - when the recurring transaction should start generating
     */
    @IsDateString({}, { message: 'Start date must be a valid date string (ISO format)' })
    @IsOptional()
    @ValidateIf((o) => o.startDate !== null && o.startDate !== undefined && o.startDate !== '')
    startDate?: string;

    /**
     * End date - when the recurring transaction should stop generating (optional)
     */
    @IsDateString({}, { message: 'End date must be a valid date string (ISO format)' })
    @IsOptional()
    @ValidateIf((o) => o.endDate !== null && o.endDate !== undefined && o.endDate !== '')
    endDate?: string;

    /**
     * Whether the recurring transaction is active
     */
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

