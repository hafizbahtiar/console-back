import { IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsMongoId, MinLength, MaxLength } from 'class-validator';

export class CreateExperienceDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @IsMongoId()
    @IsOptional()
    companyId?: string; // Reference to Company schema

    @IsString()
    @IsOptional()
    @MaxLength(200)
    company?: string; // Can be used if companyId is not set

    @IsString()
    @IsOptional()
    location?: string;

    @IsDateString()
    startDate: string;

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

