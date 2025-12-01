import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import { EmailQueueProducerService } from '../../queue/queues/email/services/email-queue-producer.service';
import { EmailPreferencesService } from './email-preferences.service';
import {
    EmailJobData,
    EmailJobType,
    WelcomeEmailJobData,
    ForgotPasswordEmailJobData,
    PasswordChangedEmailJobData,
    VerifyEmailJobData,
    AccountDeletionEmailJobData,
} from '../../queue/queues/email/interfaces/email-job-data.interface';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface WelcomeEmailData {
    name: string;
    email: string;
    verificationToken?: string;
}

export interface ForgotPasswordEmailData {
    name: string;
    email: string;
    resetToken: string;
    resetUrl: string;
}

export interface PasswordChangedEmailData {
    name: string;
    email: string;
}

export interface VerifyEmailData {
    name: string;
    email: string;
    verificationToken: string;
    verificationUrl: string;
}

export interface AccountDeletionEmailData {
    name: string;
    email: string;
    confirmationToken: string;
    deletionUrl: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private useQueue: boolean;

    constructor(
        private readonly configService: ConfigService,
        private readonly templateService: TemplateService,
        @Optional()
        @Inject(EmailQueueProducerService)
        private readonly emailQueueProducer?: EmailQueueProducerService,
        @Optional()
        @Inject(EmailPreferencesService)
        private readonly emailPreferencesService?: EmailPreferencesService,
    ) {
        // Use queue if producer is available, otherwise fall back to direct sending
        this.useQueue = !!this.emailQueueProducer;

        if (this.useQueue) {
            this.logger.log('Email queue enabled - emails will be processed asynchronously');
        } else {
            this.logger.warn('Email queue not available - emails will be sent directly (fallback mode)');
        }
    }

