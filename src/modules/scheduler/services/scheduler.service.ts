import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionsService } from '../../sessions/sessions.service';
import { AccountsService } from '../../accounts/accounts.service';
import { EmailQueueProducerService } from '../../queue/queues/email/services/email-queue-producer.service';
import { CronJobTrackerService } from '../../admin/services/cron-job-tracker.service';
import { Config } from '../../../config/config.interface';

/**
 * Scheduler Service
 * 
 * Contains all scheduled tasks (cron jobs) for the application.
 * 
 * Cron Expression Examples:
 * - CronExpression.EVERY_SECOND - Every second
 * - CronExpression.EVERY_5_SECONDS - Every 5 seconds
 * - CronExpression.EVERY_MINUTE - Every minute
 * - CronExpression.EVERY_5_MINUTES - Every 5 minutes
 * - CronExpression.EVERY_HOUR - Every hour
 * - CronExpression.EVERY_DAY_AT_MIDNIGHT - Every day at midnight
 * - '0 0 * * *' - Custom cron expression (every day at midnight)
 * 
 * Custom Cron Format:
 * * * * * * *
 * | | | | | |
 * | | | | | day of week
 * | | | | month
 * | | | day of month
 * | | hour
 * | minute
 * second (optional)
 */
@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);
    private readonly configService: ConfigService<Config>;

    constructor(
        configService: ConfigService<Config>,
        private readonly sessionsService: SessionsService,
        private readonly accountsService: AccountsService,
        private readonly emailQueueProducer: EmailQueueProducerService,
        @Inject(forwardRef(() => CronJobTrackerService))
        private readonly cronJobTracker?: CronJobTrackerService,
    ) {
        this.configService = configService;
    }

    /**
     * Sample cron job - runs every 5 minutes
     * Can be disabled via environment variable
     */
    @Cron(CronExpression.EVERY_5_MINUTES, {
        name: 'sample-cron-job',
    })
    async handleSampleCronJob() {
        const startTime = Date.now();
        const schedulerConfig = this.configService.get('scheduler', { infer: true });
        const enabled = schedulerConfig?.sampleJob?.enabled ?? true;
        if (!enabled) {
            return;
        }

        try {
            this.logger.debug('Sample cron job executed - runs every 5 minutes');
            // Add your logic here
            const duration = Date.now() - startTime;
            this.cronJobTracker?.recordExecution('sample-cron-job', true, undefined, duration);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const duration = Date.now() - startTime;
            this.cronJobTracker?.recordExecution('sample-cron-job', false, errorMessage, duration);
            throw error;
        }
    }

    /**
     * Session cleanup cron job - removes expired sessions
     * Runs every hour by default, configurable via environment variable
     */
    @Cron(CronExpression.EVERY_HOUR, {
        name: 'session-cleanup',
    })
    async handleSessionCleanup() {
        const startTime = Date.now();
        const schedulerConfig = this.configService.get('scheduler', { infer: true });
        const enabled = schedulerConfig?.sessionCleanup?.enabled ?? true;
        if (!enabled) {
            return;
        }

        try {
            this.logger.log('Starting session cleanup job...');
            const deletedCount = await this.sessionsService.cleanupExpired();
            this.logger.log(`Session cleanup completed: ${deletedCount} expired sessions removed`);
            const duration = Date.now() - startTime;
            this.cronJobTracker?.recordExecution('session-cleanup', true, undefined, duration);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const duration = Date.now() - startTime;
            this.logger.error(`Session cleanup job failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            this.cronJobTracker?.recordExecution('session-cleanup', false, errorMessage, duration);
        }
    }

    /**
     * Email queue monitoring cron job
     * Monitors email queue statistics and logs warnings if queue is backing up
     * Runs every 10 minutes by default, configurable via environment variable
     */
    @Cron('*/10 * * * *', {
        name: 'email-queue-monitoring',
    })
    async handleEmailQueueMonitoring() {
        const startTime = Date.now();
        const schedulerConfig = this.configService.get('scheduler', { infer: true });
        const enabled = schedulerConfig?.emailQueueMonitoring?.enabled ?? true;
        if (!enabled) {
            return;
        }

        try {
            const stats = await this.emailQueueProducer.getQueueStats();
            const warningThreshold = schedulerConfig?.emailQueueMonitoring?.warningThreshold ?? 100;

            if (stats.waiting > warningThreshold) {
                this.logger.warn(
                    `Email queue is backing up: ${stats.waiting} jobs waiting, ${stats.active} active, ${stats.failed} failed`,
                );
            } else {
                this.logger.debug(
                    `Email queue status: ${stats.waiting} waiting, ${stats.active} active, ${stats.completed} completed, ${stats.failed} failed`,
                );
            }
            const duration = Date.now() - startTime;
            this.cronJobTracker?.recordExecution('email-queue-monitoring', true, undefined, duration);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const duration = Date.now() - startTime;
            this.logger.error(`Email queue monitoring job failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            this.cronJobTracker?.recordExecution('email-queue-monitoring', false, errorMessage, duration);
        }
    }

    /**
     * Account deletion token cleanup cron job
     * Removes expired account deletion tokens
     * Runs daily at midnight by default, configurable via environment variable
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
        name: 'account-deletion-token-cleanup',
    })
    async handleAccountDeletionTokenCleanup() {
        const startTime = Date.now();
        const schedulerConfig = this.configService.get('scheduler', { infer: true });
        const enabled = schedulerConfig?.accountDeletionTokenCleanup?.enabled ?? true;
        if (!enabled) {
            return;
        }

        try {
            this.logger.log('Starting account deletion token cleanup job...');
            const deletedCount = await this.accountsService.cleanupExpiredDeletionTokens();
            this.logger.log(`Account deletion token cleanup completed: ${deletedCount} expired tokens removed`);
            const duration = Date.now() - startTime;
            this.cronJobTracker?.recordExecution('account-deletion-token-cleanup', true, undefined, duration);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const duration = Date.now() - startTime;
            this.logger.error(`Account deletion token cleanup job failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            this.cronJobTracker?.recordExecution('account-deletion-token-cleanup', false, errorMessage, duration);
        }
    }

    /**
     * Database maintenance cron job (optional)
     * Can be used for database optimization, index rebuilding, etc.
     * Runs weekly on Sunday at 2 AM by default, configurable via environment variable
     */
    @Cron('0 2 * * 0', {
        name: 'database-maintenance',
    })
    async handleDatabaseMaintenance() {
        const startTime = Date.now();
        const schedulerConfig = this.configService.get('scheduler', { infer: true });
        const enabled = schedulerConfig?.databaseMaintenance?.enabled ?? false;
        if (!enabled) {
            return;
        }

        try {
            this.logger.log('Starting database maintenance job...');
            // Add database maintenance logic here (e.g., index optimization, statistics update)
            this.logger.log('Database maintenance completed');
            const duration = Date.now() - startTime;
            this.cronJobTracker?.recordExecution('database-maintenance', true, undefined, duration);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const duration = Date.now() - startTime;
            this.logger.error(`Database maintenance job failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            this.cronJobTracker?.recordExecution('database-maintenance', false, errorMessage, duration);
        }
    }

    /**
     * Example: Cron job that runs every day at midnight
     * Uncomment and customize as needed
     */
    // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    //     name: 'daily-cleanup',
    // })
    // async handleDailyCleanup() {
    //     this.logger.log('Daily cleanup job executed');
    //     // Add your logic here
    // }

    /**
     * Example: Custom cron expression (runs every hour at minute 0)
     * Uncomment and customize as needed
     */
    // @Cron('0 * * * *', {
    //     name: 'hourly-task',
    // })
    // async handleHourlyTask() {
    //     this.logger.log('Hourly task executed');
    //     // Add your logic here
    // }
}

