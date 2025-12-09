import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PreferencesService } from './services/preferences.service';
import { CurrencyPreferencesService } from './services/currency-preferences.service';
import { Preferences, PreferencesSchema } from './schemas/preferences.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';

/**
 * Settings Module
 * 
 * Consolidates settings-related functionality including:
 * - Profile management
 * - Password management
 * - Session management
 * - Account management
 * - App preferences
 * 
 * Note: This module acts as a facade/orchestrator for settings operations.
 * The actual business logic remains in their respective modules (Users, Auth, Sessions).
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Preferences.name, schema: PreferencesSchema },
            { name: User.name, schema: UserSchema },
        ]),
        UsersModule,
        AuthModule,
        SessionsModule,
    ],
    controllers: [SettingsController],
    providers: [SettingsService, PreferencesService, CurrencyPreferencesService],
    exports: [SettingsService, PreferencesService, CurrencyPreferencesService],
})
export class SettingsModule { }

