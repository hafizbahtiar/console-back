import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailQueueProcessorService } from './services/email-queue-processor.service';
import { EmailQueueProducerService } from './services/email-queue-producer.service';

/**
 * Email Queue Module
 * 
 * Registers the email queue processor and producer services.
 * This module should be imported by the QueueModule.
 * 
 * Note: EmailQueueProcessorService doesn't need EmailModule because
 * it only sends already-rendered HTML (templates are rendered in EmailService).
 */
@Module({
    imports: [ConfigModule],
    providers: [EmailQueueProcessorService, EmailQueueProducerService],
    exports: [EmailQueueProducerService],
})
export class EmailQueueModule { }

