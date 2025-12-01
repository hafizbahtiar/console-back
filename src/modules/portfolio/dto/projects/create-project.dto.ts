import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsDateString, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsUrl()
    @IsOptional()
    url?: string;

    @IsUrl()
    @IsOptional()
    githubUrl?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    technologies?: string[];

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @IsNumber()
    @IsOptional()
    order?: number;
}

