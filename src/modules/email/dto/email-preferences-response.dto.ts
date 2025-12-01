import { Expose } from 'class-transformer';

/**
 * DTO for email preferences response
 * Only includes email-related notification preferences
 */
export class EmailPreferencesResponseDto {
    @Expose()
    id: string;

    @Expose()
    userId: string;

    @Expose()
    emailAccountActivity: boolean;

    @Expose()
    emailSecurityAlerts: boolean;

    @Expose()
    emailMarketing: boolean;

    @Expose()
    emailWeeklyDigest: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

