import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteContactDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one contact ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

