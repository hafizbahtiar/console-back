import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Preferences, PreferencesDocument } from '../schemas/preferences.schema';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
    private readonly logger = new Logger(PreferencesService.name);

    constructor(
        @InjectModel(Preferences.name)
        private preferencesModel: Model<PreferencesDocument>,
    ) { }

    /**
     * Get user preferences, creating default if they don't exist
     */
    async getPreferences(userId: string): Promise<PreferencesDocument> {
        const userObjectId = new Types.ObjectId(userId);

        let preferences = await this.preferencesModel
            .findOne({ userId: userObjectId })
            .exec();

        if (!preferences) {
            // Create default preferences
            preferences = new this.preferencesModel({
                userId: userObjectId,
            });
            await preferences.save();
            this.logger.log(`Created default preferences for user ${userId}`);
        }

        return preferences;
    }

    /**
     * Update user preferences
     */
    async updatePreferences(
        userId: string,
        updateDto: UpdatePreferencesDto,
    ): Promise<PreferencesDocument> {
        const userObjectId = new Types.ObjectId(userId);

        // Get or create preferences
        let preferences = await this.preferencesModel
            .findOne({ userId: userObjectId })
            .exec();

        if (!preferences) {
            preferences = new this.preferencesModel({
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
        this.logger.log(`Updated preferences for user ${userId}`);

        return savedPreferences;
    }

    /**
     * Reset preferences to defaults
     */
    async resetPreferences(userId: string): Promise<PreferencesDocument> {
        const userObjectId = new Types.ObjectId(userId);

        const preferences = await this.preferencesModel
            .findOneAndUpdate(
                { userId: userObjectId },
                {
                    theme: 'system',
                    language: 'en',
                    dateFormat: 'MM/DD/YYYY',
                    timeFormat: '12h',
                    timezone: 'UTC',
                    defaultDashboardView: 'grid',
                    itemsPerPage: '20',
                    showWidgets: true,
                    editorTheme: 'dark',
                    editorFontSize: 14,
                    editorLineHeight: 1.5,
                    editorTabSize: 4,
                },
                { new: true, upsert: true },
            )
            .exec();

        this.logger.log(`Reset preferences to defaults for user ${userId}`);
        return preferences;
    }

    /**
     * Delete preferences (when user is deleted)
     */
    async deletePreferences(userId: string): Promise<void> {
        const userObjectId = new Types.ObjectId(userId);
        await this.preferencesModel.deleteOne({ userId: userObjectId }).exec();
        this.logger.log(`Deleted preferences for user ${userId}`);
    }
}

