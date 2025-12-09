import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EmailService } from './services/email.service';
import { TemplateService } from './services/template.service';
import { EmailPreferencesService } from './services/email-preferences.service';
import { EmailQueueModule } from '../queue/queues/email/email-queue.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { EmailPreferencesController } from './controllers/email-preferences.controller';

@Module({
    imports: [
        EmailQueueModule,
        forwardRef(() => NotificationsModule), // Use forwardRef to break circular dependency with AuthModule
        PassportModule,
        forwardRef(() => AuthModule), // Use forwardRef to break circular dependency
    ],
    providers: [EmailService, TemplateService, EmailPreferencesService],
    controllers: [EmailPreferencesController],
    exports: [EmailService, TemplateService, EmailPreferencesService],
})
export class EmailModule { }
