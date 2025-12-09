import { IsOptional, IsArray, IsString, IsIn } from 'class-validator';

/**
 * DTO for applying OCR data to transaction
 */
export class ApplyOcrDataDto {
    /**
     * Fields to apply from OCR data
     * Options: 'amount', 'date', 'description', 'categoryId', 'paymentMethod'
     */
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsIn(['amount', 'date', 'description', 'categoryId', 'paymentMethod'], { each: true })
    fieldsToApply?: string[];

    /**
     * Optional: Override suggested category ID
     */
    @IsOptional()
    @IsString()
    categoryId?: string;
}

