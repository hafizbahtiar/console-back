import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteFinancialGoalDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one financial goal ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

