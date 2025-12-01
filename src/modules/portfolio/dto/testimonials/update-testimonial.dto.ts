import { IsString, IsOptional, IsNumber, IsBoolean, MinLength, MaxLength, Min, Max } from 'class-validator';

export class UpdateTestimonialDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    role?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    company?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @IsNumber()
    @Min(0)
    @IsOptional()
    order?: number;
}

