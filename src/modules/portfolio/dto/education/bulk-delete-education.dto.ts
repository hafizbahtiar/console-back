import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteEducationDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one education ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

