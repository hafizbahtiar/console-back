import { IsString, IsOptional, IsNumber, IsBoolean, IsUrl, MinLength, MaxLength, Min } from 'class-validator';

export class CreateContactDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    platform: string; // e.g., 'GitHub', 'LinkedIn', 'Twitter', etc.

    @IsUrl()
    url: string;

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

