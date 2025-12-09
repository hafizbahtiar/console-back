import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteExpenseCategoryDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one category ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

