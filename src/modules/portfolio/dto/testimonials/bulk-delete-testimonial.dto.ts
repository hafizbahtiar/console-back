import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteTestimonialDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one testimonial ID is required' })
    @IsString({ each: true, message: 'Each ID must be a string' })
    ids: string[];
}

