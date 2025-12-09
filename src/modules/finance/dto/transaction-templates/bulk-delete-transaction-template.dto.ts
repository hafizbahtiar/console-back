import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class BulkDeleteTransactionTemplateDto {
    @IsArray({ message: 'IDs must be an array' })
    @ArrayMinSize(1, { message: 'At least one ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

