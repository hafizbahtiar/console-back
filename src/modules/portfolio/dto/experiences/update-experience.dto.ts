import { IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsMongoId, MinLength, MaxLength } from 'class-validator';

export class UpdateExperienceDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @IsOptional()
    title?: string;

    @IsMongoId()
    @IsOptional()
    companyId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    company?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    current?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    achievements?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    technologies?: string[];
}

