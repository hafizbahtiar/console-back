/**
 * Settings Response DTOs
 * 
 * DTOs for settings-related responses
 */

export class SettingsSummaryDto {
    profileUpdated?: Date;
    passwordChanged?: Date;
    activeSessions?: number;
    emailVerified?: boolean;
}

