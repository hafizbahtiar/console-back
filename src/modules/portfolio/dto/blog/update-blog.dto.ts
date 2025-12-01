import { IsString, IsOptional, IsArray, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateBlogDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    slug?: string;

    @IsString()
    @IsOptional()
    content?: string;

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

