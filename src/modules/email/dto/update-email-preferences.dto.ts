import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for updating email preferences
 * Only includes email-related notification preferences
 */
export class UpdateEmailPreferencesDto {
    @IsOptional()
    @IsBoolean()
    emailAccountActivity?: boolean; // Login notifications, password changes, email changes

    @IsOptional()
    @IsBoolean()
    emailSecurityAlerts?: boolean; // Security alerts, suspicious activity

    @IsOptional()
    @IsBoolean()
    emailMarketing?: boolean; // Marketing emails, promotional content

    @IsOptional()
    @IsBoolean()
    emailWeeklyDigest?: boolean; // Weekly summary emails
}

