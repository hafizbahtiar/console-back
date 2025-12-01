import { Expose } from 'class-transformer';

export class NotificationPreferencesResponseDto {
    @Expose()
    id: string;

    @Expose()
    userId: string;

    // Email notification preferences
    @Expose()
    emailAccountActivity: boolean;

    @Expose()
    emailSecurityAlerts: boolean;

    @Expose()
    emailMarketing: boolean;

    @Expose()
    emailWeeklyDigest: boolean;

    // In-app notification preferences
    @Expose()
    inAppSystem: boolean;

    @Expose()
    inAppProjects: boolean;

    @Expose()
    inAppMentions: boolean;

    // Push notification preferences
    @Expose()
    pushEnabled: boolean;

    @Expose()
    pushBrowser: boolean;

    @Expose()
    pushMobile: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

