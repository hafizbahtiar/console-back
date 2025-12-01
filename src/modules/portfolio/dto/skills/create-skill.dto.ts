import { IsString, IsOptional, IsNumber, IsIn, MinLength, MaxLength, Min, Max } from 'class-validator';

export enum SkillCategory {
    FRONTEND = 'Frontend',
    BACKEND = 'Backend',
    DATABASE = 'Database',
    DEVOPS = 'DevOps',
    MOBILE = 'Mobile',
    DESIGN = 'Design',
    TOOLS = 'Tools',
    OTHER = 'Other',
}

export class CreateSkillDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @IsString()
    @IsIn(Object.values(SkillCategory))
    category: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    level?: number; // 0-100 percentage

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

