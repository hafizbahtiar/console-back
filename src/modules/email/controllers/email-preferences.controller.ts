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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { EmailPreferencesService } from '../services/email-preferences.service';
import { UpdateEmailPreferencesDto } from '../dto/update-email-preferences.dto';
import { EmailPreferencesResponseDto } from '../dto/email-preferences-response.dto';

/**
 * Email Preferences Controller
 * 
 * Handles email preference management endpoints.
 * All endpoints require authentication.
 */
@Controller('email/preferences')
@UseGuards(JwtAuthGuard)
export class EmailPreferencesController {
    constructor(
        private readonly emailPreferencesService: EmailPreferencesService,
    ) { }

    /**
     * Get current user's email preferences
     * GET /api/v1/email/preferences
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async getPreferences(
        @GetUser() user: any,
    ): Promise<EmailPreferencesResponseDto> {
        const preferences = await this.emailPreferencesService.getPreferences(user.userId);
        return preferences;
    }

    /**
     * Update current user's email preferences
     * PATCH /api/v1/email/preferences
     */
    @Patch()
    @HttpCode(HttpStatus.OK)
    async updatePreferences(
        @GetUser() user: any,
        @Body() updateDto: UpdateEmailPreferencesDto,
    ): Promise<EmailPreferencesResponseDto> {
        const preferences = await this.emailPreferencesService.updatePreferences(
            user.userId,
            updateDto,
        );
        return preferences;
    }

    /**
     * Reset email preferences to defaults
     * POST /api/v1/email/preferences/reset
     */
    @Post('reset')
    @HttpCode(HttpStatus.OK)
    async resetPreferences(
        @GetUser() user: any,
    ): Promise<EmailPreferencesResponseDto> {
        const preferences = await this.emailPreferencesService.resetPreferences(user.userId);
        return preferences;
    }
}

