import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { QueueNames } from '../../../constants/queue-names.constant';
import type { EmailJobData } from '../interfaces/email-job-data.interface';

/**
 * Email Queue Producer Service
 * 
 * Adds email jobs to the queue for asynchronous processing.
 * This service is used by the EmailService to queue emails instead of sending them directly.
 */
@Injectable()
export class EmailQueueProducerService {
    private readonly logger = new Logger(EmailQueueProducerService.name);

    constructor(
        @InjectQueue(QueueNames.EMAIL)
        private readonly emailQueue: Queue<EmailJobData>,
    ) { }

    /**
     * Add an email job to the queue
     */
    async addEmailJob(data: EmailJobData, options?: { priority?: number; delay?: number }): Promise<void> {
        try {
            const job = await this.emailQueue.add(data, {
                priority: options?.priority || 0,
                delay: options?.delay || 0,
            });

            this.logger.log(
                `📧 Email job queued: ${data.type} to ${data.to} (Job ID: ${job.id})`,
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Failed to queue email job: ${data.type} to ${data.to}`,
                errorMessage,
            );
            throw error;
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.emailQueue.getWaitingCount(),
            this.emailQueue.getActiveCount(),
            this.emailQueue.getCompletedCount(),
            this.emailQueue.getFailedCount(),
            this.emailQueue.getDelayedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        };
    }
}

