import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteRecurringTransactionDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one recurring transaction ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

