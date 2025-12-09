import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteBudgetDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one budget ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

