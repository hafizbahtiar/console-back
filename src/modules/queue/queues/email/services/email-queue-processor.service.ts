import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { QueueNames } from '../../../constants/queue-names.constant';
import { EmailJobData, EmailJobType } from '../interfaces/email-job-data.interface';
import type { EmailJobResult } from '../interfaces/email-job-result.interface';

/**
 * Email Queue Processor
 * 
 * Processes email jobs from the queue and sends them via SMTP.
 * This service handles the actual email sending logic.
 */
@Processor(QueueNames.EMAIL)
@Injectable()
export class EmailQueueProcessorService {
    private readonly logger = new Logger(EmailQueueProcessorService.name);
    private transporter: Transporter;

    constructor(private readonly configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const emailConfig = this.configService.get('email', { infer: true });

        // In development, use console logging if SMTP not configured
        if (process.env.NODE_ENV === 'development' && !emailConfig?.smtp?.host) {
            this.logger.warn(
                'SMTP not configured. Emails will be logged to console in development.',
            );
            return;
        }

        // Create transporter
        this.transporter = nodemailer.createTransport({
            host: emailConfig?.smtp?.host,
            port: emailConfig?.smtp?.port || 587,
            secure: emailConfig?.smtp?.secure || false,
            auth: {
                user: emailConfig?.smtp?.user,
                pass: emailConfig?.smtp?.password,
            },
        });

        // Verify connection in production
        if (process.env.NODE_ENV === 'production') {
            this.transporter.verify((error) => {
                if (error) {
                    this.logger.error('SMTP connection failed', error);
                } else {
                    this.logger.log('SMTP connection verified');
                }
            });
        }
    }

    /**
     * Process email job
     */
    @Process()
    async processEmailJob(job: Job<EmailJobData>): Promise<EmailJobResult> {
        const { data } = job;
        const emailConfig = this.configService.get('email', { infer: true });
        const from = emailConfig?.from || 'noreply@console.app';

        this.logger.log(`Processing email job: ${data.type} to ${data.to} (Job ID: ${job.id})`);

        // In development without SMTP, just log
        if (process.env.NODE_ENV === 'development' && !this.transporter) {
            this.logger.log('📧 Email (Development - not sent):', {
                to: data.to,
                subject: data.subject,
                type: data.type,
                html: data.html.substring(0, 200) + '...',
            });

            return {
                success: true,
                timestamp: new Date(),
            };
        }

        try {
            const info = await this.transporter.sendMail({
                from,
                to: data.to,
                subject: data.subject,
                html: data.html,
                text: data.text || this.htmlToText(data.html),
            });

            this.logger.log(
                `✅ Email sent successfully: ${data.type} to ${data.to} (Job ID: ${job.id}, Message ID: ${info.messageId})`,
            );

            return {
                success: true,
                messageId: info.messageId,
                timestamp: new Date(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `❌ Failed to send email: ${data.type} to ${data.to} (Job ID: ${job.id})`,
                errorMessage,
            );

            // Re-throw to trigger Bull's retry mechanism
            throw error;
        }
    }

    /**
     * Log when a job becomes active
     */
    @OnQueueActive()
    onActive(job: Job<EmailJobData>) {
        this.logger.debug(
            `Email job ${job.id} (${job.data.type}) is now active - processing...`,
        );
    }

    /**
     * Log when a job completes successfully
     */
    @OnQueueCompleted()
    onCompleted(job: Job<EmailJobData>, result: EmailJobResult) {
        this.logger.log(
            `✅ Email job ${job.id} (${job.data.type}) completed successfully in ${job.processedOn && job.timestamp ? job.processedOn - job.timestamp : 'unknown'}ms`,
        );
    }

    /**
     * Log when a job fails (after all retries exhausted)
     */
    @OnQueueFailed()
    onFailed(job: Job<EmailJobData>, error: Error) {
        this.logger.error(
            `❌ Email job ${job.id} (${job.data.type}) failed after ${job.attemptsMade} attempts: ${error.message}`,
            error.stack,
        );
    }

    /**
     * Convert HTML to plain text
     */
    private htmlToText(html: string): string {
        return html
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }
}

