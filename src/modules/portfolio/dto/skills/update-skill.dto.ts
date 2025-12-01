import { IsString, IsOptional, IsNumber, IsIn, MinLength, MaxLength, Min, Max } from 'class-validator';
import { SkillCategory } from './create-skill.dto';

export class UpdateSkillDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @IsOptional()
    name?: string;

    @IsString()
    @IsIn(Object.values(SkillCategory))
    @IsOptional()
    category?: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    level?: number;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    order?: number;
}

