import { IsString, IsOptional, IsNumber, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    name: string;

    @IsString()
    @IsOptional()
    logo?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    industry?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsNumber()
    @IsOptional()
    foundedYear?: number;
}

