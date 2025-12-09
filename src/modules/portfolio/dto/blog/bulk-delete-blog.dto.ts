import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteBlogDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one blog ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

