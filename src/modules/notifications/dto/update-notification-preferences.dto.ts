import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
    // Email notification preferences
    @IsOptional()
    @IsBoolean()
    emailAccountActivity?: boolean;

    @IsOptional()
    @IsBoolean()
    emailSecurityAlerts?: boolean;

    @IsOptional()
    @IsBoolean()
    emailMarketing?: boolean;

    @IsOptional()
    @IsBoolean()
    emailWeeklyDigest?: boolean;

    // In-app notification preferences
    @IsOptional()
    @IsBoolean()
    inAppSystem?: boolean;

    @IsOptional()
    @IsBoolean()
    inAppProjects?: boolean;

    @IsOptional()
    @IsBoolean()
    inAppMentions?: boolean;

    // Push notification preferences
    @IsOptional()
    @IsBoolean()
    pushEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    pushBrowser?: boolean;

    @IsOptional()
    @IsBoolean()
    pushMobile?: boolean;
}

