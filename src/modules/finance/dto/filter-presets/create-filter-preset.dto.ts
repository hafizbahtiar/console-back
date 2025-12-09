import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../schemas/finance-transaction.schema';

class FilterPresetFiltersDto {
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    search?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(50)
    paymentMethod?: string;
}

export class CreateFilterPresetDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsObject()
    @ValidateNested()
    @Type(() => FilterPresetFiltersDto)
    filters: FilterPresetFiltersDto;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    isDefault?: boolean;
}

