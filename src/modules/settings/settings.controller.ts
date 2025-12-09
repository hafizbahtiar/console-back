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
import { SettingsService } from './settings.service';
import { PreferencesService } from './services/preferences.service';
import { CurrencyPreferencesService } from './services/currency-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesResponseDto } from './dto/preferences-response.dto';
import { UpdateCurrencyPreferencesDto, CurrencyPreferencesResponseDto, SupportedCurrenciesResponseDto } from './dto/currency-preferences.dto';
import { successResponse } from '../../common/responses/response.util';
import { SuccessResponse } from '../../common/responses/response.interface';
import { plainToInstance } from 'class-transformer';

/**
 * Settings Controller
 * 
 * Provides a unified settings API endpoint.
 * Most settings operations are handled by their respective modules:
 * - Profile: /users/profile
 * - Password: /auth/change-password
 * - Sessions: /sessions
 * - Account: /users/account/*
 * - Preferences: /settings/preferences (this controller)
 */
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly preferencesService: PreferencesService,
        private readonly currencyPreferencesService: CurrencyPreferencesService,
    ) { }

    /**
     * Get settings overview
     * Returns a summary of user settings
     */
    @Get()
    async getSettings(@GetUser() user: any): Promise<SuccessResponse<{ message: string }>> {
        // This endpoint can be extended to return settings summary
        return successResponse(
            { message: 'Settings endpoints available' },
            'Settings retrieved successfully',
        );
    }

    /**
     * Get user preferences
     * Returns user's app preferences, creating defaults if they don't exist
     */
    @Get('preferences')
    async getPreferences(
        @GetUser() user: any,
    ): Promise<SuccessResponse<PreferencesResponseDto>> {
        const preferences = await this.preferencesService.getPreferences(user.userId);
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;

        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            theme: preferencesDoc.theme,
            language: preferencesDoc.language,
            dateFormat: preferencesDoc.dateFormat,
            timeFormat: preferencesDoc.timeFormat,
            timezone: preferencesDoc.timezone,
            defaultDashboardView: preferencesDoc.defaultDashboardView,
            itemsPerPage: preferencesDoc.itemsPerPage,
            showWidgets: preferencesDoc.showWidgets,
            editorTheme: preferencesDoc.editorTheme,
            editorFontSize: preferencesDoc.editorFontSize,
            editorLineHeight: preferencesDoc.editorLineHeight,
            editorTabSize: preferencesDoc.editorTabSize,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };

        const preferencesDto = plainToInstance(PreferencesResponseDto, preferencesData);
        return successResponse(preferencesDto, 'Preferences retrieved successfully');
    }

    /**
     * Update user preferences
     * Updates user's app preferences
     */
    @Patch('preferences')
    @HttpCode(HttpStatus.OK)
    async updatePreferences(
        @GetUser() user: any,
        @Body() updateDto: UpdatePreferencesDto,
    ): Promise<SuccessResponse<PreferencesResponseDto>> {
        const preferences = await this.preferencesService.updatePreferences(
            user.userId,
            updateDto,
        );
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;

        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            theme: preferencesDoc.theme,
            language: preferencesDoc.language,
            dateFormat: preferencesDoc.dateFormat,
            timeFormat: preferencesDoc.timeFormat,
            timezone: preferencesDoc.timezone,
            defaultDashboardView: preferencesDoc.defaultDashboardView,
            itemsPerPage: preferencesDoc.itemsPerPage,
            showWidgets: preferencesDoc.showWidgets,
            editorTheme: preferencesDoc.editorTheme,
            editorFontSize: preferencesDoc.editorFontSize,
            editorLineHeight: preferencesDoc.editorLineHeight,
            editorTabSize: preferencesDoc.editorTabSize,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };

        const preferencesDto = plainToInstance(PreferencesResponseDto, preferencesData);
        return successResponse(preferencesDto, 'Preferences updated successfully');
    }

    /**
     * Reset preferences to defaults
     */
    @Post('preferences/reset')
    @HttpCode(HttpStatus.OK)
    async resetPreferences(
        @GetUser() user: any,
    ): Promise<SuccessResponse<PreferencesResponseDto>> {
        const preferences = await this.preferencesService.resetPreferences(user.userId);
        const preferencesDoc = preferences.toObject ? preferences.toObject() : preferences;

        const preferencesData = {
            id: preferencesDoc._id.toString(),
            userId: preferencesDoc.userId.toString(),
            theme: preferencesDoc.theme,
            language: preferencesDoc.language,
            dateFormat: preferencesDoc.dateFormat,
            timeFormat: preferencesDoc.timeFormat,
            timezone: preferencesDoc.timezone,
            defaultDashboardView: preferencesDoc.defaultDashboardView,
            itemsPerPage: preferencesDoc.itemsPerPage,
            showWidgets: preferencesDoc.showWidgets,
            editorTheme: preferencesDoc.editorTheme,
            editorFontSize: preferencesDoc.editorFontSize,
            editorLineHeight: preferencesDoc.editorLineHeight,
            editorTabSize: preferencesDoc.editorTabSize,
            createdAt: preferencesDoc.createdAt,
            updatedAt: preferencesDoc.updatedAt,
        };

        const preferencesDto = plainToInstance(PreferencesResponseDto, preferencesData);
        return successResponse(preferencesDto, 'Preferences reset to defaults successfully');
    }

    /**
     * Get user's currency preferences
     * Returns base currency and supported currencies
     */
    @Get('currency')
    async getCurrencyPreferences(
        @GetUser() user: any,
    ): Promise<SuccessResponse<CurrencyPreferencesResponseDto>> {
        const preferences = await this.currencyPreferencesService.getCurrencyPreferences(user.userId);
        return successResponse(preferences, 'Currency preferences retrieved successfully');
    }

    /**
     * Update user's currency preferences
     * Updates base currency and/or supported currencies
     */
    @Patch('currency')
    @HttpCode(HttpStatus.OK)
    async updateCurrencyPreferences(
        @GetUser() user: any,
        @Body() updateDto: UpdateCurrencyPreferencesDto,
    ): Promise<SuccessResponse<CurrencyPreferencesResponseDto>> {
        const preferences = await this.currencyPreferencesService.updateCurrencyPreferences(
            user.userId,
            updateDto,
        );
        return successResponse(preferences, 'Currency preferences updated successfully');
    }

    /**
     * Get list of supported currencies (system-wide)
     * Returns all available currency codes with names and symbols
     */
    @Get('currencies')
    async getSupportedCurrencies(): Promise<SuccessResponse<SupportedCurrenciesResponseDto>> {
        const currencies = await this.currencyPreferencesService.getSupportedCurrencies();
        return successResponse(currencies, 'Supported currencies retrieved successfully');
    }
}

