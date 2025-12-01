import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { TemplateService } from './services/template.service';
import { EmailQueueModule } from '../queue/queues/email/email-queue.module';

@Module({
    imports: [EmailQueueModule],
    providers: [EmailService, TemplateService],
    exports: [EmailService, TemplateService],
})
export class EmailModule { }
