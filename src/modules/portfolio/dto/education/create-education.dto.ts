import { IsString, IsOptional, IsNumber, IsDateString, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateEducationDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    institution: string;

    @IsString()
    @MinLength(1)
    @MaxLength(200)
    degree: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    field?: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsNumber()
    @Min(0)
    @Max(4.0)
    @IsOptional()
    gpa?: number;

    @IsString()
    @IsOptional()
    description?: string;
}

