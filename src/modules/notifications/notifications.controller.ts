import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationPreferencesResponseDto } from './dto/notification-preferences-response.dto';
import { successResponse } from '../../common/responses/response.util';
import { SuccessResponse } from '../../common/responses/response.interface';
import { plainToInstance } from 'class-transformer';

/**
 * Notifications Controller
 * 
 * Handles notification preferences management
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationPreferencesService: NotificationPreferencesService,
    ) { }

    /**
     * Get user notification preferences
     * Returns user's notification preferences, creating defaults if they don't exist
     */
    @Get('preferences')
    async getPreferences(
        @GetUser() user: any,
    ): Promise<SuccessResponse<NotificationPreferencesResponseDto>> {
        const preferences = await this.notificationPreferencesService.getPreferences(user.userId);
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;

        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            emailAccountActivity: preferencesDoc.emailAccountActivity,
            emailSecurityAlerts: preferencesDoc.emailSecurityAlerts,
            emailMarketing: preferencesDoc.emailMarketing,
            emailWeeklyDigest: preferencesDoc.emailWeeklyDigest,
            inAppSystem: preferencesDoc.inAppSystem,
            inAppProjects: preferencesDoc.inAppProjects,
            inAppMentions: preferencesDoc.inAppMentions,
            pushEnabled: preferencesDoc.pushEnabled,
            pushBrowser: preferencesDoc.pushBrowser,
            pushMobile: preferencesDoc.pushMobile,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };

        const preferencesDto = plainToInstance(NotificationPreferencesResponseDto, preferencesData);
        return successResponse(preferencesDto, 'Notification preferences retrieved successfully');
    }

    /**
     * Update user notification preferences
     * Updates user's notification preferences
     */
    @Patch('preferences')
    @HttpCode(HttpStatus.OK)
    async updatePreferences(
        @GetUser() user: any,
        @Body() updateDto: UpdateNotificationPreferencesDto,
    ): Promise<SuccessResponse<NotificationPreferencesResponseDto>> {
        const preferences = await this.notificationPreferencesService.updatePreferences(
            user.userId,
            updateDto,
        );
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;

        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            emailAccountActivity: preferencesDoc.emailAccountActivity,
            emailSecurityAlerts: preferencesDoc.emailSecurityAlerts,
            emailMarketing: preferencesDoc.emailMarketing,
            emailWeeklyDigest: preferencesDoc.emailWeeklyDigest,
            inAppSystem: preferencesDoc.inAppSystem,
            inAppProjects: preferencesDoc.inAppProjects,
            inAppMentions: preferencesDoc.inAppMentions,
            pushEnabled: preferencesDoc.pushEnabled,
            pushBrowser: preferencesDoc.pushBrowser,
            pushMobile: preferencesDoc.pushMobile,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };

        const preferencesDto = plainToInstance(NotificationPreferencesResponseDto, preferencesData);
        return successResponse(preferencesDto, 'Notification preferences updated successfully');
    }

    /**
     * Reset notification preferences to defaults
     */
    @Post('preferences/reset')
    @HttpCode(HttpStatus.OK)
    async resetPreferences(
        @GetUser() user: any,
    ): Promise<SuccessResponse<NotificationPreferencesResponseDto>> {
        const preferences = await this.notificationPreferencesService.resetPreferences(user.userId);
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;

        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            emailAccountActivity: preferencesDoc.emailAccountActivity,
            emailSecurityAlerts: preferencesDoc.emailSecurityAlerts,
            emailMarketing: preferencesDoc.emailMarketing,
            emailWeeklyDigest: preferencesDoc.emailWeeklyDigest,
            inAppSystem: preferencesDoc.inAppSystem,
            inAppProjects: preferencesDoc.inAppProjects,
            inAppMentions: preferencesDoc.inAppMentions,
            pushEnabled: preferencesDoc.pushEnabled,
            pushBrowser: preferencesDoc.pushBrowser,
            pushMobile: preferencesDoc.pushMobile,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };

        const preferencesDto = plainToInstance(NotificationPreferencesResponseDto, preferencesData);
        return successResponse(preferencesDto, 'Notification preferences reset to defaults successfully');
    }
}

