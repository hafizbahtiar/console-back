import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config/config.interface';
import { CronJob } from 'cron';

/**
 * Cron Job Execution History
 */
export interface CronJobExecution {
    jobName: string;
    executedAt: Date;
    success: boolean;
    error?: string;
    duration?: number;
}

/**
 * Cron Job Status
 */
export interface CronJobStatus {
    name: string;
    cronExpression: string;
    enabled: boolean;
    lastExecution?: Date;
    nextExecution?: Date;
    executionCount: number;
    successCount: number;
    failureCount: number;
    lastError?: string;
    lastDuration?: number;
}

/**
 * Cron Job Tracker Service
 * 
 * Tracks cron job executions and provides status information.
 * This service maintains execution history in memory.
 */
@Injectable()
export class CronJobTrackerService implements OnModuleInit {
    private readonly logger = new Logger(CronJobTrackerService.name);
    private readonly executionHistory: Map<string, CronJobExecution[]> = new Map();
    private readonly jobStatus: Map<string, CronJobStatus> = new Map();

    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly configService: ConfigService<Config>,
    ) { }

    onModuleInit() {
        this.initializeJobStatus();
    }

    /**
     * Initialize job status from registered cron jobs
     */
    private initializeJobStatus() {
        try {
            const cronJobs = this.schedulerRegistry.getCronJobs();
            const schedulerConfig = this.configService.get('scheduler', { infer: true });

            cronJobs.forEach((job, name) => {
                const cronExpression = this.getCronExpression(job);
                const enabled = this.isJobEnabled(name, schedulerConfig);

                this.jobStatus.set(name, {
                    name,
                    cronExpression,
                    enabled,
                    executionCount: 0,
                    successCount: 0,
                    failureCount: 0,
                });

                // Initialize execution history
                this.executionHistory.set(name, []);
            });

            this.logger.log(`Initialized ${this.jobStatus.size} cron job(s) for tracking`);
        } catch (error) {
            this.logger.error('Failed to initialize cron job status', error);
        }
    }

    /**
     * Get cron expression from CronJob instance
     */
    private getCronExpression(job: CronJob): string {
        // CronJob has a cronTime property that contains the cron expression
        const cronTime = (job as any).cronTime;
        if (typeof cronTime === 'string') {
            return cronTime;
        }
        if (cronTime?.source) {
            return cronTime.source;
        }
        return 'Unknown';
    }

    /**
     * Check if a job is enabled based on config
     */
    private isJobEnabled(jobName: string, schedulerConfig: any): boolean {
        const jobConfigMap: Record<string, string> = {
            'sample-cron-job': 'sampleJob.enabled',
            'session-cleanup': 'sessionCleanup.enabled',
            'email-queue-monitoring': 'emailQueueMonitoring.enabled',
            'account-deletion-token-cleanup': 'accountDeletionTokenCleanup.enabled',
            'database-maintenance': 'databaseMaintenance.enabled',
        };

        const configPath = jobConfigMap[jobName];
        if (!configPath) {
            return true; // Default to enabled if not configured
        }

        const parts = configPath.split('.');
        let value = schedulerConfig;
        for (const part of parts) {
            value = value?.[part];
        }

        return value ?? true; // Default to enabled
    }

    /**
     * Record a cron job execution
     */
    recordExecution(jobName: string, success: boolean, error?: string, duration?: number) {
        const execution: CronJobExecution = {
            jobName,
            executedAt: new Date(),
            success,
            error,
            duration,
        };

        // Add to history (keep last 100 executions per job)
        const history = this.executionHistory.get(jobName) || [];
        history.push(execution);
        if (history.length > 100) {
            history.shift(); // Remove oldest
        }
        this.executionHistory.set(jobName, history);

        // Update status
        const status = this.jobStatus.get(jobName);
        if (status) {
            status.executionCount++;
            if (success) {
                status.successCount++;
            } else {
                status.failureCount++;
            }
            status.lastExecution = execution.executedAt;
            status.lastError = error;
            status.lastDuration = duration;
            status.nextExecution = this.calculateNextExecution(status.cronExpression);
        }
    }

    /**
     * Calculate next execution time from cron expression
     */
    private calculateNextExecution(cronExpression: string): Date | undefined {
        try {
            const cronJobs = this.schedulerRegistry.getCronJobs();

            // Try to find job by matching cron expression
            for (const [name, cronJob] of cronJobs.entries()) {
                const jobCronExpression = this.getCronExpression(cronJob);
                if (jobCronExpression === cronExpression) {
                    try {
                        // CronJob has a nextDates() method that returns the next execution time
                        const cronJobInstance = cronJob as any;
                        if (typeof cronJobInstance.nextDates === 'function') {
                            const nextDate = cronJobInstance.nextDates();
                            if (nextDate) {
                                return new Date(nextDate);
                            }
                        }
                    } catch (err) {
                        this.logger.debug(`Failed to get next date for job ${name}`, err);
                    }
                }
            }
        } catch (error) {
            this.logger.debug(`Failed to calculate next execution for ${cronExpression}`, error);
        }
        return undefined;
    }

    /**
     * Get all cron job statuses
     */
    getAllJobStatuses(): CronJobStatus[] {
        const statuses: CronJobStatus[] = [];

        this.jobStatus.forEach((status) => {
            // Update next execution time
            status.nextExecution = this.calculateNextExecution(status.cronExpression);
            statuses.push({ ...status });
        });

        return statuses;
    }

    /**
     * Get status for a specific job
     */
    getJobStatus(jobName: string): CronJobStatus | undefined {
        const status = this.jobStatus.get(jobName);
        if (status) {
            status.nextExecution = this.calculateNextExecution(status.cronExpression);
        }
        return status;
    }

    /**
     * Get execution history for a job
     */
    getJobHistory(jobName: string, limit: number = 50): CronJobExecution[] {
        const history = this.executionHistory.get(jobName) || [];
        return history.slice(-limit).reverse(); // Return most recent first
    }

    /**
     * Get all execution history
     */
    getAllJobHistory(limit: number = 50): Record<string, CronJobExecution[]> {
        const result: Record<string, CronJobExecution[]> = {};
        this.executionHistory.forEach((history, jobName) => {
            result[jobName] = history.slice(-limit).reverse();
        });
        return result;
    }
}

