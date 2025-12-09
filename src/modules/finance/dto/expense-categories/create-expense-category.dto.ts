import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
    @IsString()
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(7, { message: 'Color must be a valid hex color code (max 7 characters)' })
    color?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'Icon must not exceed 50 characters' })
    icon?: string;

    @IsNumber()
    @IsOptional()
    @Min(0, { message: 'Order must be greater than or equal to 0' })
    order?: number;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description?: string;
}

