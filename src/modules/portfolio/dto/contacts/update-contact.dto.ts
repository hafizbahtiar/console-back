import { IsString, IsOptional, IsNumber, IsBoolean, IsUrl, MinLength, MaxLength, Min } from 'class-validator';

export class UpdateContactDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @IsOptional()
    platform?: string;

    @IsUrl()
    @IsOptional()
    url?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    order?: number;

    @IsBoolean()
    @IsOptional()
    active?: boolean;
}

