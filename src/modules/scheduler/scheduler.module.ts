import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './services/scheduler.service';
import { SessionsModule } from '../sessions/sessions.module';
import { AccountsModule } from '../accounts/accounts.module';
import { EmailQueueModule } from '../queue/queues/email/email-queue.module';
import { AdminModule } from '../admin/admin.module';

/**
 * Scheduler Module
 * 
 * Provides scheduled tasks (cron jobs) for the application.
 * This module uses @nestjs/schedule for task scheduling.
 */
@Module({
    imports: [
        ConfigModule,
        // ScheduleModule must be imported to enable cron jobs
        ScheduleModule.forRoot(),
        // Import modules needed for cron jobs
        SessionsModule,
        AccountsModule,
        EmailQueueModule,
        // Import AdminModule to access CronJobTrackerService
        forwardRef(() => AdminModule),
    ],
    providers: [SchedulerService],
    exports: [SchedulerService],
})
export class SchedulerModule { }

