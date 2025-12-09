import {
    IsNumber,
    IsString,
    IsEnum,
    IsOptional,
    IsArray,
    Min,
    MaxLength,
    ArrayMaxSize,
    ValidateIf,
    IsNotEmpty,
} from 'class-validator';
import { TransactionType } from '../../schemas/finance-transaction.schema';

export class UpdateTransactionTemplateDto {
    @IsString()
    @IsOptional()
    @MaxLength(200, { message: 'Template name must not exceed 200 characters' })
    name?: string;

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

    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'Category must not exceed 50 characters' })
    category?: string;
}

