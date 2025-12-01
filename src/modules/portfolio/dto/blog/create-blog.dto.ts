import { IsString, IsOptional, IsArray, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateBlogDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    slug?: string; // Auto-generated if not provided

    @IsString()
    @MinLength(1)
    content: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    excerpt?: string;

    @IsString()
    @IsOptional()
    coverImage?: string;

    @IsBoolean()
    @IsOptional()
    published?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

