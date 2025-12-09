import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class DuplicateTransactionDto {
    /**
     * Date adjustment in days
     * Positive number = add days to original date
     * Negative number = subtract days from original date
     * 0 or undefined = use same date
     */
    @IsNumber({}, { message: 'Date adjustment must be a valid number' })
    @IsOptional()
    @Min(-365, { message: 'Date adjustment cannot be more than 365 days in the past' })
    @Max(365, { message: 'Date adjustment cannot be more than 365 days in the future' })
    dateAdjustment?: number;
}

export class BulkDuplicateTransactionDto {
    @IsNumber({}, { message: 'Date adjustment must be a valid number' })
    @IsOptional()
    @Min(-365, { message: 'Date adjustment cannot be more than 365 days in the past' })
    @Max(365, { message: 'Date adjustment cannot be more than 365 days in the future' })
    dateAdjustment?: number;
}

