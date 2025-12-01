import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    NotificationPreferences,
    NotificationPreferencesDocument,
} from '../schemas/notification-preferences.schema';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';

@Injectable()
export class NotificationPreferencesService {
    private readonly logger = new Logger(NotificationPreferencesService.name);

    constructor(
        @InjectModel(NotificationPreferences.name)
        private notificationPreferencesModel: Model<NotificationPreferencesDocument>,
    ) { }

    /**
     * Get user notification preferences, creating default if they don't exist
     */
    async getPreferences(userId: string): Promise<NotificationPreferencesDocument> {
        const userObjectId = new Types.ObjectId(userId);

        let preferences = await this.notificationPreferencesModel
            .findOne({ userId: userObjectId })
            .exec();

        if (!preferences) {
            // Create default preferences
            preferences = new this.notificationPreferencesModel({
                userId: userObjectId,
            });
            await preferences.save();
            this.logger.log(`Created default notification preferences for user ${userId}`);
        }

        return preferences;
    }

    /**
     * Update user notification preferences
     */
    async updatePreferences(
        userId: string,
        updateDto: UpdateNotificationPreferencesDto,
    ): Promise<NotificationPreferencesDocument> {
        const userObjectId = new Types.ObjectId(userId);

        // Get or create preferences
        let preferences = await this.notificationPreferencesModel
            .findOne({ userId: userObjectId })
            .exec();

        if (!preferences) {
            preferences = new this.notificationPreferencesModel({
                userId: userObjectId,
                ...updateDto,
            });
        } else {
            // Update only provided fields
            Object.keys(updateDto).forEach((key) => {
                if (updateDto[key] !== undefined) {
                    (preferences as any)[key] = updateDto[key];
                }
            });
        }

        const savedPreferences = await preferences.save();
        this.logger.log(`Updated notification preferences for user ${userId}`);

        return savedPreferences;
    }

    /**
     * Reset notification preferences to defaults
     */
    async resetPreferences(userId: string): Promise<NotificationPreferencesDocument> {
        const userObjectId = new Types.ObjectId(userId);

        const preferences = await this.notificationPreferencesModel
            .findOneAndUpdate(
                { userId: userObjectId },
                {
                    emailAccountActivity: true,
                    emailSecurityAlerts: true,
                    emailMarketing: false,
                    emailWeeklyDigest: false,
                    inAppSystem: true,
                    inAppProjects: true,
                    inAppMentions: true,
                    pushEnabled: false,
                    pushBrowser: true,
                    pushMobile: false,
                },
                { new: true, upsert: true },
            )
            .exec();

        this.logger.log(`Reset notification preferences to defaults for user ${userId}`);
        return preferences;
    }

    /**
     * Delete notification preferences (when user is deleted)
     */
    async deletePreferences(userId: string): Promise<void> {
        const userObjectId = new Types.ObjectId(userId);
        await this.notificationPreferencesModel.deleteOne({ userId: userObjectId }).exec();
        this.logger.log(`Deleted notification preferences for user ${userId}`);
    }

    /**
     * Check if user wants to receive a specific type of notification
     */
    async shouldSendEmail(userId: string, type: 'accountActivity' | 'securityAlerts' | 'marketing' | 'weeklyDigest'): Promise<boolean> {
        const preferences = await this.getPreferences(userId);

        switch (type) {
            case 'accountActivity':
                return preferences.emailAccountActivity;
            case 'securityAlerts':
                return preferences.emailSecurityAlerts;
            case 'marketing':
                return preferences.emailMarketing;
            case 'weeklyDigest':
                return preferences.emailWeeklyDigest;
            default:
                return false;
        }
    }

    /**
     * Check if user wants to receive in-app notifications
     */
    async shouldShowInApp(userId: string, type: 'system' | 'projects' | 'mentions'): Promise<boolean> {
        const preferences = await this.getPreferences(userId);

        switch (type) {
            case 'system':
                return preferences.inAppSystem;
            case 'projects':
                return preferences.inAppProjects;
            case 'mentions':
                return preferences.inAppMentions;
            default:
                return false;
        }
    }
}

