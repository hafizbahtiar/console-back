import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteCompanyDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one company ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

