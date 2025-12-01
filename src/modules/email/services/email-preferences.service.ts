import { Injectable, Logger } from '@nestjs/common';
import { NotificationPreferencesService } from '../../notifications/services/notification-preferences.service';
import { UpdateEmailPreferencesDto } from '../dto/update-email-preferences.dto';
import { EmailPreferencesResponseDto } from '../dto/email-preferences-response.dto';
import { plainToInstance } from 'class-transformer';
import { NotificationPreferencesDocument } from '../../notifications/schemas/notification-preferences.schema';

/**
 * Email Preferences Service
 * 
 * Wraps NotificationPreferencesService to provide email-specific functionality.
 * Reuses the existing NotificationPreferences schema but only exposes email-related fields.
 */
@Injectable()
export class EmailPreferencesService {
    private readonly logger = new Logger(EmailPreferencesService.name);

    constructor(
        private readonly notificationPreferencesService: NotificationPreferencesService,
    ) { }

    /**
     * Get user email preferences
     */
    async getPreferences(userId: string): Promise<EmailPreferencesResponseDto> {
        const preferences = await this.notificationPreferencesService.getPreferences(userId);
        return this.toEmailPreferencesDto(preferences);
    }

    /**
     * Update user email preferences
     */
    async updatePreferences(
        userId: string,
        updateDto: UpdateEmailPreferencesDto,
    ): Promise<EmailPreferencesResponseDto> {
        // Convert email-specific DTO to notification preferences DTO
        const notificationUpdateDto = {
            emailAccountActivity: updateDto.emailAccountActivity,
            emailSecurityAlerts: updateDto.emailSecurityAlerts,
            emailMarketing: updateDto.emailMarketing,
            emailWeeklyDigest: updateDto.emailWeeklyDigest,
        };

        const preferences = await this.notificationPreferencesService.updatePreferences(
            userId,
            notificationUpdateDto,
        );

        return this.toEmailPreferencesDto(preferences);
    }

    /**
     * Reset email preferences to defaults
     */
    async resetPreferences(userId: string): Promise<EmailPreferencesResponseDto> {
        const preferences = await this.notificationPreferencesService.resetPreferences(userId);
        return this.toEmailPreferencesDto(preferences);
    }

    /**
     * Check if user wants to receive a specific type of email
     */
    async shouldSendEmail(
        userId: string,
        type: 'accountActivity' | 'securityAlerts' | 'marketing' | 'weeklyDigest',
    ): Promise<boolean> {
        return this.notificationPreferencesService.shouldSendEmail(userId, type);
    }

    /**
     * Convert NotificationPreferencesDocument to EmailPreferencesResponseDto
     */
    private toEmailPreferencesDto(
        preferences: NotificationPreferencesDocument,
    ): EmailPreferencesResponseDto {
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;
        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            emailAccountActivity: preferencesDoc.emailAccountActivity,
            emailSecurityAlerts: preferencesDoc.emailSecurityAlerts,
            emailMarketing: preferencesDoc.emailMarketing,
            emailWeeklyDigest: preferencesDoc.emailWeeklyDigest,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };
        return plainToInstance(EmailPreferencesResponseDto, preferencesData, {
            excludeExtraneousValues: true,
        });
    }
}