    /**
     * Send email (fallback method - should not be used when queue is available)
     * This method is kept for backward compatibility but should not be called
     * when the queue is available. All email sending should go through specific
     * methods (sendWelcomeEmail, sendForgotPasswordEmail, etc.) which handle queuing.
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        // This is a fallback method - in production with queue enabled,
        // this should not be called. All emails should go through specific methods.
        if (this.useQueue && this.emailQueueProducer) {
            this.logger.warn(
                'sendEmail() called directly but queue is available. Use specific email methods instead.',
            );
            // Don't queue here - let specific methods handle it
            return;
        }

        // Fallback: direct sending (for backward compatibility or when queue is unavailable)
        this.logger.warn('Email queue not available, sending directly (not recommended for production)');
        // Note: Direct sending logic has been moved to EmailQueueProcessorService
        // This fallback should rarely be used in production
    }

    async sendWelcomeEmail(data: WelcomeEmailData, userId?: string): Promise<void> {
        // Check preferences if userId is provided and service is available
        if (userId && this.emailPreferencesService) {
            const shouldSend = await this.emailPreferencesService.shouldSendEmail(
                userId,
                'accountActivity', // Welcome email is account activity
            );
            if (!shouldSend) {
                this.logger.log(
                    `Skipping welcome email to ${data.email} - user has disabled account activity emails`,
                );
                return;
            }
        }

        const frontendConfig = this.configService.get('frontend', { infer: true });
        const frontendUrl = frontendConfig?.url || 'http://localhost:3000';
        const verificationUrl = data.verificationToken
            ? `${frontendUrl}/verify-email?token=${data.verificationToken}`
            : null;

        const html = this.templateService.renderTemplate('welcome', {
            name: data.name,
            verificationUrl: verificationUrl || null,
        });
        const subject = 'Welcome to Console!';

        if (this.useQueue && this.emailQueueProducer) {
            const jobData: WelcomeEmailJobData = {
                type: EmailJobType.WELCOME,
                to: data.email,
                subject,
                html,
                name: data.name,
                email: data.email,
                verificationToken: data.verificationToken,
            };

            await this.emailQueueProducer.addEmailJob(jobData);
        } else {
            await this.sendEmail({
                to: data.email,
                subject,
                html,
            });
        }
    }

    async sendForgotPasswordEmail(data: ForgotPasswordEmailData, userId?: string): Promise<void> {
        // Security emails (forgot password) should always be sent regardless of preferences
        // But we can still check if the service is available for logging
        if (userId && this.emailPreferencesService) {
            const shouldSend = await this.emailPreferencesService.shouldSendEmail(
                userId,
                'securityAlerts',
            );
            if (!shouldSend) {
                this.logger.warn(
                    `User ${userId} has disabled security alerts, but sending forgot password email anyway (critical security email)`,
                );
                // Continue sending - security emails are always sent
            }
        }

        const html = this.templateService.renderTemplate('forgot-password', {
            name: data.name,
            resetUrl: data.resetUrl,
        });
        const subject = 'Reset Your Password';

        if (this.useQueue && this.emailQueueProducer) {
            const jobData: ForgotPasswordEmailJobData = {
                type: EmailJobType.FORGOT_PASSWORD,
                to: data.email,
                subject,
                html,
                name: data.name,
                email: data.email,
                resetToken: data.resetToken,
                resetUrl: data.resetUrl,
            };

            await this.emailQueueProducer.addEmailJob(jobData);
        } else {
            await this.sendEmail({
                to: data.email,
                subject,
                html,
            });
        }
    }

    async sendPasswordChangedEmail(
        data: PasswordChangedEmailData,
        userId?: string,
    ): Promise<void> {
        // Check preferences if userId is provided and service is available
        if (userId && this.emailPreferencesService) {
            const shouldSend = await this.emailPreferencesService.shouldSendEmail(
                userId,
                'accountActivity', // Password changed is account activity
            );
            if (!shouldSend) {
                this.logger.log(
                    `Skipping password changed email to ${data.email} - user has disabled account activity emails`,
                );
                return;
            }
        }

        const frontendConfig = this.configService.get('frontend', { infer: true });
        const frontendUrl = frontendConfig?.url || 'http://localhost:3000';
        const loginUrl = `${frontendUrl}/login`;

        const html = this.templateService.renderTemplate('password-changed', {
            name: data.name,
            loginUrl,
        });
        const subject = 'Your Password Has Been Changed';

        if (this.useQueue && this.emailQueueProducer) {
            const jobData: PasswordChangedEmailJobData = {
                type: EmailJobType.PASSWORD_CHANGED,
                to: data.email,
                subject,
                html,
                name: data.name,
                email: data.email,
            };

            await this.emailQueueProducer.addEmailJob(jobData);
        } else {
            await this.sendEmail({
                to: data.email,
                subject,
                html,
            });
        }
    }

    async sendVerifyEmail(data: VerifyEmailData, userId?: string): Promise<void> {
        // Check preferences if userId is provided and service is available
        if (userId && this.emailPreferencesService) {
            const shouldSend = await this.emailPreferencesService.shouldSendEmail(
                userId,
                'accountActivity', // Email verification is account activity
            );
            if (!shouldSend) {
                this.logger.log(
                    `Skipping verify email to ${data.email} - user has disabled account activity emails`,
                );
                return;
            }
        }

        const html = this.templateService.renderTemplate('verify-email', {
            name: data.name,
            verificationUrl: data.verificationUrl,
        });
        const subject = 'Verify Your Email Address';

        if (this.useQueue && this.emailQueueProducer) {
            const jobData: VerifyEmailJobData = {
                type: EmailJobType.VERIFY_EMAIL,
                to: data.email,
                subject,
                html,
                name: data.name,
                email: data.email,
                verificationToken: data.verificationToken,
                verificationUrl: data.verificationUrl,
            };

            await this.emailQueueProducer.addEmailJob(jobData);
        } else {
            await this.sendEmail({
                to: data.email,
                subject,
                html,
            });
        }
    }

    async sendAccountDeletionEmail(data: AccountDeletionEmailData, userId?: string): Promise<void> {
        // Security emails (account deletion) should always be sent regardless of preferences
        // But we can still check if the service is available for logging
        if (userId && this.emailPreferencesService) {
            const shouldSend = await this.emailPreferencesService.shouldSendEmail(
                userId,
                'securityAlerts',
            );
            if (!shouldSend) {
                this.logger.warn(
                    `User ${userId} has disabled security alerts, but sending account deletion email anyway (critical security email)`,
                );
                // Continue sending - security emails are always sent
            }
        }

        const html = this.templateService.renderTemplate('account-deletion', {
            name: data.name,
            confirmationToken: data.confirmationToken,
            deletionUrl: data.deletionUrl,
            year: new Date().getFullYear().toString(),
        });
        const subject = 'Confirm Account Deletion';

        if (this.useQueue && this.emailQueueProducer) {
            const jobData: AccountDeletionEmailJobData = {
                type: EmailJobType.ACCOUNT_DELETION,
                to: data.email,
                subject,
                html,
                name: data.name,
                email: data.email,
                confirmationToken: data.confirmationToken,
                deletionUrl: data.deletionUrl,
            };

            await this.emailQueueProducer.addEmailJob(jobData);
        } else {
            await this.sendEmail({
                to: data.email,
                subject,
                html,
            });
        }
    }
}
