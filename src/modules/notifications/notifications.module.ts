import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { NotificationPreferences, NotificationPreferencesSchema } from './schemas/notification-preferences.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: NotificationPreferences.name, schema: NotificationPreferencesSchema },
        ]),
        PassportModule,
        AuthModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationPreferencesService],
    exports: [NotificationPreferencesService], // Export for use in other modules (e.g., email service)
})
export class NotificationsModule { }

