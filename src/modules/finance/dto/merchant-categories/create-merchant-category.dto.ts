import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMerchantCategoryDto {
    @IsString()
    @IsNotEmpty({ message: 'Merchant name is required' })
    @MaxLength(200, { message: 'Merchant name must not exceed 200 characters' })
    merchantName: string;

    @IsString()
    @IsNotEmpty({ message: 'Category ID is required' })
    categoryId: string;
}

