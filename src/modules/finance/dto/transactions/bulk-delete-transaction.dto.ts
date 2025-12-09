import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteTransactionDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one transaction ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

