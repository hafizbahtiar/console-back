import {
    IsEnum,
    IsString,
    IsBoolean,
    IsNumber,
    IsOptional,
    Min,
    Max,
    MinLength,
} from 'class-validator';

export class UpdatePreferencesDto {
    // Appearance
    @IsOptional()
    @IsEnum(['light', 'dark', 'system'], {
        message: 'Theme must be one of: light, dark, system',
    })
    theme?: 'light' | 'dark' | 'system';

    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Language code must be at least 2 characters' })
    language?: string;

    // Date & Time
    @IsOptional()
    @IsString()
    dateFormat?: string;

    @IsOptional()
    @IsEnum(['12h', '24h'], {
        message: 'Time format must be either 12h or 24h',
    })
    timeFormat?: '12h' | '24h';

    @IsOptional()
    @IsString()
    timezone?: string;

    // Dashboard
    @IsOptional()
    @IsEnum(['grid', 'list', 'table'], {
        message: 'Default dashboard view must be one of: grid, list, table',
    })
    defaultDashboardView?: 'grid' | 'list' | 'table';

    @IsOptional()
    @IsString()
    itemsPerPage?: string;

    @IsOptional()
    @IsBoolean()
    showWidgets?: boolean;

    // Editor
    @IsOptional()
    @IsEnum(['light', 'dark', 'monokai', 'github'], {
        message: 'Editor theme must be one of: light, dark, monokai, github',
    })
    editorTheme?: 'light' | 'dark' | 'monokai' | 'github';

    @IsOptional()
    @IsNumber()
    @Min(10, { message: 'Editor font size must be at least 10' })
    @Max(24, { message: 'Editor font size must not exceed 24' })
    editorFontSize?: number;

    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Editor line height must be at least 1' })
    @Max(3, { message: 'Editor line height must not exceed 3' })
    editorLineHeight?: number;

    @IsOptional()
    @IsNumber()
    @Min(2, { message: 'Editor tab size must be at least 2' })
    @Max(8, { message: 'Editor tab size must not exceed 8' })
    editorTabSize?: number;
}

