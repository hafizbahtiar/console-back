import { IsString, IsOptional, MaxLength, ValidateIf, IsNotEmpty } from 'class-validator';

export class UpdateMerchantCategoryDto {
    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.merchantName !== undefined && o.merchantName !== null && o.merchantName !== '')
    @IsNotEmpty({ message: 'Merchant name must be a valid string if provided' })
    @MaxLength(200, { message: 'Merchant name must not exceed 200 characters' })
    merchantName?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.categoryId !== undefined && o.categoryId !== null && o.categoryId !== '')
    @IsNotEmpty({ message: 'Category ID must be a valid string if provided' })
    categoryId?: string;
}

